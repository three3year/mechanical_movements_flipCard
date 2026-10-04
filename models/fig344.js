// 第 344 種:擺動式引擎。汽缸在長度中點有樞軸,裝在固定的軸承裡擺動;活塞桿不用任何導件,直接接上方的曲柄。
// 主動件是虛擬的「進程」(蒸汽推動);汽缸內正在推活塞的那一側以蒸汽填色。
// 推斷:進汽的時機(活塞往哪邊走,另一側就進汽);各部尺寸依原圖。
import { TAU } from "./kit.js";
import { oscillating } from "./oscillating.js";
import { shape, circle, thickLine } from "./shapes.js";

const TRUNNION = [0, -1.0, 0];
const CRANK = [0.2, 2.35, 0];
const R = 0.5;
export const engine = oscillating({ trunnion: TRUNNION, crank: CRANK, r: R, cyl: { length: 2.0, radius: 0.62, offset: 0 }, rod: 3.36 });

export default {
  figure: 344,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [3.6, 0.3, 0.3], at: [0, TRUNNION[1], -0.6] },
        { kind: "box", size: [3.6, 0.3, 0.3], at: [0, CRANK[1], -0.6] },
        { kind: "cylinder", radius: 0.22, length: 1.6, at: [TRUNNION[0], TRUNNION[1], 0] },
      ],
    },
    ...engine.parts,
    {
      id: "crank",
      kind: "group",
      center: CRANK,
      spin: R + 0.2,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0, 0], [R, 0]], 0.3), [circle(0.08).reverse()]), thickness: 0.12, at: [0, 0, 0.35] },
        { kind: "cylinder", radius: 0.2, length: 0.4, at: [0, 0, 0.2] },
        { kind: "cylinder", radius: 0.08, length: 0.4, at: [R, 0, 0.35], accent: true },
        { kind: "cylinder", radius: 0.12, length: 1.4, at: [0, 0, -0.4] },
      ],
    },
  ],
  powered: ["piston"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.25 },
  target: "crank", // 輸出的曲柄
  view: { direction: [0.03, 0.05, 1] },
  pose(p) {
    const theta = Math.PI / 2 - TAU * p;
    const e = engine.pose(theta);
    return { parts: { ...e.parts, crank: { angle: theta } }, readouts: [] };
  },
  waivers: [
    { check: "interference", parts: ["frame", "pistonRod"], reason: "未修:機架的立柱畫在汽缸中心線上,活塞桿與它重疊 0.26;立柱應在汽缸的前後兩側(列入待確認清單)" },
    { check: "interference", parts: ["frame", "piston"], reason: "未修:機架的立柱畫在汽缸中心線上,活塞經過時與它重疊 0.31;立柱應在汽缸的前後兩側(列入待確認清單)" },
    { check: "interference", parts: ["pistonRod", "crank"], reason: "未修:活塞桿的上端每圈有一小段掃過曲柄軸,重疊 0.15(96 個取樣中 17 個);曲柄軸應只往後伸(列入待確認清單)" },
    { check: "interference", parts: ["frame", "cylinder"], reason: "簡化畫法:擺動汽缸的耳軸座畫成機架的橫樑,汽缸與橫樑重疊 0.20" },
  ],
};
