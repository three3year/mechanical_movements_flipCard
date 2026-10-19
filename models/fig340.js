// 第 340 種:另一種平行運動。樑 D–C 架在搖動立柱 B–F 的頂上,立柱繞底下的中心 F 擺動;活塞桿接在樑的 C 端,
// 半徑桿 E–A(E 是固定樞軸)接在樑上的 A 點,產生平行運動。A 是 B、C 的中點,EA = AB = AC,而立柱很長、
// B 幾乎沿水平線來回,所以 C 走的是近似鉛直的直線(司各特‧羅素的原理)。主動件是樑(連同立柱)。
// 推斷:各桿長依原圖比例,滿足 EA = AB = AC;擺幅。F 的軸承座與底座(原圖只畫出 F 的轂)。
// 樑套在立柱頂 B 的粗軸上(原圖 B、F 都是打斜線的軸);A、C、D 各有一根銷,從樑穿到前面一層的半徑桿、活塞桿與 D 端的桿。
// E 是從右邊打斜線的牆伸出的托架(原圖),牆往下接到底座(推斷:原圖的牆只畫到 E 附近)。
// D 端吊的桿(原圖往下伸出畫面,原文沒說接什麼)是會擺的連桿:上端接 D,下端的銷在固定的鉛直導槽裡滑
// (推斷;網站動畫裡這根桿也跟著 D 斜擺)。D 橫移約 0.8,只平移的桿下端沒有東西導引。
import { deg, clamp } from "./kit.js";
import { circleCircle } from "./linkage.js";
import { shape, circle, thickLine, arcPoints, rect } from "./shapes.js";

const F = [-0.6, -2.4, 0]; // 立柱的擺動中心
const PILLAR = 3.25; // F 到 B
const L = 1.25; // EA = AB = AC
const E = [1.565, 0.85, 0]; // 半徑桿的固定樞軸:在 C 的直線上、B 的高度
const BD = 1.4; // 樑從 B 往左延伸到 D
export const RANGE = [deg(-4.5), deg(4.5)]; // 立柱偏離鉛直的角度
const PISTON_ROD = 2.0;
const ROD_D = 2.0; // D 端的桿長
const FLOOR = F[1] - 0.59; // 底座頂面
const WALL_X = E[0] + 0.3; // 牆的中心

// 各層的 z:立柱在後、樑在中間,半徑桿、活塞桿與 D 端的桿在樑前面;A、C、D 的銷從樑穿到前面那一層
const Z_BEAM = 0.15; // 樑(厚 0.14)
const Z_FRONT = 0.28;
const PIN = 0.04;
const PIN_Z = [0.08, 0.34]; // 銷的深度範圍(世界)
const SLOT_Z = 0.16; // D 端的桿下端的導槽板

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
export const geometry = { E };

// D 端的桿:下端 Q 走 x = Q_X 的鉛直線(D 橫移範圍的中間),桿長不變
const Q_X = (beam(RANGE[0]).D[0] + beam(RANGE[1]).D[0]) / 2;
const lower = (D) => [Q_X, D[1] - Math.sqrt(ROD_D * ROD_D - (D[0] - Q_X) ** 2), 0];
const Q_Y = [lower(beam(RANGE[0]).D)[1], lower(beam(RANGE[1]).D)[1]].sort((a, b) => a - b);

// 導槽板:鉛直的長孔,寬 = 銷徑,長度剛好讓銷走完全程
const slot = [...arcPoints(PIN, Math.PI, 2 * Math.PI, 0, Q_Y[0]), ...arcPoints(PIN, 0, Math.PI, 0, Q_Y[1])].reverse();
const SLOT_PLATE = { lo: Q_Y[0] - 0.25, hi: Q_Y[1] + 0.2 };

const beamPin = (x) => ({ kind: "cylinder", radius: PIN, length: PIN_Z[1] - PIN_Z[0], at: [x, 0, (PIN_Z[0] + PIN_Z[1]) / 2 - Z_BEAM] });

export default {
  figure: 340,
  parts: [
    {
      id: "ground",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: 0.3, inner: 0.12, length: 0.3, at: [F[0], F[1], -0.2] },
        { kind: "box", size: [0.4, 0.42, 0.3], at: [F[0], F[1] - 0.38, -0.2] },
        // 底座:從 D 端的導槽一路伸到右邊的牆
        { kind: "box", size: [WALL_X + 0.2 - (Q_X - 0.4), 0.2, 0.7], at: [(WALL_X + 0.2 + Q_X - 0.4) / 2, FLOOR - 0.1, -0.1] },
        { kind: "cylinder", radius: 0.12, length: 0.5, at: [F[0], F[1], -0.05] }, // F 的軸,填滿軸承座的轂
        // 牆(原圖打斜線)站在底座上,托架從牆伸到 E,E 的銷往前穿過半徑桿
        { kind: "box", size: [0.15, E[1] + 0.45 - FLOOR, 0.4], at: [WALL_X, (E[1] + 0.45 + FLOOR) / 2, -0.1] },
        { kind: "box", size: [WALL_X - 0.075 - (E[0] - 0.08), 0.14, 0.18], at: [(WALL_X - 0.075 + E[0] - 0.08) / 2, E[1], 0.13] },
        { kind: "cylinder", radius: PIN, length: PIN_Z[1] - PIN_Z[0], at: [E[0], E[1], (PIN_Z[0] + PIN_Z[1]) / 2] },
        // D 端的桿下端的導槽板與立在底座上的支柱(推斷)
        { kind: "plate", shape: shape(rect(0.4, SLOT_PLATE.hi - SLOT_PLATE.lo, 0, (SLOT_PLATE.hi + SLOT_PLATE.lo) / 2), [slot]), thickness: 0.1, at: [Q_X, 0, SLOT_Z] },
        { kind: "box", size: [0.2, SLOT_PLATE.lo - FLOOR, 0.1], at: [Q_X, (SLOT_PLATE.lo + FLOOR) / 2, SLOT_Z] },
      ],
    },
    { id: "labelF", kind: "group", center: F, label: "F", labelOffset: [0.45, -0.1, 0.3] },
    { id: "labelE", kind: "group", center: E, label: "E", labelOffset: [0, 0.3, 0.3] },
    // 立柱:頂上的粗軸穿過樑的孔
    { id: "pillar", kind: "link", width: 0.36, thickness: 0.12, pins: false, label: "B", labelOffset: [0, 0.35, 0.3], pieces: [{ kind: "cylinder", radius: 0.2, length: 0.3, at: [PILLAR, 0, 0.09] }] },
    { id: "beam", kind: "plate", shape: shape(thickLine([[-BD, 0], [2 * L, 0]], 0.34), [circle(0.2).reverse()]), thickness: 0.14, arrow: false, pieces: [beamPin(-BD), beamPin(L), beamPin(2 * L)] },
    { id: "radiusBar", kind: "link", width: 0.1, thickness: 0.06, pins: false, label: "A", labelOffset: [-0.25, -0.2, 0.3] },
    { id: "pistonRod", kind: "box", size: [0.08, PISTON_ROD, 0.08], label: "C", labelOffset: [0.3, 0.9, 0.3] },
    {
      id: "rodD",
      kind: "link",
      width: 0.1,
      thickness: 0.06,
      pins: false,
      label: "D",
      labelOffset: [-0.3, 0.9, 0.3],
      pieces: [{ kind: "cylinder", radius: PIN, length: Z_FRONT + 0.03 - (SLOT_Z - 0.05), at: [ROD_D, 0, (Z_FRONT + 0.03 + SLOT_Z - 0.05) / 2 - Z_FRONT] }],
    },
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
        beam: { position: z(b.B, Z_BEAM), angle: b.angle },
        radiusBar: { from: z(b.A, Z_FRONT), to: z(E, Z_FRONT) },
        // 活塞桿的頂端包住 C 的銷(多伸出一個銷的半徑)
        pistonRod: { position: [b.C[0], b.C[1] + PIN + 0.02 - PISTON_ROD / 2, Z_FRONT] },
        rodD: { from: z(b.D, Z_FRONT), to: z(lower(b.D), Z_FRONT) },
      },
      readouts: [],
    };
  },
};
