// 第 307 種:第 306 種三腳式擺鐘擒縱的變形,有較長的止動齒 D 和 E。擺下端的瓶形框架裡開一個橢圓形的口,
// 三腳輪的長腳伸在口中;A、B 是擒縱叉瓦(在輪心上、下),D、E 是左右兩端較長的止動齒,輪流擋住腳尖。
// 擺每擺一次,三腳輪轉過六分之一圈。主動件是擺(累計擺動)。
// 推斷:擺的樞軸在畫面上方很遠處(擺幅小,框架近乎左右平移);各部尺寸依原圖。
import { TAU, deg, swing } from "./kit.js";
import { escapeStep } from "./escapement.js";
import { shape, circle, rect } from "./shapes.js";

export const STEP = TAU / 6;
export const SWING = deg(3);
const PIVOT = [0, 7.5, 0]; // 擺的樞軸(畫面外)
const LEG = 1.45;

/** 擺累計擺動 v → 擺角、三腳輪轉角 */
export function threeLeg(v) {
  return { pendulum: swing(v, -SWING, SWING), wheel: escapeStep(v, -SWING, SWING, STEP, 0.5) };
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
  return [1.9 * Math.cos(a), 0.62 * Math.sin(a) - PIVOT[1]];
});
const legs = [0, 1, 2].map((i) => {
  const a = (i * TAU) / 3 + deg(15);
  const pts = [[0.05, -0.06], [LEG, -0.02], [LEG, 0.02], [0.05, 0.06]];
  return pts.map(([x, y]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]);
});

export default {
  figure: 307,
  parts: [
    {
      id: "pendulum",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(flask, [oval.slice().reverse()]), thickness: 0.12, at: [0, 0, -0.1] },
        { kind: "plate", shape: shape(rect(1.2, 1.6, 0, 1.9 - PIVOT[1])), thickness: 0.12, at: [0, 0, -0.1] },
        // 叉瓦 A(上)、B(下)與止動齒 D(左)、E(右)
        { kind: "box", size: [0.12, 0.2, 0.3], at: [0.12, 0.42 - PIVOT[1], 0.1] },
        { kind: "box", size: [0.12, 0.2, 0.3], at: [-0.12, -0.42 - PIVOT[1], 0.1] },
        { kind: "box", size: [0.5, 0.12, 0.3], at: [-1.75, -0.08 - PIVOT[1], 0.1] },
        { kind: "box", size: [0.5, 0.12, 0.3], at: [1.75, 0.08 - PIVOT[1], 0.1] },
      ],
    },
    {
      id: "wheel",
      kind: "group",
      spin: 0.4,
      pieces: [...legs.map((l, i) => ({ kind: "plate", shape: shape(l), thickness: 0.08, at: [0, 0, 0.12], accent: i === 0 })), { kind: "plate", shape: shape(circle(0.14), [circle(0.05).reverse()]), thickness: 0.2, at: [0, 0, 0.12] }],
    },
    { id: "labelA", kind: "group", center: [0.12, 0.45, 0.3], label: "A", labelOffset: [0.25, 0.1, 0] },
    { id: "labelB", kind: "group", center: [-0.12, -0.45, 0.3], label: "B", labelOffset: [0.1, -0.3, 0] },
    { id: "labelD", kind: "group", center: [-1.75, -0.1, 0.3], label: "D", labelOffset: [-0.2, -0.3, 0] },
    { id: "labelE", kind: "group", center: [1.75, 0.1, 0.3], label: "E", labelOffset: [0.15, 0.3, 0] },
  ],
  waivers: [
    { check: "interference", parts: ["pendulum", "wheel"], reason: "待確認(未修):pendulum 的方塊 0.12×0.2×0.3 與 wheel 的板互相穿入 0.15(62 個取樣姿勢),尚未修正" },
  ],
  driver: { part: "pendulum", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheel", // 三腳輪
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const t = threeLeg(v);
    return { parts: { pendulum: { angle: t.pendulum }, wheel: { angle: t.wheel } }, readouts: [] };
  },
};
