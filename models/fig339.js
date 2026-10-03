// 第 339 種:直動式引擎的平行運動(司各特‧羅素式)。桿 B–C 的 C 端接在活塞桿上,B 端在固定溝槽 D 裡滑動;
// 半徑桿 F–A 的 F 端接在固定樞軸上,A 端接在 B–C 的中點,且 FA = AB = AC,所以 C 精確地走直線。
// 活塞桿頂經連桿接到頂上的曲柄。主動件是虛擬的「進程」(下方汽缸的蒸汽推動);汽缸內的蒸汽以流體示意。
// 推斷:頂上的曲柄與連桿(原圖頂端畫出曲柄軸);進汽的時機。
import { TAU } from "./kit.js";
import { crankSlider, cylinderParts, cylinderPose, steamPipe } from "./vertical-engine.js";
import { shape, rect, thickLine } from "./shapes.js";

const F = [0.55, 0.65, 0]; // 半徑桿的固定樞軸(在活塞桿的直線上方)
const L = 1.0; // FA = AB = AC
const CRANK = [0.55, 3.2, 0];
const R = 0.35;
const ROD = 2.75;
const PISTON_ROD = 1.75;
const CYL = { x: 0.55, top: -0.72, length: 1.2, radius: 0.5 };

/** 進程 p → 曲柄角、曲柄銷、C(活塞桿上)、A(BC 中點)、B(在溝槽裡) */
export function russell(p) {
  const theta = Math.PI / 2 - TAU * p;
  const { pin, y } = crankSlider(CRANK, R, ROD, theta);
  const C = [F[0], y, 0];
  const dy = C[1] - F[1];
  const B = [F[0] - Math.sqrt(4 * L * L - dy * dy), F[1], 0];
  const A = [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2, 0];
  const next = crankSlider(CRANK, R, ROD, theta - 1e-4).y;
  return { theta, pin, C, A, B, downward: next < y };
}

export default {
  figure: 339,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(thickLine([[-0.85, -2.05], [-0.85, 2.0], [-0.2, 3.1], [1.3, 3.1], [1.95, 2.0], [1.95, -2.05]], 0.2)), thickness: 0.2, at: [0, 0, -0.4] },
        // 固定溝槽 D(左邊的支架)
        { kind: "plate", shape: { ...shape(rect(1.3, 0.45, -1.25, F[1])), holes: [rect(1.0, 0.16, -1.25, F[1]).reverse()] }, thickness: 0.14, at: [0, 0, -0.05] },
        { kind: "box", size: [1.4, 0.12, 0.2], at: [-0.3, F[1] + 0.3, -0.2] },
        { kind: "cylinder", radius: 0.1, length: 0.4, at: F },
        { kind: "box", size: [3.2, 0.15, 0.8], at: [0.55, -2.15, 0] },
      ],
    },
    { id: "labelD", kind: "group", center: [-1.9, F[1], 0], label: "D", labelOffset: [-0.25, 0, 0.3] },
    { id: "labelF", kind: "group", center: F, label: "F", labelOffset: [0.3, 0.2, 0.3] },
    { id: "pipe", ...steamPipe(CYL) },
    ...cylinderParts(CYL),
    { id: "crank", kind: "group", center: CRANK, spin: R + 0.2, pieces: [{ kind: "cylinder", radius: 0.18, length: 0.8, at: [0, 0, -0.2] }, { kind: "box", size: [R, 0.14, 0.08], at: [R / 2, 0, 0.2] }, { kind: "cylinder", radius: 0.06, length: 0.3, at: [R, 0, 0.25], accent: true }] },
    { id: "rod", kind: "link", width: 0.1, thickness: 0.06 },
    { id: "pistonRod", kind: "group", label: "C", labelOffset: [0.3, -0.1, 0.3], pieces: [{ kind: "box", size: [0.08, PISTON_ROD, 0.08], at: [0, -PISTON_ROD / 2, 0] }] },
    { id: "barBC", kind: "link", width: 0.1, thickness: 0.06 },
    { id: "radiusFA", kind: "link", width: 0.1, thickness: 0.06, label: "A", labelOffset: [-0.3, -0.2, 0.3] },
    { id: "sliderB", kind: "box", size: [0.3, 0.14, 0.18], label: "B", labelOffset: [0, 0.3, 0.3] },
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.25 },
  view: { direction: [0.03, 0.05, 1] },
  pose(p) {
    const r = russell(p);
    const cyl = cylinderPose(CYL, r.C[1] - PISTON_ROD, r.downward, p);
    const z = (q, dz) => [q[0], q[1], dz];
    return {
      parts: {
        crank: { angle: r.theta },
        rod: { from: z(r.pin, 0.32), to: z(r.C, 0.32) },
        pistonRod: { position: z(r.C, 0.05) },
        barBC: { from: z(r.B, 0.18), to: z(r.C, 0.18) },
        radiusFA: { from: z(r.A, 0.24), to: z(F, 0.24) },
        sliderB: { position: z(r.B, 0.05) },
        ...cyl.parts,
      },
      flows: cyl.flows,
      readouts: [],
    };
  },
};
