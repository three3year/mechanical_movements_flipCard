// 第 490 種:普通的操舵裝置(平面圖)。舵輪的軸上有一個鼓輪,繞著一條繩;繩經過導引滑輪,兩端接到舵柄(舵頂上的槓桿)。
// 轉動舵輪時,繩的一端被捲進、另一端放出,舵柄便依舵輪轉的方向擺向一側。
// 主動件是舵輪。
// 推斷:鼓輪在左、舵柄在右,上下各一個導引滑輪;繩從鼓輪上下兩側離開;舵柄的擺角由上方那段繩的長度求出
// (捲進的長度 = 鼓輪半徑 × 轉角)。
import { X, deg, clamp } from "./kit.js";
import { solve } from "./linkage.js";
import { shape, circle, thickLine } from "./shapes.js";

const DRUM = { center: [-0.8, 0, 0], r: 0.28 };
const PULLEYS = [[0.05, 1.35, 0], [0.05, -1.35, 0]];
const PULLEY_R = 0.2;
export const RUDDER = [2.2, 0, 0]; // 舵頭(舵柄的支點)
export const TILLER = 1.6;
export const MAX = deg(32);

const tillerEnd = (psi) => [RUDDER[0] - TILLER * Math.cos(psi), RUDDER[1] + TILLER * Math.sin(psi), 0];
/** 舵柄擺角 psi → 上、下兩段繩(鼓輪到滑輪到舵柄端)的長度 */
export function ropes(psi) {
  const T = tillerEnd(psi);
  return PULLEYS.map((P, k) => {
    const s = k === 0 ? 1 : -1;
    const leave = [DRUM.center[0], DRUM.center[1] + s * DRUM.r];
    return Math.hypot(P[0] - PULLEY_R - leave[0], P[1] - leave[1]) + Math.hypot(T[0] - P[0], T[1] - P[1]);
  });
}
const BASE = ropes(0)[0];
const TOP_RANGE = [ropes(MAX)[0], ropes(-MAX)[0]];
/** 舵輪轉 theta → 舵柄擺角(上段繩捲進 r × theta) */
export function tiller(theta) {
  const want = clamp(BASE - DRUM.r * theta, Math.min(...TOP_RANGE), Math.max(...TOP_RANGE));
  return solve((p) => ropes(p)[0], want, -MAX, MAX);
}
export const RANGE = [(BASE - Math.max(...TOP_RANGE)) / DRUM.r, (BASE - Math.min(...TOP_RANGE)) / DRUM.r];

export default {
  figure: 490,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.25, 1.3, 0.25], at: [-0.8, 0, -0.35] },
        ...PULLEYS.map((P) => ({ kind: "plate", shape: shape(thickLine([[P[0], P[1]], [P[0] + 0.25, P[1] + Math.sign(P[1]) * 0.25]], 0.18)), thickness: 0.1, at: [0, 0, -0.15] })),
        { kind: "plate", shape: shape(circle(0.22, RUDDER[0], RUDDER[1])), thickness: 0.2, at: [0, 0, -0.15] },
      ],
    },
    {
      id: "wheel",
      kind: "group",
      axis: X,
      center: DRUM.center,
      spin: 1.0,
      pieces: [
        { kind: "cylinder", radius: DRUM.r, length: 0.5 },
        { kind: "cylinder", radius: 0.05, length: 2.0, at: [0, 0, -0.5] },
        // 舵輪(在左端,平面圖上看是側面)與把手
        { kind: "cylinder", radius: 0.9, inner: 0.82, length: 0.08, at: [0, 0, -1.3] },
        ...[0, 1, 2, 3].map((k) => ({ kind: "box", size: [1.7, 0.05, 0.05], at: [0, 0, -1.3], angle: (k * Math.PI) / 4 })),
        ...Array.from({ length: 8 }, (_, k) => ({ kind: "cylinder", radius: 0.04, length: 0.25, axis: [Math.cos((k * Math.PI) / 4), Math.sin((k * Math.PI) / 4), 0], at: [1.02 * Math.cos((k * Math.PI) / 4), 1.02 * Math.sin((k * Math.PI) / 4), -1.3] })),
      ],
    },
    ...PULLEYS.map((P, k) => ({ id: `pulley${k}`, kind: "pulley", style: "disc", center: P, radius: PULLEY_R, width: 0.1, arrow: false })),
    { id: "tiller", kind: "plate", shape: shape(thickLine([[0, 0], [-TILLER, 0]], 0.16), [circle(0.06).reverse()]), thickness: 0.1, center: RUDDER, arrow: false, pieces: [{ kind: "plate", shape: shape([[-0.15, -0.15], [0.15, -0.15], [0.15, 0.15], [-0.15, 0.15]]), thickness: 0.14 }] },
    { id: "ropeTop", kind: "rope", radius: 0.02 },
    { id: "ropeBottom", kind: "rope", radius: 0.02 },
  ],
  driver: { part: "wheel", type: "rotation", range: RANGE, initial: 0 },
  target: "tiller",
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const psi = tiller(theta);
    const T = tillerEnd(psi);
    const paths = {};
    PULLEYS.forEach((P, k) => {
      const s = k === 0 ? 1 : -1;
      const points = [[DRUM.center[0], s * DRUM.r, 0.1], [P[0] - PULLEY_R, P[1], 0.1], [P[0], P[1] + s * PULLEY_R, 0.1], [T[0], T[1], 0.1]];
      // 繩端接在舵柄上;路徑起點(鼓輪)處的繩隨捲進放出移動
      const length = points.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - points[i][0], p[1] - points[i][1]), 0);
      paths[k === 0 ? "ropeTop" : "ropeBottom"] = { points, closed: false, phase: -length };
    });
    return {
      parts: { wheel: { angle: theta }, tiller: { angle: -psi }, pulley0: { angle: -theta * DRUM.r / PULLEY_R }, pulley1: { angle: theta * DRUM.r / PULLEY_R } },
      paths,
      readouts: [{ label: "舵柄", value: `${psi >= 0 ? "往上" : "往下"} ${Math.abs((psi * 180) / Math.PI).toFixed(0)}°` }],
    };
  },
  waivers: [
    { check: "unsupported", parts: ["tiller"], reason: "未修:舵柄與舵鏈之間差 0.03(列入待確認清單)" },
  ],
};
