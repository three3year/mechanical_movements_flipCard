// 第 287 種:皮克林式調速器。球裝在彎曲的板彈簧中段;每根彈簧的上端接在固定於心軸上的環扣,下端接在滑動套筒的環扣。
// 轉速升高時,彈簧被球的離心力撐得更彎,把套筒往上拉;離心力減小時,彈簧把球拉回心軸,套筒下降。
// 主動件是虛擬的「進程」(持續運轉):引擎經皮帶帶著心軸底部的塔輪轉,轉速隨負載起伏(推斷,做法同第 162、163 種
// 的水量起伏):一輪 12 圈之內轉速由最慢升到最快再降回,轉速的平方隨進程直線升降,所以套筒等速升降、滑桿每一段都
// 看得出變化。套筒高度對 (轉速 / 上限)² 線性變化,再由彈簧長度不變反推彎度(做法同第 161、170 種)。
// 心軸與塔輪跟著轉速轉;球與彈簧畫在同一個平面上,不跟著心軸繞(同第 162 種的飛球)。
// 推斷:彈簧的彎度與轉速的對應;彈簧長度不變,以拋物線近似彎曲的形狀;球套在彈簧中段(彈簧從球的上下穿入);
// 心軸下端的止推軸承、塔輪上方的軸承架與底座(原圖沒畫)。
// 推斷(原圖只畫調速器本身,補上是為了看得出動力從哪裡來、套筒在調什麼):塔輪的皮帶與引擎那一頭倒過來的塔輪
// (皮帶掛在中間一級,兩輪一樣大),引擎的直立軸從地面下上來;套筒下端的環槽、叉形槓桿、閥桿與蒸汽管上的節流閥
// (throttle.js,做法照第 161 種):轉得太快時套筒升高,把閥桿往上拉、關小節流閥。
import { Y, TAU, clamp, routeBelt } from "./kit.js";
import { throttle } from "./throttle.js";

const TOP = 2.0; // 上環扣的高度
const ROOT = 0.28; // 環扣上接彈簧處離心軸的距離
const SPRING = 3.7; // 彈簧長
const BOW = [0.45, 1.25]; // 彈簧中點外凸量(轉速 0 → 上限)
export const RANGE = [0, 10]; // 轉速
const SAMPLES = 24;
const BALL = { r: 0.26, stretch: 1.6 }; // 球(沿水平拉長的橢球)
export const PERIOD = 12; // 轉速起伏一輪,心軸平均轉的圈數
const SLOWEST = 3; // 一輪之內最慢的轉速(最快是上限)
const FLOOR = -2.95;
const BRACKET_Y = -2.05; // 塔輪上方的軸承架
const STEPS = [0.36, 0.3, 0.24]; // 塔輪由上往下的三級
const STEP_Y = [-2.25, -2.45, -2.65];
const ENGINE = [1.3, 0, -1.4]; // 引擎那一頭的直立軸(x、z)
export const belt = { spindle: STEPS[1], engine: STEPS[1] }; // 皮帶掛在中間一級:兩輪一樣大

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
// 彈簧長度不變:外凸量 b 時的弦長
const chordOf = (bow) => {
  let [lo, hi] = [0.5, SPRING];
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (arcLength(mid, bow) > SPRING) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
};
const SLEEVE = [TOP - chordOf(BOW[0]), TOP - chordOf(BOW[1])];

/** 轉速 s → 彈簧外凸量、套筒高度(對 (s/上限)² 線性;彈簧長度不變,越彎兩端越近) */
export function governor(s) {
  const f = clamp(s / RANGE[1], 0, 1) ** 2;
  const sleeve = SLEEVE[0] + (SLEEVE[1] - SLEEVE[0]) * f;
  const chord = TOP - sleeve;
  let [lo, hi] = [0, 2];
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (arcLength(chord, mid) < SPRING) lo = mid;
    else hi = mid;
  }
  return { bow: (lo + hi) / 2, sleeve, chord };
}
export const springLength = (s) => {
  const { bow, chord } = governor(s);
  return arcLength(chord, bow);
};

// 轉速的平方在一輪之內直線升降(三角波):進程 0 最慢、半輪最快
const A = SLOWEST ** 2;
const B = RANGE[1] ** 2 - A;
const tri = (p) => {
  const u = (((p / PERIOD) % 1) + 1) % 1;
  return u < 0.5 ? 2 * u : 2 - 2 * u;
};
/** 進程 p:當下的轉速 */
export const speedAt = (p) => Math.sqrt(A + B * tri(p));
// 轉速對進程的積分(解析解):前半輪 ∫ √(A + 2Bq/P) dq,後半輪和前半輪對稱
const rise = (x) => (PERIOD / (3 * B)) * ((A + (2 * B * x) / PERIOD) ** 1.5 - A ** 1.5);
const HALF = rise(PERIOD / 2);
const NORMAL = (2 * HALF) / PERIOD; // 平均轉速:進程 1 是平均轉速下心軸轉一圈
/** 進程 p:心軸(塔輪)的轉角 */
export function spindleAngle(p) {
  const k = Math.floor(p / PERIOD);
  const x = p - k * PERIOD;
  const within = x <= PERIOD / 2 ? rise(x) : 2 * HALF - rise(PERIOD - x);
  return (TAU * (k * 2 * HALF + within)) / NORMAL;
}

// 節流閥(推斷):樞軸在左邊的立柱上,叉臂跨在套筒下端的環槽兩側;一輪之內最慢時全開、最快時幾乎關上
const WORKING = [governor(SLOWEST).sleeve, SLEEVE[1]];
const VALVE = throttle({
  pivot: [-1.9, (WORKING[0] + WORKING[1]) / 2 - 0.2],
  groove: { top: -0.15, height: 0.1, neck: 0.12, outer: 0.2 },
  range: WORKING,
  floor: FLOOR,
});
/** 進程 p:節流閥的開度(1 全開、0 全關) */
export const opening = (p) => VALVE.solve(governor(speedAt(p)).sleeve).opening;

const collar = (y) => [
  { kind: "cylinder", axis: Y, radius: 0.32, length: 0.16, at: [0, y, 0] },
  { kind: "cylinder", axis: Y, radius: 0.2, length: 0.3, at: [0, y, 0] },
];
const BELT = routeBelt([
  { center: [0, STEP_Y[1], 0], axis: Y, radius: belt.spindle, sense: 1 },
  { center: [ENGINE[0], STEP_Y[1], ENGINE[2]], axis: Y, radius: belt.engine, sense: 1 },
]);

export default {
  figure: 287,
  parts: [
    {
      // 心軸與固定在它上面的上環扣、頂端的蓋與底部的塔輪,一起轉
      id: "spindle",
      kind: "group",
      axis: Y,
      spin: STEPS[0],
      spinOffset: STEP_Y[0] + 0.25,
      pieces: [
        { kind: "cylinder", radius: 0.08, length: 2.6 - FLOOR - 0.02, at: [0, 0, (2.6 + FLOOR + 0.02) / 2] },
        ...collar(TOP).map(({ axis, at, ...p }) => ({ ...p, at: [0, 0, at[1]] })), // 上環扣(群組的局部 z 沿心軸)
        { kind: "lathe", axis: [0, 0, 1], profile: [[0, 0], [0.18, 0], [0.12, 0.3], [0.07, 0.42], [0, 0.45]], at: [0, 0, TOP + 0.1] },
        // 底部的塔輪(引擎經皮帶帶動調速器)
        ...STEPS.map((r, i) => ({ kind: "cylinder", radius: r, length: 0.14, at: [0, 0, STEP_Y[i]], mark: i === 0 })),
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 下端的止推軸承、塔輪上方的軸承架、底座(推斷)
        { kind: "cylinder", axis: Y, radius: 0.16, inner: 0.08, length: 0.2, at: [0, FLOOR + 0.1, 0] },
        { kind: "box", size: [4.8, 0.15, 2.6], at: [0, FLOOR - 0.075, -0.8] },
        { kind: "cylinder", axis: Y, radius: 0.18, inner: 0.08, length: 0.14, at: [0, BRACKET_Y, 0] },
        { kind: "box", size: [2.02, 0.12, 0.16], at: [1.19, BRACKET_Y, 0] },
        { kind: "box", size: [0.16, BRACKET_Y + 0.06 - FLOOR, 0.16], at: [2.2, (BRACKET_Y + 0.06 + FLOOR) / 2, 0] },
        // 引擎那一頭直立軸的軸承:地面上的軸承座,上端的軸承架從後面的立柱伸出(推斷)
        { kind: "cylinder", axis: Y, radius: 0.14, inner: 0.06, length: 0.3, at: [ENGINE[0], FLOOR + 0.15, ENGINE[2]] },
        { kind: "cylinder", axis: Y, radius: 0.14, inner: 0.06, length: 0.14, at: [ENGINE[0], BRACKET_Y, ENGINE[2]] },
        { kind: "box", size: [0.12, 0.12, 0.42], at: [ENGINE[0], BRACKET_Y, ENGINE[2] - 0.31] },
        { kind: "box", size: [0.16, BRACKET_Y + 0.06 - FLOOR, 0.16], at: [ENGINE[0], (BRACKET_Y + 0.06 + FLOOR) / 2, ENGINE[2] - 0.55] },
        ...VALVE.framePieces,
      ],
    },
    {
      // 引擎那一頭的直立軸與倒過來的塔輪(從地面下的引擎上來)
      id: "engine",
      kind: "group",
      axis: Y,
      center: [ENGINE[0], 0, ENGINE[2]],
      spin: STEPS[0],
      spinOffset: STEP_Y[2] - 0.25,
      pieces: [
        { kind: "cylinder", radius: 0.06, length: BRACKET_Y + 0.1 - (FLOOR - 0.4), at: [0, 0, (BRACKET_Y + 0.1 + FLOOR - 0.4) / 2] },
        ...STEPS.map((r, i) => ({ kind: "cylinder", radius: STEPS[2 - i], length: 0.14, at: [0, 0, STEP_Y[i]], mark: i === 2 })),
      ],
    },
    { id: "belt", kind: "belt" },
    { id: "sleeve", kind: "group", pieces: [...collar(0), ...VALVE.sleevePieces()] },
    // 每根彈簧分成球上、球下兩段(中段穿在球裡)
    ...["L", "R"].flatMap((k) => [
      { id: `spring${k}`, kind: "rod", radius: 0.035 },
      { id: `spring${k}2`, kind: "rod", radius: 0.035 },
    ]),
    { id: "ballL", kind: "sphere", radius: BALL.r },
    { id: "ballR", kind: "sphere", radius: BALL.r },
    ...VALVE.parts,
  ],
  powered: ["engine", "ballL", "ballR"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, PERIOD], unit: "圈", speed: 1.5 },
  target: "valve", // 被調節的節流閥
  view: { direction: [0.3, 0.22, 1] },
  pose(p) {
    const s = speedAt(p);
    const { bow, sleeve, chord } = governor(s);
    const angle = spindleAngle(p);
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
        spindle: { angle },
        engine: { angle: (angle * belt.spindle) / belt.engine },
        sleeve: { position: [0, sleeve, 0] },
        ballL: { position: [-(ROOT + bow), mid, 0], scale: [BALL.stretch, 1, 1] },
        ballR: { position: [ROOT + bow, mid, 0], scale: [BALL.stretch, 1, 1] },
        ...VALVE.pose(sleeve),
      },
      paths: {
        belt: { points: BELT.points, closed: true, phase: angle * belt.spindle },
        springL: { points: curve(-1, 0, lo), closed: false },
        springL2: { points: curve(-1, 1 - lo, 1), closed: false },
        springR: { points: curve(1, 0, lo), closed: false },
        springR2: { points: curve(1, 1 - lo, 1), closed: false },
      },
      readouts: [
        { label: "轉速", value: `${s.toFixed(1)}(${s > speedAt(p - 0.01) ? "漸快" : "漸慢"})` },
        { label: "節流閥開度", value: `${Math.round(opening(p) * 100)}%` },
      ],
    };
  },
};
