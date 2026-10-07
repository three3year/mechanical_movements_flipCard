// 第 302 種:擺輪式擒縱。D 是擒縱輪(冠狀輪,從側面看是一條上緣帶齒的輪緣),下方是它軸上的小齒輪;
// C 是擺輪:一根兩端裝球的擺桿,和叉瓦 A、B 一起裝在水平的立軸上,跨在冠狀輪上方。
// 冠狀輪的齒推開一個叉瓦、從它的尖端滑過,立軸跟著轉,另一個叉瓦伸進對面的齒間擋住齒;擺輪擺回來時再換過來。
// 冠狀輪每擺一次轉過半個齒(原圖前緣的箭頭朝右)。主動件是擺輪;目標件是冠狀輪 D(擒縱讓它一齒一齒地放行)。
//
// 由接觸算(models/escapement.js 的 crownByContact,與第 299 種相同的作法):冠狀輪受發條的固定力矩轉動,
// 叉瓦只在輪的前、後兩端碰到齒,在那兩個切面上算齒與叉瓦的接觸。
// 推斷:齒數與擺幅、叉瓦的長短與夾角(立軸在齒尖上方 0.09、叉瓦離軸 0.25、兩叉瓦相隔 96°);
// 擺桿在立軸上斜 55°(照原圖擺桿的方向);冠狀輪軸與立軸的軸承(原圖沒畫)。
import { Y, TAU, deg, swing } from "./kit.js";
import { crownByContact, placePoly, sawCrown } from "./escapement.js";
import { shape, thickLine, circle } from "./shapes.js";

export const N = 15;
export const PITCH = TAU / N;
export const SWING = deg(36);
const R = 1.9;
const RIM = 0.4;
const TOOTH = 0.35;
const STAFF_Y = RIM / 2 + TOOTH + 0.09; // 立軸(C)離冠狀輪中心的高度
const ARM = 2.3;
const TILT = deg(-55); // 擺桿在立軸上的方向
const FLAG = { length: 0.25, width: 0.1 };
const flagLine = (a) => thickLine([[0, 0], [FLAG.length * Math.cos(a), FLAG.length * Math.sin(a)]], FLAG.width);
const FRONT = flagLine(deg(-42)); // 叉瓦 A(前)
const BACK = flagLine(deg(-138)); // 叉瓦 B(後)

/** 擺輪累計擺動 v → 擺角(不含擺桿的傾斜) */
export const balanceSwing = (v) => swing(v, -SWING, SWING);
export const escapement = {
  ...crownByContact({
    radius: R - 0.03,
    teeth: N,
    height: TOOTH,
    base: RIM / 2,
    front: (v) => [placePoly(FRONT, [0, STAFF_Y], balanceSwing(v))],
    back: (v) => [placePoly(BACK, [0, STAFF_Y], balanceSwing(v))],
    period: 4 * SWING,
  }),
  period: 4 * SWING,
};

/** 擺輪累計擺動 v → 擺輪角(含擺桿的傾斜)、冠狀輪轉角(由接觸算) */
export function balance(v) {
  return { angle: balanceSwing(v) + TILT, crown: escapement.angle(v) };
}

const flag = (line) => shape(placePoly(line, [0, 0], -TILT));

export default {
  figure: 302,
  parts: [
    {
      id: "crownD",
      kind: "group",
      axis: Y,
      spin: R,
      spinOffset: -RIM / 2,
      label: "D",
      labelOffset: [-1.2, 0.3, 1.0],
      pieces: [
        { kind: "cylinder", radius: R, inner: R - 0.1, length: RIM },
        { kind: "plate", shape: shape(circle(R - 0.05), [circle(0.1).reverse()]), thickness: 0.08, at: [0, 0, -RIM / 2 + 0.04] },
        ...sawCrown({ teeth: N, radius: R - 0.03, height: TOOTH, base: RIM / 2, thick: 0.08 }),
        { kind: "cylinder", radius: 0.07, length: 2.6, at: [0, 0, -1.4] },
        { kind: "gear", teeth: 10, radius: 0.32, width: 0.4, at: [0, 0, -2.35] },
      ],
    },
    {
      id: "balanceC",
      kind: "group",
      center: [0, STAFF_Y, 0],
      label: "C",
      labelOffset: [0.25, 0.3, R + 0.5],
      spin: 0.3,
      pieces: [
        { kind: "cylinder", radius: 0.05, length: 2 * R + 2.2 },
        { kind: "cylinder", radius: 0.14, inner: 0.06, length: 0.16, at: [0, 0, R + 0.25] },
        // 擺桿與兩個球
        { kind: "plate", shape: shape(thickLine([[-ARM, 0], [ARM, 0]], 0.1)), thickness: 0.08, at: [0, 0, R + 0.45] },
        { kind: "sphere", radius: 0.42, at: [ARM, 0, R + 0.45] },
        { kind: "sphere", radius: 0.42, at: [-ARM, 0, R + 0.45], accent: true },
        // 叉瓦 A(前)、B(後)
        { kind: "plate", shape: flag(FRONT), thickness: 0.12, at: [0, 0, R - 0.03] },
        { kind: "plate", shape: flag(BACK), thickness: 0.12, at: [0, 0, -R + 0.03] },
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 立軸兩端的軸承座、冠狀輪軸下端的軸承(原圖沒畫)
        ...[-1, 1].map((k) => ({ kind: "cylinder", radius: 0.14, inner: 0.05, length: 0.14, at: [0, STAFF_Y, k * (R + 1.05)] })),
        ...[-1, 1].map((k) => ({ kind: "box", size: [0.18, STAFF_Y + 2.65, 0.14], at: [0, (STAFF_Y - 2.75) / 2 - 0.05, k * (R + 1.05)] })),
        { kind: "box", size: [0.3, 0.14, 2 * R + 2.24], at: [0, -2.82, 0] },
        { kind: "cylinder", axis: Y, radius: 0.16, inner: 0.07, length: 0.14, at: [0, -2.65, 0] },
      ],
    },
    { id: "labelA", kind: "group", center: [0.45, STAFF_Y - 0.3, R], label: "A", labelOffset: [0.2, 0, 0.3] },
    { id: "labelB", kind: "group", center: [-0.45, STAFF_Y - 0.3, -R], label: "B", labelOffset: [-0.2, 0, 0.3] },
  ],
  // 動力重演:只推擺輪;冠狀輪受固定的力矩(發條)轉動,由前後兩個叉瓦輪流擋住、放行
  replay: {
    to: 8 * SWING,
    free: { crownD: { pivot: [0, 0, 0], spring: 1, gravity: false } },
    ignore: [["crownD", "frame"]], // 冠狀輪的軸插在軸承裡(孔沒畫出來)
    expect: [
      { at: 2 * SWING, part: "crownD", label: "擺輪擺過一次,冠狀輪轉過半個齒" },
      { at: 4 * SWING, part: "crownD", label: "擺輪一個來回,冠狀輪轉過一個齒" },
      { part: "crownD", label: "擺輪兩個來回,冠狀輪轉過兩個齒" },
    ],
  },
  driver: { part: "balanceC", type: "rotation", cycle: [-SWING, SWING] },
  target: "crownD", // 冠狀輪(擒縱輪):擒縱讓它一齒一齒地放行
  view: { direction: [0.08, 0.15, 1] },
  pose(v) {
    const b = balance(v);
    return { parts: { balanceC: { angle: b.angle }, crownD: { angle: b.crown } }, readouts: [] };
  },
};
