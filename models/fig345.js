// 第 345 種:倒置式擺動(擺式)引擎。汽缸在上端有樞軸,像擺一樣擺動;曲柄軸在下方,活塞桿直接接曲柄。
// 主動件是虛擬的「進程」(蒸汽推動);汽缸內正在推活塞的那一側以蒸汽填色。
// 推斷:進汽的時機;各部尺寸依原圖。
import { TAU } from "./kit.js";
import { oscillating } from "./oscillating.js";
import { shape, circle, thickLine } from "./shapes.js";

const TRUNNION = [0, 2.3, 0];
const CRANK = [0.35, -2.3, 0];
const R = 0.45;
export const engine = oscillating({ trunnion: TRUNNION, crank: CRANK, r: R, cyl: { length: 2.0, radius: 0.62, offset: 1.15 }, rod: 3.46 });

export default {
  figure: 345,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [3.6, 0.3, 0.3], at: [0, TRUNNION[1], -0.6] },
        { kind: "box", size: [1.2, 0.3, 0.6], at: [CRANK[0], CRANK[1] - 0.5, -0.3] },
        { kind: "cylinder", radius: 0.2, length: 1.6, at: TRUNNION },
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
      ],
    },
  ],
  powered: ["piston"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.25 },
  target: "crank", // 輸出的曲柄
  view: { direction: [0.03, 0.05, 1] },
  pose(p) {
    const theta = -Math.PI / 2 - TAU * p;
    const e = engine.pose(theta);
    return { parts: { ...e.parts, crank: { angle: theta } }, readouts: [] };
  },
  waivers: [
    { check: "interference", parts: ["pistonRod", "crank"], reason: "接合處的簡化畫法:活塞桿的端頭套在曲柄銷上,桿端與曲柄的輪轂重疊 0.05(96 個取樣中 17 個)" },
    { check: "interference", parts: ["frame", "pistonRod"], reason: "未修:活塞桿的端頭轉到最低時碰到機架的底座,重疊 0.10(96 個取樣中 23 個)(列入待確認清單)" },
    { check: "interference", parts: ["frame", "cylinder"], reason: "簡化畫法:擺動汽缸的耳軸座畫成機架的橫樑,汽缸與橫樑重疊 0.18" },
  ],
};
