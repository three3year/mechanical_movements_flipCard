// 第 63 種:跳躍式的旋轉運動,用於計量器與轉數計數器。右側圓盤上的三根插銷依序把左側的落板
// (由彈簧承載)連同棘爪抬起;插銷一離開,彈簧把落板猛然往下拋,棘爪撞擊星形輪的齒,
// 使星形輪快速轉過一格。每通過一根插銷,動作重複一次。主動件是右側圓盤。
// 抬起與落下的時序由插銷位置決定(liftAndDrop);棘爪隨落板一起動(簡化:原文中棘爪先落入下一格)。
import { TAU, deg, polar, smooth } from "./kit.js";
import { circle, polarOutline, shape } from "./shapes.js";
import { liftAndDrop, cycleOf } from "./jumps.js";

const STAR = { center: [-0.75, -0.95, 0], points: 12 };
const DISC = { center: [2.05, -0.2, 0], radius: 1.32, pins: 3, pinR: 0.95 };
const PIVOT = [-0.55, 1.75, 0.3];
const LIFT = deg(14);
const PHASE = { liftFrom: 0.1, liftTo: 0.78, dropTo: 0.86 };

const starOutline = polarOutline((a) => {
  const f = (((a / (TAU / STAR.points)) % 1) + 1) % 1;
  return 0.75 + 0.6 * Math.max(0, 1 - Math.abs(f - 0.5) * 2) ** 1.3;
}, 240);

/** 圓盤順時針轉過 v(v > 0)時:落板抬起的比例、星形輪的轉角 */
export function counter(v) {
  const { k, u } = cycleOf(v, TAU / DISC.pins);
  const { height, dropped } = liftAndDrop(u, PHASE);
  const star = -(k + dropped) * (TAU / STAR.points);
  return { height, star, k };
}
export const starPitch = TAU / STAR.points;
export const pinPeriod = TAU / DISC.pins;

// 落板:以樞軸為原點;左邊是承彈簧的尾端,右邊伸到圓盤上方、端頭(虛線處)靠在插銷上
const drop = shape(
  [
    [-1.55, -0.55],
    [-1.6, -0.4],
    [-0.95, -0.3],
    [-0.55, 0.25],
    [-0.1, 0.5],
    [0.5, 0.42],
    [1.05, 0.05],
    [2.6, -0.35],
    [2.95, -0.8],
    [2.7, -1.25],
    [2.1, -1.45],
    [1.85, -0.85],
    [0.75, -0.55],
    [0.2, -0.8],
    [-0.6, -0.7],
    [-1.1, -0.95],
  ],
  [circle(0.42).reverse()],
);
// 棘爪:從落板中段垂下,爪尖伸進星形輪右上方的齒間
const pawl = shape([
  [0.55, -0.62],
  [0.85, -0.66],
  [0.95, -1.35],
  [0.75, -1.85],
  [0.6, -1.3],
]);

export default {
  figure: 63,
  parts: [
    {
      id: "disc",
      kind: "plate",
      center: DISC.center,
      shape: shape(circle(DISC.radius), [circle(0.12).reverse()]),
      thickness: 0.2,
      hub: 0.3,
      spin: DISC.radius,
      pieces: Array.from({ length: DISC.pins }, (_, i) => ({
        kind: "cylinder",
        radius: 0.09,
        length: 0.5,
        at: [...polar(DISC.pinR, deg(150) + (i * TAU) / DISC.pins).slice(0, 2), 0.25],
        accent: i === 0,
      })),
    },
    {
      id: "star",
      kind: "plate",
      center: STAR.center,
      shape: shape(starOutline, [circle(0.12).reverse()]),
      thickness: 0.2,
      hub: 0.28,
      mark: [0.5, 0],
      markSize: 0.08,
      spin: 1.35,
    },
    {
      id: "drop",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "plate", shape: drop, thickness: 0.12 },
        { kind: "plate", shape: pawl, thickness: 0.1, at: [0, 0, -0.12] },
        { kind: "cylinder", radius: 0.42, inner: 0.3, length: 0.2 },
        { kind: "box", size: [0.5, 0.06, 0.08], at: [0, 0, 0.12], angle: deg(60) },
      ],
    },
    { id: "spring", kind: "group", pieces: [{ kind: "cylinder", radius: 0.035, length: 1.4, axis: [1, 0.05, 0], at: [-2.45, 1.2, 0.3] }, { kind: "cylinder", radius: 0.09, length: 0.3, at: [-1.6, 0.9, 0.3] }] },
  ],
  // 圓盤順時針轉(轉角為負);自動播放時主動量往負的方向走
  driver: { part: "disc", type: "rotation", speed: -1.2 },
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const { height, star } = counter(-v);
    return {
      parts: { disc: { angle: v }, star: { angle: star }, drop: { angle: LIFT * smooth(height) } },
      readouts: [],
    };
  },
};

