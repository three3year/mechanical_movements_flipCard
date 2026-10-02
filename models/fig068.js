// 第 68 種:驅動輪 B 上唯一的齒 A 嵌進輪 C 的凹槽,B 每轉一圈,C 轉過一個凹槽的距離。
// 不需要擋止裝置:B 的圓周嵌在 C 兩個凹槽之間的凹陷處,把 C 鎖住。主動件是 B(順時針)。
import { TAU, deg, polar } from "./kit.js";
import { arcPoints, circle, shape } from "./shapes.js";
import { indexStep } from "./jumps.js";

const B = { center: [-1.5, 0, 0], radius: 1.5 };
const C = { center: [1.52, 0, 0], radius: 1.5, notches: 10 };
const STEP = TAU / C.notches;
const TOOTH = deg(60); // 齒 A 在 B 上的局部角
const WINDOW = { from: TOOTH - deg(17), span: deg(34) };

/** B 順時針轉過 b:C 的轉角(逆時針) */
export const cAngle = (b) => Math.PI - STEP / 2 + indexStep(b, { ...WINDOW, step: STEP });
export const notchStep = STEP;

// B:圓盤加一個齒
const bOutline = [
  ...arcPoints(B.radius, TOOTH + deg(5), TOOTH + TAU - deg(5)),
  polar(B.radius + 0.24, TOOTH - deg(3)).slice(0, 2),
  polar(B.radius + 0.24, TOOTH + deg(3)).slice(0, 2),
];
// C:凹槽之間是凹進去的弧(讓 B 的圓周嵌入鎖住)
const cOutline = [];
for (let j = 0; j < C.notches; j++) {
  const a = j * STEP;
  cOutline.push(polar(C.radius - 0.28, a - deg(4)).slice(0, 2), polar(C.radius - 0.28, a + deg(4)).slice(0, 2));
  for (let i = 1; i < 8; i++) {
    const t = a + deg(5) + ((STEP - deg(10)) * i) / 8;
    const dip = 0.1 * Math.sin((Math.PI * i) / 8);
    cOutline.push(polar(C.radius - dip, t).slice(0, 2));
  }
}

export default {
  figure: 68,
  parts: [
    {
      id: "b",
      kind: "plate",
      center: B.center,
      shape: shape(bOutline, [circle(0.14).reverse()]),
      thickness: 0.2,
      hub: 0.3,
      circles: [0.38],
      mark: [0.9, -0.3],
      markSize: 0.09,
      spin: B.radius,
      label: "B",
      labelOffset: [0.6, 0, 0.3],
    },
    { id: "labelA", kind: "group", label: "A", labelOffset: [0, 0, 0.3] },
    {
      id: "c",
      kind: "plate",
      center: C.center,
      shape: shape(cOutline, [circle(0.14).reverse()]),
      thickness: 0.2,
      hub: 0.3,
      circles: [0.38],
      mark: [0.9, 0],
      markSize: 0.09,
      spin: C.radius,
      label: "C",
      labelOffset: [-0.55, 0, 0.3],
    },
  ],
  driver: { part: "b", type: "rotation", speed: -1.0, initial: deg(-40) },
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const tip = polar(B.radius + 0.5, TOOTH + v);
    return {
      parts: {
        b: { angle: v },
        c: { angle: cAngle(-v) },
        labelA: { position: [B.center[0] + tip[0], B.center[1] + tip[1], 0.2] },
      },
      readouts: [],
    };
  },
};
