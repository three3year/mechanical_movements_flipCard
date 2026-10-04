// 第 331 種:曲柄運動與第 93、279 種相同的引擎:曲柄手腕軸承 B 在開槽十字頭 A 裡作動,十字頭在引擎框架兩根立柱的
// 導件 D、D 之間上下,下面接活塞桿 C。主動件是虛擬的「進程」(下方汽缸的蒸汽推動);汽缸內的蒸汽以流體示意。
// 推斷:進汽的時機;後方的大輪是飛輪(依原圖)。
import { TAU } from "./kit.js";
import { cylinderParts, cylinderPose, steamPipe } from "./vertical-engine.js";
import { shape, circle, rect, arcPoints } from "./shapes.js";

const CRANK = [0, 0.9, 0];
const R = 0.5;
const PISTON_ROD = 2.6; // 十字頭中心到活塞
const CYL = { x: 0, top: -1.0, length: 1.45, radius: 0.42 };

/** 進程 p → 曲柄角、手腕位置、十字頭高度(開槽十字頭:高度 = 手腕高度) */
export function yoke(p) {
  const theta = Math.PI / 2 - TAU * p;
  const wrist = [CRANK[0] + R * Math.cos(theta), CRANK[1] + R * Math.sin(theta), 0];
  const nextY = CRANK[1] + R * Math.sin(theta - 1e-4);
  return { theta, wrist, head: wrist[1], piston: wrist[1] - PISTON_ROD, downward: nextY < wrist[1] };
}

export default {
  figure: 331,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 兩根立柱(內側是導件 D、D)與頂上的橫樑
        { kind: "box", size: [0.3, 5.0, 0.35], at: [-1.15, -0.3, 0] },
        { kind: "box", size: [0.3, 5.0, 0.35], at: [1.15, -0.3, 0] },
        { kind: "plate", shape: shape([[-1.5, 2.2], [1.5, 2.2], [1.3, 2.75], [0.5, 3.0], [-0.5, 3.0], [-1.3, 2.75]]), thickness: 0.35 },
        { kind: "box", size: [3.2, 0.18, 0.9], at: [0, -2.85, 0] },
        { kind: "plate", shape: shape([...arcPoints(3.2, 0, TAU).slice(0, -1)], [arcPoints(2.95, 0, TAU).slice(0, -1).reverse()]), thickness: 0.15, at: [0, CRANK[1], -0.7] },
      ],
    },
    { id: "labelD1", kind: "group", center: [-1.15, -1.9, 0.2], label: "D", labelOffset: [-0.35, 0, 0] },
    { id: "labelD2", kind: "group", center: [1.15, -1.9, 0.2], label: "D", labelOffset: [0.35, 0, 0] },
    { id: "pipe", ...steamPipe(CYL) },
    ...cylinderParts(CYL),
    {
      id: "crank",
      kind: "group",
      center: CRANK,
      spin: R + 0.25,
      label: "B",
      labelOffset: [0.25, 0.45, 0.5],
      pieces: [
        { kind: "cylinder", radius: 0.16, length: 1.15, at: [0, 0, -0.625] },
        { kind: "plate", shape: shape([[0, -0.15], [R, -0.1], [R, 0.1], [0, 0.15]], [circle(0.06).reverse()]), thickness: 0.08, at: [0, 0, -0.2] },
        { kind: "cylinder", radius: 0.2, length: 0.35, at: [R, 0, 0.05], accent: true },
      ],
    },
    {
      id: "yokeA",
      kind: "group",
      label: "A",
      labelOffset: [0, 0.55, 0.4],
      pieces: [
        // 開槽十字頭:長板中間一道橫槽,兩端滑塊夾在導件之間
        { kind: "plate", shape: shape(rect(2.0, 0.85), [rect(2 * R + 0.5, 0.44).reverse()]), thickness: 0.14, at: [0, 0, 0.05] },
        { kind: "box", size: [0.12, 0.85, 0.3], at: [-0.94, 0, 0] },
        { kind: "box", size: [0.12, 0.85, 0.3], at: [0.94, 0, 0] },
        { kind: "box", size: [0.1, PISTON_ROD - 0.4, 0.1], at: [0, -(PISTON_ROD - 0.4) / 2 - 0.42, 0] },
      ],
    },
    { id: "labelC", kind: "group", center: [0, -0.9, 0.2], label: "C", labelOffset: [0.3, 0, 0] },
  ],
  powered: ["piston"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.25 },
  target: "crank", // 輸出的曲柄
  view: { direction: [0.03, 0.05, 1] },
  pose(p) {
    const y = yoke(p);
    const cyl = cylinderPose(CYL, y.piston, y.downward, p);
    return { parts: { crank: { angle: y.theta }, yokeA: { position: [0, y.head, 0] }, ...cyl.parts }, flows: cyl.flows, readouts: [] };
  },
  waivers: [
    { check: "interference", parts: ["frame", "pipe"], reason: "蒸汽管貼著機架的立柱走:管與立柱在圖上重疊 0.05(管應在立柱的前面一點)" },
  ],
};
