// 第 264 種:兩個直徑相等的蝸輪,一個 100 齒、一個 101 齒,並排套在同一根軸上,與同一根蝸桿咬合。
// 蝸桿每轉一圈,兩輪各轉過一齒,所以 100 齒的輪比 101 齒的輪稍快;蝸桿轉 100 × 101 = 10,100 圈時,
// 快的那個輪比另一個多轉一圈。兩輪側面各有一根指針,看得出兩者慢慢錯開。
// 主動件是蝸桿;讀數照原文的數字。
import { Z, TAU } from "./kit.js";

export const TEETH = [100, 101];
const R = 1.75; // 兩輪節圓半徑相同
const WORM = { radius: 0.32, length: 1.2 };
const GAP = 0.16; // 兩輪並排的間距

/** 蝸桿轉 theta(單線):兩輪的轉角(各轉過 theta/2π 齒) */
export const wheels = (theta) => TEETH.map((n) => -theta / n);

const wheel = (id, n, x) => ({
  id,
  kind: "gear",
  axis: [1, 0, 0],
  center: [x, 0, 0],
  teeth: n,
  radius: R,
  width: 0.22,
  bore: 0.1,
  // 指針:輪側面一根從軸心伸到輪緣的細桿
  pieces: [{ kind: "box", size: [R * 0.95, 0.05, 0.05], at: [R * 0.47, 0, (x < 0 ? -1 : 1) * 0.14], accent: true }],
});

export default {
  figure: 264,
  parts: [
    { id: "worm", kind: "worm", axis: Z, center: [0, R + WORM.radius - 0.02, 0], radius: WORM.radius, length: WORM.length, pitch: (TAU * R) / 100, thread: 0.07, pieces: [{ kind: "cylinder", radius: 0.1, length: 2.4 }] },
    wheel("wheel100", TEETH[0], -GAP),
    wheel("wheel101", TEETH[1], GAP),
    { id: "shaft", kind: "cylinder", axis: [1, 0, 0], center: [0.4, 0, 0], radius: 0.09, length: 2.6 },
  ],
  driver: { part: "worm", type: "rotation", speed: 10 },
  view: { direction: [0.16, 0.1, 1] },
  pose(theta) {
    const [a, b] = wheels(theta);
    const turns = theta / TAU;
    return {
      parts: { worm: { angle: theta }, wheel100: { angle: a }, wheel101: { angle: b } },
      readouts: [
        { label: "蝸桿轉了", value: `${turns.toFixed(1)} 圈` },
        { label: "100 齒輪比 101 齒輪多轉", value: `${(turns / 100 - turns / 101).toFixed(5)} 圈` },
      ],
    };
  },
};
