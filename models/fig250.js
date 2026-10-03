// 第 250 種:抗摩擦軸承。軸不放在一般的軸承裡,而是架在兩個大輪的輪緣上(兩輪一前一後、互相交疊),
// 軸轉動時兩個支撐輪跟著反向轉,接觸處是滾動而不是滑動,摩擦降到最低。主動件是軸。
// 推斷:軸頸與支撐輪的尺寸比例(依原圖)。
import { deg } from "./kit.js";
import { shape, circle, arcPoints } from "./shapes.js";

const WHEEL = 1.55;
const JOURNAL = 0.5;
const SPREAD = 1.15; // 兩支撐輪中心離中線的距離
const LIFT = Math.sqrt((WHEEL + JOURNAL) ** 2 - SPREAD ** 2); // 軸心高出支撐輪中心的量
export const geometry = { WHEEL, JOURNAL };

/** 軸轉 angle:兩支撐輪的轉角(反向;接觸點線速度相等) */
export const supportAngle = (angle) => (-angle * JOURNAL) / WHEEL;

const wheel = (id, x, z) => ({
  id,
  kind: "pulley",
  style: "spoked",
  spokes: 4,
  center: [x, 0, z],
  radius: WHEEL,
  width: 0.14,
  pieces: [{ kind: "cylinder", radius: 0.06, length: 0.75, at: [0, 0, -z] }],
});

// 支架:下寬上窄的板,中間挖一個拱形開口,上緣兩角托著支撐輪的軸
const frame = shape(
  [[-2.0, -2.05], [2.0, -2.05], [2.0, -1.85], [1.55, -1.85], [1.45, 0.45], [1.0, 0.75], [-1.0, 0.75], [-1.45, 0.45], [-1.55, -1.85], [-2.0, -1.85]],
  [[[-1.05, -1.6], [-0.75, -0.5], ...arcPoints(0.75, deg(180), deg(0), 0, -0.5).slice(1, -1), [0.75, -0.5], [1.05, -1.6]].reverse()],
);

export default {
  figure: 250,
  parts: [
    { id: "frame", kind: "plate", shape: frame, thickness: 0.2, center: [0, 0, -0.45], pieces: [{ kind: "cylinder", radius: 0.15, length: 0.3, at: [-SPREAD, 0, 0.1] }, { kind: "cylinder", radius: 0.15, length: 0.3, at: [SPREAD, 0, 0.1] }] },
    wheel("left", -SPREAD, 0.12),
    wheel("right", SPREAD, -0.12),
    {
      id: "shaft",
      kind: "pulley",
      style: "disc",
      center: [0, LIFT, 0],
      radius: JOURNAL,
      width: 0.42,
      pieces: [{ kind: "cylinder", radius: 0.16, length: 1.4 }, { kind: "plate", shape: shape(circle(0.42), [circle(0.3).reverse()]), thickness: 0.05, at: [0, 0, 0.22] }],
    },
  ],
  driver: { part: "shaft", type: "rotation" },
  view: { direction: [0.04, 0.06, 1] },
  pose(angle) {
    const a = supportAngle(angle);
    return { parts: { shaft: { angle }, left: { angle: a }, right: { angle: a } }, readouts: [] };
  },
};
