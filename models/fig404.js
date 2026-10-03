// 第 404 種:另一種弧線繪製儀。一根彈性的拱形桿,兩端的高度是中間的一半,形狀設計成彎到最大時外緣恰好是一段真的圓弧;
// 給定所求圓弧上的三個點,就用中間的螺絲把桿彎到通過這些點,兩端各以一個小滾子貼著下方的直桿。
// 主動件是螺絲(下面的翼形手柄):轉動它,拱形桿中間被頂高,弧變得更彎。
// 推斷:這是一個靜止的器具,模型重現使用時的動作(調螺絲改變弧的彎度);拱形桿始終彎成一段圓弧(原文說設計成如此)。
import { Y, TAU, clamp, screwAdvance } from "./kit.js";
import { shape, rect } from "./shapes.js";

const HALF = 2.2; // 弦的一半(兩端滾子之間)
export const PITCH = 0.08;
export const RANGE = [0, 6 * TAU]; // 螺絲轉的角度
const H0 = 0.25; // 最平時的弧高

/** 螺絲轉 a → 弧高(中間被頂起的量)與圓弧的圓心、半徑 */
export function arch(a0) {
  const a = clamp(a0, ...RANGE);
  const h = H0 + screwAdvance(a, PITCH);
  const r = (HALF * HALF + h * h) / (2 * h);
  return { h, r, center: [0, 0.5 + h - r, 0] };
}

export default {
  figure: 404,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 下方的直桿與兩端的立柱(滾子貼在立柱上)
        { kind: "plate", shape: shape(rect(2 * HALF + 0.6, 0.35, 0, 0)), thickness: 0.2 },
        { kind: "box", size: [0.25, 1.4, 0.25], at: [-HALF - 0.2, 0.5, 0] },
        { kind: "box", size: [0.25, 1.4, 0.25], at: [HALF + 0.2, 0.5, 0] },
      ],
    },
    { id: "bar", kind: "rod", radius: 0.08 },
    {
      id: "screw",
      kind: "group",
      axis: Y,
      spin: 0.4,
      pieces: [
        { kind: "worm", radius: 0.1, length: 1.35, pitch: PITCH, thread: 0.03, at: [0, 0, 0.675] },
        // 翼形螺帽
        { kind: "box", size: [0.7, 0.18, 0.12], at: [0, 0, -0.9], accent: true },
        { kind: "cylinder", radius: 0.08, length: 0.5, at: [0, 0, -0.6] },
      ],
    },
  ],
  driver: { part: "screw", type: "rotation", range: RANGE, initial: RANGE[1] / 2 },
  view: { direction: [0.03, 0.05, 1] },
  pose(a0) {
    const s = arch(a0);
    const half = Math.asin(HALF / s.r);
    const points = Array.from({ length: 41 }, (_, i) => {
      const t = Math.PI / 2 - half + (2 * half * i) / 40;
      return [s.center[0] + s.r * Math.cos(t), s.center[1] + s.r * Math.sin(t), 0];
    });
    return {
      parts: { screw: { angle: clamp(a0, ...RANGE), position: [0, -0.6 + (s.h - H0), 0] } },
      paths: { bar: { points, closed: false } },
      readouts: [],
    };
  },
};
