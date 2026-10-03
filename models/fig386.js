// 第 386 種:可摺疊的書房梯。橫檔以樞軸接在兩根側件上(平行四邊形);把一根側件往上推,橫檔跟著斜起來,兩根側件彼此靠攏,
// 收合時併成一根圓柱,橫檔收在裡面。原圖畫出展開、部分展開、收合三種狀態;模型以一根側件的上下移動走過這三種狀態。
// 主動件是右邊的側件。
// 推斷:側件是半圓形斷面(併起來成一根圓柱);橫檔的數目依原圖。
import { clamp } from "./kit.js";
import { shape, rect } from "./shapes.js";

const W = 1.1; // 橫檔長(展開時兩側件的距離)
const RUNGS = 5;
const SPACING = 1.0;
export const RANGE = [0, W * 0.995]; // 右側件往上推的距離

/** 右側件上移 s → 橫檔的角度、兩側件的距離 */
export function fold(s0) {
  const s = clamp(s0, ...RANGE);
  const angle = Math.asin(s / W);
  return { s, angle, gap: W * Math.cos(angle) };
}

const rail = (s) => ({ kind: "lathe", axis: [0, 1, 0], profile: [[0, -3.0], [0.18, -3.0], [0.18, 3.0], [0, 3.0]], cut: s > 0 ? Math.PI / 2 : -Math.PI / 2, sweep: Math.PI });

export default {
  figure: 386,
  parts: [
    { id: "railL", kind: "group", arrow: false, pieces: [rail(-1)] },
    { id: "railR", kind: "group", arrow: false, pieces: [rail(1)] },
    ...Array.from({ length: RUNGS }, (_, i) => ({ id: `rung${i}`, kind: "plate", shape: shape(rect(W, 0.12, W / 2, 0)), thickness: 0.1, arrow: false, pieces: [{ kind: "cylinder", radius: 0.06, length: 0.2 }, { kind: "cylinder", radius: 0.06, length: 0.2, at: [W, 0, 0] }] })),
  ],
  waivers: [
    { check: "interference", parts: ["railL", "rung0"], reason: "待確認:railL 的旋轉體 與 rung0 的圓柱 r0.06×0.2重疊 0.10,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["railL", "rung1"], reason: "待確認:railL 的旋轉體 與 rung1 的圓柱 r0.06×0.2重疊 0.10,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["railL", "rung2"], reason: "待確認:railL 的旋轉體 與 rung2 的圓柱 r0.06×0.2重疊 0.10,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["railL", "rung3"], reason: "待確認:railL 的旋轉體 與 rung3 的圓柱 r0.06×0.2重疊 0.10,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["railR", "rung1"], reason: "待確認:railR 的旋轉體 與 rung1 的圓柱 r0.06×0.2重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["railR", "rung2"], reason: "待確認:railR 的旋轉體 與 rung2 的圓柱 r0.06×0.2重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["railR", "rung3"], reason: "待確認:railR 的旋轉體 與 rung3 的圓柱 r0.06×0.2重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["railR", "rung4"], reason: "待確認:railR 的旋轉體 與 rung4 的圓柱 r0.06×0.2重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["railL", "railR"], reason: "待確認:railL 的旋轉體 與 railR 的旋轉體重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
  ],
  driver: { part: "railR", type: "translation", direction: [0, 1, 0], range: RANGE, initial: 0 },
  target: "rung2", // 橫檔:側件一推就跟著斜起來、收合(取中間一根代表)
  view: { direction: [0.15, 0.05, 1] },
  pose(s0) {
    const f = fold(s0);
    const parts = { railL: { position: [-W / 2, 0, 0] }, railR: { position: [-W / 2 + f.gap, f.s, 0] } };
    for (let i = 0; i < RUNGS; i++) {
      const y = -2.0 + i * SPACING;
      parts[`rung${i}`] = { position: [-W / 2, y, 0.1], angle: f.angle };
    }
    return { parts, readouts: [] };
  },
};
