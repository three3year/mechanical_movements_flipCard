// 第 336 種:船舶側槓桿引擎平行運動的另一種配置。與側槓桿相連的側桿所接的平行桿,同時也接在搖臂軸 F 上的
// 短半徑臂上,搖臂軸在固定的軸承內轉動;十字頭因此被導引作直線往復。蒸汽推動汽缸的活塞。
// 主動件是虛擬的「進程」;汽缸內的蒸汽以流體示意。
// 結構(依原圖):側槓桿繞左下的 A 擺動;右端經側桿(畫在汽缸前面)接活塞桿頂的十字頭 E;槓桿中段 M 經一根直桿
// 往上接 P,P 同時接搖臂軸 F 的短半徑臂與平行桿 P–E。所有桿都是剛性的,十字頭的直線是這組連桿造成的(近似直線)。
// 推斷:桿長與接點依原圖量取(原圖 1 像素 = 0.0125);搖臂軸的位置與半徑臂長(0.7)是在原圖位置附近選的,
// 讓十字頭偏離直線最小(全行程約 0.013,原圖的位置 0.03);搖臂軸的軸承座、槓桿樞軸的支座、汽缸的座是推斷。
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
const M0 = px(175, 345); // 直桿下端(槓桿中段)
const E0 = px(325, 100); // 十字頭
const P0 = px(170, 65); // 半徑臂端、平行桿左端
export const F = [-0.02, 1.79, 0]; // 搖臂軸
const LEVER = d(A, S0);
const LEVER_M = d(A, M0);
const M_ANGLE = angleOf(A, M0) - angleOf(A, S0);
const SIDE = d(S0, E0);
const PARALLEL = d(P0, E0);
const UPRIGHT = d(P0, M0);
export const ARM = d(F, P0);
const TILT = angleOf(A, S0);
const SWING = deg(8);
const X = E0[0];
const PISTON_ROD = 2.3;
const CYL = { x: X, top: 0.4, length: 2.4, radius: 0.7 };
const BASE = -3.2; // 底座頂面

/** 兩個解裡離原圖位置 near 最近的那一個 */
const nearest = (a, b, near) => (d(a, near) < d(b, near) ? a : b);

/** 進程 p → 槓桿角與各接點:A、S、M、P、E(十字頭)、搖臂角 */
export function motion(p) {
  const at = (q) => {
    const psi = TILT + SWING * Math.sin(2 * Math.PI * q);
    const S = [A[0] + LEVER * Math.cos(psi), A[1] + LEVER * Math.sin(psi), 0];
    const M = [A[0] + LEVER_M * Math.cos(psi + M_ANGLE), A[1] + LEVER_M * Math.sin(psi + M_ANGLE), 0];
    const P = nearest(circleCircle(F, ARM, M, UPRIGHT, 1).point, circleCircle(F, ARM, M, UPRIGHT, -1).point, P0);
    const E = nearest(circleCircle(P, PARALLEL, S, SIDE, 1).point, circleCircle(P, PARALLEL, S, SIDE, -1).point, E0);
    return { psi, S, M, P, E };
  };
  const now = at(p);
  return { ...now, rock: angleOf(F, now.P), downward: at(p + 1e-4).E[1] < now.E[1] };
}

export default {
  figure: 336,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(thickLine([[-2.6, 1.4], [-1.0, 0.6], [-1.0, -1.2]], 0.3)), thickness: 0.25, at: [0, 0, -0.4] },
        { kind: "box", size: [5.4, 0.15, 1.6], at: [0.1, BASE - 0.075, 0.2] },
        // 汽缸的座
        { kind: "box", size: [1.4, CYL.top - CYL.length - 0.12 - BASE, 0.9], at: [X, (CYL.top - CYL.length - 0.12 + BASE) / 2, 0] },
        // 搖臂軸 F 的軸承座、側槓桿樞軸 A 的支座
        ...pedestal({ at: [F[0], F[1]], z: -0.25, bore: 0.1, floor: BASE }),
        ...pedestal({ at: [A[0], A[1]], z: 0.62, bore: 0.11, floor: BASE, depth: 0.25 }),
      ],
    },
    { id: "pipe", ...steamPipe(CYL) },
    ...cylinderParts(CYL),
    {
      id: "lever",
      kind: "plate",
      center: [A[0], A[1], 0.95], // 側槓桿與側桿在汽缸的前面
      shape: { ...shape(thickLine([[0, 0], [LEVER, 0]], 0.36)), holes: [circle(0.11).reverse()] },
      thickness: 0.12,
      arrow: false,
      pieces: [{ kind: "cylinder", radius: 0.26, length: 0.22 }, { kind: "cylinder", radius: 0.1, length: 0.5, at: [0, 0, -0.25] }],
    },
    {
      // 搖臂軸 F 與它的短半徑臂
      id: "rock",
      kind: "group",
      center: F,
      arrow: false,
      label: "F",
      labelOffset: [0.1, 0.35, 0.3],
      pieces: [
        { kind: "cylinder", radius: 0.09, length: 0.6, at: [0, 0, -0.1] },
        { kind: "plate", shape: shape(thickLine([[0, 0], [ARM, 0]], 0.16)), thickness: 0.06, at: [0, 0, 0.2] },
      ],
    },
    { id: "sideRod", kind: "link", width: 0.12, thickness: 0.06 },
    { id: "upright", kind: "link", width: 0.1, thickness: 0.06 },
    { id: "parallelBar", kind: "link", width: 0.1, thickness: 0.06 },
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
    // 活塞跟著十字頭走(十字頭偏離直線約 0.013,活塞在缸裡跟著橫移這麼多)
    cyl.parts.piston.position[0] = m.E[0];
    return {
      parts: {
        lever: { angle: m.psi },
        rock: { angle: m.rock },
        sideRod: { from: z(m.S, 0.95), to: z(m.E, 0.95) },
        upright: { from: z(m.M, 0.85), to: z(m.P, 0.85) },
        parallelBar: { from: z(m.P, 0.3), to: z(m.E, 0.3) },
        crosshead: { position: z(m.E, 0) },
        ...cyl.parts,
      },
      flows: cyl.flows,
      readouts: [],
    };
  },
};
