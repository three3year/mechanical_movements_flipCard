// 第 399 種:修理鏈條、或把當拉索與支柱用的鏈條拉緊的方法。這個鏈節由兩半做成,每一半的一端有旋轉螺帽、另一端有螺絲,
// 每一半的螺絲旋進另一半的螺帽裡。轉動兩個螺帽,兩半就互相拉近(把鏈條拉緊)或推開。
// 主動件是鏈節的上半(往下拉等於轉動兩個螺帽:兩半互相拉近,每轉一圈一個螺距)。
// 推斷:這是一個靜止的器具,模型重現它被使用時的動作(轉螺帽把鏈節收緊);螺距與可調的長度。
import { Y, TAU, clamp, screwAdvance } from "./kit.js";
import { shape, thickLine } from "./shapes.js";

export const PITCH = 0.12;
export const RANGE = [0, 5 * TAU];
const W = 0.75; // 鏈節半寬

/** 螺帽轉 a → 兩半鏈節各自往中間移的距離(每個螺帽每轉一圈一個螺距) */
export const tighten = (a) => screwAdvance(clamp(a, ...RANGE), PITCH);

// 半個鏈節:U 形彎頭+一側的螺帽座+另一側的螺絲(局部:彎頭朝上)
const half = (s) => [
  { kind: "plate", shape: shape(thickLine(Array.from({ length: 13 }, (_, i) => { const t = Math.PI * (i / 12); return [W * Math.cos(t), 1.2 + W * Math.sin(t)]; }), 0.18)), thickness: 0.18 },
  { kind: "box", size: [0.18, 1.2, 0.18], at: [-W, 0.6, 0] },
  { kind: "box", size: [0.18, 1.2, 0.18], at: [W, 0.6, 0] },
  // 左側往下伸的螺絲、右側的旋轉螺帽(另一半鏡像)
  { kind: "worm", axis: Y, radius: 0.08, length: 1.0, pitch: PITCH, thread: 0.03, at: [s * -W, -0.4, 0] },
  { kind: "box", size: [0.4, 0.75, 0.32], at: [s * W, -0.2, 0], accent: s > 0 },
];

export default {
  figure: 399,
  parts: [
    { id: "upper", kind: "group", arrow: false, pieces: half(1) },
    // 下半是上半轉半圈:它的螺桿在右邊、穿過上半的螺帽塊,上半的螺桿在左邊、穿過它的螺帽塊
    { id: "lower", kind: "group", arrow: false, pieces: half(1).map((p) => ({ ...p, accent: false })) },
  ],
  driver: { part: "upper", type: "translation", direction: [0, -1, 0], range: [0, tighten(RANGE[1])], initial: 0 },
  target: "lower", // 鏈節的另一半:被螺帽拉近
  view: { direction: [0.08, 0.05, 1] },
  pose(d0) {
    const d = clamp(d0, 0, tighten(RANGE[1]));
    return {
      parts: {
        upper: { position: [0, 0.65 - d, 0] },
        lower: { position: [0, -0.65 + d, 0], rotation: [0, 0, 1, 0] },
      },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["upper", "lower"], reason: "螺桿旋在另一半的螺帽塊裡,螺桿的端頭在塊裡面(螺孔沒有畫出來)" },
  ],
};
