// 第 322 種:平行尺。把一個四邊形沿對角線切開,成為兩個直角三角形 A、B;使用時把一個三角形的斜邊靠著另一個的斜邊滑動,
// 滑動的三角形的直角邊始終平行於原來的位置。主動件是三角形 A(沿 B 的斜邊滑動);B 壓在紙上不動。
// 推斷:使用時的動作——A 在起始位置沿上緣畫一條線,滑到目前位置再畫一條,兩線平行。
import { clamp } from "./kit.js";
import { shape } from "./shapes.js";
import { rulerLineParts, rulerLines } from "./ruler-lines.js";

const W = 4.2;
const H = 2.5;
const DIAG = [W / Math.hypot(W, H), H / Math.hypot(W, H)]; // 斜邊方向(左下 → 右上)
export const RANGE = [-1.2, 1.2];

/** A 沿斜邊滑 s → A 的位移 */
export const slide = (s) => {
  const t = clamp(s, ...RANGE);
  return [DIAG[0] * t, DIAG[1] * t];
};
/** A 的上緣(畫線用的直角邊)在 s 時的兩端點 */
export const edge = (s) => {
  const [dx, dy] = slide(s);
  return [[-W / 2 + dx - 0.3, H / 2 + dy + 0.12], [W / 2 + dx + 0.3, H / 2 + dy + 0.12]];
};

export default {
  figure: 322,
  parts: [
    { id: "paper", kind: "box", center: [0, 0.4, -0.12], size: [8.5, 6.0, 0.04] },
    // A:左上的直角三角形(直角在左上);B:右下的直角三角形(直角在右下)
    { id: "triA", kind: "plate", shape: shape([[-W / 2, -H / 2], [W / 2, H / 2], [-W / 2, H / 2]]), thickness: 0.1, center: [0, 0, 0.05], label: "A", labelOffset: [-1.2, 0.5, 0.2], pieces: [{ kind: "cylinder", radius: 0.2, inner: 0.15, length: 0.05, at: [-1.2, 0.5, 0.06] }] },
    { id: "triB", kind: "plate", shape: shape([[-W / 2, -H / 2], [W / 2, -H / 2], [W / 2, H / 2]]), thickness: 0.1, center: [0, 0, 0.05], label: "B", labelOffset: [1.2, -0.6, 0.2], pieces: [{ kind: "cylinder", radius: 0.2, inner: 0.15, length: 0.05, at: [1.2, -0.6, 0.06] }] },
    ...rulerLineParts(),
  ],
  driver: { part: "triA", type: "translation", direction: [DIAG[0], DIAG[1], 0], range: RANGE, initial: 0 },
  view: { direction: [0.03, 0.06, 1] },
  pose(s) {
    const [dx, dy] = slide(s);
    return { parts: { triA: { position: [dx, dy, 0.05] } }, paths: rulerLines(edge, 0, s), readouts: [] };
  },
};
