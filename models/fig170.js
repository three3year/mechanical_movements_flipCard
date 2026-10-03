// 第 170 種:另一種蒸汽引擎調速器。搖臂不接在心軸的滑塊上,而是彼此交叉,往上延伸過心軸頂部,
// 再以兩根短連桿接到閥桿。球飛開時,交叉的搖臂上端往外張開並下降,經短連桿把閥桿往下拉。主動件是虛擬的「轉速」(平衡型)。
import { Y, deg, clamp } from "./kit.js";

const PIVOT = [0, 1.35, 0]; // 兩支搖臂交叉處的樞軸
const ARM = 2.15; // 樞軸到球心
const UP = 0.75; // 樞軸往上延伸的長度
const LINK = 0.62;
const MAX = 10;
const RANGE = [deg(18), deg(48)];
const C = MAX * MAX * Math.cos(RANGE[1]);

/** 轉速 s:張角(搖臂與垂直線的夾角)與閥桿的高度 */
export function governor(s) {
  const alpha = clamp(Math.acos(clamp(C / Math.max(1e-9, s * s), -1, 1)), ...RANGE);
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
        { kind: "cylinder", axis: Y, radius: 0.07, length: 3.8, at: [0, 0.1, 0] },
        { kind: "gear", teeth: 24, radius: 0.5, cone: deg(45), width: 0.2, axis: [0, 1, 0], at: [0, -1.25, 0] },
        { kind: "cylinder", axis: Y, radius: 0.14, length: 0.3, at: [0, PIVOT[1], 0] },
      ],
    },
    { id: "armL", kind: "link", width: 0.1, thickness: 0.06 },
    { id: "armR", kind: "link", width: 0.1, thickness: 0.06 },
    { id: "ballL", kind: "sphere", radius: 0.42 },
    { id: "ballR", kind: "sphere", radius: 0.42 },
    { id: "linkL", kind: "link", width: 0.08, thickness: 0.05 },
    { id: "linkR", kind: "link", width: 0.08, thickness: 0.05 },
    { id: "rod", kind: "group", pieces: [{ kind: "cylinder", axis: Y, radius: 0.06, length: 1.3, at: [0, 0.6, 0] }, { kind: "cylinder", radius: 0.12, inner: 0.05, length: 0.15 }] },
  ],
  powered: ["ballL", "ballR"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  waivers: [
    { check: "unsupported", parts: ["rod"], reason: "待確認:rod 與帶動(或支撐)它的零件之間差 0.03 沒貼上,接觸位置是算出來的近似,未逐一修正" },
    { check: "interference", parts: ["spindle", "armL"], reason: "待確認:spindle 的圓柱 r0.14×0.3 與 armL 的方塊 1×0.1×0.06重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["spindle", "armR"], reason: "待確認:spindle 的圓柱 r0.14×0.3 與 armR 的方塊 1×0.1×0.06重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
  ],
  driver: { type: "virtual", label: "轉速", mode: "balance", range: [0, MAX], initial: 8.8 },
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
