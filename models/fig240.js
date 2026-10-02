// 第 240 種:棘輪擋止裝置的各種變形。原圖是同一個棘輪配三種擋止:左邊沿輪緣彎曲、末端成鉤的長爪,
// 右上的平桿爪,以及下方帶彈簧片的爪 C(握把在左,彈簧片把爪頂向輪)。
// 輪逆時針轉時三個爪都被齒背頂起、滑過去;要順時針倒轉時,齒的直面卡住爪尖,輪被擋住。
// 各爪靠自重或彈簧貼著輪,作用方式為推斷(原文只說是各種變形)。主動件是輪,往回只能轉到最近的擋止處。
import { TAU, deg } from "./kit.js";
import { ratchetShape, circle, arcPoints, shape } from "./shapes.js";
import { ratchetObstacles } from "./ratchets.js";
import { swingUntilContact, dropValue, lastStop } from "./contact.js";

export const WHEEL = { teeth: 22, outer: 1.7, inner: 1.45, dir: 1 };
const PERIOD = TAU / WHEEL.teeth;
const Z = 0.2; // 各爪與輪的齒在同一平面,略往前

const rel = (pivot, pts) => pts.map(([x, y]) => [x - pivot[0], y - pivot[1]]);

// 右上:平桿爪,樞軸在右端
const BAR = {
  pivot: [3.35, 1.2],
  outline: [
    [0.2, 0.18],
    [-2.3, 0.3],
    [-2.56, 0.04],
    [-2.3, -0.12],
    [0.2, -0.18],
  ],
};
// 左:沿輪緣彎曲的長爪,末端的鉤伸進齒間
const HOOK_PIVOT = [-2.0, -0.1];
const HOOK = {
  pivot: HOOK_PIVOT,
  outline: rel(HOOK_PIVOT, [
    ...arcPoints(2.12, deg(184), deg(119)),
    [1.5 * Math.cos(deg(117)), 1.5 * Math.sin(deg(117))],
    ...arcPoints(1.88, deg(125), deg(184)),
  ]),
};
// 下:爪 C,樞軸在中間,左邊是握把,右上是爪尖
const C = {
  pivot: [0, -1.9],
  outline: [
    [-1.0, -0.3],
    [-0.9, -0.48],
    [-0.6, -0.3],
    [0.15, -0.15],
    [0.4, 0.12],
    [0.3, 0.37],
    [0.08, 0.18],
    [-0.4, 0.05],
    [-0.95, -0.1],
  ],
};

const STOPS = {
  bar: { ...BAR, from: deg(-12), into: 1 },
  hook: { ...HOOK, from: deg(8), into: -1 },
  pawlC: { ...C, from: deg(-14), into: 1 },
};

export const stopAngle = (id, wheel) => {
  const s = STOPS[id];
  return swingUntilContact({ pivot: s.pivot, outline: s.outline, from: s.from, into: s.into, sweep: deg(35), steps: 40 }, ratchetObstacles(WHEEL, wheel));
};

// 各爪落進齒間的位置 = 倒轉時被擋住的位置
export const DROPS = Object.fromEntries(Object.keys(STOPS).map((id) => [id, dropValue((w) => stopAngle(id, w), PERIOD, 240)]));
export const STOP_OUTLINES = STOPS;

const spring = shape([
  [0.32, -1.98],
  [1.5, -2.03],
  [1.82, -2.2],
  [1.55, -2.42],
  [0.72, -2.66],
  [0.5, -2.88],
  [0.62, -2.92],
  [0.78, -2.74],
  [1.6, -2.5],
  [1.94, -2.2],
  [1.55, -1.93],
  [0.34, -1.9],
]);

const plateOf = (id, s, extra) => ({
  id,
  kind: "plate",
  center: [...s.pivot, Z],
  shape: shape(s.outline, [circle(0.07).reverse()]),
  thickness: 0.12,
  ...extra,
});

export default {
  figure: 240,
  parts: [
    {
      id: "wheel",
      kind: "plate",
      shape: ratchetShape({ ...WHEEL, bore: 0.14 }),
      thickness: 0.16,
      hub: 0.38,
      circles: [0.38],
      mark: [1.0, 0],
      markSize: 0.1,
      spin: WHEEL.outer,
      center: [0, 0, Z],
    },
    plateOf("bar", BAR),
    plateOf("hook", HOOK),
    plateOf("pawlC", C, { label: "C", labelOffset: [-0.75, 0.2, 0] }),
    { id: "spring", kind: "plate", center: [0, 0, Z], shape: spring, thickness: 0.06 },
  ],
  driver: {
    part: "wheel",
    type: "rotation",
    initial: DROPS.bar,
    speed: 0.5,
    backstop: (v) => Math.max(...Object.values(DROPS).map((d) => lastStop(v, d, PERIOD))),
  },
  view: { direction: [0.08, 0.06, 1] },
  pose(wheel) {
    return {
      parts: {
        wheel: { angle: wheel },
        bar: { angle: stopAngle("bar", wheel) },
        hook: { angle: stopAngle("hook", wheel) },
        pawlC: { angle: stopAngle("pawlC", wheel) },
      },
      readouts: [],
    };
  },
};
