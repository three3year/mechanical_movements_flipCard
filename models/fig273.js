// 第 273 種:把直線運動轉換成直線運動。四根等長的桿組成菱形,四個頂點各接一根在導套中滑動的桿:
// 把桿 A、B 拉近,桿 C、D 就被推開;反之亦然。主動件是桿 A(桿 B 對稱地同時移動)。
import { clamp } from "./kit.js";

export const SIDE = 1.65;
export const RANGE = [0.55, 1.5]; // A、B 離中心的距離
const Z = 0.12;

/** A、B 離中心的距離 w → C、D 離中心的距離 */
export const spread = (w) => Math.sqrt(SIDE * SIDE - clamp(w, ...RANGE) ** 2);

const rod = (id, axis, label, labelOffset) => ({
  id,
  kind: "group",
  label,
  labelOffset,
  pieces: [
    { kind: "box", size: axis === "x" ? [1.0, 0.13, 0.13] : [0.13, 1.0, 0.13], at: axis === "x" ? [label === "A" ? -0.5 : 0.5, 0, 0] : [0, label === "C" ? 0.5 : -0.5, 0] },
    { kind: "cylinder", radius: 0.12, inner: 0.05, length: 0.24, at: [0, 0, Z] },
  ],
});
// 導套:固定的方框,桿在其中滑動
const guide = (x, y, horizontal) => ({ kind: "box", size: horizontal ? [0.3, 0.3, 0.3] : [0.3, 0.3, 0.3], at: [x, y, 0] });

export default {
  figure: 273,
  parts: [
    { id: "guides", kind: "group", pieces: [guide(-2.45, 0, true), guide(2.45, 0, true), guide(0, 2.45, false), guide(0, -2.45, false)] },
    rod("rodA", "x", "A", [-0.05, -0.35, 0.3]),
    rod("rodB", "x", "B", [0.05, -0.35, 0.3]),
    rod("rodC", "y", "C", [0.35, 0.05, 0.3]),
    rod("rodD", "y", "D", [0.35, -0.05, 0.3]),
    ...["AC", "CB", "BD", "DA"].map((id) => ({ id: `bar${id}`, kind: "link", width: 0.12, thickness: 0.07 })),
  ],
  driver: { part: "rodA", grips: ["rodB"], type: "translation", direction: [-1, 0, 0], range: RANGE, initial: 1.15 },
  targets: ["rodC", "rodD"], // 被推開拉攏的另一對桿
  view: { direction: [0.05, 0.05, 1] },
  pose(w0) {
    const w = clamp(w0, ...RANGE);
    const h = spread(w);
    const P = { A: [-w, 0, Z], B: [w, 0, Z], C: [0, h, Z], D: [0, -h, Z] };
    const bar = (a, b) => ({ from: P[a], to: P[b] });
    return {
      parts: {
        rodA: { position: [-w, 0, 0] },
        rodB: { position: [w, 0, 0] },
        rodC: { position: [0, h, 0] },
        rodD: { position: [0, -h, 0] },
        barAC: bar("A", "C"),
        barCB: bar("C", "B"),
        barBD: bar("B", "D"),
        barDA: bar("D", "A"),
      },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["guides", "rodD"], reason: "桿端在導座的方孔裡滑動,行程一端桿端縮在導座裡面(方孔沒有畫出來)" },
    { check: "interference", parts: ["guides", "rodC"], reason: "桿端在導座的方孔裡滑動,行程一端桿端縮在導座裡面(方孔沒有畫出來)" },
    { check: "interference", parts: ["guides", "rodB"], reason: "桿端在導座的方孔裡滑動,行程一端桿端縮在導座裡面(方孔沒有畫出來)" },
    { check: "interference", parts: ["guides", "rodA"], reason: "桿端在導座的方孔裡滑動,行程一端桿端縮在導座裡面(方孔沒有畫出來)" },
  ],
};
