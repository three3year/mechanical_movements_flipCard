// 第 363 種:蹺蹺板,有限擺動運動(交替的圓周運動)最簡單的例子之一。長板在中間的支柱上以樞軸擺動,兩端各有座位。
// 主動件是長板(在支柱與地面限制的範圍內來回擺)。
// 推斷:擺動的範圍(一端碰到地面為止)。
import { deg, clamp } from "./kit.js";
import { shape, thickLine } from "./shapes.js";

const PIVOT = [0, 0.35, 0];
const HALF = 3.0;
export const RANGE = [deg(-17), deg(17)];

// 座位:板上一塊座板與一片靠背
const seat = (s) => [
  { kind: "box", size: [0.7, 0.1, 0.8], at: [s * (HALF - 0.55), 0.12, 0] },
  { kind: "plate", shape: shape(thickLine([[s * (HALF - 0.15), 0.08], [s * (HALF - 0.05), 0.6]], 0.1)), thickness: 0.8 },
];

export default {
  figure: 363,
  parts: [
    {
      id: "stand",
      kind: "group",
      pieces: [
        { kind: "box", size: [3.0, 0.15, 1.2], at: [0, -1.75, 0] },
        { kind: "box", size: [0.45, 2.0, 0.45], at: [0, -0.75, 0] },
        { kind: "plate", shape: shape([[-1.3, -1.67], [-0.22, -0.6], [-0.22, -1.0], [-0.9, -1.67]]), thickness: 0.4 },
        { kind: "plate", shape: shape([[1.3, -1.67], [0.9, -1.67], [0.22, -1.0], [0.22, -0.6]]), thickness: 0.4 },
        { kind: "cylinder", radius: 0.07, length: 0.7, at: PIVOT },
      ],
    },
    {
      id: "board",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [{ kind: "box", size: [2 * HALF, 0.12, 0.8], at: [0, 0.05, 0] }, ...seat(1), ...seat(-1)],
    },
  ],
  driver: { part: "board", type: "rotation", range: RANGE, initial: deg(-14) },
  view: { direction: [0.08, 0.1, 1] },
  pose(a) {
    return { parts: { board: { angle: clamp(a, ...RANGE) } }, readouts: [] };
  },
};
