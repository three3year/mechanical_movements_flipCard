// 第 359 種:原始的鑽孔裝置(泵鑽)。橫桿套在鑽頭心軸上,一條繩穿過心軸頂端的孔,兩端繫在橫桿兩端;
// 一旦轉起來,用手交替地按下、放開橫桿:按下時繩從心軸上解開,心軸轉;沉重的碟片(飛輪)提供穩定的動量,
// 讓心軸繼續轉,把繩反方向捲回心軸,同時把橫桿拉起;下一次按下,心軸就往另一個方向轉。
// 主動件是橫桿(累計行程:按下、放開)。
// 繩長不變:每一股繩 = 捲在心軸上的螺旋 + 從離開心軸的切點直直拉到橫桿端的一段;橫桿的高度決定了直段多長,
// 剩下的就捲在心軸上,心軸的轉角由此算出。繩頭(心軸頂端的孔)轉離橫桿端的方向不到切線的角度時,繩還沒碰到心軸,
// 從孔直接拉到橫桿端。兩股繩在心軸兩側,一起捲上、一起解開。
// 照原圖,橫桿在最高處時繩在心軸上捲約 2.5 圈;按到底時繩完全解開。
// 推斷:繩捲在心軸上的半徑與每圈的升程;橫桿最高處繩的斜度(約 30°)。
import { Y, TAU, swingPhase } from "./kit.js";

const SHAFT_R = 0.14; // 心軸半徑
const CORD_R = 0.03; // 繩的粗細(半徑)
const WRAP = SHAFT_R + CORD_R; // 繩中心線捲在心軸上的半徑
const LEAD = 0.3; // 每一股繩每捲一圈沿心軸往下的距離(兩股繩隔半圈交錯)
const ARM = 1.8; // 繩繫在橫桿上的點離心軸的距離
const TOP_TURNS = 2.5; // 橫桿在最高處時捲著的圈數(原圖)
const TOP_DROP = 1.0; // 橫桿在最高處時,繩離開心軸的切點比橫桿高多少
const LOW = -0.85; // 橫桿按到底的高度(輪轂的下緣在飛輪上方)

const BETA = Math.acos(WRAP / ARM); // 繩頭轉離橫桿端的方向超過這個角,繩才開始捲在心軸上
const TANGENT = Math.sqrt(ARM * ARM - WRAP * WRAP); // 切點到橫桿端的水平距離
const PER_RAD = Math.hypot(WRAP, LEAD / TAU); // 捲一弧度的繩長
const descent = (w) => (LEAD * w) / TAU;
// 繩長:按到底時繩頭正對橫桿端、繩從孔直接拉到橫桿端;最高處捲 2.5 圈、切點比橫桿高 TOP_DROP
const LENGTH = PER_RAD * TOP_TURNS * TAU + Math.hypot(TANGENT, TOP_DROP);
const TIE = LOW + Math.sqrt(LENGTH ** 2 - (ARM - WRAP) ** 2); // 心軸頂端的孔(繩穿過的地方)的高度
const HIGH = TIE - descent(TOP_TURNS * TAU) - TOP_DROP; // 橫桿被拉起的高度
export const STROKE = HIGH - LOW;

// 繩頭轉離橫桿端的方向 phi(≥ 0)、橫桿高 y 時,一股繩的長度
function strand(phi, y) {
  if (phi <= BETA) return Math.hypot(ARM - WRAP * Math.cos(phi), WRAP * Math.sin(phi), TIE - y);
  const w = phi - BETA;
  return PER_RAD * w + Math.hypot(TANGENT, TIE - descent(w) - y);
}
// 橫桿高 y 時心軸轉離「繩全解開」的角度:繩長不變(對 phi 單調,二分)
function turnFor(y) {
  let [lo, hi] = [0, TOP_TURNS * TAU + BETA + 1];
  for (let k = 0; k < 60; k++) {
    const mid = (lo + hi) / 2;
    if (strand(mid, y) < LENGTH) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** 累計行程 v → 橫桿高度、心軸轉角(按下時解開、放開時反向捲回) */
export function pump(v) {
  const { cycle, forward, f } = swingPhase(v, 0, STROKE);
  const s = cycle % 2 === 0 ? 1 : -1; // 每次按下,心軸轉的方向交替
  const u = forward ? 1 - f : f; // 橫桿高度的比例(1 在上)
  const bar = LOW + STROKE * u;
  const turn = u === 0 ? 0 : turnFor(bar);
  return { bar, spindle: forward ? s * turn : -s * turn, down: forward };
}

// 一股繩(side = +1 右、−1 左):從橫桿端到切點,再沿螺旋捲回心軸頂端的孔。心軸繞 +y 轉 spindle,
// 世界角 a 的點在 (R cos a, ·, −R sin a);繩頭在心軸上正對橫桿端(右股在角 0、左股在角 π)
function cord(side, spindle, bar) {
  const base = side > 0 ? 0 : Math.PI;
  const at = (a, y) => [WRAP * Math.cos(base + a), y, -WRAP * Math.sin(base + a)];
  const end = [side * ARM, bar, 0];
  const phi = Math.abs(spindle);
  if (phi <= BETA) return [end, at(spindle, TIE)];
  const sign = Math.sign(spindle);
  const w = phi - BETA;
  const n = Math.max(2, Math.ceil((w / TAU) * 48));
  // 從切點(角 sign·β)沿螺旋往上捲到繩頭(角 spindle)
  const helix = Array.from({ length: n + 1 }, (_, i) => at(sign * (BETA + (w * i) / n), TIE - descent(w * (1 - i / n))));
  return [end, ...helix];
}

const SPINDLE_BOTTOM = -1.9; // 心軸下端伸進夾頭
const SPINDLE_TOP = TIE + 0.2;

export default {
  figure: 359,
  parts: [
    {
      id: "spindle",
      kind: "group",
      axis: Y,
      spin: 2.0,
      spinOffset: -1.2,
      pieces: [
        { kind: "cylinder", radius: SHAFT_R, length: SPINDLE_TOP - SPINDLE_BOTTOM, at: [0, 0, (SPINDLE_TOP + SPINDLE_BOTTOM) / 2] },
        // 飛輪(沉重的碟片)
        { kind: "lathe", profile: [[0.14, -1.45], [1.9, -1.45], [2.05, -1.25], [1.9, -1.05], [0.14, -1.05]], mark: true },
        // 鑽頭夾頭(心軸下端伸進去)與鑽尖(柄插進夾頭)
        { kind: "cylinder", radius: 0.22, length: 0.45, at: [0, 0, -1.95] },
        { kind: "lathe", profile: [[0, -2.75], [0.05, -2.6], [0.1, -2.25], [0.07, -2.15], [0.07, -2.0], [0, -2.0]] },
      ],
    },
    { id: "bar", kind: "group", arrow: false, pieces: [{ kind: "box", size: [3.6, 0.12, 0.16] }, { kind: "cylinder", axis: Y, radius: 0.24, inner: 0.15, length: 0.25 }, { kind: "sphere", radius: 0.07, at: [-ARM, 0, 0] }, { kind: "sphere", radius: 0.07, at: [ARM, 0, 0] }] },
    { id: "cordL", kind: "rope", radius: CORD_R },
    { id: "cordR", kind: "rope", radius: CORD_R },
  ],
  driver: { part: "bar", type: "translation", direction: [0, -1, 0], cycle: [0, STROKE] },
  target: "spindle", // 交替轉向的鑽頭心軸
  view: { direction: [0.08, 0.12, 1] },
  pose(v) {
    const p = pump(v);
    return {
      parts: { spindle: { angle: p.spindle }, bar: { position: [0, p.bar, 0] } },
      paths: { cordL: { points: cord(-1, p.spindle, p.bar), closed: false, phase: 0 }, cordR: { points: cord(1, p.spindle, p.bar), closed: false, phase: 0 } },
      readouts: [],
    };
  },
};
