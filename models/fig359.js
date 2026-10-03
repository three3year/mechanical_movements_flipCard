// 第 359 種:原始的鑽孔裝置(泵鑽)。橫桿套在鑽頭心軸上,兩端以皮帶(繩)繫到心軸頂端;一旦轉起來,用手交替地
// 按下、放開橫桿:按下時繩從心軸上解開,心軸轉;沉重的碟片(飛輪)提供穩定的動量,讓心軸繼續轉,把繩反方向
// 捲回心軸,同時把橫桿拉起;下一次按下,心軸就往另一個方向轉。主動件是橫桿(累計行程:按下、放開)。
// 推斷:繩捲在心軸上的半徑與圈數。
import { Y, TAU, swingPhase } from "./kit.js";

const TOP = 2.4; // 心軸頂端(繩的繫點)
const LOW = -0.2; // 橫桿按到底的高度
const HIGH = 1.3; // 橫桿被拉起的高度
const WRAP = 0.16; // 繩捲在心軸上的半徑
export const STROKE = HIGH - LOW;
export const MAX_TURN = (STROKE / WRAP) * 0.5; // 繩全捲上時心軸轉過的角度(兩股繩一起捲)

/** 累計行程 v → 橫桿高度、心軸轉角(按下時解開、放開時反向捲回) */
export function pump(v) {
  const { cycle, forward, f } = swingPhase(v, 0, STROKE);
  const s = cycle % 2 === 0 ? 1 : -1; // 每次按下,心軸轉的方向交替
  const u = forward ? 1 - f : f; // 橫桿高度的比例(1 在上)
  const spindle = forward ? s * MAX_TURN * u : -s * MAX_TURN * u;
  return { bar: LOW + STROKE * u, spindle, down: forward };
}

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
        { kind: "cylinder", radius: 0.14, length: 4.2, at: [0, 0, 0.5] },
        // 飛輪(沉重的碟片)
        { kind: "lathe", profile: [[0.14, -1.45], [1.9, -1.45], [2.05, -1.25], [1.9, -1.05], [0.14, -1.05]], mark: true },
        // 鑽頭夾頭與鑽尖
        { kind: "cylinder", radius: 0.22, length: 0.45, at: [0, 0, -1.95] },
        { kind: "lathe", profile: [[0, -2.75], [0.05, -2.6], [0.1, -2.2], [0, -2.2]] },
      ],
    },
    { id: "bar", kind: "group", arrow: false, pieces: [{ kind: "box", size: [3.6, 0.12, 0.16] }, { kind: "cylinder", axis: Y, radius: 0.24, inner: 0.15, length: 0.25 }, { kind: "sphere", radius: 0.07, at: [-1.8, 0, 0] }, { kind: "sphere", radius: 0.07, at: [1.8, 0, 0] }] },
    { id: "cordL", kind: "rope", radius: 0.03 },
    { id: "cordR", kind: "rope", radius: 0.03 },
  ],
  driver: { part: "bar", type: "translation", direction: [0, -1, 0], cycle: [0, STROKE] },
  target: "spindle", // 交替轉向的鑽頭心軸
  view: { direction: [0.08, 0.12, 1] },
  pose(v) {
    const p = pump(v);
    // 繩:從橫桿兩端斜上到心軸,再沿螺旋捲到頂端(捲上的圈數 ∝ |心軸轉角|)
    const turns = Math.abs(p.spindle) / TAU;
    const helix = (side) => {
      const n = Math.max(2, Math.round(turns * 16));
      const start = TOP - 0.15 - turns * 0.12;
      return Array.from({ length: n + 1 }, (_, i) => {
        const a = side * Math.PI + Math.sign(p.spindle || 1) * (i / n) * turns * TAU;
        return [WRAP * Math.cos(a), start + (i / n) * turns * 0.12, WRAP * Math.sin(a)];
      });
    };
    const cord = (side) => [[side * 1.8, p.bar, 0], ...helix(side > 0 ? 0 : 1)];
    return {
      parts: { spindle: { angle: p.spindle }, bar: { position: [0, p.bar, 0] } },
      paths: { cordL: { points: cord(-1), closed: false, phase: 0 }, cordR: { points: cord(1), closed: false, phase: 0 } },
      readouts: [],
    };
  },
};
