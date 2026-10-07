// 第 288 種:回退式擒縱(時鐘)。錨形件 H–L–K 由擺帶動,繞軸 a 振動;兩端的叉瓦 H、K 之間是擒縱輪 A。
// 輪依原圖箭頭逆時針轉,齒從右邊的叉瓦 K 走向左邊的叉瓦 H。叉瓦的鎖面不與軸 a 同心:齒落到叉瓦上之後,
// 擺繼續外擺時叉瓦再伸進去,把輪往回推一點(回退);擺回來時齒滑過叉瓦尖端的斜面 c、e 與 d、b,給擺一點衝擊。
// 擺每擺一次,輪轉過半個齒。主動件是錨形件(擺);目標件是擒縱輪 A——擒縱的目的是讓輪系一齒一齒地放行。
//
// 由接觸算:輪受重錘的固定力矩往逆時針轉,被叉瓦擋住就停、被叉瓦推就退;放開後加速轉到另一個叉瓦上
// (models/escapement.js 的 escapeByContact)。叉瓦依格拉漢式的作圖:樞軸 a 在兩個叉瓦處齒尖圓切線的交點。
// 推斷:擺幅、衝擊角、回退量、叉瓦的寬度;輪軸與錨形件的軸裝在後面的夾板條上(原圖沒畫)。
import { TAU, deg, swing } from "./kit.js";
import { anchorPallet, escapeByContact, placePoly, toothedWheel } from "./escapement.js";
import { shape, thickLine, circle } from "./shapes.js";
import { plateBar } from "./supports.js";

export const N = 30;
export const PITCH = TAU / N;
export const SWING = deg(5);
export const LIFT = deg(3);
const R = 2.2; // 齒尖圓
const ROOT = 1.78;
const A = [0, -1.6];
const SPAN = 3.75 * PITCH; // 叉瓦各在正上方左右 3.75 齒(兩叉瓦相隔 7.5 齒)
const AXIS = [A[0], A[1] + R / Math.cos(SPAN)];

// 齒:斜背從齒根升到齒尖,直面(逆時針那一側,轉動時在前)落回齒根
const WHEEL = toothedWheel({ teeth: N, profile: [[ROOT, 0], [R, 0.6], [R, 0.66], [ROOT, 0.74]] });
const pallet = (at) => anchorPallet({ P: AXIS, O: A, R, at, dir: 1, width: 0.17, lift: LIFT, recoil: 0.35, back: 0.14 });
const K = pallet(Math.PI / 2 - SPAN);
const H = pallet(Math.PI / 2 + SPAN);
// 叉瓦外端(繞 a)接上錨形件的臂
const tail = (p) => [p.L * Math.cos(p.psi - p.s * 0.07), p.L * Math.sin(p.psi - p.s * 0.07)];

/** 錨形件累計擺動 v → 擺角 */
export const anchorAngle = (v) => swing(v, -SWING, SWING);
export const escapement = {
  ...escapeByContact({ center: A, teeth: WHEEL.teeth, dir: 1, period: 4 * SWING, start: deg(1), stops: (v) => [K.poly, H.poly].map((p) => placePoly(p, AXIS, anchorAngle(v))) }),
  period: 4 * SWING,
};
/** 擒縱輪轉角(逆時針為正,由接觸算) */
export const wheelAngle = escapement.angle;

// 錨形件(相對軸 a):橫樑 L 與兩支往下的臂,臂在輪的前面一層,叉瓦伸到輪那一層
const arm = (p) => thickLine([[0, 0], [tail(p)[0] * 0.55, 0.15], tail(p)], 0.2);

export default {
  figure: 288,
  parts: [
    {
      id: "wheelA",
      kind: "group",
      center: [...A, 0],
      spin: R,
      label: "A",
      labelOffset: [0.3, -0.15, 0.3],
      pieces: [
        { kind: "plate", shape: shape(WHEEL.outline, [circle(ROOT - 0.18).reverse()]), thickness: 0.12 },
        ...Array.from({ length: 4 }, (_, i) => ({ kind: "box", size: [2 * (ROOT - 0.2), 0.1, 0.1], angle: (i * Math.PI) / 4 + 0.3 })),
        { kind: "cylinder", radius: 0.2, length: 0.2 },
        { kind: "cylinder", radius: 0.07, length: 0.56, at: [0, 0, -0.3] }, // 輪軸,往後伸進夾板條
        { kind: "box", size: [0.16, 0.16, 0.16], at: [1.5, 0, 0.1], accent: true },
      ],
    },
    {
      id: "anchor",
      kind: "group",
      center: [...AXIS, 0],
      arrow: false,
      label: "L",
      labelOffset: [0, 0.4, 0.3],
      pieces: [
        { kind: "plate", shape: shape(arm(K)), thickness: 0.1, at: [0, 0, 0.17] },
        { kind: "plate", shape: shape(arm(H)), thickness: 0.1, at: [0, 0, 0.17] },
        { kind: "plate", shape: shape(K.poly), thickness: 0.32, at: [0, 0, 0.06] },
        { kind: "plate", shape: shape(H.poly), thickness: 0.32, at: [0, 0, 0.06] },
        { kind: "cylinder", radius: 0.18, inner: 0.07, length: 0.14, at: [0, 0, 0.17] },
        { kind: "cylinder", radius: 0.07, length: 0.7, at: [0, 0, -0.17] }, // 錨形件的軸,往後伸進夾板條
      ],
    },
    { id: "frame", kind: "group", pieces: plateBar({ points: [A, AXIS], z: -0.48 }) },
    { id: "labelA", kind: "group", center: [...AXIS, 0], label: "a", labelOffset: [0.32, -0.22, 0.4] },
    { id: "labelH", kind: "group", center: [...AXIS, 0], label: "H", labelOffset: [tail(H)[0] - 0.35, tail(H)[1] + 0.2, 0.3] },
    { id: "labelK", kind: "group", center: [...AXIS, 0], label: "K", labelOffset: [tail(K)[0] + 0.35, tail(K)[1] + 0.2, 0.3] },
  ],
  // 動力重演:只推錨形件;擒縱輪受固定的力矩(重錘)往逆時針轉,由叉瓦擋住、推回、放行
  replay: {
    to: 8 * SWING,
    free: { wheelA: { pivot: [...A, 0], spring: 1, gravity: false } },
    ignore: [["wheelA", "frame"]], // 輪軸插在夾板條的孔裡(孔沒畫出來)
    expect: [
      { at: 2 * SWING, part: "wheelA", label: "擺擺過一次,輪轉過半個齒", quote: "擺每次擺動,齒的末端會沿著表面 c、e 和 d、b 滑動" },
      { at: 4 * SWING, part: "wheelA", label: "擺一個來回,輪轉過一個齒" },
      { part: "wheelA", label: "擺兩個來回,輪轉過兩個齒" },
    ],
  },
  driver: { part: "anchor", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheelA", // 擒縱輪:擒縱讓它一齒一齒地放行
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    return { parts: { anchor: { angle: anchorAngle(v) }, wheelA: { angle: wheelAngle(v) } }, readouts: [] };
  },
};
