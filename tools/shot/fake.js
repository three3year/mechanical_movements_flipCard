// 截圖服務的測試用:假的「畫一頁」與執行命令列工具的小工具。不碰 Chrome。
import { execFile } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:net";
import { startService } from "./service.js";

const CLIENT = fileURLToPath(new URL("../shot.mjs", import.meta.url));
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 假的頁面:pages 以網址的路徑(外部網址用整個網址)查設定,沒列到的頁用預設。
//   height 內容高度、boxes 小圖的上下緣 [[上, 下], …]、delay 載入花的毫秒數(變慢)、
//   title 載入後的標題(預設 "ready";"error" 時 message 是頁面上的訊息;其他值就一直不變成 ready)、
//   fail 載入失敗的原因。
// 寫出的「圖片」是 JSON:網址、截的範圍、從開頁到截圖的毫秒數。log 依序記下開過的頁。
export function fakeRenderer(pages = {}) {
  const log = [];
  return {
    log,
    async open({ url, width }) {
      const u = new URL(url);
      const key = u.hostname === "127.0.0.1" ? u.pathname.slice(1) + u.search : url;
      const spec = { height: 500, boxes: [], title: "ready", ...(pages[key] ?? {}) };
      log.push(key);
      const opened = Date.now();
      await sleep(spec.delay ?? 0);
      if (spec.fail) throw new Error(spec.fail);
      return {
        title: async () => spec.title,
        message: async () => spec.message ?? "",
        layout: async () => ({ height: spec.height, boxes: spec.boxes }),
        capture: async (clip) => Buffer.from(JSON.stringify({ url: key, width, clip, elapsed: Date.now() - opened })),
        close: async () => {},
      };
    },
  };
}

export async function startFake(pages, options = {}) {
  const renderer = fakeRenderer(pages);
  const service = await startService({ port: 0, renderer, ...options });
  return { ...service, log: renderer.log };
}

export function runClient(args, { port, env = {} } = {}) {
  return new Promise((resolve) => {
    execFile(process.execPath, [CLIENT, ...args], { env: { ...process.env, SHOT_PORT: String(port), ...env } }, (error, stdout, stderr) => {
      resolve({ code: error ? (error.code ?? 1) : 0, stdout, stderr, finished: Date.now() });
    });
  });
}

export const outDir = () => mkdtempSync(join(tmpdir(), "shot-test-"));
export const readShot = (path) => JSON.parse(readFileSync(path, "utf8"));

export function freePort() {
  return new Promise((resolve) => {
    const s = createServer().listen(0, "127.0.0.1", () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
}
