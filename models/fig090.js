// 第 90 種:第 89 種的變形。以一個長形的軛取代偏心環:偏心輪在軛的長方形框裡上下滑動,只左右推動軛,
// 軛與兩端的桿在固定導軌內直線往復,不必擺動。偏心輪轉一圈,軛往返一次,行程是偏心距的兩倍。
import { polar } from "./kit.js";
import { shape, circle, arcPoints } from "./shapes.js";
import { pedestal, squareGuide } from "./supports.js";

const E = 0.55;
const DISC = 1.0;
const START = Math.PI; // 原圖:軸在偏心輪的左側
const W = DISC + 0.02; // 軛內框的半寬(貼著偏心輪)
const H = 2.0; // 軛內框的半高(容納偏心輪上下移動)
const ROD = 2.0; // 軛兩端的桿長
const GUIDE_X = W + 0.32 + 1.05; // 導座:軛左右移動 ±E,桿始終穿過這裡

/** 軸轉 theta:偏心輪圓心、軛的水平位置 */
export function scotch(theta) {
  const c = polar(E, theta + START - Math.PI);
  return { c, x: c[0] };
}
export const throwRadius = E;

const stadiumLoop = (w, h) => [...arcPoints(w, 0, Math.PI, 0, h - w), ...arcPoints(w, Math.PI, 2 * Math.PI, 0, -(h - w))];

export default {
  figure: 90,
  parts: [
    {
      id: "shaft",
      kind: "group",
      spin: DISC,
      pieces: [
        { kind: "plate", shape: shape(circle(DISC, E, 0), [circle(0.3).reverse()]), thickness: 0.3, mark: [E + 0.55, 0], markSize: 0.09 },
        { kind: "cylinder", radius: 0.3, length: 1.3, at: [0, 0, -0.25] }, // 軸,往後伸進軸承座
      ],
    },
    {
      id: "yoke",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(stadiumLoop(W + 0.32, H + 0.32), [stadiumLoop(W, H).reverse()]), thickness: 0.32 },
        { kind: "cylinder", radius: 0.14, length: ROD, axis: [1, 0, 0], at: [-(W + 0.32) - ROD / 2, 0, 0] },
        { kind: "cylinder", radius: 0.14, length: ROD, axis: [1, 0, 0], at: [W + 0.32 + ROD / 2, 0, 0] },
      ],
    },
    {
      // 兩端的固定導座(原文「運作於固定導軌內的桿」;導座的樣子是推斷):軸套立在底座上
      id: "guides",
      kind: "group",
      pieces: [-1, 1].flatMap((s) => [
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.28, inner: 0.15, length: 0.32, at: [s * GUIDE_X, 0, 0] },
        { kind: "box", size: [0.3, H + 0.4, 0.22], at: [s * GUIDE_X, -(H + 0.4) / 2 - 0.25, 0] },
        { kind: "box", size: [0.9, 0.16, 0.6], at: [s * GUIDE_X, -H - 0.7, 0] },
      ]).concat(pedestal({ at: [0, 0], z: -0.7, bore: 0.31, floor: -H - 0.7 })), // 軸承座在軛的後面
    },
  ],
  driver: { part: "shaft", type: "rotation" },
  target: "yoke", // 直線往復的軛
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const { x } = scotch(theta);
    return { parts: { shaft: { angle: theta }, yoke: { position: [x, 0, 0] } }, readouts: [] };
  },
};
