// 第 395 種:四向活塞閥(four-way cock),多年前用在蒸汽引擎上,讓蒸汽進出汽缸。閥殼上有四個口:上方進汽、下方排汽、
// 左右兩個口通汽缸的兩端;閥塞裡有兩道彎曲的通道,各連通相鄰的兩個口。原圖的兩個位置相差閥塞轉 1/4 圈:上圖中蒸汽從上方
// 進入、經通道到左口(汽缸左端),廢汽從汽缸右端經右口、通道到下方排出;下圖中相反,蒸汽到右端、廢汽從左端排出。
// 主動件是虛擬的「進程」:引擎每一個來回,閥塞在兩個位置之間轉 1/4 圈、再轉回來;蒸汽與廢汽以流體示意,通道沒對準時不流動。
// 推斷:轉換的時機與通道對準的容許角度;進汽與排汽以同一種顏色(蒸汽)表示。
import { deg, clamp, smooth } from "./kit.js";
import { stream } from "./flow.js";
import { shape, circle, arcPoints } from "./shapes.js";

const R = 1.4; // 閥殼內半徑
const PORT = 0.42; // 口的半寬(角度以弧長計)
export const RANGE = [0, deg(90)];

/** 進程 p → 閥塞轉角:每一輪的前半停在位置 0、後半停在位置 1,中間以 1/4 圈轉換 */
export function plugAngle(p) {
  const f = ((p % 1) + 1) % 1;
  if (f < 0.4) return 0;
  if (f < 0.5) return deg(90) * smooth((f - 0.4) / 0.1);
  if (f < 0.9) return deg(90);
  return deg(90) * (1 - smooth((f - 0.9) / 0.1));
}
const TOL = deg(12); // 通道與口對準的容許角度

/** 閥塞轉角 a → 哪一個位置(0 或 1,中間為 null:沒對準) */
export function position(a0) {
  const a = clamp(a0, ...RANGE);
  if (a < TOL) return 0;
  if (a > deg(90) - TOL) return 1;
  return null;
}

// 閥塞的通道:兩段以閥殼外的一點為圓心的弧,各連通兩個相鄰的口(局部角:上 90°、左 180° 的那一對,與右、下那一對)
const passage = (cx, cy, a0, a1) => {
  const r = Math.hypot(cx, cy) - R + 0.0;
  return { outer: arcPoints(r + 0.22, a0, a1, cx, cy), inner: arcPoints(r - 0.22, a1, a0, cx, cy) };
};
const P1 = passage(-R, R, deg(-90), deg(0)); // 連上口與左口
const P2 = passage(R, -R, deg(90), deg(180)); // 連右口與下口

// 流動的路徑(世界座標):位置 0:進汽 上 → 左,排汽 右 → 下;位置 1:進汽 上 → 右,排汽 左 → 下
const PATHS = {
  0: [
    [[0, 2.6, 0.3], [0, R, 0.3], [-0.55, 0.55, 0.3], [-R, 0, 0.3], [-2.6, 0, 0.3]],
    [[2.6, 0, 0.3], [R, 0, 0.3], [0.55, -0.55, 0.3], [0, -R, 0.3], [0, -2.6, 0.3]],
  ],
  1: [
    [[0, 2.6, 0.3], [0, R, 0.3], [0.55, 0.55, 0.3], [R, 0, 0.3], [2.6, 0, 0.3]],
    [[-2.6, 0, 0.3], [-R, 0, 0.3], [-0.55, -0.55, 0.3], [0, -R, 0.3], [0, -2.6, 0.3]],
  ],
};

const port = (a) => ({ kind: "box", size: [1.3, 2 * PORT + 0.3, 0.6], at: [(R + 0.6) * Math.cos(a), (R + 0.6) * Math.sin(a), 0], angle: a });

export default {
  figure: 395,
  parts: [
    {
      id: "casing",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(circle(R + 0.25), [circle(R).reverse()]), thickness: 0.6 },
        ...[0, 90, 180, 270].map((d) => port(deg(d))),
      ],
    },
    {
      id: "plug",
      kind: "group",
      spin: R,
      pieces: [
        // 閥塞:圓盤上兩道彎曲通道的邊壁(以凸起的弧表示)
        { kind: "plate", shape: shape(circle(R - 0.05)), thickness: 0.12, at: [0, 0, -0.2] },
        { kind: "tube", points: P1.outer.map(([x, y]) => [x, y, 0]), radius: 0.06 },
        { kind: "tube", points: P1.inner.map(([x, y]) => [x, y, 0]), radius: 0.06 },
        { kind: "tube", points: P2.outer.map(([x, y]) => [x, y, 0]), radius: 0.06 },
        { kind: "tube", points: P2.inner.map(([x, y]) => [x, y, 0]), radius: 0.06 },
        { kind: "box", size: [0.25, 0.25, 0.3], at: [0, 0, 0.05], accent: true },
      ],
    },
  ],
  powered: ["plug"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  waivers: [
    { check: "interference", parts: ["casing", "plug"], reason: "待確認(未修):casing 的方塊 1.3×1.14×0.6 與 plug 的Tube互相穿入 0.36(96 個取樣姿勢),尚未修正" },
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], speed: 0.15 },
  target: "plug",
  view: { direction: [0.03, 0.05, 1] },
  pose(p) {
    const a = plugAngle(p);
    const pos = position(a);
    const flows = pos === null ? [] : PATHS[pos].map((path) => ({ fluid: "steam", points: stream(path, p * 12, { spacing: 0.22 }) }));
    return { parts: { plug: { angle: a } }, flows, readouts: [] };
  },
};
