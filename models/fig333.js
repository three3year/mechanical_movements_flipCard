// 第 333 種:只在特殊情況下使用的一種平行運動(原文沒有說明它的構造)。
// 結構(依原圖):三角形的樑 T–H–R 不繞固定點轉,而是由兩根桿撐著——左邊的桿從地面樞軸 G1 接到樑中段的大接頭 H,
// 右邊的桿從右下的地面樞軸 G2 接到樑的右端 R(四連桿,樑是連桿);樑左上端 T 垂下的短桿是活塞桿。
// 接頭 H 另外垂下一根吊桿,吊桿下端 J2 由半徑桿拉向 G2;吊桿中段的接頭 J1 也走近似直線。
// 樑擺動時,T 與 J1 都走近似直線(T 的直線向左下傾約 10°,活塞桿就沿這條線)。
// 主動件是左邊的桿 G1–H(軸固定在地面上;原文沒有指明輸入)。
// 推斷:原文沒有說明,構造與作用依原圖的桿件配置判讀;桿長與接點依原圖量取(原圖 1 像素 = 0.01)。
// (原本的模型以瓦特直線連桿解釋,和原圖的桿件配置不同,已照原圖重排。)
import { deg, clamp, rot2 } from "./kit.js";
import { circleCircle, angleOf, bodyPoint } from "./linkage.js";
import { shape, thickLine, circle } from "./shapes.js";

const px = (x, y) => [x / 100 - 2.3, 2.1 - y / 100, 0];
const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const G1 = px(70, 195);
const G2 = px(395, 370);
const H0 = px(245, 150);
const R0 = px(392, 237);
const T0 = px(85, 55);
const J10 = px(245, 222);
const J20 = px(252, 290);
const LEFT = d(G1, H0);
const RIGHT = d(G2, R0);
const HR = d(H0, R0);
const HANG = d(H0, J20);
const HANG_J1 = d(H0, J10);
const RADIUS = d(J20, G2);
const A0 = angleOf(G1, H0);
// T 在樑上的位置(以 H 為原點、H→R 為 +x 的局部座標)
const B0 = angleOf(H0, R0);
const T_LOCAL = rot2([T0[0] - H0[0], T0[1] - H0[1]], -B0);
export const RANGE = [A0 - deg(13.5), A0 + deg(5)];
/** 兩圓的交點裡,離原圖位置 q 最近的那一個 */
const meetNear = (c1, r1, c2, r2, q) => {
  const [a, b] = [circleCircle(c1, r1, c2, r2, 1).point, circleCircle(c1, r1, c2, r2, -1).point];
  return d(a, q) < d(b, q) ? a : b;
};
const ROD = 0.6; // 活塞桿露出的長度

/** 左桿轉到 a → 樑的接頭 H、右端 R、左上端 T、樑角,吊桿下端 J2 與中段 J1 */
export function linkage(a0) {
  const a = clamp(a0, ...RANGE);
  const H = [G1[0] + LEFT * Math.cos(a), G1[1] + LEFT * Math.sin(a), 0];
  const R = meetNear(H, HR, G2, RIGHT, R0);
  const beam = angleOf(H, R);
  const T = bodyPoint(H, beam, T_LOCAL);
  const J2 = meetNear(H, HANG, G2, RADIUS, J20);
  const J1 = [H[0] + ((J2[0] - H[0]) * HANG_J1) / HANG, H[1] + ((J2[1] - H[1]) * HANG_J1) / HANG, 0];
  return { a, H, R, T, beam, J1, J2 };
}
// 活塞桿沿 T 走的直線(行程兩端的連線方向,往上)
const ends = [linkage(RANGE[0]).T, linkage(RANGE[1]).T];
export const LINE = angleOf(ends[0], ends[1]);

const ground = (p, pin) => ({
  kind: "group",
  at: p,
  pieces: [
    { kind: "box", size: [0.6, 0.1, 0.4], at: [0, -0.2, 0] },
    ...[0, 1, 2, 3].map((i) => ({ kind: "box", size: [0.04, 0.14, 0.3], at: [-0.22 + i * 0.15, -0.3, 0], angle: deg(30) })),
    { kind: "box", size: [0.12, 0.15, 0.2], at: [0, -0.1, 0] },
    { kind: "cylinder", radius: 0.07, ...pin },
  ],
});
const BEAM_T = T_LOCAL; // 樑的局部座標:左上端 T
const BEAM_R = [HR, 0]; // 樑的局部座標:右端 R

export default {
  figure: 333,
  parts: [
    { id: "ground", kind: "group", pieces: [ground(G1, { length: 0.4, at: [0, 0, -0.1] }), ground(G2, { length: 0.75 })] },
    { id: "linkL", kind: "plate", center: G1, shape: { ...shape(thickLine([[0, 0], [LEFT, 0]], 0.12)), holes: [circle(0.07).reverse()] }, thickness: 0.06, arrow: false, pieces: [{ kind: "cylinder", radius: 0.07, length: 0.45, at: [LEFT, 0, 0.15] }] },
    {
      // 三角形的樑:H 的大接頭、往右到 R、往左上到 T,下緣 T–R 一根直條
      id: "beam",
      kind: "plate",
      shape: shape(thickLine([BEAM_T, [0, 0], BEAM_R], 0.16)),
      thickness: 0.1,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([BEAM_T, BEAM_R], 0.07)), thickness: 0.08 },
        { kind: "cylinder", radius: 0.27, inner: 0.08, length: 0.12 },
        { kind: "cylinder", radius: 0.06, length: 0.35, at: [BEAM_R[0], 0, 0.1] },
        { kind: "cylinder", radius: 0.06, length: 0.3, at: [BEAM_T[0], BEAM_T[1], 0.1] },
      ],
    },
    { id: "linkR", kind: "link", width: 0.12, thickness: 0.06 },
    { id: "hanger", kind: "link", width: 0.12, thickness: 0.06 },
    { id: "radiusBar", kind: "link", width: 0.12, thickness: 0.06 },
    { id: "pinJ1", kind: "cylinder", radius: 0.07, length: 0.2 },
    { id: "pistonRod", kind: "group", pieces: [{ kind: "box", size: [0.09, ROD, 0.08], at: [0, -ROD / 2, 0] }] },
  ],
  driver: { part: "linkL", type: "rotation", range: RANGE, initial: A0 },
  target: "pistonRod", // 被導引走近似直線的活塞桿(掛在樑的左上端 T)
  view: { direction: [0.03, 0.05, 1] },
  pose(a0) {
    const m = linkage(a0);
    const z = (q, dz) => [q[0], q[1], dz];
    return {
      parts: {
        linkL: { angle: m.a, position: z(G1, -0.15) },
        beam: { position: z(m.H, 0), angle: m.beam },
        linkR: { from: z(G2, 0.15), to: z(m.R, 0.15) },
        hanger: { from: z(m.H, 0.15), to: z(m.J2, 0.15) },
        radiusBar: { from: z(m.J2, 0.28), to: z(G2, 0.28) },
        pinJ1: { position: z(m.J1, 0.15) },
        pistonRod: { position: z(m.T, 0.17), angle: LINE - Math.PI / 2 },
      },
      readouts: [],
    };
  },
};
