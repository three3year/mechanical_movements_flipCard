// 第 405 種:已知焦點與頂點,以機械方法畫雙曲線。兩條對向的雙曲線,焦點在垂直的中心線上。直尺的一端以一個焦點(上方)為中心
// 轉動、尺的一邊通過該焦點;繩子的一端套在另一個焦點(下方)的銷上,另一端繫在直尺的另一端,繩長留得剛好:直尺與中心線重合時,
// 繩的彎曲處(bight)恰好到達頂點。鉛筆把繩子繃緊、貼著直尺;直尺從中心線轉開時,鉛筆畫出半條雙曲線;把直尺翻過來就畫另外半條。
// 主動件是直尺(繞上方焦點轉);軌跡由 pose 回傳。
// 2026-10-20(model-audit-fixes-4,照原圖與維護者的決定):尺繞上焦點 F1 轉、繩的銷在下焦點 F2、畫下面那支(照原圖);
// 尺平放在紙上,F1 有一根穿過尺端的孔、插在紙上的樞軸銷。分兩個狀態:「前半條」尺身在貼鉛筆那條邊的左側,尺往左轉開畫左半;
// 「後半條」把尺翻面(以貼鉛筆的尺邊為軸轉 180°,樞軸孔還在焦點上),尺身在右側,尺往右轉開畫右半——尺身始終在繩的另一側,
// 繩不橫過尺身(這就是原文要翻面的原因)。主動量是尺離中心線的角度;從尺邊剛碰到下焦點的銷的角度起算(由接觸算)。
// 鉛筆、繩的深度安排見 pencil-thread.js。
import { clamp, deg, quatMul, quatAxisAngle, Z, X } from "./kit.js";
import { shape, rect, circle, arcPoints } from "./shapes.js";
import { PAPER_TOP, RULER_T, RULER_Z, PIN_R, paperPin, pencilAndThread, pencilPart } from "./pencil-thread.js";

export const A = 0.7; // 頂點到中心的距離(半實軸)
export const C = 1.4; // 焦點到中心的距離
export const F1 = [0, C, 0]; // 直尺的樞軸(上焦點)
export const F2 = [0, -C, 0]; // 繩子的銷(下焦點)
export const L = 4.4; // 直尺長(從樞軸到繫繩的一端)
export const SWING = deg(28); // 尺離中心線最多轉開的角度
const HOLE_R = PIN_R + 0.01; // 尺端的樞軸孔
// 尺邊通過 F1、往下;尺轉開 v 時尺邊離 F2 的距離是 2C·sin v,尺邊剛碰到銷的角度(主動量的起點)
const V0 = Math.asin((PIN_R + 0.002) / (2 * C));
export const RANGE = [V0, SWING];
const SIDE = (state) => (state === "second" ? -1 : 1); // 前半條往左轉開(尺身在左)、後半條往右(尺身在右)

/** 尺轉開 v(狀態 state)時尺邊的方向(從 F1 往尺的另一端) */
export function direction(v0, state = "first") {
  const theta = -Math.PI / 2 - SIDE(state) * clamp(v0, 0, SWING);
  return [Math.cos(theta), Math.sin(theta)];
}

/** 尺轉開 v → 繩的彎曲處(鉛筆貼尺邊的點):在尺邊上,離 F1 的距離 d 滿足 |PF1| − |PF2| = 2a */
export function bight(v0, state = "first") {
  const u = direction(v0, state);
  const d = (A * A - C * C) / (A + C * u[1]);
  return [F1[0] + d * u[0], F1[1] + d * u[1]];
}

// 直尺(局部):尺邊是局部 y = 0 從 x = 0 到 L,尺身在 −y 側;樞軸端是以原點為中心的圓頭(孔在尺邊上,圓頭讓孔整個在尺裡)
const WIDTH = 0.24;
const LOBE = 0.16;
const rulerShape = () => {
  const outline = [[LOBE, 0], [L, 0], [L, -WIDTH], [0, -WIDTH], [0, -LOBE], ...arcPoints(LOBE, -Math.PI / 2, -2 * Math.PI, 0, 0).slice(1, -1)];
  return shape(outline.reverse(), [circle(HOLE_R).reverse()]);
};

// 雙曲線 y²/a² − x²/b² = 1 的兩支(原圖已畫在紙上的曲線,刻在紙面)與中心線
const B = Math.sqrt(C * C - A * A);
const branch = (s) => Array.from({ length: 41 }, (_, i) => {
  const t = -1.4 + (2.8 * i) / 40;
  return [B * Math.sinh(t), s * A * Math.cosh(t)];
});
const outAndBack = (pts) => [...pts, ...pts.map(([x, y]) => [x + 0.001, y]).reverse()];
const line = (x0, y0, x1, y1) => [[x0, y0], [x1, y1], [x1 + 0.001, y1 + 0.001], [x0 + 0.001, y0 + 0.001]];

/** 鉛筆尖從尺轉開 v0 到 v1 畫過的線(狀態 state) */
function traced(v0, v1, state) {
  const n = Math.max(2, Math.round((v1 - v0) / deg(1)));
  return Array.from({ length: n + 1 }, (_, i) => {
    const w = v0 + ((v1 - v0) * i) / n;
    const u = direction(w, state);
    return pencilAndThread({ bight: bight(w, state), e: u, end: [F1[0] + L * u[0], F1[1] + L * u[1]], pin: F2 }).tip;
  });
}

// 插在紙上的銷當成一個零件(兩個焦點的銷各自插在紙上,分成兩個零件)
const pinPart = (id, p) => { const { at, ...pin } = paperPin(p); return { id, ...pin, center: at }; };

export default {
  figure: 405,
  parts: [
    { id: "paper", kind: "plate", shape: shape(rect(5.2, 6.4)), thickness: 0.04, center: [0, 0, PAPER_TOP - 0.02], engrave: [line(0, -3.1, 0, 3.1), line(-2.5, 0, 2.5, 0), outAndBack(branch(1)), outAndBack(branch(-1))] },
    // 兩個焦點上的銷:上焦點是尺的樞軸(穿過尺端的孔)、下焦點套著繩
    pinPart("pivot", F1),
    pinPart("pin", F2),
    { id: "ruler", kind: "plate", center: [F1[0], F1[1], RULER_Z], shape: rulerShape(), thickness: RULER_T, arrow: false, posed: true },
    { id: "string", kind: "rope", radius: 0.012 },
    pencilPart(),
    { id: "trace", kind: "trace" },
    { id: "done", kind: "trace" },
  ],
  driver: { part: "ruler", type: "rotation", range: RANGE, initial: V0 },
  target: "pencil", // 畫出雙曲線的鉛筆
  states: {
    options: [
      { id: "first", label: "前半條(尺身在左)" },
      { id: "second", label: "後半條(尺翻面,尺身在右)" },
    ],
    initial: "first",
  },
  view: { direction: [0.03, 0.05, 1] },
  pose(v0, state = "first") {
    const v = clamp(v0, ...RANGE);
    const u = direction(v, state);
    const theta = Math.atan2(u[1], u[0]);
    const P = bight(v, state);
    const end = [F1[0] + L * u[0], F1[1] + L * u[1]];
    const { pencil, tip, thread } = pencilAndThread({ bight: P, e: u, end, pin: F2 });
    // 尺:局部 x 沿尺邊;後半條以尺邊(局部 x 軸)為軸翻 180°,尺身換到另一側
    const rotation = state === "second" ? quatMul(quatAxisAngle(Z, theta), quatAxisAngle(X, Math.PI)) : quatAxisAngle(Z, theta);
    const points = traced(V0, v, state);
    return {
      parts: { ruler: { position: [F1[0], F1[1], RULER_Z], rotation }, pencil: { position: pencil } },
      paths: {
        string: { points: thread, closed: false, phase: 0 }, // 從尺端沿尺邊到鉛筆、繞過鉛筆、套在下焦點的銷上
        trace: { points, closed: false },
        done: { points: traced(V0, SWING, "first"), closed: false, visible: state === "second" }, // 後半條時,前半條已經畫好
      },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["paper", "pivot"], reason: "圖釘釘在紙上:釘尖穿過紙面 0.04" },
    { check: "interference", parts: ["paper", "pin"], reason: "圖釘釘在紙上:釘尖穿過紙面 0.04" },
  ],
};
