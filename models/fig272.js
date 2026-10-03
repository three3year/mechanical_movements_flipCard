// 第 272 種:斜面圓盤凸輪。圓盤斜裝在水平軸上,一根斜向的桿由兩個導套導引,桿端靠在圓盤上部;
// 軸轉動時,斜盤的盤面在桿端處前後擺,把桿推出又讓它退回,得到往復的直線運動。主動件是軸。
// 推斷:桿端由重力或彈簧保持貼在盤上(原文只說「靠在其圓周上」);為了只用盤面接觸計算,桿端靠在盤面的上部
// 而不是最邊緣;圓盤的傾角。
import { X, Z, deg, quatMul, quatAxisAngle, quatFromZ } from "./kit.js";

const R = 1.3;
const TILT = deg(12); // 盤面與垂直面的夾角
const ROD_ANGLE = deg(125); // 桿的方向(從桿端往上的方向,與 +x 的夾角)
const U = [Math.cos(ROD_ANGLE), Math.sin(ROD_ANGLE), 0]; // 桿沿這個方向伸出

/** 軸轉 theta:盤面法線(初始時偏離軸 TILT,隨軸轉) */
const normal = (theta) => [Math.cos(TILT), Math.sin(TILT) * Math.cos(theta), Math.sin(TILT) * Math.sin(theta)];

const THICK = 0.32;
const Q = [0, 0.4, 0]; // 桿的中心線通過這一點

/** 軸轉 theta:桿沿自身方向的位置 t(桿端 Q + t·U 貼在圓盤朝桿那一面上) */
export function rodTravel(theta) {
  const n = normal(theta);
  const nq = n[0] * Q[0] + n[1] * Q[1] + n[2] * Q[2];
  const nu = n[0] * U[0] + n[1] * U[1] + n[2] * U[2];
  return (-THICK / 2 - nq) / nu;
}

export default {
  figure: 272,
  parts: [
    {
      id: "shaft",
      kind: "cylinder",
      axis: X,
      radius: 0.1,
      length: 3.6,
      mark: true,
      spin: 0.45,
      pieces: [{ kind: "cylinder", radius: 0.32, length: 0.36, at: [0, 0, 0.7] }],
    },
    {
      id: "disc",
      kind: "plate",
      shape: { outline: Array.from({ length: 64 }, (_, i) => [R * Math.cos((i / 64) * 2 * Math.PI), R * Math.sin((i / 64) * 2 * Math.PI)]), holes: [] },
      thickness: THICK,
      mark: [R - 0.15, 0],
      markSize: 0.08,
    },
    {
      id: "rodGuides",
      kind: "group",
      pieces: [1.6, 2.7].map((t) => ({ kind: "box", size: [0.3, 0.34, 0.4], at: [Q[0] + U[0] * t, Q[1] + U[1] * t, 0], angle: ROD_ANGLE })),
    },
    { id: "rod", kind: "box", size: [3.2, 0.16, 0.16] },
  ],
  driver: { part: "shaft", type: "rotation" },
  view: { direction: [0.1, 0.12, 1] },
  pose(theta) {
    const t = rodTravel(theta);
    const tip = [Q[0] + t * U[0], Q[1] + t * U[1], 0];
    return {
      parts: {
        shaft: { angle: theta },
        // 斜裝的圓盤:盤面法線先從軸偏 TILT,再隨軸轉
        disc: { rotation: quatMul(quatAxisAngle(X, theta), quatMul(quatAxisAngle(Z, TILT), quatFromZ(X))) },
        rod: { position: [tip[0] + U[0] * 1.6, tip[1] + U[1] * 1.6, 0], angle: ROD_ANGLE },
      },
      readouts: [],
    };
  },
};
