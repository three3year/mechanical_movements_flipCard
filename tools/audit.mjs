// 維護用:對照原文時的輔助——印出條目的原文,以及模型中每個會動零件的動作摘要
// (相對主動件的轉向與轉速比、移動的方向與範圍),逐條核對轉向、比例、誰帶動誰。
// 用法:node tools/audit.mjs 圖號或範圍(7 或 24-36)… [--notext]
import { readFileSync } from "node:fs";
import { loadModel } from "../models/registry.js";
import { PATH_KINDS } from "../models/kinds.js";
import { sampleValues, statesOf } from "../verify/sampling.js";

const args = process.argv.slice(2);
const figures = args.flatMap((a) => {
  if (/^\d+$/.test(a)) return [Number(a)];
  const r = /^(\d+)-(\d+)$/.exec(a);
  return r ? Array.from({ length: r[2] - r[1] + 1 }, (_, i) => Number(r[1]) + i) : [];
});
const data = readFileSync(new URL("../data.js", import.meta.url), "utf8");
const chapters = JSON.parse(data.slice(data.indexOf("["), data.lastIndexOf("]") + 1));
const entryOf = (figure) => chapters.flatMap((c) => c.entries).find((e) => e.images.includes(`images/${figure}.png`));
const f = (x) => (Math.abs(x) < 5e-3 ? "0" : x.toFixed(2));
let lastEntry = null;

for (const figure of figures) {
  const def = await loadModel(figure);
  const entry = entryOf(figure);
  if (!args.includes("--notext") && entry && entry !== lastEntry) console.log(`\n【${entry.no}】${entry.text.join(" ")}`);
  lastEntry = entry;
  const d = def.driver;
  console.log(`圖 ${figure} 主動件:${d.type === "virtual" ? `虛擬「${d.label}」${d.mode}` : `${d.part}(${d.type}${d.cycle ? " 往復" : ""})`}${d.range ? ` 範圍 ${d.range.map(f)}` : ""}${d.speed ? ` 速度 ${d.speed}` : ""};目標件:${def.targets ?? def.target ?? "—"}`);
  for (const state of statesOf(def)) {
    const values = sampleValues(d, 60);
    const eps = Math.abs(values[1] - values[0]) / 50;
    const rows = [];
    for (const part of def.parts) {
      if (PATH_KINDS.has(part.kind)) continue;
      const rates = [];
      let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity], hidden = 0;
      for (const v of values) {
        const a = def.pose(v, state).parts[part.id] ?? {};
        const b = def.pose(v + eps, state).parts[part.id] ?? {};
        if (a.visible === false) hidden++;
        if (a.angle != null && b.angle != null) rates.push((b.angle - a.angle) / eps);
        const p = a.position ?? a.from;
        if (p) for (let k = 0; k < 3; k++) (min[k] = Math.min(min[k], p[k])), (max[k] = Math.max(max[k], p[k]));
      }
      const spans = min.map((m, k) => (Number.isFinite(m) ? max[k] - m : 0));
      const turning = rates.some((r) => Math.abs(r) > 1e-6);
      const moving = spans.some((s) => s > 1e-6);
      if (!turning && !moving) continue;
      let text = part.id + (part.label ? `(${part.label})` : "");
      if (turning) {
        const lo = Math.min(...rates), hi = Math.max(...rates);
        const still = rates.filter((r) => Math.abs(r) < 1e-6).length;
        text += Math.abs(hi - lo) < 1e-3 ? ` 轉×${f(lo)}` : ` 轉×${f(lo)}…${f(hi)}${still ? `(停 ${Math.round((still / rates.length) * 100)}%)` : ""}`;
      }
      if (moving) text += ` 移[${spans.map(f)}]`;
      if (hidden) text += ` 隱藏${Math.round((hidden / values.length) * 100)}%`;
      rows.push(text);
    }
    console.log(`  ${state != null ? `〔${state}〕` : ""}${rows.join(";") || "(沒有零件在動)"}`);
  }
}
