// 維護用:列出每個模型的主動件、目標件與零件(id:kind[標籤]),供逐張核對目標件標得對不對。
// 目標件前面標 *;不能當目標件的零件標 ~:路徑零件(皮帶、繩…)、流體、只有標籤的空群組、
// 主動件與它的抓取處(繪圖層替這些上的是別的顏色,目標色出不來)。
// 用法:node tools/list-targets.mjs [起始圖號] [結束圖號] [--problems 只列有問題的]
import { sources, loadModel } from "../models/registry.js";
import { targetsOf, canBeTarget } from "../models/kinds.js";

const args = process.argv.slice(2);
const onlyProblems = args.includes("--problems");
const [from = 1, to = 9999] = args.filter((a) => !a.startsWith("--")).map(Number);
const figures = Object.keys(sources).map(Number).filter((n) => n >= from && n <= to).sort((a, b) => a - b);
let problems = 0;
for (const figure of figures) {
  const def = await loadModel(figure);
  const targets = targetsOf(def);
  const bad = targets.filter((id) => !canBeTarget(def, id));
  const problem = targets.length === 0 ? "沒有目標件" : bad.length ? `目標件上不了色:${bad.join(",")}` : targets.length > 3 ? "目標件超過 3 個" : "";
  if (problem) problems++;
  if (onlyProblems && !problem) continue;
  const parts = def.parts.map((p) => `${targets.includes(p.id) ? "*" : canBeTarget(def, p.id) ? "" : "~"}${p.id}:${p.kind}${p.label ? `[${p.label}]` : ""}`);
  console.log(`圖 ${figure}  主動件=${def.driver.part ?? `(${def.driver.label ?? def.driver.type})`}  目標件=${targets.join(",") || "無"}${problem ? `  ← ${problem}` : ""}\n    ${parts.join(" ")}`);
}
console.log(`\n有問題的模型:${problems} 張`);
