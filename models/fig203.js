// 第 203 種:曲面開槽臂(左下,繞下方的軸心擺動)的規則振動,給直臂(右上,繞右邊的軸心擺動)變速的振動。
// 直臂左端的銷伸進開槽臂上的彎曲長槽:槽在上段幾乎水平、往左下彎成直立,開槽臂等速擺動時,
// 銷在槽的不同部位被推動的比例不同,直臂的擺動就時快時慢。主動件是開槽臂(往復擺動)。
// 推斷:槽的形狀依原圖描出;開槽臂的擺幅。
import { swing, rot2 } from "./kit.js";
import { shape, circle, thickLine, arcPoints } from "./shapes.js";

// 槽的中心線:左邊直立一段,四分之一圓彎到上方,再水平往右
const BEND = { c: [0.2, 1.15], r: 0.98 };
const SLOT = [[-0.78, 0.2], ...arcPoints(BEND.r, Math.PI, Math.PI / 2, ...BEND.c), [1.15, 2.13]];
const PIVOT = [4.2, 2.15]; // 直臂的軸心
const PIN0 = [0.55, 2.13];
const ARM = Math.hypot(PIN0[0] - PIVOT[0], PIN0[1] - PIVOT[1]);
const FROM = -0.75;
const TO = 0.12;

/** 開槽臂轉 alpha 時:銷的位置(槽與直臂銷所走圓的交點)與直臂的轉角 */
export function arms(alpha) {
  const pts = SLOT.map((p) => rot2(p, alpha));
  let best = null;
  let along = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const d = [b[0] - a[0], b[1] - a[1]];
    const f = [a[0] - PIVOT[0], a[1] - PIVOT[1]];
    const A = d[0] * d[0] + d[1] * d[1];
    const B = 2 * (f[0] * d[0] + f[1] * d[1]);
    const C = f[0] * f[0] + f[1] * f[1] - ARM * ARM;
    const disc = B * B - 4 * A * C;
    const l = Math.sqrt(A);
    if (disc >= 0)
      for (const t of [(-B - Math.sqrt(disc)) / (2 * A), (-B + Math.sqrt(disc)) / (2 * A)]) {
        if (t < 0 || t > 1) continue;
        const p = [a[0] + d[0] * t, a[1] + d[1] * t];
        if (!best || p[1] > best.pin[1]) best = { pin: p, s: along + t * l };
      }
    along += l;
  }
  const straight = Math.atan2(best.pin[1] - PIVOT[1], best.pin[0] - PIVOT[0]);
  return { ...best, straight, length: along };
}
export const range = [FROM, TO];

const body = shape(thickLine(SLOT, 0.62), [thickLine([[-0.78, 0.38], ...SLOT.slice(1, -1), [1.0, 2.13]], 0.17).reverse()]);

export default {
  figure: 203,
  parts: [
    {
      id: "slotted",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: body, thickness: 0.15 },
        { kind: "plate", shape: shape(thickLine([[0.0, 0.0], [-0.45, 0.02], [-0.72, 0.1]], 0.7)), thickness: 0.15 },
        { kind: "cylinder", radius: 0.48, inner: 0.25, length: 0.25 },
        { kind: "cylinder", radius: 0.25, length: 0.45, accent: true },
      ],
    },
    {
      id: "straight",
      kind: "group",
      center: [...PIVOT, 0.2],
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape([[0, -0.32], [ARM, -0.17], [ARM, 0.17], [0, 0.38]], [circle(0.07, ARM, 0).reverse()]), thickness: 0.12 },
        { kind: "cylinder", radius: 0.55, inner: 0.3, length: 0.2 },
        { kind: "cylinder", radius: 0.3, length: 0.4 },
        { kind: "cylinder", radius: 0.07, length: 0.5, at: [ARM, 0, -0.15] },
      ],
    },
  ],
  driver: { part: "slotted", type: "rotation", cycle: [FROM, TO], initial: -FROM },
  target: "straight",
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const alpha = swing(v, FROM, TO);
    const { straight } = arms(alpha);
    return { parts: { slotted: { angle: alpha }, straight: { angle: straight } }, readouts: [] };
  },
};

