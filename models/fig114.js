// 第 114 種:缺齒式小齒輪把均勻的圓周運動轉換為往復直線運動。小齒輪只有幾個齒,
// 交替地帶動長圓框架上方與下方的齒條:有齒的部分經過上方時框架往一邊走,經過下方時往另一邊走,
// 兩段之間有一小段齒都沒碰到齒條,框架停一下。主動件是小齒輪(逆時針)。
// 框架兩端的桿穿在固定的導套裡,小齒輪的軸裝在後面的軸承座上(導套、軸承座是推斷;原圖的桿伸出畫面外)。
// 框架的位置由小齒輪的齒推齒條決定:逐步轉小齒輪,齒壓進哪一排齒條就把框架往那一邊推到剛好不重疊,
// 沒被推時框架靠摩擦停住(取穩定的一圈當作週期)。齒頂比節圓先碰到齒條,所以實際的推程比「有齒的弧長」略長、
// 停頓略短。動力重演:框架是靠摩擦定位的滑塊,只被齒推動。
import { TAU, rot2 } from "./kit.js";
import { penetrationDepth } from "./contact.js";
import { pedestal, squareGuide } from "./supports.js";
import { rackOffset, circularPitch } from "./gears.js";
import { sectorEngaged } from "./jumps.js";
import { arcPoints, shape, gearProfile, rackShape, toothOutline } from "./shapes.js";

export const PINION = { center: [0, 0, 0], teeth: 12, radius: 0.82 };
const PITCH = circularPitch(PINION);
const P_ANGLE = TAU / PINION.teeth;
const TOOTHED = 4; // 5 顆時,齒頂提早咬進另一排、前一排還沒脫開,兩排同時咬住會卡死;4 顆才在換邊時留出空檔
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

// 以節圓計算的框架位置:只用來定兩排齒條的相位
const idealX = (theta) => raw(theta) - MEAN;

// 兩排齒條在框架上的相位:咬合期間「齒條需要的位置 − 框架位置」是定值
const phase = (rack, theta) => {
  const p = rackOffset(PINION, rack, theta) - idealX(theta);
  return ((p % PITCH) + PITCH) % PITCH;
};
const TOP_PHASE = phase(TOP, Math.PI / 2 - SECTOR.start - SECTOR.len / 2);
const BOTTOM_PHASE = phase(BOTTOM, -Math.PI / 2 - SECTOR.start - SECTOR.len / 2);

// 由齒形接觸逐步算框架的位置
// 只拿單顆齒的外形互相比:小齒輪有齒的 5 顆、齒條的 9 顆(齒條本體與小齒輪的齒根圓碰不到)
const PROFILE = gearProfile({ ...PINION, has: (i) => i < TOOTHED });
const PINION_TEETH = Array.from({ length: TOOTHED }, (_, i) => toothOutline(PINION, i));
const RACK = rackShape({ teeth: 9, pitch: PITCH, depth: 0.2 }).outline;
const RACK_TEETH = Array.from({ length: 9 }, (_, k) => RACK.slice(2 + 4 * k, 6 + 4 * k));
const topRack = (x) => RACK.map(([px, py]) => [x + TOP_PHASE - px, PINION.radius - py]); // 轉 180°,齒朝下
const bottomRack = (x) => RACK.map(([px, py]) => [x + BOTTOM_PHASE + px, -PINION.radius + py]);
const topTeeth = (x) => RACK_TEETH.map((t) => t.map(([px, py]) => [x + TOP_PHASE - px, PINION.radius - py]));
const bottomTeeth = (x) => RACK_TEETH.map((t) => t.map(([px, py]) => [x + BOTTOM_PHASE + px, -PINION.radius + py]));
const pinionAt = (theta) => PROFILE.map((p) => rot2(p, theta));
const pinionTeeth = (theta) => PINION_TEETH.map((t) => t.map((p) => rot2(p, theta)));
const deepest = (as, bs) => Math.max(0, ...as.flatMap((a) => bs.map((b) => penetrationDepth(a, b))));
function clear(value, dir, max, overlaps) {
  if (!overlaps(value)) return value;
  if (overlaps(value + dir * max)) return value;
  let [lo, hi] = [0, max];
  for (let k = 0; k < 30; k++) {
    const mid = (lo + hi) / 2;
    if (overlaps(mid * dir + value)) lo = mid;
    else hi = mid;
  }
  return value + dir * hi;
}
const SAMPLES = 360;
const TOL = 0.008;
const TABLE = (() => {
  let x = idealX(0);
  const max = 1.5 * (PINION.radius + 0.15) * (TAU / SAMPLES) + 1e-4; // 一步裡齒頂走的距離(加餘裕)
  const run = [];
  for (let i = 0; i <= 2 * SAMPLES; i++) {
    const p = pinionTeeth((TAU * i) / SAMPLES);
    // 逆時針轉:上方的齒往左推上排齒條,下方的齒往右推下排齒條
    // 梯形的簡化齒形在咬合時本來就會互相擦到約 0.003,穿入超過 TOL 才算推到
    x = clear(x, -1, max, (v) => deepest(p, topTeeth(v)) > TOL);
    x = clear(x, 1, max, (v) => deepest(p, bottomTeeth(v)) > TOL);
    run.push(x);
  }
  return run.slice(SAMPLES);
})();

/** 小齒輪轉 theta:框架的水平位置 */
export function frameX(theta) {
  const u = ((((theta / TAU) % 1) + 1) % 1) * SAMPLES;
  const i = Math.min(SAMPLES - 1, Math.floor(u));
  return TABLE[i] + (TABLE[i + 1] - TABLE[i]) * (u - i);
}
export const stroke = Math.max(...TABLE) - Math.min(...TABLE);
/** 姿勢下小齒輪與兩排齒條的外形(世界座標 2D),測試檢查齒不穿入用 */
export const contactShapes = (theta) => ({ pinion: pinionAt(theta), top: topRack(frameX(theta)), bottom: bottomRack(frameX(theta)) });

const W = 1.7; // 框架內側的半長(直線段)
const ROD = { length: 2.8, at: W + PINION.radius + 0.5 + 1.4 }; // 兩端的桿(內端伸進框架 0.12)
const FLOOR = -2.2;
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
      pieces: [{ kind: "cylinder", radius: 0.1, length: 0.9, at: [0, 0, -0.3] }],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(loop(PINION.radius + 0.62), [loop(PINION.radius + 0.42).reverse()]), thickness: 0.3 },
        { kind: "rack", teeth: 9, pitch: PITCH, depth: 0.2, width: 0.3, at: [TOP_PHASE, PINION.radius, 0], angle: Math.PI },
        { kind: "rack", teeth: 9, pitch: PITCH, depth: 0.2, width: 0.3, at: [BOTTOM_PHASE, -PINION.radius, 0] },
        { kind: "box", size: [ROD.length, 0.18, 0.3], at: [-ROD.at, 0, 0] },
        { kind: "box", size: [ROD.length, 0.18, 0.3], at: [ROD.at, 0, 0] },
      ],
    },
    {
      id: "support",
      kind: "group",
      pieces: [
        ...pedestal({ at: [0, 0], z: -0.6, bore: 0.1, floor: FLOOR }),
        ...[-1, 1].flatMap((side) => [
          ...squareGuide({ at: [side * ROD.at, 0, 0], width: 0.18, thickness: 0.3 }),
          { kind: "box", size: [0.2, -0.17 - FLOOR, 0.2], at: [side * ROD.at, (-0.17 + FLOOR) / 2, 0] },
          { kind: "box", size: [0.8, 0.18, 0.6], at: [side * ROD.at, FLOOR - 0.09, 0] },
        ]),
      ],
    },
  ],
  // 動力重演:只推小齒輪;框架靠摩擦定位,只被齒推動。停頓的兩段(有齒的部分在左右兩側)框架不動
  replay: {
    free: { frame: { slide: [1, 0, 0], hold: true } },
    expect: [
      { at: 1.4, part: "frame", label: "有齒的部分經過上方,把框架往左推", quote: "該小齒輪交替地帶動上方與下方的齒條" },
      { at: 2.4, part: "frame", label: "框架到了左端" },
      { at: 4.4, part: "frame", label: "有齒的部分經過下方,把框架往右推" },
      { at: 5.55, part: "frame", label: "框架到了右端" },
      { part: "frame", label: "轉完一圈,框架回到起點" },
    ],
  },
  driver: { part: "pinion", type: "rotation", speed: 1.2 },
  target: "frame", // 往復直線運動的框架
  view: { direction: [0.06, 0.05, 1], fit: ["pinion", "frame"] },
  pose(theta) {
    return { parts: { pinion: { angle: theta }, frame: { position: [frameX(theta), 0, 0] } }, readouts: [] };
  },
};
