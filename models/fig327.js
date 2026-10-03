// 第 327 種:與第 326 種的差別是十字頭上以滾子取代滑塊,滾子抵著固定在框架上的直線導桿 A、A 運行(法國的小型引擎)。
// 下方汽缸的蒸汽推動活塞,活塞桿帶十字頭在兩根導桿之間上下,經連桿轉動頂上的飛輪。
// 主動件是虛擬的「進程」(蒸汽推動);汽缸內的蒸汽以填色與流動的點表示。
// 推斷:進汽的時機(活塞往哪邊走,就由哪一側進汽);各部尺寸依原圖。
import { TAU, deg } from "./kit.js";
import { crankSlider, cylinderParts, cylinderPose, steamPipe } from "./vertical-engine.js";
import { shape, circle, arcPoints } from "./shapes.js";

const CRANK = [0, 2.5, 0];
const R = 0.5;
const ROD = 2.3;
const PISTON_ROD = 2.0;
const CYL = { x: 0, top: -1.1, length: 1.5, radius: 0.42 };
const GUIDE_X = 0.95;

/** 進程 p → 飛輪角、十字頭高度、活塞高度、活塞是否往下走 */
export function engine(p) {
  const theta = Math.PI / 2 - TAU * p;
  const { pin, y } = crankSlider(CRANK, R, ROD, theta);
  const next = crankSlider(CRANK, R, ROD, theta - 1e-4).y;
  return { theta, pin, head: y, piston: y - PISTON_ROD, downward: next < y };
}

export default {
  figure: 327,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [3.2, 0.2, 0.3], at: [0, 1.7, -0.2] },
        { kind: "box", size: [0.2, 4.6, 0.3], at: [-1.45, -0.6, -0.2] },
        { kind: "box", size: [0.2, 4.6, 0.3], at: [1.45, -0.6, -0.2] },
        // 直線導桿 A、A
        { kind: "box", size: [0.12, 2.6, 0.12], at: [-GUIDE_X, -0.05, 0.1] },
        { kind: "box", size: [0.12, 2.6, 0.12], at: [GUIDE_X, -0.05, 0.1] },
        { kind: "box", size: [3.0, 0.18, 0.8], at: [0, -2.95, 0] },
      ],
    },
    { id: "labelA1", kind: "group", center: [-GUIDE_X, -1.1, 0.2], label: "A", labelOffset: [-0.3, 0, 0] },
    { id: "labelA2", kind: "group", center: [GUIDE_X, -1.1, 0.2], label: "A", labelOffset: [0.3, 0, 0] },
    { id: "pipe", ...steamPipe(CYL) },
    ...cylinderParts(CYL),
    {
      id: "flywheel",
      kind: "group",
      center: CRANK,
      spin: 2.8,
      pieces: [
        { kind: "plate", shape: shape([...arcPoints(2.95, 0, TAU).slice(0, -1)], [arcPoints(2.75, 0, TAU).slice(0, -1).reverse()]), thickness: 0.2, at: [0, 0, -0.8] },
        ...[0, 1, 2, 3].map((i) => ({ kind: "box", size: [5.5, 0.14, 0.1], at: [0, 0, -0.8], angle: deg(20) + (i * Math.PI) / 4 })),
        { kind: "cylinder", radius: 0.2, length: 1.2, at: [0, 0, -0.3] },
        { kind: "plate", shape: shape([[0, -0.15], [R, -0.1], [R, 0.1], [0, 0.15]], [circle(0.06).reverse()]), thickness: 0.1, at: [0, 0, 0.2] },
        { kind: "cylinder", radius: 0.07, length: 0.3, at: [R, 0, 0.28], accent: true },
      ],
    },
    { id: "rod", kind: "link", width: 0.14, thickness: 0.08 },
    {
      id: "crosshead",
      kind: "group",
      pieces: [
        { kind: "box", size: [1.7, 0.16, 0.14], at: [0, 0, 0.1] },
        { kind: "cylinder", radius: 0.16, length: 0.14, at: [-GUIDE_X + 0.24, 0, 0.1] },
        { kind: "cylinder", radius: 0.16, length: 0.14, at: [GUIDE_X - 0.24, 0, 0.1] },
        { kind: "box", size: [0.08, PISTON_ROD, 0.08], at: [0, -PISTON_ROD / 2, 0] },
      ],
    },
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.25 },
  target: "flywheel", // 輸出的飛輪
  view: { direction: [0.03, 0.05, 1] },
  pose(p) {
    const e = engine(p);
    const cyl = cylinderPose(CYL, e.piston, e.downward, p);
    return {
      parts: { flywheel: { angle: e.theta }, rod: { from: [e.pin[0], e.pin[1], 0.38], to: [0, e.head, 0.38] }, crosshead: { position: [0, e.head, 0] }, ...cyl.parts },
      flows: cyl.flows,
      readouts: [],
    };
  },
};
