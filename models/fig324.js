// 第 324 種:複合平行尺。兩根簡單的尺 A、A 由兩根交叉的臂相連,兩臂在中點以樞軸相連;每根臂的一端以樞軸接在
// 一根尺上,另一端以滑動銷在另一根尺的溝槽(B)裡滑動,所以兩尺的邊緣保持平行,而且上下正對著。
// 主動件是上面那根尺(拉開或合攏)。
// 推斷:使用時的動作——下尺壓住,上尺在起始位置沿上緣畫一條線,拉開後再畫一條,兩線平行。
import { clamp } from "./kit.js";
import { shape, rect, stadium } from "./shapes.js";
import { rulerLineParts, rulerLines } from "./ruler-lines.js";

const L = 3.6; // 臂長
const XR = 1.85; // 兩臂右端(樞軸)的位置
const RULER = { w: 5.2, h: 0.62 };
export const RANGE = [0.7, 2.3]; // 兩尺樞軸線的距離

/** 兩尺距離 h → 兩臂左端(滑動銷)的 x、交叉點 */
export function cross(h0) {
  const h = clamp(h0, ...RANGE);
  const xl = XR - Math.sqrt(L * L - h * h);
  return { h, xl, mid: [(xl + XR) / 2, h / 2] };
}
export const edge = (h) => [[-RULER.w / 2 - 0.3, clamp(h, ...RANGE) + RULER.h / 2 + 0.06], [RULER.w / 2 + 0.3, clamp(h, ...RANGE) + RULER.h / 2 + 0.06]];

// 尺:長條,左段一道溝槽 B(滑動銷在其中)、右端一個樞軸孔
const ruler = (label) => ({
  kind: "plate",
  shape: shape(rect(RULER.w, RULER.h), [stadium(1.5, 0.16).outline.map(([x, y]) => [x - 1.95, y]).reverse()]),
  thickness: 0.1,
  label,
  labelOffset: [0.4, 0, 0.3],
});

export default {
  figure: 324,
  parts: [
    { id: "paper", kind: "box", center: [0, 1.0, -0.12], size: [7.5, 5.0, 0.04] },
    { id: "rulerLow", ...ruler("A"), center: [0, 0, 0] },
    { id: "rulerTop", ...ruler("A") },
    { id: "armUp", kind: "link", width: 0.14, thickness: 0.06 },
    { id: "armDown", kind: "link", width: 0.14, thickness: 0.06 },
    { id: "pinB", kind: "cylinder", radius: 0.09, length: 0.4, label: "B", labelOffset: [0.3, 0.25, 0.3] },
    ...rulerLineParts(),
  ],
  driver: { part: "rulerTop", type: "translation", direction: [0, 1, 0], range: RANGE, initial: 1.4 },
  view: { direction: [0.03, 0.06, 1] },
  pose(h0) {
    const { h, xl } = cross(h0);
    return {
      parts: {
        rulerTop: { position: [0, h, 0] },
        // 一臂:左下滑動銷 → 右上樞軸;另一臂:左上滑動銷 → 右下樞軸
        armUp: { from: [xl, 0, 0.12], to: [XR, h, 0.12] },
        armDown: { from: [xl, h, 0.2], to: [XR, 0, 0.2] },
        pinB: { position: [xl, h, 0.15] },
      },
      paths: rulerLines(edge, 1.4, h),
      readouts: [],
    };
  },
};
