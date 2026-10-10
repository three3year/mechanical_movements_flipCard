// 第 249 種:管路用的球窩接頭(剖面圖)。上管末端是一顆空心球,夾在下管的球窩裡;球窩分上下兩半,
// 在左右兩側的耳片上以螺栓鎖合。球在窩裡可以轉,上管因此能朝各方向偏擺,而接頭不漏。
// 主動件是上管:在圖面內左右偏擺。
// 推斷:接頭被使用時的動作(原文只有名稱);偏擺的範圍由上半球窩的開口決定。
import { Y, Z, deg, quatMul, quatAxisAngle, quatFromZ } from "./kit.js";
import { backHalf } from "./section.js";

const BALL = 1.0;
const SHELL = 1.16; // 球窩外半徑
const PIPE = { inner: 0.3, outer: 0.42 };
export const TILT = deg(24);
const HALF = backHalf(Y);
const arc = (r, a0, a1, n = 16) => Array.from({ length: n + 1 }, (_, i) => {
  const a = a0 + ((a1 - a0) * i) / n;
  return [r * Math.cos(a), r * Math.sin(a)];
});

// 下管+下半球窩(從管口一直到赤道)
const lower = [
  [PIPE.inner, -2.6], [PIPE.outer, -2.6], [PIPE.outer, -1.08],
  ...arc(SHELL, deg(-64), 0), [BALL, 0], ...arc(BALL, 0, deg(-72.5)), [PIPE.inner, -0.96],
];
// 上半球窩:從赤道到開口(開口留給上管偏擺)
const OPEN = deg(40);
const upper = [[BALL, 0], [SHELL, 0], ...arc(SHELL, 0, OPEN), ...arc(BALL, OPEN, 0)];
// 上管+球:球心在原點。給管路用,所以球是空心的球殼(原圖內圓是球殼的內壁),上管的管孔一直通進球的
// 內腔;球殼底部在弦線 CUT 的高度切開(原圖內圓下方的那條橫弦),流體從這裡進出下管。
// 推斷:球殼厚度與弦線高度(依原圖比例)。
const CAVITY = 0.85; // 球殼內半徑
const CUT = -0.67; // 球殼底部開口的高度(原圖弦線在內圓半徑的 0.79 倍處)
const OUTER = BALL - 0.01; // 球殼外半徑:和球窩之間留一點配合間隙,球才轉得動
const ball = [
  [PIPE.inner, 2.7],
  [PIPE.inner, Math.sqrt(CAVITY ** 2 - PIPE.inner ** 2)],
  ...arc(CAVITY, Math.acos(PIPE.inner / CAVITY), Math.asin(CUT / CAVITY)).slice(1),
  ...arc(OUTER, Math.asin(CUT / OUTER), Math.acos(PIPE.outer / OUTER)),
  [PIPE.outer, 2.7],
];

/** 上管偏擺 t(圖面內,逆時針為正)的朝向 */
export const pipeRotation = (t) => quatMul(quatAxisAngle(Z, t), quatFromZ(Y));

const ear = (s) => [
  { kind: "box", size: [0.5, 0.12, 0.42], at: [s * (SHELL + 0.2), 0.07, 0] },
  { kind: "box", size: [0.5, 0.12, 0.42], at: [s * (SHELL + 0.2), -0.07, 0] },
  { kind: "cylinder", axis: Y, radius: 0.07, length: 0.5, at: [s * (SHELL + 0.26), 0, 0] },
  { kind: "cylinder", axis: Y, radius: 0.13, length: 0.1, at: [s * (SHELL + 0.26), 0.2, 0] },
  { kind: "cylinder", axis: Y, radius: 0.13, length: 0.1, at: [s * (SHELL + 0.26), -0.2, 0] },
];

export default {
  figure: 249,
  parts: [
    {
      id: "socket",
      kind: "group",
      pieces: [
        { kind: "lathe", axis: Y, profile: lower, ...HALF },
        { kind: "lathe", axis: Y, profile: upper, ...HALF },
        ...ear(1),
        ...ear(-1),
      ],
    },
    // 上管與球和球窩一樣剖開,看得到管孔與球的內腔
    { id: "pipe", kind: "lathe", axis: Y, center: [0, 0, 0], profile: ball, ...HALF },
  ],
  driver: { part: "pipe", type: "rotation", range: [-TILT, TILT], initial: 0 },
  target: "socket", // 接頭的另一半:夾住球的球窩
  view: { direction: [0.06, 0.1, 1] },
  pose(t) {
    return { parts: { pipe: { rotation: pipeRotation(t) } }, readouts: [] };
  },
};
