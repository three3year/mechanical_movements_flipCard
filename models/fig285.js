// 第 285 種:車床的可動頭(尾座,剖面)。把右邊的手輪轉動,運動傳給螺桿;螺桿旋在心軸尾端的螺帽裡,
// 心軸不能轉、只能在套筒裡前後滑,於是作直線運動;頂尖固定在心軸的左端。主動件是手輪。
// 推斷:手輪往右轉(順時針,從右邊看)時心軸往左伸出;螺距。
import { X, TAU, clamp, screwAdvance } from "./kit.js";
import { backHalf } from "./section.js";
import { shape } from "./shapes.js";

export const PITCH = 0.22;
export const RANGE = [0, 5 * TAU];
const Y0 = 1.0; // 心軸中心高度
const BARREL = { from: -1.65, to: 1.75, outer: 0.42, inner: 0.26 };

/** 手輪轉 theta → 心軸伸出的距離(往左為正) */
export const extend = (theta) => screwAdvance(clamp(theta, ...RANGE), PITCH);

const casting = shape([
  [-1.5, -0.85], [1.55, -0.85], [1.55, -0.62], [1.25, -0.5], [1.25, 0.55], [1.7, 0.6], [1.7, 1.25],
  [-1.55, 1.25], [-1.55, 0.6], [-1.15, 0.55], [-1.15, -0.5], [-1.5, -0.62],
], [[[-0.85, -0.25], [-0.85, 0.25], [-0.6, 0.45], [0.75, 0.45], [0.95, 0.25], [0.95, -0.25], [0.75, -0.42], [-0.6, -0.42]].reverse()]);

const HALF = backHalf(X);

export default {
  figure: 285,
  parts: [
    {
      id: "body",
      kind: "group",
      pieces: [
        { kind: "plate", shape: casting, thickness: 0.6, at: [0, 0, -0.75] },
        { kind: "box", size: [4.4, 0.18, 1.6], at: [0, -0.95, -0.3] },
        { kind: "box", size: [0.5, 0.25, 0.5], at: [0, -1.15, -0.3] },
        { kind: "cylinder", axis: [0, 1, 0], radius: 0.1, length: 0.7, at: [0, -1.5, -0.3] },
        // 套筒(剖開)
        { kind: "lathe", axis: X, profile: [[BARREL.inner, BARREL.from], [BARREL.outer, BARREL.from], [BARREL.outer, BARREL.to], [BARREL.inner, BARREL.to]], ...HALF, at: [0, Y0, 0] },
        // 套筒上的夾緊螺絲與把手
        { kind: "cylinder", axis: [0, 1, 0], radius: 0.07, length: 0.4, at: [0.1, Y0 + 0.55, 0] },
        { kind: "box", size: [0.5, 0.08, 0.12], at: [0.1, Y0 + 0.75, 0] },
      ],
    },
    {
      id: "spindle",
      kind: "group",
      pieces: [
        // 心軸(剖開)與左端的頂尖
        { kind: "lathe", axis: X, profile: [[0.1, -1.6], [0.25, -1.6], [0.25, 1.0], [0.1, 1.0]], ...HALF },
        { kind: "lathe", axis: X, profile: [[0, -2.25], [0.04, -2.25], [0.2, -1.95], [0.25, -1.75], [0.25, -1.6], [0, -1.6]] },
      ],
    },
    { id: "screw", kind: "worm", axis: X, radius: 0.1, length: 2.6, pitch: PITCH, thread: 0.035, pieces: [{ kind: "cylinder", radius: 0.06, length: 0.9, at: [0, 0, 1.7] }] },
    {
      id: "handwheel",
      kind: "pulley",
      style: "spoked",
      spokes: 4,
      axis: X,
      center: [2.25, Y0, 0],
      radius: 0.62,
      width: 0.1,
      pieces: [{ kind: "cylinder", radius: 0.04, length: 0.3, at: [0, 0.5, 0.15] }],
    },
  ],
  driver: { part: "handwheel", type: "rotation", range: RANGE, initial: 0 },
  view: { direction: [0.05, 0.12, 1] },
  pose(theta) {
    const a = clamp(theta, ...RANGE);
    const s = extend(theta);
    return {
      parts: {
        handwheel: { angle: a },
        screw: { angle: a, position: [0.95, Y0, 0] },
        spindle: { position: [-0.05 - s, Y0, 0] },
      },
      readouts: [],
    };
  },
};
