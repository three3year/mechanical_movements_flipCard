// 第 114 種:缺齒式小齒輪把均勻的圓周運動轉換為往復直線運動。小齒輪只有幾個齒,
// 交替地帶動長圓框架上方與下方的齒條:有齒的部分經過上方時框架往一邊走,經過下方時往另一邊走,
// 兩段之間齒都沒碰到齒條,框架停一下。主動件是小齒輪(逆時針)。
import { TAU } from "./kit.js";
import { rackOffset, circularPitch } from "./gears.js";
import { sectorEngaged } from "./jumps.js";
import { arcPoints, shape } from "./shapes.js";

export const PINION = { center: [0, 0, 0], teeth: 12, radius: 0.82 };
const PITCH = circularPitch(PINION);
const P_ANGLE = TAU / PINION.teeth;
const TOOTHED = 5;
const SECTOR = { start: -P_ANGLE / 2, len: TOOTHED * P_ANGLE };
const TOP = { origin: [0, PINION.radius, 0], dir: [1, 0, 0], pitch: PITCH };
const BOTTOM = { origin: [0, -PINION.radius, 0], dir: [1, 0, 0], pitch: PITCH };

// 框架位置:有齒的扇區經過上方(接觸在世界角 90°)時往左走,經過下方(−90°)時往右走
const raw = (theta) => {
  const top = sectorEngaged(theta, { contact: Math.PI / 2, ...SECTOR });
  const bottom = sectorEngaged(theta, { contact: -Math.PI / 2, ...SECTOR });
  return PINION.radius * (bottom - top);
};
const MEAN = (() => {
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < 360; i++) {
    const x = raw((i / 360) * TAU);
    lo = Math.min(lo, x);
    hi = Math.max(hi, x);
  }
  return (lo + hi) / 2;
})();

/** 小齒輪轉 theta:框架的水平位置 */
export const frameX = (theta) => raw(theta) - MEAN;
export const stroke = PINION.radius * SECTOR.len;

// 兩排齒條在框架上的相位:咬合期間「齒條需要的位置 − 框架位置」是定值
const phase = (rack, theta) => {
  const p = rackOffset(PINION, rack, theta) - frameX(theta);
  return ((p % PITCH) + PITCH) % PITCH;
};
const TOP_PHASE = phase(TOP, Math.PI / 2 - SECTOR.start - SECTOR.len / 2);
const BOTTOM_PHASE = phase(BOTTOM, -Math.PI / 2 - SECTOR.start - SECTOR.len / 2);

const W = 1.7; // 框架內側的半長(直線段)
const loop = (r) => [...arcPoints(r, -Math.PI / 2, Math.PI / 2, W, 0), ...arcPoints(r, Math.PI / 2, (3 * Math.PI) / 2, -W, 0)];

export default {
  figure: 114,
  parts: [
    {
      id: "pinion",
      kind: "gear",
      center: PINION.center,
      teeth: PINION.teeth,
      radius: PINION.radius,
      width: 0.3,
      bore: 0.1,
      toothed: Array.from({ length: TOOTHED }, (_, i) => i),
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(loop(PINION.radius + 0.62), [loop(PINION.radius + 0.42).reverse()]), thickness: 0.3 },
        { kind: "rack", teeth: 9, pitch: PITCH, depth: 0.2, width: 0.3, at: [TOP_PHASE, PINION.radius, 0], angle: Math.PI },
        { kind: "rack", teeth: 9, pitch: PITCH, depth: 0.2, width: 0.3, at: [BOTTOM_PHASE, -PINION.radius, 0] },
        { kind: "box", size: [1.6, 0.18, 0.3], at: [-W - PINION.radius - 1.3, 0, 0] },
        { kind: "box", size: [1.6, 0.18, 0.3], at: [W + PINION.radius + 1.3, 0, 0] },
      ],
    },
  ],
  driver: { part: "pinion", type: "rotation", speed: 1.2 },
  target: "frame", // 往復直線運動的框架
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    return { parts: { pinion: { angle: theta }, frame: { position: [frameX(theta), 0, 0] } }, readouts: [] };
  },
};
