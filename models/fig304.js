// 第 304 種:銷輪式擒縱(與第 292 種凸柱式相似)。擒縱輪的盤面上靠近邊緣立著一圈銷(左邊畫出兩種形式 A、B,
// 右側的形式較佳);右上方的錨形件繞軸擺動,伸下來的兩個叉瓦夾著銷,輪流擋住、放開,擺每擺一次輪轉過半個銷距。
// 銷損壞時可以單獨更換,不必整個輪報廢。主動件是錨形件(擺)。
// 推斷:銷的數目、擺幅。
import { TAU, deg, swing } from "./kit.js";
import { escapeStep } from "./escapement.js";
import { shape, circle, thickLine, arcPoints } from "./shapes.js";

export const PINS = 30;
export const PITCH = TAU / PINS;
export const SWING = deg(4);
const W = [-0.75, -0.55, 0];
const R = 1.95; // 銷所在的半徑
const P = [1.35, 1.75, 0]; // 錨形件軸

/** 錨形件累計擺動 v → 擺角、輪轉角(順時針為負) */
export function pinWheel(v) {
  return { anchor: swing(v, -SWING, SWING), wheel: -escapeStep(v, -SWING, SWING, PITCH / 2, 0.55) };
}

// 銷:半圓柱(D 形)
const pin = (i) => {
  const a = i * PITCH;
  return { kind: "plate", shape: shape(arcPoints(0.09, -Math.PI / 2, Math.PI / 2)), thickness: 0.3, at: [R * Math.cos(a), R * Math.sin(a), 0.2], angle: a + Math.PI / 2, accent: i === 0 };
};
// 錨形件軸到叉瓦處(輪的右下方、銷圈上)的距離
const REACH = Math.hypot(W[0] + R * Math.cos(deg(-15)) - P[0], W[1] + R * Math.sin(deg(-15)) - P[1]);

export default {
  figure: 304,
  parts: [
    {
      id: "wheel",
      kind: "group",
      center: W,
      spin: R + 0.25,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(circle(R + 0.25), [circle(R - 0.3).reverse()]), thickness: 0.12, circles: [R - 0.15] },
        ...Array.from({ length: 6 }, (_, i) => ({ kind: "box", size: [2 * R - 0.6, 0.14, 0.08], angle: (i * Math.PI) / 6 })),
        { kind: "cylinder", radius: 0.35, length: 0.3 },
        ...Array.from({ length: PINS }, (_, i) => pin(i)),
      ],
    },
    {
      id: "anchor",
      kind: "group",
      center: P,
      arrow: false,
      pieces: [
        { kind: "cylinder", radius: 0.6, length: 0.15, at: [0, 0, -0.2] },
        { kind: "cylinder", radius: 0.18, inner: 0.08, length: 0.4 },
        // 兩臂往下,叉瓦夾在銷的兩側(以軸為圓心的弧)
        { kind: "plate", shape: shape(thickLine([[0, 0], [-0.2, -REACH + 0.25]], 0.22)), thickness: 0.1, at: [0, 0, 0.4] },
        { kind: "plate", shape: shape(thickLine([[0.35, 0], [0.25, -REACH - 0.1]], 0.18)), thickness: 0.1, at: [0, 0, 0.4] },
        { kind: "plate", shape: shape([...arcPoints(REACH - 0.12, deg(-99), deg(-94)), ...arcPoints(REACH - 0.3, deg(-94), deg(-99))]), thickness: 0.2, at: [0, 0, 0.3] },
        { kind: "plate", shape: shape([...arcPoints(REACH + 0.3, deg(-86), deg(-81)), ...arcPoints(REACH + 0.12, deg(-81), deg(-86))]), thickness: 0.2, at: [0, 0, 0.3] },
      ],
    },
    { id: "labelA", kind: "group", center: [W[0] - R, W[1] + 0.35, 0.3], label: "A", labelOffset: [0.3, 0, 0] },
    { id: "labelB", kind: "group", center: [W[0] - R, W[1] - 0.35, 0.3], label: "B", labelOffset: [0.3, 0, 0] },
  ],
  driver: { part: "anchor", type: "rotation", cycle: [-SWING, SWING] },
  view: { direction: [0.04, 0.05, 1] },
  pose(v) {
    const p = pinWheel(v);
    return { parts: { anchor: { angle: p.anchor }, wheel: { angle: p.wheel } }, readouts: [] };
  },
};
