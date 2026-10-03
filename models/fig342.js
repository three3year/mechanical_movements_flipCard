// 第 342 種:以大氣壓力運作的舊式單動式樑式抽水引擎(紐科門式)。活塞桿與樑端的扇形段(弓頭)之間以鏈條相連,
// 汽缸頂部開放。低壓蒸汽從活塞下方進入,樑另一端抽水桿的重量幫忙把活塞抬起;接著噴水把蒸汽冷凝,活塞下方
// 成為真空,大氣壓力把活塞推下,把抽水桿拉起。主動件是虛擬的「進程」;蒸汽與噴水以流體示意。
// 推斷:一輪中抬起與推下所佔的時間;鏈條繞在弓頭上,活塞桿頂走鉛直線(鏈條始終從弓頭最左的切點垂下)。
import { Y, deg, smooth, clamp } from "./kit.js";
import { stream } from "./flow.js";
import { backHalf } from "./section.js";
import { shape, thickLine, arcPoints, circle } from "./shapes.js";

const PIVOT = [2.4, 1.25, 0]; // 樑的樞軸(在畫面右邊)
const ARCH = 3.2; // 弓頭半徑
const SWING = deg(13);
const CYL = { x: PIVOT[0] - ARCH, top: -1.35, length: 1.8, radius: 0.55 };
const ROD = 3.15; // 鏈條下端到活塞
const ANCHOR = deg(160); // 鏈條上端固定在弓頭上的角度

/** 進程 p → 樑角(正值為左端往下)、活塞桿頂高度、活塞高度、目前的階段 */
export function atmospheric(p) {
  const f = ((p % 1) + 1) % 1;
  // 0–0.55:蒸汽進入、配重把活塞抬起;0.55–0.65:噴水冷凝;0.65–1:大氣壓力把活塞推下
  let lift;
  if (f < 0.55) lift = smooth(f / 0.55);
  else if (f < 0.65) lift = 1;
  else lift = 1 - smooth((f - 0.65) / 0.35);
  const psi = SWING - 2 * SWING * lift; // 正值:弓頭(左端)往下
  const top = PIVOT[1] - 0.3 - (ARCH + 0.12) * psi; // 鏈條垂下的長度 = 弓頭放出的弧長
  const phase = f < 0.55 ? "steam" : f < 0.65 ? "condense" : "down";
  return { psi, top, piston: top - ROD, phase };
}
export const geometry = { ARCH };

// 樑:從樞軸往左到弓頭,弓頭是以樞軸為圓心的一段弧(鏈條貼在上面)
const beam = [
  { kind: "plate", shape: shape(thickLine([[1.6, 0.25], [0, 0], [-ARCH + 0.3, 0.1]], 0.55), [circle(0.18).reverse()]), thickness: 0.18 },
  { kind: "plate", shape: shape([...arcPoints(ARCH + 0.1, deg(160), deg(196)), ...arcPoints(ARCH - 0.25, deg(196), deg(160))]), thickness: 0.22 },
  { kind: "plate", shape: shape(thickLine([[-ARCH + 0.4, 0.15], [-1.3, 1.25], [0.2, 0.3]], 0.12)), thickness: 0.1 },
  { kind: "cylinder", radius: 0.3, length: 0.5 },
];

export default {
  figure: 342,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [6.0, 0.35, 0.6], at: [-0.4, 0.1 + 0.6, -0.6] },
        { kind: "box", size: [1.0, 2.6, 0.8], at: [PIVOT[0] + 0.4, -0.2, -0.6] },
        { kind: "box", size: [1.8, 0.2, 1.2], at: [CYL.x, CYL.top - CYL.length - 0.15, 0] },
      ],
    },
    {
      id: "cylinder",
      kind: "lathe",
      axis: Y,
      center: [CYL.x, CYL.top - CYL.length, 0],
      profile: [[CYL.radius, CYL.length], [CYL.radius + 0.12, CYL.length], [CYL.radius + 0.12, -0.12], [0, -0.12], [0, 0], [CYL.radius, 0]],
      ...backHalf(Y),
    },
    { id: "steam", kind: "fill", fluid: "steam", shape: "cylinder", size: [2 * CYL.radius - 0.04, CYL.length, 0], level: 0 },
    { id: "piston", kind: "cylinder", axis: Y, radius: CYL.radius - 0.02, length: 0.2 },
    { id: "pistonRod", kind: "box", size: [0.1, ROD, 0.1] },
    { id: "beam", kind: "group", center: PIVOT, arrow: false, pieces: beam },
    { id: "chain", kind: "chain", style: "plate", pitch: 0.24, width: 0.16, offset: 0.06 },
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], speed: 0.15 },
  view: { direction: [0.03, 0.05, 1] },
  pose(p) {
    const a = atmospheric(p);
    const bottom = CYL.top - CYL.length;
    // 鏈條:從活塞桿頂垂直往上到弓頭的切點,再沿弓頭往上繞一段
    const x = PIVOT[0] - ARCH;
    // 鏈條上端固定在弓頭的頂端(隨樑轉),從那裡沿弓頭繞到最左的切點,再垂直往下到活塞桿頂
    const anchor = ANCHOR + a.psi;
    const wrapped = Array.from({ length: 9 }, (_, i) => {
      const t = anchor + ((Math.PI - anchor) * i) / 8;
      return [PIVOT[0] + (ARCH + 0.12) * Math.cos(t), PIVOT[1] + (ARCH + 0.12) * Math.sin(t), 0.15];
    });
    const flows = [];
    if (a.phase === "steam") flows.push({ fluid: "steam", points: stream([[x + 1.5, bottom - 0.6, 0.2], [x + 1.5, bottom + 0.15, 0.2], [x, bottom + 0.15, 0.2]], p * 10, { spacing: 0.2 }) });
    if (a.phase === "condense") flows.push({ fluid: "water", points: stream([[x - 1.4, bottom + 0.3, 0.2], [x - 0.6, bottom + 0.3, 0.2], [x, bottom + 0.6, 0.2]], p * 30, { spacing: 0.12 }) });
    return {
      parts: {
        beam: { angle: a.psi },
        piston: { position: [x, a.piston, 0] },
        pistonRod: { position: [x, a.piston + ROD / 2, 0] },
        steam: { position: [x, bottom + CYL.length / 2, 0], level: a.phase === "down" ? 0 : clamp((a.piston - 0.1 - bottom) / CYL.length, 0, 1) },
      },
      paths: { chain: { points: [...wrapped, [x - 0.12, a.top, 0.15]], closed: false, phase: 0 } },
      flows,
      readouts: [],
    };
  },
};
