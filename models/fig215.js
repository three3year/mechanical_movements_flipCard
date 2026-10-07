// 第 215 種(條目 214–215 的第二張圖):擋止裝置的另一個變形,運作可與第 212 種比較:左邊的輪是一個圓環,
// 環上一根銷,中間一塊月牙形的鎖定板(缺口朝右);右邊是六道槽的星形輪。環每轉一圈,銷進入星形輪的一道槽,
// 把它推過一格(六分之一圈),其餘時間月牙板的圓弧卡在星形輪兩槽之間的內凹圓弧上,星形輪不動。主動件是左輪。
// 推斷:原圖六道槽都是開通的,看不出不開槽的擋止格,這裡讓它連續轉;環在星形輪後面(原圖的虛線)。
import { TAU } from "./kit.js";
import { pedestal } from "./supports.js";
import { geneva, genevaWheel } from "./geneva.js";
import { shape, circle } from "./shapes.js";

const C = 2.25;
const RB = 1.3;
const N = 6;
const LOCK = 1.08; // 月牙板的半徑
const G = geneva({ C, rb: RB, n: N });
const TURN = Math.PI / 2 + Math.PI; // 把「A 在 B 下方」的標準方位轉成「A 在 B 左方」
const A = [-C, 0, 0];

export const step = G.at;
export const geometry = { C, RB, N, a: G.a };

const star = genevaWheel({ C, rb: RB, n: N, width: 0.26, bottom: C - G.a - 0.13, lock: LOCK + 0.03 });
// 月牙板:圓盤挖去朝銷那一側的圓(讓星形輪的尖角在換格時通過)
const crescent = Array.from({ length: 240 }, (_, i) => {
  const t = (i / 240) * TAU;
  const c = [0, 1.25];
  const b = c[0] * Math.cos(t) + c[1] * Math.sin(t);
  const disc = b * b - 1.25 * 1.25 + 0.62 * 0.62;
  const r = disc > 0 && b > 0 ? Math.min(LOCK, b - Math.sqrt(disc)) : LOCK;
  return [r * Math.cos(t), r * Math.sin(t)];
});

export default {
  figure: 215,
  parts: [
    {
      id: "wheelA",
      kind: "group",
      center: A,
      spin: 1.5,
      pieces: [
        { kind: "plate", shape: shape(circle(1.45), [circle(1.2).reverse()]), thickness: 0.12, at: [0, 0, -0.32] },
        { kind: "plate", shape: shape(crescent, [circle(0.12).reverse()]), thickness: 0.2 },
        { kind: "box", size: [0.12, 1.2, 0.08], at: [0, -0.6, -0.2] },
        { kind: "cylinder", radius: 0.1, length: 0.5, at: [0, G.a, -0.1], accent: true },
        { kind: "box", size: [0.2, 0.2, 0.25], at: [0, 0, 0.05] },
      ],
    },
    { id: "star", kind: "group", spin: RB, pieces: [{ kind: "plate", shape: shape(star, [circle(0.1).reverse()]), thickness: 0.2, mark: [0.55, 0.5], markSize: 0.07 }] },
    {
      id: "bearings",
      kind: "group",
      // 推斷(原圖只畫出輪轂):每個輪的固定軸往後伸進一座落地的軸承座
      pieces: [A, [0, 0]].flatMap(([x, y]) => [
        { kind: "cylinder", radius: 0.1, length: 0.78, at: [x, y, -0.29] },
        ...pedestal({ at: [x, y], z: -0.68, bore: 0.1, floor: -2.3, depth: 0.2 }),
      ]),
    },
  ],
  driver: { part: "wheelA", type: "rotation" },
  target: "star",
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const { b } = step(theta);
    return { parts: { wheelA: { angle: theta + TURN }, star: { angle: b + TURN } }, readouts: [] };
  },
};

