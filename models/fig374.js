// 第 374 種:以一條無端皮帶把踏板的動作變成軸的旋轉。皮帶從踏板中段的滾子繞到上方軸上的偏心輪(原圖虛線圓是
// 偏心輪中心繞軸走的圓);踩下踏板時皮帶拉著偏心輪往下,軸轉半圈;偏心輪轉過底部後再把踏板拉起。
// 主動件是踏板(原文:運動從踏板傳給軸),往復踩動;踏板每走一程(上死點到下死點)軸轉半圈,軸的轉角由皮帶的幾何反推。
// 目標件是軸。推斷:皮帶長度不變,所以滾子中心與偏心輪中心的距離固定;踏板的支點在右端;軸的軸承座與踏板支點的支座。
import { Z, TAU, routeBelt, swingPhase, signedAngle } from "./kit.js";
import { pedestal } from "./supports.js";
import { circleCircle, angleOf } from "./linkage.js";
import { shape, circle, thickLine } from "./shapes.js";

const SHAFT = [0.55, 1.6, 0];
const ECC = 0.55; // 偏心距
const DISK = 0.75; // 偏心輪半徑
const ROLLER = 0.18;
const PIVOT = [2.0, -1.95, 0]; // 踏板支點
const ARM = 1.75; // 支點到滾子
export const SPAN = 3.15; // 滾子中心到偏心輪中心(皮帶長度不變)

/** 軸轉 theta → 偏心輪中心、滾子中心、踏板角 */
export function treadle(theta) {
  const e = [SHAFT[0] + ECC * Math.cos(theta), SHAFT[1] + ECC * Math.sin(theta), 0];
  const roller = circleCircle(PIVOT, ARM, e, SPAN, 1).point;
  return { e, roller, angle: angleOf(PIVOT, roller) };
}

// 踏板角(以支點為原點,與模型的姿勢同一個量):在上、下死點之間單調,所以一程對應軸的半圈
const pedal = (theta) => signedAngle(treadle(theta).angle + Math.PI);
const [TOP, BOTTOM] = (() => {
  let hi = { a: -Infinity }, lo = { a: Infinity };
  for (let i = 0; i < 7200; i++) {
    const t = (i / 7200) * TAU;
    const a = pedal(t);
    if (a > hi.a) hi = { a, t };
    if (a < lo.a) lo = { a, t };
  }
  return [hi, lo];
})();
const DOWN = ((BOTTOM.t - TOP.t) % TAU + TAU) % TAU; // 往下踩那一程軸轉過的角度
export const PEDAL = [TOP.a, BOTTOM.a];

/** 踏板的累計行程 v → 軸的轉角(往下踩時軸從上死點轉到下死點,放開時偏心輪把踏板拉起、軸轉完另一段) */
export function shaftAngle(v) {
  const { at, cycle, forward } = swingPhase(v, TOP.a, BOTTOM.a);
  const [from, span] = forward ? [TOP.t, DOWN] : [TOP.t + DOWN, TAU - DOWN];
  let lo = 0;
  let hi = 1;
  const sign = forward ? -1 : 1; // 往下踩那一程踏板角變小
  for (let k = 0; k < 50; k++) {
    const mid = (lo + hi) / 2;
    if (sign * (pedal(from + span * mid) - at) < 0) lo = mid;
    else hi = mid;
  }
  return cycle * TAU + from + span * ((lo + hi) / 2);
}

export default {
  figure: 374,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 軸的軸承座在偏心輪後面;踏板支點的銷立在地上的支座上
        ...pedestal({ at: [SHAFT[0], SHAFT[1]], z: -0.45, bore: 0.13, floor: -2.45 }),
        { kind: "cylinder", radius: 0.1, length: 0.6, at: [PIVOT[0], PIVOT[1], -0.05] },
        { kind: "box", size: [0.3, 0.45, 0.3], at: [PIVOT[0], PIVOT[1] - 0.3, -0.34] },
        { kind: "box", size: [4.6, 0.15, 0.8], at: [0.2, -2.52, -0.3] },
      ],
    },
    {
      id: "shaft",
      kind: "group",
      center: SHAFT,
      spin: ECC + DISK,
      pieces: [
        { kind: "plate", shape: shape(circle(DISK), [circle(0.14, -ECC, 0).reverse()]), thickness: 0.2, at: [ECC, 0, 0] },
        { kind: "cylinder", radius: 0.12, length: 0.75, at: [0, 0, -0.2] }, // 軸,往後伸進軸承座
        { kind: "box", size: [0.15, 0.15, 0.22], at: [ECC + DISK - 0.15, 0, 0], accent: true },
      ],
    },
    {
      id: "treadle",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0.15, 0], [-ARM - 1.8, 0]], 0.14), [circle(0.06).reverse()]), thickness: 0.12, at: [0, 0, -0.1] },
        { kind: "cylinder", radius: ROLLER, length: 0.2, at: [-ARM, 0, 0.1] },
      ],
    },
    { id: "belt", kind: "belt" },
  ],
  driver: { part: "treadle", type: "rotation", cycle: PEDAL },
  target: "shaft", // 被踏板經皮帶帶著轉的軸
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const theta = shaftAngle(v);
    const t = treadle(theta);
    const belt = routeBelt([
      { center: [t.e[0], t.e[1], 0], axis: Z, radius: DISK, sense: 1 },
      { center: [t.roller[0], t.roller[1], 0], axis: Z, radius: ROLLER, sense: 1 },
    ]);
    return {
      parts: { shaft: { angle: theta }, treadle: { angle: pedal(theta) } },
      paths: { belt: { points: belt.points, closed: true, phase: theta * DISK } },
      readouts: [],
    };
  },
};
