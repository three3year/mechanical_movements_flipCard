// 第 336 種:船舶側槓桿引擎平行運動的另一種配置。與側槓桿相連的側桿所接的平行桿,同時也接在搖臂軸 F 上的
// 短半徑臂上,搖臂軸在固定的軸承內轉動;十字頭因此被導引作直線往復。蒸汽推動汽缸的活塞。
// 主動件是虛擬的「進程」;汽缸內的蒸汽以流體示意。
// 結構(依原圖):側槓桿繞左下的 A 擺動;右端經側桿(畫在汽缸前面)接活塞桿頂的十字頭 E;槓桿中段 M 經一根直桿
// 往上接 P,P 同時接搖臂軸 F 的短半徑臂與平行桿 P–Q。所有桿都是剛性的,十字頭的直線是這組連桿造成的(近似直線)。
// 推斷:桿長與接點依原圖量取(原圖 1 像素 = 0.0125)。原圖的槓桿在最低處(活塞在缸底),由此往上擺 30°,
// 活塞走過汽缸可用長度約八成(原本 ±8° 只走四成,上方一大段從沒進去)。平行桿照原圖接在側桿上、十字頭下方 0.43,
// 十字頭在側桿頂端。搖臂軸的位置與半徑臂長、直桿下端 M 在槓桿上的位置是為了讓十字頭最直而選的(全行程偏離約 0.001):
// 偏離插圖——原圖 M 在 P 的正下方、F 在 P 右上 0.45,照原圖的位置十字頭在這個擺幅下偏離約 0.03,這裡 M 往左挪 0.26、
// F 往右下挪,半徑臂 0.69。搖臂軸的軸承座、槓桿樞軸的支座、汽缸的座、機架的腳是推斷。
// 機架照原圖:斜撐從左上斜下來、轉進汽缸頂的台面,搖臂軸 F 的軸承座立在斜撐上;斜撐往下接一隻腳落到底座(推斷)。
// 深度由後往前:機架 → 汽缸(剖開前半)→ 搖臂軸的半徑臂 → 平行桿 → 直桿 → 側槓桿與側桿;P 點一根銷穿過半徑臂、平行桿與直桿,
// Q 點一根銷穿過平行桿與側桿,M 點一根銷穿過直桿與槓桿。
// (原本的模型把十字頭直接當成沿直線走、再補一個平行四邊形,和原圖的桿件配置不同,已照原圖重排。)
import { deg } from "./kit.js";
import { circleCircle, angleOf } from "./linkage.js";
import { cylinderParts, cylinderPose, steamPipe } from "./vertical-engine.js";
import { shape, circle, thickLine } from "./shapes.js";
import { pedestal } from "./supports.js";

const K = 0.0125;
const px = (x, y) => [(x - 65) * K - 2.0, (320 - y) * K - 1.6, 0];
const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const A = px(65, 320); // 側槓桿樞軸
const S0 = px(325, 378); // 側桿下端(槓桿右端)
const M0 = [-0.88, px(175, 345)[1], 0]; // 直桿下端(槓桿中段;原圖在 x −0.625,見檔頭)
const Q0 = px(325, 100); // 平行桿接在側桿上的點
const P0 = px(170, 65); // 半徑臂端、平行桿左端
export const UP = 0.43; // 十字頭(側桿頂端)在 Q 上方多遠(原圖)
const SIDE_Q = d(S0, Q0);
const SIDE = SIDE_Q + UP;
export const F = [-0.04, 1.82, 0]; // 搖臂軸
const LEVER = d(A, S0);
const LEVER_M = d(A, M0);
const M_ANGLE = angleOf(A, M0) - angleOf(A, S0);
const PARALLEL = d(P0, Q0);
const UPRIGHT = d(P0, M0);
export const ARM = d(F, P0);
const TILT = angleOf(A, S0); // 原圖的槓桿角:最低處
const SWING = deg(15); // 擺幅的一半
const X = Q0[0];
const PISTON_ROD = 3.24; // 活塞在行程兩端離缸蓋一樣遠
export const CYL = { x: X, top: 0.4, length: 2.4, radius: 0.7 };
const BASE = -3.2; // 底座頂面
// 層(z):機架在後,往前是半徑臂、平行桿、直桿、槓桿與側桿
const Z = { frame: -0.4, arm: 0.67, parallel: 0.76, upright: 0.85, lever: 0.95, side: 0.95 };
const T = 0.06; // 各桿的厚度
const LEVER_T = 0.12;

/** 兩個解裡離原圖位置 near 最近的那一個 */
const nearest = (a, b, near) => (d(a, near) < d(b, near) ? a : b);

/** 進程 p → 槓桿角與各接點:A、S、M、P、Q(平行桿接側桿)、E(十字頭)、搖臂角 */
export function motion(p) {
  const at = (q) => {
    const psi = TILT + SWING * (1 - Math.cos(2 * Math.PI * q));
    const S = [A[0] + LEVER * Math.cos(psi), A[1] + LEVER * Math.sin(psi), 0];
    const M = [A[0] + LEVER_M * Math.cos(psi + M_ANGLE), A[1] + LEVER_M * Math.sin(psi + M_ANGLE), 0];
    const P = nearest(circleCircle(F, ARM, M, UPRIGHT, 1).point, circleCircle(F, ARM, M, UPRIGHT, -1).point, P0);
    const Q = nearest(circleCircle(P, PARALLEL, S, SIDE_Q, 1).point, circleCircle(P, PARALLEL, S, SIDE_Q, -1).point, Q0);
    const E = [S[0] + ((Q[0] - S[0]) * SIDE) / SIDE_Q, S[1] + ((Q[1] - S[1]) * SIDE) / SIDE_Q, 0];
    return { psi, S, M, P, Q, E };
  };
  const now = at(p);
  return { ...now, rock: angleOf(F, now.P), downward: at(p + 1e-4).E[1] < now.E[1] };
}

/** 從 lo 層的背面穿到 hi 層正面的銷,掛在 z 層的連桿上:回傳相對 z 與長度 */
const through = (z, lo, hi, tLo = T, tHi = T) => {
  const [a, b] = [lo - tLo / 2, hi + tHi / 2];
  return { at: (a + b) / 2 - z, length: b - a };
};
const PIN_P = through(Z.upright, Z.arm, Z.upright);
const PIN_Q = through(Z.parallel, Z.parallel, Z.side);
const PIN_M = through(Z.upright, Z.upright, Z.lever, T, LEVER_T);
const PIN = 0.04;
// 斜撐的中心線:從左上斜下來,轉進汽缸頂的台面,再往下成腳落到底座
const STRUT = [[-2.6, 2.7], [-0.15, 0.95], [0.18, 0.62], [0.18, BASE]];
const STRUT_W = 0.3;
const strutY = (x) => {
  const [[x0, y0], [x1, y1]] = x < STRUT[1][0] ? [STRUT[0], STRUT[1]] : [STRUT[1], STRUT[2]];
  return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
};
const RING = 0.25; // 搖臂軸軸承環的外半徑
const COLUMN_FOOT = strutY(F[0]); // 軸承座的立柱從斜撐的中心線起

export default {
  figure: 336,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(thickLine(STRUT, STRUT_W)), thickness: 0.25, at: [0, 0, Z.frame] },
        // 斜撐的下端擱在汽缸頂的台面上
        { kind: "box", size: [CYL.x - CYL.radius + 0.2 - STRUT[2][0], 0.12, 0.25], at: [(STRUT[2][0] + CYL.x - CYL.radius + 0.2) / 2, CYL.top + 0.12 + 0.06, Z.frame] },
        { kind: "box", size: [5.4, 0.15, 1.6], at: [0.1, BASE - 0.075, 0.2] },
        // 汽缸的座
        { kind: "box", size: [1.4, CYL.top - CYL.length - 0.12 - BASE, 0.9], at: [X, (CYL.top - CYL.length - 0.12 + BASE) / 2, 0] },
        // 搖臂軸 F 的軸承座:立在斜撐上的立柱與軸承環(原圖 F 在斜撐上方的方塊裡)
        { kind: "cylinder", radius: RING, inner: 0.09, length: 0.3, at: [F[0], F[1], Z.frame] },
        { kind: "box", size: [0.4, F[1] - COLUMN_FOOT, 0.3], at: [F[0], (F[1] + COLUMN_FOOT) / 2, Z.frame] },
        // 側槓桿樞軸 A 的支座
        ...pedestal({ at: [A[0], A[1]], z: 0.62, bore: 0.11, floor: BASE, depth: 0.25 }),
      ],
    },
    { id: "pipe", ...steamPipe(CYL) },
    ...cylinderParts(CYL),
    {
      id: "lever",
      kind: "plate",
      center: [A[0], A[1], Z.lever], // 側槓桿與側桿在汽缸的前面
      shape: { ...shape(thickLine([[0, 0], [LEVER, 0]], 0.36)), holes: [circle(0.11).reverse()] },
      thickness: 0.12,
      arrow: false,
      pieces: [{ kind: "cylinder", radius: 0.26, length: 0.22 }, { kind: "cylinder", radius: 0.1, length: 0.5, at: [0, 0, -0.25] }],
    },
    {
      // 搖臂軸 F 與它的短半徑臂:軸從後面的軸承座往前伸到半徑臂那一層
      id: "rock",
      kind: "group",
      center: F,
      arrow: false,
      label: "F",
      labelOffset: [0.1, 0.35, 0.3],
      pieces: [
        { kind: "cylinder", radius: 0.09, length: Z.arm + T / 2 - (Z.frame - 0.15), at: [0, 0, (Z.arm + T / 2 + Z.frame - 0.15) / 2] },
        { kind: "plate", shape: shape(thickLine([[0, 0], [ARM, 0]], 0.16)), thickness: T, at: [0, 0, Z.arm] },
      ],
    },
    { id: "sideRod", kind: "link", width: 0.12, thickness: T },
    // 直桿:下端 M 的銷穿過槓桿,上端 P 的銷穿過平行桿與半徑臂
    {
      id: "upright",
      kind: "link",
      width: 0.1,
      thickness: T,
      pieces: [
        { kind: "cylinder", radius: PIN, length: PIN_M.length, at: [0, 0, PIN_M.at] },
        { kind: "cylinder", radius: PIN, length: PIN_P.length, at: [UPRIGHT, 0, PIN_P.at] },
      ],
    },
    // 平行桿:右端 Q 的銷穿過側桿
    { id: "parallelBar", kind: "link", width: 0.1, thickness: T, pieces: [{ kind: "cylinder", radius: PIN, length: PIN_Q.length, at: [PARALLEL, 0, PIN_Q.at] }] },
    { id: "crosshead", kind: "group", pieces: [{ kind: "box", size: [0.32, 0.26, 1.1], at: [0, 0, 0.45] }, { kind: "box", size: [0.1, PISTON_ROD, 0.08], at: [0, -PISTON_ROD / 2, 0] }] },
  ],
  powered: ["piston"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], speed: 0.25 },
  target: "lever", // 被帶動的側槓桿
  view: { direction: [0.03, 0.05, 1] },
  pose(p) {
    const m = motion(p);
    const z = (q, dz) => [q[0], q[1], dz];
    const cyl = cylinderPose(CYL, m.E[1] - PISTON_ROD, m.downward, p);
    // 活塞跟著十字頭走(十字頭偏離直線約 0.001,活塞在缸裡跟著橫移這麼多)
    cyl.parts.piston.position[0] = m.E[0];
    return {
      parts: {
        lever: { angle: m.psi },
        rock: { angle: m.rock },
        sideRod: { from: z(m.S, Z.side), to: z(m.E, Z.side) },
        upright: { from: z(m.M, Z.upright), to: z(m.P, Z.upright) },
        parallelBar: { from: z(m.P, Z.parallel), to: z(m.Q, Z.parallel) },
        crosshead: { position: z(m.E, 0) },
        ...cyl.parts,
      },
      flows: cyl.flows,
      readouts: [],
    };
  },
};
