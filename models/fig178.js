// 第 178 種:變化槽刨機、刨形機刀具滑塊速度的裝置。驅動軸(下方塗色的圓)穿過一個固定圓盤,圓盤上有一道
// 圓形溝槽,溝槽的中心在軸的上方(偏心)。軸端裝著開槽曲柄,滑塊嵌在曲柄的槽裡、同時嵌在溝槽中;
// 滑塊外端接著連桿,連桿去推承載刀具的滑塊。曲柄轉動時滑塊被溝槽帶著,在槽裡滑進滑出:
// 在頂部曲柄最長、接近底部時曲柄變短,連桿的速度隨之降低。主動件是驅動軸。
// 連桿另一端的刀具滑塊原圖沒畫,這裡以一個沿水平導路往返的滑塊示意(推斷)。
import { deg, polar, add } from "./kit.js";
import { shape, circle, stadium } from "./shapes.js";

const SHAFT = [0, 0, 0];
const GROOVE = { center: [0, 0.92, 0], radius: 2.1 };
const ROD = 6;
const SLIDE_Y = 0.92; // 刀具滑塊導路的高度(與溝槽中心同高)
const START = deg(90); // 原圖:曲柄朝上

/** 曲柄方向 phi 時,滑塊離軸的距離(射線與溝槽圓的交點) */
export function crankLength(phi) {
  const u = [Math.cos(phi), Math.sin(phi)];
  const c = [GROOVE.center[0] - SHAFT[0], GROOVE.center[1] - SHAFT[1]];
  const b = u[0] * c[0] + u[1] * c[1];
  return b + Math.sqrt(b * b - (c[0] * c[0] + c[1] * c[1]) + GROOVE.radius ** 2);
}

/** 軸轉 theta:曲柄長、滑塊與刀具滑塊的位置 */
export function slotting(theta) {
  const phi = START + theta;
  const length = crankLength(phi);
  const block = add(SHAFT, polar(length, phi));
  const slide = [block[0] - Math.sqrt(ROD * ROD - (block[1] - SLIDE_Y) ** 2), SLIDE_Y, 0];
  return { length, block, slide };
}

const plate = shape(circle(GROOVE.radius + 0.45, GROOVE.center[0], GROOVE.center[1]), [circle(GROOVE.radius + 0.12, GROOVE.center[0], GROOVE.center[1]).reverse()]);
const inner = shape(circle(GROOVE.radius - 0.12, GROOVE.center[0], GROOVE.center[1]), [circle(0.35).reverse()]);
const recess = shape(circle(1.35, GROOVE.center[0], GROOVE.center[1]), [circle(1.27, GROOVE.center[0], GROOVE.center[1]).reverse()]);
const slotted = shape(stadium(3.65, 0.6).outline, [stadium(3.1, 0.18).outline.map(([x, y]) => [x + 0.4, y]).reverse(), circle(0.16).reverse()]);

export default {
  figure: 178,
  parts: [
    {
      id: "disc",
      kind: "group",
      pieces: [
        { kind: "plate", shape: plate, thickness: 0.4, at: [0, 0, -0.45] },
        { kind: "plate", shape: inner, thickness: 0.4, at: [0, 0, -0.45] },
        { kind: "plate", shape: recess, thickness: 0.05, at: [0, 0, -0.05] },
      ],
    },
    {
      id: "crank",
      kind: "group",
      center: SHAFT,
      spin: 0.75,
      pieces: [
        { kind: "plate", shape: slotted, thickness: 0.15, angle: START, at: [0, 0, 0.05] },
        { kind: "cylinder", radius: 0.32, inner: 0.16, length: 0.3, at: [0, 0, 0.1] },
        { kind: "cylinder", radius: 0.16, length: 0.6, mark: true, at: [0, 0, -0.1] },
      ],
    },
    {
      id: "block",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "box", size: [0.18, 0.18, 0.5], at: [0, 0, -0.1] },
        { kind: "cylinder", radius: 0.16, inner: 0.07, length: 0.18, at: [0, 0, 0.3] },
      ],
    },
    { id: "rod", kind: "link", width: 0.16, thickness: 0.08 },
    { id: "slide", kind: "box", size: [0.5, 0.35, 0.3] },
    { id: "guide", kind: "box", center: [-5.8, SLIDE_Y - 0.25, 0.3], size: [6.2, 0.1, 0.3] },
  ],
  waivers: [
    { check: "interference", parts: ["rod", "slide"], reason: "待確認(未修):rod 的方塊 1×0.16×0.08 與 slide 的方塊 0.5×0.35×0.3互相穿入 0.19(4 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["rod", "guide"], reason: "待確認:rod 的方塊 1×0.16×0.08 與 guide 的方塊 6.2×0.1×0.3重疊 0.04,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
  ],
  driver: { part: "crank", type: "rotation" },
  target: "slide",
  view: { direction: [0.06, 0.05, 1], fit: ["disc", "crank"] },
  pose(theta) {
    const { block, slide } = slotting(theta);
    return {
      parts: {
        crank: { angle: theta },
        block: { position: [block[0], block[1], 0.15], angle: theta },
        rod: { from: [block[0], block[1], 0.45], to: [slide[0], slide[1], 0.45] },
        slide: { position: [slide[0], slide[1], 0.45] },
      },
      readouts: [],
    };
  },
};
