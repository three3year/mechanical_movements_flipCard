// 第 322 種:平行尺。把一個四邊形沿對角線切開,成為兩個直角三角形 A、B;使用時把一個三角形的斜邊靠著另一個的斜邊滑動,
// 滑動的三角形的直角邊始終平行於原來的位置。主動件是三角形 A(沿 B 的斜邊滑動);B 壓在紙上不動。
// 推斷:使用時的動作——A 在起始位置沿上緣畫一條線,滑到目前位置再畫一條,兩線平行。
// 兩個三角形平放在紙上(底面貼著紙面),線畫在紙面上。A、B 的圓是把手:凸出板面的圓環,用記號色讓正面看得出來。
import { clamp } from "./kit.js";
import { shape } from "./shapes.js";
import { rulerLineParts, rulerLines } from "./ruler-lines.js";

const W = 4.2;
const H = 2.5;
const DIAG = [W / Math.hypot(W, H), H / Math.hypot(W, H)]; // 斜邊方向(左下 → 右上)
export const RANGE = [-1.2, 1.2];
const T = 0.1; // 三角形的厚度(底面在紙面 z 0)
const LINE_Z = 0.002; // 作圖線:紙面上
// 把手:凸出板面的圓環(原圖 A、B 的圓,直徑約板高的 1/6)
const handle = (x, y) => ({ kind: "cylinder", radius: 0.22, inner: 0.13, length: 0.08, at: [x, y, T / 2 + 0.04], accent: true });

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
    { id: "paper", kind: "box", center: [0, 0.4, -0.02], size: [8.5, 6.0, 0.04] },
    // A:左上的直角三角形(直角在左上);B:右下的直角三角形(直角在右下)
    { id: "triA", kind: "plate", shape: shape([[-W / 2, -H / 2], [W / 2, H / 2], [-W / 2, H / 2]]), thickness: T, center: [0, 0, T / 2], label: "A", labelOffset: [-1.55, 0.75, 0.2], pieces: [handle(-1.2, 0.5)] },
    { id: "triB", kind: "plate", shape: shape([[-W / 2, -H / 2], [W / 2, -H / 2], [W / 2, H / 2]]), thickness: T, center: [0, 0, T / 2], label: "B", labelOffset: [1.55, -0.85, 0.2], pieces: [handle(1.2, -0.6)] },
    ...rulerLineParts(),
  ],
  driver: { part: "triA", type: "translation", direction: [DIAG[0], DIAG[1], 0], range: RANGE, initial: 0 },
  view: { direction: [0.03, 0.06, 1] },
  pose(s) {
    const [dx, dy] = slide(s);
    return { parts: { triA: { position: [dx, dy, T / 2] } }, paths: rulerLines(edge, 0, s, LINE_Z), readouts: [] };
  },
};
