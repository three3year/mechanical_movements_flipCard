// 第 332 種:船舶側槓桿引擎活塞桿的平行運動。F、C 是半徑桿,E 是十字頭,與平行桿 E–D 相連。
// 主動件是虛擬的「進程」(蒸汽推活塞);汽缸內的蒸汽以流體示意。
// 結構(依原圖):側槓桿繞左下的 A 擺動;右端 S 經側桿(畫在汽缸前面)直直往上接活塞桿頂的十字頭 E;
// 槓桿中段 M 的銷接一根直桿往上,直桿上有接頭 C、頂端是 D;半徑桿從 C 接到固定樞軸 F,F 架在從汽缸蓋升起的
// 弧形托架上(原圖 C 旁的虛線弧是 C 繞 F 的軌跡);平行桿 D–E 把直桿頂端接到十字頭。所有桿都是剛性的:
// 槓桿 A–M 與半徑桿 F–C 兩臂反向,構成瓦特連桿;直桿 M–D 與平行桿 D–E、側桿 S–E、槓桿 M–S 近乎平行四邊形,
// 把直桿上的直線點放大到 E。十字頭的近似直線是這組連桿造成的(全行程偏離約 0.007,不是指定的)。
// 桿長與接點照原圖量取(525 像素的原圖,1 像素 = 0.0125),原圖的位置已經是最直的配置,沒有另外調。
// 推斷:A 的支座、底座、汽缸的座、托架落在汽缸蓋上的底板(原圖只畫托架的側面)。
// 汽缸照原圖的大小;側槓桿擺到最低時右端仍在底座之上,底座比原本(票 04)低 0.475。
// 深度(z,前 = 大):槓桿 1.35;直桿與側桿 1.2(兩者不交叉);半徑桿與平行桿 1.1;托架 0.98;十字頭在汽缸軸線
// (z 0)上,往前伸出一根軸到側桿那一層,側桿與平行桿套在這根軸上(實機兩側各有一組側槓桿,原圖只畫前面這組)。
// (原本的模型把左邊的直桿讀成固定的立柱、C 當成固定樞軸、F 當成會動的點,十字頭直接指定沿直線走;已照原圖重排,
// 共用的 side-lever.js 只有這張用,一併拿掉。)
import { deg } from "./kit.js";
import { circleCircle, angleOf } from "./linkage.js";
import { cylinderParts, cylinderPose, steamPipe } from "./vertical-engine.js";
import { shape, thickLine } from "./shapes.js";
import { pedestal } from "./supports.js";

const K = 0.0125;
const px = (x, y) => [(x - 104) * K - 1.85, (429 - y) * K - 2.0, 0];
const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const A = px(104, 429); // 側槓桿樞軸
const S0 = px(389, 430.5); // 槓桿右端(側桿下端)
const M0 = px(228, 427); // 槓桿中段(直桿下端)
const D0 = px(232, 66); // 直桿頂端
const E0 = px(392.5, 65); // 十字頭
export const F = px(495, 154.5); // 半徑桿的固定樞軸
const LEVER = d(A, S0);
const LEVER_M = d(A, M0);
const M_ANGLE = angleOf(A, M0) - angleOf(A, S0);
const TILT = angleOf(A, S0);
const UPRIGHT = d(M0, D0); // 直桿 M–D
const MC = d(M0, px(231, 154)); // 直桿上 M 到 C(C 取在直桿上,高度照原圖)
const C0 = [M0[0] + ((D0[0] - M0[0]) * MC) / UPRIGHT, M0[1] + ((D0[1] - M0[1]) * MC) / UPRIGHT, 0];
const RADIUS = d(F, C0); // 半徑桿
const PARALLEL = d(D0, E0); // 平行桿
const SIDE = d(S0, E0); // 側桿
const SWING = deg(9);
const X = E0[0]; // 汽缸中心線
const FLOOR = -3.0; // 底座頂面
// 汽缸(原圖:缸蓋頂在 y 228 像素、缸底 380 像素、外徑約 170 像素)
const CYL = { x: X, top: 0.39, length: 1.66, radius: 0.93, seat: FLOOR };
const COVER = CYL.top + 0.12; // 汽缸蓋頂面
const PISTON_ROD = E0[1] - (CYL.top - CYL.length / 2); // 十字頭在原圖位置時活塞在缸的正中
const Z = { lever: 1.35, upright: 1.2, bar: 1.1, bracket: 0.98 };

/** 兩個解裡離原圖位置 near 最近的那一個 */
const nearest = (c1, r1, c2, r2, near) => {
  const [a, b] = [circleCircle(c1, r1, c2, r2, 1).point, circleCircle(c1, r1, c2, r2, -1).point];
  return d(a, near) < d(b, near) ? a : b;
};

/** 進程 p → 槓桿角與各接點:S(槓桿右端)、M(槓桿中段)、C、D(直桿)、E(十字頭) */
export function motion(p) {
  const at = (q) => {
    const psi = TILT + SWING * Math.sin(2 * Math.PI * q);
    const S = [A[0] + LEVER * Math.cos(psi), A[1] + LEVER * Math.sin(psi), 0];
    const M = [A[0] + LEVER_M * Math.cos(psi + M_ANGLE), A[1] + LEVER_M * Math.sin(psi + M_ANGLE), 0];
    const C = nearest(F, RADIUS, M, MC, C0);
    const D = [M[0] + ((C[0] - M[0]) * UPRIGHT) / MC, M[1] + ((C[1] - M[1]) * UPRIGHT) / MC, 0];
    const E = nearest(D, PARALLEL, S, SIDE, E0);
    return { psi, S, M, C, D, E };
  };
  const now = at(p);
  return { ...now, downward: at(p + 1e-4).E[1] < now.E[1] };
}

// 側槓桿(局部座標:A 在原點,+x 指向 S):原圖的槓桿在 A 處粗、往右漸細,左邊伸出原圖之外
const M_LOCAL = [LEVER_M * Math.cos(M_ANGLE), LEVER_M * Math.sin(M_ANGLE)];
// 銷從槓桿正面(露出銷頭,原圖槓桿上的小圓)往後穿過直桿(側桿)那一層
const LEVER_PIN = [Z.upright - 0.04, Z.lever + 0.1];
const leverPin = ([x, y]) => ({ kind: "cylinder", radius: 0.045, length: LEVER_PIN[1] - LEVER_PIN[0], at: [x, y, (LEVER_PIN[0] + LEVER_PIN[1]) / 2 - Z.lever] });

// F 的托架:從汽缸蓋升起、往右上彎到 F(原圖的弧形托架,側面);底下的底板沿 z 貼著汽缸蓋頂面(推斷)
const KNEE_X = [2.3, 2.8];
const kneeTop = F[1] + 0.16;
const knee = [
  [KNEE_X[0], COVER + 0.04],
  [KNEE_X[1], COVER + 0.04],
  [F[0] + 0.1, COVER + 0.4],
  [F[0] + 0.1, kneeTop],
  ...Array.from({ length: 9 }, (_, i) => {
    const t = (Math.PI / 2) * (1 - i / 8);
    return [F[0] - 0.1 - (F[0] - 0.1 - KNEE_X[0]) * Math.cos(t), COVER + 0.04 + (kneeTop - COVER - 0.04) * Math.sin(t)];
  }),
];

const eye = (x) => ({ kind: "cylinder", radius: 0.09, length: 0.06, at: [x, 0, 0] });
// 銷從直桿往後穿過半徑桿(平行桿)那一層
const uprightPin = (x) => ({ kind: "cylinder", radius: 0.045, length: Z.upright - Z.bar + 0.06, at: [x, 0, (Z.upright + Z.bar) / 2 - 0.02 - Z.upright] });

export default {
  figure: 332,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [6.8, 0.15, 2.8], at: [0.25, FLOOR - 0.075, 0.2] }, // 底座(推斷)
        ...pedestal({ at: [A[0], A[1]], z: 1.09, bore: 0.23, floor: FLOOR, depth: 0.25 }), // 側槓桿樞軸 A 的支座(推斷)
      ],
    },
    { id: "pipe", ...steamPipe(CYL) },
    ...cylinderParts(CYL),
    {
      id: "bracket",
      kind: "group",
      center: [0, 0, 0],
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(knee), thickness: 0.12, at: [0, 0, Z.bracket] },
        { kind: "box", size: [KNEE_X[1] - KNEE_X[0], 0.08, Z.bracket + 0.06 + 0.3], at: [(KNEE_X[0] + KNEE_X[1]) / 2, COVER + 0.04, (Z.bracket + 0.06 - 0.3) / 2] },
        { kind: "cylinder", radius: 0.05, length: 0.2, at: [F[0], F[1], Z.bar - 0.05] }, // F 的樞銷
      ],
    },
    {
      id: "lever",
      kind: "plate",
      center: [A[0], A[1], Z.lever],
      shape: shape([[-1.1, -0.48], [0, -0.53], [LEVER, -0.27], [LEVER, 0.27], [0, 0.53], [-1.1, 0.48]]),
      thickness: 0.12,
      arrow: false,
      label: "A",
      labelOffset: [0.15, 0.75, 0.3],
      pieces: [
        { kind: "cylinder", radius: 0.55, length: 0.2 }, // A 處的轂
        { kind: "cylinder", radius: 0.22, length: 0.57, at: [0, 0, -0.165] }, // 樞軸(原圖斜線剖面的軸),往後穿過支座
        { kind: "cylinder", radius: 0.32, length: 0.16, at: [LEVER, 0, 0] }, // 右端的轂
        leverPin(M_LOCAL),
        leverPin([LEVER, 0]),
      ],
    },
    {
      // 從槓桿中段往上的直桿:局部 +x 由 M 指向 D,原點在 C
      id: "upright",
      kind: "group",
      arrow: false,
      label: "C",
      labelOffset: [-0.35, 0, 0.3],
      pieces: [
        { kind: "plate", shape: shape(thickLine([[-MC, 0], [UPRIGHT - MC, 0]], 0.12)), thickness: 0.06 },
        eye(-MC),
        eye(0),
        eye(UPRIGHT - MC),
        uprightPin(0),
        uprightPin(UPRIGHT - MC),
      ],
    },
    { id: "sideRod", kind: "link", width: 0.12, thickness: 0.06 },
    { id: "radiusBar", kind: "link", width: 0.1, thickness: 0.06, label: "F", labelOffset: [0.35, 0.15, 0.3] },
    { id: "parallelBar", kind: "link", width: 0.1, thickness: 0.06, label: "D", labelOffset: [-0.35, 0.1, 0.3] },
    {
      id: "crosshead",
      kind: "group",
      label: "E",
      labelOffset: [0.4, 0.2, 0.3],
      pieces: [
        { kind: "box", size: [0.4, 0.5, 0.4], at: [0, 0.1, 0] },
        { kind: "box", size: [0.1, PISTON_ROD, 0.08], at: [0, -PISTON_ROD / 2, 0] }, // 活塞桿
        { kind: "cylinder", radius: 0.06, length: Z.upright + 0.06 - 0.2, at: [0, 0, (Z.upright + 0.06 + 0.2) / 2] }, // 往前伸到側桿那一層的軸
      ],
    },
  ],
  powered: ["piston"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], speed: 0.25 },
  target: "lever", // 被帶動的側槓桿
  view: { direction: [0.03, 0.05, 1] },
  pose(p) {
    const m = motion(p);
    const z = (q, dz) => [q[0], q[1], dz];
    const cyl = cylinderPose(CYL, m.E[1] - PISTON_ROD, m.downward, p);
    // 活塞跟著十字頭走(十字頭偏離直線約 0.007,活塞在缸裡跟著橫移這麼多)
    cyl.parts.piston.position[0] = m.E[0];
    return {
      parts: {
        lever: { angle: m.psi },
        upright: { position: z(m.C, Z.upright), angle: angleOf(m.M, m.D) },
        sideRod: { from: z(m.S, Z.upright), to: z(m.E, Z.upright) },
        radiusBar: { from: z(F, Z.bar), to: z(m.C, Z.bar) },
        parallelBar: { from: z(m.D, Z.bar), to: z(m.E, Z.bar) },
        crosshead: { position: z(m.E, 0) },
        ...cyl.parts,
      },
      flows: cyl.flows,
      readouts: [],
    };
  },
};
