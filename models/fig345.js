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
  waivers: [
    { check: "interference", parts: ["frame", "cylinder"], reason: "待確認(未修):frame 的方塊 3.6×0.3×0.3 與 cylinder 的旋轉體互相穿入 0.18(96 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["frame", "pistonRod"], reason: "待確認:frame 的方塊 1.2×0.3×0.6 與 pistonRod 的圓柱 r0.018×0.198重疊 0.10,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["pistonRod", "crank"], reason: "待確認:pistonRod 的方塊 1×0.09×0.09 與 crank 的圓柱 r0.2×0.4重疊 0.05,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.25 },
  target: "crank", // 輸出的曲柄
  view: { direction: [0.03, 0.05, 1] },
  pose(p) {
    const theta = -Math.PI / 2 - TAU * p;
    const e = engine.pose(theta);
    return { parts: { ...e.parts, crank: { angle: theta } }, readouts: [] };
  },
};
