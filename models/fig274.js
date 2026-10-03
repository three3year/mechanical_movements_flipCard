// 第 274 種:引擎調速器。心軸 C–D 頂端固定著兩支拋物線曲面臂 B;球 K 的架上裝著抗摩擦輪 L,輪 L 沿臂 B 下段的
// 拋物線曲面滾動,所以球的升降由拋物線引導。桿 F 把輪 L 與心軸上的套筒相連:球升起時套筒沿心軸往上。
// 主動件是虛擬的「轉速」(平衡型):轉得越快,球被甩得越開,沿拋物線升得越高。
// 推斷:輪 L 沿拋物線的位置與轉速的對應(原文只說由拋物線引導);各部尺寸依原圖。
import { Y, clamp } from "./kit.js";
import { shape, thickLine } from "./shapes.js";

const VERTEX = -0.25; // 拋物線頂點高度(在心軸上)
const K = 0.95; // 拋物線 y = VERTEX + K·x²
const X_RANGE = [0.32, 0.95]; // 輪 L 離心軸的距離(低速 → 高速)
const ROD_F = 1.25;
const BALL = { r: 0.42, out: [0.42, -0.42] }; // 球心相對輪 L
export const RANGE = [0, 10];

/** 轉速 s → 輪 L 的位置(右側)、套筒高度 */
export function governor(s) {
  const f = clamp(s / RANGE[1], 0, 1) ** 2;
  const x = X_RANGE[0] + (X_RANGE[1] - X_RANGE[0]) * f;
  const y = VERTEX + K * x * x;
  const sleeve = y - Math.sqrt(ROD_F * ROD_F - (x - 0.12) ** 2);
  return { x, y, sleeve };
}
export const parabola = (x) => VERTEX + K * x * x;

// 臂 B:從頂端 C 往外、往下彎,再往內收,下段就是拋物線(輪 L 在其上)
const armB = (s) => {
  const para = Array.from({ length: 9 }, (_, i) => {
    const x = X_RANGE[0] - 0.1 + (i / 8) * (X_RANGE[1] + 0.25 - X_RANGE[0]);
    return [s * x, parabola(x) + 0.17];
  });
  return shape(thickLine([[s * 0.15, 2.45], [s * 0.9, 2.3], [s * 1.55, 1.5], [s * 1.55, 0.85], ...para.reverse()], 0.11));
};

export default {
  figure: 274,
  parts: [
    {
      id: "frame",
      kind: "group",
      label: "B",
      labelOffset: [-1.85, 1.75, 0.3],
      pieces: [
        { kind: "cylinder", axis: Y, radius: 0.07, length: 4.6, at: [0, 0.2, 0] },
        { kind: "plate", shape: armB(1), thickness: 0.1, at: [0, 0, -0.08] },
        { kind: "plate", shape: armB(-1), thickness: 0.1, at: [0, 0, -0.08] },
        { kind: "cylinder", radius: 0.14, length: 0.3, at: [0.95, 2.3, 0] },
        { kind: "cylinder", radius: 0.14, length: 0.3, at: [-0.95, 2.3, 0] },
        { kind: "sphere", radius: 0.1, at: [0, 2.6, 0] },
        { kind: "box", size: [0.3, 0.1, 0.3], at: [0, -2.05, 0] },
      ],
    },
    { id: "labelC", kind: "group", center: [0, 2.6, 0], label: "C", labelOffset: [0, 0.3, 0] },
    { id: "labelD", kind: "group", center: [0, -2.05, 0], label: "D", labelOffset: [0.3, -0.2, 0] },
    ...[-1, 1].flatMap((s) => [
      { id: s < 0 ? "wheelL" : "wheelR", kind: "cylinder", radius: 0.14, length: 0.12, label: s < 0 ? "L" : undefined, labelOffset: [-0.25, 0.25, 0.2] },
      { id: s < 0 ? "ballL" : "ballR", kind: "sphere", radius: BALL.r, label: s < 0 ? "K" : undefined, labelOffset: [-0.55, 0, 0.3] },
      { id: s < 0 ? "carrierL" : "carrierR", kind: "link", width: 0.08, thickness: 0.05 },
      { id: s < 0 ? "rodL" : "rodR", kind: "link", width: 0.07, thickness: 0.05, label: s < 0 ? "F" : undefined, labelOffset: [-0.2, -0.3, 0.2] },
    ]),
    { id: "sleeve", kind: "cylinder", axis: Y, radius: 0.18, length: 0.3 },
  ],
  driver: { type: "virtual", label: "轉速", mode: "balance", range: RANGE, initial: 6 },
  view: { direction: [0.04, 0.05, 1] },
  pose(s) {
    const { x, y, sleeve } = governor(s);
    const parts = { sleeve: { position: [0, sleeve, 0] } };
    for (const k of [-1, 1]) {
      const side = k < 0 ? "L" : "R";
      const w = [k * x, y, 0.12];
      const ball = [k * (x + BALL.out[0]), y + BALL.out[1], 0.12];
      parts[`wheel${side}`] = { position: w };
      parts[`ball${side}`] = { position: ball };
      parts[`carrier${side}`] = { from: w, to: ball };
      parts[`rod${side}`] = { from: w, to: [k * 0.12, sleeve, 0.12] };
    }
    return { parts, readouts: [] };
  },
};
