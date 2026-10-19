// 第 356 種:Bohnenberger 的陀螺儀。三個環 A、A¹、A² 一個套在另一個裡面,以彼此成直角的樞軸相連;最小的環 A²
// 裡面有軸承,承載重球 B 的軸。球快速旋轉時,不論環的位置怎麼改變,它的軸始終指向同一方向。
// 照原圖排環:外環 A 直接接在座頸上(和座是一件);A¹ 以 A 頂端與底端的樞軸(A 的局部 Y)裝在 A 裡;A² 以 A¹ 側面的
// 水平樞軸(A¹ 的局部 Z)裝在 A¹ 裡;球軸的兩端進 A² 的軸承(A² 的局部 X)。
// 主動件是座:把整台儀器傾斜(座以腳底的兩根耳軸裝在底板的兩個軸承座上,繞前後方向的水平軸來回傾斜);
// A¹、A² 由「球軸在空間中不變」解出轉角,球繞自己的軸自轉。
// 推斷:底板、軸承座與耳軸(原圖的座直接立在桌上,讀者用手把整台儀器傾斜);傾斜的幅度;球軸的方向;
// 球的自轉以固定倍數跟著累計的傾斜行程(示意,不模擬角動量)。
import { X, Y, Z, deg, quatMul, quatAxisAngle, quatFromZ, quatRotate, swing } from "./kit.js";

export const TILT = deg(22); // 整台儀器來回傾斜的幅度
const PIVOT = [0, -2.75, 0]; // 耳軸(座腳底面的中心)
const CENTER = [0, 0.6, 0]; // 環與球的中心(座傾斜 0 時)
// 球軸在空間中的方向(固定):傾斜 0 時 A¹ 繞 A 的鉛直樞軸轉 25°、A² 繞 A¹ 的水平樞軸轉 −15°,照原圖 A¹ 是直立的窄環
const B0 = deg(25);
const G0 = deg(-15);
export const AXIS = quatRotate(quatMul(quatAxisAngle(Y, B0), quatAxisAngle(Z, G0)), X);

const BAND = 0.1; // 環的徑向寬度,也是環的厚度
const RA = 2.05; // 三個環的外半徑
const RA1 = 1.85;
const RA2 = 1.65;
// 三組樞銷:徑向從內環寬度的中間伸到外環的外緣(各環自己的局部座標),穿過相接的兩個環
const ringOf = (r) => ({ outer: r, inner: r - BAND });
const pivot = (outer, inner) => ({ from: inner - BAND / 2, to: outer, outer: ringOf(outer), inner: ringOf(inner) });
export const PIVOTS = [pivot(RA, RA1), pivot(RA1, RA2)]; // A 的上下樞銷 → A¹;A¹ 側面的樞銷 → A²
const AXLE = RA2 - BAND / 2; // 球軸的半長:兩端在 A² 的軸承(環的寬度中間)

/** 座傾斜 tilt(繞前後方向的水平軸)→ 各環與球的四元數(都是世界座標)、A¹ 與 A² 的轉角 */
export function instrument(tilt) {
  const qA = quatAxisAngle(Z, tilt);
  // A¹ 繞 A 的 Y 轉 beta、A² 繞 A¹ 的 Z 轉 gamma 之後,A² 的 X(球軸)要等於 AXIS:
  // Ry(beta)·Rz(gamma)·X = (cosβ cosγ, sinγ, −sinβ cosγ) = 座的座標裡的 AXIS
  const v = quatRotate(quatAxisAngle(Z, -tilt), AXIS);
  const gamma = Math.asin(v[1]);
  const beta = Math.atan2(-v[2], v[0]);
  const qA1 = quatMul(qA, quatAxisAngle(Y, beta));
  const qA2 = quatMul(qA1, quatAxisAngle(Z, gamma));
  const qBall = quatMul(qA2, quatFromZ(X)); // 球的局部 Z(軸)對齊 A² 的局部 X
  return { qA, qA1, qA2, qBall, beta, gamma };
}

const ring = (r, axis) => ({ kind: "cylinder", axis, radius: r, inner: r - BAND, length: BAND });
// 沿 dir(單位軸向)兩端的樞銷,徑向從 from 到 to
const pins = (dir, { from, to }) =>
  [1, -1].map((s) => ({ kind: "cylinder", axis: dir, radius: 0.05, length: to - from, at: dir.map((c) => (c * s * (from + to)) / 2) }));
const up = CENTER.map((c, k) => c - PIVOT[k]); // 座的局部座標裡環心的位置

export default {
  figure: 356,
  parts: [
    {
      id: "base",
      kind: "group",
      pieces: [
        { kind: "box", size: [3.2, 0.2, 3.2], at: [0, -3.35, 0] },
        // 前後兩個軸承座托著耳軸(推斷)
        { kind: "box", size: [0.4, 0.75, 0.2], at: [0, -2.9, 1.25] },
        { kind: "box", size: [0.4, 0.75, 0.2], at: [0, -2.9, -1.25] },
      ],
    },
    // 座與外環 A 是一件:座腳、座頸、環 A、A 頂端與底端接 A¹ 的樞銷,腳底前後伸出的耳軸
    {
      id: "stand",
      kind: "group",
      center: PIVOT,
      pieces: [
        { kind: "lathe", axis: Y, profile: [[0, 0], [1.0, 0], [0.9, 0.25], [0.35, 0.45], [0.22, 0.8], [0.35, 1.0], [0, 1.0]] },
        { kind: "cylinder", axis: Y, radius: 0.08, length: 0.5, at: [0, 1.2, 0] },
        { kind: "cylinder", axis: Z, radius: 0.08, length: 2.8 },
        { ...ring(RA, Z), at: up },
        ...pins(Y, PIVOTS[0]).map((p) => ({ ...p, at: p.at.map((c, k) => c + up[k]) })),
      ],
    },
    { id: "labelA", kind: "group", label: "A" },
    { id: "ringA1", kind: "group", center: CENTER, arrow: false, label: "A¹", labelOffset: [0.6, 1.55, 0], pieces: [ring(RA1, X), ...pins(Z, PIVOTS[1])] },
    { id: "ringA2", kind: "group", center: CENTER, arrow: false, label: "A²", labelOffset: [-1.2, 0.9, 0.5], pieces: [ring(RA2, Y)] },
    {
      id: "ballB",
      kind: "group",
      center: CENTER,
      spin: 1.0,
      label: "B",
      labelOffset: [0, 0, 0],
      pieces: [
        { kind: "sphere", radius: 1.0 },
        { kind: "cylinder", radius: 0.05, length: 2 * AXLE },
        { kind: "box", size: [0.2, 0.2, 0.2], at: [0.95, 0, 0], accent: true },
      ],
    },
  ],
  driver: { part: "stand", type: "rotation", cycle: [-TILT, TILT] },
  target: "ballB", // 軸向保持不變的球
  view: { direction: [0.25, 0.2, 1] },
  pose(v) {
    const tilt = swing(v, -TILT, TILT);
    const g = instrument(tilt);
    const center = quatRotate(g.qA, up).map((c, k) => c + PIVOT[k]);
    const labelA = quatRotate(g.qA, [-1.55, up[1] + 1.35, 0]).map((c, k) => c + PIVOT[k]);
    const ball = quatMul(g.qBall, quatAxisAngle(Z, 8 * v));
    return {
      parts: {
        stand: { rotation: g.qA },
        labelA: { position: labelA },
        ringA1: { position: center, rotation: g.qA1 },
        ringA2: { position: center, rotation: g.qA2 },
        ballB: { position: center, rotation: ball },
      },
      readouts: [],
    };
  },
};
