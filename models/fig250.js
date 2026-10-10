// 第 250 種:抗摩擦軸承。軸不放在一般的軸承裡,而是架在兩個大輪的輪緣上(兩輪一前一後、互相交疊),
// 軸轉動時兩個支撐輪跟著反向轉,接觸處是滾動而不是滑動,摩擦降到最低。主動件是軸。
// 軸上帶著一個大輪(原圖頂上的大圓,半徑約為支撐輪的 0.8 倍;507movements 的動畫也是這樣),
// 就是這組軸承托著轉的東西;它在兩支撐輪後面,支架板在兩輪前面(原圖支架擋住兩輪的下半)。
// 推斷:軸頸與支撐輪的尺寸比例(依原圖);大輪的輪緣、腹板開孔與輪轂(依 507movements 的動畫)。
import { deg } from "./kit.js";
import { shape, circle, arcPoints } from "./shapes.js";

const WHEEL = 1.55;
const JOURNAL = 0.5;
const SPREAD = 1.15; // 兩支撐輪中心離中線的距離
const LIFT = Math.sqrt((WHEEL + JOURNAL) ** 2 - SPREAD ** 2); // 軸心高出支撐輪中心的量
const BIG = 0.8 * WHEEL; // 軸上帶的大輪
const BIG_Z = -0.38; // 大輪的層:在後支撐輪(z −0.19 以後)的後面
const FRAME_Z = 0.42; // 支架板的層:在前支撐輪(z 0.19 以前)的前面
const AXLE_END = FRAME_Z + 0.17; // 支撐輪軸的前端:伸出支架前面的軸座一點
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
  // 輪軸從輪的背面往前穿過支架板,軸端露在前面的軸座上(原圖支架上角的兩個圓)
  pieces: [{ kind: "cylinder", radius: 0.06, length: AXLE_END - (z - 0.1), at: [0, 0, (AXLE_END + z - 0.1) / 2 - z] }],
});

// 大輪:輪緣+有四個開孔的腹板+輪轂(輪緣內圈、輪轂的比例照 507movements 的動畫:4、3.2、1.4)
const bigWheel = [
  { kind: "plate", shape: shape(circle(BIG), [circle(0.8 * BIG).reverse()]), thickness: 0.14, at: [0, 0, BIG_Z] },
  {
    kind: "plate",
    shape: shape(circle(0.8 * BIG + 0.03), [0, 1, 2, 3].map((k) => circle(0.19, 0.58 * BIG * Math.cos(deg(45 + 90 * k)), 0.58 * BIG * Math.sin(deg(45 + 90 * k))).reverse())),
    thickness: 0.05,
    at: [0, 0, BIG_Z],
  },
  { kind: "cylinder", radius: 0.35 * BIG, length: 0.24, at: [0, 0, BIG_Z] },
];

// 支架:下寬上窄的板,中間挖一個拱形開口,上緣兩角托著支撐輪的軸
const frame = shape(
  [[-2.0, -2.05], [2.0, -2.05], [2.0, -1.85], [1.55, -1.85], [1.45, 0.45], [1.0, 0.75], [-1.0, 0.75], [-1.45, 0.45], [-1.55, -1.85], [-2.0, -1.85]],
  [[[-1.05, -1.6], [-0.75, -0.5], ...arcPoints(0.75, deg(180), deg(0), 0, -0.5).slice(1, -1), [0.75, -0.5], [1.05, -1.6]].reverse()],
);

export default {
  figure: 250,
  parts: [
    // 支架板在兩輪前面,前後的軸座托著兩支撐輪的輪軸
    { id: "frame", kind: "plate", shape: frame, thickness: 0.2, center: [0, 0, FRAME_Z], pieces: [-SPREAD, SPREAD].flatMap((x) => [{ kind: "cylinder", radius: 0.15, length: 0.16, at: [x, 0, -0.14] }, { kind: "cylinder", radius: 0.17, length: 0.06, at: [x, 0, 0.12] }]) },
    wheel("left", -SPREAD, 0.12),
    wheel("right", SPREAD, -0.12),
    {
      id: "shaft",
      kind: "pulley",
      style: "disc",
      center: [0, LIFT, 0],
      radius: JOURNAL,
      width: 0.42,
      pieces: [{ kind: "cylinder", radius: 0.16, length: 1.4 }, { kind: "plate", shape: shape(circle(0.42), [circle(0.3).reverse()]), thickness: 0.05, at: [0, 0, 0.22] }, ...bigWheel],
    },
  ],
  driver: { part: "shaft", type: "rotation" },
  targets: ["left", "right"], // 托著軸、跟著滾動的兩個支撐輪
  view: { direction: [0.04, 0.06, 1] },
  pose(angle) {
    const a = supportAngle(angle);
    return { parts: { shaft: { angle }, left: { angle: a }, right: { angle: a } }, readouts: [] };
  },
};
