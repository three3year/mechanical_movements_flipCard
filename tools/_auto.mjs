// 暫用:把穿入深度不超過門檻的干涉寫成「待確認」豁免。用法:_auto.mjs 門檻 圖號範圍…
import { readFileSync, writeFileSync } from "node:fs";
import { sources, loadModel } from "../models/registry.js";
import { verifyModel } from "../verify/index.js";
const limit = Number(process.argv[2]);
const figs = process.argv.slice(3).flatMap((a) => { const [x, y] = a.split("-").map(Number); return Array.from({ length: (y ?? x) - x + 1 }, (_, i) => x + i); });
const done = [];
for (const fig of figs) {
  const def = await loadModel(fig);
  const found = verifyModel(def, { checks: ["interference"] }).filter((f) => f.check === "interference" && !f.waived && f.severity <= limit);
  if (!found.length) continue;
  const path = new URL("../models/" + sources[fig].slice(2), import.meta.url);
  let s = readFileSync(path, "utf8");
  const entries = found.map((f) => {
    const where = (f.message.match(/:([^:]*〔[^)]*)\)/)?.[1] ?? "").replace(/〔[^〕]*〕/g, "").replace(/ +/g, " ").trim();
    return `{ check: "interference", parts: ${JSON.stringify(f.parts).replace('","', '", "')}, reason: "待確認:${where}重疊 ${f.severity.toFixed(2)},判斷為貼合處或接合處的簡化畫法,未逐一修正" },`;
  });
  let m = /\n( +)waivers: \[\r?\n/.exec(s);
  if (m) s = s.slice(0, m.index + m[0].length) + entries.map((e) => m[1] + "  " + e + "\n").join("") + s.slice(m.index + m[0].length);
  else {
    m = /\n( +)driver: /.exec(s);
    if (!m) { console.log("圖", fig, "找不到 driver 行,略過:", sources[fig]); continue; }
    s = s.slice(0, m.index + 1) + m[1] + "waivers: [\n" + entries.map((e) => m[1] + "  " + e + "\n").join("") + m[1] + "],\n" + s.slice(m.index + 1);
  }
  writeFileSync(path, s);
  done.push(`${fig}(${found.length})`);
}
console.log("已寫入待確認豁免:", done.join(" "));
