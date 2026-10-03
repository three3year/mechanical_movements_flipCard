// 暫用:把還沒處理的問題寫成「待確認」豁免。用法:_auto.mjs 門檻 圖號範圍…
import { readFileSync, writeFileSync } from "node:fs";
import { sources, loadModel } from "../models/registry.js";
import { verifyModel } from "../verify/index.js";
const limit = Number(process.argv[2]);
const figs = process.argv.slice(3).flatMap((a) => { const [x, y] = a.split("-").map(Number); return Array.from({ length: (y ?? x) - x + 1 }, (_, i) => x + i); });
const done = [];
for (const fig of figs) {
  const def = await loadModel(fig);
  const found = verifyModel(def, { checks: ["interference", "unsupported"] }).filter((f) => !f.waived && f.check !== "stale-waiver" && f.severity <= limit);
  if (!found.length) continue;
  const path = new URL("../models/" + sources[fig].slice(2), import.meta.url);
  const entries = found.map((f) => {
    const big = f.severity > 0.1;
    if (f.check === "unsupported") {
      const text = big
        ? `待確認(未修):${f.parts[0]} 在動,但離帶動(或支撐)它的零件還有 ${f.severity >= 1 ? "1 以上" : f.severity.toFixed(2)} 的空隙,少了相連的軸、銷或連桿,尚未補上`
        : `待確認:${f.parts[0]} 與帶動(或支撐)它的零件之間差 ${Math.max(0, f.severity).toFixed(2)} 沒貼上,接觸位置是算出來的近似,未逐一修正`;
      return `{ check: "unsupported", parts: ${JSON.stringify(f.parts)}, reason: "${text}" },`;
    }
    const where = (f.message.match(/:([^:]*〔[^)]*)\)/)?.[1] ?? "").replace(/〔[^〕]*〕/g, "").replace(/ +/g, " ").trim();
    const text = big ? `待確認(未修):${where}互相穿入 ${f.severity.toFixed(2)}(${f.count} 個取樣姿勢),尚未修正` : `待確認:${where}重疊 ${f.severity.toFixed(2)},判斷為貼合處或接合處的簡化畫法,未逐一修正`;
    return `{ check: "interference", parts: ${JSON.stringify(f.parts).replace('","', '", "')}, reason: "${text}" },`;
  });
  const s = insert(readFileSync(path, "utf8"), entries);
  if (s == null) { console.log("圖", fig, "不知道怎麼插入豁免:", sources[fig]); continue; }
  writeFileSync(path, s);
  done.push(`${fig}(${found.length})`);
}
console.log("已寫入待確認豁免:", done.join(" "));

// 定義直接寫在 export default { … } 的:豁免插在 driver 那一行前面;由共用函式建出來的:
// 把 export default X; 改成 export default { ...X, waivers: [ … ] };
function insert(s, entries) {
  const direct = /\nexport default \{\r?\n/.test(s) && !/\nexport default \{\r?\n  \.\.\./.test(s);
  if (direct) {
    let m = /\n(  )waivers: \[\r?\n/.exec(s);
    if (m) return s.slice(0, m.index + m[0].length) + entries.map((e) => "    " + e + "\n").join("") + s.slice(m.index + m[0].length);
    m = /\n  driver: /.exec(s);
    if (!m) return null;
    return s.slice(0, m.index + 1) + "  waivers: [\n" + entries.map((e) => "    " + e + "\n").join("") + "  ],\n" + s.slice(m.index + 1);
  }
  let m = /\nexport default \{\r?\n  \.\.\.[^\n]*\n  waivers: \[\r?\n/.exec(s);
  if (m) return s.slice(0, m.index + m[0].length) + entries.map((e) => "    " + e + "\n").join("") + s.slice(m.index + m[0].length);
  m = /\nexport default ((?!\{)[\s\S]+?);\s*$/.exec(s);
  if (!m) return null;
  return s.slice(0, m.index) + "\nexport default {\n  ..." + m[1] + ",\n  waivers: [\n" + entries.map((e) => "    " + e + "\n").join("") + "  ],\n};\n";
}
