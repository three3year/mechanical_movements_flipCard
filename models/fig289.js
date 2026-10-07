// 第 289 種:靜止式(靜擊式)擒縱(時鐘)。與第 288 種相同的部件:錨形件 L 繞軸 a 振動,兩端叉瓦夾著擒縱輪 A。
// 叉瓦的鎖面切成與軸 a 同心的曲線,所以齒抵住叉瓦的期間輪完全靜止,只有齒滑過叉瓦尖端的衝擊面 c、e 與 d、b 時才前進。
// 輪依原圖箭頭(左下方朝右下)逆時針轉(以前的模型是順時針,與箭頭相反,已更正),擺每擺一次放走半個齒。主動件是錨形件(擺);目標件是擒縱輪 A(擒縱讓輪系一齒一齒地放行)。
//
// 由接觸算(models/escapement.js 的 escapeByContact):輪受重錘的固定力矩往逆時針轉,被叉瓦擋住就停,
// 放開後加速轉到另一個叉瓦上。叉瓦依格拉漢式的作圖:軸 a 在兩個叉瓦處齒尖圓切線的交點。
// 偏離插圖:原圖兩個叉瓦在輪心稍下方的左右兩側;切線作圖的叉瓦在輪心上方(兩叉瓦相隔 9.5 齒),
// 弧形臂因此較短。推斷:擺幅、衝擊角、叉瓦的寬度;輪軸與錨形件的軸裝在後面的夾板條上(原圖沒畫)。
import { TAU, deg, swing } from "./kit.js";
import { anchorPallet, escapeByContact, placePoly, toothedWheel } from "./escapement.js";
import { shape, thickLine, circle, arcPoints } from "./shapes.js";
import { plateBar } from "./supports.js";

export const N = 30;
export const PITCH = TAU / N;
export const SWING = deg(4.5);
export const LIFT = deg(3);
const R = 1.5;
const ROOT = 1.02;
const A = [0, -0.55];
const SPAN = 4.75 * PITCH;
const AXIS = [A[0], A[1] + R / Math.cos(SPAN)];

// 逆時針轉:前面(轉動時在前)在每齒角度大的那一側,往前傾(齒尖在齒根前面),叉瓦伸進齒間時碰不到它
const WHEEL = toothedWheel({ teeth: N, profile: [[ROOT, 0], [R, 0.64], [R, 0.7], [ROOT, 0.48]] });
const pallet = (at) => anchorPallet({ P: AXIS, O: A, R, at, dir: 1, width: 0.09, lift: LIFT, back: 0.13, lock: deg(1.5) });
const K = pallet(Math.PI / 2 - SPAN); // 右:齒從這裡進來(逆時針時齒由右往左經過上方)
const H = pallet(Math.PI / 2 + SPAN);
const tail = (p) => [p.L * Math.cos(p.psi - p.s * 0.08), p.L * Math.sin(p.psi - p.s * 0.08)];

/** 錨形件累計擺動 v → 擺角 */
export const anchorAngle = (v) => swing(v, -SWING, SWING);
export const escapement = {
  ...escapeByContact({ center: A, teeth: WHEEL.teeth, dir: 1, period: 4 * SWING, stops: (v) => [K.poly, H.poly].map((p) => placePoly(p, AXIS, anchorAngle(v))) }),
  period: 4 * SWING,
};
/** 擒縱輪轉角(逆時針為正,由接觸算) */
export const wheelAngle = escapement.angle;

// 錨形件(相對軸 a):直桿 L 往下,接一道在輪前方、圍著輪上半部的弧形臂,兩端接叉瓦
const toWheel = (p) => [p[0] + AXIS[0] - A[0], p[1] + AXIS[1] - A[1]];
const fromWheel = (p) => [p[0] - AXIS[0] + A[0], p[1] - AXIS[1] + A[1]];
const R_ARM = Math.hypot(...toWheel(tail(K)));
const arcFrom = (p) => Math.atan2(toWheel(p)[1], toWheel(p)[0]);
const arc = arcPoints(R_ARM, arcFrom(tail(H)), arcFrom(tail(K))).map(fromWheel);
const STEM = A[1] + R_ARM - AXIS[1];

export default {
  figure: 289,
  parts: [
    {
      id: "wheelA",
      kind: "group",
      center: [...A, 0],
      spin: R,
      label: "A",
      labelOffset: [0, 0.35, 0.3],
      pieces: [
        { kind: "plate", shape: shape(WHEEL.outline, [circle(ROOT - 0.12).reverse()]), thickness: 0.12 },
        ...Array.from({ length: 4 }, (_, i) => ({ kind: "box", size: [2 * (ROOT - 0.14), 0.1, 0.1], angle: (i * Math.PI) / 4 + 0.3 })),
        { kind: "cylinder", radius: 0.2, length: 0.2 },
        { kind: "cylinder", radius: 0.07, length: 0.56, at: [0, 0, -0.3] }, // 輪軸,往後伸進夾板條
        { kind: "box", size: [0.12, 0.12, 0.14], at: [0.95, 0, 0.08], accent: true },
      ],
    },
    {
      id: "anchor",
      kind: "group",
      center: [...AXIS, 0],
      arrow: false,
      label: "L",
      labelOffset: [-0.3, -0.5, 0.3],
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0, 0], [0, STEM]], 0.24)), thickness: 0.1, at: [0, 0, 0.18] },
        { kind: "plate", shape: shape(thickLine(arc, 0.22)), thickness: 0.1, at: [0, 0, 0.18] },
        { kind: "plate", shape: shape(K.poly), thickness: 0.32, at: [0, 0, 0.07] },
        { kind: "plate", shape: shape(H.poly), thickness: 0.32, at: [0, 0, 0.07] },
        { kind: "cylinder", radius: 0.18, inner: 0.07, length: 0.14, at: [0, 0, 0.18] },
        { kind: "cylinder", radius: 0.07, length: 0.7, at: [0, 0, -0.17] }, // 錨形件的軸,往後伸進夾板條
      ],
    },
    { id: "frame", kind: "group", pieces: plateBar({ points: [A, AXIS], z: -0.48 }) },
    { id: "labelA", kind: "group", center: [...AXIS, 0], label: "a", labelOffset: [0.4, 0.1, 0.4] },
  ],
  // 動力重演:只推錨形件;擒縱輪受固定的力矩(重錘)往逆時針轉,由叉瓦擋住、放行
  replay: {
    to: 8 * SWING,
    free: { wheelA: { pivot: [...A, 0], spring: 1, gravity: false } },
    ignore: [["wheelA", "frame"]], // 輪軸插在夾板條的孔裡(孔沒畫出來)
    expect: [
      { at: 2 * SWING, part: "wheelA", label: "擺擺過一次,輪轉過半個齒" },
      { at: 4 * SWING, part: "wheelA", label: "擺一個來回,輪轉過一個齒" },
      { part: "wheelA", label: "擺兩個來回,輪轉過兩個齒", quote: "在齒抵住叉瓦的期間,輪保持完全靜止" },
    ],
  },
  driver: { part: "anchor", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheelA", // 擒縱輪:擒縱讓它一齒一齒地放行
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    return { parts: { anchor: { angle: anchorAngle(v) }, wheelA: { angle: wheelAngle(v) } }, readouts: [] };
  },
};
