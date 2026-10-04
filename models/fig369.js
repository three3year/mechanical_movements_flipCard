// 第 369 種:擺線面(惠更斯的擺線擺)。擺線從上方懸掛點兩側的兩片擺線形曲面(擺線頰板)之間垂下;擺動時擺線
// 靠著一側的頰板捲上去,擺錘因此走的是一條擺線(原圖虛線),擺動不論幅度大小都等時。
// 主動件是虛擬的「進程」:擺已擺過的週期數。擺錘沿擺線作簡諧運動(沿擺線的弧長隨時間成正弦)。
// 推斷:擺幅;頰板的大小依原圖。
import { TAU, clamp } from "./kit.js";
import { shape, thickLine } from "./shapes.js";

export const A = 0.9; // 擺線的生成圓半徑:擺線長 4A
const TOP = [0, 2.4, 0];
export const AMP = 2.4; // 沿擺線弧長的擺幅(單邊,< 4A)

/** 頰板上(右側)參數 φ 的點:擺線從懸掛點往右下 */
const cheek = (phi, s) => [TOP[0] + s * A * (phi - Math.sin(phi)), TOP[1] - A * (1 - Math.cos(phi)), 0];

/** 進程 p → 擺錘位置、擺線捲在頰板上的參數、擺到哪一側 */
export function pendulum(p) {
  const arc = AMP * Math.sin(TAU * p); // 沿擺線的弧長(從最低點量起)
  const s = arc >= 0 ? 1 : -1;
  const phi = 2 * Math.asin(clamp(Math.abs(arc) / (4 * A), 0, 1));
  const bob = [TOP[0] + s * A * (phi + Math.sin(phi)), TOP[1] - 3 * A - A * Math.cos(phi), 0];
  return { arc, phi, side: s, bob };
}
export const top = TOP;

// 擺錘走的擺線(虛線):φ 從 −π 到 π
const PATH = Array.from({ length: 49 }, (_, i) => {
  const phi = -Math.PI + (i / 48) * 2 * Math.PI;
  return [TOP[0] + A * (phi + Math.sin(phi)), TOP[1] - 3 * A - A * Math.cos(phi), -0.05];
});
const cheekLine = (s) => Array.from({ length: 25 }, (_, i) => cheek((i / 24) * Math.PI * 0.8, s)).map(([x, y]) => [x, y]);

export default {
  figure: 369,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [2.8, 0.25, 0.5], at: [0, TOP[1] + 0.55, -0.1] },
        { kind: "plate", shape: shape(thickLine([[-1.1, TOP[1] + 0.45], [-1.1, TOP[1] - 0.2], [-0.2, TOP[1] + 0.45]], 0.1)), thickness: 0.3 },
        { kind: "plate", shape: shape(thickLine([[1.1, TOP[1] + 0.45], [1.1, TOP[1] - 0.2], [0.2, TOP[1] + 0.45]], 0.1)), thickness: 0.3 },
        // 兩片擺線頰板
        { kind: "plate", shape: shape(thickLine(cheekLine(1), 0.14)), thickness: 0.4, at: [0, 0.07, 0] },
        { kind: "plate", shape: shape(thickLine(cheekLine(-1), 0.14)), thickness: 0.4, at: [0, 0.07, 0] },
      ],
    },
    { id: "path", kind: "rod", radius: 0.012 },
    { id: "thread", kind: "rod", radius: 0.025 },
    { id: "bob", kind: "sphere", radius: 0.16 },
  ],
  powered: ["bob"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "次", speed: 0.25 },
  target: "bob", // 沿擺線走的擺錘
  view: { direction: [0.03, 0.05, 1] },
  pose(p) {
    const m = pendulum(p);
    // 擺線:沿頰板捲到切點,再直線垂到擺錘
    const n = 16;
    const wrapped = Array.from({ length: n + 1 }, (_, i) => cheek((m.phi * i) / n, m.side));
    return {
      parts: { bob: { position: m.bob } },
      paths: { thread: { points: [...wrapped, m.bob], closed: false }, path: { points: PATH, closed: false } },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["bob", "path"], reason: "擺錘沿著示意的擺線軌跡走:軌跡線(畫成一條線狀零件)穿過擺錘 0.11" },
    { check: "interference", parts: ["frame", "thread"], reason: "擺線穿過支架頂端的夾口(夾口沒畫),線的中心線穿過支架的板 0.06" },
  ],
};
