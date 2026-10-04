// 第 111 種:千分螺桿(差動螺桿),能得到極大的施力放大。外側的空心螺桿(粗螺距)旋在固定的螺帽裡,
// 內側較小的螺桿(細螺距)旋在空心螺桿裡,下端連著不能轉動的模具。轉動外側螺桿一圈,
// 它在固定螺帽中前進一個粗螺距,內側螺桿卻相對它後退一個細螺距,模具淨移動兩者螺距的差。
// (原文說兩段螺紋旋向相反、淨移動為螺距差;這裡依淨移動為螺距差的描述計算。)主動件是外側螺桿。
import { Y, TAU, screwAdvance } from "./kit.js";
import { shape } from "./shapes.js";

const COARSE = 0.42;
const FINE = 0.3;
const TURNS = 1.5; // 旋到手柄快碰到螺帽為止

/** 外側螺桿轉 angle(往下旋,繞 −y):外側螺桿與模具的下降量 */
export function differential(angle) {
  const outer = screwAdvance(angle, COARSE);
  const inner = outer - screwAdvance(angle, FINE);
  return { outer, inner };
}
export const pitches = { coarse: COARSE, fine: FINE };

export default {
  figure: 111,
  parts: [
    {
      id: "outer",
      kind: "group",
      axis: [0, -1, 0],
      center: [0, 1.0, 0],
      spin: 0.45,
      pieces: [
        { kind: "worm", radius: 0.42, length: 1.9, pitch: COARSE, thread: 0.1, at: [0, 0, 0.95] },
        { kind: "cylinder", radius: 0.5, length: 0.3, at: [0, 0, -0.1], mark: true },
        { kind: "box", size: [1.6, 0.12, 0.12], at: [0, 0, -0.35] },
      ],
    },
    {
      id: "inner",
      kind: "group",
      center: [0, -1.3, 0],
      pieces: [
        { kind: "worm", axis: Y, radius: 0.24, length: 1.7, pitch: FINE, thread: 0.06, at: [0, 0.2, 0] },
        { kind: "box", size: [1.1, 0.35, 0.8], at: [0, -0.85, 0] },
      ],
    },
    {
      id: "nut",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape([[-1.3, -0.25], [1.3, -0.25], [1.3, 0.25], [-1.3, 0.25]], [[[-0.5, -0.25], [0.5, -0.25], [0.5, 0.25], [-0.5, 0.25]]]), thickness: 0.7, at: [0, 0.35, 0] },
        { kind: "box", size: [0.25, 3.6, 0.6], at: [-1.2, -1.2, 0] },
        { kind: "box", size: [0.25, 3.6, 0.6], at: [1.2, -1.2, 0] },
        { kind: "box", size: [2.6, 0.25, 0.9], at: [0, -3.1, 0] },
      ],
    },
  ],
  driver: { part: "outer", type: "rotation", range: [0, TURNS * TAU] },
  target: "inner", // 內側螺桿(連著模具,淨移動為螺距差)
  view: { direction: [0.15, 0.22, 1] },
  pose(angle) {
    const { outer, inner } = differential(angle);
    const cm = (v) => (v * 10).toFixed(1) + " mm";
    return {
      parts: { outer: { position: [0, 1.0 - outer, 0], angle }, inner: { position: [0, -1.3 - inner, 0] } },
      readouts: [
        { label: "外螺桿前進", value: cm(outer) },
        { label: "模具前進", value: cm(inner) },
      ],
    };
  },
};
