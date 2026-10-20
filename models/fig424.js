// 第 424 種:Root 的雙往復式(方形活塞)引擎。「汽缸」A 是長方形,裡面有兩個活塞 B 與 C:B 在 A 裡水平移動,
// C 在 B 裡垂直移動;C 接在主軸 b 上曲柄的曲柄銷 a 上。進汽口以黑色表示。兩個活塞使曲柄旋轉,而且沒有死點。
// 主動件是主軸 b 的曲柄。
// 推斷:B 的水平位置等於曲柄銷的 x、C 的垂直位置等於曲柄銷的 y;各活塞往哪邊走,蒸汽就進到推它的那一側(以填色表示)。
// 兩個方向相差 90°,一個活塞在行程端點時另一個正在行程中間,所以沒有死點。
// 原圖的進汽口(A 兩端、B 上下的黑塊)畫在壁的內側、以蒸汽色填滿(模型沒有黑色的零件色);
// 主軸 b 的前端由底座上立起的軸承座托住(推斷;原圖是正視圖,沒有畫軸承)。
import { shape, rect, circle } from "./shapes.js";

export const CRANK = 0.55; // 曲柄半徑
export const A_IN = { w: 3.9, h: 2.3 }; // A 的內部
const B_SIZE = { w: A_IN.w - 2 * CRANK }; // B 的外寬(高與 A 的內高相同)
export const B_IN = { w: B_SIZE.w - 0.24, h: A_IN.h - 0.24 }; // B 的內部
const C_SIZE = { h: B_IN.h - 2 * CRANK - 0.02 };
const DEPTH = 0.6;
const PORT = { w: 0.08, l: 0.7 }; // 進汽口:貼著壁的內側的長條(寬 w、長 l)
const BASE_TOP = -A_IN.h / 2 - 0.15; // 底座頂面:頂著 A 的外框底緣
const BEARING_Z = DEPTH / 2 + 0.7; // 軸承座的中心深度(在曲柄臂前面)

/** 曲柄轉 theta → 兩個活塞的位置(以 A 的中心為原點) */
export function pistons(theta) {
  return { b: CRANK * Math.cos(theta), c: CRANK * Math.sin(theta) };
}
/** 推動各活塞的力在曲柄上的力矩 ∝ 活塞速度 × 推力;兩個活塞合起來在任何位置都推得動曲柄 */
export const turning = (theta) => Math.abs(Math.sin(theta)) + Math.abs(Math.cos(theta));

const frameA = shape(rect(A_IN.w + 0.3, A_IN.h + 0.3), [rect(A_IN.w, A_IN.h).reverse()]);
const frameB = shape(rect(B_SIZE.w, A_IN.h - 0.01), [rect(B_IN.w, B_IN.h).reverse()]);
/** 進汽口:一直填滿蒸汽色的長條,wall 是它在哪個壁上(A 的兩端、B 的上下) */
const port = (id, wall, size) => ({ id, kind: "fill", role: "port", wall, fluid: "steam", shape: "box", size, level: 1 });
const PORT_A = [PORT.l, PORT.w, DEPTH + 0.04]; // 直立的長條:填色沿 y 長,轉 ±90° 後貼著 A 的左右內壁
const PORT_B = [PORT.l, PORT.w, DEPTH]; // 橫放的長條,貼著 B 的上下內壁

export default {
  figure: 424,
  parts: [
    {
      id: "cylinderA",
      kind: "group",
      label: "A",
      labelOffset: [0, A_IN.h / 2 + 0.3, 0.3],
      pieces: [
        { kind: "plate", role: "frame", shape: frameA, thickness: DEPTH },
        { kind: "plate", shape: shape(rect(A_IN.w + 0.3, A_IN.h + 0.3)), thickness: 0.04, at: [0, 0, -DEPTH / 2 - 0.02] },
        // 底座:頂著外框的底緣,往前伸到軸承座底下
        { kind: "box", role: "base", size: [A_IN.w + 0.9, 0.15, BEARING_Z + 0.1 + 0.45], at: [0, BASE_TOP - 0.075, (BEARING_Z + 0.1 - 0.45) / 2] },
        // 主軸 b 的軸承座(推斷):從底座立起的柱子,頂端的軸承環套著軸
        { kind: "box", size: [0.24, -BASE_TOP + 0.02, 0.2], at: [0, (BASE_TOP + 0.02) / 2, BEARING_Z] },
        { kind: "cylinder", radius: 0.24, inner: 0.1, length: 0.2, at: [0, 0, BEARING_Z] },
      ],
    },
    port("portLeft", "A", PORT_A),
    port("portRight", "A", PORT_A),
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
      ],
    },
    port("portUp", "B", PORT_B),
    port("portDown", "B", PORT_B),
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
        // 軸只在汽缸的前面:曲柄銷伸進活塞 C,軸本身不穿過活塞;前端穿過軸承座的環
        { kind: "cylinder", role: "shaft", radius: 0.1, length: BEARING_Z + 0.1 - DEPTH / 2 - 0.02, at: [0, 0, (BEARING_Z + 0.1 + DEPTH / 2 + 0.02) / 2] },
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
        // 進汽口貼著壁的內側:A 的在左右內壁上(長條直立),B 的在 B 的上下內壁上、隨 B 移動
        portLeft: { position: [-A_IN.w / 2 + PORT.w / 2, 0, 0.01], angle: -Math.PI / 2, level: 1 },
        portRight: { position: [A_IN.w / 2 - PORT.w / 2, 0, 0.01], angle: Math.PI / 2, level: 1 },
        portUp: { position: [b, B_IN.h / 2 - PORT.w / 2, 0.03], level: 1 },
        portDown: { position: [b, -B_IN.h / 2 + PORT.w / 2, 0.03], level: 1 },
      },
      readouts: [
        { label: "B(水平)", value: vb > 0 ? "左側進汽,向右" : "右側進汽,向左" },
        { label: "C(垂直)", value: vc > 0 ? "下側進汽,向上" : "上側進汽,向下" },
      ],
    };
  },
};
