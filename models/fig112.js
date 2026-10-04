// 第 112 種:波斯鑽。鑽頭的柄部切有很快(導程很大)的螺紋,頂部的頭部讓它能自由旋轉。
// 手握柄部中段的螺帽,沿柄部快速地上下拉動,柄部(連同鑽頭)便交替地向右、向左旋轉:
// 螺帽移動一個導程,柄部轉一圈。主動件是螺帽(上下往返)。
import { Y, TAU } from "./kit.js";

const LEAD = 1.4; // 螺紋的導程
const RANGE = [-1.1, 0.8];

/** 螺帽高度 y:鑽頭的轉角 */
export const drillAngle = (y) => (TAU * y) / LEAD;
export const lead = LEAD;

export default {
  figure: 112,
  parts: [
    {
      id: "nut",
      kind: "group",
      pieces: [
        { kind: "lathe", axis: Y, profile: [[0.17, -0.25], [0.62, -0.25], [0.62, -0.15], [0.42, -0.1], [0.42, 0.1], [0.62, 0.15], [0.62, 0.25], [0.17, 0.25]] }, // 內孔貼著螺紋
      ],
    },
    {
      id: "stock",
      kind: "group",
      axis: Y,
      spin: 0.25,
      spinOffset: 1.2,
      pieces: [
        { kind: "worm", radius: 0.16, length: 3.4, pitch: LEAD, thread: 0.05 },
        { kind: "cylinder", radius: 0.22, length: 0.35, at: [0, 0, -1.9], mark: true },
        { kind: "lathe", profile: [[0, -2.1], [0.08, -2.1], [0.08, -2.5], [0.03, -2.75], [0, -2.8]] },
        { kind: "cylinder", radius: 0.25, length: 0.15, at: [0, 0, 1.8] },
      ],
    },
    {
      id: "head",
      kind: "lathe",
      axis: Y,
      center: [0, 1.88, 0], // 頂著鑽柄的上端
      profile: [[0, 0], [0.2, 0], [0.25, 0.08], [0.7, 0.15], [0.72, 0.22], [0.5, 0.35], [0, 0.4]],
    },
  ],
  driver: { part: "nut", type: "translation", direction: [0, 1, 0], range: RANGE, initial: 0 },
  target: "stock", // 交替正反旋轉的鑽柄
  view: { direction: [0.2, 0.25, 1] },
  pose(y) {
    return { parts: { nut: { position: [0, y, 0] }, stock: { angle: drillAngle(y) } }, readouts: [] };
  },
};
