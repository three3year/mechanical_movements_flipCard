// 第 170 種:另一種蒸汽引擎調速器。搖臂不接在心軸的滑塊上,而是彼此交叉,往上延伸過心軸頂部,
// 再以兩根短連桿接到閥桿。球飛開時,交叉的搖臂上端往外張開並下降,經短連桿把閥桿往下拉。主動件是虛擬的「轉速」(平衡型)。
// 心軸由下方左邊的水平軸經一對斜齒輪帶動(原圖畫在底部);主動件是轉速本身,心軸在模型裡不轉。
// 張角對轉速與 governor.js 相同:以 (s / MAX)² 在 RANGE 之間變化,滑桿整段都有反應。
// 原圖球的上方有一道弧形的弓架,中央以方座固定在心軸上(推斷:固定在心軸上的導弓,搖臂從它前面掃過);畫在搖臂後面一層。
import { X, Y, deg, clamp } from "./kit.js";
import { shape, arcPoints } from "./shapes.js";

const PIVOT = [0, 1.35, 0]; // 兩支搖臂交叉處的樞軸
const ARM = 2.0; // 樞軸到球心
const UP = 0.75; // 樞軸往上延伸的長度
const LINK = 0.62;
const MAX = 10;
const RANGE = [deg(24), deg(50)];
const GEAR_Y = -1.45; // 心軸上的斜齒輪
const BOW = { r: 1.5, half: deg(58), z: -0.32 }; // 弓架:以樞軸為圓心的弧,在搖臂後面

/** 轉速 s:張角(搖臂與垂直線的夾角)與閥桿的高度 */
export function governor(s) {
  const alpha = RANGE[0] + (RANGE[1] - RANGE[0]) * clamp(s / MAX, 0, 1) ** 2;
  // 左球的搖臂往右上延伸(交叉);上端在 x = UP·sinα、y = UP·cosα
  const tx = UP * Math.sin(alpha);
  const ty = PIVOT[1] + UP * Math.cos(alpha);
  const rod = ty + Math.sqrt(LINK * LINK - tx * tx);
  return { alpha, tip: [tx, ty, 0], rod };
}

const z = (p, d) => [p[0], p[1], d];

export default {
  figure: 170,
  parts: [
    {
      id: "spindle",
      kind: "group",
      pieces: [
        { kind: "cylinder", axis: Y, radius: 0.07, length: 4.2, at: [0, -0.1, 0] },
        { kind: "gear", teeth: 20, radius: 0.55, cone: deg(45), width: 0.18, axis: [0, -1, 0], at: [0, GEAR_Y, 0] },
        { kind: "cylinder", radius: 0.05, length: 0.4, at: [0, PIVOT[1], 0] }, // 兩支搖臂共用的樞軸銷(橫穿心軸)
        // 弓架:弧在搖臂後面,中央的方座固定在心軸上
        { kind: "plate", shape: shape([...arcPoints(BOW.r + 0.05, -Math.PI / 2 - BOW.half, -Math.PI / 2 + BOW.half), ...arcPoints(BOW.r - 0.05, -Math.PI / 2 + BOW.half, -Math.PI / 2 - BOW.half)]), thickness: 0.1, at: [0, PIVOT[1], BOW.z] },
        { kind: "box", size: [0.3, 0.22, 0.22], at: [0, PIVOT[1] - BOW.r, BOW.z + 0.05] },
      ],
    },
    // 帶動心軸的水平軸與斜齒輪(引擎經它驅動調速器)
    {
      id: "driveShaft",
      kind: "group",
      axis: X,
      center: [-0.55, GEAR_Y - 0.55, 0],
      pieces: [
        { kind: "gear", teeth: 20, radius: 0.55, cone: deg(45), width: 0.18, axis: [0, 0, 1], at: [0, 0, 0] },
        { kind: "cylinder", radius: 0.07, length: 2.0, at: [0, 0, -1.0] },
      ],
    },
    { id: "armL", kind: "link", width: 0.1, thickness: 0.06 },
    { id: "armR", kind: "link", width: 0.1, thickness: 0.06 },
    { id: "ballL", kind: "sphere", radius: 0.42 },
    { id: "ballR", kind: "sphere", radius: 0.42 },
    { id: "linkL", kind: "link", width: 0.08, thickness: 0.05 },
    { id: "linkR", kind: "link", width: 0.08, thickness: 0.05 },
    { id: "rod", kind: "group", pieces: [{ kind: "cylinder", axis: Y, radius: 0.06, length: 1.3, at: [0, 0.6, 0] }, { kind: "cylinder", radius: 0.12, inner: 0.05, length: 0.24 }] },
  ],
  powered: ["ballL", "ballR"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "轉速", mode: "balance", range: [0, MAX], initial: 7 },
  target: "rod",
  view: { direction: [0.04, 0.06, 1] },
  pose(s) {
    const { alpha, tip, rod } = governor(s);
    // 左球:從樞軸往左下;它的搖臂延伸到樞軸右上方的 tip(交叉)
    const ballL = [PIVOT[0] - ARM * Math.sin(alpha), PIVOT[1] - ARM * Math.cos(alpha), 0];
    const ballR = [PIVOT[0] + ARM * Math.sin(alpha), PIVOT[1] - ARM * Math.cos(alpha), 0];
    const tipL = [PIVOT[0] + tip[0], tip[1], 0];
    const tipR = [PIVOT[0] - tip[0], tip[1], 0];
    return {
      parts: {
        armL: { from: z(ballL, 0.08), to: z(tipL, 0.08) },
        armR: { from: z(ballR, -0.08), to: z(tipR, -0.08) },
        ballL: { position: ballL },
        ballR: { position: ballR },
        linkL: { from: z(tipL, 0.15), to: [0, rod, 0.15] },
        linkR: { from: z(tipR, -0.15), to: [0, rod, -0.15] },
        rod: { position: [0, rod, 0] },
      },
      readouts: [],
    };
  },
};
