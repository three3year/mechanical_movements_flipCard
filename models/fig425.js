// 第 425 種:眾多旋轉式引擎中的一種。A 是汽缸,軸 B 從它的中心穿過;活塞 C 就是一個固定在軸上的偏心輪,
// 在一點與汽缸接觸。蒸汽依箭頭進出,作用在活塞一側的壓力使活塞與軸旋轉。
// 進汽口與排汽口之間的滑動擋板 D 會退出活塞的行經路線,讓活塞通過。
// 主動件是軸 B(原圖箭頭:順時針)。
// 推斷:擋板 D 靠蒸汽或彈簧壓著,始終貼著偏心輪;蒸汽從擋板右邊進來,充滿擋板與接觸點之間(順時針方向)的月牙形空間,
// 擋板左邊與接觸點之間的蒸汽經左邊的汽道排出。
import { TAU } from "./kit.js";
import { stream } from "./flow.js";
import { shape, circle, rect, thickLine } from "./shapes.js";

export const BORE = 1.6; // 汽缸內半徑
export const ECC = 0.42; // 偏心距
export const PISTON = BORE - ECC; // 偏心輪半徑:剛好在一點碰到汽缸
const SLOT = 0.16; // 擋板半寬

/** 軸轉 theta(逆時針為正;原圖是順時針)→ 偏心輪中心、接觸點方向 */
export function piston(theta) {
  const c = [ECC * Math.cos(theta), ECC * Math.sin(theta)];
  return { c, contact: theta };
}
/** 擋板 D 的下端(沿 +y 到偏心輪表面的距離) */
export function abutment(theta) {
  const { c } = piston(theta);
  return c[1] + Math.sqrt(PISTON * PISTON - c[0] * c[0]);
}

/** 月牙形空間裡、從角度 a0 到 a1 的蒸汽點 */
function crescent(theta, a0, a1, travel) {
  const { c } = piston(theta);
  const dots = [];
  const span = a1 - a0;
  const n = Math.max(2, Math.round(Math.abs(span) / 0.12));
  for (let i = 0; i <= n; i++) {
    const a = a0 + (span * ((i + ((travel % 1) + 1) % 1) % (n + 1))) / n;
    const u = [Math.cos(a), Math.sin(a)];
    const cu = c[0] * u[0] + c[1] * u[1];
    const inner = cu + Math.sqrt(PISTON * PISTON - (c[0] * c[0] + c[1] * c[1]) + cu * cu);
    const gap = BORE - inner;
    if (gap < 0.08) continue;
    for (const f of gap > 0.35 ? [0.3, 0.7] : [0.5]) dots.push([(inner + gap * f) * u[0], (inner + gap * f) * u[1], 0.05]);
  }
  return dots;
}

const inlet = [[0.42, BORE + 1.0, 0.2], [0.42, BORE + 0.15, 0.2], [0.55, BORE - 0.15, 0.2]];
const exhaust = [[-0.55, BORE - 0.15, 0.2], [-0.42, BORE + 0.15, 0.2], [-0.42, BORE + 1.0, 0.2]];

export default {
  figure: 425,
  parts: [
    {
      id: "cylinder",
      kind: "group",
      label: "A",
      labelOffset: [-BORE - 0.15, 0.5, 0.4],
      pieces: [
        { kind: "plate", shape: shape(circle(BORE + 0.18), [circle(BORE).reverse()]), thickness: 0.6 },
        { kind: "plate", shape: shape(circle(BORE + 0.18)), thickness: 0.04, at: [0, 0, -0.32] },
        // 擋板的導槽、進汽與排汽道
        { kind: "plate", shape: shape(rect(0.6, 1.3, 0, BORE + 0.55), [rect(2 * SLOT + 0.02, 1.3, 0, BORE + 0.55).reverse()]), thickness: 0.6 },
        { kind: "plate", shape: shape(thickLine(inlet.map(([x, y]) => [x + 0.06, y]), 0.06)), thickness: 0.3 },
        { kind: "plate", shape: shape(thickLine(exhaust.map(([x, y]) => [x - 0.06, y]), 0.06)), thickness: 0.3 },
        { kind: "box", size: [2.4, 0.25, 0.9], at: [0, -BORE - 0.3, 0] },
      ],
    },
    {
      id: "pistonC",
      kind: "group",
      label: "C",
      labelOffset: [-0.3, -1.1, 0.4],
      spin: 0.35,
      pieces: [
        { kind: "plate", shape: shape(circle(PISTON, ECC, 0), [circle(0.12).reverse()]), thickness: 0.56, mark: [ECC + PISTON - 0.2, 0], markSize: 0.09 },
        { kind: "cylinder", radius: 0.12, length: 1.2, at: [0, 0, -0.2] },
      ],
    },
    { id: "shaftB", kind: "group", label: "B", labelOffset: [0, 0, 0.6], pieces: [] },
    { id: "abutment", kind: "box", size: [2 * SLOT, 1.2, 0.56], label: "D", labelOffset: [0.35, 0.2, 0.3] },
  ],
  driver: { part: "pistonC", type: "rotation", speed: -0.8, initial: -Math.PI / 2 },
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const tip = abutment(theta);
    const contact = ((theta % TAU) + TAU) % TAU;
    const top = Math.PI / 2;
    // 順時針轉:蒸汽在擋板(頂)與接觸點之間、從頂往順時針方向
    const steamTo = contact > top ? contact - TAU : contact;
    const travel = -theta * 0.6;
    return {
      parts: {
        pistonC: { angle: theta },
        abutment: { position: [0, tip + 0.6, 0] },
      },
      flows: [
        { fluid: "steam", points: [...stream(inlet, travel, { spacing: 0.18 }), ...crescent(theta, top - 0.2, steamTo + 0.15, travel)] },
        { fluid: "steam", points: stream(exhaust, travel, { spacing: 0.18 }) },
      ],
      readouts: [{ label: "擋板 D 退出", value: (BORE - tip).toFixed(2) }],
    };
  },
};
