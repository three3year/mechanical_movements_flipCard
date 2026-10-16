// 截圖服務的開關(主 session 用;子代理不要執行)。服務同時提供專案的靜態檔,只開一個 headless Chrome,
// 所有截圖經 tools/shot.mjs 送給它排隊。
// 用法:node tools/shot-service.mjs start [--cpu]   啟動(先清掉上一次沒關乾淨的服務與 Chrome),就緒後印出繪圖方式;
//                                                   --cpu 不試顯示卡,直接用 CPU 模擬
//       node tools/shot-service.mjs stop            關閉(關 Chrome、刪暫存設定檔);服務沒在跑時不算錯誤
//   連接埠用環境變數 SHOT_PORT(預設 8618);記錄行程編號的檔案與服務的日誌在系統暫存資料夾的 flipcard-shot-<埠>.*。
import { spawn, execFileSync } from "node:child_process";
import { openSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { startService, DEFAULT_PORT } from "./shot/service.js";
import { launchChrome, killTree, removeProfile } from "./shot/chrome.js";

const port = Number(process.env.SHOT_PORT) || DEFAULT_PORT;
const STATE = join(tmpdir(), `flipcard-shot-${port}.json`);
const LOG = join(tmpdir(), `flipcard-shot-${port}.log`);
const [command, ...rest] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const readState = () => {
  try {
    return JSON.parse(readFileSync(STATE, "utf8"));
  } catch {
    return null;
  }
};
const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === "EPERM";
  }
};
// 行程編號可能已被別的程式重用:只殺名稱對得上的
const imageName = (pid) => {
  try {
    if (process.platform === "win32") return execFileSync("tasklist", ["/FI", `PID eq ${pid}`, "/FO", "CSV", "/NH"], { encoding: "utf8" }).split(",")[0].replace(/"/g, "");
    return execFileSync("ps", ["-p", String(pid), "-o", "comm="], { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
};
const killIf = (pid, pattern) => {
  if (pid && alive(pid) && pattern.test(imageName(pid))) killTree(pid);
};

// 清掉記錄裡的服務、Chrome 與暫存設定檔
function cleanup(state) {
  if (!state) return;
  killIf(state.servicePid, /node/i);
  killIf(state.chrome?.pid, /chrome|msedge|chromium/i);
  removeProfile(state.chrome?.profile);
  rmSync(STATE, { force: true });
}

async function requestStop() {
  try {
    await fetch(`http://127.0.0.1:${port}/__shot/stop`, { method: "POST", signal: AbortSignal.timeout(3000) });
    return true;
  } catch {
    return false;
  }
}

async function stop() {
  const state = readState();
  const asked = await requestStop();
  if (!asked && !state) return console.log("截圖服務沒在跑。");
  const deadline = Date.now() + 15_000;
  while (state?.servicePid && alive(state.servicePid) && Date.now() < deadline) await sleep(100);
  cleanup(readState() ?? state);
  rmSync(LOG, { force: true });
  console.log("截圖服務已關閉。");
}

async function start() {
  const leftover = readState();
  if (leftover) {
    await requestStop();
    await sleep(1000);
    cleanup(readState() ?? leftover);
    console.log("清掉了上一次沒關乾淨的截圖服務。");
  }
  const log = openSync(LOG, "w");
  const child = spawn(process.execPath, [fileURLToPath(import.meta.url), "serve", ...rest], {
    detached: true, windowsHide: true, stdio: ["ignore", log, log, "ipc"],
  });
  const result = await new Promise((resolve) => {
    const timer = setTimeout(() => resolve({ error: "90 秒內沒有就緒" }), 90_000);
    child.once("message", (msg) => (clearTimeout(timer), resolve(msg)));
    child.once("exit", (code) => (clearTimeout(timer), resolve({ error: `服務啟動時結束了(結束碼 ${code})` })));
  });
  if (result.error) {
    cleanup(readState());
    killIf(child.pid, /node/i);
    console.error(`截圖服務啟動失敗:${result.error}(日誌:${LOG})`);
    process.exit(1);
  }
  child.disconnect();
  child.unref();
  const how = result.mode === "gpu" ? `GPU(${result.gpuName})` : "CPU 模擬(拿不到 GPU,每張較慢)";
  console.log(`截圖服務就緒:${how};靜態檔 http://127.0.0.1:${port}/`);
  process.exit(0);
}

// 服務本身(由 start 在背景啟動)
async function serve() {
  const state = { servicePid: process.pid, port };
  const save = () => writeFileSync(STATE, JSON.stringify(state));
  save();
  let chrome;
  let chromeReady; // 先聽連接埠(被佔用就早點失敗),Chrome 開好之前來的頁等它
  const launched = new Promise((r) => (chromeReady = r));
  let stopping = false;
  const shutdown = async (code) => {
    if (stopping) return;
    stopping = true;
    await chrome?.close().catch(() => {});
    // Chrome 還沒開好就失敗:清掉開到一半的那一個
    if (!chrome && state.chrome) {
      killTree(state.chrome.pid);
      removeProfile(state.chrome.profile);
    }
    await service?.close().catch(() => {});
    rmSync(STATE, { force: true });
    process.exit(code);
  };
  let service;
  try {
    service = await startService({ port, renderer: { open: async (o) => (await launched).renderer.open(o) }, onStop: () => shutdown(0) });
    chrome = await launchChrome({ cpu: rest.includes("--cpu"), onSpawn: (c) => ((state.chrome = c), save()) });
    chromeReady(chrome);
  } catch (e) {
    console.error(e.stack ?? e);
    process.send?.({ error: e.code === "EADDRINUSE" ? `連接埠 ${port} 已被別的程式佔用(可用 SHOT_PORT 換一個)` : e.message });
    return shutdown(1);
  }
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(signal, () => shutdown(0));
  console.log(`就緒:${chrome.mode} ${chrome.gpuName ?? ""}`);
  process.send?.({ mode: chrome.mode, gpuName: chrome.gpuName });
}

if (command === "start") await start();
else if (command === "stop") await stop();
else if (command === "serve") await serve();
else {
  console.error("用法:node tools/shot-service.mjs start [--cpu] | stop");
  process.exit(1);
}
