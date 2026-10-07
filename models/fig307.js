// 第 307 種:第 306 種三腳式擺鐘擒縱的變形,有較長的止動齒 D 和 E。擺下端的瓶形框架裡開一個橢圓形的口,
// 三腳輪的長腳伸在口中;A、B 是擒縱叉瓦,D、E 是從口的左右兩端伸進來的長止動齒,輪流擋住腳尖。
// 擺每擺一次,三腳輪轉過六分之一圈。主動件是擺(累計擺動);目標件是三腳輪(擒縱讓它一格一格地放行)。
//
// 由接觸算(models/escapement.js 的 escapeByContact,與第 306 種相同的作法):三腳輪受重錘的固定力矩逆時針轉,
// 腳尖碰上止動齒的端面(叉瓦)就停;擺往左擺時,左上的止動齒 D 的端面 A 退到腳尖圓外面,腳滑過去,
// 輪轉六分之一圈碰上右下的止動齒 E 的端面 B;往右擺時反過來。端面是直的,擺過來時會把腳推回一點(回退)。
// 偏離插圖:原圖 A、B 畫在輪心上下、靠近輪轂;照這種「止動齒端面擋住腳尖」的作法,A、B 是 D、E 的末端,
// 在腳尖圓的邊上(輪心上下 0.45)。原文只說 A、B 是叉瓦,這一點拿不準(列入待確認清單)。
// 推斷:擺的樞軸在畫面上方很遠處(擺幅小,框架近乎左右平移);止動齒的長短與高低;三腳輪的軸往後伸到機架上的軸承(原圖沒畫)。
import { TAU, deg, swing } from "./kit.js";
import { escapeByContact, placePoly } from "./escapement.js";
import { shape, circle, rect } from "./shapes.js";

export const STEP = TAU / 6;
export const SWING = deg(3);
const PIVOT = [0, 7.5]; // 擺的樞軸(畫面外)
const LEG = 1.45;
// 止動齒:D 從橢圓口的左端伸到 A(輪心左上方),E 從右端伸到 B(右下方),點對稱
const L = LEG + 0.04;
const YU = 0.3 * L;
const XA = -Math.sqrt(L * L - YU * YU) + PIVOT[1] * Math.sin(SWING) - 0.06;
const TOOTH = { root: 1.95, thick: 0.2 };
const local = ([x, y]) => [x - PIVOT[0], y - PIVOT[1]];
const TOOTH_D = [[-TOOTH.root, YU], [XA, YU], [XA, YU + TOOTH.thick], [-TOOTH.root, YU + TOOTH.thick]].map(local);
const TOOTH_E = [[TOOTH.root, -YU], [-XA, -YU], [-XA, -YU - TOOTH.thick], [TOOTH.root, -YU - TOOTH.thick]].map(local);

const legs = [0, 1, 2].map((i) => {
  const a = (i * TAU) / 3;
  const pts = [[0.05, -0.09], [LEG, -0.06], [LEG, 0.06], [0.05, 0.09]];
  return pts.map(([x, y]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]);
});

/** 擺累計擺動 v → 擺角 */
export const pendulumAngle = (v) => swing(v, -SWING, SWING);
export const escapement = {
  ...escapeByContact({ center: [0, 0], teeth: legs, dir: 1, period: 4 * SWING, pitch: TAU / 3, drop: 0.2, stops: (v) => [TOOTH_D, TOOTH_E].map((b) => placePoly(b, PIVOT, pendulumAngle(v))) }),
  period: 4 * SWING,
};

/** 擺累計擺動 v → 擺角、三腳輪轉角(逆時針為正,由接觸算) */
export function threeLeg(v) {
  return { pendulum: pendulumAngle(v), wheel: escapement.angle(v) };
}

// 瓶形框架(相對擺的樞軸):頸往上延伸、肚子裡一個橢圓口
const flask = Array.from({ length: 33 }, (_, i) => {
  const a = Math.PI / 2 + (i / 32) * TAU;
  const x = 2.25 * Math.cos(a);
  const y = 1.25 * Math.sin(a);
  return [y > 0.9 ? x * 0.45 : x, y - PIVOT[1]];
}).slice(0, -1);
const oval = Array.from({ length: 48 }, (_, i) => {
  const a = (i / 48) * TAU;
  return [2.0 * Math.cos(a), 0.62 * Math.sin(a) - PIVOT[1]];
});

export default {
  figure: 307,
  parts: [
    {
      id: "pendulum",
      kind: "group",
      center: [...PIVOT, 0],
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(flask, [oval.slice().reverse()]), thickness: 0.12, at: [0, 0, -0.1] },
        { kind: "plate", shape: shape(rect(1.2, 1.6, 0, 1.9 - PIVOT[1])), thickness: 0.12, at: [0, 0, -0.1] },
        // 止動齒 D(左上)、E(右下),末端是叉瓦 A、B;根部埋進框架
        { kind: "plate", shape: shape(TOOTH_D), thickness: 0.3, at: [0, 0, 0.1] },
        { kind: "plate", shape: shape(TOOTH_E), thickness: 0.3, at: [0, 0, 0.1] },
        { kind: "cylinder", radius: 0.08, length: 0.6, at: [0, 0, -0.3] }, // 擺的樞軸(畫面外),往後伸進支架
      ],
    },
    {
      id: "wheel",
      kind: "group",
      spin: 0.4,
      pieces: [
        ...legs.map((l, i) => ({ kind: "plate", shape: shape(l), thickness: 0.08, at: [0, 0, 0.12], accent: i === 0 })),
        { kind: "plate", shape: shape(circle(0.14)), thickness: 0.2, at: [0, 0, 0.12] },
        { kind: "cylinder", radius: 0.05, length: 0.6, at: [0, 0, 0.45] }, // 輪軸,往前伸進軸承架(框架在輪的後面)
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 三腳輪軸的前軸承架(在擺的前面,原圖沒畫)
        { kind: "cylinder", radius: 0.12, inner: 0.05, length: 0.1, at: [0, 0, 0.72] },
        { kind: "box", size: [2.8, 0.14, 0.1], at: [1.4, 0, 0.72] },
        { kind: "box", size: [0.14, 3.0, 0.1], at: [2.8, -1.43, 0.72] },
      ],
    },
    { id: "labelA", kind: "group", center: [XA, YU + 0.12, 0.3], label: "A", labelOffset: [0.15, 0.2, 0] },
    { id: "labelB", kind: "group", center: [-XA, -YU - 0.12, 0.3], label: "B", labelOffset: [-0.15, -0.25, 0] },
    { id: "labelD", kind: "group", center: [-1.75, YU + 0.06, 0.3], label: "D", labelOffset: [0, 0.3, 0] },
    { id: "labelE", kind: "group", center: [1.75, -YU - 0.06, 0.3], label: "E", labelOffset: [0, -0.3, 0] },
  ],
  // 動力重演:只推擺;三腳輪受固定的力矩(重錘)逆時針轉,由兩個止動齒的端面輪流擋住、放行
  replay: {
    to: 8 * SWING,
    free: { wheel: { pivot: [0, 0, 0], spring: 1, gravity: false } },
    ignore: [["wheel", "frame"]], // 輪軸插在軸承架的孔裡(孔沒畫出來)
    expect: [
      { at: 2 * SWING, part: "wheel", label: "擺擺過一次,三腳輪轉六分之一圈" },
      { at: 4 * SWING, part: "wheel", label: "擺一個來回,三腳輪轉三分之一圈" },
      { part: "wheel", label: "擺兩個來回,三腳輪轉三分之二圈", quote: "具有較長的止動齒 D 和 E。A 和 B 為擒縱叉瓦" },
    ],
  },
  driver: { part: "pendulum", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheel", // 三腳輪:擒縱讓它一格一格地放行
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const t = threeLeg(v);
    return { parts: { pendulum: { angle: t.pendulum }, wheel: { angle: t.wheel } }, readouts: [] };
  },
};
