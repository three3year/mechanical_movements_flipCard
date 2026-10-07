// 第 340 種:另一種平行運動。樑 D–C 架在搖動立柱 B–F 的頂上,立柱繞底下的中心 F 擺動;活塞桿接在樑的 C 端,
// 半徑桿 E–A(E 是固定樞軸)接在樑上的 A 點,產生平行運動。A 是 B、C 的中點,EA = AB = AC,而立柱很長、
// B 幾乎沿水平線來回,所以 C 走的是近似鉛直的直線(司各特‧羅素的原理)。主動件是樑(連同立柱)。
// 推斷:各桿長依原圖比例,滿足 EA = AB = AC;擺幅。F 的軸承座與底座(原圖只畫出 F 的轂)。
import { deg, clamp } from "./kit.js";
import { circleCircle } from "./linkage.js";
import { shape, circle, thickLine } from "./shapes.js";

const F = [-0.6, -2.4, 0]; // 立柱的擺動中心
const PILLAR = 3.25; // F 到 B
const L = 1.25; // EA = AB = AC
const E = [1.565, 0.85, 0]; // 半徑桿的固定樞軸:在 C 的直線上、B 的高度
const BD = 1.4; // 樑從 B 往左延伸到 D
export const RANGE = [deg(-4.5), deg(4.5)]; // 立柱偏離鉛直的角度
const PISTON_ROD = 2.0;

/** 立柱角 phi → B、A、C、D 與樑的方向 */
export function beam(phi0) {
  const phi = clamp(phi0, ...RANGE);
  const B = [F[0] - PILLAR * Math.sin(phi), F[1] + PILLAR * Math.cos(phi), 0];
  const A = circleCircle(B, L, E, L, -1).point;
  const C = [2 * A[0] - B[0], 2 * A[1] - B[1], 0];
  const u = [(C[0] - B[0]) / (2 * L), (C[1] - B[1]) / (2 * L)];
  const D = [B[0] - u[0] * BD, B[1] - u[1] * BD, 0];
  return { phi, B, A, C, D, angle: Math.atan2(u[1], u[0]) };
}

export default {
  figure: 340,
  parts: [
    { id: "ground", kind: "group", pieces: [{ kind: "cylinder", radius: 0.3, inner: 0.12, length: 0.3, at: [F[0], F[1], -0.2] }, { kind: "box", size: [0.4, 0.42, 0.3], at: [F[0], F[1] - 0.38, -0.2] }, { kind: "box", size: [1.4, 0.2, 0.7], at: [F[0], F[1] - 0.69, -0.1] }, { kind: "cylinder", radius: 0.11, length: 0.5, at: [F[0], F[1], -0.05] }, { kind: "box", size: [0.15, 0.9, 0.4], at: [E[0] + 0.3, E[1], -0.1] }, { kind: "cylinder", radius: 0.09, length: 0.4, at: E }] },
    { id: "labelF", kind: "group", center: F, label: "F", labelOffset: [0.45, -0.1, 0.3] },
    { id: "labelE", kind: "group", center: E, label: "E", labelOffset: [0, 0.3, 0.3] },
    { id: "pillar", kind: "link", width: 0.36, thickness: 0.12, label: "B", labelOffset: [0, 0.35, 0.3] },
    { id: "beam", kind: "plate", shape: shape(thickLine([[-BD, 0], [2 * L, 0]], 0.34), [circle(0.2).reverse()]), thickness: 0.14, arrow: false },
    { id: "radiusBar", kind: "link", width: 0.1, thickness: 0.06, label: "A", labelOffset: [-0.25, -0.2, 0.3] },
    { id: "pistonRod", kind: "box", size: [0.08, PISTON_ROD, 0.08], label: "C", labelOffset: [0.3, 0.9, 0.3] },
    { id: "rodD", kind: "box", size: [0.08, 2.0, 0.08], label: "D", labelOffset: [-0.3, 0.9, 0.3] },
  ],
  driver: { part: "beam", grips: ["pillar"], type: "rotation", range: RANGE, initial: 0 },
  target: "pistonRod", // 直上直下的活塞桿
  view: { direction: [0.03, 0.05, 1] },
  pose(phi0) {
    const b = beam(phi0);
    const z = (q, dz) => [q[0], q[1], dz];
    return {
      parts: {
        pillar: { from: z(F, 0), to: z(b.B, 0) },
        beam: { position: z(b.B, 0.15), angle: b.angle },
        radiusBar: { from: z(b.A, 0.28), to: z(E, 0.28) },
        pistonRod: { position: [b.C[0], b.C[1] - PISTON_ROD / 2, 0.1] },
        rodD: { position: [b.D[0], b.D[1] - 1.0, 0.1] },
      },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["beam", "rodD"], reason: "接合處的簡化畫法:桿 D 的頂端鉸接在樑端,桿端伸進樑的板 0.06" },
    { check: "interference", parts: ["beam", "pistonRod"], reason: "接合處的簡化畫法:活塞桿的頂端鉸接在樑端,桿端伸進樑的板 0.04" },
  ],
};
