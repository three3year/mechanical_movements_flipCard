// 第 287 種:皮克林式調速器。球裝在彎曲的板彈簧中段;每根彈簧的上端接在固定於心軸上的環扣,下端接在滑動套筒的環扣。
// 轉速升高時,彈簧被球的離心力撐得更彎,把套筒往上拉;離心力減小時,彈簧把球拉回心軸,套筒下降。
// 主動件是虛擬的「轉速」(平衡型)。
// 推斷:彈簧的彎度與轉速的對應;彈簧長度不變,以拋物線近似彎曲的形狀;球套在彈簧中段(彈簧從球的上下穿入);
// 心軸下端的止推軸承、塔輪上方的軸承架與底座(原圖沒畫)。與第 161 種相同,心軸在模型裡不轉(主動件是轉速本身)。
import { Y, clamp } from "./kit.js";

const TOP = 2.0; // 上環扣的高度
const ROOT = 0.28; // 環扣上接彈簧處離心軸的距離
const SPRING = 3.7; // 彈簧長
const BOW = [0.45, 1.25]; // 彈簧中點外凸量(低速 → 高速)
export const RANGE = [0, 10];
const SAMPLES = 24;
const BALL = { r: 0.26, stretch: 1.6 }; // 球(沿水平拉長的橢球)

// 外凸量 b、弦長 c 的拋物線弧長
const arcLength = (c, b) => {
  let len = 0;
  let prev = [0, 0];
  for (let i = 1; i <= 64; i++) {
    const t = i / 64;
    const p = [4 * b * t * (1 - t), c * t];
    len += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
    prev = p;
  }
  return len;
};

/** 轉速 s → 彈簧外凸量、套筒高度(彈簧長度不變:越彎,兩端越近) */
export function governor(s) {
  const f = clamp(s / RANGE[1], 0, 1) ** 2;
  const bow = BOW[0] + (BOW[1] - BOW[0]) * f;
  let lo = 0.5;
  let hi = SPRING;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (arcLength(mid, bow) > SPRING) hi = mid;
    else lo = mid;
  }
  const chord = (lo + hi) / 2;
  return { bow, sleeve: TOP - chord, chord };
}
export const springLength = (s) => {
  const { bow, chord } = governor(s);
  return arcLength(chord, bow);
};

const collar = (y) => [
  { kind: "cylinder", axis: Y, radius: 0.32, length: 0.16, at: [0, y, 0] },
  { kind: "cylinder", axis: Y, radius: 0.2, length: 0.3, at: [0, y, 0] },
];

export default {
  figure: 287,
  parts: [
    {
      id: "spindle",
      kind: "group",
      pieces: [
        { kind: "cylinder", axis: Y, radius: 0.08, length: 5.2, at: [0, -0.15, 0] },
        ...collar(TOP),
        { kind: "lathe", axis: Y, profile: [[0, 0], [0.18, 0], [0.12, 0.3], [0.07, 0.42], [0, 0.45]], at: [0, TOP + 0.1, 0] },
        // 底部的塔輪(帶動調速器)
        { kind: "cylinder", axis: Y, radius: 0.36, length: 0.14, at: [0, -2.25, 0] },
        { kind: "cylinder", axis: Y, radius: 0.3, length: 0.14, at: [0, -2.45, 0] },
        { kind: "cylinder", axis: Y, radius: 0.24, length: 0.14, at: [0, -2.65, 0] },
        // 下端的止推軸承、塔輪上方的軸承架、底座(推斷)
        { kind: "cylinder", axis: Y, radius: 0.16, length: 0.2, at: [0, -2.85, 0] },
        { kind: "box", size: [4.6, 0.15, 1.0], at: [0, -3.02, 0] },
        { kind: "cylinder", axis: Y, radius: 0.18, inner: 0.08, length: 0.14, at: [0, -1.95, 0] },
        { kind: "box", size: [2.02, 0.12, 0.16], at: [1.19, -1.95, 0] },
        { kind: "box", size: [0.16, 1.07, 0.16], at: [2.2, -2.42, 0] },
      ],
    },
    { id: "sleeve", kind: "group", pieces: collar(0) },
    // 每根彈簧分成球上、球下兩段(中段穿在球裡)
    ...["L", "R"].flatMap((k) => [
      { id: `spring${k}`, kind: "rod", radius: 0.035 },
      { id: `spring${k}2`, kind: "rod", radius: 0.035 },
    ]),
    { id: "ballL", kind: "sphere", radius: BALL.r },
    { id: "ballR", kind: "sphere", radius: BALL.r },
  ],
  powered: ["ballL", "ballR"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "轉速", mode: "balance", range: RANGE, initial: 5 },
  target: "sleeve", // 升降的套筒
  view: { direction: [0.04, 0.05, 1] },
  pose(s) {
    const { bow, sleeve, chord } = governor(s);
    const at = (k, t) => [k * (ROOT + 4 * bow * t * (1 - t)), TOP - chord * t, 0];
    const mid = TOP - chord / 2;
    // 彈簧進入球面的參數 t(上段在 t < 0.5、下段對稱)
    const inside = (t) => {
      const [x, y] = at(1, t);
      return ((x - ROOT - bow) / (BALL.r * BALL.stretch)) ** 2 + ((y - mid) / BALL.r) ** 2 < 1;
    };
    let [lo, hi] = [0, 0.5];
    for (let i = 0; i < 40; i++) [lo, hi] = inside((lo + hi) / 2) ? [lo, (lo + hi) / 2] : [(lo + hi) / 2, hi];
    const curve = (k, from, to) => Array.from({ length: SAMPLES + 1 }, (_, i) => at(k, from + ((to - from) * i) / SAMPLES));
    return {
      parts: {
        sleeve: { position: [0, sleeve, 0] },
        ballL: { position: [-(ROOT + bow), mid, 0], scale: [BALL.stretch, 1, 1] },
        ballR: { position: [ROOT + bow, mid, 0], scale: [BALL.stretch, 1, 1] },
      },
      paths: {
        springL: { points: curve(-1, 0, lo), closed: false },
        springL2: { points: curve(-1, 1 - lo, 1), closed: false },
        springR: { points: curve(1, 0, lo), closed: false },
        springR2: { points: curve(1, 1 - lo, 1), closed: false },
      },
      readouts: [],
    };
  },
};
