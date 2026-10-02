// 第 153 種:圓周運動轉換為交替直線運動。旋轉圓盤上的凸柱撞擊水平桿下方的凸塊,把桿往右推;
// 回程靠左邊的曲柄搖臂(肘節槓桿):下一根凸柱推它的下臂,上臂便撞擊水平桿前端的凸柱,把桿推回左邊。
// 圓盤上有兩根相隔半圈的凸柱,每半圈各推一次。主動件是圓盤(順時針)。推動的時序以平順的過渡表示。
import { deg, polar } from "./kit.js";
import { cycloid } from "./jumps.js";
import { shape, circle, stadium } from "./shapes.js";

const DISC = { center: [0, -0.35, 0], radius: 1.45, studR: 1.18 };
const STROKE = 0.55;
const BAR_Y = 1.55;
const CRANK = { pivot: [-2.35, 0.0, 0.25], up: 1.6, down: 1.3, upAt: deg(62), downAt: deg(-20) };
const RIGHT = { from: deg(5), span: deg(45) }; // 這一段時間內凸柱推凸塊往右
const LEFT = { from: deg(95), span: deg(45) }; // 這一段時間內凸柱推搖臂,桿往左

/** 圓盤順時針轉過 c:水平桿的位移與搖臂的轉角 */
export function shuttle(c) {
  const u = ((c % Math.PI) + Math.PI) % Math.PI; // 兩根凸柱,每半圈重複
  const right = cycloid((u - RIGHT.from) / RIGHT.span);
  const left = cycloid((u - LEFT.from) / LEFT.span);
  const x = STROKE * (right - left);
  return { x, crank: -Math.asin(x / CRANK.up) };
}
export const stroke = STROKE;

export default {
  figure: 153,
  parts: [
    {
      id: "disc",
      kind: "group",
      center: DISC.center,
      spin: DISC.radius,
      pieces: [
        { kind: "plate", shape: shape(circle(DISC.radius), [circle(0.12).reverse()]), thickness: 0.12, circles: [0.32] },
        { kind: "cylinder", radius: 0.13, length: 0.45, at: [...polar(DISC.studR, deg(115)).slice(0, 2), 0.25], accent: true },
        { kind: "cylinder", radius: 0.13, length: 0.45, at: [...polar(DISC.studR, deg(-65)).slice(0, 2), 0.25] },
      ],
    },
    {
      id: "bar",
      kind: "group",
      pieces: [
        { kind: "box", size: [6.4, 0.42, 0.3], at: [0, BAR_Y, 0.25] },
        { kind: "box", size: [0.35, 0.6, 0.3], at: [0.35, BAR_Y - 0.5, 0.25] },
        { kind: "cylinder", radius: 0.14, length: 0.4, at: [-2.6, BAR_Y - 0.32, 0.35] },
      ],
    },
    {
      id: "crank",
      kind: "group",
      center: CRANK.pivot,
      arrow: false,
      pieces: [
        { kind: "plate", shape: stadium(CRANK.up, 0.24), thickness: 0.12, angle: CRANK.upAt },
        { kind: "plate", shape: stadium(CRANK.down, 0.24), thickness: 0.12, angle: CRANK.downAt },
        { kind: "cylinder", radius: 0.22, inner: 0.1, length: 0.2 },
      ],
    },
    {
      id: "rollers",
      kind: "group",
      pieces: [-2.6, 2.4].map((x) => ({ kind: "cylinder", radius: 0.3, inner: 0.13, length: 0.3, at: [x, BAR_Y - 0.5, 0] })),
    },
  ],
  driver: { part: "disc", type: "rotation", speed: -0.9 },
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const { x, crank } = shuttle(-v);
    return { parts: { disc: { angle: v }, bar: { position: [x, 0, 0] }, crank: { angle: crank } }, readouts: [] };
  },
};
