// 第 379 種(條目 379–380):可攜式夾鉗鑽。進料螺桿在 C 形夾鉗的下臂、與鑽頭相對:工件夾在螺桿頂端的墊塊與鑽頭之間,
// 轉動上臂的曲柄,鑽頭心軸旋轉;進料螺桿把墊塊與工件往上頂向鑽頭。主動件是曲柄;機構共用部分見 cramp-drill.js。
// 推斷:進料隨鑽頭的轉動以固定的量前進(原文只說螺桿與鑽頭相對)。
import { Y, clamp } from "./kit.js";
import { frame, crankPieces, feedOf, MAX } from "./cramp-drill.js";

const SCREW_Y0 = -2.6;

export default {
  figure: 379,
  parts: [
    frame,
    {
      id: "drill",
      kind: "group",
      axis: Y,
      center: [0.25, 1.9, 0],
      spin: 0.3,
      pieces: [
        { kind: "cylinder", radius: 0.07, length: 1.6, at: [0, 0, -0.3] },
        { kind: "cylinder", radius: 0.25, length: 0.5, at: [0, 0, -0.6] },
        { kind: "lathe", profile: [[0, -1.6], [0.06, -1.45], [0.08, -0.85], [0, -0.85]] },
        ...crankPieces.map((p) => ({ ...p, at: [p.at[0], p.at[1], p.at[2] + 0.6] })),
      ],
    },
    {
      id: "screw",
      kind: "group",
      axis: Y,
      arrow: false,
      pieces: [
        { kind: "worm", radius: 0.12, length: 1.6, pitch: 0.12, thread: 0.04 },
        { kind: "box", size: [0.6, 0.12, 0.45], at: [0, 0, 0.85] },
        // 下端的 T 形手柄
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.06, length: 1.3, at: [0, 0, -0.9] },
        { kind: "sphere", radius: 0.15, at: [0.65, 0, -0.9] },
        { kind: "sphere", radius: 0.15, at: [-0.65, 0, -0.9] },
      ],
    },
    { id: "work", kind: "box", size: [1.2, 0.18, 0.8] },
  ],
  driver: { part: "drill", type: "rotation", range: [0, MAX], initial: 0 },
  target: "work", // 被頂向鑽頭的工件
  view: { direction: [0.08, 0.06, 1] },
  pose(theta0) {
    const theta = clamp(theta0, 0, MAX);
    const f = feedOf(theta);
    return {
      parts: {
        drill: { angle: theta },
        screw: { position: [0.25, SCREW_Y0 + f, 0], angle: (f / 0.12) * Math.PI * 2 },
        work: { position: [0.25, SCREW_Y0 + 0.95 + f, 0] },
      },
      readouts: [],
    };
  },
};
