// 維護用:掃全書的板件,找「洞的頂點落在外形外」與「外輪廓自交」的輪廓(做法見 verify/outlines.js)。
// 這兩種畫法交給三角化時會悄悄變形:整個在外的洞被丟掉、零件變成實心;自交的輪廓多出一塊外形裡沒有的實體。
// 只印報告,掃出的結果不影響 npm run verify 的成敗。報出的每一項都要修掉或找出理由(一半在外的銷孔要看端頭有沒有畫出來)。
// 用法:node tools/outlines.mjs [圖號或範圍(7 或 186-250)…]
import { loadModel } from "../models/registry.js";
import { outlineProblems } from "../verify/outlines.js";
import { figuresFrom } from "./figure-args.mjs";

const figures = figuresFrom(process.argv.slice(2));
const fmt = (v) => v.toFixed(3);
let count = 0;
const totals = { "hole-outside": 0, "self-crossing": 0, "area-mismatch": 0 };
for (const figure of figures) {
  const found = outlineProblems(await loadModel(figure));
  if (!found.length) continue;
  count++;
  console.log(`圖 ${figure}:`);
  for (const f of found) {
    totals[f.problem]++;
    const areas = `三角化 ${fmt(f.area.triangulated)}、該有 ${fmt(f.area.expected)}`;
    if (f.problem === "hole-outside") {
      const holes = f.holes.map((h) => `[${h.index}]${h.outside === "all" ? "整個在外" : `部分在外(${h.count}/${h.of} 點)`}`).join("、");
      console.log(`  ${f.part}:洞 ${holes}(${areas})`);
    } else if (f.problem === "self-crossing") console.log(`  ${f.part}:外輪廓自交(${areas})`);
    else console.log(`  ${f.part}:三角化面積與外形不符(${areas})`);
  }
}
console.log(`\n外形有問題的板件:${count} 張(洞在外形外 ${totals["hole-outside"]} 件、外輪廓自交 ${totals["self-crossing"]} 件、面積不符 ${totals["area-mismatch"]} 件)`);
