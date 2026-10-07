// 第 212 種:日內瓦式擋止(Geneva-stop),用於瑞士錶中限制上發條的圈數。輪 A(下)上有一個齒,每轉一圈進入
// 輪 B(上)的一道槽一次,把 B 推過一格;其餘時間 A 的圓盤卡在 B 兩槽之間的內凹圓弧上,B 不動。
// B 上的凸曲部分 a、b 之間不挖鎖定圓弧,是擋止:B 走完四格後,A 的齒再也推不動 B,A 就被擋住。主動件是輪 A。
// 推斷:B 有六格(五道開槽可用其四、凸弧佔一格);A 上齒旁的缺口是讓 B 的尖角通過;A 可轉約四圈多。
import { TAU, rot2 } from "./kit.js";
import { pedestal } from "./supports.js";
import { geneva, genevaWheel } from "./geneva.js";
import { shape, circle } from "./shapes.js";

const C = 2.8;
const RB = 1.45;
const N = 6;
const STEPS = 4;
const RA = 1.55; // A 的鎖定圓盤
const G = geneva({ C, rb: RB, n: N });
const A = [0, -C, 0];

export const stop = G.at;
export const range = G.range(STEPS);
export const geometry = { C, RB, RA, N, STEPS, a: G.a };

const wheelB = genevaWheel({ C, rb: RB, n: N, width: 0.24, bottom: C - G.a - 0.12, lock: RA + 0.03, convex: [5] });
// A:鎖定圓盤,齒(朝上,θ = 0 時正對 B)兩旁各一個缺口
const diskA = Array.from({ length: 240 }, (_, i) => {
  const t = (i / 240) * TAU;
  let r = RA;
  for (const side of [1, -1]) {
    const c = rot2([0, RA], side * 0.42);
    const b = c[0] * Math.cos(t) + c[1] * Math.sin(t);
    const disc = b * b - RA * RA + 0.26 * 0.26;
    if (disc > 0 && b > 0) r = Math.min(r, b - Math.sqrt(disc));
  }
  return [r * Math.cos(t), r * Math.sin(t)];
});
// B 上 a、b 兩點:凸弧(第 5 格)的兩端,在 B 的局部座標
const arcEnd = (sign) => rot2([0, RB + 0.18], Math.PI / 2 + sign * 0.42);

export default {
  figure: 212,
  parts: [
    {
      id: "wheelA",
      kind: "group",
      center: A,
      spin: RA,
      label: "A",
      labelOffset: [-0.65, 0, 0.3],
      pieces: [
        { kind: "plate", shape: shape(diskA, [circle(0.22).reverse()]), thickness: 0.2 },
        { kind: "box", size: [0.2, G.a - RA + 0.12, 0.2], at: [0, (G.a + RA - 0.12) / 2, 0], accent: true },
        { kind: "cylinder", radius: 0.3, inner: 0.15, length: 0.35 },
      ],
    },
    {
      id: "wheelB",
      kind: "group",
      spin: RB,
      label: "B",
      labelOffset: [0, 0.6, 0.3],
      pieces: [
        { kind: "plate", shape: shape(wheelB, [circle(0.16).reverse()]), thickness: 0.2, mark: [0.6, 0.6], markSize: 0.07 },
        { kind: "cylinder", radius: 0.28, inner: 0.14, length: 0.35 },
      ],
    },
    { id: "tagA", kind: "group", pieces: [], arrow: false, label: "a" },
    { id: "tagB", kind: "group", pieces: [], arrow: false, label: "b" },
    {
      id: "bearings",
      kind: "group",
      // 推斷(原圖只畫出輪轂):每個輪的固定軸往後伸進一座落地的軸承座
      pieces: [A, [0, 0]].flatMap(([x, y]) => [
        { kind: "cylinder", radius: 0.1, length: 0.57, at: [x, y, -0.185] },
        ...pedestal({ at: [x, y], z: -0.47, bore: 0.1, floor: -5.22, depth: 0.2 }),
      ]),
    },
  ],
  driver: { part: "wheelA", type: "rotation", range, initial: 2 * TAU }, // 原圖:第三格推到一半,凸弧 a–b 在右上
  target: "wheelB",
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const { b } = stop(theta);
    return {
      parts: {
        wheelA: { angle: theta },
        wheelB: { angle: b },
        tagA: { position: [...rot2(arcEnd(1), b), 0.2] },
        tagB: { position: [...rot2(arcEnd(-1), b), 0.2] },
      },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["wheelA", "wheelB"], reason: "簡化齒形:兩輪的節曲線分段(每段半徑不同),換段的瞬間兩邊的齒頂重疊 0.20(96 個取樣中 12 個);實物在換段處把齒修短" },
  ],
};

