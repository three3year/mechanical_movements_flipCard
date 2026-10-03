// 第 357 種:陀螺儀調速器(Alban Anderson,1858 年專利)。重輪 A 的軸分成兩段 B、B¹,以萬向接頭相連:A 在 B 上,
// 小齒輪 I 在 B¹ 上。B 在中點以鉸接接頭裝在旋轉框架 H 上,所以 A 的傾角一變,B 的外端就升降。框架 H 由引擎經斜齒輪
// 帶動,小齒輪 I 繞著靜止的齒環 G 走,使 A 繞自己的軸快速旋轉。運轉時 A 傾向轉成垂直,彈簧 L 抵抗這個傾向;
// 轉得越快,越能克服彈簧,B 的外端被抬得越高,經桿 C、D 拉動閥桿;彈簧 L 經槓桿 N 與桿 P 接在閥桿上。
// 主動件是虛擬的「轉速」(平衡型)。
// 推斷:傾角與轉速的對應(示意,不模擬角動量);框架 H 與輪 A 的旋轉不畫(平衡型主動件只決定姿勢)。
import { Y, deg, clamp } from "./kit.js";
import { shape, thickLine, arcPoints } from "./shapes.js";

const HINGE = [0, 0.2, 0]; // B 的中點鉸接
const HALF = 1.15; // 鉸接到 B 外端
const WHEEL_AT = 0.55; // 鉸接到輪 A
export const RANGE = [0, 10];
const TILT = [deg(-35), deg(20)]; // B 的傾角(外端在左)
const D = [0, 2.75, 0]; // 閥桿頂
const ROD_C = 1.6;

/** 轉速 s → B 的傾角、外端位置、閥桿(D)的高度 */
export function governor(s0) {
  const s = clamp(s0, ...RANGE);
  const psi = TILT[0] + (TILT[1] - TILT[0]) * (s / RANGE[1]) ** 2;
  // B 的外端在鉸接的左側:往左下(psi 小)到往左上(psi 大)
  const end = [HINGE[0] - HALF * Math.cos(psi), HINGE[1] - HALF * Math.sin(psi) * -1, 0];
  const valve = end[1] + Math.sqrt(ROD_C * ROD_C - (D[0] - end[0]) ** 2);
  return { psi, end, valve };
}

const frameH = [
  // 旋轉框架 H:下方一圈弧形,左右兩端是靜止的齒環 G 的位置
  { kind: "plate", shape: shape([...arcPoints(2.05, deg(195), deg(345)), ...arcPoints(1.85, deg(345), deg(195))]), thickness: 0.18, at: [0, 0.6, 0] },
  { kind: "box", size: [0.25, 0.9, 0.25], at: [0, -1.75, 0] },
];

export default {
  figure: 357,
  parts: [
    {
      id: "base",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(thickLine([[-2.2, -0.2], [-2.0, 1.6], [-0.8, 2.6], [0.8, 2.6], [2.0, 1.6], [2.2, -0.2]], 0.16)), thickness: 0.18, at: [0, 0, -0.5] },
        { kind: "box", size: [1.6, 0.6, 0.6], at: [0, -2.45, -0.2] },
        { kind: "gear", teeth: 16, radius: 0.35, cone: deg(45), width: 0.18, axis: [1, 0, 0], at: [0.55, -2.2, 0.2] },
        // 靜止的齒環 G(左右兩段)
        { kind: "box", size: [0.5, 0.18, 0.35], at: [-1.85, 0.05, 0] },
        { kind: "box", size: [0.5, 0.18, 0.35], at: [1.85, 0.05, 0] },
      ],
    },
    { id: "frameH", kind: "group", label: "H", labelOffset: [1.3, -0.6, 0.3], pieces: frameH, arrow: false },
    { id: "labelG1", kind: "group", center: [-1.85, 0.05, 0], label: "G", labelOffset: [-0.1, -0.35, 0.3] },
    { id: "labelG2", kind: "group", center: [1.85, 0.05, 0], label: "G", labelOffset: [0.1, -0.35, 0.3] },
    {
      id: "shaftB",
      kind: "group",
      center: HINGE,
      arrow: false,
      label: "B",
      labelOffset: [-0.6, 0.5, 0.4],
      pieces: [
        { kind: "plate", shape: shape(thickLine([[-HALF, 0], [WHEEL_AT + 0.6, 0]], 0.14)), thickness: 0.12 },
        // 重輪 A(剖面:看到輪緣與輪轂)
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.85, inner: 0.65, length: 0.32, at: [WHEEL_AT, 0, 0] },
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.25, length: 0.4, at: [WHEEL_AT, 0, 0] },
        { kind: "cylinder", radius: 0.12, length: 0.4 },
      ],
    },
    { id: "labelA", kind: "group", center: [0.6, 0.9, 0], label: "A", labelOffset: [0, 0.15, 0.6] },
    { id: "rodC", kind: "link", width: 0.08, thickness: 0.05, label: "C", labelOffset: [0.3, 0.2, 0.2] },
    { id: "valveD", kind: "group", label: "D", labelOffset: [0.3, 0.3, 0.2], pieces: [{ kind: "cylinder", axis: Y, radius: 0.06, length: 1.0, at: [0, 0.5, 0] }, { kind: "sphere", radius: 0.1 }] },
    { id: "springL", kind: "spring", coils: 7, radius: 0.12, wire: 0.025, label: "L", labelOffset: [-0.3, 0.3, 0.2] },
    { id: "leverN", kind: "link", width: 0.08, thickness: 0.05, stretch: true, label: "N", labelOffset: [0, 0.3, 0.2] }, // 右端以長槽套在閥桿上
    { id: "labelP", kind: "group", center: [-0.6, 3.0, 0], label: "P", labelOffset: [0, 0.2, 0.2] },
  ],
  powered: ["shaftB"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "轉速", mode: "balance", range: RANGE, initial: 5 },
  target: "valveD", // 被拉動的閥桿
  view: { direction: [0.03, 0.05, 1] },
  pose(s) {
    const g = governor(s);
    const anchor = [-2.4, 1.6, 0.1];
    const pivotN = [-1.3, 2.9, 0.1];
    const nEnd = [D[0], g.valve + 0.35, 0.1];
    const dir = [nEnd[0] - pivotN[0], nEnd[1] - pivotN[1]];
    const len = Math.hypot(dir[0], dir[1]);
    const tail = [pivotN[0] - (0.7 * dir[0]) / len, pivotN[1] - (0.7 * dir[1]) / len, 0.1]; // 槓桿 N 的左端接彈簧
    return {
      parts: {
        shaftB: { angle: -g.psi },
        rodC: { from: [g.end[0], g.end[1], 0.15], to: [D[0], g.valve, 0.15] },
        valveD: { position: [D[0], g.valve, 0.15] },
        leverN: { from: tail, to: nEnd },
        springL: { from: anchor, to: tail },
      },
      readouts: [],
    };
  },
};
