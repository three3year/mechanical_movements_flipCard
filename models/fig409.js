// 第 409 種:比例圓規,把圖以放大或縮小的比例複製。兩腳交叉,樞軸固定在一個滑塊上,滑塊可沿兩腳的縱向溝槽調整,用固定螺絲鎖住;
// 一組兩尖之間量得的尺寸,由另一組兩尖放大或縮小轉印,比例等於兩組尖端到樞軸的距離之比。腳上有刻度指示比例。
// 主動件是一隻腳(繞樞軸張開);狀態按鈕把滑塊鎖在不同的比例上。
// 推斷:刻度只畫成腳上的幾條刻線;滑塊的位置以三種常用比例表示。
import { clamp, deg } from "./kit.js";
import { shape, circle } from "./shapes.js";

export const LENGTH = 5.0; // 上尖到下尖
const STATES = { same: 1, double: 2, triple: 3 };
export const RANGE = [deg(4), deg(26)]; // 每隻腳偏離中線的角度(張角的一半)

/** 比例 → 樞軸到上尖、下尖的距離 */
export function arms(state = "double") {
  const k = STATES[state] ?? 2;
  const a = LENGTH / (1 + k);
  return { a, b: LENGTH - a, k };
}

/** 半張角 → 上下兩組尖端的距離 */
export function spans(half0, state) {
  const half = clamp(half0, ...RANGE);
  const { a, b } = arms(state);
  return { upper: 2 * a * Math.sin(half), lower: 2 * b * Math.sin(half) };
}

// 腳:局部 +y 從下尖到上尖,中心在原點;兩端是尖,中間開縱向溝槽
const H = LENGTH / 2;
const leg = shape(
  [[0, -H], [0.14, -H + 0.9], [0.24, -H + 1.3], [0.3, -1.45], [0.3, 1.45], [0.24, H - 1.3], [0.14, H - 0.9], [0, H], [-0.14, H - 0.9], [-0.24, H - 1.3], [-0.3, 1.45], [-0.3, -1.45], [-0.24, -H + 1.3], [-0.14, -H + 0.9]],
  [[[-0.1, -1.55], [-0.1, 1.55], [0.1, 1.55], [0.1, -1.55]]],
);
const ticks = (side) => [-1.0, -0.5, 0, 0.5, 1.0].map((y) => ({ kind: "box", size: [0.1, 0.02, 0.01], at: [side * 0.2, y, 0.04] }));

export default {
  figure: 409,
  parts: [
    { id: "legA", kind: "group", arrow: false, pieces: [{ kind: "plate", shape: leg, thickness: 0.06 }, ...ticks(1)] },
    { id: "legB", kind: "group", arrow: false, pieces: [{ kind: "plate", shape: leg, thickness: 0.06, at: [0, 0, -0.07] }, ...ticks(-1)] },
    {
      id: "slider",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(circle(0.24), [circle(0.1).reverse()]), thickness: 0.04, at: [0, 0, 0.05] },
        { kind: "cylinder", radius: 0.1, length: 0.22, at: [0, 0, 0.0], accent: true },
        { kind: "plate", shape: shape(circle(0.24), [circle(0.1).reverse()]), thickness: 0.04, at: [0, 0, -0.12] },
      ],
    },
  ],
  states: {
    initial: "double",
    options: [
      { id: "same", label: "1 : 1" },
      { id: "double", label: "1 : 2" },
      { id: "triple", label: "1 : 3" },
    ],
  },
  driver: { part: "legA", grips: ["legB"], type: "rotation", range: RANGE, initial: deg(20) },
  view: { direction: [0.03, 0.05, 1] },
  pose(half0, state = "double") {
    const half = clamp(half0, ...RANGE);
    const { a } = arms(state);
    const p = H - a; // 樞軸在腳上的局部 y
    // 樞軸固定在原點;腳轉 angle 後把局部 (0, p) 送到原點
    const place = (angle) => ({ position: [p * Math.sin(angle), -p * Math.cos(angle), 0], angle });
    const s = spans(half, state);
    return {
      parts: { legA: place(-half), legB: place(half), slider: { position: [0, 0, 0] } },
      readouts: [
        { label: "上兩尖", value: s.upper.toFixed(2) },
        { label: "下兩尖", value: s.lower.toFixed(2) },
        { label: "放大", value: `${(s.lower / s.upper).toFixed(2)} 倍` },
      ],
    };
  },
};
