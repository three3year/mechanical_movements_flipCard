// 第 156 種:旋轉圓盤上的曲柄銷在曲柄搖臂(肘節槓桿)長臂的溝槽內作動;搖臂繞下方的樞軸擺動,
// 短臂的末端接著往下的桿,把圓周運動轉換為變速的交替直線運動。主動件是圓盤。
import { deg, polar, add } from "./kit.js";
import { angleOf } from "./linkage.js";
import { shape, circle, stadium } from "./shapes.js";

const DISC = { center: [0, 0.6, 0], radius: 1.45, pin: 1.0 };
const PIVOT = [0.75, -1.35, 0.3];
const SHORT = { length: 1.95, at: deg(-90) }; // 短臂相對長臂(局部 +X 沿溝槽)的角度
const START = deg(140); // 原圖:曲柄銷在左上方

/** 圓盤轉 theta:搖臂的方向角與短臂末端(接桿處) */
export function bellCrank(theta) {
  const pin = add(DISC.center, polar(DISC.pin, START + theta));
  const arm = angleOf(PIVOT, pin);
  const end = add(PIVOT, polar(SHORT.length, arm + SHORT.at));
  return { arm, end, pin };
}

export default {
  figure: 156,
  parts: [
    {
      id: "disc",
      kind: "group",
      center: DISC.center,
      spin: DISC.radius,
      pieces: [
        { kind: "plate", shape: shape(circle(DISC.radius), [circle(0.1).reverse()]), thickness: 0.1, at: [0, 0, -0.2] },
        { kind: "cylinder", radius: 0.2, length: 0.55, at: [...polar(DISC.pin, START).slice(0, 2), 0.05], accent: true },
        { kind: "cylinder", radius: 0.16, length: 0.3, at: [0, 0, -0.1] },
      ],
    },
    {
      id: "crank",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(stadium(3.3, 0.6).outline.map(([x, y]) => [x, y]), [stadium(2.4, 0.3).outline.map(([x, y]) => [x + 0.7, y]).reverse(), circle(0.18).reverse()]), thickness: 0.12 },
        { kind: "plate", shape: shape(stadium(SHORT.length, 0.36).outline, [circle(0.12, SHORT.length, 0).reverse()]), thickness: 0.12, angle: SHORT.at },
        { kind: "cylinder", radius: 0.38, inner: 0.18, length: 0.2 },
      ],
    },
    { id: "rod", kind: "group", pieces: [{ kind: "box", size: [0.2, 2.0, 0.12], at: [0, -1.1, 0] }, { kind: "cylinder", radius: 0.24, inner: 0.12, length: 0.16 }] },
  ],
  driver: { part: "disc", type: "rotation" },
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const { arm, end } = bellCrank(theta);
    return { parts: { disc: { angle: theta }, crank: { angle: arm }, rod: { position: [end[0], end[1], 0.45] } }, readouts: [] };
  },
};
