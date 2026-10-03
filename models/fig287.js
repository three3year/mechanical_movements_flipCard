// 第 287 種:皮克林式調速器。球裝在彎曲的板彈簧中段;每根彈簧的上端接在固定於心軸上的環扣,下端接在滑動套筒的環扣。
// 轉速升高時,彈簧被球的離心力撐得更彎,把套筒往上拉;離心力減小時,彈簧把球拉回心軸,套筒下降。
// 主動件是虛擬的「轉速」(平衡型)。
// 推斷:彈簧的彎度與轉速的對應;彈簧長度不變,以拋物線近似彎曲的形狀。
import { Y, clamp } from "./kit.js";

const TOP = 2.0; // 上環扣的高度
const ROOT = 0.28; // 環扣上接彈簧處離心軸的距離
const SPRING = 3.7; // 彈簧長
const BOW = [0.45, 1.25]; // 彈簧中點外凸量(低速 → 高速)
export const RANGE = [0, 10];
const SAMPLES = 24;

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
      ],
    },
    { id: "sleeve", kind: "group", pieces: collar(0) },
    { id: "springL", kind: "rod", radius: 0.035 },
    { id: "springR", kind: "rod", radius: 0.035 },
    { id: "ballL", kind: "sphere", radius: 0.26 },
    { id: "ballR", kind: "sphere", radius: 0.26 },
  ],
  driver: { type: "virtual", label: "轉速", mode: "balance", range: RANGE, initial: 5 },
  target: "sleeve", // 升降的套筒
  view: { direction: [0.04, 0.05, 1] },
  pose(s) {
    const { bow, sleeve, chord } = governor(s);
    const curve = (k) =>
      Array.from({ length: SAMPLES + 1 }, (_, i) => {
        const t = i / SAMPLES;
        return [k * (ROOT + 4 * bow * t * (1 - t)), TOP - chord * t, 0];
      });
    const mid = TOP - chord / 2;
    return {
      parts: {
        sleeve: { position: [0, sleeve, 0] },
        ballL: { position: [-(ROOT + bow), mid, 0], scale: [1.6, 1, 1] },
        ballR: { position: [ROOT + bow, mid, 0], scale: [1.6, 1, 1] },
      },
      paths: { springL: { points: curve(-1), closed: false }, springR: { points: curve(1), closed: false } },
      readouts: [],
    };
  },
};
