// 第 76 種:登錄或計算轉數的裝置。撥爪 B 支承於固定樞軸 C 上;大輪每轉一圈,輪上的凸柱 D 撞擊撥爪的右端一次,
// 使撥爪靠近棘輪 A 的那一端抬起,把 A 轉動一齒。D 通過之後,撥爪憑自重回到原位,
// 靠近 A 的那一端是鉸接的,能越過棘輪的齒(此時 A 不動)。原圖大輪只畫出一部分,畫面也只框住機構。
// 主動件是大輪(順時針轉)。
import { TAU, deg, polar } from "./kit.js";
import { ratchetShape, circle, shape, stadium } from "./shapes.js";
import { liftAndDrop, cycleOf } from "./jumps.js";

const A = { center: [-1.15, 0.3, 0], teeth: 24, outer: 1.45, inner: 1.18, dir: 1 };
const WHEEL = { center: [-1.15, 0.3, 0], rim: 3.75, width: 0.42 };
const C = [1.45, -0.55, 0.25];
const TILT = deg(11);
const D0 = deg(28); // 主動量為 0 時凸柱 D 的角度(在撥爪右端上方)
const PHASE = { liftFrom: 0.03, liftTo: 0.085, dropTo: 0.1 };
const PITCH = TAU / A.teeth;

/** 大輪順時針轉過 v:撥爪抬起的比例、棘輪 A 的轉角 */
export function register(v) {
  const { k, u } = cycleOf(v, TAU);
  const { height } = liftAndDrop(u, PHASE);
  const lifted = u < PHASE.liftFrom ? 0 : u < PHASE.liftTo ? height : 1;
  return { height, a: (k + lifted) * PITCH };
}
export const pitch = PITCH;

// 撥爪:以樞軸 C 為原點;左邊是靠近 A 的鉸接端 B,右邊伸到大輪輪緣內側被 D 撞擊
const lever = shape(
  [
    [-1.15, -0.12],
    [0.95, -0.14],
    [1.05, 0.0],
    [0.95, 0.14],
    [-1.15, 0.14],
  ],
  [circle(0.06).reverse()],
);
const toe = shape([
  [-1.12, 0.12],
  [-1.15, -0.3],
  [-1.5, -0.42],
  [-1.68, -0.2],
  [-1.55, 0.18],
]);

export default {
  figure: 76,
  parts: [
    {
      id: "wheel",
      kind: "group",
      center: WHEEL.center,
      spin: WHEEL.rim,
      pieces: [
        { kind: "cylinder", radius: WHEEL.rim, inner: WHEEL.rim - WHEEL.width, length: 0.2 },
        { kind: "cylinder", radius: 0.09, length: 0.6, at: [...polar(WHEEL.rim - 0.62, D0).slice(0, 2), 0.25], accent: true },
        { kind: "box", size: [0.5, 0.12, 0.12], at: [...polar(WHEEL.rim - 0.4, D0).slice(0, 2), 0], angle: D0 },
      ],
    },
    {
      id: "ratchet",
      kind: "plate",
      center: A.center,
      shape: ratchetShape({ ...A, bore: 0.12 }),
      thickness: 0.18,
      hub: 0.3,
      circles: [0.38],
      mark: [0.8, 0],
      markSize: 0.09,
      spin: A.outer,
      label: "A",
      labelOffset: [-0.2, -0.75, 0.3],
    },
    {
      id: "lever",
      kind: "group",
      center: C,
      arrow: false,
      pieces: [
        { kind: "plate", shape: lever, thickness: 0.1 },
        { kind: "plate", shape: toe, thickness: 0.12 },
        { kind: "cylinder", radius: 0.07, length: 0.25, at: [-1.12, 0, 0] },
      ],
      label: "B",
      labelOffset: [-1.35, -0.6, 0.2],
    },
    {
      id: "bracket",
      kind: "group",
      pieces: [
        { kind: "plate", shape: stadium(0.9, 0.3), thickness: 0.08, at: [C[0] - 0.2, C[1], 0.1] },
        { kind: "cylinder", radius: 0.09, length: 0.4, at: [C[0], C[1], 0.15] },
        { kind: "box", size: [2.2, 0.08, 0.08], at: [1.4, 1.0, 0.1] },
        { kind: "box", size: [2.0, 0.08, 0.08], at: [1.5, 0.45, 0.1] },
      ],
      label: "C",
      labelOffset: [C[0] + 0.32, C[1] + 0.05, 0.3],
    },
    { id: "studLabel", kind: "group", label: "D", labelOffset: [0.3, 0.1, 0.3] },
  ],
  // 大輪順時針轉(轉角為負)
  driver: { part: "wheel", type: "rotation", speed: -0.6 },
  target: "ratchet", // 記錄轉數的棘輪 A
  view: { direction: [0.06, 0.05, 1], fit: ["ratchet", "lever", "bracket"] },
  pose(v) {
    const { height, a } = register(-v);
    const stud = polar(WHEEL.rim - 0.62, D0 + v);
    return {
      parts: {
        wheel: { angle: v },
        ratchet: { angle: a },
        lever: { angle: -TILT * height },
        studLabel: { position: [WHEEL.center[0] + stud[0], WHEEL.center[1] + stud[1], 0.25] },
      },
      readouts: [],
    };
  },
};
