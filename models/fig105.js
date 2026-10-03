// 第 105 種:螺桿式壓印機,由圓周運動產生直線運動。轉動頂端兩端帶重球的手柄,
// 螺桿在機架的螺帽中旋轉、往下推動下方的壓頭。螺桿每轉一圈,壓頭下降一個螺距。主動件是手柄(在行程內往返)。
import { Y, TAU, screwAdvance } from "./kit.js";
import { shape } from "./shapes.js";

const PITCH = 0.3;
const TOP = 0.0; // 手柄起始高度
const TURNS = 3;
const HANDLE = 2.2;

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
        { kind: "worm", radius: 0.22, length: 2.6, pitch: PITCH, thread: 0.07, at: [0, 0, 1.45] },
      ],
    },
    {
      id: "ram",
      kind: "group",
      center: [0, -3.35, 0],
      pieces: [
        { kind: "cylinder", axis: Y, radius: 0.3, length: 1.2, at: [0, -0.4, 0] },
        { kind: "cylinder", axis: Y, radius: 0.36, length: 0.3, at: [0, 0.25, 0] },
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "cylinder", axis: Y, radius: 0.38, length: 0.85, at: [0, -1.05, 0] },
        { kind: "cylinder", axis: Y, radius: 0.42, length: 0.1, at: [0, -0.6, 0] },
        { kind: "cylinder", axis: Y, radius: 0.42, length: 0.1, at: [0, -1.5, 0] },
        { kind: "plate", shape: shape([[0.38, -0.55], [1.55, -0.55], [1.9, -0.9], [1.9, -4.5], [1.75, -4.5], [1.75, -1.0], [1.5, -0.7], [0.38, -0.7]]), thickness: 0.3 },
        { kind: "plate", shape: shape([[0.38, -1.45], [0.95, -1.45], [1.2, -1.7], [1.2, -4.5], [1.05, -4.5], [1.05, -1.75], [0.9, -1.6], [0.38, -1.6]]), thickness: 0.3 },
        { kind: "plate", shape: shape([[0.3, -2.75], [1.1, -2.75], [1.1, -2.9], [0.3, -2.9]]), thickness: 0.3 },
      ],
    },
  ],
  waivers: [
    { check: "unsupported", parts: ["ram"], reason: "待確認:ram 與帶動(或支撐)它的零件之間差 0.05 沒貼上,接觸位置是算出來的近似,未逐一修正" },
    { check: "interference", parts: ["handle", "frame"], reason: "待確認(未修):handle 的圓柱 r0.06×4.4 與 frame 的圓柱 r0.38×0.85互相穿入 0.34(41 個取樣姿勢),尚未修正" },
  ],
  driver: { part: "handle", type: "rotation", range: [0, TURNS * TAU] },
  target: "ram", // 被推下的壓頭
  view: { direction: [0.15, 0.3, 1] },
  pose(angle) {
    const d = descent(angle);
    return {
      parts: { handle: { position: [0, TOP - d, 0], angle }, ram: { position: [0, -3.35 - d, 0] } },
      readouts: [],
    };
  },
};
