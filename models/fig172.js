// 第 172 種:一種獲得蛋形橢圓運動的方法。左邊的曲柄(上方的圓是軸、下方的圓是曲柄銷)帶著一根長連桿,
// 連桿右端的眼沿一直線往返;連桿上靠近曲柄的一點(小圓)畫出蛋形的橢圓(虛線,這裡以描線畫出)。
// 原文只有一句;右端沿直線(與軸心同高)往返的導路原圖沒畫,是推斷。主動件是曲柄。
import { deg, polar, add, sub, scale } from "./kit.js";
import { shape, circle, polygon, stadium } from "./shapes.js";

const SHAFT = [-2.65, 0.0, 0];
const CRANK = 1.1;
const ROD = 5.35;
const POINT = 0.35; // 小圓在連桿上的位置(從曲柄銷算起的比例)
const START = deg(-125.8); // 原圖:曲柄銷在軸的左下方

/** 曲柄轉 theta:曲柄銷、連桿右端與描點的位置 */
export function oval(theta) {
  const pin = add(SHAFT, polar(CRANK, START + theta));
  const end = [pin[0] + Math.sqrt(ROD * ROD - (pin[1] - SHAFT[1]) ** 2), SHAFT[1], 0];
  const point = add(pin, scale(sub(end, pin), POINT));
  return { pin, end, point };
}

const N = 120;
const egg = Array.from({ length: N }, (_, i) => {
  const p = oval((i / N) * 2 * Math.PI).point;
  return [p[0], p[1], 0.02];
});

export default {
  figure: 172,
  parts: [
    {
      id: "crank",
      kind: "group",
      center: SHAFT,
      spin: CRANK + 0.45,
      pieces: [
        { kind: "plate", shape: stadium(CRANK, 0.5, 0.15), thickness: 0.1, angle: START },
        { kind: "cylinder", radius: 0.4, inner: 0.2, length: 0.3, mark: true },
        { kind: "cylinder", radius: 0.32, inner: 0.15, length: 0.3, at: [...polar(CRANK, START).slice(0, 2), 0.25] },
      ],
    },
    { id: "rod", kind: "link", width: 0.22, thickness: 0.1 },
    { id: "point", kind: "cylinder", radius: 0.12, inner: 0.05, length: 0.2, arrow: false },
    { id: "eye", kind: "plate", shape: shape(polygon(8, 0.42, Math.PI / 8), [circle(0.2).reverse()]), thickness: 0.25, arrow: false },
    { id: "egg", kind: "trace" },
  ],
  driver: { part: "crank", type: "rotation" },
  target: "point", // 畫出蛋形橢圓的點
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const { pin, end, point } = oval(theta);
    return {
      parts: {
        crank: { angle: theta },
        rod: { from: [pin[0], pin[1], 0.35], to: [end[0], end[1], 0.35] },
        point: { position: [point[0], point[1], 0.5] },
        eye: { position: [end[0], end[1], 0.35] },
      },
      paths: { egg: { points: egg, closed: true } },
      readouts: [],
    };
  },
};
