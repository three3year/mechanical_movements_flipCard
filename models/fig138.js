// 第 138 種:底部的凸輪轉動時,靠在它上面的直立桿(尖端朝下,穿過兩個導座)做變速的交替直線運動。
// 凸輪的輪廓不規則(三瓣、一側較尖),桿端高度 = 凸輪在正上方方向的半徑。主動件是凸輪。
import { Y } from "./kit.js";
import { knifeEdge } from "./cams.js";
import { polarOutline, shape, circle } from "./shapes.js";

const radiusAt = (a) => 0.95 + 0.4 * Math.max(0, Math.cos(a - 4.2)) ** 6 + 0.2 * Math.sin(a + 0.4) + 0.12 * Math.cos(3 * a);
const UP = Math.PI / 2;

/** 凸輪轉 theta:桿端的高度 */
export const rodY = (theta) => knifeEdge(radiusAt, theta, UP);
export { radiusAt };

export default {
  figure: 138,
  parts: [
    {
      id: "cam",
      kind: "group",
      spin: 1.6,
      pieces: [
        { kind: "plate", shape: shape(circle(1.6), [circle(0.12).reverse()]), thickness: 0.06, at: [0, 0, -0.2] },
        { kind: "plate", shape: shape(polarOutline(radiusAt, 240), [circle(0.12).reverse()]), thickness: 0.22, circles: [0.36], mark: [0.6, -0.2], markSize: 0.07 },
      ],
    },
    {
      id: "rod",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape([[-0.07, 0.15], [0, 0], [0.07, 0.15]]), thickness: 0.12 },
        { kind: "cylinder", axis: Y, radius: 0.07, length: 3.2, at: [0, 1.75, 0] },
      ],
    },
    {
      id: "guides",
      kind: "group",
      pieces: [2.4, 3.6].flatMap((y) => [
        { kind: "box", size: [0.62, 0.22, 0.24], at: [0, y, 0] },
        { kind: "cylinder", radius: 0.05, length: 0.3, at: [-0.2, y, 0.05] },
        { kind: "cylinder", radius: 0.05, length: 0.3, at: [0.2, y, 0.05] },
      ]),
    },
  ],
  driver: { part: "cam", type: "rotation", speed: 0.7 },
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    return { parts: { cam: { angle: theta }, rod: { position: [0, rodY(theta), 0.05] } }, readouts: [] };
  },
};

