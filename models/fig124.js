// 第 124 種:提琴式鑽。弓的弦繞過鑽軸上的皮帶輪,弓沿弦的方向往復拉動時,弦帶著皮帶輪(連同鑽頭)交替地正反旋轉:
// 弓移動多少,皮帶輪的輪緣就轉過多少弧長。主動件是弓(沿弦的方向來回拉)。
// 弦在皮帶輪上多繞一整圈(只貼著輪邊擦過去帶不動輪;一整圈的摩擦才夠,原圖看不出繞法)。
// 鑽軸後端頂在手握的承窩裡,前端是鑽頭(承窩與鑽頭是推斷,原圖只畫出弓與皮帶輪;軸朝著觀看的方向)。
import { Z, TAU, norm, sub, add, scale, routeRope } from "./kit.js";

const A = [-2.3, -2.35, 0]; // 弦的下端(弓尾)
const B = [1.65, 2.05, 0]; // 弦的上端(弓頭)
const DIR = norm(sub(B, A));
const PULLEY = { center: [0.25, -0.08, 0], radius: 0.48 };
const RANGE = [-1.0, 1.0];

/** 弓沿弦移動 s:皮帶輪的轉角(弦從皮帶輪的左上方繞過) */
export const spindleAngle = (s) => -s / PULLEY.radius;
export const pulleyRadius = PULLEY.radius;

// 弦在輪上多繞一整圈:在弦第一次碰到輪的地方插入一圈(沿輪的深度方向錯開,兩段不互相穿過),
// 之後的弦往前移一點
const WRAP = 0.12;
function wrapOnce(points) {
  const c = PULLEY.center;
  const onWheel = (p) => Math.abs(Math.hypot(p[0] - c[0], p[1] - c[1]) - PULLEY.radius) < 0.02;
  const k = points.findIndex(onWheel);
  if (k < 0) return points;
  const start = Math.atan2(points[k][1] - c[1], points[k][0] - c[0]);
  const loop = Array.from({ length: 48 }, (_, i) => {
    const t = (i + 1) / 49;
    const a = start - TAU * t; // 照弦繞輪的方向(順時針)多繞一圈
    const r = PULLEY.radius + 0.03 * Math.sin(Math.PI * t); // 略浮出輪緣,從正面看得到這一圈
    return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a), -WRAP / 2 + WRAP * t];
  });
  const shift = (p) => [p[0], p[1], p[2] + WRAP / 2];
  return [...points.slice(0, k).map((p) => [p[0], p[1], p[2] - WRAP / 2]), [points[k][0], points[k][1], points[k][2] - WRAP / 2], ...loop, ...points.slice(k).map(shift)];
}

const bowArc = (() => {
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const p = add(A, scale(sub(B, A), t));
    const bulge = 1.15 * Math.sin(Math.PI * t);
    pts.push([p[0] - DIR[1] * bulge, p[1] + DIR[0] * bulge, 0]);
  }
  return pts;
})();

export default {
  figure: 124,
  parts: [
    {
      id: "bow",
      kind: "group",
      pieces: [
        { kind: "tube", points: bowArc, radius: 0.09 },
        { kind: "cylinder", radius: 0.12, length: 0.3, axis: DIR, at: A },
        { kind: "cylinder", radius: 0.1, length: 0.45, axis: DIR, at: add(B, scale(DIR, 0.15)) },
      ],
    },
    {
      id: "spindle",
      kind: "lathe",
      center: PULLEY.center,
      profile: [[0, -0.2], [PULLEY.radius, -0.2], [PULLEY.radius - 0.08, 0], [PULLEY.radius, 0.2], [0, 0.2]],
      mark: true,
      spin: PULLEY.radius,
      pieces: [
        { kind: "cylinder", radius: 0.12, length: 0.9, at: [0, 0, -0.1] },
        { kind: "lathe", profile: [[0, 0.35], [0.1, 0.35], [0.1, 0.75], [0.05, 0.95], [0, 1.05]] }, // 鑽頭
      ],
    },
    {
      id: "socket",
      kind: "lathe",
      center: [PULLEY.center[0], PULLEY.center[1], 0],
      profile: [[0.13, -0.5], [0.3, -0.5], [0.45, -0.62], [0.45, -0.8], [0, -0.8], [0, -0.56], [0.13, -0.56]], // 手握的承窩:鑽軸後端轉在裡面
    },
    { id: "string", kind: "rope" },
  ],
  driver: { part: "bow", type: "translation", direction: DIR, range: RANGE },
  target: "spindle", // 交替正反旋轉的鑽軸
  view: { direction: [0.06, 0.05, 1] },
  pose(s) {
    const a = add(A, scale(DIR, s));
    const b = add(B, scale(DIR, s));
    const rope = wrapOnce(routeRope([{ point: a }, { circle: { center: PULLEY.center, axis: Z, radius: PULLEY.radius, sense: -1 } }, { point: b }]).points);
    return {
      parts: { bow: { position: scale(DIR, s) }, spindle: { angle: spindleAngle(s) } },
      paths: { string: { points: rope, closed: false, phase: s } },
      readouts: [],
    };
  },
};
