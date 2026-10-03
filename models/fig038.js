// 第 38 種:一部分旋轉中保持均勻速度、另一部分中變速。照原圖:兩輪形狀相同(右輪轉了半圈),
// 大部分是節圓半徑 R 的齒圈(兩輪等速),其餘是一段大半徑 RL 與一段小半徑 RS 的扇形齒(RL + RS = 2R),
// 與齒圈的交界是徑向的階。主動輪的大扇形對上從動輪的小扇形時從動輪轉得快(RL/RS 倍),
// 小扇形對上大扇形時轉得慢(RS/RL 倍)。兩段扇形齒數相同、張角與半徑成反比,所以轉完一圈兩輪仍同步。
import { TAU } from "./kit.js";
import { circle } from "./shapes.js";

const R = 1.2;
const RL = 1.5 * R;
const RS = 2 * R - RL;
const SECTOR_TEETH = 4;
const RING_TEETH = 20;
const PITCH = TAU / (RING_TEETH / R + SECTOR_TEETH / RL + SECTOR_TEETH / RS);
const M = PITCH / Math.PI; // 模數:齒冠 M、齒根 1.2M
const LARGE = (SECTOR_TEETH * PITCH) / RL; // 大扇形的張角
const SMALL = (SECTOR_TEETH * PITCH) / RS; // 小扇形的張角

// 輪的局部角(逆時針):大扇形 [−LARGE, 0)、小扇形 [0, SMALL)、其餘是齒圈。原圖上左輪的大扇形在連心線下方、小扇形在上方
const SEGMENTS = [
  { from: -LARGE, to: 0, r: RL },
  { from: 0, to: SMALL, r: RS },
  { from: SMALL, to: TAU - LARGE, r: R },
];

export const sectors = { R, RL, RS, LARGE, SMALL, D: 2 * R };

/** 輪局部角 phi 處的節圓半徑 */
export function pitchRadius(phi) {
  const a = ((((phi + LARGE) % TAU) + TAU) % TAU) - LARGE;
  return SEGMENTS.find((s) => a < s.to).r;
}

// 主動輪轉 θ 時,接觸處(主動輪局部角 −θ)依序經過大扇形 → 齒圈 → 小扇形
const STAGES = [
  { span: LARGE, ratio: RL / RS },
  { span: TAU - LARGE - SMALL, ratio: 1 },
  { span: SMALL, ratio: RS / RL },
];

/** 主動輪轉 θ 時從動輪的轉角(反向) */
export function driven(theta) {
  const k = Math.floor(theta / TAU);
  let t = theta - k * TAU;
  let a = k * TAU;
  for (const { span, ratio } of STAGES) {
    const d = Math.min(t, span);
    a += d * ratio;
    t -= d;
  }
  return -a;
}

// 沿各段節圓排齒(梯形齒),齒依弧長均分;段與段之間的徑向階由相鄰兩點自然連成。
// gapAtStep:段的交界落在齒槽中心(主動輪)或齒的中心(從動輪,兩輪的齒才交錯)
function outline(gapAtStep) {
  const start = gapAtStep ? PITCH / 2 : 0;
  const pts = [];
  let s0 = 0;
  for (const { from, to, r } of SEGMENTS) {
    const n = Math.round(((to - from) * r * 40) / PITCH);
    for (let i = 0; i <= n; i++) {
      const a = from + ((to - from) * i) / n;
      const u = (s0 + r * (a - from) - start) / PITCH;
      const c = Math.abs(u - Math.round(u)); // 0 為齒中心,0.5 為齒槽中心
      const h = c < 0.14 ? M : c < 0.27 ? M - (2.2 * M * (c - 0.14)) / 0.13 : -1.2 * M;
      pts.push([(r + h) * Math.cos(a), (r + h) * Math.sin(a)]);
    }
    s0 += (to - from) * r;
  }
  return pts;
}

const HUB = 0.24;
const wheel = (id, x, gapAtStep) => ({
  id,
  kind: "plate",
  center: [x, 0, 0],
  shape: { outline: outline(gapAtStep), holes: [circle(0.1).reverse()] },
  thickness: 0.24,
  hub: HUB,
  circles: [HUB * 1.45],
  mark: [-0.75, 0], // 在齒圈那一側(小扇形那一側的板面太窄)
  markSize: 0.09,
  spin: 1.4,
});

export default {
  figure: 38,
  parts: [wheel("driver", -sectors.D / 2, true), wheel("driven", sectors.D / 2, false)],
  driver: { part: "driver", type: "rotation" },
  view: { direction: [0.1, 0.08, 1] },
  // 右輪與左輪同形、轉了半圈;θ = 0 就是原圖的位置(左輪的大扇形對著右輪的小扇形)
  pose(angle) {
    return { parts: { driver: { angle }, driven: { angle: Math.PI + driven(angle) } }, readouts: [] };
  },
};
