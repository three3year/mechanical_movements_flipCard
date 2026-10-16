// 截圖服務的「畫一頁」:一個 headless Chrome(找不到用 Edge),用自己的暫存設定檔,
// 經 Chrome DevTools Protocol(Node 內建的 WebSocket)控制。每頁開一個新分頁、截完就關。
import { spawn, execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function findBrowser() {
  if (process.env.SHOT_CHROME) return process.env.SHOT_CHROME;
  const { PROGRAMFILES = "C:\\Program Files", "PROGRAMFILES(X86)": x86 = "C:\\Program Files (x86)", LOCALAPPDATA = "" } = process.env;
  const candidates = {
    win32: [
      join(PROGRAMFILES, "Google/Chrome/Application/chrome.exe"),
      join(x86, "Google/Chrome/Application/chrome.exe"),
      join(LOCALAPPDATA, "Google/Chrome/Application/chrome.exe"),
      join(x86, "Microsoft/Edge/Application/msedge.exe"),
      join(PROGRAMFILES, "Microsoft/Edge/Application/msedge.exe"),
    ],
    darwin: ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"],
    linux: ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/microsoft-edge"],
  }[process.platform] ?? [];
  const found = candidates.find((p) => p && existsSync(p));
  if (!found) throw new Error(`找不到 Chrome 或 Edge(找過:${candidates.join("、")});可用環境變數 SHOT_CHROME 指定`);
  return found;
}

const COMMON = [
  "--headless=new", "--remote-debugging-port=0", "--no-first-run", "--no-default-browser-check", "--disable-extensions",
  "--disable-background-networking", "--disable-sync", "--disable-component-update", "--mute-audio", "--hide-scrollbars",
  "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows",
];
const GPU = ["--enable-gpu", "--use-angle=default", "--ignore-gpu-blocklist"];
const CPU = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"];

// 啟動一個 Chrome。cpu:true 直接用 CPU 模擬;否則先試顯示卡,WebGL 的繪圖器是 SwiftShader 或讀不到時重開成 CPU 模擬。
// 回傳 { renderer, mode: "gpu" | "cpu", gpuName, pid, profile, close }。
export async function launchChrome({ cpu = false, onSpawn } = {}) {
  if (!cpu) {
    const chrome = await startBrowser(GPU, onSpawn);
    const name = await chrome.webglRenderer();
    if (name && !/swiftshader/i.test(name)) return { ...chrome, mode: "gpu", gpuName: prettyGpu(name) };
    await chrome.close();
  }
  return { ...(await startBrowser(CPU, onSpawn)), mode: "cpu" };
}

// 「ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 (0x00001F82) Direct3D11 vs_5_0 ps_5_0, D3D11)」→「NVIDIA GeForce GTX 1650, Direct3D11」
const prettyGpu = (name) => {
  const m = name.match(/^ANGLE \([^,]*,\s*(.*?)\s*(?:\(0x[0-9a-f]+\))?\s*(Direct3D\w*|OpenGL[^,]*|Vulkan[^,]*|Metal[^,]*)?(?:\s+vs_\S+\s+ps_\S+)?,[^,]*\)$/i);
  return m ? [m[1], m[2]].filter(Boolean).join(", ") : name;
};

async function startBrowser(flags, onSpawn) {
  const exe = findBrowser();
  const profile = mkdtempSync(join(tmpdir(), "flipcard-shot-chrome-"));
  const proc = spawn(exe, [...COMMON, ...flags, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore", windowsHide: true });
  let exited = false;
  proc.on("exit", () => (exited = true));
  onSpawn?.({ pid: proc.pid, profile });
  // Chrome 開好除錯連接埠後把埠號與路徑寫進設定檔裡的 DevToolsActivePort(寫的當下可能被鎖住,讀不到就再等)
  const portFile = join(profile, "DevToolsActivePort");
  const deadline = Date.now() + 30_000;
  let lines = [];
  while (lines.length < 2) {
    if (exited) throw new Error(`${exe} 啟動後就結束了`);
    if (Date.now() > deadline) {
      killTree(proc.pid);
      throw new Error(`${exe} 30 秒內沒有開好除錯連接埠`);
    }
    await sleep(50);
    try {
      lines = readFileSync(portFile, "utf8").trim().split("\n").map((s) => s.trim()).filter(Boolean);
    } catch {}
  }
  const cdp = await connect(`ws://127.0.0.1:${lines[0]}${lines[1]}`);

  async function open({ url, width, height }) {
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
    const close = () => cdp.send("Target.closeTarget", { targetId });
    let sessionId;
    const send = (method, params) => cdp.send(method, params, sessionId);
    const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.value;
    try {
      ({ sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true }));
      await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
      await send("Emulation.setFocusEmulationEnabled", { enabled: true }).catch(() => {});
      const nav = await send("Page.navigate", { url });
      if (nav.errorText) throw new Error(`${nav.errorText}(${url})`);
    } catch (e) {
      await close().catch(() => {});
      throw e;
    }
    return {
      evaluate,
      title: () => evaluate("document.title").catch(() => ""),
      message: () => evaluate(`(document.getElementById("msg")?.textContent || document.body?.innerText || "").slice(0, 2000)`),
      layout: () => evaluate(LAYOUT),
      capture: async (clip) => {
        // 視窗先撐到截圖範圍的底,再截那一段
        await send("Emulation.setDeviceMetricsOverride", { width, height: Math.max(height, Math.ceil(clip.y + clip.height)), deviceScaleFactor: 1, mobile: false });
        const { data } = await send("Page.captureScreenshot", { format: "png", clip: { ...clip, scale: 1 }, captureBeyondViewport: true });
        return Buffer.from(data, "base64");
      },
      close,
    };
  }

  async function webglRenderer() {
    const page = await open({ url: "about:blank", width: 100, height: 100 });
    try {
      return await page.evaluate(`(() => {
        const gl = document.createElement("canvas").getContext("webgl");
        const info = gl?.getExtension("WEBGL_debug_renderer_info");
        return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : null;
      })()`);
    } finally {
      await page.close().catch(() => {});
    }
  }

  async function close() {
    await cdp.send("Browser.close").catch(() => {});
    cdp.close();
    const deadline = Date.now() + 5000;
    while (!exited && Date.now() < deadline) await sleep(50);
    if (!exited) killTree(proc.pid);
    removeProfile(profile);
  }

  return { renderer: { open }, webglRenderer, pid: proc.pid, profile, close };
}

// 內容的實際高度,與畫面寬度內所有 img、canvas 的上下緣(切圖時切線不能跨過它們)
const LAYOUT = `(() => {
  const W = innerWidth;
  const boxes = [...document.querySelectorAll("img, canvas")]
    .map((e) => e.getBoundingClientRect())
    .filter((r) => r.width > 0 && r.height > 0 && r.right > 0 && r.left < W)
    .map((r) => [r.top + scrollY, r.bottom + scrollY]);
  const html = document.documentElement.getBoundingClientRect().height;
  const bottom = Math.max(0, ...boxes.map((b) => b[1]));
  return { height: Math.ceil(Math.max(1, html, bottom)), boxes };
})()`;

export function killTree(pid) {
  try {
    if (process.platform === "win32") execFileSync("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore" });
    else process.kill(pid, "SIGKILL");
  } catch {}
}

export function removeProfile(profile) {
  if (profile) rmSync(profile, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 });
}

async function connect(url) {
  const ws = new WebSocket(url);
  await new Promise((ok, fail) => {
    ws.addEventListener("open", ok, { once: true });
    ws.addEventListener("error", () => fail(new Error(`連不上 Chrome 的除錯連接埠(${url})`)), { once: true });
  });
  // 每個指令最多等 60 秒:頁面卡住(導覽不回、腳本不停)時只讓那一頁失敗,不擋住後面排隊的頁
  const COMMAND_TIMEOUT = 60_000;
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    const p = msg.id != null && pending.get(msg.id);
    if (!p) return;
    clearTimeout(p.timer);
    pending.delete(msg.id);
    if (msg.error) p.fail(new Error(`${p.method}:${msg.error.message}`));
    else p.ok(msg.result);
  });
  ws.addEventListener("close", () => {
    for (const p of pending.values()) {
      clearTimeout(p.timer);
      p.fail(new Error("Chrome 的連線斷了"));
    }
    pending.clear();
  });
  return {
    send(method, params = {}, sessionId) {
      if (ws.readyState !== WebSocket.OPEN) return Promise.reject(new Error("Chrome 的連線斷了"));
      return new Promise((ok, fail) => {
        const key = ++id;
        const timer = setTimeout(() => {
          pending.delete(key);
          fail(new Error(`${method} 等了 ${COMMAND_TIMEOUT / 1000} 秒沒有回應`));
        }, COMMAND_TIMEOUT);
        pending.set(key, { ok, fail, method, timer });
        ws.send(JSON.stringify({ id: key, method, params, ...(sessionId ? { sessionId } : {}) }));
      });
    },
    close: () => ws.close(),
  };
}
