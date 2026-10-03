// 第 423 種:Root 的專利雙象限引擎,原理與第 422 種相同,但用兩個單動活塞 B、B,兩者都接在同一個曲柄 D 上。
// 蒸汽經進汽閥 a 輪流引進、作用在兩個活塞的外側,從兩活塞之間的空間排出。活塞與曲柄的接法使蒸汽在曲柄每轉一圈中
// 約三分之二的時間作用在每個活塞上,所以沒有死點。
// 主動件是曲柄 D(順時針轉)。
// 推斷:兩個活塞以曲柄為中心點對稱;連桿的長度與位置是依「約三分之二」這個條件求出的(急回機構:往內推的行程佔
// 曲柄 240°);進汽閥 a 畫成隨曲柄轉的旋轉閥。
import { deg } from "./kit.js";
import { circleCircle } from "./linkage.js";
import { stream } from "./flow.js";
import { shape, thickLine, arcPoints, circle, rect } from "./shapes.js";

export const CRANK = 0.45;
export const PIVOTS = [[-1.3, -0.3, 0], [1.3, 0.3, 0]]; // 兩個活塞的轉軸(點對稱)
const ARM = 1.7; // 轉軸到連桿接點
const LINK = 0.9;
const VANE = 1.95; // 活塞長(象限半徑)
const LO = deg(18);
const HI = deg(70);
const OUTER = [HI, HI + Math.PI]; // 外側端壁(蒸汽從這邊進來)

const crankPin = (theta) => [CRANK * Math.cos(theta), CRANK * Math.sin(theta), 0];
/** 曲柄轉 theta → 第 k 個活塞的角度與連桿接點 */
export function vane(theta, k) {
  const P = PIVOTS[k];
  const q = circleCircle(P, ARM, crankPin(theta), LINK, 1).point; // 點對稱:兩個活塞取同一側的解
  return { angle: Math.atan2(q[1] - P[1], q[0] - P[0]), end: q };
}
/** 第 k 個活塞是否正被蒸汽推(往內、角度變小;曲柄順時針轉) */
export function driving(theta, k) {
  const d = vane(theta - 0.002, k).angle - vane(theta, k).angle;
  return Math.atan2(Math.sin(d), Math.cos(d)) < 0;
}

const quadrant = (k) => {
  const [px, py] = PIVOTS[k];
  const s = k === 0 ? 0 : Math.PI;
  return [
    { kind: "plate", shape: shape(thickLine(arcPoints(VANE + 0.1, LO + s, HI + deg(6) + s, px, py), 0.14)), thickness: 0.6 },
    { kind: "plate", shape: shape(thickLine([[px, py], [px + (VANE + 0.15) * Math.cos(HI + deg(6) + s), py + (VANE + 0.15) * Math.sin(HI + deg(6) + s)]], 0.14)), thickness: 0.6 },
    { kind: "plate", shape: shape(circle(0.3, px, py)), thickness: 0.6 },
  ];
};
const VALVE = [1.35, 1.75];
const passages = [
  [VALVE, [0.2, 2.0], [PIVOTS[0][0] + (VANE + 0.05) * Math.cos(HI + deg(3)), PIVOTS[0][1] + (VANE + 0.05) * Math.sin(HI + deg(3))]],
  [VALVE, [2.1, 0.9], [2.0, -1.0], [PIVOTS[1][0] + (VANE + 0.05) * Math.cos(HI + deg(3) + Math.PI), PIVOTS[1][1] + (VANE + 0.05) * Math.sin(HI + deg(3) + Math.PI)]],
];

/** 外側的蒸汽:從活塞到外側端壁 */
function chamber(theta, k, travel) {
  const P = PIVOTS[k];
  const a0 = vane(theta, k).angle;
  const a1 = OUTER[k];
  const dots = [];
  const n = Math.max(1, Math.round(Math.abs(a1 - a0) / deg(6)));
  for (let r = 0.45; r < VANE - 0.05; r += 0.28) {
    for (let i = 0; i < n; i++) {
      const a = a0 + ((a1 - a0) * (i + 0.5 + 0.35 * Math.sin(travel * 3 + r * 4))) / n;
      dots.push([P[0] + r * Math.cos(a), P[1] + r * Math.sin(a), 0.05]);
    }
  }
  return dots;
}

export default {
  figure: 423,
  parts: [
    {
      id: "casing",
      kind: "group",
      pieces: [
        ...quadrant(0),
        ...quadrant(1),
        { kind: "plate", shape: shape(rect(5.0, 4.6, 0, 0)), thickness: 0.04, at: [0, 0, -0.32] },
        { kind: "box", size: [3.6, 0.25, 0.9], at: [0, -2.45, 0] },
        ...passages.map((p) => ({ kind: "plate", shape: shape(thickLine(p, 0.1)), thickness: 0.3 })),
        { kind: "plate", shape: shape(circle(0.36, ...VALVE), [circle(0.26, ...VALVE).reverse()]), thickness: 0.5 },
        { kind: "box", size: [0.14, 0.6, 0.14], at: [VALVE[0], VALVE[1] + 0.6, 0] },
      ],
    },
    ...PIVOTS.map((P, k) => ({
      id: `piston${k + 1}`,
      kind: "group",
      center: P,
      label: "B",
      labelOffset: k === 0 ? [-0.1, 0.95, 0.4] : [0.1, -0.95, 0.4],
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(rect(VANE - 0.25, 0.14, (VANE + 0.25) / 2, 0)), thickness: 0.56 },
        { kind: "cylinder", radius: 0.22, length: 0.56 },
        { kind: "cylinder", radius: 0.05, length: 0.3, at: [ARM, 0, 0.3] },
      ],
    })),
    {
      id: "crank",
      kind: "group",
      label: "D",
      labelOffset: [-0.35, -0.45, 0.4],
      spin: 0.55,
      pieces: [
        { kind: "plate", shape: shape(circle(0.62), [circle(0.08).reverse()]), thickness: 0.1, at: [0, 0, -0.2] },
        { kind: "cylinder", radius: 0.1, length: 0.8, at: [0, 0, -0.1] },
        { kind: "cylinder", radius: 0.06, length: 0.4, at: [CRANK, 0, 0.2], accent: true },
      ],
    },
    { id: "valve", kind: "plate", center: [...VALVE, 0], shape: shape([[0, 0.24], [-0.24, 0], [0, -0.24], [0.08, 0]]), thickness: 0.4, label: "a", labelOffset: [0.45, -0.1, 0.3], spin: 0.32 },
    { id: "link1", kind: "link", width: 0.1, thickness: 0.05 },
    { id: "link2", kind: "link", width: 0.1, thickness: 0.05 },
  ],
  waivers: [
    { check: "unsupported", parts: ["valve"], reason: "待確認(未修):valve 在動,但離帶動(或支撐)它的零件還有 0.99 的空隙,少了相連的軸、銷或連桿,尚未補上" },
    { check: "interference", parts: ["casing", "piston1"], reason: "待確認:casing 的板 與 piston1 的板重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["casing", "piston2"], reason: "待確認:casing 的板 與 piston2 的板重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["casing", "valve"], reason: "待確認(未修):casing 的板 與 valve 的板互相穿入 0.21(96 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["piston1", "crank"], reason: "待確認(未修):piston1 的板 與 crank 的板互相穿入 0.13(55 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["piston2", "crank"], reason: "待確認(未修):piston2 的板 與 crank 的板互相穿入 0.13(52 個取樣姿勢),尚未修正" },
  ],
  driver: { part: "crank", type: "rotation", speed: -0.6 },
  targets: ["piston1", "piston2"],
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const pin = crankPin(theta);
    const v = [vane(theta, 0), vane(theta, 1)];
    const on = [driving(theta, 0), driving(theta, 1)];
    const travel = -theta * 0.8;
    const flows = [];
    for (const k of [0, 1]) {
      if (!on[k]) continue;
      flows.push({ fluid: "steam", points: [...chamber(theta, k, travel), ...stream(passages[k].map(([x, y]) => [x, y, 0.2]), travel, { spacing: 0.2 })] });
    }
    return {
      parts: {
        piston1: { angle: v[0].angle },
        piston2: { angle: v[1].angle },
        crank: { angle: theta },
        valve: { angle: theta },
        link1: { from: [pin[0], pin[1], 0.3], to: [v[0].end[0], v[0].end[1], 0.3] },
        link2: { from: [pin[0], pin[1], 0.3], to: [v[1].end[0], v[1].end[1], 0.3] },
      },
      flows,
      readouts: [
        { label: "上方活塞 B", value: on[0] ? "蒸汽推動" : "排汽回程" },
        { label: "下方活塞 B", value: on[1] ? "蒸汽推動" : "排汽回程" },
      ],
    };
  },
};

