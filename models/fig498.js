// 第 498 種:虹吸式壓力計。彎管的下部盛水銀;標刻度的管腳上端開口,另一管腳接到蒸汽鍋爐或其他要指示壓力的裝置。
// 一側管腳裡的水銀受壓,在該側下降、在另一側上升,直到「一側的水銀重量 + 蒸汽壓力」與「另一側的水銀重量 + 大氣壓力」平衡。
// 這是已知最精確的壓力計;但高壓需要很長的管子,所以已被其他實用上夠精確、形式也更方便的壓力計取代。
// 主動件是虛擬的「壓力」(錶壓,以水銀柱高表示)。
// 推斷:兩管腳粗細相同,所以壓力造成的水銀柱高度差,一半是左邊下降、一半是右邊上升;刻度 0–6。
import { clamp } from "./kit.js";
import { stream } from "./flow.js";
import { shape, thickLine, circle } from "./shapes.js";

export const LEFT = -0.35;
export const RIGHT = 0.35;
export const ZERO = 0.0; // 壓力為零時兩邊的水銀面
const BOTTOM = -2.6;
const TOP_R = 3.4; // 開口管腳的頂
const TOP_L = 1.9; // 接鍋爐的管腳頂(往左彎出去)
export const UNIT = 0.5; // 每單位壓力的刻度間距(水銀柱高度差 = 壓力 × UNIT)
export const RANGE = [0, 6];
const BORE = 0.12;

/** 壓力 p → 左、右水銀面的高度 */
export function levels(p0) {
  const p = clamp(p0, ...RANGE);
  const h = p * UNIT;
  return { left: ZERO - h / 2, right: ZERO + h / 2, diff: h };
}

const tube = (pts) => [1, -1].map((s) => ({ kind: "plate", shape: shape(thickLine(pts.map(([x, y]) => [x + s * BORE, y]), 0.04)), thickness: 0.1 }));

export default {
  figure: 498,
  parts: [
    {
      id: "tube",
      kind: "group",
      pieces: [
        // U 形管:左管腳、右管腳(開口)、下面的彎
        ...tube([[LEFT, TOP_L], [LEFT, BOTTOM + RIGHT]]),
        ...tube([[RIGHT, TOP_R], [RIGHT, BOTTOM + RIGHT]]),
        { kind: "plate", shape: shape(thickLine(Array.from({ length: 13 }, (_, i) => { const a = Math.PI + (Math.PI * i) / 12; return [RIGHT * Math.cos(a), BOTTOM + RIGHT + (RIGHT + BORE) * Math.sin(a)]; }), 0.04)), thickness: 0.1 },
        { kind: "plate", shape: shape(thickLine(Array.from({ length: 13 }, (_, i) => { const a = Math.PI + (Math.PI * i) / 12; return [(RIGHT - 2 * BORE) * Math.cos(a), BOTTOM + RIGHT + (RIGHT - BORE) * Math.sin(a)]; }), 0.04)), thickness: 0.1 },
        // 接鍋爐的彎管與旋塞
        { kind: "plate", shape: shape(thickLine([[LEFT, TOP_L], [LEFT - 0.25, TOP_L + 0.3], [-2.0, TOP_L + 0.3]], 0.1)), thickness: 0.1 },
        { kind: "plate", shape: shape(circle(0.18, -1.45, TOP_L + 0.3)), thickness: 0.2 },
        // 右管腳的刻度
        ...Array.from({ length: 7 }, (_, k) => ({ kind: "box", size: [0.18, 0.02, 0.02], at: [RIGHT + 0.25, ZERO + (k * UNIT) / 2, 0.06] })),
        { kind: "box", size: [0.18, 0.02, 0.02], at: [LEFT - 0.25, ZERO, 0.06] },
      ],
    },
    ...Array.from({ length: 7 }, (_, k) => ({ id: `tick${k}`, kind: "group", pieces: [], label: String(k), labelOffset: [RIGHT + 0.5, ZERO + (k * UNIT) / 2, 0.1] })),
    { id: "leftMercury", kind: "fill", fluid: "mercury", center: [LEFT, (BOTTOM + RIGHT + ZERO) / 2, 0], size: [2 * BORE - 0.02, ZERO - BOTTOM - RIGHT, 0.08], level: 1 },
    { id: "rightMercury", kind: "fill", fluid: "mercury", center: [RIGHT, (BOTTOM + RIGHT + TOP_R) / 2, 0], size: [2 * BORE - 0.02, TOP_R - BOTTOM - RIGHT, 0.08], level: 0.5 },
    { id: "bendMercury", kind: "fill", fluid: "mercury", center: [0, BOTTOM + RIGHT / 2 - 0.02, 0], size: [2 * RIGHT + 2 * BORE - 0.04, RIGHT + BORE, 0.08], level: 1 },
  ],
  driver: { type: "virtual", label: "壓力", mode: "balance", range: RANGE, initial: 2 },
  target: "rightMercury", // 標刻度那一腳的水銀柱
  view: { direction: [0.03, 0.05, 1] },
  pose(p) {
    const l = levels(p);
    const leftH = ZERO - BOTTOM - RIGHT;
    const rightH = TOP_R - BOTTOM - RIGHT;
    return {
      parts: {
        leftMercury: { level: (l.left - (BOTTOM + RIGHT)) / leftH },
        rightMercury: { level: (l.right - (BOTTOM + RIGHT)) / rightH },
      },
      flows: [{ fluid: "steam", points: stream([[-2.0, TOP_L + 0.3, 0.1], [LEFT - 0.25, TOP_L + 0.3, 0.1], [LEFT, TOP_L, 0.1], [LEFT, l.left + 0.1, 0.1]], p * 3, { spacing: 0.25 }) }],
      readouts: [{ label: "壓力(水銀柱高度差)", value: `${l.diff.toFixed(2)}(刻度 ${(l.diff / UNIT).toFixed(1)})` }],
    };
  },
};
