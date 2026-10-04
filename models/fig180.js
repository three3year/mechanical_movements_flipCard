// 第 180 種:與第 174 種的差別只在於只有一個以樞軸(螺絲)連接的夾爪,與一塊固定的側板配合。
// 把木料(中間的直條)往上推進側板與夾爪之間,木料端頭頂住夾爪上段的內緣,夾爪便繞螺絲轉,
// 下端的鉤把木料壓向側板夾緊。夾爪的上端伸到側板後面(原圖的虛線)。主動件是木料(往上推)。
// 推斷:同第 174 種——頂到之前夾爪張開不動,頂到之後轉角與推進量成正比;初始是原圖的夾緊位置。
import { shape, circle, rect } from "./shapes.js";
import { swingUntilContact } from "./contact.js";

const PLATE = { x: [-2.55, -1.75], y: [-2.6, 3.55] };
const BOARD = { x: [-1.75, -1.05], top: 1.8, bottom: -2.6 };
const PUSH = 1.0;
const ARM = 1.2; // 接觸點到螺絲的水平距離
const GRIP = 0; // 夾緊時(原圖)夾爪的轉角
const OPEN = 0.18; // 未頂到時夾爪張開的轉角(逆時針)

/** 木料推進 d(0 為最低、PUSH 為夾緊):木料頂端高度與夾爪轉角 */
export function clamp(d) {
  const top = TOP_AT - (PUSH - d);
  return { top, angle: jawAngle(top) };
}
export const grip = { GRIP, OPEN, BOARD };

// 夾爪(以螺絲為原點;原圖量得,單位為 100 px)
const JAW = [
  [-2.3, 2.95], [-1.7, 3.02], [-0.95, 2.7], [-0.25, 2.1], [0.3, 1.3], [0.55, 0.3], [0.55, -0.7], [0.3, -1.6], [-0.1, -2.2],
  [-0.55, -2.4], [-0.9, -2.3], [-1.05, -2.0], [-1.05, -1.7], [-0.75, -1.45], [-0.5, -1.1], [-0.55, -0.7], [-0.75, -0.3],
  [-0.85, 0.3], [-0.9, 1.0], [-1.05, 1.5], [-1.3, 1.9], [-1.7, 2.5], [-2.2, 2.8],
].reverse();
// 木料的頂端頂著夾爪的上臂,把夾爪從張開(OPEN)一路推到夾緊(GRIP):轉角由頂端與上臂的接觸算
const jawAngle = (top) =>
  Math.min(OPEN, swingUntilContact({ pivot: [0, 0], outline: JAW, from: GRIP - 0.1, into: 1, sweep: OPEN - GRIP + 0.1 }, [[[BOARD.x[0], top - 0.3], [BOARD.x[1], top - 0.3], [BOARD.x[1], top], [BOARD.x[0], top]]]));
// 夾緊時木料頂端的高度:正好把夾爪頂到 GRIP(BOARD.top 是原圖量的概略位置,以它為中心找)
const TOP_AT = (() => {
  let lo = BOARD.top - 0.8;
  let hi = BOARD.top + 0.8;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (jawAngle(mid) > GRIP) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
})();
/** 鉤的最左緣(局部),夾緊時貼著木料 */
export const nose = [-1.05, -1.85];

const head = (at) => [
  { kind: "cylinder", radius: at[2], length: 0.1, at: [at[0], at[1], 0.05] },
  { kind: "box", size: [2 * at[2] * 0.9, 0.1, 0.06], at: [at[0], at[1], 0.13], angle: 0.15 },
];

export default {
  figure: 180,
  parts: [
    {
      id: "plate",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(rect(PLATE.x[1] - PLATE.x[0], PLATE.y[1] - PLATE.y[0], (PLATE.x[0] + PLATE.x[1]) / 2, (PLATE.y[0] + PLATE.y[1]) / 2)), thickness: 0.3, at: [0, 0, 0.25] },
        ...head([-2.15, 1.45, 0.2]).map((p) => ({ ...p, at: [p.at[0], p.at[1], p.at[2] + 0.4] })),
        ...head([-2.15, -1.75, 0.2]).map((p) => ({ ...p, at: [p.at[0], p.at[1], p.at[2] + 0.4] })),
      ],
    },
    { id: "board", kind: "box", size: [BOARD.x[1] - BOARD.x[0], BOARD.top - BOARD.bottom, 0.3] },
    { id: "jaw", kind: "plate", shape: shape(JAW, [circle(0.36).reverse()]), thickness: 0.15, arrow: false },
    { id: "screw", kind: "group", arrow: false, pieces: [{ kind: "cylinder", radius: 0.34, length: 0.3, at: [0, 0, 0.15] }, ...head([0, 0, 0.34]).map((p) => ({ ...p, at: [p.at[0], p.at[1], p.at[2] + 0.25] }))] },
  ],
  driver: { part: "board", type: "translation", direction: [0, 1, 0], range: [0, PUSH], initial: PUSH },
  target: "jaw",
  view: { direction: [0.06, 0.05, 1] },
  pose(d) {
    const { top, angle } = clamp(d);
    return {
      parts: {
        board: { position: [(BOARD.x[0] + BOARD.x[1]) / 2, top - (BOARD.top - BOARD.bottom) / 2, 0] },
        jaw: { angle },
      },
      readouts: [],
    };
  },
};
