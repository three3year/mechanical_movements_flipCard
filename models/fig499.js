// 第 499 種:無液壓力計,以法國發明者之名稱為「布爾登壓力計」。B 是兩端封閉的彎管,在長度中點 C 處固定,兩端可自由移動。
// 引進管內的蒸汽或其他流體的壓力,依其強度使管子或多或少地伸直。管子的兩端接到一個齒形扇形段的機構,
// 與指針心軸上的小齒輪嚙合,在錶盤上指示壓力。
// 主動件是虛擬的「壓力」。
// 推斷:彎管在頂端 C 固定,兩半各沿錶殼內側彎下來;伸直以「彎曲半徑隨壓力變大、管長不變」表示;兩端經短桿推動扇形段,
// 扇形段轉角與兩端的平均位移成正比。
import { deg, polar, clamp } from "./kit.js";
import { meshAngle } from "./gears.js";
import { shape, circle, thickLine } from "./shapes.js";

export const R0 = 1.25; // 沒有壓力時的彎曲半徑
const SPAN = deg(140); // 每一半從 C 量起轉過的角度
export const RANGE = [0, 10];
const K = 0.035; // 每單位壓力半徑變大的比例
const PINION = { center: [0, -0.35, 0], teeth: 10, radius: 0.12 };
const SECTOR = { center: [0, -0.95, 0], teeth: 60, radius: 0.6 };
const GAIN = 0.41; // 管端位移 → 扇形段轉角(滿刻度時指針轉 120°)
const C = [0, R0, 0];

/** 壓力 p → 彎曲半徑、右半管端的位置(左半對稱)、扇形段與指針的轉角 */
export function bourdon(p0) {
  const p = clamp(p0, ...RANGE);
  const r = R0 * (1 + K * p);
  const span = (R0 * SPAN) / r; // 管長不變
  const center = [0, C[1] - r, 0];
  const end = [center[0] + r * Math.sin(span), center[1] + r * Math.cos(span), 0];
  const end0 = [R0 * Math.sin(SPAN), R0 * Math.cos(SPAN), 0];
  const move = Math.hypot(end[0] - end0[0], end[1] - end0[1]);
  const sector = GAIN * move;
  return { r, span, center, end, sector, pinion: meshAngle(SECTOR, PINION, sector) };
}
const REST = bourdon(0);

/** 一半彎管的折線(右半 s = 1,左半 s = −1) */
const half = (b, s) => Array.from({ length: 25 }, (_, i) => {
  const a = (b.span * i) / 24;
  return [s * b.r * Math.sin(a), b.center[1] + b.r * Math.cos(a), 0.05];
});

export default {
  figure: 499,
  parts: [
    {
      id: "case",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(circle(1.75), [circle(1.6).reverse()]), thickness: 0.3 },
        { kind: "plate", shape: shape(circle(1.75)), thickness: 0.04, at: [0, 0, -0.17] },
        // 刻度與下面的接管
        ...Array.from({ length: 11 }, (_, i) => ({ kind: "box", size: [0.15, 0.03, 0.03], at: polar(1.45, deg(150) - (i * deg(120)) / 10, 0.05), angle: deg(150) - (i * deg(120)) / 10 })),
        { kind: "cylinder", radius: 0.1, length: 1.2, axis: [0, 1, 0], at: [0, -2.3, 0] },
        { kind: "plate", shape: shape(thickLine([[0, -1.75], [0, R0 - 0.05]], 0.05)), thickness: 0.04, at: [0, 0, -0.1] },
      ],
    },
    { id: "labelC", kind: "group", pieces: [], label: "C", labelOffset: [0, R0 + 0.22, 0.3] },
    { id: "tubeL", kind: "rod", radius: 0.07, label: "B", labelOffset: [-1.35, 0.1, 0.3] },
    { id: "tubeR", kind: "rod", radius: 0.07 },
    { id: "rodL", kind: "rod", radius: 0.025 },
    { id: "rodR", kind: "rod", radius: 0.025 },
    { id: "sector", kind: "gear", center: SECTOR.center, teeth: SECTOR.teeth, radius: SECTOR.radius, width: 0.06, arrow: false, has: (i) => i < 9 || i > SECTOR.teeth - 9 },
    { id: "pointer", kind: "plate", center: PINION.center, shape: shape([[-0.12, -0.03], [1.55, 0], [-0.12, 0.03]]), thickness: 0.03, accent: true, spin: 0.3, pieces: [{ kind: "gear", teeth: PINION.teeth, radius: PINION.radius, width: 0.06, at: [0, 0, -0.06] }] },
  ],
  driver: { type: "virtual", label: "壓力", mode: "balance", range: RANGE, initial: 4 },
  view: { direction: [0.03, 0.05, 1] },
  pose(p) {
    const b = bourdon(p);
    const endL = [-b.end[0], b.end[1], 0.05];
    const endR = [b.end[0], b.end[1], 0.05];
    const arm = (s) => polar(0.45, deg(90) + s * deg(60) + b.sector, 0.05).map((c, i) => c + SECTOR.center[i]);
    return {
      parts: {
        sector: { angle: b.sector },
        // 指針:壓力為零時指向左上的零點,隨小齒輪順時針轉
        pointer: { angle: deg(150) + (b.pinion - REST.pinion) },
      },
      paths: {
        tubeL: { points: half(b, -1), closed: false },
        tubeR: { points: half(b, 1), closed: false },
        rodL: { points: [endL, arm(1)], closed: false },
        rodR: { points: [endR, arm(-1)], closed: false },
      },
      readouts: [{ label: "壓力", value: p.toFixed(1) }],
    };
  },
};
