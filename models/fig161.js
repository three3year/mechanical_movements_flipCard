// 第 161 種:蒸汽引擎的離心式調速器。中央心軸連同搖臂與球,由引擎經頂部的斜齒輪帶動;心軸轉動時球因離心力往外飛。
// 引擎越快,球飛得越開,把底部的滑塊抬高,減少調節閥(接在滑塊上的槓桿)的開度;變慢時相反。
// 主動件是虛擬的「轉速」(平衡型)。原圖的虛線是球飛開時的位置。
// 頂部正對著讀者的斜齒輪是引擎帶動的那一個(軸朝前伸);主動件是轉速本身,心軸在模型裡不轉。
import { Z, Y, deg } from "./kit.js";
import { flyBall } from "./governor.js";

const GOV = flyBall({ top: 2.4, arm: 2.3, at: 1.15, link: 1.6, ball: 0.45, range: [deg(16), deg(48)] });
const LEVER = { pivot: [-2.0, -0.46, 0], length: 2.0 };

/** 轉速 s:張角與滑塊的高度 */
export function governor(s) {
  const alpha = GOV.angleAt(s);
  return { alpha, sleeve: GOV.geometry(alpha).sleeve };
}
const REST = governor(0).sleeve;

export default {
  figure: 161,
  parts: [
    {
      id: "spindle",
      kind: "group",
      pieces: [
        { kind: "cylinder", axis: Y, radius: 0.07, length: 4.0, at: [0, 0.9, 0] },
        { kind: "gear", teeth: 20, radius: 0.55, cone: deg(45), width: 0.18, axis: [0, 1, 0], at: [0, 3.15, 0] },
        { kind: "cylinder", axis: Y, radius: 0.18, length: 0.2, at: [0, 2.85, 0] },
        { kind: "sphere", radius: 0.1, at: [0, -1.15, 0] },
      ],
    },
    ...GOV.parts(),
    // 引擎經這根朝前的軸與斜齒輪帶動心軸
    {
      id: "driveShaft",
      kind: "group",
      axis: Z,
      center: [0, 3.65, 0.5],
      pieces: [
        { kind: "gear", teeth: 20, radius: 0.55, cone: deg(45), width: 0.18, axis: [0, 0, -1], at: [0, 0, 0] },
        { kind: "cylinder", radius: 0.07, length: 1.2, at: [0, 0, 0.6] },
      ],
    },
    {
      id: "lever",
      kind: "group",
      center: LEVER.pivot,
      arrow: false,
      pieces: [
        { kind: "plate", shape: { outline: [[0, -0.08], [LEVER.length - 0.1, -0.05], [LEVER.length - 0.1, 0.08], [0, 0.12]], holes: [] }, thickness: 0.12 },
        // 叉形的端頭:兩支叉齒夾著心軸、托在套筒的下面
        { kind: "box", size: [0.2, 0.06, 0.08], at: [LEVER.length, 0.06, 0.14] },
        { kind: "box", size: [0.2, 0.06, 0.08], at: [LEVER.length, 0.06, -0.14] },
      ],
    },
    { id: "bracket", kind: "group", pieces: [{ kind: "box", size: [2.0, 0.12, 0.3], at: [-1.1, -0.8, 0] }, { kind: "box", size: [0.12, 0.26, 0.3], at: [-2.0, -0.67, 0] }] }, // 支架不碰心軸,立柱托著槓桿的樞軸
  ],
  powered: ["ballL", "ballR"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "轉速", mode: "balance", range: [0, 10], initial: 8.8 },
  target: "lever",
  view: { direction: [0.04, 0.06, 1] },
  pose(s) {
    const { alpha, sleeve } = governor(s);
    const rise = sleeve - REST;
    return {
      parts: { ...GOV.pose(alpha), lever: { angle: Math.asin(Math.min(1, rise / LEVER.length)) } },
      readouts: [],
    };
  },
};
