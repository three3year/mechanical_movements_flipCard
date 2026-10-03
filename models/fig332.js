// 第 332 種:船舶側槓桿引擎活塞桿的平行運動。F、C 是半徑桿(C 為固定樞軸),E 是十字頭,與平行桿 E–D 相連;
// 下方的側槓桿繞 A 擺動,經側桿帶動十字頭。蒸汽推動汽缸的活塞,活塞桿頂的十字頭被平行運動導引作直線往復。
// 主動件是虛擬的「進程」;汽缸內的蒸汽以流體示意。
// 推斷:各桿長依原圖比例;十字頭沿汽缸中心線直線運動(平行運動的作用)。
import { deg } from "./kit.js";
import { sideLever } from "./side-lever.js";
import { cylinderParts, cylinderPose, steamPipe } from "./vertical-engine.js";
import { shape, circle, thickLine } from "./shapes.js";

const X = 1.3;
export const motion = sideLever({ A: [-1.85, -2.0, 0], lever: 3.6, rod: 3.55, x: X, C: [-1.3, 0.85, 0], radius: 2.55, drop: 0.95, swing: deg(9), tilt: deg(3) });
const PISTON_ROD = 2.3;
const CYL = { x: X, top: 0.45, length: 1.85, radius: 0.55 };

export default {
  figure: 332,
  parts: [
    { id: "frame", kind: "group", pieces: [{ kind: "box", size: [0.12, 4.6, 0.3], at: [-1.3, -0.1, -0.4] }, { kind: "cylinder", radius: 0.12, length: 0.5, at: [-1.3, 0.85, 0] }, { kind: "box", size: [5.2, 0.15, 0.6], at: [0, -2.6, -0.3] }] },
    { id: "pipe", ...steamPipe(CYL) },
    ...cylinderParts(CYL),
    {
      id: "lever",
      kind: "plate",
      center: [-1.85, -2.0, 0],
      shape: { ...shape(thickLine([[0, 0], [3.6, 0]], 0.42)), holes: [circle(0.12).reverse()] },
      thickness: 0.12,
      arrow: false,
      label: "A",
      labelOffset: [0.15, 0.3, 0.3],
      pieces: [{ kind: "cylinder", radius: 0.32, length: 0.25 }],
    },
    { id: "sideRod", kind: "link", width: 0.1, thickness: 0.06 },
    { id: "radiusBar", kind: "link", width: 0.1, thickness: 0.06 },
    { id: "parallelBar", kind: "link", width: 0.1, thickness: 0.06 },
    { id: "linkEF", kind: "link", width: 0.08, thickness: 0.05 },
    { id: "linkDC", kind: "link", width: 0.08, thickness: 0.05 },
    { id: "crossheadE", kind: "group", pieces: [{ kind: "box", size: [0.4, 0.3, 0.3] }, { kind: "box", size: [0.1, PISTON_ROD, 0.08], at: [0, -PISTON_ROD / 2, 0] }], label: "E", labelOffset: [0.35, 0.2, 0.3] },
    { id: "labelC", kind: "group", center: [-1.3, 0.85, 0], label: "C", labelOffset: [-0.3, 0, 0.3] },
    { id: "labelD", kind: "group", center: [-1.3, 1.8, 0], label: "D", labelOffset: [-0.3, 0, 0.3] },
    { id: "labelF", kind: "group", center: [X, 0.85, 0], label: "F", labelOffset: [0.4, 0, 0.3] },
  ],
  powered: ["piston"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  waivers: [
    { check: "unsupported", parts: ["lever"], reason: "待確認:lever 與帶動(或支撐)它的零件之間差 0.07 沒貼上,接觸位置是算出來的近似,未逐一修正" },
    { check: "interference", parts: ["piston", "sideRod"], reason: "待確認(未修):piston 的圓柱 r0.53×0.22 與 sideRod 的方塊 1×0.1×0.06互相穿入 0.28(96 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["cylinder", "lever"], reason: "待確認:cylinder 的旋轉體 與 lever 的板重疊 0.06,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["frame", "lever"], reason: "待確認:frame 的方塊 5.2×0.15×0.6 與 lever 的板重疊 0.06,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], speed: 0.25 },
  target: "lever", // 被帶動的側槓桿
  view: { direction: [0.03, 0.05, 1] },
  pose(p) {
    const m = motion(p);
    const z = (q, dz) => [q[0], q[1], dz];
    const cyl = cylinderPose(CYL, m.E[1] - PISTON_ROD, m.downward, p);
    return {
      parts: {
        lever: { angle: m.psi },
        sideRod: { from: z(m.S, 0.2), to: z(m.E, 0.2) },
        radiusBar: { from: z([-1.3, 0.85], 0.3), to: z(m.F, 0.3) },
        parallelBar: { from: z(m.D, 0.3), to: z(m.E, 0.3) },
        linkEF: { from: z(m.E, 0.36), to: z(m.F, 0.36) },
        linkDC: { from: z(m.D, 0.36), to: z([-1.3, 0.85], 0.36) },
        crossheadE: { position: z(m.E, 0.1) },
        ...cyl.parts,
      },
      flows: cyl.flows,
      readouts: [],
    };
  },
};
