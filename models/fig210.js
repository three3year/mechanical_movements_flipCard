// 第 210 種:轉動承載曲面開槽臂的軸,可給垂直桿變速的直線運動。垂直桿在上下兩個導座中只能上下滑動,
// 桿上的銷伸進開槽臂的彎曲長槽;臂轉動時銷沿槽滑動,槽在不同部位的斜度不同,桿上下移動的速度就時快時慢。
// 主動件是開槽臂的軸(在槽容許的範圍內往復轉動)。
// 推斷:槽的形狀依原圖描出;臂轉動的範圍。
import { swing, rot2 } from "./kit.js";
import { shape, circle, thickLine, arcPoints } from "./shapes.js";

const BEND = { c: [0.2, 1.15], r: 1.0 };
const SLOT = [[-0.8, 0.1], ...arcPoints(BEND.r, Math.PI, Math.PI / 2, ...BEND.c), [1.1, 2.15]];
const X_ROD = 0.45;
const FROM = -1.1;
const TO = 0.15;
const ROD = { top: 3.35, bottom: -2.45 }; // 兩個導座的高度

/** 開槽臂轉 alpha 時:銷的位置(槽與垂直桿的交點)、銷在槽中的弧長位置 */
export function pin(alpha) {
  const pts = SLOT.map((p) => rot2(p, alpha));
  let best = null;
  let along = 0;
  for (let i = 1; i < pts.length; i++) {
    const [a, b] = [pts[i - 1], pts[i]];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if ((a[0] - X_ROD) * (b[0] - X_ROD) <= 0 && a[0] !== b[0]) {
      const t = (X_ROD - a[0]) / (b[0] - a[0]);
      const y = a[1] + (b[1] - a[1]) * t;
      if (!best || y > best.y) best = { y, s: along + t * l };
    }
    along += l;
  }
  return { ...best, length: along };
}
export const range = [FROM, TO];
const Y0 = pin(0).y;

const body = shape(thickLine(SLOT, 0.62), [thickLine([[-0.8, 0.28], ...SLOT.slice(1, -1), [0.95, 2.15]], 0.17).reverse()]);

export default {
  figure: 210,
  parts: [
    {
      id: "arm",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: body, thickness: 0.15, at: [0, 0, 0.2] },
        { kind: "plate", shape: shape(thickLine([[0, 0], [-0.5, 0.02], [-0.8, 0.12]], 0.85)), thickness: 0.15, at: [0, 0, 0.2] },
        { kind: "plate", shape: shape(circle(0.5), [circle(0.25).reverse()]), thickness: 0.2, at: [0, 0, 0.2] },
        { kind: "cylinder", radius: 0.25, length: 0.6, accent: true },
      ],
    },
    {
      id: "rod",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.2, ROD.top - ROD.bottom + 0.6, 0.15], at: [0, (ROD.top + ROD.bottom) / 2 - Y0, 0] },
        { kind: "cylinder", radius: 0.09, length: 0.45, at: [0, 0, 0.2] },
      ],
    },
    {
      id: "guides",
      kind: "group",
      // 每個導座是夾著桿的兩塊(桿從中間滑過)
      pieces: [ROD.top, ROD.bottom].flatMap((y) => [-1, 1].map((s) => ({ kind: "box", size: [0.14, 0.3, 0.35], at: [X_ROD + s * 0.2, y, 0] }))),
    },
  ],
  driver: { part: "arm", type: "rotation", cycle: [FROM, TO], initial: -FROM },
  target: "rod",
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const alpha = swing(v, FROM, TO);
    return { parts: { arm: { angle: alpha }, rod: { position: [X_ROD, pin(alpha).y, 0] } }, readouts: [] };
  },
};
