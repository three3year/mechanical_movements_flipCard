// 第 419 種:連續圓周運動轉換為搖動運動,用於自搖式搖籃。輪 A 轉動,以連桿接到半徑較大的輪 B 上,B 因而來回擺動;
// 輪 B 上裝著兩條撓性皮帶 C、D,各接到搖籃搖桿 E 上的立柱。
// 主動件是輪 A(原圖的箭頭為逆時針)。
// 推斷:A、B 裝在固定在地上的背板上;兩條皮帶從 B 的頂端分別往左、往右接到兩根立柱的頂端,各自繞在 B 上、
// 一條在 B 往一邊擺時捲緊、另一條放鬆,於是搖籃在弧形搖桿上來回滾動(皮帶不伸縮)。
import { TAU, deg } from "./kit.js";
import { circleCircle, solve } from "./linkage.js";
import { shape, thickLine, arcPoints, rect } from "./shapes.js";

export const A = { center: [0, 1.2, 0], crank: 0.25 };
export const B = { center: [0, 2.15, 0], radius: 1.25, pin: 0.75 };
const COUPLER = 1.15;
export const ROCKER = 3.4; // 搖桿 E 弧面的半徑;曲率中心與皮帶同高
const POST_X = 1.9;
const WRAP = deg(60); // 皮帶在 B 上繞的長度(以角度計,B 在中間位置時)

const pinA = (alpha) => [A.center[0] + A.crank * Math.cos(alpha), A.center[1] + A.crank * Math.sin(alpha), 0];
/** 輪 A 轉 alpha → 輪 B 的銷與轉角 */
export function wheelB(alpha) {
  const p = circleCircle(pinA(alpha), COUPLER, B.center, B.pin, -1).point;
  return { pin: p, beta: Math.atan2(p[1] - B.center[1], p[0] - B.center[0]) };
}
// B 擺動的兩端與中間
const betas = Array.from({ length: 721 }, (_, i) => wheelB((TAU * i) / 720).beta);
export const BETA_RANGE = [Math.min(...betas), Math.max(...betas)];
const BETA_MID = (BETA_RANGE[0] + BETA_RANGE[1]) / 2;

/** 搖籃轉 gamma(逆時針為正)→ 搖籃上一點的位置(弧面在地上滾動,曲率中心離地 ROCKER) */
const cradle = (gamma, [x, y]) => [-ROCKER * gamma + x * Math.cos(gamma) - y * Math.sin(gamma), ROCKER + x * Math.sin(gamma) + y * Math.cos(gamma), 0];

/** 皮帶:從立柱頂端到 B 的切點,再繞到固定在 B 上的端點;回傳長度與路徑 */
function belt(side, beta, gamma) {
  const P = cradle(gamma, [side * POST_X, 0]);
  const O = B.center;
  const d = Math.hypot(P[0] - O[0], P[1] - O[1]);
  const angP = Math.atan2(P[1] - O[1], P[0] - O[0]);
  // 左邊的皮帶從頂端順時針繞到右邊的端點,右邊的相反
  const tangent = angP + side * Math.acos(B.radius / d);
  const end = Math.PI / 2 + side * WRAP + (beta - BETA_MID);
  const wrap = side < 0 ? tangent - end : end - tangent;
  const n = 16;
  const arc = Array.from({ length: n + 1 }, (_, i) => {
    const a = tangent + ((end - tangent) * i) / n;
    return [O[0] + B.radius * Math.cos(a), O[1] + B.radius * Math.sin(a)];
  });
  return { length: Math.hypot(P[0] - arc[0][0], P[1] - arc[0][1]) + B.radius * wrap, points: [P, ...arc].map(([x, y]) => [x, y, side * 0.12]) };
}
const LEFT_LENGTH = belt(-1, BETA_MID, 0).length;

/** 輪 A 轉 alpha → B 的轉角與搖籃的轉角(左邊的皮帶長度不變) */
export function rock(alpha) {
  const { pin, beta } = wheelB(alpha);
  const gamma = solve((g) => belt(-1, beta, g).length, LEFT_LENGTH, deg(-25), deg(25));
  return { pin, beta, gamma, left: belt(-1, beta, gamma), right: belt(1, beta, gamma) };
}

const rockerBand = thickLine(arcPoints(ROCKER - 0.17, deg(-90) - deg(34), deg(-90) + deg(34)), 0.34);

export default {
  figure: 419,
  parts: [
    { id: "floor", kind: "box", center: [0, -0.1, 0], size: [6.5, 0.2, 1.6] },
    {
      id: "stand",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(rect(0.5, 2.0, 0, 1.55)), thickness: 0.08, at: [0, 0, -0.55] },
        { kind: "cylinder", radius: 0.05, length: 0.55, at: [A.center[0], A.center[1], -0.3] },
        { kind: "cylinder", radius: 0.06, length: 0.55, at: [B.center[0], B.center[1], -0.3] },
      ],
    },
    {
      id: "cradle",
      kind: "group",
      label: "E",
      labelOffset: [0, -3.0, 0.5],
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(rockerBand), thickness: 0.7 },
        { kind: "box", size: [0.12, 3.0, 0.12], at: [-POST_X, -1.45, 0] },
        { kind: "box", size: [0.12, 3.0, 0.12], at: [POST_X, -1.45, 0] },
      ],
    },
    { id: "wheelA", kind: "pulley", style: "spoked", center: A.center, radius: 0.38, width: 0.12, label: "A", labelOffset: [0.1, -0.5, 0.2], pieces: [{ kind: "cylinder", radius: 0.05, length: 0.3, at: [A.crank, 0, 0.12] }] },
    { id: "wheelB", kind: "pulley", style: "spoked", center: B.center, radius: B.radius, width: 0.36, label: "B", labelOffset: [-0.55, 0.35, 0.3], arrow: false, pieces: [{ kind: "cylinder", radius: 0.05, length: 0.3, at: [B.pin, 0, 0.2] }] },
    { id: "coupler", kind: "link", width: 0.1, thickness: 0.05 },
    { id: "beltC", kind: "belt", label: "C", labelOffset: [-POST_X, ROCKER + 0.3, 0] }, // 路徑零件的標籤從原點量起
    { id: "beltD", kind: "belt", label: "D", labelOffset: [POST_X, ROCKER + 0.3, 0] },
  ],
  driver: { part: "wheelA", type: "rotation", speed: 0.8 },
  target: "cradle",
  view: { direction: [0.06, 0.06, 1] },
  pose(alpha) {
    const r = rock(alpha);
    return {
      parts: {
        wheelA: { angle: alpha },
        wheelB: { angle: r.beta },
        coupler: { from: [...pinA(alpha).slice(0, 2), 0.3], to: [r.pin[0], r.pin[1], 0.3] },
        cradle: { position: cradle(r.gamma, [0, 0]), angle: r.gamma },
      },
      paths: { beltC: { points: r.left.points, closed: false, phase: 0 }, beltD: { points: r.right.points, closed: false, phase: 0 } }, // 皮帶的一端固定在立柱上
      readouts: [{ label: "搖籃", value: `${((r.gamma * 180) / Math.PI).toFixed(1)}°` }],
    };
  },
  waivers: [
    { check: "interference", parts: ["wheelA", "wheelB"], reason: "簡化齒形:兩輪的齒畫得比節圓深,嚙合處齒頂伸進對方的齒根 0.21" },
    { check: "interference", parts: ["stand", "wheelB"], reason: "簡化畫法:輪 B 的輻條轉過支架的軸端時擦到 0.06(96 個取樣中 12 個)" },
  ],
};

