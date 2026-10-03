// 第 330 種:活塞桿被延長,在一個與汽缸中心成一直線的導引件 A 中作動。連桿的下部做成叉形,
// 讓活塞桿的上部能從叉的中間穿過;連桿上端接頂上的曲柄。主動件是虛擬的「進程」(汽缸的蒸汽推動);
// 汽缸內的蒸汽以流體示意。
// 推斷:進汽的時機;各部尺寸依原圖。
import { TAU } from "./kit.js";
import { crankSlider, cylinderParts, cylinderPose, steamPipe } from "./vertical-engine.js";
import { shape, circle, thickLine } from "./shapes.js";

const CRANK = [0, 2.65, 0];
const R = 0.42;
const ROD = 2.9; // 曲柄銷到十字頭(叉的下端)
const PISTON_ROD = 1.25; // 十字頭到活塞
const CYL = { x: 0, top: -0.85, length: 1.35, radius: 0.42 };

/** 進程 p → 曲柄角、曲柄銷、十字頭高度、活塞高度 */
export function engine(p) {
  const theta = Math.PI / 2 - TAU * p;
  const { pin, y } = crankSlider(CRANK, R, ROD, theta);
  const next = crankSlider(CRANK, R, ROD, theta - 1e-4).y;
  return { theta, pin, head: y, piston: y - PISTON_ROD, downward: next < y };
}

export default {
  figure: 330,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 立柱與頂上的軸承;導引件 A 從立柱伸出,與汽缸中心成一直線
        { kind: "box", size: [0.3, 5.6, 0.3], at: [1.1, 0.3, -0.3] },
        { kind: "box", size: [1.6, 0.25, 0.4], at: [0.55, CRANK[1], -0.3] },
        { kind: "box", size: [1.1, 0.14, 0.2], at: [0.55, 1.15, 0] },
        { kind: "cylinder", axis: [0, 1, 0], radius: 0.13, inner: 0.07, length: 0.35, at: [0, 1.15, 0] },
        { kind: "box", size: [2.4, 0.18, 0.8], at: [0, -2.7, 0] },
      ],
    },
    { id: "labelA", kind: "group", center: [0, 1.15, 0], label: "A", labelOffset: [0.35, 0.2, 0.3] },
    { id: "pipe", ...steamPipe(CYL) },
    ...cylinderParts(CYL),
    {
      id: "crank",
      kind: "group",
      center: CRANK,
      spin: R + 0.2,
      pieces: [
        { kind: "plate", shape: shape([[0, -0.15], [R, -0.1], [R, 0.1], [0, 0.15]], [circle(0.06).reverse()]), thickness: 0.1, at: [0, 0, 0.25] },
        { kind: "cylinder", radius: 0.06, length: 0.35, at: [R, 0, 0.3], accent: true },
        { kind: "cylinder", radius: 0.12, length: 0.9 },
      ],
    },
    // 叉形連桿(局部 +x 由曲柄銷指向十字頭):上半一根,下半分成兩股夾著活塞桿
    {
      id: "conrod",
      kind: "plate",
      shape: shape(thickLine([[0, 0], [ROD * 0.55, 0]], 0.13)),
      thickness: 0.06,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[ROD * 0.55, 0], [ROD * 0.7, 0.22], [ROD, 0.22]], 0.09)), thickness: 0.06 },
        { kind: "plate", shape: shape(thickLine([[ROD * 0.55, 0], [ROD * 0.7, -0.22], [ROD, -0.22]], 0.09)), thickness: 0.06 },
      ],
    },
    { id: "pistonRod", kind: "group", pieces: [{ kind: "box", size: [0.08, PISTON_ROD + 1.95, 0.08], at: [0, (1.95 - PISTON_ROD) / 2, 0] }, { kind: "box", size: [0.5, 0.12, 0.14], at: [0, 0, 0.12] }] },
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.25 },
  view: { direction: [0.03, 0.05, 1] },
  pose(p) {
    const e = engine(p);
    const cyl = cylinderPose(CYL, e.piston, e.downward, p);
    return {
      parts: {
        crank: { angle: e.theta },
        conrod: { position: [e.pin[0], e.pin[1], 0.32], angle: Math.atan2(e.head - e.pin[1], -e.pin[0]) },
        pistonRod: { position: [0, e.head, 0] },
        ...cyl.parts,
      },
      flows: cyl.flows,
      readouts: [],
    };
  },
};
