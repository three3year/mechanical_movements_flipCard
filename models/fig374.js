// 第 374 種:以一條無端皮帶把踏板的動作變成軸的旋轉。皮帶從踏板中段的滾子繞到上方軸上的偏心輪(原圖虛線圓是
// 偏心輪中心繞軸走的圓);踩下踏板時皮帶拉著偏心輪往下,軸轉半圈;偏心輪轉過底部後再把踏板拉起。主動件是上方的軸
// (原機構以腳踩踏板,模型讓讀者轉軸,看踏板怎麼跟著上下)。
// 推斷:皮帶長度不變,所以滾子中心與偏心輪中心的距離固定;踏板的支點在右端。
import { Z, routeBelt } from "./kit.js";
import { circleCircle, angleOf } from "./linkage.js";
import { shape, circle, thickLine } from "./shapes.js";

const SHAFT = [0.55, 1.6, 0];
const ECC = 0.55; // 偏心距
const DISK = 0.75; // 偏心輪半徑
const ROLLER = 0.18;
const PIVOT = [2.0, -1.95, 0]; // 踏板支點
const ARM = 1.75; // 支點到滾子
export const SPAN = 3.15; // 滾子中心到偏心輪中心(皮帶長度不變)

/** 軸轉 theta → 偏心輪中心、滾子中心、踏板角 */
export function treadle(theta) {
  const e = [SHAFT[0] + ECC * Math.cos(theta), SHAFT[1] + ECC * Math.sin(theta), 0];
  const roller = circleCircle(PIVOT, ARM, e, SPAN, 1).point;
  return { e, roller, angle: angleOf(PIVOT, roller) };
}

export default {
  figure: 374,
  parts: [
    { id: "frame", kind: "group", pieces: [{ kind: "cylinder", radius: 0.1, length: 0.5, at: SHAFT }, { kind: "cylinder", radius: 0.1, length: 0.4, at: PIVOT }] },
    {
      id: "shaft",
      kind: "group",
      center: SHAFT,
      spin: ECC + DISK,
      pieces: [
        { kind: "plate", shape: shape(circle(DISK), [circle(0.14, -ECC, 0).reverse()]), thickness: 0.2, at: [ECC, 0, 0] },
        { kind: "cylinder", radius: 0.12, length: 0.5 },
        { kind: "box", size: [0.15, 0.15, 0.22], at: [ECC + DISK - 0.15, 0, 0], accent: true },
      ],
    },
    {
      id: "treadle",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0.15, 0], [-ARM - 1.8, 0]], 0.14), [circle(0.06).reverse()]), thickness: 0.12, at: [0, 0, -0.1] },
        { kind: "cylinder", radius: ROLLER, length: 0.2, at: [-ARM, 0, 0.1] },
      ],
    },
    { id: "belt", kind: "belt" },
  ],
  driver: { part: "shaft", type: "rotation" },
  view: { direction: [0.03, 0.04, 1] },
  pose(theta) {
    const t = treadle(theta);
    const belt = routeBelt([
      { center: [t.e[0], t.e[1], 0], axis: Z, radius: DISK, sense: 1 },
      { center: [t.roller[0], t.roller[1], 0], axis: Z, radius: ROLLER, sense: 1 },
    ]);
    return {
      parts: { shaft: { angle: theta }, treadle: { angle: t.angle + Math.PI } },
      paths: { belt: { points: belt.points, closed: true, phase: theta * DISK } },
      readouts: [],
    };
  },
};
