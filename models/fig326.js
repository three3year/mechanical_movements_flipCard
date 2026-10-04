// 第 326 種:引導引擎活塞桿作平行(直線)運動的簡易方式。活塞桿頂端的滑塊 A 在框架立柱上的直溝槽裡上下滑動
// (溝槽的兩面削平),連桿從滑塊接到頂上飛輪軸的曲柄。主動件是飛輪(原圖沒有畫出汽缸)。
// 推斷:曲柄半徑、連桿長(依原圖)。
import { TAU, deg } from "./kit.js";
import { crankSlider } from "./vertical-engine.js";
import { shape, rect, circle, arcPoints } from "./shapes.js";

const CRANK = [0, 2.3, 0];
const R = 0.45;
const ROD = 2.6;

/** 飛輪轉 theta → 曲柄銷與滑塊 A 的高度 */
export const slider = (theta) => crankSlider(CRANK, R, ROD, theta);

// 框架立柱:上窄下寬,中間一道直溝槽
const column = shape(
  [[-1.25, -2.6], [1.25, -2.6], [1.25, -2.3], [0.95, -2.2], [0.55, 1.6], [0.75, 1.95], [-0.75, 1.95], [-0.55, 1.6], [-0.95, -2.2], [-1.25, -2.3]],
  [rect(0.32, 2.9, 0, -0.45).reverse()],
);

export default {
  figure: 326,
  parts: [
    { id: "column", kind: "plate", shape: column, thickness: 0.5, center: [0, 0, -0.3] },
    {
      id: "flywheel",
      kind: "group",
      center: CRANK,
      spin: 3.0,
      pieces: [
        { kind: "plate", shape: shape([...arcPoints(3.25, 0, TAU).slice(0, -1)], [arcPoints(3.0, 0, TAU).slice(0, -1).reverse()]), thickness: 0.2, at: [0, 0, -0.75] },
        ...[0, 1, 2, 3].map((i) => ({ kind: "box", size: [6.0, 0.14, 0.1], at: [0, 0, -0.75], angle: deg(30) + (i * Math.PI) / 4 })),
        { kind: "cylinder", radius: 0.22, length: 1.0, at: [0, 0, -0.35] },
        // 曲柄與曲柄銷
        { kind: "plate", shape: shape([[0, -0.15], [R, -0.1], [R, 0.1], [0, 0.15]], [circle(0.06).reverse()]), thickness: 0.1, at: [0, 0, 0.12] },
        { kind: "cylinder", radius: 0.07, length: 0.3, at: [R, 0, 0.2], accent: true },
      ],
    },
    { id: "rod", kind: "link", width: 0.14, thickness: 0.08 },
    { id: "sliderA", kind: "box", size: [0.3, 0.5, 0.36], label: "A", labelOffset: [-0.45, 0, 0.3], pieces: [{ kind: "box", size: [0.08, 3.0, 0.08], at: [0, -1.7, 0] }] },
  ],
  driver: { part: "flywheel", type: "rotation" },
  target: "sliderA", // 被導引走直線的滑塊
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const { pin, y } = slider(theta);
    return {
      parts: { flywheel: { angle: theta }, rod: { from: [pin[0], pin[1], 0.27], to: [0, y, 0.27] }, sliderA: { position: [0, y, 0] } },
      readouts: [],
    };
  },
};
