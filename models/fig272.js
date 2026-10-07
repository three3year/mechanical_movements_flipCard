// 第 272 種:斜面圓盤凸輪。圓盤斜裝在水平軸上,一根斜向的桿由兩個導套導引,桿端靠在圓盤上部;
// 軸轉動時,斜盤的盤面在桿端處前後擺,把桿推出又讓它退回,得到往復的直線運動。主動件是軸。
// 推斷:桿端由重力保持貼在盤上(原文只說「靠在其圓周上」;桿斜向上伸,自重把桿端壓向盤面);為了只用盤面接觸計算,
// 桿端靠在盤面的上部而不是最邊緣;桿端是一顆圓頭(圓頭的中心離盤面一個半徑,整個桿端都不會陷進盤面);圓盤的傾角;
// 軸兩端的軸承座、托著兩個導套的支架。
import { X, Z, deg, quatMul, quatAxisAngle, quatFromZ } from "./kit.js";

const R = 1.3;
const TILT = deg(12); // 盤面與垂直面的夾角
const ROD_ANGLE = deg(125); // 桿的方向(從桿端往上的方向,與 +x 的夾角)
const U = [Math.cos(ROD_ANGLE), Math.sin(ROD_ANGLE), 0]; // 桿沿這個方向伸出

/** 軸轉 theta:盤面法線(初始時偏離軸 TILT,隨軸轉) */
const normal = (theta) => [Math.cos(TILT), Math.sin(TILT) * Math.cos(theta), Math.sin(TILT) * Math.sin(theta)];

const THICK = 0.32;
const BALL = 0.1; // 桿端圓頭的半徑
const Q = [0, 0.4, 0]; // 桿的中心線通過這一點

/** 軸轉 theta:桿沿自身方向的位置 t(桿端圓頭的中心 Q + t·U 離圓盤朝桿那一面一個半徑) */
export function rodTravel(theta) {
  const n = normal(theta);
  const nq = n[0] * Q[0] + n[1] * Q[1] + n[2] * Q[2];
  const nu = n[0] * U[0] + n[1] * U[1] + n[2] * U[2];
  return (-THICK / 2 - BALL - nq) / nu;
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
      pieces: [
        ...[1.6, 2.7].map((t) => ({ kind: "box", size: [0.3, 0.34, 0.4], at: [Q[0] + U[0] * t, Q[1] + U[1] * t, 0], angle: ROD_ANGLE })),
        // 兩個導套後面的連接板與往下的支柱、軸兩端的軸承座、底板(推斷)
        { kind: "box", size: [1.4, 0.2, 0.1], at: [Q[0] + U[0] * 2.15, Q[1] + U[1] * 2.15, -0.25], angle: ROD_ANGLE },
        { kind: "box", size: [0.2, Q[1] + U[1] * 1.6 + 1.7, 0.1], at: [Q[0] + U[0] * 1.6, (Q[1] + U[1] * 1.6 - 1.7) / 2, -0.25] },
        ...[-1.6, 1.6].flatMap((x) => [
          { kind: "cylinder", axis: X, radius: 0.24, inner: 0.1, length: 0.25, at: [x, 0, 0] },
          { kind: "box", size: [0.25, 1.53, 0.3], at: [x, -0.95, 0] },
        ]),
        { kind: "box", size: [4.0, 0.12, 1.2], at: [0, -1.76, -0.1] },
      ],
    },
    { id: "rod", kind: "group", pieces: [{ kind: "box", size: [3.12, 0.16, 0.16], at: [1.64, 0, 0] }, { kind: "sphere", radius: BALL }] }, // 桿,端頭是圓頭
  ],
  driver: { part: "shaft", type: "rotation" },
  target: "rod", // 往復的桿
  view: { direction: [0.1, 0.12, 1] },
  pose(theta) {
    const t = rodTravel(theta);
    const tip = [Q[0] + t * U[0], Q[1] + t * U[1], 0];
    return {
      parts: {
        shaft: { angle: theta },
        // 斜裝的圓盤:盤面法線先從軸偏 TILT,再隨軸轉
        disc: { rotation: quatMul(quatAxisAngle(X, theta), quatMul(quatAxisAngle(Z, TILT), quatFromZ(X))) },
        rod: { position: tip, angle: ROD_ANGLE },
      },
      readouts: [],
    };
  },
  // 動力重演:只轉軸;桿在導套裡沿自己的方向滑、受重力,桿端的圓頭被斜盤推出又靠自重退回
  replay: {
    seconds: 12,
    free: { rod: { slide: U } },
    ignore: [["rod", "rodGuides"]], // 桿在導套的方孔裡滑(方孔沒有畫出來)
    expect: [
      { at: Math.PI / 2, part: "rod", label: "斜盤轉四分之一圈,桿被推到一半" },
      { at: Math.PI, part: "rod", label: "轉半圈,桿退到另一端", quote: "斜面圓盤凸輪的旋轉運動,會賦予靠在其圓周上的桿一種往復直線運動" },
      { at: 2 * Math.PI, part: "rod", label: "轉一圈回到原位" },
    ],
  },
};
