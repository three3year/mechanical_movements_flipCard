// 截圖服務的本體:專案的靜態檔 + 排隊器 + 畫一頁,共用一個連接埠。
// 「畫一頁」的元件(renderer)由呼叫的人給:真的用 chrome.js,測試用 fake.js。renderer.open({ url, width, height })
// 開一個分頁並回傳 page:title()、message()(頁面上的錯誤訊息)、layout()({ height, boxes:小圖的 [上緣, 下緣] })、
// capture({ x, y, width, height })(PNG)、close()。
// client 送 POST /__shot/pages,服務以 NDJSON 一行一行回:{ type: "page", index, ok, files | reason }、最後 { type: "done" }。
import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_PORT = 8618;
export const DEFAULT_WIDTH = 1800;
const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".svg": "image/svg+xml", ".webp": "image/webp", ".ico": "image/x-icon", ".wasm": "application/wasm",
};

// options:port(0 = 任選)、renderer、root(靜態檔的根目錄,預設專案根目錄)、readyTimeout(毫秒,專案內的頁面等 ready 的上限)、
// onStop(收到 POST /__shot/stop 時呼叫)。回傳 { port, close }。
export async function startService({ port = DEFAULT_PORT, renderer, root = ROOT, readyTimeout = 90_000, onStop } = {}) {
  const waiting = [];
  let busy = false;

  async function pump() {
    if (busy) return;
    busy = true;
    while (waiting.length) {
      const { job, done } = waiting.shift();
      done(await draw(job));
    }
    busy = false;
  }

  async function draw(job) {
    let page;
    try {
      page = await renderer.open({ url: job.url, width: job.width, height: 2000 });
      const deadline = Date.now() + readyTimeout;
      for (;;) {
        const title = await page.title();
        if (title === "ready") break;
        if (title === "error") return { ok: false, reason: `頁面回報 error:${(await page.message()).trim() || "(頁面上沒有訊息)"}` };
        if (Date.now() > deadline) return { ok: false, reason: `等了 ${Math.round(readyTimeout / 1000)} 秒還沒變成 ready(目前的標題:「${title}」)` };
        await sleep(100);
      }
      const { height } = await page.layout();
      const data = await page.capture({ x: 0, y: 0, width: job.width, height });
      return { ok: true, files: [{ width: job.width, height, data: data.toString("base64") }] };
    } catch (e) {
      return { ok: false, reason: `載入失敗:${e.message}` };
    } finally {
      await page?.close().catch(() => {});
    }
  }

  function enqueue(job) {
    return new Promise((done) => {
      waiting.push({ job, done });
      pump();
    });
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
    res.writeHead(200, { "content-type": "application/x-ndjson; charset=utf-8" });
    const send = (obj) => res.write(JSON.stringify(obj) + "\n");
    await Promise.all(pages.map(async (p, index) => {
      const job = { url: absolute(p.url, base), width: p.width ?? DEFAULT_WIDTH };
      send({ type: "page", index, ...(await enqueue(job)) });
    }));
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
