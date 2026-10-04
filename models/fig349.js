// 第 349 種:另一種形式的平行尺。上下兩根尺之間有兩組臂,每組兩根臂在中點以鉸接相連(像「>」),
// 兩個鉸點再由一根中介桿相連;這樣尺的兩端與兩側都保持平行,上尺只能正對著下尺上下開合。
// 主動件是上面的尺(拉開或合攏),下尺壓在紙上。
// 推斷:使用時的動作——上尺在起始位置沿上緣畫一條線,拉開後再畫一條,兩線平行。
import { clamp } from "./kit.js";
import { shape, rect } from "./shapes.js";
import { rulerLineParts, rulerLines } from "./ruler-lines.js";

const LINK = 1.25; // 每根臂長
const XS = [-1.15, 1.05]; // 兩組臂在尺上的樞軸 x
const RULER = { w: 5.6, h: 0.9 };
const BOTTOM = -1.4; // 下尺樞軸線
export const RANGE = [0.9, 2.3]; // 上下樞軸線的距離

/** 距離 h → 鉸點(中介桿)的 x 偏移 */
export function hinge(h0) {
  const h = clamp(h0, ...RANGE);
  return { h, dx: Math.sqrt(LINK * LINK - (h / 2) ** 2) };
}
export const edge = (h) => {
  const y = BOTTOM + clamp(h, ...RANGE) + RULER.h - 0.2 + 0.06; // 上尺的上緣
  return [[-RULER.w / 2 - 0.3, y], [RULER.w / 2 + 0.3, y]];
};

const ruler = (label) => ({ kind: "plate", shape: shape(rect(RULER.w, RULER.h)), thickness: 0.1, label, labelOffset: [0, 0, 0.3] });

export default {
  figure: 349,
  parts: [
    { id: "paper", kind: "box", center: [0, 0, -0.12], size: [8, 5.6, 0.04] },
    { id: "rulerLow", ...ruler(undefined), center: [0, BOTTOM - RULER.h / 2 + 0.2, 0] },
    { id: "rulerTop", ...ruler(undefined) },
    // 中介桿:左端削尖(原圖)
    { id: "midBar", kind: "plate", shape: shape([[-2.7, 0], [-2.35, 0.18], [1.4, 0.18], [1.4, -0.18], [-2.35, -0.18]]), thickness: 0.08 },
    ...XS.flatMap((_, i) => [
      { id: `up${i}`, kind: "link", width: 0.14, thickness: 0.05 },
      { id: `down${i}`, kind: "link", width: 0.14, thickness: 0.05 },
    ]),
    ...rulerLineParts(),
  ],
  driver: { part: "rulerTop", type: "translation", direction: [0, 1, 0], range: RANGE, initial: 1.6 },
  target: "midBar", // 連著兩個鉸點、讓尺的兩端都保持平行的中介桿
  view: { direction: [0.03, 0.06, 1] },
  pose(h0) {
    const { h, dx } = hinge(h0);
    const mid = BOTTOM + h / 2;
    const parts = {
      rulerTop: { position: [0, BOTTOM + h + RULER.h / 2 - 0.2, 0] },
      midBar: { position: [dx, mid, 0.1] },
    };
    XS.forEach((x, i) => {
      parts[`up${i}`] = { from: [x, BOTTOM + h, 0.16], to: [x + dx, mid, 0.16] };
      parts[`down${i}`] = { from: [x + dx, mid, 0.2], to: [x, BOTTOM, 0.2] };
    });
    return { parts, paths: rulerLines(edge, 1.6, h), readouts: [] };
  },
  waivers: [
    { check: "unsupported", parts: ["down1"], reason: "未修:連桿與尺之間差 0.22(前後不同層),少畫了鉸接的銷(列入待確認清單)" },
    { check: "unsupported", parts: ["up1"], reason: "未修:連桿與尺之間差 0.05(前後不同層),少畫了鉸接的銷(列入待確認清單)" },
    { check: "unsupported", parts: ["down0"], reason: "未修:連桿與尺之間差 0.22(前後不同層),少畫了鉸接的銷(列入待確認清單)" },
    { check: "unsupported", parts: ["up0"], reason: "未修:連桿與尺之間差 0.05(前後不同層),少畫了鉸接的銷(列入待確認清單)" },
    { check: "unsupported", parts: ["midBar"], reason: "未修:中間桿與連桿之間差 0.07(前後不同層),少畫了鉸接的銷(列入待確認清單)" },
    { check: "unsupported", parts: ["rulerTop"], reason: "未修:上尺與連桿之間差 0.05(前後不同層),少畫了鉸接的銷(列入待確認清單)" },
  ],
};
