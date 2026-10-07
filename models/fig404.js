// 第 404 種:另一種弧線繪製儀。一根彈性的拱形桿,兩端的高度是中間的一半,形狀設計成彎到最大時外緣恰好是一段真的圓弧;
// 給定所求圓弧上的三個點,就用中間的螺絲把桿彎到通過這些點,兩端各以一個小滾子貼著下方的直桿。
// 主動件是螺絲(下面的翼形手柄):轉動它,拱形桿中間被頂高,弧變得更彎。
// 推斷:這是一個靜止的器具,模型重現使用時的動作(調螺絲改變弧的彎度);拱形桿始終彎成一段圓弧(原文說設計成如此)。
// 2026-10-07 複查:原本兩端固定在立柱上、弦長不變,桿身越彎越長;改成桿長不變,頂得越彎兩端越往內收,兩端的小滾子
// 壓在下方直桿的上緣滾動(原文:「每一端都透過一個小滾子被限制貼靠在直線桿上」)。
import { Y, TAU, clamp, screwAdvance } from "./kit.js";
import { shape, rect } from "./shapes.js";

const HALF = 2.2; // 最平時弦的一半(兩端滾子之間)
export const PITCH = 0.08;
export const RANGE = [0, 6 * TAU]; // 螺絲轉的角度
const H0 = 0.25; // 最平時的弧高
const ROLLER = 0.07;
const BASE_Y = 0.175 + ROLLER; // 拱形桿兩端(滾子中心)的高度:滾子壓在直桿的上緣
const arcLength = (c, h) => { const r = (c * c + h * h) / (2 * h); return 2 * r * Math.asin(c / r); };
export const LENGTH = arcLength(HALF, H0); // 拱形桿的長(不變)

/** 螺絲轉 a → 弧高(中間被頂起的量)、弦的一半(兩端往內收)與圓弧的圓心、半徑 */
export function arch(a0) {
  const a = clamp(a0, ...RANGE);
  const h = H0 + screwAdvance(a, PITCH);
  let [lo, hi] = [0.5, HALF + 0.5];
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (arcLength(mid, h) > LENGTH) hi = mid;
    else lo = mid;
  }
  const c = (lo + hi) / 2;
  const r = (c * c + h * h) / (2 * h);
  return { h, c, r, center: [0, BASE_Y + h - r, 0] };
}

export default {
  figure: 404,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 下方的直桿(兩端的滾子壓在它的上緣)
        { kind: "plate", shape: shape(rect(2 * HALF + 0.6, 0.35, 0, 0)), thickness: 0.2 },
      ],
    },
    { id: "bar", kind: "rod", radius: 0.08 },
    // 拱形桿兩端的小滾子(桿端的叉夾著滾子的軸)
    { id: "rollerL", kind: "group", spin: ROLLER, arrow: false, pieces: [{ kind: "cylinder", radius: ROLLER, length: 0.12, mark: true }] },
    { id: "rollerR", kind: "group", spin: ROLLER, arrow: false, pieces: [{ kind: "cylinder", radius: ROLLER, length: 0.12, mark: true }] },
    // 螺絲頂端的壓塊,托著拱形桿的正中(拱形桿是路徑零件,不上目標色,以壓塊代表它被頂高的量;推斷)
    { id: "pad", kind: "box", size: [0.4, 0.1, 0.3] },
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
  target: "pad", // 托著拱形桿正中的壓塊:螺絲把它頂高,弧就更彎
  view: { direction: [0.03, 0.05, 1] },
  pose(a0) {
    const s = arch(a0);
    const half = Math.asin(s.c / s.r);
    const points = Array.from({ length: 41 }, (_, i) => {
      const t = Math.PI / 2 - half + (2 * half * i) / 40;
      return [s.center[0] + s.r * Math.cos(t), s.center[1] + s.r * Math.sin(t), 0.12];
    });
    const roll = (HALF - s.c) / ROLLER; // 兩端往內收時滾子滾過的角度
    return {
      parts: {
        screw: { angle: clamp(a0, ...RANGE), position: [0, BASE_Y - 1.1 + (s.h - H0), 0] },
        pad: { position: [0, BASE_Y + s.h - 0.13, 0] },
        rollerL: { position: [-s.c, BASE_Y, 0.12], angle: -roll },
        rollerR: { position: [s.c, BASE_Y, 0.12], angle: roll },
      },
      paths: { bar: { points, closed: false } },
      readouts: [],
    };
  },
};
