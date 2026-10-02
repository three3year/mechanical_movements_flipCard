// 第 69 種:有單一齒的小輪 B 是驅動端;B 每轉一圈,齒撥動輪 A 轉過一齒。
// 小齒沒在作動的期間,A 上齒與齒之間的圓周部分卡住 B 的圓周,起到鎖定或擋止的作用。主動件是 B(逆時針)。
import { TAU, deg, polar } from "./kit.js";
import { arcPoints, circle, polarOutline, shape } from "./shapes.js";
import { indexStep } from "./jumps.js";

const A = { center: [0, 0, 0], radius: 2.0, teeth: 30 };
const B = { center: [2.03, 0.98, 0], radius: 0.4 }; // B 的圓周伸進 A 的齒間(鎖住)
const STEP = TAU / A.teeth;
const TOWARD_A = Math.atan2(A.center[1] - B.center[1], A.center[0] - B.center[0]);
const TOOTH = deg(180); // 齒在 B 上的局部角
const WINDOW = { from: TOWARD_A - TOOTH - deg(35), span: deg(70) };

/** B 逆時針轉 v:A 的轉角(順時針,為負) */
export const aAngle = (v) => -indexStep(v, { ...WINDOW, step: STEP });
export const toothStep = STEP;

const aOutline = polarOutline((a) => {
  const f = (((a / STEP) % 1) + 1) % 1;
  return A.radius - 0.2 + 0.2 * (1 - Math.abs(f - 0.5) * 2);
}, A.teeth * 8);
const bOutline = [
  ...arcPoints(B.radius, TOOTH + deg(22), TOOTH + TAU - deg(22)),
  polar(B.radius + 0.22, TOOTH - deg(8)).slice(0, 2),
  polar(B.radius + 0.22, TOOTH + deg(8)).slice(0, 2),
];

export default {
  figure: 69,
  parts: [
    {
      id: "a",
      kind: "plate",
      center: A.center,
      shape: shape(aOutline, [circle(0.14).reverse()]),
      thickness: 0.2,
      hub: 0.3,
      circles: [0.38],
      mark: [1.2, 0],
      markSize: 0.1,
      spin: A.radius,
      label: "A",
      labelOffset: [-0.15, 0.75, 0.3],
    },
    {
      id: "b",
      kind: "plate",
      center: B.center,
      shape: shape(bOutline, [circle(0.08).reverse()]),
      thickness: 0.22,
      hub: 0.14,
      spin: 0.65,
      pieces: [{ kind: "box", size: [0.5, 0.14, 0.12], at: [0.55, 0.15, 0], angle: deg(25) }],
      label: "B",
      labelOffset: [-0.35, 0.5, 0.3],
    },
  ],
  driver: { part: "b", type: "rotation", initial: WINDOW.from + deg(25), speed: 1.4 },
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    return { parts: { b: { angle: v }, a: { angle: aAngle(v) } }, readouts: [] };
  },
};

