// 第 305 種:單銷式擺鐘擒縱。擒縱輪是一個很小的圓盤,上面只有一根偏心的銷;擺(瓶形框架,下端兩個擺錘)
// 每擺一次,圓盤轉半圈,銷把衝量傳到叉瓦的垂直面上,叉瓦的水平面則是靜擊面(銷靠在上面時圓盤不動)。
// 主動件是擺(累計擺動)。
// 推斷:擺幅與框架裡叉瓦缺口的尺寸(依原圖)。
import { deg, swing } from "./kit.js";
import { escapeStep } from "./escapement.js";
import { shape, circle, rect, thickLine } from "./shapes.js";

export const SWING = deg(6);
const PIVOT = [0, 2.4, 0];
const DISC = [0, -0.25, 0.2];

/** 擺累計擺動 v → 擺角、圓盤轉角(每擺一次半圈) */
export function singlePin(v) {
  return { pendulum: swing(v, -SWING, SWING), disc: escapeStep(v, -SWING, SWING, Math.PI, 0.5) };
}

// 瓶形框架(相對樞軸):細頸往下、肚子圍著圓盤
const body = Array.from({ length: 25 }, (_, i) => {
  const t = i / 24;
  const y = -0.6 - t * 3.2;
  const w = 0.2 + 1.1 * Math.sin(Math.min(1, t * 1.25) * (Math.PI / 2)) ** 1.5;
  return [w, y];
});
const frameLoop = [...body, ...body.map(([x, y]) => [-x, y]).reverse()];

export default {
  figure: 305,
  parts: [
    {
      id: "pendulum",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([...frameLoop, frameLoop[0]], 0.1)), thickness: 0.1 },
        { kind: "plate", shape: shape(rect(0.16, 0.7, 0, -0.3)), thickness: 0.12 },
        { kind: "sphere", radius: 0.22 },
        // 叉瓦:框架裡的缺口,上下水平靜擊面、中間垂直衝擊面
        { kind: "plate", shape: shape([[-0.55, -2.35], [0.35, -2.35], [0.35, -2.5], [0.05, -2.5], [0.05, -2.8], [0.35, -2.8], [0.35, -2.95], [-0.55, -2.95]]), thickness: 0.14, at: [0, 0, 0.05] },
        // 下端兩個擺錘
        { kind: "sphere", radius: 0.32, at: [-0.6, -3.55, 0] },
        { kind: "sphere", radius: 0.32, at: [0.6, -3.55, 0] },
      ],
    },
    {
      id: "disc",
      kind: "plate",
      center: DISC,
      shape: shape(circle(0.36), [circle(0.05).reverse()]),
      thickness: 0.08,
      spin: 0.36,
      pieces: [{ kind: "cylinder", radius: 0.07, length: 0.3, at: [0.25, 0, 0.1], accent: true }],
    },
  ],
  driver: { part: "pendulum", type: "rotation", cycle: [-SWING, SWING] },
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const s = singlePin(v);
    return { parts: { pendulum: { angle: s.pendulum }, disc: { angle: s.disc } }, readouts: [] };
  },
};
