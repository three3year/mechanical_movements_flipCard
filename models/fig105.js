// 第 105 種:螺桿式壓印機,由圓周運動產生直線運動。轉動頂端兩端帶重球的手柄,
// 螺桿在機架的螺帽中旋轉、往下推動下方的壓頭。螺桿每轉一圈,壓頭下降一個螺距。主動件是手柄(在行程內往返)。
// 壓頭穿在機架下方的導環裡(照原圖下方那一圈),只能上下移動。螺桿下端是一顆球,轉在壓頭頂端的套筒裡,
// 套筒的蓋把球扣住:螺桿往下推、往回旋時把壓頭拉上來,壓頭不跟著轉(球頭與套筒是推斷,原圖只畫到套筒)。
import { Y, TAU, screwAdvance } from "./kit.js";
import { shape } from "./shapes.js";

const PITCH = 0.3;
const TOP = 0.6; // 手柄起始高度(旋到底時手柄的方塊正好落在螺帽上)
const TURNS = 3;
const HANDLE = 2.2;
const RAM = -3.45; // 壓頭的起始高度
const GUIDE = -4.55; // 導環的高度:壓頭在整個行程裡都穿在環裡,套筒降到最低時仍在環的上方

/** 手柄轉 angle(往下旋緊為正,繞 −y):螺桿與壓頭下降的量 */
export const descent = (angle) => screwAdvance(angle, PITCH);
export const pitch = PITCH;

export default {
  figure: 105,
  parts: [
    {
      id: "handle",
      kind: "group",
      axis: [0, -1, 0],
      center: [0, TOP, 0],
      spin: 0.4,
      pieces: [
        { kind: "cylinder", radius: 0.06, length: 2 * HANDLE, axis: [1, 0, 0] },
        { kind: "lathe", profile: [[0, -0.28], [0.22, -0.2], [0.26, 0], [0.22, 0.2], [0, 0.28]], axis: [1, 0, 0], at: [-HANDLE, 0, 0] },
        { kind: "lathe", profile: [[0, -0.28], [0.22, -0.2], [0.26, 0], [0.22, 0.2], [0, 0.28]], axis: [1, 0, 0], at: [HANDLE, 0, 0] },
        { kind: "box", size: [0.5, 0.5, 0.3], at: [0, 0, 0] },
        { kind: "sphere", radius: 0.1, at: [0, 0, -0.2] },
        { kind: "worm", radius: 0.22, length: 3.4, pitch: PITCH, thread: 0.07, at: [0, 0, 1.85] },
        { kind: "cylinder", radius: 0.08, length: 0.27, at: [0, 0, 3.67] }, // 球頭的頸
        { kind: "sphere", radius: 0.13, at: [0, 0, 3.8] }, // 螺桿下端的球頭,扣在壓頭的套筒裡
      ],
    },
    {
      id: "ram",
      kind: "group",
      center: [0, RAM, 0],
      pieces: [
        { kind: "cylinder", axis: Y, radius: 0.3, length: 1.7, at: [0, -0.75, 0] },
        { kind: "cylinder", axis: Y, radius: 0.36, inner: 0.2, length: 0.3, at: [0, 0.25, 0] }, // 套筒
        { kind: "cylinder", axis: Y, radius: 0.36, inner: 0.1, length: 0.06, at: [0, 0.43, 0] }, // 套筒的蓋
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "cylinder", axis: Y, radius: 0.38, length: 0.85, at: [0, -1.05, 0] },
        { kind: "cylinder", axis: Y, radius: 0.42, length: 0.1, at: [0, -0.6, 0] },
        { kind: "cylinder", axis: Y, radius: 0.42, length: 0.1, at: [0, -1.5, 0] },
        { kind: "plate", shape: shape([[0.38, -0.55], [1.55, -0.55], [1.9, -0.9], [1.9, -5.0], [1.75, -5.0], [1.75, -1.0], [1.5, -0.7], [0.38, -0.7]]), thickness: 0.3 },
        { kind: "plate", shape: shape([[0.38, -1.45], [0.95, -1.45], [1.2, -1.7], [1.2, -5.0], [1.05, -5.0], [1.05, -1.75], [0.9, -1.6], [0.38, -1.6]]), thickness: 0.3 },
        // 壓頭的導環與連到內側臂的托架
        { kind: "cylinder", axis: Y, radius: 0.42, inner: 0.31, length: 0.3, at: [0, GUIDE, 0] },
        { kind: "plate", shape: shape([[0.4, GUIDE + 0.07], [1.05, GUIDE + 0.07], [1.05, GUIDE - 0.07], [0.4, GUIDE - 0.07]]), thickness: 0.3 },
      ],
    },
  ],
  driver: { part: "handle", type: "rotation", range: [0, TURNS * TAU] },
  target: "ram", // 被推下的壓頭
  view: { direction: [0.15, 0.3, 1] },
  pose(angle) {
    const d = descent(angle);
    return {
      parts: { handle: { position: [0, TOP - d, 0], angle }, ram: { position: [0, RAM - d, 0] } },
      readouts: [],
    };
  },
};
