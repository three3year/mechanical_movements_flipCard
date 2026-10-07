// 第 290 種:另一種擺式擒縱。擒縱輪 D 在一個圓環形框架的中間;框架從上端 C 吊著,下端 K 接著擺,
// 環的內側左右各有一個叉瓦 B、A。框架隨擺左右擺動,兩個叉瓦輪流擋住、放開輪的齒(E、H 是其中兩個齒),
// 擺每擺一次,輪轉過半個齒。主動件是框架(擺);目標件是擒縱輪 D(擒縱讓輪系一齒一齒地放行)。
//
// 由接觸算(models/escapement.js 的 escapeByContact):輪受發條的固定力矩往順時針轉(原圖輪上方的箭頭朝右;
// 以前的模型是逆時針,已更正),齒的直面抵在叉瓦上就停;框架往右擺時叉瓦 A 往外退,齒從 A 的內端滑脫,
// 輪加速轉到下一個齒碰上已經伸進來的 B 為止;往左擺時反過來。叉瓦隨框架繞 C 擺,擋住齒的面會跟著微微升降,
// 所以鎖住時輪也會被推回一點(這種擒縱的叉瓦面不與 C 同心)。
// 推斷:齒數(依原圖七齒)、齒形(原圖的鋸齒輪,直面略往前勾);擺幅;輪軸與 C 的樞軸裝在後面的夾板條上(原圖沒畫)。
import { TAU, deg, swing } from "./kit.js";
import { escapeByContact, placePoly, toothedWheel } from "./escapement.js";
import { shape, circle, rect } from "./shapes.js";
import { plateBar } from "./supports.js";

export const N = 7;
export const PITCH = TAU / N;
export const SWING = deg(5);
const C = [0, 2.3];
const D = [0, 0];
const R = 0.78;
const ROOT = 0.5;

// 鋸齒:直面在前(順時針轉時在前,角度小的一側),齒尖略往前勾;斜背往後降到下一齒的齒根
const WHEEL = toothedWheel({ teeth: N, profile: [[ROOT, 0.05], [R, 0], [R, 0.06], [ROOT, 1.0]], bore: 0.08 });

// 框架(相對 C):直桿往下到圓環,圓環內左右兩個叉瓦,再往下接擺桿
const RING = { y: D[1] - C[1], outer: 1.2, inner: 1.03 };
// 兩個叉瓦一起往上移 0.055:框架繞 C 擺,叉瓦在擺到兩端時一高一低,不移的話齒停在 A、B 的位置相差 0.28 / 0.72 個齒距;
// 移了之後每擺一次約放走半齒(0.44 / 0.56),再多移就卡住
const DY = 0.055;
const PALLET_A = rect(0.32, 0.14, 0.89, RING.y - 0.07 + DY); // 右:上面擋住往下走的齒
const PALLET_B = rect(0.32, 0.14, -0.89, RING.y + 0.07 + DY); // 左:下面擋住往上走的齒

/** 框架累計擺動 v → 擺角 */
export const frameAngle = (v) => swing(v, -SWING, SWING);
export const escapement = {
  ...escapeByContact({ center: D, teeth: WHEEL.teeth, dir: -1, period: 4 * SWING, stops: (v) => [PALLET_A, PALLET_B].map((p) => placePoly(p, C, frameAngle(v))) }),
  period: 4 * SWING,
};
/** 擒縱輪轉角(順時針為負,由接觸算) */
export const wheelAngle = escapement.angle;
// 原圖的字母 E、H 標在兩個齒上:取起始姿勢時離原圖位置最近的齒,字母跟著那一齒走
const tipAt = (i, w) => [0.85 * R * Math.cos((i + 0.03) * PITCH + w), 0.85 * R * Math.sin((i + 0.03) * PITCH + w), 0];
const nearestTooth = (a) => {
  let best = 0;
  for (let i = 1; i < N; i++) {
    const d = (j) => Math.abs(Math.atan2(Math.sin((j + 0.03) * PITCH + wheelAngle(0) - a), Math.cos((j + 0.03) * PITCH + wheelAngle(0) - a)));
    if (d(i) < d(best)) best = i;
  }
  return best;
};
const TOOTH_E = nearestTooth(deg(29));
const TOOTH_H = nearestTooth(deg(-123));

const frame = [
  { kind: "plate", shape: shape(circle(RING.outer), [circle(RING.inner).reverse()]), thickness: 0.14, at: [0, RING.y, 0] },
  { kind: "plate", shape: shape(rect(0.14, 1.12, 0, -0.56)), thickness: 0.14 },
  { kind: "plate", shape: shape(rect(0.14, 1.5, 0, RING.y - RING.outer - 0.75)), thickness: 0.14 },
  { kind: "plate", shape: shape(PALLET_A), thickness: 0.22 },
  { kind: "plate", shape: shape(PALLET_B), thickness: 0.22 },
  { kind: "cylinder", radius: 0.12, inner: 0.05, length: 0.3 },
  { kind: "cylinder", radius: 0.05, length: 0.6, at: [0, 0, -0.3] }, // C 的樞軸,往後伸進夾板條
];

export default {
  figure: 290,
  parts: [
    {
      id: "wheelD",
      kind: "group",
      spin: R,
      label: "D",
      labelOffset: [0.12, -0.12, 0.3],
      pieces: [
        { kind: "plate", shape: { outline: WHEEL.outline, holes: WHEEL.holes }, thickness: 0.16 },
        { kind: "cylinder", radius: 0.16, length: 0.24 },
        { kind: "cylinder", radius: 0.05, length: 0.5, at: [0, 0, -0.25] }, // 輪軸,往後伸進夾板條
        { kind: "cylinder", radius: 0.05, length: 0.2, at: [0.3, 0, 0.06], accent: true },
      ],
    },
    { id: "frame", kind: "group", center: [...C, 0], arrow: false, label: "C", labelOffset: [0.25, -0.3, 0.3], pieces: frame },
    { id: "plate", kind: "group", pieces: plateBar({ points: [D, C], z: -0.45, width: 0.2, boss: 0.14 }) },
    { id: "labelA", kind: "group", center: [0.9, 0.14, 0], label: "A", labelOffset: [0.15, 0.1, 0.3] },
    { id: "labelB", kind: "group", center: [-0.9, -0.14, 0], label: "B", labelOffset: [-0.15, 0.1, 0.3] },
    { id: "labelK", kind: "group", center: [0, -1.55, 0], label: "K", labelOffset: [0.25, 0, 0.3] },
    { id: "labelE", kind: "group", label: "E", labelOffset: [0, 0, 0.3] },
    { id: "labelH", kind: "group", label: "H", labelOffset: [0, 0, 0.3] },
  ],
  // 動力重演:只推框架;擒縱輪受固定的力矩(發條)往順時針轉,由叉瓦擋住、放行
  replay: {
    to: 8 * SWING,
    free: { wheelD: { pivot: [...D, 0], spring: -1, gravity: false } },
    ignore: [["wheelD", "plate"]], // 輪軸插在夾板條的孔裡(孔沒畫出來)
    expect: [
      { at: 2 * SWING, part: "wheelD", label: "框架擺過一次,輪轉過半個齒" },
      { at: 4 * SWING, part: "wheelD", label: "框架一個來回,輪轉過一個齒" },
      { part: "wheelD", label: "框架兩個來回,輪轉過兩個齒" },
    ],
  },
  driver: { part: "frame", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheelD", // 擒縱輪:擒縱讓它一齒一齒地放行
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const w = wheelAngle(v);
    return { parts: { frame: { angle: frameAngle(v) }, wheelD: { angle: w }, labelE: { position: tipAt(TOOTH_E, w) }, labelH: { position: tipAt(TOOTH_H, w) } }, readouts: [] };
  },
};
