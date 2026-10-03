// 第 336 種:船舶側槓桿引擎平行運動的另一種配置。與側槓桿相連的側桿所接的平行桿,同時也接在搖臂軸 F 上的
// 短半徑臂上,搖臂軸在固定的軸承內轉動;十字頭因此被導引作直線往復。蒸汽推動汽缸的活塞。
// 主動件是虛擬的「進程」;汽缸內的蒸汽以流體示意。
// 推斷:各桿長依原圖比例;十字頭沿汽缸中心線直線運動(平行運動的作用)。
import { deg } from "./kit.js";
import { sideLever } from "./side-lever.js";
import { cylinderParts, cylinderPose, steamPipe } from "./vertical-engine.js";
import { shape, circle, thickLine } from "./shapes.js";

const X = 1.0;
const ROCK = [-0.55, 2.05, 0]; // 搖臂軸 F
export const motion = sideLever({ A: [-2.0, -2.1, 0], lever: 4.4, rod: 3.75, x: X, C: ROCK, radius: 1.45, drop: 0.55, swing: deg(8), tilt: deg(4) });
const PISTON_ROD = 2.25;
const CYL = { x: X, top: 0.55, length: 1.9, radius: 0.6 };

export default {
  figure: 336,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(thickLine([[-2.6, 1.4], [-1.0, 0.6], [-1.0, -1.2]], 0.3)), thickness: 0.25, at: [0, 0, -0.4] },
        { kind: "box", size: [0.5, 0.3, 0.5], at: [ROCK[0], ROCK[1], -0.3] },
        { kind: "box", size: [5.0, 0.15, 0.6], at: [0, -2.7, -0.3] },
      ],
    },
    { id: "pipe", ...steamPipe(CYL) },
    ...cylinderParts(CYL),
    { id: "lever", kind: "plate", center: [-2.0, -2.1, 0], shape: { ...shape(thickLine([[0, 0], [4.4, 0]], 0.42)), holes: [circle(0.12).reverse()] }, thickness: 0.12, arrow: false, pieces: [{ kind: "cylinder", radius: 0.32, length: 0.25 }] },
    { id: "sideRod", kind: "link", width: 0.1, thickness: 0.06 },
    { id: "radiusArm", kind: "link", width: 0.12, thickness: 0.06, label: "F", labelOffset: [-0.2, 0.3, 0.3] },
    { id: "parallelBar", kind: "link", width: 0.1, thickness: 0.06 },
    { id: "linkEF", kind: "link", width: 0.08, thickness: 0.05 },
    { id: "linkDC", kind: "link", width: 0.08, thickness: 0.05 },
    { id: "crosshead", kind: "group", pieces: [{ kind: "box", size: [0.4, 0.3, 0.3] }, { kind: "box", size: [0.1, PISTON_ROD, 0.08], at: [0, -PISTON_ROD / 2, 0] }] },
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
        radiusArm: { from: z(ROCK, 0.3), to: z(m.F, 0.3) },
        parallelBar: { from: z(m.D, 0.3), to: z(m.E, 0.3) },
        linkEF: { from: z(m.E, 0.36), to: z(m.F, 0.36) },
        linkDC: { from: z(m.D, 0.36), to: z(ROCK, 0.36) },
        crosshead: { position: z(m.E, 0.1) },
        ...cyl.parts,
      },
      flows: cyl.flows,
      readouts: [],
    };
  },
};
