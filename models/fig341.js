// 第 341 種:「蚱蜢式」樑式引擎。樑的右端架在搖動立柱 A 的頂上,左端接活塞桿;半徑桿 B 從左上的固定樞軸拉住樑的中點,
// 構成平行運動(EB = 樑的一半,樞軸在活塞桿的直線上、與立柱頂同高):樑擺動時左端走近似直線。
// 曲柄軸盡量靠近汽缸,連桿從樑上往下接到曲柄。主動件是虛擬的「進程」(汽缸的蒸汽推動);汽缸內的蒸汽以流體示意。
// 推斷:各桿長依原圖比例,滿足平行運動的條件;連桿接在樑上的位置。
// 偏離插圖:半徑桿接在樑的中點。原圖接在連桿頂端的接點(約樑長的 3 成處),那樣產生不了平行運動,
// 依 507movements 的勘誤改到中點(原文 > 實物可行 > 插圖外形)。半徑桿照原圖的虛線放在樑後面一層,
// 固定樞軸是牆上伸出的托架(原圖),銷從托架往前穿過半徑桿;牆站在底座上。
// 樑在 C 的孔裡有一根銷,往後穿過活塞桿頂的眼(活塞桿走汽缸中心線,在樑後面),在中點與立柱頂 R 各有一根銷。
// 曲柄軸只往後伸(連桿從曲柄前面掃過軸心):軸和曲柄、圓盤是一件,一起在軸承座的環裡轉,前端到曲柄臂的背面。
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
const CYL = { x: C0[0], top: -0.25, length: 1.3, radius: 0.42, seat: -2.475, pipeZ: -0.25 };
const FLOOR = -2.475; // 底座頂面
const Z_BEAM = 0.15; // 樑(厚 0.14)
const Z_RADIUS = 0; // 半徑桿在樑後面(原圖的虛線)
const PIN_C = 0.12; // C 的銷 = 樑在 C 的孔

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
        // 牆(原圖打斜線)站在底座上;托架從牆伸到半徑桿的固定樞軸,銷往前穿過半徑桿
        { kind: "box", size: [0.25, 2.5 - FLOOR, 0.6], at: [E[0] - 0.75, (2.5 + FLOOR) / 2, -0.2] },
        { kind: "box", size: [E[0] + 0.08 - (E[0] - 0.75 + 0.125), 0.24, 0.2], at: [(E[0] + 0.08 + E[0] - 0.75 + 0.125) / 2, E[1], -0.15] },
        { kind: "cylinder", radius: 0.04, length: 0.19, at: [E[0], E[1], -0.055] },
        { kind: "box", size: [5.9, 0.15, 0.9], at: [0.05, FLOOR - 0.075, 0] },
        { kind: "cylinder", radius: 0.14, length: 0.4, at: G },
        // 曲柄軸的軸承座(原圖曲柄下方畫著軸承座)
        ...pedestal({ at: [K[0], K[1]], z: -0.55, bore: 0.14, floor: FLOOR }),
      ],
    },
    { id: "pipe", ...steamPipe(CYL) }, // 蒸汽管走在汽缸後半(pipeZ;曲柄從它前方轉過)
    ...cylinderParts(CYL),
    { id: "pillarA", kind: "link", width: 0.24, thickness: 0.1, label: "A", labelOffset: [0.3, 1.6, 0.3] },
    {
      id: "beam",
      kind: "plate",
      shape: shape(thickLine([[0, 0], [2 * HALF, 0]], 0.36), [circle(PIN_C).reverse()]),
      thickness: 0.14,
      arrow: false,
      pieces: [
        // C 的銷往後穿過活塞桿頂的眼;中點的銷往後穿過半徑桿;立柱頂 R 的銷往後穿過立柱
        { kind: "cylinder", radius: PIN_C, length: 0.26, at: [0, 0, -0.06] },
        { kind: "cylinder", radius: 0.04, length: 0.25, at: [HALF, 0, -0.055] },
        { kind: "cylinder", radius: 0.06, length: 0.27, at: [2 * HALF, 0, -0.065] },
      ],
    },
    { id: "radiusB", kind: "link", width: 0.1, thickness: 0.06, pins: false, label: "B", labelOffset: [0.2, 0.3, 0.3] },
    { id: "conRod", kind: "link", width: 0.12, thickness: 0.06 },
    {
      id: "crank",
      kind: "group",
      center: K,
      spin: CR + 0.2,
      pieces: [
        { kind: "cylinder", radius: 0.14, length: 0.86, at: [0, 0, -0.27] }, // 曲柄軸:從軸承座(z −0.7)穿過圓盤到曲柄臂的背面(0.16)
        { kind: "box", size: [CR, 0.14, 0.08], at: [CR / 2, 0, 0.2] },
        { kind: "cylinder", radius: 0.06, length: 0.3, at: [CR, 0, 0.25], accent: true },
        { kind: "cylinder", radius: 0.6, length: 0.1, at: [0, 0, -0.35] },
      ],
    },
    // 活塞桿走汽缸中心線,在樑後面;頂端的眼套在樑的 C 銷上
    { id: "pistonRod", kind: "box", size: [0.08, PISTON_ROD, 0.08], pieces: [{ kind: "cylinder", radius: PIN_C + 0.05, length: 0.08, at: [0, PISTON_ROD / 2, 0] }] },
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
        beam: { position: z(g.C, Z_BEAM), angle: Math.atan2(g.R[1] - g.C[1], g.R[0] - g.C[0]) },
        radiusB: { from: z(E, Z_RADIUS), to: z(g.mid, Z_RADIUS) },
        conRod: { from: z(g.pin, 0.25), to: z(g.M, 0.25) },
        crank: { angle: g.theta },
        // 活塞桿走汽缸的中心線、和活塞一起動(樑端 C 偏離這條直線不到 0.001,鉸接處的間隙吃掉)
        pistonRod: { position: [CYL.x, g.C[1] - PISTON_ROD / 2, 0] },
        ...cyl.parts,
      },
      flows: cyl.flows,
      readouts: [],
    };
  },
};
