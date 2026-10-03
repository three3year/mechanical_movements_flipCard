// 第 100 種:快速回程曲柄運動,用於刨形機。曲柄等速轉動,曲柄銷在開槽桿的長槽裡滑動,開槽桿繞右側的樞軸擺動。
// 樞軸在曲柄圓之外,曲柄銷走過的兩段弧(對應桿往兩個方向擺)長短不同,所以桿一個方向擺得慢(切削行程)、
// 另一個方向擺得快(回程)。主動件是曲柄。
import { deg, polar } from "./kit.js";
import { angleOf } from "./linkage.js";
import { shape, circle, stadium } from "./shapes.js";

const CRANK = { center: [-1.1, -0.35, 0], radius: 0.95 };
const PIVOT = [1.45, 0.05, 0.3];
const START = deg(110);

/** 曲柄轉 theta:曲柄銷位置、開槽桿(從樞軸指向銷)的方向角 */
export function quickReturn(theta) {
  const p = polar(CRANK.radius, theta + START);
  const pin = [CRANK.center[0] + p[0], CRANK.center[1] + p[1], 0];
  return { pin, lever: angleOf(PIVOT, pin) };
}

export default {
  figure: 100,
  parts: [
    {
      id: "crank",
      kind: "group",
      center: CRANK.center,
      spin: CRANK.radius,
      pieces: [
        { kind: "plate", shape: shape(stadium(CRANK.radius, 0.62).outline, [circle(0.18).reverse()]), thickness: 0.12, angle: START },
        { kind: "cylinder", radius: 0.3, length: 0.3 },
        { kind: "cylinder", radius: 0.2, length: 0.55, at: [...polar(CRANK.radius, START).slice(0, 2), 0.2], accent: true },
      ],
    },
    {
      id: "lever",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        // 槽在樞軸的左方(局部 −x),樞軸右方是伸出的桿
        // 曲柄銷離樞軸 1.6–3.5,槽要涵蓋這一段
        { kind: "plate", shape: shape(stadium(4.45, 0.75).outline.map(([x, y]) => [x - 3.95, y]), [stadium(3.15, 0.42).outline.map(([x, y]) => [x - 3.75, y]).reverse(), circle(0.22).reverse()]), thickness: 0.14 },
        { kind: "cylinder", radius: 0.42, inner: 0.22, length: 0.2 },
        { kind: "cylinder", radius: 0.16, length: 2.1, axis: [1, 0, 0], at: [1.4, 0, 0] },
      ],
    },
    { id: "pivot", kind: "cylinder", center: PIVOT, radius: 0.2, length: 0.45 },
  ],
  driver: { part: "crank", type: "rotation" },
  target: "lever", // 慢去快回的開槽桿
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const { lever } = quickReturn(theta);
    return { parts: { crank: { angle: theta }, lever: { angle: lever + Math.PI } }, readouts: [] };
  },
};
