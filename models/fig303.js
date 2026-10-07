// 第 303 種:靜擊式擺鐘擒縱。錨形件繞上方的軸 C 擺動,由擺(PEN.,下端 F)帶動;擒縱叉瓦 E 的內側面與 D 的外側面
// 都與錨形件的擺動軸同心,所以齒抵住叉瓦時輪不會回退,只有滑過衝擊面時才前進。擺每擺一次,擒縱輪轉過半個齒
// (原圖輪上方的箭頭朝右:順時針)。主動件是擺(連同錨形件);目標件是擒縱輪(擒縱讓它一齒一齒地放行)。
//
// 由接觸算(models/escapement.js 的 escapeByContact、anchorPallet,與第 289 種相同的作法):輪受重錘的固定力矩
// 順時針轉,被叉瓦擋住就停,放開後加速轉到另一個叉瓦的鎖面上。軸 C 在兩個叉瓦處齒尖圓切線的交點。
// 順時針轉時齒從左邊的 D 走向右邊的 E:D 擋住朝 C 走來的齒(鎖在外側面)、E 擋住背著 C 走的齒(鎖在內側面),與原文相符。
// 推斷:擺幅、齒數(依原圖約三十齒)、衝擊角、叉瓦的寬度;輪軸與軸 C 裝在後面的夾板條上(原圖沒畫)。
import { TAU, deg, swing } from "./kit.js";
import { anchorPallet, escapeByContact, placePoly, toothedWheel } from "./escapement.js";
import { shape, thickLine, circle } from "./shapes.js";
import { plateBar } from "./supports.js";

export const N = 30;
export const PITCH = TAU / N;
export const SWING = deg(4.5);
export const LIFT = deg(3);
const WHEEL = [0.15, -0.2];
const RW = 1.55;
const ROOT = 1.07;
const SPAN = 4.75 * PITCH; // 兩叉瓦相隔 9.5 齒
const C = [WHEEL[0], WHEEL[1] + RW / Math.cos(SPAN)];

// 順時針轉:前面(角度小的一側)往前傾
const TEETH = toothedWheel({ teeth: N, profile: [[ROOT, 0.52], [RW, 0.3], [RW, 0.36], [ROOT, 1.0]] });
const pallet = (at) => anchorPallet({ P: C, O: WHEEL, R: RW, at, dir: -1, width: 0.09, lift: LIFT, back: 0.13, lock: deg(1.5) });
const D = pallet(Math.PI / 2 + SPAN); // 左
const E = pallet(Math.PI / 2 - SPAN); // 右
const tail = (p) => [p.L * Math.cos(p.psi - p.s * 0.08), p.L * Math.sin(p.psi - p.s * 0.08)];

/** 擺累計擺動 v → 擺角 */
export const pendulumAngle = (v) => swing(v, -SWING, SWING);
export const escapement = {
  ...escapeByContact({ center: WHEEL, teeth: TEETH.teeth, dir: -1, period: 4 * SWING, stops: (v) => [D.poly, E.poly].map((p) => placePoly(p, C, pendulumAngle(v))) }),
  period: 4 * SWING,
};

/** 擺累計擺動 v → 擺角、擒縱輪轉角(順時針為負,由接觸算) */
export function deadbeat(v) {
  return { pendulum: pendulumAngle(v), wheel: escapement.angle(v) };
}

// 錨形件(相對 C):兩臂斜下到叉瓦 D、E
const anchor = shape(thickLine([tail(D), [tail(D)[0] * 0.6, tail(D)[1] * 0.45], [0, 0], [tail(E)[0] * 0.6, tail(E)[1] * 0.45], tail(E)], 0.2), [circle(0.09).reverse()]);
const ROD = 4.6; // 擺桿長(C 到 F)

export default {
  figure: 303,
  parts: [
    {
      id: "wheel",
      kind: "group",
      center: [...WHEEL, 0],
      spin: RW,
      pieces: [
        { kind: "plate", shape: shape(TEETH.outline, [circle(ROOT - 0.12).reverse()]), thickness: 0.12 },
        ...Array.from({ length: 4 }, (_, i) => ({ kind: "box", size: [2 * (ROOT - 0.14), 0.1, 0.1], angle: (i * Math.PI) / 4 + 0.3 })),
        { kind: "cylinder", radius: 0.2, length: 0.2 },
        { kind: "cylinder", radius: 0.07, length: 0.56, at: [0, 0, -0.3] }, // 輪軸,往後伸進夾板條
        { kind: "box", size: [0.12, 0.12, 0.14], at: [RW - 0.6, 0, 0.08], accent: true },
      ],
    },
    {
      id: "anchor",
      kind: "group",
      center: [...C, 0],
      arrow: false,
      pieces: [
        { kind: "plate", shape: anchor, thickness: 0.1, at: [0, 0, 0.18] },
        { kind: "plate", shape: shape(D.poly), thickness: 0.32, at: [0, 0, 0.07] },
        { kind: "plate", shape: shape(E.poly), thickness: 0.32, at: [0, 0, 0.07] },
        { kind: "cylinder", radius: 0.2, inner: 0.09, length: 0.14, at: [0, 0, 0.18] },
        { kind: "cylinder", radius: 0.09, length: 0.7, at: [0, 0, -0.17] }, // 軸 C,往後伸進夾板條
        // 擺桿 PEN.,下端 F(在輪的前面一層)
        { kind: "box", size: [0.08, ROD, 0.06], at: [0, -ROD / 2, 0.3] },
        { kind: "cylinder", radius: 0.12, length: 0.12, at: [0, -ROD, 0.3] },
      ],
    },
    { id: "frame", kind: "group", pieces: plateBar({ points: [WHEEL, C], z: -0.48 }) },
    { id: "labelC", kind: "group", center: [...C, 0], label: "C", labelOffset: [0, 0.32, 0.3] },
    { id: "labelD", kind: "group", center: [...C, 0], label: "D", labelOffset: [tail(D)[0] - 0.3, tail(D)[1] + 0.15, 0.3] },
    { id: "labelE", kind: "group", center: [...C, 0], label: "E", labelOffset: [tail(E)[0] + 0.3, tail(E)[1] + 0.15, 0.3] },
    { id: "labelF", kind: "group", center: [C[0], C[1] - ROD, 0], label: "F", labelOffset: [0.3, 0, 0.3] },
  ],
  // 動力重演:只推擺;擒縱輪受固定的力矩(重錘)順時針轉,由叉瓦擋住、放行
  replay: {
    to: 8 * SWING,
    free: { wheel: { pivot: [...WHEEL, 0], spring: -1, gravity: false } },
    ignore: [["wheel", "frame"]], // 輪軸插在夾板條的孔裡(孔沒畫出來)
    expect: [
      { at: 2 * SWING, part: "wheel", label: "擺擺過一次,輪轉過半個齒" },
      { at: 4 * SWING, part: "wheel", label: "擺一個來回,輪轉過一個齒" },
      { part: "wheel", label: "擺兩個來回,輪轉過兩個齒", quote: "皆與擒縱叉瓦擺動所繞的軸同心,因此不會產生回退" },
    ],
  },
  driver: { part: "anchor", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheel", // 擒縱輪:擒縱讓它一齒一齒地放行
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const d = deadbeat(v);
    return { parts: { anchor: { angle: d.pendulum }, wheel: { angle: d.wheel } }, readouts: [] };
  },
};
