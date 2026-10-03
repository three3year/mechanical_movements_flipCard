// 第 407 種:畫尖拱的儀器。水平桿上開有溝槽,裝著一個帶銷的滑塊,繩圈套在銷上;彈性木材做的拱形尺固定在上面,與水平桿成直角。
// 把水平桿的上緣放在起拱線上、拱形尺的背面對著開口的拱腳,再把拱形尺傾斜到它的上緣碰到拱頂石;鉛筆固定在拱形尺與繩相連處。
// 用法相當於以滑塊上的銷為圓心、繩長為半徑畫弧:鉛筆從拱腳沿弧畫到拱頂。主動件是鉛筆(沿弧移動);軌跡由 pose 回傳。
// 推斷:以等邊尖拱為例(銷在對面的拱腳上,半徑等於跨度);拱形尺以一段固定的弧表示。
import { clamp, deg } from "./kit.js";
import { shape, rect, thickLine } from "./shapes.js";

const SPAN = 3.4;
export const CENTER = [SPAN / 2, -1.6, 0]; // 銷(在右邊的起拱點)
export const RADIUS = SPAN; // 繩長
export const RANGE = [deg(120), deg(180)]; // 繩的方向:從右邊的銷量起,180° 是左邊的拱腳、120° 是拱頂

/** 繩的方向 a → 鉛筆的位置 */
export const pencil = (a0) => {
  const a = clamp(a0, ...RANGE);
  return [CENTER[0] + RADIUS * Math.cos(a), CENTER[1] + RADIUS * Math.sin(a), 0];
};

const arcLine = Array.from({ length: 25 }, (_, i) => {
  const a = deg(180) - (deg(62) * i) / 24;
  return [CENTER[0] + (RADIUS + 0.12) * Math.cos(a), CENTER[1] + (RADIUS + 0.12) * Math.sin(a)];
});

export default {
  figure: 407,
  parts: [
    { id: "paper", kind: "box", center: [0, 0, -0.12], size: [5.4, 5.0, 0.04] },
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 有溝槽的水平桿(起拱線)與左邊的拱腳
        { kind: "plate", shape: shape(rect(SPAN + 0.6, 0.35, 0, CENTER[1] - 0.18), [rect(SPAN - 0.6, 0.12, 0.2, CENTER[1] - 0.18).reverse()]), thickness: 0.15 },
        { kind: "box", size: [0.12, 4.2, 0.12], at: [-SPAN / 2 - 0.12, CENTER[1] + 2.1, 0] },
        { kind: "box", size: [0.25, 0.2, 0.2], at: [CENTER[0], CENTER[1] - 0.18, 0.08] },
        { kind: "cylinder", radius: 0.05, length: 0.4, at: [CENTER[0], CENTER[1], 0.1] },
      ],
    },
    // 彈性的拱形尺(鉛筆固定在它與繩相連處,沿著它畫出拱的弧)
    { id: "bow", kind: "plate", shape: shape(thickLine(arcLine, 0.16)), thickness: 0.12 },
    { id: "string", kind: "rope", radius: 0.02 },
    { id: "pencil", kind: "lathe", profile: [[0, -0.1], [0.05, 0], [0.06, 0.4], [0, 0.4]] },
    { id: "trace", kind: "trace" },
  ],
  waivers: [
    { check: "interference", parts: ["frame", "bow"], reason: "待確認(未修):frame 的方塊 0.12×4.2×0.12 與 bow 的板互相穿入 0.12(96 個取樣姿勢),尚未修正" },
  ],
  driver: { part: "pencil", type: "rotation", range: RANGE, initial: deg(150) },
  target: "bow", // 鉛筆就是主動件;標鉛筆沿著畫的拱形尺
  view: { direction: [0.03, 0.05, 1] },
  pose(a0) {
    const a = clamp(a0, ...RANGE);
    const P = pencil(a);
    const n = Math.max(2, Math.round((deg(180) - a) / deg(1)));
    const points = Array.from({ length: n + 1 }, (_, i) => {
      const q = pencil(deg(180) - ((deg(180) - a) * i) / n);
      return [q[0], q[1], 0.01];
    });
    return {
      parts: { pencil: { position: [P[0], P[1], 0.1] } },
      paths: { string: { points: [[CENTER[0], CENTER[1], 0.12], [P[0], P[1], 0.12]], closed: false, phase: 0 }, trace: { points, closed: false } },
      readouts: [],
    };
  },
};
