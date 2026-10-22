// 維護用:取景掃描。照檢視器的擺放規則量每張圖的外框(核心見 verify/framing.js),印出
//   均勻取樣(viewer/framing.js 的段數)比改版前的舊取樣大多少——變大的圖在舊取景下有零件中途出畫面;
//   段數再加倍時外框還會不會變大——預設段數要讓全書這一欄都不超過 1%。
// 只印報告,不影響 npm run verify 的成敗。需要開發用依賴(npm install)。
// 用法:node tools/framing.mjs [圖號或範圍(7 或 186-250)…] [--segments=N] [--jobs=N]
//   不帶圖號跑全書,只列均勻取樣變大超過 2% 或加倍變大超過 1% 的圖;帶圖號時每張都列。
import { fork } from "node:child_process";
import { cpus } from "node:os";
import { fileURLToPath } from "node:url";
import { loadModel } from "../models/registry.js";
import { scanFraming } from "../verify/framing.js";
import { FRAMING_SEGMENTS } from "../viewer/framing.js";
import { figuresFrom } from "./figure-args.mjs";

const args = process.argv.slice(2);
const flag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const segments = Number(flag("segments") ?? FRAMING_SEGMENTS);
const OVER = 0.02; // 均勻取樣比舊取樣大過這個比例的圖要截圖確認
const DENSE = 0.01; // 段數加倍時外框不該再大過這個比例(預設段數的條件)

async function scan(figure) {
  try {
    return scanFraming(await loadModel(figure), segments);
  } catch (e) {
    return { error: e.message };
  }
}

if (process.send) {
  process.on("message", async (figure) => process.send({ figure, result: await scan(figure) }));
  process.send({ ready: true });
} else {
  const given = args.some((a) => !a.startsWith("--"));
  const figures = figuresFrom(args);
  const started = Date.now();
  const results = new Map();
  const jobs = Math.max(1, Math.min(Number(flag("jobs") ?? Math.max(1, cpus().length - 2)), Math.ceil(figures.length / 3)));
  if (jobs === 1) for (const figure of figures) results.set(figure, await scan(figure));
  else {
    const queue = [...figures];
    await Promise.all(
      Array.from({ length: jobs }, () =>
        new Promise((resolve, reject) => {
          const child = fork(fileURLToPath(import.meta.url), args);
          const next = () => (queue.length ? child.send(queue.shift()) : (child.kill(), resolve()));
          child.on("message", (m) => {
            if (!m.ready) results.set(m.figure, m.result);
            next();
          });
          child.on("error", reject);
          child.on("exit", resolve);
        }),
      ),
    );
  }

  const pct = (g) => `${(g.growth * 100).toFixed(1)}%`;
  const where = (g) => (g.part ? `(${g.part} 往 ${g.axis} 多 ${g.excess.toFixed(2)},主動量 ${Number(g.at.toFixed(3))})` : "");
  let over = 0;
  let worst = { growth: 0 };
  for (const figure of figures) {
    const r = results.get(figure) ?? { error: "子行程沒有回報" };
    if (r.error) {
      console.log(`圖 ${figure}:掃描中斷:${r.error}`);
      continue;
    }
    if (r.uniform.growth > OVER) over++;
    if (r.doubled.growth > worst.growth) worst = { ...r.doubled, figure };
    if (!given && r.uniform.growth <= OVER && r.doubled.growth <= DENSE) continue;
    console.log(`圖 ${figure}:均勻 ${segments} 段比舊取樣大 ${pct(r.uniform)}${where(r.uniform)};加倍到 ${segments * 2} 段再大 ${pct(r.doubled)}${where(r.doubled)};取樣涵蓋主動量 ${r.span.map((v) => Number(v.toFixed(3))).join("–")}`);
  }
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`\n取景掃描:${figures.length} 張,均勻 ${segments} 段比舊取樣大超過 ${OVER * 100}% 的 ${over} 張;段數加倍時最多再大 ${pct(worst)}${worst.figure ? `(圖 ${worst.figure}${where(worst)})` : ""}(${seconds} 秒)`);
}
