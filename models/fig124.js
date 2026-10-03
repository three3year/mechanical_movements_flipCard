// 第 124 種:提琴式鑽。弓的弦繞過鑽軸上的皮帶輪,弓沿弦的方向往復拉動時,弦帶著皮帶輪(連同鑽頭)交替地正反旋轉:
// 弓移動多少,皮帶輪的輪緣就轉過多少弧長。主動件是弓(沿弦的方向來回拉)。
import { Z, norm, sub, add, scale, routeRope } from "./kit.js";

const A = [-2.3, -2.35, 0]; // 弦的下端(弓尾)
const B = [1.65, 2.05, 0]; // 弦的上端(弓頭)
const DIR = norm(sub(B, A));
const PULLEY = { center: [0.25, -0.08, 0], radius: 0.48 };
const RANGE = [-1.0, 1.0];

/** 弓沿弦移動 s:皮帶輪的轉角(弦從皮帶輪的左上方繞過) */
export const spindleAngle = (s) => -s / PULLEY.radius;
export const pulleyRadius = PULLEY.radius;

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
      pieces: [{ kind: "cylinder", radius: 0.12, length: 0.7 }],
    },
    { id: "string", kind: "rope" },
  ],
  driver: { part: "bow", type: "translation", direction: DIR, range: RANGE },
  target: "spindle", // 交替正反旋轉的鑽軸
  view: { direction: [0.06, 0.05, 1] },
  pose(s) {
    const a = add(A, scale(DIR, s));
    const b = add(B, scale(DIR, s));
    const rope = routeRope([{ point: a }, { circle: { center: PULLEY.center, axis: Z, radius: PULLEY.radius, sense: -1 } }, { point: b }]);
    return {
      parts: { bow: { position: scale(DIR, s) }, spindle: { angle: spindleAngle(s) } },
      paths: { string: { points: rope.points, closed: false, phase: s } },
      readouts: [],
    };
  },
};
