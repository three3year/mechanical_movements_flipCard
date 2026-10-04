// 第 424 種:Root 的雙往復式(方形活塞)引擎。「汽缸」A 是長方形,裡面有兩個活塞 B 與 C:B 在 A 裡水平移動,
// C 在 B 裡垂直移動;C 接在主軸 b 上曲柄的曲柄銷 a 上。進汽口以黑色表示。兩個活塞使曲柄旋轉,而且沒有死點。
// 主動件是主軸 b 的曲柄。
// 推斷:B 的水平位置等於曲柄銷的 x、C 的垂直位置等於曲柄銷的 y;各活塞往哪邊走,蒸汽就進到推它的那一側(以填色表示)。
// 兩個方向相差 90°,一個活塞在行程端點時另一個正在行程中間,所以沒有死點。
import { shape, rect, circle } from "./shapes.js";

export const CRANK = 0.55; // 曲柄半徑
const A_IN = { w: 3.9, h: 2.3 }; // A 的內部
const B_SIZE = { w: A_IN.w - 2 * CRANK }; // B 的外寬(高與 A 的內高相同)
const B_IN = { w: B_SIZE.w - 0.24, h: A_IN.h - 0.24 }; // B 的內部
const C_SIZE = { h: B_IN.h - 2 * CRANK - 0.02 };
const DEPTH = 0.6;

/** 曲柄轉 theta → 兩個活塞的位置(以 A 的中心為原點) */
export function pistons(theta) {
  return { b: CRANK * Math.cos(theta), c: CRANK * Math.sin(theta) };
}
/** 推動各活塞的力在曲柄上的力矩 ∝ 活塞速度 × 推力;兩個活塞合起來在任何位置都推得動曲柄 */
export const turning = (theta) => Math.abs(Math.sin(theta)) + Math.abs(Math.cos(theta));

const frameA = shape(rect(A_IN.w + 0.3, A_IN.h + 0.3), [rect(A_IN.w, A_IN.h).reverse()]);
const frameB = shape(rect(B_SIZE.w, A_IN.h - 0.01), [rect(B_IN.w, B_IN.h).reverse()]);
const port = (w, h, x, y) => ({ kind: "box", size: [w, h, DEPTH + 0.02], at: [x, y, 0], accent: false });

export default {
  figure: 424,
  parts: [
    {
      id: "cylinderA",
      kind: "group",
      label: "A",
      labelOffset: [0, A_IN.h / 2 + 0.3, 0.3],
      pieces: [
        { kind: "plate", shape: frameA, thickness: DEPTH },
        { kind: "plate", shape: shape(rect(A_IN.w + 0.3, A_IN.h + 0.3)), thickness: 0.04, at: [0, 0, -DEPTH / 2 - 0.02] },
        { kind: "box", size: [A_IN.w + 0.9, 0.15, DEPTH + 0.3], at: [0, -A_IN.h / 2 - 0.25, 0] },
        // 兩端的進汽口(黑色)
        port(0.08, 0.7, -A_IN.w / 2 - 0.1, 0),
        port(0.08, 0.7, A_IN.w / 2 + 0.1, 0),
      ],
    },
    { id: "steamLeft", kind: "fill", fluid: "steam", shape: "box", size: [A_IN.h - 0.04, A_IN.w - B_SIZE.w + 0.0, DEPTH - 0.06], level: 0 },
    { id: "steamRight", kind: "fill", fluid: "steam", shape: "box", size: [A_IN.h - 0.04, A_IN.w - B_SIZE.w + 0.0, DEPTH - 0.06], level: 0 },
    {
      id: "pistonB",
      kind: "group",
      label: "B",
      labelOffset: [-B_SIZE.w / 2 - 0.25, 0.3, 0.3],
      arrow: false,
      pieces: [
        { kind: "plate", shape: frameB, thickness: DEPTH - 0.04 },
        { kind: "plate", shape: shape(rect(B_SIZE.w, A_IN.h - 0.01)), thickness: 0.04, at: [0, 0, -DEPTH / 2 + 0.03] },
        port(0.6, 0.06, 0, B_IN.h / 2 + 0.07),
        port(0.6, 0.06, 0, -B_IN.h / 2 - 0.07),
      ],
    },
    { id: "steamUp", kind: "fill", fluid: "steam", shape: "box", size: [B_IN.w - 0.04, B_IN.h - C_SIZE.h, DEPTH - 0.1], level: 0 },
    { id: "steamDown", kind: "fill", fluid: "steam", shape: "box", size: [B_IN.w - 0.04, B_IN.h - C_SIZE.h, DEPTH - 0.1], level: 0 },
    { id: "pistonC", kind: "plate", shape: shape(rect(B_IN.w - 0.02, C_SIZE.h), [circle(0.1).reverse()]), thickness: DEPTH - 0.08, label: "C", labelOffset: [0.7, -0.3, 0.3], arrow: false },
    {
      id: "shaft",
      kind: "group",
      label: "b",
      labelOffset: [-0.3, 0.3, 0.6],
      spin: 0.25,
      pieces: [
        { kind: "cylinder", radius: 0.1, length: 0.8, at: [0, 0, DEPTH / 2 + 0.42] }, // 軸只在汽缸的前面:曲柄銷伸進活塞 C,軸本身不穿過活塞
        { kind: "plate", shape: shape(rect(CRANK + 0.2, 0.16, CRANK / 2, 0)), thickness: 0.06, at: [0, 0, DEPTH / 2 + 0.05] },
        { kind: "cylinder", radius: 0.08, length: 0.3, at: [CRANK, 0, DEPTH / 2], accent: true },
      ],
    },
    { id: "wrist", kind: "group", label: "a", labelOffset: [0.2, -0.15, 0.6], pieces: [] },
  ],
  driver: { part: "shaft", type: "rotation" },
  targets: ["pistonB", "pistonC"],
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const { b, c } = pistons(theta);
    const vb = -Math.sin(theta); // 兩個活塞的速度方向
    const vc = Math.cos(theta);
    const leftW = b - B_SIZE.w / 2 + A_IN.w / 2; // B 左側的空間
    const rightW = A_IN.w / 2 - (b + B_SIZE.w / 2);
    const max = A_IN.w - B_SIZE.w;
    const upH = B_IN.h / 2 - (c + C_SIZE.h / 2);
    const downH = c - C_SIZE.h / 2 + B_IN.h / 2;
    const maxH = B_IN.h - C_SIZE.h;
    return {
      parts: {
        shaft: { angle: theta },
        pistonB: { position: [b, 0, 0] },
        pistonC: { position: [b, c, 0.02] },
        wrist: { position: [b, c, 0.02] },
        // 水平的兩室:填色沿 +x 長(轉 -90°)
        steamLeft: { position: [-A_IN.w / 2 + max / 2, 0, 0], angle: -Math.PI / 2, level: vb > 0 ? leftW / max : 0 },
        steamRight: { position: [A_IN.w / 2 - max / 2, 0, 0], angle: Math.PI / 2, level: vb < 0 ? rightW / max : 0 },
        steamDown: { position: [b, -B_IN.h / 2 + maxH / 2, 0.02], level: vc > 0 ? downH / maxH : 0 },
        steamUp: { position: [b, B_IN.h / 2 - maxH / 2, 0.02], angle: Math.PI, level: vc < 0 ? upH / maxH : 0 },
      },
      readouts: [
        { label: "B(水平)", value: vb > 0 ? "左側進汽,向右" : "右側進汽,向左" },
        { label: "C(垂直)", value: vc > 0 ? "下側進汽,向上" : "上側進汽,向下" },
      ],
    };
  },
};

