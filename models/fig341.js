// 第 341 種:「蚱蜢式」樑式引擎。樑的右端架在搖動立柱 A 的頂上,左端接活塞桿;半徑桿 B 從左上的固定樞軸拉住樑的中點,
// 構成平行運動(EB = 樑的一半,樞軸在活塞桿的直線上、與立柱頂同高):樑擺動時左端走近似直線。
// 曲柄軸盡量靠近汽缸,連桿從樑上往下接到曲柄。主動件是虛擬的「進程」(汽缸的蒸汽推動);汽缸內的蒸汽以流體示意。
// 推斷:各桿長依原圖比例,滿足平行運動的條件;連桿接在樑上的位置。
import { TAU } from "./kit.js";
import { circleCircle, solve } from "./linkage.js";
import { cylinderParts, cylinderPose, steamPipe } from "./vertical-engine.js";
import { shape, circle, thickLine } from "./shapes.js";
import { pedestal } from "./supports.js";

const G = [2.3, -2.4, 0]; // 立柱 A 的底樞軸
const PILLAR = 4.0;
const HALF = 2.2; // 樑長的一半 = 半徑桿長
const SLOPE = (12 * Math.PI) / 180;
const C0 = [G[0] - 2 * HALF * Math.cos(SLOPE), G[1] + PILLAR - 2 * HALF * Math.sin(SLOPE), 0];
const E = [C0[0], G[1] + PILLAR, 0]; // 半徑桿的固定樞軸
const M_AT = 0.68; // 連桿接在樑上(從右端量起的比例)
const ROD = 2.55;
const CR = 0.3;
const PISTON_ROD = 1.55;
const CYL = { x: C0[0], top: -0.25, length: 1.3, radius: 0.42 };

/** 立柱角 phi → 樑右端 R、中點、左端 C、連桿接點 M */
function beamAt(phi) {
  const R = [G[0] - PILLAR * Math.sin(phi), G[1] + PILLAR * Math.cos(phi), 0];
  const mid = circleCircle(R, HALF, E, HALF, 1).point;
  const C = [2 * mid[0] - R[0], 2 * mid[1] - R[1], 0];
  const M = [R[0] + (C[0] - R[0]) * M_AT, R[1] + (C[1] - R[1]) * M_AT, 0];
  return { R, mid, C, M };
}
const M0 = beamAt(0).M;
const K = [M0[0], M0[1] - ROD, 0]; // 曲柄軸

/** 進程 p → 曲柄角、曲柄銷、立柱角(使連桿長度不變)與樑的各點 */
export function grasshopper(p) {
  const theta = Math.PI / 2 - TAU * p;
  const pin = [K[0] + CR * Math.cos(theta), K[1] + CR * Math.sin(theta), 0];
  const f = (phi) => Math.hypot(beamAt(phi).M[0] - pin[0], beamAt(phi).M[1] - pin[1]);
  const phi = solve(f, ROD, -0.15, 0.15);
  const b = beamAt(phi);
  const prev = beamAt(solve((q) => Math.hypot(beamAt(q).M[0] - (K[0] + CR * Math.cos(theta + 1e-4)), beamAt(q).M[1] - (K[1] + CR * Math.sin(theta + 1e-4))), ROD, -0.15, 0.15)).C[1];
  return { theta, pin, phi, ...b, downward: b.C[1] < prev };
}
export const geometry = { E, HALF };

export default {
  figure: 341,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.25, 5.0, 0.6], at: [E[0] - 0.75, 0, -0.2] },
        { kind: "box", size: [0.5, 0.3, 0.4], at: [E[0] - 0.4, E[1], -0.1] },
        { kind: "box", size: [5.6, 0.15, 0.9], at: [0.2, -2.55, 0] },
        { kind: "cylinder", radius: 0.14, length: 0.4, at: G },
        { kind: "cylinder", radius: 0.14, length: 0.7, at: [K[0], K[1], -0.3] }, // 曲柄軸只往後伸(連桿從曲柄前面掃過軸心)
        // 曲柄軸的軸承座(原圖曲柄下方畫著軸承座)
        ...pedestal({ at: [K[0], K[1]], z: -0.55, bore: 0.14, floor: -2.475 }),
      ],
    },
    { id: "pipe", ...steamPipe(CYL), center: [0, 0, -0.45] }, // 蒸汽管走在後面一層(曲柄從它前方轉過)
    ...cylinderParts(CYL),
    { id: "pillarA", kind: "link", width: 0.24, thickness: 0.1, label: "A", labelOffset: [0.3, 1.6, 0.3] },
    { id: "beam", kind: "plate", shape: shape(thickLine([[0, 0], [2 * HALF, 0]], 0.36), [circle(0.12).reverse()]), thickness: 0.14, arrow: false },
    { id: "radiusB", kind: "link", width: 0.1, thickness: 0.06, label: "B", labelOffset: [0.2, 0.3, 0.3] },
    { id: "conRod", kind: "link", width: 0.12, thickness: 0.06 },
    { id: "crank", kind: "group", center: K, spin: CR + 0.2, pieces: [{ kind: "box", size: [CR, 0.14, 0.08], at: [CR / 2, 0, 0.2] }, { kind: "cylinder", radius: 0.06, length: 0.3, at: [CR, 0, 0.25], accent: true }, { kind: "cylinder", radius: 0.6, length: 0.1, at: [0, 0, -0.35] }] },
    { id: "pistonRod", kind: "box", size: [0.08, PISTON_ROD, 0.08] },
  ],
  powered: ["piston"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.25 },
  target: "crank", // 輸出的曲柄
  view: { direction: [0.03, 0.05, 1] },
  pose(p) {
    const g = grasshopper(p);
    const cyl = cylinderPose(CYL, g.C[1] - PISTON_ROD, g.downward, p);
    const z = (q, dz) => [q[0], q[1], dz];
    return {
      parts: {
        pillarA: { from: z(G, 0), to: z(g.R, 0) },
        beam: { position: z(g.C, 0.15), angle: Math.atan2(g.R[1] - g.C[1], g.R[0] - g.C[0]) },
        radiusB: { from: z(E, 0.3), to: z(g.mid, 0.3) },
        conRod: { from: z(g.pin, 0.25), to: z(g.M, 0.25) },
        crank: { angle: g.theta },
        pistonRod: { position: [g.C[0], g.C[1] - PISTON_ROD / 2, 0.08] },
        ...cyl.parts,
      },
      flows: cyl.flows,
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["pipe", "cylinder"], reason: "蒸汽管接在汽缸的側面:管端伸進汽缸壁 0.06" },
    { check: "interference", parts: ["beam", "pistonRod"], reason: "接合處的簡化畫法:活塞桿的頂端鉸接在樑端,桿端伸進樑的板 0.04" },
  ],
};
