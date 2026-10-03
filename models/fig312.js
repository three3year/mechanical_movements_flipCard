// 第 312 種:布洛克桑(Bloxam)的重力擒縱。兩個擒縱叉瓦臂從上方 C 處垂下,由中間的小輪交替地抬起;
// 止動則由較大的輪上的擋止 A、B 完成。E、F 是夾住擺的叉爪銷:擺往一邊擺時推開一個叉瓦臂、放開擋止,
// 擒縱輪轉過半個齒距,小輪隨即把另一個叉瓦抬起;叉瓦落下時以重量給擺衝量。主動件是擺。
// 推斷:擺幅、叉瓦抬起的角度、輪的齒數(依原圖)。
import { TAU, deg, swing, clamp } from "./kit.js";
import { escapeStep } from "./escapement.js";
import { shape, thickLine, circle, arcPoints } from "./shapes.js";

export const N = 10;
export const PITCH = TAU / N;
export const SWING = deg(3);
const C = [0.05, 3.0, 0];
const WHEEL = [0.2, -0.75, 0];
const GAP = deg(0.8);

/** 擺累計擺動 v → 擺角、左右叉瓦臂抬起的角度、輪轉角 */
export function bloxam(v) {
  const p = swing(v, -SWING, SWING);
  return {
    pendulum: p,
    right: clamp(p - GAP, 0, SWING) * 1.5,
    left: clamp(-p - GAP, 0, SWING) * 1.5,
    wheel: -escapeStep(v, -SWING, SWING, PITCH / 2, 0.5),
  };
}

// 叉瓦臂(相對 C):左臂往左下彎到 A 處、再往內勾;右臂往右下到 B
const armL = shape(thickLine([[0, 0], [-1.25, -2.4], [-1.35, -3.55], [-0.8, -4.2]], 0.14), [circle(0.06).reverse()]);
const armR = shape(thickLine([[0, 0], [1.55, -3.1], [0.75, -3.75]], 0.14), [circle(0.06).reverse()]);
// 大輪:輪輻與輪緣上的齒(擋止靠在齒上);小輪:中間的抬升輪
const bigWheel = [
  { kind: "plate", shape: shape(circle(1.4), [circle(1.28).reverse()]), thickness: 0.08 },
  ...Array.from({ length: N }, (_, i) => ({ kind: "box", size: [1.3, 0.05, 0.05], at: [0.65 * Math.cos((i * TAU) / N), 0.65 * Math.sin((i * TAU) / N), 0], angle: (i * TAU) / N })),
  ...Array.from({ length: N }, (_, i) => ({ kind: "box", size: [0.2, 0.1, 0.08], at: [1.48 * Math.cos((i * TAU) / N), 1.48 * Math.sin((i * TAU) / N), 0], angle: (i * TAU) / N, accent: i === 0 })),
  { kind: "plate", shape: shape(circle(0.32), [circle(0.06).reverse()]), thickness: 0.16, at: [0, 0, 0.12] },
];

export default {
  figure: 312,
  parts: [
    { id: "wheel", kind: "group", center: WHEEL, spin: 1.5, pieces: bigWheel },
    { id: "armL", kind: "group", center: C, arrow: false, pieces: [{ kind: "plate", shape: armL, thickness: 0.08, at: [0, 0, 0.25] }, { kind: "plate", shape: shape([...arcPoints(1.75, deg(200), deg(255)), ...arcPoints(1.6, deg(255), deg(200))].map(([x, y]) => [x + WHEEL[0] - C[0], y + WHEEL[1] - C[1]])), thickness: 0.08, at: [0, 0, 0.25] }] },
    { id: "armR", kind: "group", center: C, arrow: false, pieces: [{ kind: "plate", shape: armR, thickness: 0.08, at: [0, 0, 0.32] }] },
    { id: "pendulum", kind: "group", center: C, arrow: false, pieces: [{ kind: "box", size: [0.1, 5.2, 0.06], at: [0, -2.6, -0.2] }, { kind: "cylinder", radius: 0.05, length: 0.6, at: [-0.15, -2.3, 0.1] }, { kind: "cylinder", radius: 0.05, length: 0.6, at: [0.15, -2.3, 0.1] }] },
    { id: "labelC", kind: "group", center: C, label: "C", labelOffset: [0.25, 0.25, 0.3] },
    { id: "labelA", kind: "group", center: [-1.3, -0.4, 0], label: "A", labelOffset: [-0.3, 0, 0.3] },
    { id: "labelB", kind: "group", center: [1.6, -0.1, 0], label: "B", labelOffset: [0.3, 0, 0.3] },
    { id: "labelE", kind: "group", center: [-0.15, -1.6, 0], label: "E", labelOffset: [-0.3, 0, 0.3] },
    { id: "labelF", kind: "group", center: [0.15, 0.7, 0], label: "F", labelOffset: [0.3, 0, 0.3] },
  ],
  driver: { part: "pendulum", type: "rotation", cycle: [-SWING, SWING] },
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const b = bloxam(v);
    return { parts: { pendulum: { angle: b.pendulum }, armR: { angle: b.right }, armL: { angle: -b.left }, wheel: { angle: b.wheel } }, readouts: [] };
  },
};
