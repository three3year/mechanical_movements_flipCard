// 第 378 種:由擺的運動驅動、用來鋸倒下的樹木的鋸子。左邊三腳架上吊著一個擺(重錘),擺經一根連桿推拉鋸框;
// 鋸框掛在跨過樹幹的門形架上,來回鋸時慢慢往下,鋸條一點一點切進樹幹。主動件是虛擬的「進程」:擺已擺過的次數
// (鋸切的進度);鋸框隨擺往復,同時逐漸下降。
// 推斷:擺與鋸框的連接方式(連桿的一端在鋸框的長槽裡滑動)、每一次往復切進的深度(示意)。
import { TAU, deg, clamp } from "./kit.js";
import { shape, thickLine } from "./shapes.js";

const PIVOT = [-3.0, 2.2, 0]; // 擺的懸掛點(三腳架頂)
const L = 2.6; // 擺長
const SWING = deg(16);
const STROKES = 12; // 進程一輪裡擺擺過的次數
const LOG = { center: [1.0, -0.95, 0], r: 0.75 };
const SAW_Y0 = LOG.center[1] + LOG.r + 0.08; // 鋸條起始高度(剛碰到樹幹頂)
export const DEPTH = 1.1; // 一輪鋸進的深度

/** 進程 p → 擺角、鋸框的水平位移、鋸條高度 */
export function sawing(p0) {
  const p = clamp(p0, 0, 1);
  const angle = SWING * Math.sin(TAU * STROKES * p);
  const bob = [PIVOT[0] + L * Math.sin(angle), PIVOT[1] - L * Math.cos(angle), 0];
  return { angle, shift: L * Math.sin(angle), saw: SAW_Y0 - DEPTH * p, bob };
}

export default {
  figure: 378,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 三腳架
        { kind: "plate", shape: shape(thickLine([[-3.9, -1.75], [PIVOT[0], PIVOT[1] + 0.1], [-2.1, -1.75]], 0.1)), thickness: 0.1 },
        { kind: "box", size: [0.08, 3.9, 0.08], at: [PIVOT[0], 0.25, -0.5], angle: 0 },
        // 跨過樹幹的門形架
        { kind: "plate", shape: shape(thickLine([[-0.6, -1.75], [-0.6, 1.25], [2.6, 1.25], [2.6, -1.75]], 0.18)), thickness: 0.2, at: [0, 0, -0.7] },
        { kind: "plate", shape: shape(thickLine([[-0.6, -1.75], [-0.6, 1.25], [2.6, 1.25], [2.6, -1.75]], 0.18)), thickness: 0.2, at: [0, 0, 0.7] },
        { kind: "box", size: [7.4, 0.12, 2.0], at: [-0.6, -1.82, 0] },
      ],
    },
    // 倒下的樹幹(沿 z 方向躺著)
    { id: "log", kind: "cylinder", center: LOG.center, radius: LOG.r, length: 2.4, axis: [0, 0, 1] },
    {
      id: "pendulum",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "box", size: [0.06, L, 0.06], at: [0, -L / 2, 0] },
        { kind: "box", size: [0.4, 0.55, 0.3], at: [0, -L, 0] },
        { kind: "cylinder", radius: 0.12, inner: 0.06, length: 0.2 },
      ],
    },
    { id: "rod", kind: "link", width: 0.07, thickness: 0.05, stretch: true }, // 連桿接鋸框的一端在長槽裡滑動,鋸框才能一面往復一面下降
    {
      id: "saw",
      kind: "group",
      arrow: false,
      pieces: [
        // 鋸框:兩根立柱、上橫樑、下面的鋸條
        { kind: "box", size: [2.6, 0.1, 0.1], at: [0, 0.75, 0] },
        { kind: "box", size: [0.1, 0.85, 0.1], at: [-1.25, 0.35, 0] },
        { kind: "box", size: [0.1, 0.85, 0.1], at: [1.25, 0.35, 0] },
        { kind: "plate", shape: shape([[-1.3, 0], [1.3, 0], [1.3, 0.12], ...Array.from({ length: 26 }, (_, i) => [1.3 - i * 0.1, i % 2 ? 0.0 : -0.06]).slice(1), [-1.3, 0.12]].map(([x, y]) => [x, y])), thickness: 0.03 },
      ],
    },
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], speed: 0.04 },
  view: { direction: [0.05, 0.08, 1] },
  pose(p) {
    const s = sawing(((p % 1) + 1) % 1);
    const sawX = LOG.center[0] + s.shift;
    return {
      parts: {
        pendulum: { angle: s.angle },
        saw: { position: [sawX, s.saw, 0] },
        rod: { from: [s.bob[0], s.bob[1] + 0.3, 0.2], to: [sawX - 1.25, s.saw + 0.35, 0.2] },
      },
      readouts: [],
    };
  },
};
