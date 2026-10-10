// 第 215 種(條目 214–215 的第二張圖):擋止裝置的另一個變形,運作可與第 212 種比較:左邊的輪是一個圓環,
// 環上一根銷,中間一塊月牙形的鎖定板(缺口朝右);右邊是六道槽的星形輪。環每轉一圈,銷進入星形輪的一道槽,
// 把它推過一格(六分之一圈),其餘時間月牙板的圓弧卡在星形輪兩槽之間的內凹圓弧上,星形輪不動。主動件是左輪。
// 擋止:原圖星形輪右下方那一格(右邊的槽到下方偏右的槽之間)是一整段向外凸的圓弧,不挖鎖定弧。銷推著星形輪往那一格
// 換格時,凸弧轉過來頂到月牙板的尖端,環就轉不動了;可轉的範圍由兩者外形相碰的角度決定(和第 212 種同一個做法)。
// 環在星形輪後面(原圖的虛線);環與月牙板由一支加厚的輻條連成一件(推斷:輻條在星形輪後方,經中心的套筒接到月牙板)。
import { TAU } from "./kit.js";
import { pedestal } from "./supports.js";
import { geneva, genevaWheel, convexArc } from "./geneva.js";
import { shape, circle } from "./shapes.js";
import { circlePolygon } from "./contact.js";

const C = 2.25;
const RB = 1.3;
const N = 6;
const LOCK = 1.08; // 月牙板的半徑
const PIN = 0.115; // 銷的半徑:槽寬 0.26,兩邊各留 0.015
const CONVEX = 5; // 擋止的那一格(原圖右下方)
const G = geneva({ C, rb: RB, n: N });
const TURN = Math.PI / 2 + Math.PI; // 把「A 在 B 下方」的標準方位轉成「A 在 B 左方」
const A = [-C, 0, 0];

export const step = G.at;

const slot = { C, rb: RB, n: N, width: 0.26, bottom: C - G.a - 0.13, lock: LOCK + 0.03 };
const star = genevaWheel({ ...slot, convex: [CONVEX] });
// 月牙板:圓盤挖去朝銷那一側的圓(讓星形輪的尖角在換格時通過)
const crescent = Array.from({ length: 240 }, (_, i) => {
  const t = (i / 240) * TAU;
  const c = [0, 1.25];
  const b = c[0] * Math.cos(t) + c[1] * Math.sin(t);
  const disc = b * b - 1.25 * 1.25 + 0.62 * 0.62;
  const r = disc > 0 && b > 0 ? Math.min(LOCK, b - Math.sqrt(disc)) : LOCK;
  return [r * Math.cos(t), r * Math.sin(t)];
});
/** 平面上(星形輪那一層)A 的月牙板與銷、星形輪的外形,各在自己的局部座標;測試用來量接觸 */
export const outlines = { A: [crescent, circlePolygon([0, G.a], PIN, 32)], B: star };
const INITIAL = 2 * TAU; // 原圖:銷在左邊的槽底,凸弧那一格在右下方
const range = G.stopRange({ parts: outlines.A, wheel: star, from: INITIAL });
export const geometry = { C, RB, N, a: G.a, convexArc: convexArc(slot, CONVEX) };

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
        // 輻條:從中心的套筒伸到環,深度蓋到環;整支在星形輪後方(z < −0.1),星形輪的尖角從它前面掃過
        { kind: "box", size: [0.16, 1.17, 0.24], at: [0, -0.745, -0.24] },
        // 套筒:套在固定軸上(內孔 0.12),往前接到月牙板、往後接到輻條
        { kind: "cylinder", radius: 0.3, inner: 0.12, length: 0.3, at: [0, 0, -0.2] },
        { kind: "cylinder", radius: PIN, length: 0.5, at: [0, G.a, -0.1], accent: true },
        // 前面的方形軸轂(原圖中心的小方塊):中心開孔(內孔 0.12)套在固定軸上,固定軸的前端停在軸轂裡
        { kind: "plate", shape: shape([[0.26, 0], [0, 0.26], [-0.26, 0], [0, -0.26]], [circle(0.12).reverse()]), thickness: 0.25, at: [0, 0, 0.05] },
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
  driver: { part: "wheelA", type: "rotation", range, initial: INITIAL },
  target: "star",
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const { b } = step(theta);
    return { parts: { wheelA: { angle: theta + TURN }, star: { angle: b + TURN } }, readouts: [] };
  },
};
