// 第 343 種:直立式引擎的平行運動。A、A 是半徑桿,一端接在框架上,另一端接在活塞桿頂的振動件(一根短桿)的兩端;
// 兩根半徑桿從左右兩側伸來,振動件中點(活塞桿頂)走的是近似直線(瓦特直線連桿)。活塞桿頂經連桿接到頂上的曲柄。
// 主動件是虛擬的「進程」(下方汽缸的蒸汽推動);汽缸內的蒸汽以流體示意。
// 推斷:各桿長依原圖比例;連桿接在振動件的中點。
import { TAU } from "./kit.js";
import { solve } from "./linkage.js";
import { wattLinkage } from "./parallel-motion.js";
import { cylinderParts, cylinderPose, steamPipe } from "./vertical-engine.js";
import { shape, thickLine, arcPoints } from "./shapes.js";

export const watt = wattLinkage({ line: 0, y1: 0.75, y2: -0.35, a: 1.4, b: 1.4, beamSide: -1 });
const CRANK = [0, 2.75, 0];
const CR = 0.4;
const ROD = 2.25;
const PISTON_ROD = 2.0;
const CYL = { x: 0, top: -0.95, length: 1.15, radius: 0.42 };

/** 進程 p → 曲柄角、曲柄銷、左半徑桿的角(使連桿長度不變)與連桿機構各點 */
export function upright(p) {
  const theta = Math.PI / 2 - TAU * p;
  const pinAt = (t) => [CRANK[0] + CR * Math.cos(t), CRANK[1] + CR * Math.sin(t), 0];
  const solveFor = (t) => {
    const pin = pinAt(t);
    return solve((a) => Math.hypot(watt(a).P[0] - pin[0], watt(a).P[1] - pin[1]), ROD, -0.7, 0.7);
  };
  const alpha = solveFor(theta);
  const w = watt(alpha);
  const prev = watt(solveFor(theta + 1e-4)).P[1];
  return { theta, pin: pinAt(theta), alpha, ...w, downward: w.P[1] < prev };
}

export default {
  figure: 343,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.3, 5.0, 0.3], at: [-1.6, 0.2, -0.3] },
        { kind: "box", size: [0.3, 5.0, 0.3], at: [1.6, 0.2, -0.3] },
        { kind: "box", size: [3.6, 0.3, 0.3], at: [0, 2.75, -0.3] },
        { kind: "plate", shape: shape([...arcPoints(2.6, 0.25, Math.PI - 0.25), ...arcPoints(2.35, Math.PI - 0.25, 0.25)]), thickness: 0.15, at: [0, 0.5, -0.5] },
        { kind: "box", size: [3.6, 0.18, 0.8], at: [0, -3.0, 0] },
        { kind: "cylinder", radius: 0.1, length: 0.4, at: watt.O1 },
        { kind: "cylinder", radius: 0.1, length: 0.4, at: watt.O2 },
      ],
    },
    { id: "pipe", ...steamPipe(CYL) },
    ...cylinderParts(CYL),
    { id: "crank", kind: "group", center: CRANK, spin: CR + 0.2, pieces: [{ kind: "box", size: [0.7, 0.6, 0.4], at: [0, 0, -0.1] }, { kind: "box", size: [CR, 0.14, 0.08], at: [CR / 2, 0, 0.2] }, { kind: "cylinder", radius: 0.06, length: 0.3, at: [CR, 0, 0.25], accent: true }] },
    { id: "rod", kind: "link", width: 0.1, thickness: 0.06 },
    { id: "radiusL", kind: "link", width: 0.1, thickness: 0.06, label: "A", labelOffset: [0.6, -0.2, 0.3] },
    { id: "radiusR", kind: "link", width: 0.1, thickness: 0.06, label: "A", labelOffset: [-0.6, 0.2, 0.3] },
    { id: "vibrating", kind: "plate", shape: shape(thickLine([[0, 0], [1.1, 0]], 0.12)), thickness: 0.06, arrow: false },
    { id: "pistonRod", kind: "box", size: [0.08, PISTON_ROD, 0.08] },
  ],
  powered: ["piston"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.25 },
  target: "crank", // 輸出的曲柄
  view: { direction: [0.03, 0.05, 1] },
  pose(p) {
    const u = upright(p);
    const cyl = cylinderPose(CYL, u.P[1] - PISTON_ROD, u.downward, p);
    const z = (q, dz) => [q[0], q[1], dz];
    return {
      parts: {
        crank: { angle: u.theta },
        rod: { from: z(u.pin, 0.35), to: z(u.P, 0.35) },
        radiusL: { from: z(watt.O1, 0.15), to: z(u.B, 0.15) },
        radiusR: { from: z(watt.O2, 0.15), to: z(u.R, 0.15) },
        vibrating: { position: z(u.B, 0.22), angle: Math.atan2(u.R[1] - u.B[1], u.R[0] - u.B[0]) },
        pistonRod: { position: [u.P[0], u.P[1] - PISTON_ROD / 2, 0.08] },
        ...cyl.parts,
      },
      flows: cyl.flows,
      readouts: [],
    };
  },
};
