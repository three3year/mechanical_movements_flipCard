// 第 299 種:老式的時鐘擒縱(立軸擒縱,verge)。冠狀輪的齒朝上立在輪緣;水平的立軸跨過冠狀輪上方,
// 軸上兩個叉瓦彼此約成直角,一個在輪的前側、一個在後側。冠狀輪的齒推開一個叉瓦、從它的尖端滑過,
// 立軸跟著轉,另一個叉瓦落進後側的齒間、擋住對面的齒(並把輪推回一點);立軸擺回來時再換過來。
// 冠狀輪每擺一次轉過半個齒。主動件是立軸(由擺或擺輪帶動);目標件是冠狀輪(擒縱讓它一齒一齒地放行)。
//
// 由接觸算(models/escapement.js 的 crownByContact):冠狀輪受重錘的固定力矩轉動,叉瓦只在輪的前、後兩端碰到齒,
// 在那兩個切面上算齒與叉瓦的接觸——齒被擋住就停、被叉瓦推就退(立軸擒縱是回退式),放開後加速轉到對面的叉瓦上。
// 推斷:齒數(奇數,前後兩側的齒才錯開半個齒距)、擺幅、叉瓦的長短與夾角(兩叉瓦相隔 96°、立軸在齒尖上方 0.12);冠狀輪的軸與立軸的軸承座(原圖沒畫)。
import { Y, TAU, deg, swing } from "./kit.js";
import { crownByContact, placePoly, sawCrown } from "./escapement.js";
import { shape, thickLine, circle, rect } from "./shapes.js";

export const N = 15;
export const PITCH = TAU / N;
export const SWING = deg(36);
const R = 2.1;
const TOOTH = 0.55;
const RIM = 0.9; // 輪緣高
const C = [0, -0.6, 0]; // 冠狀輪中心
const BASE = C[1] + RIM / 2; // 齒底的高度(世界 y)
const STAFF = [0, BASE + TOOTH + 0.12]; // 立軸(世界 x、y;軸沿 z):在齒尖上方
const FLAG = { length: 0.3, width: 0.1 }; // 叉瓦短:一個叉瓦轉到齒尖上方放開齒時,另一個只伸進齒間一半

// 叉瓦(相對立軸,在 x–y 平面):前叉瓦朝右下、後叉瓦朝左下,彼此相隔 96°
const flag = (a) => thickLine([[0, 0], [FLAG.length * Math.cos(a), FLAG.length * Math.sin(a)]], FLAG.width);
const FRONT = flag(deg(-42));
const BACK = flag(deg(-138));

/** 立軸累計擺動 v → 擺角 */
export const vergeAngle = (v) => swing(v, -SWING, SWING);
export const escapement = {
  ...crownByContact({
    radius: R - 0.04,
    teeth: N,
    height: TOOTH,
    base: BASE,
    front: (v) => [placePoly(FRONT, STAFF, vergeAngle(v))],
    back: (v) => [placePoly(BACK, STAFF, vergeAngle(v))],
    period: 4 * SWING,
  }),
  period: 4 * SWING,
};
/** 立軸累計擺動 v → 冠狀輪轉角(由接觸算) */
export const wheelAngle = escapement.angle;

export default {
  figure: 299,
  parts: [
    {
      id: "crown",
      kind: "group",
      axis: Y,
      center: C,
      spin: R,
      spinOffset: -RIM / 2,
      pieces: [
        { kind: "cylinder", radius: R, inner: R - 0.12, length: RIM },
        { kind: "plate", shape: shape(circle(R - 0.06), [circle(0.15).reverse()]), thickness: 0.1, at: [0, 0, -RIM / 2 + 0.05] },
        { kind: "cylinder", radius: 0.12, length: 1.2, at: [0, 0, -RIM / 2 - 0.55] }, // 冠狀輪的軸,往下伸進軸承座
        ...sawCrown({ teeth: N, radius: R - 0.04, height: TOOTH, base: RIM / 2, thick: 0.1 }),
      ],
    },
    {
      id: "verge",
      kind: "group",
      center: [...STAFF, 0],
      arrow: false,
      pieces: [
        { kind: "cylinder", radius: 0.05, length: 2 * R + 0.9 },
        { kind: "cylinder", radius: 0.22, inner: 0.1, length: 0.18, at: [0, 0, R + 0.32] },
        { kind: "plate", shape: shape(FRONT), thickness: 0.14, at: [0, 0, R - 0.04] }, // 前叉瓦
        { kind: "plate", shape: shape(BACK), thickness: 0.14, at: [0, 0, -R + 0.04] }, // 後叉瓦
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 立軸兩端的軸承座、冠狀輪軸下端的軸承(原圖沒畫)
        { kind: "cylinder", radius: 0.16, inner: 0.08, length: 0.16, at: [STAFF[0], STAFF[1], R + 0.6] },
        { kind: "cylinder", radius: 0.16, inner: 0.08, length: 0.16, at: [STAFF[0], STAFF[1], -R - 0.6] },
        { kind: "box", size: [0.2, STAFF[1] - C[1] + 1.4, 0.16], at: [0, (STAFF[1] + C[1] - 1.4) / 2 - 0.08, R + 0.6] },
        { kind: "box", size: [0.2, STAFF[1] - C[1] + 1.4, 0.16], at: [0, (STAFF[1] + C[1] - 1.4) / 2 - 0.08, -R - 0.6] },
        { kind: "box", size: [0.3, 0.16, 2 * R + 1.36], at: [0, C[1] - 1.48, 0] },
        { kind: "cylinder", axis: Y, radius: 0.2, inner: 0.12, length: 0.16, at: [0, C[1] - 1.32, 0] },
      ],
    },
  ],
  // 動力重演:只推立軸;冠狀輪受固定的力矩(重錘)轉動,由前後兩個叉瓦輪流擋住、推回、放行
  replay: {
    to: 8 * SWING,
    free: { crown: { pivot: C, spring: 1, gravity: false } },
    ignore: [["crown", "frame"]], // 冠狀輪的軸插在軸承裡(孔沒畫出來)
    expect: [
      { at: 2 * SWING, part: "crown", label: "立軸擺過一次,冠狀輪轉過半個齒" },
      { at: 4 * SWING, part: "crown", label: "立軸一個來回,冠狀輪轉過一個齒" },
      { part: "crown", label: "立軸兩個來回,冠狀輪轉過兩個齒" },
    ],
  },
  driver: { part: "verge", type: "rotation", cycle: [-SWING, SWING] },
  target: "crown", // 冠狀輪(擒縱輪):擒縱讓它一齒一齒地放行
  view: { direction: [0.08, 0.18, 1] },
  pose(v) {
    return { parts: { verge: { angle: vergeAngle(v) }, crown: { angle: wheelAngle(v) } }, readouts: [] };
  },
};
