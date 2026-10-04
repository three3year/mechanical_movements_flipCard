// 第 362 種:上方的軸連同它的鼓輪交替地左右橫移。上方軸右端伸出一根銷,往下插進下方圓筒上的傾斜溝槽;
// 下方圓筒轉動時,斜溝槽把銷左右推,上方軸與鼓輪便來回橫移(圓筒每轉一圈一個來回)。主動件是下方的圓筒。
// 推斷:溝槽是一個斜截平面與圓筒面的交線,所以橫移隨轉角成正弦變化;斜度依原圖。
import { X, Y, TAU } from "./kit.js";

const UP_Y = 1.45;
const LOW = { center: [1.6, -0.55, 0], r: 0.75, length: 1.3 };
const SLANT = 0.45; // 溝槽在圓筒上的軸向幅度(單邊)

/** 下方圓筒轉 theta → 上方軸的橫移量(銷在圓筒頂上,溝槽在那裡的軸向位置) */
export const traverse = (theta) => -SLANT * Math.cos(theta);

// 斜溝槽:圓筒面上 x = −SLANT·cos(φ) 的曲線,以兩條凸棱表示(圓筒局部:軸沿 z)
const groove = (d) =>
  Array.from({ length: 73 }, (_, i) => {
    const phi = (i / 72) * TAU;
    // 圓筒局部角 phi 在頂端(世界 +y)時,溝槽的軸向位置要等於 traverse(theta)
    return [(LOW.r + 0.03) * Math.cos(phi), (LOW.r + 0.03) * Math.sin(phi), -SLANT * Math.cos(phi - Math.PI / 2) + d];
  });

export default {
  figure: 362,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.3, 3.4, 0.4], at: [-1.55, 0.0, -0.2] },
        { kind: "box", size: [0.3, 3.4, 0.4], at: [0.6, 0.0, -0.2] },
        { kind: "box", size: [0.3, 2.0, 0.4], at: [2.75, -0.7, -0.2] },
        { kind: "box", size: [5.6, 0.15, 0.8], at: [0.6, -1.75, -0.2] },
      ],
    },
    {
      id: "upper",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "cylinder", axis: X, radius: 0.08, length: 4.4, at: [0.1, UP_Y, 0] },
        { kind: "cylinder", axis: X, radius: 0.85, length: 1.25, at: [-0.5, UP_Y, 0] },
        // 右端往下的銷,插進下方圓筒的溝槽
        { kind: "cylinder", axis: Y, radius: 0.06, length: 1.25, at: [LOW.center[0], UP_Y - 0.65, 0] }, // 從動銷往下伸進圓筒上的溝槽
      ],
    },
    {
      id: "cylinder",
      kind: "group",
      axis: X,
      center: LOW.center,
      spin: LOW.r,
      spinOffset: -LOW.length / 2,
      pieces: [
        { kind: "cylinder", radius: LOW.r, length: LOW.length, mark: true },
        { kind: "cylinder", radius: 0.07, length: 3.2 },
        { kind: "tube", points: groove(0.07), closed: true, radius: 0.025 },
        { kind: "tube", points: groove(-0.07), closed: true, radius: 0.025 },
      ],
    },
  ],
  driver: { part: "cylinder", type: "rotation" },
  target: "upper", // 來回橫移的上方軸
  view: { direction: [0.1, 0.25, 1] },
  pose(theta) {
    return { parts: { cylinder: { angle: theta }, upper: { position: [traverse(theta), 0, 0] } }, readouts: [] };
  },
};
