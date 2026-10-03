// 第 356 種:Bohnenberger 的陀螺儀。三個環 A、A¹、A² 一個套在另一個裡面,以彼此成直角的樞軸相連;最小的環 A²
// 裡面有軸承,承載重球 B 的軸。球快速旋轉時,不論環的位置怎麼改變,它的軸始終指向同一方向。
// 主動件是外環 A(繞鉛直軸轉);A¹、A² 隨之轉到讓球軸保持原來方向的位置,球繞自己的軸自轉。
// 推斷:球軸的方向(傾斜 30°);球的自轉以固定倍數跟著外環的轉動(示意,不模擬角動量)。
import { X, Y, Z, deg, quatMul, quatAxisAngle, quatFromZ, quatRotate } from "./kit.js";

const S = Math.sin(deg(30));
const C = Math.cos(deg(30));
export const AXIS = [S, C, 0]; // 球軸在空間中的方向(固定)
const CENTER = [0, 0.6, 0];

/** 外環轉 alpha → 三個環的四元數與球軸的方向 */
export function gimbal(alpha) {
  const qA = quatAxisAngle(Y, alpha);
  const beta = Math.atan2(S * Math.sin(alpha), C); // A¹ 繞 A 的 x 軸
  const qA1 = quatMul(qA, quatAxisAngle(X, beta));
  const gamma = -Math.asin(S * Math.cos(alpha)); // A² 繞 A¹ 的 z 軸
  const qA2 = quatMul(qA1, quatAxisAngle(Z, gamma));
  return { qA, qA1, qA2, axis: quatRotate(qA2, [0, 1, 0]) };
}

const ring = (r, axis, pins) => [
  { kind: "cylinder", axis, radius: r, inner: r - 0.1, length: 0.1 },
  ...pins.map((at) => ({ kind: "sphere", radius: 0.07, at })),
];

export default {
  figure: 356,
  parts: [
    {
      id: "stand",
      kind: "group",
      pieces: [
        { kind: "lathe", axis: Y, profile: [[0, -2.75], [1.0, -2.75], [0.9, -2.5], [0.35, -2.3], [0.22, -1.95], [0.35, -1.75], [0, -1.75]] },
        { kind: "cylinder", axis: Y, radius: 0.08, length: 0.6, at: [0, -1.5, 0] },
      ],
    },
    // 外環 A:鉛直的環(環面在 xy 平面),以上下樞軸繞鉛直軸轉;左右的樞軸接 A¹(水平的環),
    // A¹ 前後的樞軸接 A²(側立的環),A² 上下的軸承承載球軸
    { id: "ringA", kind: "group", center: CENTER, arrow: false, label: "A", labelOffset: [-1.55, 1.35, 0], pieces: ring(2.05, Z, [[0, 2.05, 0], [0, -2.05, 0], [1.95, 0, 0], [-1.95, 0, 0]]) },
    { id: "ringA1", kind: "group", center: CENTER, arrow: false, label: "A¹", labelOffset: [0.6, 1.55, 0], pieces: ring(1.85, Y, [[0, 0, 1.75], [0, 0, -1.75]]) },
    { id: "ringA2", kind: "group", center: CENTER, arrow: false, label: "A²", labelOffset: [-1.2, 0.9, 0.5], pieces: ring(1.65, X, [[0, 1.6, 0], [0, -1.6, 0]]) },
    {
      id: "ballB",
      kind: "group",
      center: CENTER,
      spin: 1.0,
      label: "B",
      labelOffset: [0, 0, 0],
      pieces: [
        { kind: "sphere", radius: 1.0 },
        { kind: "cylinder", radius: 0.05, length: 3.3 },
        { kind: "box", size: [0.2, 0.2, 0.2], at: [0.95, 0, 0], accent: true },
      ],
    },
  ],
  driver: { part: "ringA", type: "rotation" },
  target: "ballB", // 軸向保持不變的球
  view: { direction: [0.25, 0.2, 1] },
  pose(alpha) {
    const g = gimbal(alpha);
    // 球:軸(局部 z)對齊 A² 的局部 y,再繞自己的軸自轉
    const ball = quatMul(quatMul(g.qA2, quatFromZ([0, 1, 0])), quatAxisAngle(Z, 6 * alpha));
    return { parts: { ringA: { rotation: g.qA }, ringA1: { rotation: g.qA1 }, ringA2: { rotation: g.qA2 }, ballB: { rotation: ball } }, readouts: [] };
  },
};
