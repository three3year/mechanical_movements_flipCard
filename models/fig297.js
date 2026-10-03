// 第 297 種:搭配燈籠輪的擒縱。輪的盤面上一圈立著銷(燈籠輪);搖臂 A 在上方以樞軸吊著,臂上裝兩個擒縱叉瓦 B、C,
// 搖臂來回擺時,B、C 輪流擋住、放開銷,輪依原圖箭頭逆時針一格一格地轉(每擺一次半個銷距)。主動件是搖臂 A。
// 推斷:擺幅與銷的數目(依原圖八根)。
import { TAU, deg, swing } from "./kit.js";
import { escapeStep } from "./escapement.js";
import { shape, circle, rect, thickLine } from "./shapes.js";

export const PINS = 8;
export const PITCH = TAU / PINS;
export const SWING = deg(8);
const P = [1.15, 2.6, 0]; // 搖臂樞軸
const R = 1.85;

/** 搖臂累計擺動 v → 輪的轉角(逆時針為正) */
export const wheelAngle = (v) => escapeStep(v, -SWING, SWING, PITCH / 2, 0.5);

export default {
  figure: 297,
  parts: [
    {
      id: "wheel",
      kind: "group",
      spin: R,
      pieces: [
        { kind: "plate", shape: shape(circle(R), [circle(0.12).reverse()]), thickness: 0.14, circles: [R - 0.12] },
        { kind: "cylinder", radius: 0.3, length: 0.3 },
        ...Array.from({ length: PINS }, (_, i) => {
          const a = deg(22) + i * PITCH;
          return { kind: "cylinder", radius: 0.18, length: 0.45, at: [1.38 * Math.cos(a), 1.38 * Math.sin(a), 0.25], accent: i === 0 };
        }),
      ],
    },
    {
      id: "armA",
      kind: "group",
      center: P,
      arrow: false,
      label: "A",
      labelOffset: [0.05, -0.5, 0.4],
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0, 0], [-0.3, -1.95]], 0.28), [circle(0.08).reverse()]), thickness: 0.1, at: [0, 0, 0.55] },
        // 叉瓦 B(上,斜向)與 C(下):伸到銷所在的高度,輪流擋住銷
        { kind: "plate", shape: shape(rect(0.9, 0.17, 0, 0)), thickness: 0.4, at: [-0.15, -1.05, 0.3], angle: deg(50) },
        { kind: "plate", shape: shape(rect(0.85, 0.17, 0, 0)), thickness: 0.4, at: [-0.35, -1.85, 0.3], angle: deg(-28) },
      ],
    },
    { id: "labelB", kind: "group", center: [P[0] + 0.15, P[1] - 1.0, 0.5], label: "B", labelOffset: [0.45, 0, 0] },
    { id: "labelC", kind: "group", center: [P[0] - 0.35, P[1] - 1.85, 0.5], label: "C", labelOffset: [-0.2, -0.35, 0] },
  ],
  driver: { part: "armA", type: "rotation", cycle: [-SWING, SWING] },
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    return { parts: { armA: { angle: swing(v, -SWING, SWING) }, wheel: { angle: wheelAngle(v) } }, readouts: [] };
  },
};
