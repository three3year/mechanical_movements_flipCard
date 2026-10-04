// 第 235 種:撥爪臂的擺動,產生棘輪(星形輪)的間歇轉動。長臂以右端為樞軸擺動,左端以銷裝著一個鉤形撥爪;
// 臂往上擺時,撥爪鉤住星形輪的一個角往上推,輪逆時針轉一格;臂往下回程時,撥爪底部的小彈簧讓它讓開、滑過齒面。
// 左上方的彎彈簧(止回爪)扣住星形輪,讓它不倒轉。主動量是臂的累計擺動量。
// 推斷:每推一次轉一格(六分之一圈);撥爪讓開時繞它的銷轉。
import { TAU, deg, polar, add, swingPhase, smooth } from "./kit.js";
import { shape, circle, thickLine } from "./shapes.js";

const STAR = { center: [-1.2, 0.35, 0], points: 6, outer: 0.95, inner: 0.45 };
const STEP = TAU / STAR.points;
const PIVOT = [2.25, -1.05, 0];
const PIN = 1.65; // 撥爪的銷離樞軸
const SWING = deg(24);
const FROM = 0;
const TO = -SWING; // 臂往上擺(左端上升 = 順時針)

/** 臂的累計擺動 v:臂的轉角、星形輪轉角與撥爪讓開的角度 */
export function motion(v) {
  const { at, forward, cycle, f } = swingPhase(v, FROM, TO);
  const pushed = forward ? smooth(Math.max(0, (f - 0.25) / 0.75)) : 1;
  const yieldAngle = forward ? 0 : deg(28) * Math.sin(Math.PI * f);
  return { arm: at, star: (cycle + pushed) * STEP, yieldAngle };
}
export const step = STEP;

const starShape = shape(
  Array.from({ length: 2 * STAR.points }, (_, i) => polar(i % 2 ? STAR.inner : STAR.outer, -deg(40) + (i * Math.PI) / STAR.points).slice(0, 2)),
  [circle(0.1).reverse()],
);
const hook = shape([[0.15, 0.12], [-1.15, 0.12], [-1.4, 0.38], [-1.62, 0.32], [-1.45, -0.1], [0.15, -0.14]], [circle(0.07).reverse()]);

export default {
  figure: 235,
  parts: [
    { id: "star", kind: "plate", center: STAR.center, shape: starShape, thickness: 0.16, hub: 0.2, mark: [0.6, 0], markSize: 0.07, spin: STAR.outer },
    {
      id: "click",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(thickLine([[-1.45, 1.55], [-1.85, 1.35], [-1.95, 0.95], [-1.75, 0.6]], 0.14)), thickness: 0.1 },
        { kind: "cylinder", radius: 0.12, inner: 0.05, length: 0.2, at: [-1.45, 1.55, 0] },
      ],
    },
    {
      id: "arm",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0, 0], [-2.0, 0]], 0.3), [circle(0.08).reverse()]), thickness: 0.1 },
        { kind: "plate", shape: shape(thickLine([[-1.2, -0.18], [-1.0, -0.35], [-1.6, -0.55], [-1.9, -0.45]], 0.05)), thickness: 0.06, at: [0, 0, 0.1] }, // 小彈簧
      ],
    },
    { id: "pawl", kind: "plate", shape: hook, thickness: 0.12, arrow: false },
    { id: "post", kind: "cylinder", center: PIVOT, radius: 0.07, length: 0.4 }, // 臂的固定樞軸(推斷)
  ],
  driver: { part: "arm", type: "rotation", cycle: [FROM, TO] },
  target: "star",
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const { arm, star, yieldAngle } = motion(v);
    const pin = add(PIVOT, polar(PIN, Math.PI + arm));
    return {
      parts: {
        arm: { angle: arm },
        star: { angle: star },
        pawl: { position: [pin[0], pin[1], 0.12], angle: arm - yieldAngle }, // 撥爪貼著臂的前面
      },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["star", "click"], reason: "止回的彎彈簧畫成固定的形狀(沒有演出它被齒頂開再彈回),星形輪轉動時齒角掃過它的末端,重疊 0.13" },
  ],
};

