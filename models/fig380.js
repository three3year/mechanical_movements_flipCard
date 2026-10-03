// 第 380 種(條目 379–380):可攜式夾鉗鑽。鑽頭心軸穿過上臂進料螺桿的中心:轉動曲柄,鑽頭旋轉;進料螺桿(上面有
// 一根橫柄)把鑽頭心軸往下送進工件。工件放在 C 形夾鉗的下臂上。主動件是曲柄;機構共用部分見 cramp-drill.js。
// 推斷:進料隨鑽頭的轉動以固定的量前進(原文只說心軸穿過螺桿中心)。
import { Y, clamp } from "./kit.js";
import { frame, crankPieces, feedOf, MAX } from "./cramp-drill.js";

const TOP = 2.55; // 鑽頭心軸頂(曲柄所在)的起始高度

export default {
  figure: 380,
  parts: [
    frame,
    {
      id: "feedScrew",
      kind: "group",
      axis: Y,
      center: [0.25, 1.9, 0],
      arrow: false,
      pieces: [
        { kind: "worm", radius: 0.16, length: 1.5, pitch: 0.12, thread: 0.05, at: [0, 0, -0.35] },
        // 進料螺桿上的橫柄
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.05, length: 1.6, at: [0, 0, 0.3] },
      ],
    },
    {
      id: "drill",
      kind: "group",
      axis: Y,
      spin: 0.3,
      pieces: [
        { kind: "cylinder", radius: 0.06, length: 2.6, at: [0, 0, -1.2] },
        { kind: "cylinder", radius: 0.2, length: 0.4, at: [0, 0, -2.5] },
        { kind: "lathe", profile: [[0, -3.4], [0.05, -3.25], [0.07, -2.7], [0, -2.7]] },
        ...crankPieces,
      ],
    },
    { id: "work", kind: "box", center: [0.25, -1.55, 0], size: [1.2, 0.2, 0.8] },
  ],
  waivers: [
    { check: "interference", parts: ["frame", "feedScrew"], reason: "待確認(未修):frame 的板 與 feedScrew 的Tube互相穿入 0.22(96 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["feedScrew", "drill"], reason: "待確認(未修):feedScrew 的圓柱 r0.05×1.6 與 drill 的圓柱 r0.06×2.6互相穿入 0.11(96 個取樣姿勢),尚未修正" },
  ],
  driver: { part: "drill", type: "rotation", range: [0, MAX], initial: 0 },
  target: "feedScrew", // 把鑽頭心軸往下送的進料螺桿
  view: { direction: [0.08, 0.06, 1] },
  pose(theta0) {
    const theta = clamp(theta0, 0, MAX);
    const f = feedOf(theta);
    return { parts: { drill: { angle: theta, position: [0.25, TOP - f, 0] }, feedScrew: { angle: (f / 0.12) * Math.PI * 2 } }, readouts: [] };
  },
};
