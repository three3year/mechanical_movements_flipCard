// 第 410 種:等分規。橫桿上有兩個平行的夾頰,一個固定,另一個可調整,用翼形螺絲固定。每個夾頰上以樞軸裝一根短桿,
// 兩根短桿等長,另一端以一根樞軸連在一起,接合處有一個尖頂。無論兩夾頰相距多遠,尖頂始終在兩夾頰的正中間,
// 所以夾頰夾住的平行木料,沿木料拉動量規就被尖頂劃成兩半。非平行的木料也一樣:放開一個夾頰,讓它仍貼著木料即可。
// 主動件是量規(沿木料拉動);尖頂劃出的中線由 pose 回傳。
// 推斷:木料前段兩邊平行、後段一邊斜開,拉到後段時可調夾頰(螺絲放鬆)貼著斜邊滑出,表現兩種情形。
import { Y, clamp } from "./kit.js";
import { shape } from "./shapes.js";

export const EDGE = -1.0; // 木料直邊(固定夾頰貼著)的 x
const LENGTH = [-3.2, 3.2]; // 木料沿 y 的範圍
const PARALLEL_TO = 0.2; // 在這之前兩邊平行
/** 木料在 y 處的寬度 */
export const width = (y) => 2.0 + 0.8 * clamp((y - PARALLEL_TO) / (LENGTH[1] - PARALLEL_TO), 0, 1);
export const LINK = 1.6; // 短桿長
const INSET = 0.12; // 樞軸離夾頰內面
export const RANGE = [-2.2, 2.6]; // 量規(橫桿)沿 y 的位置

/** 量規在 g → 兩個樞軸、尖頂 */
export function gauge(g0) {
  const g = clamp(g0, ...RANGE);
  const a = [EDGE + INSET, g, 0.1];
  const b = [EDGE + width(g) - INSET, g, 0.1];
  const half = (b[0] - a[0]) / 2;
  const tip = [(a[0] + b[0]) / 2, g - Math.sqrt(LINK * LINK - half * half), 0.1];
  return { g, a, b, tip, jaws: [EDGE, EDGE + width(g)] };
}

const board = shape([
  [EDGE, LENGTH[0]],
  [EDGE + width(LENGTH[0]), LENGTH[0]],
  [EDGE + width(PARALLEL_TO), PARALLEL_TO],
  [EDGE + width(LENGTH[1]), LENGTH[1]],
  [EDGE, LENGTH[1]],
]);
const JAW = [0.4, 1.3, 0.9]; // 夾頰塊(x 厚、高、沿木料的寬)
// 上面的座標是平面圖(x 橫過木料、y 沿木料、z 往上);畫面上 y 朝上,木料沿 -z
const W = ([x, y, z]) => [x, z, -y];

export default {
  figure: 410,
  parts: [
    { id: "board", kind: "plate", shape: board, thickness: 0.8, axis: Y, center: [0, -0.4, 0] },
    {
      id: "bar",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "box", size: [4.4, 0.3, 0.3], at: [0.6, 0.55, 0] },
        // 固定夾頰(在木料直邊外側)
        { kind: "box", size: JAW, at: [EDGE - JAW[0] / 2, 0.05, 0] },
      ],
    },
    {
      id: "jaw",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "box", size: JAW, at: [JAW[0] / 2, 0.05, 0] },
        // 翼形螺絲
        { kind: "cylinder", radius: 0.05, length: 0.3, axis: Y, at: [JAW[0] / 2, 0.85, 0] },
        { kind: "box", size: [0.08, 0.14, 0.34], at: [JAW[0] / 2, 1.03, 0], accent: true },
      ],
    },
    { id: "linkA", kind: "link", width: 0.14, thickness: 0.05 },
    { id: "linkB", kind: "link", width: 0.14, thickness: 0.05 },
    { id: "tip", kind: "lathe", axis: Y, profile: [[0, -0.1], [0.07, 0.05], [0.07, 0.2], [0, 0.2]] },
    { id: "centerLine", kind: "trace" },
  ],
  driver: { part: "bar", grips: ["jaw"], type: "translation", direction: [0, 0, -1], range: RANGE, initial: -1.2 },
  target: "tip", // 始終在兩夾頰正中間的尖頂
  view: { direction: [0.8, 0.9, 1] },
  pose(g0) {
    const s = gauge(g0);
    const n = Math.max(2, Math.round((s.g - RANGE[0]) / 0.05));
    const points = Array.from({ length: n + 1 }, (_, i) => {
      const t = gauge(RANGE[0] + ((s.g - RANGE[0]) * i) / n).tip;
      return W([t[0], t[1], 0.005]);
    });
    return {
      parts: {
        bar: { position: W([0, s.g, 0]) },
        jaw: { position: W([s.jaws[1], s.g, 0]) },
        linkA: { from: W(s.a), to: W(s.tip) },
        linkB: { from: W(s.b), to: W(s.tip) },
        tip: { position: W(s.tip) },
      },
      paths: { centerLine: { points, closed: false } },
      readouts: [{ label: "兩夾頰間距", value: (s.jaws[1] - s.jaws[0]).toFixed(2) }],
    };
  },
};
