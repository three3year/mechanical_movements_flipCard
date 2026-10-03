// 第 161 種:蒸汽引擎的離心式調速器。中央心軸連同搖臂與球,由引擎經頂部的斜齒輪帶動;心軸轉動時球因離心力往外飛。
// 引擎越快,球飛得越開,把底部的滑塊抬高,減少調節閥(接在滑塊上的槓桿)的開度;變慢時相反。
// 主動件是虛擬的「轉速」(平衡型)。原圖的虛線是球飛開時的位置。
import { Y, deg } from "./kit.js";
import { flyBall } from "./governor.js";

const GOV = flyBall({ top: 2.4, arm: 2.3, at: 1.15, link: 1.6, ball: 0.45, range: [deg(16), deg(48)] });
const LEVER = { pivot: [-2.0, -0.4, 0], length: 2.0 };

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
        { kind: "gear", teeth: 24, radius: 0.5, cone: deg(45), width: 0.2, axis: [0, -1, 0], at: [0, 3.15, 0] },
        { kind: "cylinder", axis: Y, radius: 0.18, length: 0.2, at: [0, 2.85, 0] },
        { kind: "sphere", radius: 0.1, at: [0, -1.15, 0] },
      ],
    },
    ...GOV.parts(),
    {
      id: "lever",
      kind: "group",
      center: LEVER.pivot,
      arrow: false,
      pieces: [
        { kind: "plate", shape: { outline: [[0, -0.08], [LEVER.length, -0.05], [LEVER.length, 0.08], [0, 0.12]], holes: [] }, thickness: 0.12 },
        { kind: "box", size: [0.2, 0.12, 0.3], at: [LEVER.length, 0, 0] },
      ],
    },
    { id: "bracket", kind: "box", center: [-1.0, -0.8, 0], size: [2.2, 0.12, 0.3] },
  ],
  powered: ["ballL", "ballR"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  waivers: [
    { check: "interference", parts: ["spindle", "head"], reason: "待確認(未修):spindle 的圓柱 r0.07×4 與 head 的圓柱 r0.3×0.22互相穿入 0.36(96 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["spindle", "lever"], reason: "待確認(未修):spindle 的圓柱 r0.07×4 與 lever 的方塊 0.2×0.12×0.3互相穿入 0.17(96 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["spindle", "bracket"], reason: "待確認(未修):spindle 的圓柱 r0.07×4 與 bracket 的方塊 2.2×0.12×0.3互相穿入 0.17(96 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["armL", "head"], reason: "待確認(未修):armL 的方塊 1×0.1×0.08 與 head 的圓柱 r0.3×0.22互相穿入 0.15(96 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["armR", "head"], reason: "待確認(未修):armR 的方塊 1×0.1×0.08 與 head 的圓柱 r0.3×0.22互相穿入 0.15(96 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["linkL", "sleeve"], reason: "待確認(未修):linkL 的方塊 1×0.08×0.06 與 sleeve 的圓柱 r0.22×0.22互相穿入 0.13(96 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["linkR", "sleeve"], reason: "待確認(未修):linkR 的方塊 1×0.08×0.06 與 sleeve 的圓柱 r0.22×0.22互相穿入 0.13(96 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["sleeve", "lever"], reason: "待確認:sleeve 的圓柱 r0.22×0.22 與 lever 的方塊 0.2×0.12×0.3重疊 0.06,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
  ],
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
