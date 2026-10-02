// 第 90 種:第 89 種的變形。以一個長形的軛取代偏心環:偏心輪在軛的長方形框裡上下滑動,只左右推動軛,
// 軛與兩端的桿在固定導軌內直線往復,不必擺動。偏心輪轉一圈,軛往返一次,行程是偏心距的兩倍。
import { polar } from "./kit.js";
import { shape, circle, arcPoints } from "./shapes.js";

const E = 0.55;
const DISC = 1.0;
const START = Math.PI; // 原圖:軸在偏心輪的左側
const W = DISC + 0.02; // 軛內框的半寬(貼著偏心輪)
const H = 2.0; // 軛內框的半高(容納偏心輪上下移動)

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
        { kind: "cylinder", radius: 0.3, length: 0.8 },
      ],
    },
    {
      id: "yoke",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(stadiumLoop(W + 0.32, H + 0.32), [stadiumLoop(W, H).reverse()]), thickness: 0.32 },
        { kind: "cylinder", radius: 0.14, length: 1.3, axis: [1, 0, 0], at: [-(W + 0.32) - 0.6, 0, 0] },
        { kind: "cylinder", radius: 0.14, length: 1.3, axis: [1, 0, 0], at: [W + 0.32 + 0.6, 0, 0] },
      ],
    },
  ],
  driver: { part: "shaft", type: "rotation" },
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const { x } = scotch(theta);
    return { parts: { shaft: { angle: theta }, yoke: { position: [x, 0, 0] } }, readouts: [] };
  },
};
