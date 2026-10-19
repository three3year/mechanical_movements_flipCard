// 第 343 種:直立式引擎的平行運動。A、A 是半徑桿,一端接在框架上,另一端接在活塞桿頂的擺動件(一根短桿)的兩端;
// 兩根半徑桿從左右兩側伸來,擺動件中點(活塞桿頂)走的是近似直線(瓦特直線連桿)。活塞桿頂經連桿接到頂上的曲柄。
// 主動件是虛擬的「進程」(下方汽缸的蒸汽推動);汽缸內的蒸汽以流體示意。
// 推斷:各桿長依原圖比例;連桿接在擺動件的中點。後方的大輪是曲柄軸上的飛輪(依原圖,跟著曲柄轉);
// 曲柄軸穿過頂上橫樑中間的軸承(原圖橫樑上的方塊)。半徑桿的固定樞軸是立柱上伸出的托架(原圖),銷往前穿過半徑桿。
// 兩個樞軸的高度讓擺動範圍對稱於中位:兩根半徑桿水平時活塞桿頂在行程中點,直線最直(原圖在下死點附近的相位,
// 兩根半徑桿都往中間下斜)。各層由後往前:活塞桿(汽缸中心線)、半徑桿、擺動件、連桿;擺動件中點 P 的銷從活塞桿頂
// 穿過擺動件到連桿的眼,兩端 B、R 的銷只往後穿過半徑桿,不伸進活塞桿那一層。
import { TAU } from "./kit.js";
import { solve } from "./linkage.js";
import { wattLinkage } from "./parallel-motion.js";
import { cylinderParts, cylinderPose, steamPipe } from "./vertical-engine.js";
import { shape, arcPoints, circle, stadium } from "./shapes.js";

export const watt = wattLinkage({ line: 0, y1: 1.05, y2: -0.05, a: 1.4, b: 1.4, beamSide: -1 });
const CRANK = [0, 2.75, 0];
const CR = 0.4;
const ROD = 2.25;
const PISTON_ROD = 2.0;
const CYL = { x: 0, top: -0.95, length: 1.15, radius: 0.42, seat: -2.91 };
// 各層的 z
const Z_PISTON = 0; // 活塞桿(厚 0.08)
const Z_RADIUS = 0.15; // 半徑桿(厚 0.06)
const Z_VIB = 0.22; // 擺動件(厚 0.06)
const Z_ROD = 0.29; // 連桿(厚 0.06)
const PIN = 0.04;
const vibPin = (x, z0, z1) => ({ kind: "cylinder", radius: PIN, length: z1 - z0, at: [x, 0, (z0 + z1) / 2 - Z_VIB] });
// 半徑桿的固定樞軸:立柱上的托架,銷往前穿過半徑桿
const bracket = (O, side) => [
  { kind: "box", size: [0.12, 0.16, 0.25], at: [O[0] + side * 0.04, O[1], -0.225] },
  { kind: "cylinder", radius: PIN, length: Z_RADIUS + 0.03 - -0.2, at: [O[0], O[1], (Z_RADIUS + 0.03 + -0.2) / 2] },
];

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
        // 兩根立柱從底座頂面(−2.91)立起
        { kind: "box", size: [0.3, 5.61, 0.3], at: [-1.6, -0.105, -0.3] },
        { kind: "box", size: [0.3, 5.61, 0.3], at: [1.6, -0.105, -0.3] },
        // 頂上橫樑:中間是曲柄軸的軸承(軸承座的方塊開著軸孔)
        { kind: "box", size: [1.45, 0.3, 0.3], at: [-1.075, 2.75, -0.3] },
        { kind: "box", size: [1.45, 0.3, 0.3], at: [1.075, 2.75, -0.3] },
        { kind: "plate", shape: shape([[-0.35, -0.3], [0.35, -0.3], [0.35, 0.3], [-0.35, 0.3]], [circle(0.13).reverse()]), thickness: 0.4, at: [0, 2.75, -0.2] },
        { kind: "box", size: [3.6, 0.18, 0.8], at: [0, -3.0, 0] },
        ...bracket(watt.O1, -1),
        ...bracket(watt.O2, 1),
      ],
    },
    { id: "pipe", ...steamPipe(CYL) },
    ...cylinderParts(CYL),
    {
      id: "crank",
      kind: "group",
      center: CRANK,
      spin: CR + 0.2,
      pieces: [
        { kind: "cylinder", radius: 0.12, length: 0.95, at: [0, 0, -0.3] }, // 曲柄軸,往後穿過軸承接飛輪
        { kind: "box", size: [CR, 0.14, 0.08], at: [CR / 2, 0, 0.2] },
        { kind: "cylinder", radius: 0.06, length: 0.3, at: [CR, 0, 0.25], accent: true },
        // 飛輪:輪緣與輪輻,在機架後面
        { kind: "plate", shape: shape([...arcPoints(2.6, 0, TAU).slice(0, -1)], [arcPoints(2.38, 0, TAU).slice(0, -1).reverse()]), thickness: 0.12, at: [0, 0, -0.7] },
        ...[0, 1, 2].map((i) => ({ kind: "box", size: [4.9, 0.12, 0.08], at: [0, 0, -0.7], angle: (i * Math.PI) / 3 + 0.3 })),
      ],
    },
    { id: "rod", kind: "link", width: 0.1, thickness: 0.06, pins: false },
    { id: "radiusL", kind: "link", width: 0.1, thickness: 0.06, pins: false, label: "A", labelOffset: [0.6, -0.2, 0.3] },
    { id: "radiusR", kind: "link", width: 0.1, thickness: 0.06, pins: false, label: "A", labelOffset: [-0.6, 0.2, 0.3] },
    {
      id: "vibrating",
      kind: "plate",
      shape: stadium(watt.c, 0.14),
      thickness: 0.06,
      arrow: false,
      pieces: [vibPin(0, Z_RADIUS - 0.03, Z_VIB + 0.03), vibPin(watt.c, Z_RADIUS - 0.03, Z_VIB + 0.03), vibPin(watt.c * watt.k, Z_PISTON - 0.04, Z_ROD + 0.03)],
    },
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
        rod: { from: z(u.pin, Z_ROD), to: z(u.P, Z_ROD) },
        radiusL: { from: z(watt.O1, Z_RADIUS), to: z(u.B, Z_RADIUS) },
        radiusR: { from: z(watt.O2, Z_RADIUS), to: z(u.R, Z_RADIUS) },
        vibrating: { position: z(u.B, Z_VIB), angle: Math.atan2(u.R[1] - u.B[1], u.R[0] - u.B[0]) },
        // 活塞桿頂多伸出一個銷的半徑,包住 P 的銷
        pistonRod: { position: [u.P[0], u.P[1] + PIN + 0.02 - PISTON_ROD / 2, Z_PISTON] },
        ...cyl.parts,
      },
      flows: cyl.flows,
      readouts: [],
    };
  },
};
