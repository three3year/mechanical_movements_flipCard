// 維護用:掃全書的模型,找「同一個零件的各塊不相連」——懸空的塊、浮在托架前面的銷、沒落地的立柱
// (做法見 verify/one-piece.js)。只印報告,掃出的結果不影響 npm run verify 的成敗。
// 報出的一定不相連;每一項都要找出實物上的理由(刻意的分件)或修掉。範圍是零件局部座標(固定件是世界座標);
// 間隙印「離主體」,另有懸空的塊離得更近時(浮在懸空托架前的銷)再印「離最近的一塊」。
// 「落地」的意思印在報告最後(GROUNDED)。
// 用法:node tools/one-piece.mjs [圖號或範圍(7 或 186-250)…]
import { loadModel } from "../models/registry.js";
import { detachedPieces } from "../verify/one-piece.js";
import { figuresFrom } from "./figure-args.mjs";

const figures = figuresFrom(process.argv.slice(2));
const GROUNDED = "〔落地〕:固定件裡落到零件最低處的一群——多半是分開立著的軸承座、支柱,確認它真的站在地上或底座上。";

const fmt = (v) => (!Number.isFinite(v) ? "超過 100" : Math.abs(v) < 5e-4 ? "0" : v.toFixed(3));
const range = (b) => `x ${fmt(b.min[0])}..${fmt(b.max[0])}、y ${fmt(b.min[1])}..${fmt(b.max[1])}、z ${fmt(b.min[2])}..${fmt(b.max[2])}`;
let count = 0;
let groundedOnly = 0;
let anyGrounded = false;
for (const figure of figures) {
  const found = detachedPieces(await loadModel(figure));
  if (!found.length) continue;
  count++;
  if (found.every((f) => f.grounded)) groundedOnly++;
  if (found.some((f) => f.grounded)) anyGrounded = true;
  console.log(`圖 ${figure}:`);
  for (const f of found) {
    const blocks = f.blocks.map((b) => `${b.label}(${b.kind};${range(b)})`).join("、");
    const gap = f.gap < f.toMain - 5e-4 ? `離主體 ${fmt(f.toMain)}、離最近的一塊 ${fmt(f.gap)}` : `離主體 ${fmt(f.toMain)}`;
    console.log(`  ${f.part}${f.fixed ? "(固定件)" : ""}:${blocks} ${gap}${f.grounded ? "〔落地〕" : ""}`);
  }
}
console.log(`\n有不相連的塊:${count} 張(其中 ${groundedOnly} 張只有落地的固定件分件)`);
if (anyGrounded) console.log(GROUNDED);
