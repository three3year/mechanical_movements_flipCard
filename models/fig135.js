// 第 135 種:第 91 種三角形偏心輪的變形,曾用於巴黎鑄幣廠的蒸汽引擎。後方的圓盤承載著三角形撥爪(勒洛三角形,
// 中心在圓盤的軸上),撥爪在框架上下兩條內邊之間轉動,框架連著上下的閥桿,做交替的直線運動:
// 每一程結束時閥門靜止片刻,然後很快地被推越蒸氣口,直到下一程的終點。主動件是圓盤。
// 依原圖,軸在三角形的中心;這樣的撥爪每轉一圈使框架往復三次,行程兩端速度為零,但沒有真正的靜止段
// (原文所說的「靜止片刻」要軸在頂點才會出現,如第 91 種)。此處外觀照原圖,衝突已記在任務票上。
import { TAU, deg, rot2 } from "./kit.js";
import { arcPoints, shape, circle } from "./shapes.js";

const S = 1.55; // 勒洛三角形的寬度
const RC = S / Math.sqrt(3); // 頂點到中心的距離
const V = [0, 1, 2].map((k) => [RC * Math.cos(deg(90) + (k * TAU) / 3), RC * Math.sin(deg(90) + (k * TAU) / 3)]);
const reuleaux = [
  ...arcPoints(S, deg(240), deg(300), ...V[0]),
  ...arcPoints(S, deg(0), deg(60), ...V[1]),
  ...arcPoints(S, deg(120), deg(180), ...V[2]),
];

/** 圓盤轉 theta:框架的高度(框架下內邊靠在撥爪的最低點) */
export function frameY(theta) {
  let bottom = Infinity;
  for (const p of reuleaux) bottom = Math.min(bottom, rot2(p, theta)[1]);
  return bottom;
}
export function frameTop(theta) {
  let top = -Infinity;
  for (const p of reuleaux) top = Math.max(top, rot2(p, theta)[1]);
  return top;
}
export const width = S;

const W = 2.1;

export default {
  figure: 135,
  parts: [
    {
      id: "disc",
      kind: "group",
      spin: 1.9,
      pieces: [
        { kind: "plate", shape: shape(circle(1.9), [circle(0.12).reverse()]), thickness: 0.08, at: [0, 0, -0.3] },
        { kind: "plate", shape: shape(reuleaux, [[[-0.12, -0.12], [0.12, -0.12], [0.12, 0.12], [-0.12, 0.12]].reverse()]), thickness: 0.3, mark: [0, 0.5], markSize: 0.08, circles: [0.3] },
      ],
    },
    {
      id: "frame",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape([[-W, -0.25], [W, -0.25], [W - 0.15, S + 0.25], [-W + 0.15, S + 0.25]], [[[-W + 0.3, 0], [W - 0.3, 0], [W - 0.4, S], [-W + 0.4, S]].reverse()]), thickness: 0.2, at: [0, 0, 0.15] },
        { kind: "cylinder", axis: [0, 1, 0], radius: 0.3, length: 0.5, at: [0, S + 0.5, 0.15] },
        { kind: "cylinder", axis: [0, 1, 0], radius: 0.24, length: 1.2, at: [0, S + 1.3, 0.15] },
        { kind: "cylinder", axis: [0, 1, 0], radius: 0.3, length: 0.5, at: [0, -0.5, 0.15] },
        { kind: "cylinder", axis: [0, 1, 0], radius: 0.24, length: 1.0, at: [0, -1.2, 0.15] },
      ],
    },
  ],
  driver: { part: "disc", type: "rotation", speed: 0.6 },
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    return { parts: { disc: { angle: theta }, frame: { position: [0, frameY(theta), 0] } }, readouts: [] };
  },
};
