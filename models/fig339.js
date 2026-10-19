// 第 339 種:直動式引擎的平行運動(司各特‧羅素式)。桿 B–C 的 C 端接在活塞桿上,B 端在固定溝槽 D 裡滑動;
// 半徑桿 F–A 的 F 端接在固定樞軸上,A 端接在 B–C 的中點,且 FA = AB = AC,所以 C 精確地走直線。
// 活塞桿頂經連桿接到頂上的曲柄。主動件是虛擬的「進程」(下方汽缸的蒸汽推動);汽缸內的蒸汽以流體示意。
// 推斷:頂上的曲柄與連桿(原圖頂端畫出曲柄軸);進汽的時機。
// 機架照原圖是一整塊鑄件:上方的橢圓孔讓連桿在前面上下(孔只是外形)、下方的拱罩著汽缸,F 在兩者之間的腹板上;
// 左邊伸出一塊托著溝槽 D 的台,台下是內凹的裙邊;頂上有凸起的軸承座,曲柄軸穿在裡面。
// 深度由後往前:機架 → 溝槽 D 與滑塊 B、半徑桿 → BC 桿 → 活塞桿(在汽缸中心線上)→ 連桿與曲柄銷;曲柄臂在連桿後面。
// F 的銷從腹板往前穿過半徑桿;A 的銷穿過半徑桿與 BC 桿;C 的銷穿過 BC 桿、活塞桿與連桿;B 的銷穿過 BC 桿與滑塊。
// C 在 F 上方時,BC 桿、活塞桿與連桿都從 F 的銷前面經過。
import { TAU } from "./kit.js";
import { crankSlider, cylinderParts, cylinderPose, steamPipe } from "./vertical-engine.js";
import { shape, rect, circle, arcPoints } from "./shapes.js";

export const F = [0.55, 0.65, 0]; // 半徑桿的固定樞軸(在活塞桿的直線上方)
const L = 1.0; // FA = AB = AC
const CRANK = [0.55, 3.2, 0];
const R = 0.35;
const ROD = 2.75;
const PISTON_ROD = 1.75;
const CYL = { x: 0.55, top: -0.72, length: 1.2, radius: 0.5, seat: -2.075 };
const FOOT = CYL.seat; // 底座頂面
const SHAFT = 0.18; // 曲柄軸半徑
// 各層的中心 z 與厚度
const Z = { frame: -0.36, slot: -0.21, radius: -0.21, bar: -0.11, rod: 0, link: 0.1, arm: 0 };
const T = 0.06;
const FRAME_T = 0.2;
const SLOT_T = 0.1;

/** 機架鑄件的外形(逆時針):左裙邊與托台、左腳、下方的拱、右腳、右側、頂上的拱 */
function castingOutline() {
  const ellipse = (cx, cy, rx, ry, a0, a1) => arcPoints(1, a0, a1).map(([c, s]) => [cx + rx * c, cy + ry * s]);
  return [
    [-0.2, FOOT],
    ...ellipse(0.55, -0.1, 0.75, 0.5, Math.PI, 0), // 罩著汽缸的拱(往右繞過頂)
    [1.3, FOOT],
    [2.05, FOOT],
    ...ellipse(0.55, 2.0, 1.5, 0.95, 0, Math.PI), // 頂上的拱
    [-0.95, 0.875],
    [-1.95, 0.875],
    [-1.95, 0.425],
    ...ellipse(-1.75, FOOT, 1.05, 2.5, Math.PI / 2, 0), // 托台下內凹的裙邊
  ];
}

/** 進程 p → 曲柄角、曲柄銷、C(活塞桿上)、A(BC 中點)、B(在溝槽裡) */
export function russell(p) {
  const theta = Math.PI / 2 - TAU * p;
  const { pin, y } = crankSlider(CRANK, R, ROD, theta);
  const C = [F[0], y, 0];
  const dy = C[1] - F[1];
  const B = [F[0] - Math.sqrt(4 * L * L - dy * dy), F[1], 0];
  const A = [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2, 0];
  const next = crankSlider(CRANK, R, ROD, theta - 1e-4).y;
  return { theta, pin, C, A, B, downward: next < y };
}

export default {
  figure: 339,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 鑄件:上方的橢圓孔與下方的拱之間是腹板,F 在腹板上
        { kind: "plate", shape: shape(castingOutline(), [circle(1).map(([c, s]) => [0.55 + 0.42 * c, 1.75 + 0.8 * s]).reverse()]), thickness: FRAME_T, at: [0, 0, Z.frame] },
        // 頂上凸起的軸承座(原圖兩段階梯),曲柄軸穿過它的孔
        {
          kind: "plate",
          shape: shape([[0.05, 2.75], [1.05, 2.75], [1.05, 3.05], [0.9, 3.05], [0.9, 3.5], [0.2, 3.5], [0.2, 3.05], [0.05, 3.05]], [circle(SHAFT, CRANK[0], CRANK[1]).reverse()]),
          thickness: FRAME_T,
          at: [0, 0, Z.frame],
        },
        { kind: "cylinder", radius: 0.3, inner: SHAFT, length: 0.3, at: [CRANK[0], CRANK[1], Z.frame] },
        // 固定溝槽 D:貼在托台正面的板
        { kind: "plate", shape: { ...shape(rect(1.3, 0.45, -1.25, F[1])), holes: [rect(1.0, 0.16, -1.25, F[1]).reverse()] }, thickness: SLOT_T, at: [0, 0, Z.slot] },
        // 固定樞軸 F 的銷:從腹板往前穿過半徑桿
        { kind: "cylinder", radius: 0.04, length: Z.radius + T / 2 + 0.01 - Z.frame, at: [F[0], F[1], (Z.radius + T / 2 + 0.01 + Z.frame) / 2] },
        { kind: "box", size: [3.2, 0.15, 0.8], at: [0.55, FOOT - 0.075, 0] },
      ],
    },
    { id: "labelD", kind: "group", center: [-1.9, F[1], 0], label: "D", labelOffset: [-0.25, 0, 0.3] },
    { id: "labelF", kind: "group", center: F, label: "F", labelOffset: [0.3, 0.2, 0.3] },
    { id: "pipe", ...steamPipe(CYL) },
    ...cylinderParts(CYL),
    {
      // 曲柄軸從後面穿過軸承座,臂在連桿後面,曲柄銷往前穿過連桿
      id: "crank",
      kind: "group",
      center: CRANK,
      spin: R + 0.2,
      pieces: [
        { kind: "cylinder", radius: SHAFT, length: Z.arm - (Z.frame - 0.25), at: [0, 0, (Z.arm + Z.frame - 0.25) / 2] },
        { kind: "box", size: [R, 0.14, 0.08], at: [R / 2, 0, Z.arm] },
        { kind: "cylinder", radius: 0.06, length: Z.link + T / 2 + 0.03 - (Z.arm - 0.04), at: [R, 0, (Z.link + T / 2 + 0.03 + Z.arm - 0.04) / 2], accent: true },
      ],
    },
    { id: "rod", kind: "link", width: 0.1, thickness: T },
    {
      // 活塞桿頂 C 的銷:往後穿過 BC 桿、往前穿過連桿
      id: "pistonRod",
      kind: "group",
      label: "C",
      labelOffset: [0.3, -0.1, 0.3],
      pieces: [
        { kind: "box", size: [0.08, PISTON_ROD, 0.08], at: [0, -PISTON_ROD / 2, 0] },
        { kind: "cylinder", radius: 0.04, length: Z.link + T / 2 - (Z.bar - T / 2), at: [0, 0, (Z.link + T / 2 + Z.bar - T / 2) / 2 - Z.rod] },
      ],
    },
    // BC 桿:B 端的銷往後穿進滑塊(連桿自帶的銷頭不畫,各接點的銷另外畫)
    {
      id: "barBC",
      kind: "link",
      width: 0.1,
      thickness: T,
      pins: false,
      pieces: [{ kind: "cylinder", radius: 0.04, length: Z.bar + T / 2 - (Z.slot - SLOT_T / 2), at: [0, 0, (Z.bar + T / 2 + Z.slot - SLOT_T / 2) / 2 - Z.bar] }],
    },
    // 半徑桿:A 端的銷往前穿過 BC 桿
    {
      id: "radiusFA",
      kind: "link",
      width: 0.1,
      thickness: T,
      pins: false,
      label: "A",
      labelOffset: [-0.3, -0.2, 0.3],
      pieces: [{ kind: "cylinder", radius: 0.04, length: Z.bar + T / 2 - (Z.radius - T / 2), at: [0, 0, (Z.bar + T / 2 + Z.radius - T / 2) / 2 - Z.radius] }],
    },
    { id: "sliderB", kind: "box", size: [0.3, 0.14, SLOT_T], label: "B", labelOffset: [0, 0.3, 0.3] },
  ],
  powered: ["piston"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.25 },
  target: "crank", // 輸出的曲柄
  view: { direction: [0.03, 0.05, 1] },
  pose(p) {
    const r = russell(p);
    const cyl = cylinderPose(CYL, r.C[1] - PISTON_ROD, r.downward, p);
    const z = (q, dz) => [q[0], q[1], dz];
    return {
      parts: {
        crank: { angle: r.theta },
        rod: { from: z(r.pin, Z.link), to: z(r.C, Z.link) },
        pistonRod: { position: z(r.C, Z.rod) },
        barBC: { from: z(r.B, Z.bar), to: z(r.C, Z.bar) },
        radiusFA: { from: z(r.A, Z.radius), to: z(F, Z.radius) },
        sliderB: { position: z(r.B, Z.slot) },
        ...cyl.parts,
      },
      flows: cyl.flows,
      readouts: [],
    };
  },
};
