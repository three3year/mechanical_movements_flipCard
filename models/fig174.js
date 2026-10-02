// 第 174 種:木匠的工作台夾具。兩個彎鉤形的夾爪各以一根螺絲(樞軸)釘在工作台上,尾端在左邊交叉。
// 把木料(中間的長條)往左推進兩爪之間,木料端頭頂住交叉處的內緣,兩個夾爪便繞著螺絲轉,
// 右端的鉤夾緊木料的上下兩側。主動件是木料(往左推)。
// 推斷:木料還沒頂到內緣時夾爪張開不動;頂到之後夾爪轉角與木料推進量成正比(以接觸點到樞軸的力臂換算);
// 原圖(初始)是已夾緊的位置,往回拉可看到夾爪張開。
import { shape, circle, rect } from "./shapes.js";

const PIVOT = 1.2; // 兩根螺絲在木料中心線上下
const HALF = 0.35; // 木料半寬
const END = -1.75; // 夾緊時木料端頭的位置
const PUSH = 1.0; // 木料可推進的總量
const ARM = 0.9; // 接觸點到樞軸的力臂(垂直於推力)
const GRIP = -0.03; // 夾緊時上夾爪的轉角(負為順時針)
const OPEN = 0.2; // 未頂到時夾爪張開的轉角
const CONTACT = PUSH - (OPEN - GRIP) * ARM; // 推進到這裡木料頂到內緣

/** 木料推進 d(0 為最外、PUSH 為夾緊):木料端頭位置與上夾爪的轉角(下夾爪對稱) */
export function clamp(d) {
  const t = Math.max(0, Math.min(1, (d - CONTACT) / (PUSH - CONTACT)));
  return { end: END + (PUSH - d), angle: OPEN + (GRIP - OPEN) * t };
}
export const grip = { GRIP, OPEN, HALF };

// 上夾爪(以螺絲為原點的局部座標;原圖量得,單位為 100 px)
const UPPER = [
  [-2.9, -0.5], [-2.6, -0.5], [-2.3, -0.2], [-1.9, 0.15], [-1.3, 0.4], [-0.6, 0.52], [0, 0.6], [0.5, 0.7], [0.9, 0.85], [1.25, 0.85],
  [1.4, 0.55], [1.7, 0.4], [2.05, 0.5], [2.25, 0.9], [2.15, 1.35], [1.6, 1.75], [0.8, 1.88], [-0.1, 1.85], [-1.0, 1.6], [-1.7, 1.1],
  [-2.3, 0.4], [-2.75, -0.2],
].map(([x, y]) => [x, y - PIVOT]);
const LOWER = UPPER.map(([x, y]) => [x, -y]).reverse();
/** 夾爪上拿來檢查的點:鉤的最下緣(局部) */
export const nose = [1.7, 0.4 - PIVOT];

export default {
  figure: 174,
  parts: [
    {
      id: "bench",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(rect(6.0, 4.5)), thickness: 0.1, at: [0, 0, -0.1] },
        { kind: "box", size: [0.02, 4.5, 0.02], at: [-0.5, 0, 0] },
        { kind: "box", size: [0.02, 4.5, 0.02], at: [0.75, 0, 0] },
      ],
    },
    { id: "board", kind: "box", size: [4.8, 2 * HALF, 0.3] },
    { id: "upper", kind: "plate", center: [0, PIVOT, 0.15], shape: shape(UPPER, [circle(0.36).reverse()]), thickness: 0.15, arrow: false },
    { id: "lower", kind: "plate", center: [0, -PIVOT, 0], shape: shape(LOWER, [circle(0.36).reverse()]), thickness: 0.15, arrow: false },
    ...[PIVOT, -PIVOT].map((y, i) => ({
      id: i ? "screwLower" : "screwUpper",
      kind: "group",
      center: [0, y, 0],
      arrow: false,
      pieces: [
        { kind: "cylinder", radius: 0.34, length: 0.36, at: [0, 0, 0.18] },
        { kind: "box", size: [0.55, 0.08, 0.06], at: [0, 0, 0.39], angle: 0.4 },
      ],
    })),
  ],
  driver: { part: "board", type: "translation", direction: [-1, 0, 0], range: [0, PUSH], initial: PUSH },
  view: { direction: [0.06, 0.05, 1] },
  pose(d) {
    const { end, angle } = clamp(d);
    return {
      parts: {
        board: { position: [end + 2.4, 0, 0.15] },
        upper: { angle },
        lower: { angle: -angle },
      },
      readouts: [],
    };
  },
};
