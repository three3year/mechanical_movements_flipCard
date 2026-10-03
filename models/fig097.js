// 第 97 種:開有溝槽的心形凸輪,與第 96 種類似:圓盤面上切出心形的溝槽,水平桿端的銷在溝槽裡,
// 圓盤轉動時桿做均勻的橫移(去程、回程各半圈,位移與轉角成正比)。溝槽兩側都導引著銷,不必靠重力或彈簧貼緊。
import { TAU, signedAngle } from "./kit.js";
import { circle, shape, offsetLoop } from "./shapes.js";

const NEAR = 0.62;
const FAR = 2.05;
const GROOVE = 0.13; // 溝槽半寬
const DISC = 2.4;

/** 節曲線:圓盤局部角 φ 處銷中心離軸心的距離(φ = 0 最近,φ = π 最遠) */
export const pitchAt = (phi) => NEAR + ((FAR - NEAR) * Math.abs(signedAngle(phi))) / Math.PI;

const pitch = Array.from({ length: 360 }, (_, i) => {
  const a = (i / 360) * TAU;
  const r = pitchAt(a);
  return [r * Math.cos(a), r * Math.sin(a)];
});

export default {
  figure: 97,
  parts: [
    {
      id: "disc",
      kind: "group",
      spin: DISC,
      pieces: [
        { kind: "plate", shape: shape(circle(DISC), [offsetLoop(pitch, GROOVE).reverse()]), thickness: 0.2 },
        { kind: "plate", shape: shape(offsetLoop(pitch, -GROOVE), [circle(0.18).reverse()]), thickness: 0.2, circles: [0.36], mark: [-0.9, 0.3], markSize: 0.08 },
        { kind: "plate", shape: shape(circle(DISC), []), thickness: 0.05, at: [0, 0, -0.12] },
      ],
    },
    {
      id: "rod",
      kind: "group",
      center: [NEAR, 0, 0.12],
      pieces: [
        { kind: "cylinder", radius: GROOVE * 0.85, length: 0.3, at: [0, 0, -0.06] },
        { kind: "box", size: [3.0, 0.24, 0.12], at: [1.5, 0, 0.12] },
        { kind: "cylinder", radius: 0.14, length: 0.18, at: [0, 0, 0.12] },
      ],
    },
  ],
  driver: { part: "disc", type: "rotation" },
  target: "rod", // 均勻橫移的水平桿
  view: { direction: [0.06, 0.05, 1] },
  pose(angle) {
    return { parts: { disc: { angle }, rod: { position: [pitchAt(-angle), 0, 0.12] } }, readouts: [] };
  },
};
