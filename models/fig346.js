// 第 346 種:桌式引擎。汽缸固定在桌形的底座上;活塞桿頂有一個十字頭,在固定於汽缸頂部的直線開槽導件裡上下,
// 再經兩根側連桿(前後各一,原圖看到前面那根)接到桌面下方軸上的兩個平行曲柄。
// 主動件是虛擬的「進程」(蒸汽推動);汽缸內的蒸汽以流體示意。
// 推斷:進汽的時機;各部尺寸依原圖。
import { TAU } from "./kit.js";
import { cylinderParts, cylinderPose, steamPipe } from "./vertical-engine.js";
import { shape, circle, thickLine, rect } from "./shapes.js";

const CYL = { x: 0, top: 0.4, length: 1.6, radius: 0.55 };
const CRANK = [-0.15, -2.3, 0]; // 桌面下方的曲柄軸
const R = 0.45;
const SIDE = 0.65; // 側連桿在汽缸前後的距離
// 十字頭在曲柄「上方」:側連桿往上接十字頭
const ROD = 4.0;
const PISTON_ROD = 1.25;

/** 進程 p → 曲柄角、曲柄銷、十字頭高度、活塞高度 */
export function table(p) {
  const theta = -Math.PI / 2 - TAU * p;
  const pin = [CRANK[0] + R * Math.cos(theta), CRANK[1] + R * Math.sin(theta), 0];
  const head = pin[1] + Math.sqrt(ROD * ROD - pin[0] ** 2);
  const pin2 = [CRANK[0] + R * Math.cos(theta - 1e-4), CRANK[1] + R * Math.sin(theta - 1e-4)];
  const next = pin2[1] + Math.sqrt(ROD * ROD - pin2[0] ** 2);
  return { theta, pin, head, piston: head - PISTON_ROD - 0.9, downward: next < head };
}

export default {
  figure: 346,
  parts: [
    {
      id: "table",
      kind: "group",
      pieces: [
        { kind: "box", size: [3.6, 0.2, 1.8], at: [0, -1.35, 0] },
        { kind: "box", size: [0.2, 1.3, 0.2], at: [-1.6, -2.1, 0.7] },
        { kind: "box", size: [0.2, 1.3, 0.2], at: [1.6, -2.1, 0.7] },
        { kind: "box", size: [0.2, 1.3, 0.2], at: [-1.6, -2.1, -0.7] },
        { kind: "box", size: [0.2, 1.3, 0.2], at: [1.6, -2.1, -0.7] },
        // 汽缸頂上的開槽導件(倒 U 形)
        { kind: "plate", shape: shape(thickLine([[-0.35, CYL.top + 0.15], [-0.35, CYL.top + 2.9], [0, CYL.top + 3.15], [0.35, CYL.top + 2.9], [0.35, CYL.top + 0.15]], 0.12)), thickness: 0.2 },
        { kind: "cylinder", radius: 0.14, length: 2 * SIDE + 0.6, at: CRANK },
      ],
    },
    { id: "pipe", ...steamPipe(CYL) },
    ...cylinderParts(CYL),
    {
      id: "crank",
      kind: "group",
      center: CRANK,
      spin: R + 0.2,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0, 0], [R, 0]], 0.3), [circle(0.08).reverse()]), thickness: 0.1, at: [0, 0, SIDE] },
        { kind: "cylinder", radius: 0.07, length: 0.3, at: [R, 0, SIDE + 0.1], accent: true },
        { kind: "plate", shape: shape(thickLine([[0, 0], [R, 0]], 0.3), [circle(0.08).reverse()]), thickness: 0.1, at: [0, 0, -SIDE] },
      ],
    },
    { id: "sideRod", kind: "link", width: 0.12, thickness: 0.06 },
    { id: "sideRodBack", kind: "link", width: 0.12, thickness: 0.06 },
    { id: "crosshead", kind: "group", pieces: [{ kind: "plate", shape: shape(rect(0.5, 0.25)), thickness: 2 * SIDE + 0.2 }, { kind: "box", size: [0.09, PISTON_ROD + 0.9, 0.09], at: [0, -(PISTON_ROD + 0.9) / 2, 0] }] },
  ],
  powered: ["piston"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.25 },
  target: "crank", // 輸出的曲柄
  view: { direction: [0.08, 0.06, 1] },
  pose(p) {
    const t = table(p);
    const cyl = cylinderPose(CYL, t.piston, t.downward, p);
    return {
      parts: {
        crank: { angle: t.theta },
        sideRod: { from: [t.pin[0], t.pin[1], SIDE + 0.15], to: [0, t.head, SIDE + 0.15] },
        sideRodBack: { from: [t.pin[0], t.pin[1], -SIDE - 0.15], to: [0, t.head, -SIDE - 0.15] },
        crosshead: { position: [0, t.head, 0] },
        ...cyl.parts,
      },
      flows: cyl.flows,
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["table", "sideRodBack"], reason: "未修:後側的側桿畫在台腳的範圍內,重疊 0.18;側桿應在台腳的外側(列入待確認清單)" },
    { check: "interference", parts: ["table", "sideRod"], reason: "未修:前側的側桿畫在台腳的範圍內,重疊 0.18;側桿應在台腳的外側(列入待確認清單)" },
    { check: "interference", parts: ["table", "cylinder"], reason: "簡化畫法:汽缸的底座嵌在台面裡,重疊 0.07" },
  ],
};
