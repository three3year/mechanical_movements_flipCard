// 第 146 種:圓盤上的曲柄銷在軛的溝槽內作動,圓盤連續旋轉時軛桿上下往復。溝槽做成特別的彎曲形狀,
// 讓軛的位移與圓盤轉角成正比(均勻的往復直線運動)。溝槽的形狀就是「曲柄銷相對於軛的軌跡」,由此算出。
// 主動件是圓盤。
import { Y, TAU } from "./kit.js";
import { shape, circle, arcPoints } from "./shapes.js";

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
      ],
    },
    {
      id: "yoke",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape([...arcPoints(1.95, 0, Math.PI, 0, -0.25), [-1.95, -0.25], [-1.65, -0.25], ...arcPoints(1.65, Math.PI, 0, 0, -0.25), [1.95, -0.25]]), thickness: 0.15, at: [0, 0, 0.25] },
        { kind: "tube", points: offsetGroove(0.15), radius: 0.035, closed: true },
        { kind: "tube", points: offsetGroove(-0.15), radius: 0.035, closed: true },
        { kind: "cylinder", axis: Y, radius: 0.13, length: 1.6, at: [0, 2.45, 0.25] },
        { kind: "cylinder", axis: Y, radius: 0.13, length: 1.6, at: [0, -2.4, -0.2] },
      ],
    },
  ],
  driver: { part: "disc", type: "rotation" },
  target: "yoke",
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    return { parts: { disc: { angle: theta }, yoke: { position: [0, yokeY(theta), 0] } }, readouts: [] };
  },
};
