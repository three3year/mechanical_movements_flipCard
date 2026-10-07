// 第 292 種:凸柱式擒縱(大型時鐘)。大輪的輪緣上交替地在前面與後面立著凸柱;錨形件繞 F 擺動,
// 一個叉瓦(A)在輪的前方作動、另一個(B)在後方作動,凸柱交替地抵在前、後叉瓦上。
// 叉瓦的鎖面是以 F 為圓心的圓弧,所以凸柱抵住叉瓦時輪完全靜止(靜擊式)。輪依原圖箭頭順時針轉,
// 擺每擺一次放走一根凸柱。主動件是錨形件(擺);目標件是大輪(擒縱讓它一根凸柱一根凸柱地放行)。
//
// 由接觸算(models/escapement.js 的 escapeByContact,前後兩層分開算):輪受重錘的固定力矩往順時針轉,
// 凸柱被同一層的叉瓦擋住就停,滑過叉瓦尖端的斜面時推動錨形件,脫開後加速落到另一層的叉瓦上。
// 叉瓦的位置依作圖法:F 在凸柱圓的切線上,凸柱經過叉瓦時是背著 F 走的;前叉瓦 A 從輪外往內伸、
// 後叉瓦 B 從輪緣內側往外伸,錨形件往一邊擺時 A 退出、B 伸進凸柱的路徑。
// 推斷:凸柱的數目與間距、擺幅、叉瓦的寬度;輪軸與錨形件的軸裝在後面的夾板條上(原圖沒畫)。
import { TAU, deg, swing } from "./kit.js";
import { anchorPallet, escapeByContact, placePoly } from "./escapement.js";
import { shape, circle, thickLine } from "./shapes.js";
import { circlePolygon } from "./contact.js";
import { plateBar } from "./supports.js";

const WHEEL = { center: [-2.6, -3.6], radius: 3.9 };
const RS = WHEEL.radius - 0.2; // 凸柱圓
const STUD = 0.07;
export const STUDS = 60; // 一圈的凸柱數(前、後交替)
export const STEP = TAU / STUDS;
export const SWING = deg(5);
export const LIFT = deg(2);
const AT = deg(16); // 叉瓦在輪上的方位
const TANGENT = [Math.sin(AT), -Math.cos(AT)]; // 順時針轉時凸柱的走向
const P0 = [WHEEL.center[0] + RS * Math.cos(AT), WHEEL.center[1] + RS * Math.sin(AT)];
const F = [P0[0] - 4.0 * TANGENT[0], P0[1] - 4.0 * TANGENT[1]];

const pallet = (outside) => anchorPallet({ P: F, O: WHEEL.center, R: RS, at: AT, dir: -1, width: 0.22, lift: LIFT, lock: deg(2.4), back: 0.2, outside });
const A = pallet(false); // 前叉瓦:從輪外往內伸
const B = pallet(true); // 後叉瓦:從輪緣內側往外伸

// 凸柱:偶數根在前面、奇數根在後面
const studs = Array.from({ length: STUDS }, (_, i) => circlePolygon([RS * Math.cos(i * STEP), RS * Math.sin(i * STEP)], STUD, 12));
const layers = studs.map((_, i) => (i % 2 === 0 ? "front" : "back"));

/** 錨形件累計擺動 v → 擺角 */
export const anchorAngle = (v) => swing(v, -SWING, SWING);
export const escapement = {
  ...escapeByContact({
    center: WHEEL.center,
    teeth: studs,
    layers,
    dir: -1,
    period: 4 * SWING,
    pitch: 2 * STEP,
    stops: (v) => [
      { poly: placePoly(A.poly, F, anchorAngle(v)), layer: "front" },
      { poly: placePoly(B.poly, F, anchorAngle(v)), layer: "back" },
    ],
  }),
  period: 4 * SWING,
};
/** 大輪轉角(順時針為負,由接觸算) */
export const wheelAngle = escapement.angle;

// 錨形件(相對 F):前臂到叉瓦 A、後臂到叉瓦 B
const end = (p) => {
  const a = p.psi - p.s * 0.12;
  return [p.L * Math.cos(a), p.L * Math.sin(a)];
};
const arm = (to, bend) => shape(thickLine([[0, 0], ...(bend ? [bend] : []), to], 0.14), [circle(0.06).reverse()]);

export default {
  figure: 292,
  parts: [
    {
      id: "wheel",
      kind: "group",
      center: [...WHEEL.center, 0],
      spin: WHEEL.radius,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(circle(WHEEL.radius), [circle(WHEEL.radius - 0.45).reverse()]), thickness: 0.18, circles: [WHEEL.radius - 0.08] },
        ...studs.map((s, i) => ({ kind: "cylinder", radius: STUD, length: 0.22, at: [RS * Math.cos(i * STEP), RS * Math.sin(i * STEP), i % 2 === 0 ? 0.2 : -0.2], accent: i === 0 })),
        ...Array.from({ length: 6 }, (_, i) => ({ kind: "box", size: [2 * WHEEL.radius - 0.6, 0.18, 0.12], angle: (i * Math.PI) / 6 })),
        { kind: "cylinder", radius: 0.3, length: 0.3 },
        { kind: "cylinder", radius: 0.1, length: 0.7, at: [0, 0, -0.4] }, // 輪軸,往後伸進夾板條
      ],
    },
    {
      id: "anchor",
      kind: "group",
      center: [...F, 0],
      arrow: false,
      label: "F",
      labelOffset: [0, 0.35, 0.4],
      pieces: [
        { kind: "plate", shape: arm(end(A), [-0.35, -2.0]), thickness: 0.1, at: [0, 0, 0.4] },
        { kind: "plate", shape: shape(A.poly), thickness: 0.2, at: [0, 0, 0.2] },
        { kind: "plate", shape: arm(end(B), [1.3, -2.0]), thickness: 0.1, at: [0, 0, -0.42] },
        { kind: "plate", shape: shape(B.poly), thickness: 0.2, at: [0, 0, -0.2] },
        { kind: "cylinder", radius: 0.32, inner: 0.1, length: 0.9 },
        { kind: "cylinder", radius: 0.1, length: 0.7, at: [0, 0, -0.75] }, // 錨形件的軸,往後伸進夾板條
      ],
    },
    { id: "frame", kind: "group", pieces: plateBar({ points: [WHEEL.center, F], z: -1.1, width: 0.36, boss: 0.3 }) },
    { id: "labelA", kind: "group", center: [...F, 0], label: "A", labelOffset: [end(A)[0] - 0.35, end(A)[1], 0.5] },
    { id: "labelB", kind: "group", center: [...F, 0], label: "B", labelOffset: [1.3 + 0.3, -2.0, 0.5] },
  ],
  // 動力重演:只推錨形件;大輪受固定的力矩(重錘)往順時針轉,前後凸柱交替地被叉瓦擋住、放行
  replay: {
    to: 8 * SWING,
    free: { wheel: { pivot: [...WHEEL.center, 0], spring: -1, gravity: false } },
    ignore: [["wheel", "frame"]], // 輪軸插在夾板條的孔裡(孔沒畫出來)
    expect: [
      { at: 2 * SWING, part: "wheel", label: "擺擺過一次,放走一根凸柱" },
      { at: 4 * SWING, part: "wheel", label: "擺一個來回,前後各放走一根" },
      { part: "wheel", label: "擺兩個來回,放走四根凸柱", quote: "凸柱以相同方式配置,交替地抵在前方與後方的叉瓦上" },
    ],
  },
  driver: { part: "anchor", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheel", // 大輪:擒縱讓它一根凸柱一根凸柱地放行
  view: { direction: [0.25, 0.12, 1], fit: ["anchor"] },
  pose(v) {
    return { parts: { anchor: { angle: anchorAngle(v) }, wheel: { angle: wheelAngle(v) } }, readouts: [] };
  },
};
