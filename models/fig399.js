// 第 399 種:修理鏈條、或把當拉索與支柱用的鏈條拉緊的方法。這個鏈節由兩半做成,每一半的一端有旋轉螺帽、另一端有螺絲,
// 每一半的螺絲旋進另一半的螺帽裡。轉動兩個螺帽,兩半就互相拉近(把鏈條拉緊)或推開。
// 推斷:這是一個靜止的器具,模型重現它被使用時的動作(轉螺帽把鏈節收緊);螺距與可調的長度。
//
// 2026-10-07 複查:原本主動件是上半的平移(往下拉等於轉螺帽),螺帽不會轉;改成以上半的旋轉螺帽為主動件,
// 兩個螺帽都看得出轉向。兩根螺絲並排拉著兩半,一根拉近、另一根也得拉近同樣的量,所以兩個螺帽要一起轉
// (操作的人兩個一起轉;模型讓下半的螺帽照同樣的圈數轉——推斷)。兩半每轉一圈共拉近一個螺距,各移半個螺距
// (原本算成各移一個螺距)。
import { Y, TAU, clamp, screwAdvance } from "./kit.js";
import { shape, thickLine, polygon } from "./shapes.js";

export const PITCH = 0.12;
export const RANGE = [0, 10 * TAU];
const W = 0.75; // 鏈節半寬
const NUT_Y = -0.26; // 螺帽在半個鏈節局部的高度(在側邊直桿的下端底下)

/** 螺帽轉 a → 兩半拉近的總量(兩根螺絲並排,每轉一圈一個螺距) */
export const tighten = (a) => screwAdvance(clamp(a, ...RANGE), PITCH);

// 半個鏈節:U 形彎頭+一側的螺帽座(螺帽卡在座裡轉)+另一側的螺絲(局部:彎頭朝上)
const half = [
  { kind: "plate", shape: shape(thickLine(Array.from({ length: 13 }, (_, i) => { const t = Math.PI * (i / 12); return [W * Math.cos(t), 1.2 + W * Math.sin(t)]; }), 0.18)), thickness: 0.18 },
  { kind: "box", size: [0.18, 1.2, 0.18], at: [-W, 0.6, 0] },
  { kind: "box", size: [0.18, 1.2, 0.18], at: [W, 0.6, 0] },
  { kind: "worm", axis: Y, radius: 0.08, length: 1.0, pitch: PITCH, thread: 0.03, at: [-W, -0.4, 0] },
  // 螺帽座:兩片夾著螺帽的耳
  { kind: "box", size: [0.42, 0.06, 0.34], at: [W, NUT_Y + 0.25, 0] },
  { kind: "box", size: [0.42, 0.06, 0.34], at: [W, NUT_Y - 0.25, 0] },
];
// 旋轉螺帽:六角柱,軸沿 y;記號在一個角上
const nut = (id) => ({ id, kind: "group", axis: Y, spin: 0.22, pieces: [{ kind: "plate", shape: shape(polygon(6, 0.2)), thickness: 0.42 }, { kind: "box", size: [0.06, 0.06, 0.44], at: [0.17, 0, 0], accent: true }] });

export default {
  figure: 399,
  parts: [
    { id: "upper", kind: "group", arrow: false, pieces: half },
    // 下半是上半轉半圈:它的螺桿在右邊、穿過上半的螺帽,上半的螺桿在左邊、穿過它的螺帽
    { id: "lower", kind: "group", arrow: false, pieces: half },
    nut("nutU"),
    nut("nutL"),
  ],
  driver: { part: "nutU", type: "rotation", range: RANGE, initial: 0 },
  target: "lower", // 鏈節的另一半:被螺帽拉近
  view: { direction: [0.08, 0.05, 1] },
  pose(a0) {
    const a = clamp(a0, ...RANGE);
    const d = tighten(a) / 2; // 兩半各移一半
    const yu = 0.65 - d;
    const yl = -0.65 + d;
    return {
      parts: {
        upper: { position: [0, yu, 0] },
        lower: { position: [0, yl, 0], rotation: [0, 0, 1, 0] },
        nutU: { position: [W, yu + NUT_Y, 0], angle: a },
        nutL: { position: [-W, yl - NUT_Y, 0], angle: -a },
      },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["upper", "lower"], reason: "螺桿旋在另一半的螺帽裡,螺桿的端頭在螺帽座裡面(螺孔沒有畫出來)" },
    { check: "interference", parts: ["upper", "nutL"], reason: "接合處:上半的螺絲旋在下半的螺帽裡,收得還不多時螺絲的端頭停在螺帽裡面(螺孔沒畫)" },
    { check: "interference", parts: ["lower", "nutU"], reason: "接合處:下半的螺絲旋在上半的螺帽裡,收得還不多時螺絲的端頭停在螺帽裡面(螺孔沒畫)" },
  ],
};
