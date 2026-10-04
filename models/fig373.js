// 第 373 種:羅伯特氏的裝置,證明車輛的摩擦不隨速度增加,只隨載重增加。載貨的小車停在大輪的輪面上,小車連著右邊
// 由螺旋彈簧做成的指示器;大輪轉動時,指示器顯示讓小車保持不動所需的力。實驗發現速度不同時指示器不變,
// 載重不同時立刻改變。主動件是大輪(以皮帶帶動);狀態按鈕切換載重輕 / 重。
// 推斷:指示器指針的角度與載重成正比、與轉速無關(原文的實驗結果);小車的輪被輪面帶著轉。
import { deg } from "./kit.js";
import { shape, circle, thickLine } from "./shapes.js";

const WHEEL = { center: [-0.9, -1.0, 0], r: 1.65 };
const CART_W = 0.22; // 小車輪半徑
const DIAL = [1.35, 1.25, 0];
export const LOADS = { light: 1, heavy: 2.4 };

/** 狀態 → 指示器指針的角度(只看載重,不看大輪的轉速) */
export const indicator = (state) => deg(-15) - deg(32) * LOADS[state];

export default {
  figure: 373,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(thickLine([[-3.0, -2.7], [-0.9, -1.0], [1.2, -2.7]], 0.2)), thickness: 0.25, at: [0, 0, -0.5] },
        { kind: "plate", shape: shape(thickLine([[-3.2, -1.65], [2.6, -0.2]], 0.22)), thickness: 0.3, at: [0, 0, -0.4] },
        { kind: "box", size: [0.2, 3.4, 0.3], at: [2.3, -0.9, -0.4] },
        { kind: "box", size: [1.2, 0.15, 0.3], at: [1.75, 0.55, -0.2] },
      ],
    },
    {
      id: "wheel",
      kind: "group",
      center: WHEEL.center,
      spin: WHEEL.r,
      pieces: [
        { kind: "plate", shape: shape(circle(WHEEL.r), [circle(WHEEL.r - 0.15).reverse()]), thickness: 0.3 },
        ...Array.from({ length: 8 }, (_, i) => ({ kind: "box", size: [2 * WHEEL.r - 0.3, 0.07, 0.1], angle: (i * Math.PI) / 8 })),
        { kind: "cylinder", radius: 0.35, length: 0.4 },
        { kind: "cylinder", radius: 0.55, inner: 0.45, length: 0.2, at: [0, 0, 0.25] },
      ],
    },
    {
      id: "cart",
      kind: "group",
      center: [WHEEL.center[0], WHEEL.center[1] + WHEEL.r + 2 * CART_W + 0.05, 0],
      arrow: false,
      pieces: [
        { kind: "box", size: [1.4, 0.45, 0.6], at: [0, 0.15, 0] },
        { kind: "box", size: [1.6, 0.08, 0.7], at: [0, -0.1, 0] },
      ],
    },
    { id: "load", kind: "group", center: [WHEEL.center[0], WHEEL.center[1] + WHEEL.r + 2 * CART_W + 0.5, 0], arrow: false, pieces: Array.from({ length: 5 }, (_, i) => ({ kind: "box", size: [0.25, 0.22, 0.4], at: [-0.5 + i * 0.25, 0.05, 0], angle: deg(-20 + i * 10) })) },
    ...[-1, 1].map((s) => ({ id: s < 0 ? "cartWheelL" : "cartWheelR", kind: "pulley", style: "spoked", spokes: 4, radius: CART_W, width: 0.1, center: [WHEEL.center[0] + s * 0.5, WHEEL.center[1] + Math.sqrt((WHEEL.r + CART_W) ** 2 - 0.25), 0] })), // 小車輪壓在大輪的輪面上
    { id: "dial", kind: "group", center: DIAL, arrow: false, pieces: [{ kind: "plate", shape: shape(circle(0.75), [circle(0.62).reverse()]), thickness: 0.15 }, { kind: "plate", shape: shape(circle(0.62)), thickness: 0.05, at: [0, 0, -0.05] }] },
    { id: "needle", kind: "plate", center: [DIAL[0], DIAL[1], 0.12], shape: shape([[0, -0.05], [0.55, 0], [0, 0.05]]), thickness: 0.03, arrow: false },
    { id: "spring", kind: "spring", coils: 9, radius: 0.08, wire: 0.02 },
    { id: "belt", kind: "belt" },
  ],
  driver: { part: "wheel", type: "rotation" },
  target: "needle", // 顯示摩擦力的指針
  states: {
    initial: "light",
    options: [
      { id: "light", label: "載重輕" },
      { id: "heavy", label: "載重重" },
    ],
  },
  view: { direction: [0.06, 0.08, 1] },
  pose(a, state = "light") {
    const spin = (-a * WHEEL.r) / CART_W; // 小車輪被大輪輪面帶著反向轉
    const load = LOADS[state];
    const top = WHEEL.center[1] + WHEEL.r + 2 * CART_W + 0.5;
    const hook = [WHEEL.center[0] + 0.7, top - 0.35, 0.1];
    // 彈簧:從小車右端拉到指示器下方的掛點;載重越重,彈簧被拉得越長
    const springEnd = [DIAL[0] - 0.1 + 0.15 * load, DIAL[1] - 0.8, 0.1];
    const pulleyR = 0.5;
    const pulleyC = [2.35, -2.25, 0];
    return {
      parts: {
        wheel: { angle: a },
        cartWheelL: { angle: spin },
        cartWheelR: { angle: spin },
        load: { position: [WHEEL.center[0], top, 0], scale: [1, load / 1.7 + 0.4, 1] },
        needle: { angle: indicator(state) },
        spring: { from: hook, to: springEnd },
      },
      paths: {
        belt: {
          points: [
            [WHEEL.center[0], WHEEL.center[1] + 0.55, 0.35],
            [pulleyC[0], pulleyC[1] + pulleyR, 0.35],
            [pulleyC[0], pulleyC[1] - pulleyR, 0.35],
            [WHEEL.center[0], WHEEL.center[1] - 0.55, 0.35],
          ],
          closed: true,
          phase: a * 0.55,
        },
      },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["cart", "load"], reason: "簡化畫法:載重放在車斗裡,重物的底面陷進車斗 0.06" },
    { check: "interference", parts: ["dial", "spring"], reason: "彈簧的端頭扣在刻度盤後面:彈簧的端圈伸進盤面 0.07" },
  ],
};
