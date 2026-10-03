// 第 405 種:已知焦點與頂點,以機械方法畫雙曲線。兩條對向的雙曲線,焦點在垂直的中心線上。直尺的一端以一個焦點(下方)為中心轉動;
// 繩子的一端套在另一個焦點(上方)的銷上,另一端繫在直尺的另一端,繩長留得剛好讓它能貼著直尺,到達直尺邊緣與中心線交會的頂點。
// 鉛筆把繩子繃緊、貼著直尺;直尺從中心線轉開時,鉛筆畫出半條雙曲線(把直尺翻過來就畫另外半條)。
// 主動件是直尺(繞下方焦點轉);軌跡由 pose 回傳。
import { clamp, deg } from "./kit.js";
import { shape, rect, circle } from "./shapes.js";

export const A = 0.7; // 頂點到中心的距離(半實軸)
export const C = 1.4; // 焦點到中心的距離
export const F1 = [0, -C, 0]; // 直尺的轉軸
export const F2 = [0, C, 0]; // 繩子的銷
const L = 4.6; // 直尺長
export const RANGE = [deg(62), deg(118)]; // 直尺的方向(從 F1 量起)

/** 直尺方向 theta → 鉛筆的位置:在直尺上,離 F1 的距離 d 滿足 |PF1| − |PF2| = 2a */
export function pencil(theta0) {
  const theta = clamp(theta0, ...RANGE);
  const u = [Math.cos(theta), Math.sin(theta)];
  const d = (A * A - C * C) / (A - C * u[1]);
  return [F1[0] + d * u[0], F1[1] + d * u[1], 0];
}

// 雙曲線 y²/a² − x²/b² = 1 的兩支(灰色參考線,原圖的曲線)
const B = Math.sqrt(C * C - A * A);
const branch = (s) => Array.from({ length: 41 }, (_, i) => {
  const t = -1.4 + (2.8 * i) / 40;
  return [B * Math.sinh(t), s * A * Math.cosh(t), -0.02];
});

export default {
  figure: 405,
  parts: [
    { id: "paper", kind: "box", center: [0, 0, -0.12], size: [5.2, 6.2, 0.04] },
    { id: "axes", kind: "group", pieces: [{ kind: "box", size: [0.02, 6.0, 0.02], at: [0, 0, -0.05] }, { kind: "box", size: [5.0, 0.02, 0.02], at: [0, 0, -0.05] }, { kind: "cylinder", radius: 0.07, length: 0.4, at: [F2[0], F2[1], 0.1] }, { kind: "plate", shape: shape(circle(0.1)), thickness: 0.02, at: [F1[0], F1[1], -0.08] }] },
    { id: "upper", kind: "rod", radius: 0.012 },
    { id: "lower", kind: "rod", radius: 0.012 },
    { id: "ruler", kind: "plate", center: F1, shape: shape(rect(L, 0.24, L / 2, -0.12), [circle(0.06).reverse()]), thickness: 0.06, arrow: false },
    { id: "string", kind: "rope", radius: 0.02 },
    { id: "pencil", kind: "lathe", profile: [[0, -0.1], [0.05, 0], [0.06, 0.4], [0, 0.4]] },
    { id: "trace", kind: "trace" },
  ],
  driver: { part: "ruler", type: "rotation", range: RANGE, initial: deg(90) },
  view: { direction: [0.03, 0.05, 1] },
  pose(theta0) {
    const theta = clamp(theta0, ...RANGE);
    const P = pencil(theta);
    const end = [F1[0] + L * Math.cos(theta), F1[1] + L * Math.sin(theta), 0.08];
    const n = Math.max(2, Math.round(Math.abs(theta - deg(90)) / deg(1)));
    const points = Array.from({ length: n + 1 }, (_, i) => {
      const q = pencil(deg(90) + ((theta - deg(90)) * i) / n);
      return [q[0], q[1], 0.01];
    });
    return {
      parts: { ruler: { angle: theta }, pencil: { position: [P[0], P[1], 0.1] } },
      paths: {
        string: { points: [[F2[0], F2[1], 0.08], [P[0], P[1], 0.08], end], closed: false, phase: 0 }, // 繩端繫在銷上
        trace: { points, closed: false },
        upper: { points: branch(1), closed: false },
        lower: { points: branch(-1), closed: false },
      },
      readouts: [],
    };
  },
};
