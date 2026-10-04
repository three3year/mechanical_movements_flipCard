// 第 418 種:Buchanan & Righter 的專利滑閥機構。閥 A 接在桿 B 的下端,在閥座上水平滑動;桿 B 的上端接在一根銷上,
// 銷在垂直的溝槽裡滑動;桿上另裝一個滾子 C,在兩個懸掛的、可上下調整的弧形件 D 之間滑動。
// 這樣配置是為了不讓閥被蒸汽壓力過度壓在閥座上,減輕摩擦(閥與桿的重量、蒸汽的壓力由弧形件承擔)。
// 主動件是桿 B(隨閥的往復擺動);閥 A 由一根短連桿接在桿 B 的下端。
// 推斷:弧形件以上端的銷為圓心,所以桿 B 擺動時滾子沿弧走、銷不必上下;銷的溝槽是為了讓弧形件上下調整時銷能跟著。
import { deg, swing } from "./kit.js";
import { shape, thickLine, arcPoints, rect, circle } from "./shapes.js";

export const TOP = [0, 2.0, 0]; // 上端的銷
export const ROLLER_AT = 2.0; // 銷到滾子 C
const ROD = 2.55; // 銷到桿 B 下端
export const SEAT_Y = -0.92; // 閥 A 的銷的高度
export const LINK = 0.45; // 桿 B 下端到閥 A 的短連桿(斜著,桿擺到兩端、下端升高時連桿變直)
const ROLLER_R = 0.12;
export const SWING = deg(12);

const along = (phi, d) => [TOP[0] + d * Math.sin(phi), TOP[1] - d * Math.cos(phi), 0];

/** 桿 B 的轉角 phi → 滾子、桿下端、閥的銷 */
export function linkage(phi) {
  const C = along(phi, ROLLER_AT);
  const Q = along(phi, ROD);
  const h = Q[1] - SEAT_Y;
  const P = [Q[0] + Math.sqrt(LINK * LINK - h * h), SEAT_Y, 0];
  return { C, Q, P };
}

// 兩個弧形件(以上端的銷為圓心),夾住滾子
const arc = (r) => shape(thickLine(arcPoints(r, deg(-90) - deg(24), deg(-90) + deg(24), TOP[0], TOP[1]), 0.1));
const ends = [deg(-114), deg(-66)].map((a) => [TOP[0] + (ROLLER_AT + ROLLER_R + 0.05) * Math.cos(a), TOP[1] + (ROLLER_AT + ROLLER_R + 0.05) * Math.sin(a)]);
const casing = [[-2.1, -0.85], [-1.95, -0.85], [-1.25, 2.45], [1.25, 2.45], [1.95, -0.85], [2.1, -0.85]];

export default {
  figure: 418,
  parts: [
    {
      id: "chest",
      kind: "group",
      pieces: [
        // 閥室外殼(剖面)與閥座
        { kind: "plate", shape: shape(thickLine(casing, 0.12)), thickness: 0.7 },
        { kind: "box", size: [4.6, 0.3, 0.9], at: [0, -1.55 + 0.15, 0] },
        { kind: "box", size: [0.25, 0.3, 0.92], at: [-0.55, -1.4, 0] },
        { kind: "box", size: [0.25, 0.3, 0.92], at: [0.55, -1.4, 0] },
        // 上端銷的垂直溝槽
        { kind: "plate", shape: shape(rect(0.5, 0.9, 0, 2.0), [rect(0.12, 0.6, 0, 2.0).reverse()]), thickness: 0.1, at: [0, 0, -0.12] },
        { kind: "box", size: [0.08, 0.35, 0.08], at: [0, 2.6, 0] },
        { kind: "box", size: [0.3, 0.1, 0.12], at: [0, 2.8, 0], accent: true },
        // 懸掛弧形件 D 的吊桿(可上下調整)
        ...ends.map(([x, y]) => ({ kind: "box", size: [0.07, 2.45 - y, 0.07], at: [x, (2.45 + y) / 2, 0.16] })),
      ],
    },
    {
      id: "arcs",
      kind: "group",
      label: "D",
      labelOffset: [0.75, -0.05, 0.3],
      pieces: [
        { kind: "plate", shape: arc(ROLLER_AT + ROLLER_R + 0.05), thickness: 0.08, at: [0, 0, 0.16] },
        { kind: "plate", shape: arc(ROLLER_AT - ROLLER_R - 0.05), thickness: 0.08, at: [0, 0, 0.16] },
      ],
    },
    {
      id: "rod",
      kind: "group",
      label: "B",
      labelOffset: [0.25, -0.9, 0.2],
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0, 0], [0, -ROD]], 0.16), [circle(0.05).reverse()]), thickness: 0.06, at: [0, 0, 0.05] },
        { kind: "cylinder", radius: 0.06, length: 0.3, at: [0, 0, 0.05] },
        { kind: "cylinder", radius: 0.04, length: 0.42, at: [0, -ROLLER_AT, 0.12] },
      ],
    },
    { id: "roller", kind: "pulley", style: "disc", radius: ROLLER_R, width: 0.08, label: "C", labelOffset: [-0.3, 0.1, 0.3], arrow: false },
    { id: "link", kind: "link", width: 0.12, thickness: 0.05 },
    { id: "valve", kind: "box", size: [0.95, 0.32, 0.8], label: "A", labelOffset: [0, -0.02, 0.5] },
  ],
  driver: { part: "rod", type: "rotation", cycle: [-SWING, SWING], initial: SWING },
  target: "valve",
  view: { direction: [0.03, 0.05, 1] },
  pose(v) {
    const phi = swing(v, -SWING, SWING);
    const { C, Q, P } = linkage(phi);
    return {
      parts: {
        rod: { position: TOP, angle: phi },
        // 滾子貼著外側的弧滾動
        roller: { position: [C[0], C[1], 0.16], angle: (-phi * (ROLLER_AT + ROLLER_R)) / ROLLER_R },
        link: { from: [Q[0], Q[1], 0.12], to: [P[0], P[1], 0.12] },
        valve: { position: [P[0], SEAT_Y - 0.17, 0] },
      },
      readouts: [{ label: "閥 A 的位置", value: P[0].toFixed(2) }],
    };
  },
  waivers: [
    { check: "interference", parts: ["chest", "arcs"], reason: "簡化畫法:弧形片貼著箱體的導條滑動,重疊 0.03" },
  ],
};
