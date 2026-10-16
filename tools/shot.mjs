// 截圖:把頁面送給截圖服務排隊截圖(服務由主 session 用 tools/shot-service.mjs 開關;子代理不要自己開 Chrome)。
// 用法:node tools/shot.mjs 頁面 輸出.png [頁面 輸出.png …] [--width=1800]
//   一次最多 6 頁。頁面是專案內的相對路徑(tools/model-strip.html?fig=63&vs=0,1,2,3)。
//   服務一次只畫一頁、在各個呼叫之間輪流;等待時每隔幾秒印排隊狀態。
//   等這次的頁面全部畫完才結束,一行印一個寫出的檔案與寬高,失敗的頁印原因;有頁面失敗時以非零結束。
//   接近 10 分鐘(SHOT_TIMEOUT 秒,預設 570)還沒完成就報錯結束。連接埠用環境變數 SHOT_PORT(預設 8618)。
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { DEFAULT_PORT, MAX_PAGES, tooMany } from "./shot/service.js";

const port = Number(process.env.SHOT_PORT) || DEFAULT_PORT;
const args = process.argv.slice(2);
const flags = Object.fromEntries(args.filter((a) => a.startsWith("--")).map((a) => [a.slice(2).split("=")[0], a.split("=").slice(1).join("=")]));
const positional = args.filter((a) => !a.startsWith("--"));

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

if (!positional.length) fail("用法:node tools/shot.mjs 頁面 輸出.png [頁面 輸出.png …] [--width=1800]");
if (positional.length % 2) fail(`每個頁面後面要給輸出路徑(.png):「${positional.at(-1)}」後面沒有輸出路徑`);
const pages = [];
for (let i = 0; i < positional.length; i += 2) {
  const [url, out] = positional.slice(i, i + 2);
  if (!/\.png$/i.test(out)) fail(`輸出路徑要以 .png 結尾:「${out}」(每個頁面後面接它的輸出路徑)`);
  pages.push({ url, out, ...(flags.width ? { width: Number(flags.width) } : {}) });
}

if (pages.length > MAX_PAGES) fail(tooMany(pages.length));

const timeout = Number(process.env.SHOT_TIMEOUT) || 570;
setTimeout(() => fail(`等了 ${timeout} 秒還沒完成,先結束(已寫出的檔案留著);截圖服務可能出了問題,請回報主 session。`), timeout * 1000);

const notRunning = "截圖服務沒在跑,請回報主 session 啟動(不要自己開 Chrome)。";
let res;
try {
  res = await fetch(`http://127.0.0.1:${port}/__shot/pages`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ pages: pages.map(({ out, ...p }) => p) }),
  });
} catch {
  fail(notRunning);
}
if (res.status === 404) fail(notRunning);
if (!res.ok) fail(await res.text());

let failed = 0;
const handle = (msg) => {
  if (msg.type === "status") return console.log(`排隊中:前面還有 ${msg.ahead} 頁、這次還剩 ${msg.remaining} 頁,預估 ${msg.eta} 秒`);
  if (msg.type !== "page") return;
  const { url, out } = pages[msg.index];
  if (!msg.ok) {
    failed++;
    return console.log(`失敗:${url} → ${msg.reason}`);
  }
  msg.files.forEach((f, i) => {
    const path = msg.files.length === 1 ? out : out.replace(/\.png$/i, `-${i + 1}.png`);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, Buffer.from(f.data, "base64"));
    console.log(`${path}  ${f.width}×${f.height}`);
  });
};

let buffer = "";
const decoder = new TextDecoder();
for await (const chunk of res.body) {
  buffer += decoder.decode(chunk, { stream: true });
  let nl;
  while ((nl = buffer.indexOf("\n")) >= 0) {
    handle(JSON.parse(buffer.slice(0, nl)));
    buffer = buffer.slice(nl + 1);
  }
}
process.exit(failed ? 1 : 0);
