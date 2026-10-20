// 第 410 種:等分規。橫桿上有兩個平行的夾頰,一個固定,另一個可調整,用翼形螺絲固定。每個夾頰上以樞軸裝一根短桿,
// 兩根短桿等長,另一端以一根樞軸連在一起,接合處有一個尖頂。無論兩夾頰相距多遠,尖頂始終在兩夾頰的正中間,
// 所以夾頰夾住的平行木料,沿木料拉動量規就被尖頂劃成兩半。非平行的木料也一樣:放開一個夾頰,讓它仍貼著木料即可。
// 主動件是量規(沿木料拉動);尖頂劃出的中線由 pose 回傳。
// 推斷:木料前段兩邊平行、後段一邊斜開,拉到後段時可調夾頰(螺絲放鬆)貼著斜邊滑出,表現兩種情形。
// 2026-10-20(#410-1、#410-2):兩根短桿在接點上下相疊(短桿 B 高一層),尖頂做成穿過兩個軸眼的銷、頂上有頭,
// 夾頰的耳片各以一根銷接短桿(推斷;原圖接點處一顆有頭的銷);翼形螺絲獨立成零件,進入斜邊段前轉鬆、升起
// (原文「放開一個夾頰,但仍保持其與固體接觸」),讀數「活動夾頰:鎖住 / 放開」。
import { Y, TAU, clamp, smooth } from "./kit.js";
import { shape } from "./shapes.js";

export const EDGE = -1.0; // 木料直邊(固定夾頰貼著)的 x
const LENGTH = [-3.2, 3.2]; // 木料沿 y 的範圍
const PARALLEL_TO = 0.2; // 在這之前兩邊平行
/** 木料在 y 處的寬度 */
export const width = (y) => 2.0 + 0.8 * clamp((y - PARALLEL_TO) / (LENGTH[1] - PARALLEL_TO), 0, 1);
export const LINK = 1.6; // 短桿長
const INSET = 0.12; // 樞軸離夾頰內面
export const RANGE = [-2.2, 2.6]; // 量規(橫桿)沿 y 的位置
const T = 0.05; // 短桿的厚度
const LAYER = [0.1, 0.1 + T]; // 短桿 A、B 的高度(木料面上方;B 疊在 A 上面)
export const SCREW_REST = 0.85; // 翼形螺絲鎖緊時,螺桿中心離夾頰原點的高度
const LOOSEN = [-0.6, PARALLEL_TO]; // 拉到這一段時把翼形螺絲轉鬆(進入斜邊段之前)

/** 量規在 g → 兩個樞軸、尖頂、翼形螺絲鬆開的程度(0 鎖緊 → 1 放開) */
export function gauge(g0) {
  const g = clamp(g0, ...RANGE);
  const a = [EDGE + INSET, g, LAYER[0]];
  const b = [EDGE + width(g) - INSET, g, LAYER[1]];
  const half = (b[0] - a[0]) / 2;
  const tip = [(a[0] + b[0]) / 2, g - Math.sqrt(LINK * LINK - half * half), 0];
  const loose = smooth((g - LOOSEN[0]) / (LOOSEN[1] - LOOSEN[0]));
  return { g, a, b, tip, jaws: [EDGE, EDGE + width(g)], loose };
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
        // 夾頰內面伸出的耳片與銷:短桿 A 的一端穿在這根銷上(推斷;原圖是透視圖,接點處畫了有頭的銷)
        { kind: "box", size: [INSET + 0.14, 0.06, 0.2], at: [EDGE + INSET / 2, LAYER[0] + T / 2 + 0.035, 0] },
        { kind: "cylinder", radius: 0.03, length: 0.2, axis: Y, at: [EDGE + INSET, LAYER[0] + 0.05, 0] },
      ],
    },
    {
      id: "jaw",
      kind: "group",
      arrow: false,
      pieces: [
        // 活動夾頰沿木料的方向做得窄:木料的斜邊上只有一小段貼著它
        { kind: "box", size: [JAW[0], JAW[1], 0.2], at: [JAW[0] / 2, 0.05, 0] },
        // 耳片與銷(短桿 B 高一層,耳片也高一層)
        { kind: "box", size: [INSET + 0.14, 0.06, 0.2], at: [-INSET / 2, LAYER[1] + T / 2 + 0.035, 0] },
        { kind: "cylinder", radius: 0.03, length: 0.2, axis: Y, at: [-INSET, LAYER[1] + 0.05, 0] },
      ],
    },
    // 翼形螺絲(鎖住活動夾頰;拉到斜邊段前轉鬆、升起)
    {
      id: "wingScrew",
      kind: "group",
      axis: Y,
      arrow: false,
      pieces: [
        { kind: "cylinder", radius: 0.05, length: 0.3, at: [0, 0, 0] },
        { kind: "box", size: [0.08, 0.34, 0.14], at: [0, 0, 0.18], accent: true },
      ],
    },
    // 短桿平躺在木料面上方,A 在下層、B 在上層;兩端的銷由夾頰的耳片與尖頂提供(pins: false)
    { id: "linkA", kind: "link", width: 0.14, thickness: T, axis: Y, pins: false },
    { id: "linkB", kind: "link", width: 0.14, thickness: T, axis: Y, pins: false },
    // 尖頂:尖端貼在木料面上,上段是穿過兩個軸眼的銷(半徑 0.03 < 軸眼 0.07),頂上有頭
    { id: "tip", kind: "lathe", axis: Y, profile: [[0, 0], [0.03, 0.07], [0.03, LAYER[1] + T / 2 + 0.015], [0.08, LAYER[1] + T / 2 + 0.015], [0.08, LAYER[1] + T / 2 + 0.075], [0, LAYER[1] + T / 2 + 0.075]] },
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
        // 翼形螺絲:鎖緊時在 SCREW_REST;放開時轉半圈、升起 0.1
        wingScrew: { position: W([s.jaws[1] + JAW[0] / 2, s.g, SCREW_REST + 0.1 * s.loose]), angle: -(TAU / 2) * s.loose },
        linkA: { from: W(s.a), to: W([s.tip[0], s.tip[1], LAYER[0]]) },
        linkB: { from: W(s.b), to: W([s.tip[0], s.tip[1], LAYER[1]]) },
        tip: { position: W(s.tip) },
      },
      paths: { centerLine: { points, closed: false } },
      readouts: [
        { label: "兩夾頰間距", value: (s.jaws[1] - s.jaws[0]).toFixed(2) },
        { label: "活動夾頰", value: s.loose > 0.5 ? "放開" : "鎖住" },
      ],
    };
  },
};
