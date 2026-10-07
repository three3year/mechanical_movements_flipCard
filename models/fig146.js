// 第 146 種:圓盤上的曲柄銷在軛的溝槽內作動,圓盤連續旋轉時軛桿上下往復。溝槽做成特別的彎曲形狀,
// 讓軛的位移與圓盤轉角成正比(均勻的往復直線運動)。溝槽的形狀就是「曲柄銷相對於軛的軌跡」,由此算出。
// 主動件是圓盤。
import { Y, TAU } from "./kit.js";
import { shape, circle, arcPoints } from "./shapes.js";
import { pedestal } from "./supports.js";
// 軛的位置由曲柄銷推溝槽決定(動力重演:軛是上下的自由滑塊,只被溝槽的兩側推)。上下的軛桿加長、穿在兩側立柱伸出的導環裡,
// 圓盤的軸往後伸進軸承座(導環、立柱、軸承座是推斷)。
const GUIDES = [[2.75, 0.25], [-2.7, -0.2]]; // 上下導環的高度與深度:軛上下 ±0.75 時軛桿始終穿過導環
const FLOOR = -4.1;

const R = 1.55; // 圓盤
const PIN = 1.1; // 曲柄銷離中心的距離
const AMP = 0.75; // 軛的半行程(< 曲柄半徑)
const START = Math.PI / 2; // 原圖:曲柄銷在正上方

/** 圓盤轉 theta:軛的高度(三角波,與轉角成正比) */
export const yokeY = (theta) => ((2 * AMP) / Math.PI) * Math.asin(Math.sin(START + theta));
const pinAt = (theta) => [PIN * Math.cos(START + theta), PIN * Math.sin(START + theta)];

// 溝槽中心線(軛的局部座標):圓盤轉一圈,曲柄銷相對軛走過的封閉曲線
const groove = Array.from({ length: 240 }, (_, i) => {
  const t = (i / 240) * TAU;
  const [x, y] = pinAt(t);
  return [x, y - yokeY(t), 0.2];
});
const offsetGroove = (d) =>
  groove.map((p, i) => {
    const a = groove[(i + 239) % 240];
    const b = groove[(i + 1) % 240];
    const tx = b[0] - a[0];
    const ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1;
    return [p[0] + (ty / l) * d, p[1] - (tx / l) * d, 0.2];
  });

export default {
  figure: 146,
  parts: [
    {
      id: "disc",
      kind: "group",
      spin: R,
      pieces: [
        { kind: "plate", shape: shape(circle(R), [circle(0.25).reverse()]), thickness: 0.15, circles: [0.42] },
        { kind: "cylinder", radius: 0.12, length: 0.45, at: [PIN * Math.cos(START), PIN * Math.sin(START), 0.15], accent: true },
        { kind: "cylinder", radius: 0.25, length: 0.8, at: [0, 0, -0.45] }, // 軸:往後伸進軸承座
      ],
    },
    {
      id: "yoke",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape([...arcPoints(1.95, 0, Math.PI, 0, -0.25), [-1.95, -0.25], [-1.65, -0.25], ...arcPoints(1.65, Math.PI, 0, 0, -0.25), [1.95, -0.25]]), thickness: 0.15, at: [0, 0, 0.25] },
        // 溝兩側的凸條:淨寬比曲柄銷粗一點點,銷才不會被夾住
        { kind: "tube", points: offsetGroove(0.17), radius: 0.035, closed: true },
        { kind: "tube", points: offsetGroove(-0.17), radius: 0.035, closed: true },
        { kind: "cylinder", axis: Y, radius: 0.13, length: 2.2, at: [0, 2.75, 0.25] },
        { kind: "cylinder", axis: Y, radius: 0.13, length: 2.2, at: [0, -2.7, -0.2] },
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        ...pedestal({ at: [0, 0], z: -0.75, bore: 0.25, floor: FLOOR }),
        ...[-1, 1].flatMap((side) => [
          { kind: "box", size: [0.2, 3.0 - FLOOR, 0.2], at: [side * 2.4, (3.0 + FLOOR) / 2, 0.02] },
          { kind: "box", size: [0.8, 0.18, 0.6], at: [side * 2.4, FLOOR - 0.09, 0.02] },
        ]),
        ...GUIDES.flatMap(([y, z]) => [
          { kind: "cylinder", axis: Y, radius: 0.22, inner: 0.13, length: 0.3, at: [0, y, z] },
          { kind: "box", size: [2.2, 0.16, 0.16], at: [-1.3, y, z] },
          { kind: "box", size: [2.2, 0.16, 0.16], at: [1.3, y, z] },
        ]),
      ],
    },
  ],
  driver: { part: "disc", type: "rotation" },
  replay: {
    free: { yoke: { slide: [0, 1, 0] } },
    expect: [
      // 銷在 π/2 經過 8 字形溝的交叉口(那裡沒有溝壁),軛在那一瞬間會落後一點;中途的事件取交叉口之前
      { at: Math.PI / 4, part: "yoke", label: "曲柄銷沿溝槽把軛往下推", quote: "透過圓盤上作動於軛狀件溝槽內的手腕或曲柄銷,會產生軛桿的往復直線運動" },
      { at: Math.PI, part: "yoke", label: "圓盤轉半圈,軛到另一端" },
      { part: "yoke", label: "轉完一圈,軛回到起點" },
    ],
  },
  target: "yoke",
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    return { parts: { disc: { angle: theta }, yoke: { position: [0, yokeY(theta), 0] } }, readouts: [] };
  },
};
