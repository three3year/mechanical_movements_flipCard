// 第 134 種:以繩索(或皮帶)繞鼓輪一圈或多圈,把均勻的圓周運動轉換為直線運動。
// 繩從左邊沿地面來,在鼓輪底部繞上去、繞輪一整圈,再從底部往右離開;鼓輪轉動時,繩靠摩擦整條往同一個方向走,
// 走的距離等於輪緣轉過的弧長。主動件是鼓輪。
import { TAU } from "./kit.js";

const R = 2.0;
const LEFT = -3.2;
const RIGHT = 3.2;
const GROUND = -R - 0.06;

/** 鼓輪轉 theta(逆時針為正):繩前進的距離(往左為正) */
export const ropeTravel = (theta) => R * theta;
export const radius = R;

// 繩的路徑:左端 → 底部 → 繞輪一整圈(逆時針)→ 底部 → 右端;繞輪的那一圈略往外,畫在輪緣外
const loop = (() => {
  const r = R + 0.06;
  const pts = [[RIGHT, GROUND, 0.05]];
  for (let i = 0; i <= 96; i++) {
    const a = -Math.PI / 2 + (TAU * i) / 96;
    pts.push([r * Math.cos(a), r * Math.sin(a), 0.05 - 0.1 * (i / 96)]);
  }
  pts.push([LEFT, GROUND, -0.05]);
  return pts;
})();

export default {
  figure: 134,
  parts: [
    {
      id: "drum",
      kind: "pulley",
      style: "spoked",
      radius: R,
      width: 0.4,
      pieces: [
        ...Array.from({ length: 8 }, (_, i) => ({ kind: "box", size: [0.12, 0.3, 0.42], at: [(R - 0.05) * Math.cos((i * TAU) / 8 + Math.PI / 2), (R - 0.05) * Math.sin((i * TAU) / 8 + Math.PI / 2), 0], angle: (i * TAU) / 8 + Math.PI / 2 })),
      ],
    },
    { id: "rope", kind: "rope" },
  ],
  driver: { part: "drum", type: "rotation" },
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    // 繩從右端走向左端(逆時針轉時往左)
    return { parts: { drum: { angle: theta } }, paths: { rope: { points: loop, closed: false, phase: ropeTravel(theta) } }, readouts: [] };
  },
};
