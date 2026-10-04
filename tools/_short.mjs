// 暫用:精簡的問題清單(每項一行)。用法:node tools/_short.mjs 圖號或範圍…
import { loadModel } from "../models/registry.js";
import { verifyModel, unwaived } from "../verify/index.js";
const figs = process.argv.slice(2).flatMap((a) => {
  const r = /^(\d+)-(\d+)$/.exec(a);
  return r ? Array.from({ length: r[2] - r[1] + 1 }, (_, i) => Number(r[1]) + i) : [Number(a)];
});
for (const fig of figs) {
  let findings;
  try {
    findings = unwaived(verifyModel(await loadModel(fig)));
  } catch (e) {
    console.log(fig, "ERROR", e.message);
    continue;
  }
  for (const x of findings) {
    const m = x.message.match(/:([^:]*)\)(〔.*)?$/);
    const w = m ? m[1].replace(/ 的/g, ":").replace(/〔([^〕]*)〕,?/g, (s, c) => (s.startsWith("〔") && /沿$/.test("") ? s : `@${c.replace(/ /g, "")} `)).replace(/分開/, "") : "";
    console.log(`${fig} ${x.check === "interference" ? "I" : x.check === "unsupported" ? "U" : x.check} ${x.parts.join("×")} ${x.severity?.toFixed(2)} n${x.count}${x.state ? " [" + x.state + "]" : ""} ${x.check === "interference" ? w : x.message.replace(/^\S+ 在動,卻/, "").replace(/\(.*$/, "")}`.slice(0, 230));
  }
}
