// 截圖服務的本體:專案的靜態檔 + 排隊器 + 畫一頁,共用一個連接埠。
// 「畫一頁」的元件(renderer)由呼叫的人給:真的用 chrome.js,測試用 fake.js。renderer.open({ url, width, height })
// 開一個分頁並回傳 page:title()、message()(頁面上的錯誤訊息)、layout()({ height, boxes:小圖的 [上緣, 下緣] })、
// capture({ x, y, width, height })(PNG)、close()。
// client 送 POST /__shot/pages,服務以 NDJSON 一行一行回:{ type: "page", index, ok, files | reason }、
// 等待中每隔一段時間 { type: "status", ahead, remaining, eta }、最後 { type: "done" }。
import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { Queue } from "./queue.js";
import { planCuts, LONG_SIDE } from "./cuts.js";

export const DEFAULT_PORT = 8618;
export const DEFAULT_WIDTH = 1800;
export const MAX_PAGES = 6;
export const MAX_WIDTH = 16384; // 再寬的部分顯示卡畫不出來(單張貼圖的上限)
export const DEFAULT_WAIT = 5; // 外部網址載入後等幾秒再截
export const tooMany = (n) => `一次最多送 ${MAX_PAGES} 頁(這次 ${n} 頁),請分批送`;
// 寬度不對時的說明;對就回傳 undefined
export const badWidth = (w) => (Number.isInteger(w) && w >= 1 && w <= MAX_WIDTH ? undefined : `寬度要是 1–${MAX_WIDTH} 的整數(收到 ${w})`);
const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".svg": "image/svg+xml", ".webp": "image/webp", ".ico": "image/x-icon", ".wasm": "application/wasm",
};

// options:port(0 = 任選)、renderer、root(靜態檔的根目錄,預設專案根目錄)、readyTimeout(毫秒,專案內的頁面等 ready 的上限)、
// statusInterval(毫秒,每隔多久回報一次排隊狀態)、onStop(收到 POST /__shot/stop 時呼叫)。回傳 { port, close }。
export async function startService({ port = DEFAULT_PORT, renderer, root = ROOT, readyTimeout = 90_000, statusInterval = 5000, onStop } = {}) {
  const queue = new Queue();
  let drawing = null; // 正在畫的頁屬於哪個呼叫
  let secondsPerPage = 1.5; // 每頁花的秒數(移動平均),只用來估等待時間

  async function pump() {
    if (drawing) return;
    let next;
    while ((next = queue.take())) {
      drawing = next.call;
      const started = Date.now();
      const result = await draw(next.page);
      secondsPerPage = 0.7 * secondsPerPage + 0.3 * ((Date.now() - started) / 1000);
      drawing = null;
      next.page.done(result);
    }
  }

  async function draw(job) {
    let page;
    try {
      page = await renderer.open({ url: job.url, width: job.width, height: LONG_SIDE });
      const deadline = Date.now() + readyTimeout;
      // 外部網址不會把標題改成 ready:等指定的秒數
      if (job.external) await sleep(job.wait * 1000);
      else for (;;) {
        const title = await page.title();
        if (title === "ready") break;
        if (title === "error") return { ok: false, reason: `頁面回報 error:${(await page.message()).trim() || "(頁面上沒有訊息)"}` };
        if (Date.now() > deadline) return { ok: false, reason: `等了 ${Math.round(readyTimeout / 1000)} 秒還沒變成 ready(目前的標題:「${title}」)` };
        await sleep(100);
      }
      const { height, boxes } = await page.layout();
      const files = [];
      for (const { top, bottom, oversize } of planCuts(height, boxes)) {
        const data = await page.capture({ x: 0, y: top, width: job.width, height: bottom - top });
        files.push({ width: job.width, height: bottom - top, shrunk: oversize || job.width > LONG_SIDE, data: data.toString("base64") });
      }
      return { ok: true, files };
    } catch (e) {
      return { ok: false, reason: `載入失敗:${e.message}` };
    } finally {
      await page?.close().catch(() => {});
    }
  }

  async function handlePages(req, res, base) {
    let body;
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      return reply(res, 400, "要求的格式不對(要 JSON)");
    }
    const pages = Array.isArray(body.pages) ? body.pages : [];
    if (!pages.length) return reply(res, 400, "沒有給頁面");
    if (pages.length > MAX_PAGES) return reply(res, 400, tooMany(pages.length));
    const widthError = pages.map((p) => badWidth(p.width ?? DEFAULT_WIDTH)).find(Boolean);
    if (widthError) return reply(res, 400, widthError);
    res.writeHead(200, { "content-type": "application/x-ndjson; charset=utf-8" });
    const send = (obj) => !res.destroyed && res.write(JSON.stringify(obj) + "\n");
    const call = { pages: [] };
    let left = pages.length;
    let gone;
    const finished = new Promise((resolve) => {
      gone = resolve;
      pages.forEach((p, index) => call.pages.push({
        url: absolute(p.url, base),
        external: isExternal(p.url),
        wait: p.wait ?? DEFAULT_WAIT,
        width: p.width ?? DEFAULT_WIDTH,
        done: (result) => {
          send({ type: "page", index, ...result });
          if (--left === 0) resolve();
        },
      }));
    });
    const status = setInterval(() => {
      const ahead = queue.ahead(call) + (drawing && drawing !== call ? 1 : 0);
      const remaining = left;
      send({ type: "status", ahead, remaining, eta: Math.ceil((ahead + remaining) * secondsPerPage) });
    }, statusInterval);
    // client 先走了(逾時或被中斷):還沒畫的頁不畫
    res.on("close", () => {
      clearInterval(status);
      queue.remove(call);
      gone();
    });
    queue.add(call);
    pump();
    await finished;
    clearInterval(status);
    send({ type: "done" });
    res.end();
  }

  const server = createServer(async (req, res) => {
    const base = `http://127.0.0.1:${server.address().port}`;
    const path = decodeURIComponent(new URL(req.url, base).pathname);
    try {
      if (req.method === "POST" && path === "/__shot/pages") return await handlePages(req, res, base);
      if (req.method === "POST" && path === "/__shot/stop") {
        reply(res, 200, "關閉中");
        return onStop?.();
      }
      if (req.method === "GET" && path === "/__shot/ping") return reply(res, 200, "截圖服務");
      if (req.method === "GET" || req.method === "HEAD") return serveStatic(root, path, req, res);
      reply(res, 405, "不支援的方法");
    } catch (e) {
      if (!res.headersSent) reply(res, 500, String(e.stack ?? e));
      else res.end();
    }
  });
  await new Promise((ok, fail) => server.once("error", fail).listen(port, "127.0.0.1", ok));
  return {
    port: server.address().port,
    close: () => new Promise((r) => { server.closeAllConnections(); server.close(() => r()); }),
  };
}

// 專案內的頁面給相對路徑(tools/model-strip.html?fig=63),也接受開頭的 /;http(s):// 開頭的是外部網址
export const isExternal = (url) => /^https?:\/\//i.test(url);
const absolute = (url, base) => (isExternal(url) ? url : `${base}/${url.replace(/^\/+/, "")}`);

function serveStatic(root, path, req, res) {
  const file = resolve(join(root, path));
  if (file !== resolve(root) && !file.startsWith(resolve(root) + sep)) return reply(res, 404, "找不到");
  let target = file;
  try {
    if (statSync(target).isDirectory()) target = join(target, "index.html");
    statSync(target);
  } catch {
    return reply(res, 404, "找不到");
  }
  res.writeHead(200, { "content-type": MIME[extname(target).toLowerCase()] ?? "application/octet-stream", "cache-control": "no-store" });
  if (req.method === "HEAD") return res.end();
  createReadStream(target).pipe(res);
}

function reply(res, status, text) {
  res.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
  res.end(text);
}

function readBody(req) {
  return new Promise((ok, fail) => {
    let s = "";
    req.setEncoding("utf8");
    req.on("data", (c) => (s += c)).on("end", () => ok(s)).on("error", fail);
  });
}
