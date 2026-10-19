// 第 324 種:複合平行尺。兩根簡單的尺 A、A 由兩根交叉的臂相連,兩臂在中點以樞軸相連;每根臂的一端以樞軸接在
// 一根尺上,另一端以滑動銷在另一根尺的溝槽(B)裡滑動,所以兩尺的邊緣保持平行,而且上下正對著。
// 主動件是上面那根尺(拉開或合攏)。
// 推斷:使用時的動作——下尺壓住,上尺在起始位置沿上緣畫一條線,拉開後再畫一條,兩線平行。
// 兩尺平放在紙上(底面貼紙面),線畫在紙面上。兩臂分上下兩層交叉(armUp 貼著尺面、armDown 在它上面):
// 五處樞接都有銷(原圖與 507movements 的動畫):兩個樞軸銷立在尺上、兩根滑動銷在兩尺的溝槽裡、中點一根銷穿過兩臂。
// armDown 比尺面高一個臂厚,兩端由墊圈墊著(樞軸端是尺上的凸台,滑動端是滑動銷的軸環,軸環比槽寬、壓在尺面上滑)(推斷)。
import { clamp } from "./kit.js";
import { shape, rect, stadium } from "./shapes.js";
import { rulerLineParts, rulerLines } from "./ruler-lines.js";

const L = 3.6; // 臂長
const XR = 1.85; // 兩臂右端(樞軸)的位置
const RULER = { w: 5.2, h: 0.62, t: 0.1 };
const ARM_T = 0.06; // 臂厚
const Z_UP = RULER.t / 2 + ARM_T / 2; // armUp 貼著尺面
const Z_DOWN = Z_UP + ARM_T; // armDown 在 armUp 上面一層
const PIN_R = 0.07; // 滑動銷(溝槽寬 0.16)
const SPAN = (z0, z1, r, at = [0, 0]) => ({ kind: "cylinder", radius: r, length: z1 - z0, at: [at[0], at[1], (z0 + z1) / 2] }); // 沿 z 從 z0 到 z1 的圓柱
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
  thickness: RULER.t,
  label,
  labelOffset: [0.4, 0, 0.3],
});

export default {
  figure: 324,
  parts: [
    { id: "paper", kind: "box", center: [0, 1.0, -RULER.t / 2 - 0.02], size: [7.5, 5.0, 0.04] },
    // 下尺右端:armDown 的樞軸銷與墊在臂下的凸台
    { id: "rulerLow", ...ruler("A"), center: [0, 0, 0], pieces: [SPAN(-RULER.t / 2, Z_DOWN + ARM_T / 2 + 0.02, 0.035, [XR, 0]), SPAN(RULER.t / 2, Z_DOWN - ARM_T / 2, 0.09, [XR, 0])] },
    // 上尺右端:armUp 的樞軸銷
    { id: "rulerTop", ...ruler("A"), pieces: [SPAN(-RULER.t / 2, Z_UP + ARM_T / 2 + 0.02, 0.035, [XR, 0])] },
    // 中點的樞銷:裝在 armUp 上,往上穿過 armDown
    { id: "armUp", kind: "link", width: 0.14, thickness: ARM_T, pins: false, pieces: [SPAN(RULER.t / 2 - Z_UP, Z_DOWN + ARM_T / 2 + 0.02 - Z_UP, 0.035, [L / 2, 0])] },
    { id: "armDown", kind: "link", width: 0.14, thickness: ARM_T, pins: false },
    // 兩根滑動銷:下尺溝槽裡的接 armUp;上尺溝槽 B 裡的接 armDown,帶一個壓在尺面上的軸環把臂墊高
    { id: "pinLow", kind: "group", pieces: [SPAN(-RULER.t / 2, Z_UP + ARM_T / 2 + 0.02, PIN_R)] },
    { id: "pinB", kind: "group", label: "B", labelOffset: [0.3, 0.25, 0.3], pieces: [SPAN(-RULER.t / 2, Z_DOWN + ARM_T / 2 + 0.02, PIN_R), SPAN(RULER.t / 2, Z_DOWN - ARM_T / 2, 0.11)] },
    ...rulerLineParts(),
  ],
  driver: { part: "rulerTop", type: "translation", direction: [0, 1, 0], range: RANGE, initial: 1.4 },
  targets: ["armUp", "armDown"], // 讓兩尺保持平行的兩根交叉臂(主動件是尺本身)
  view: { direction: [0.03, 0.06, 1] },
  pose(h0) {
    const { h, xl } = cross(h0);
    return {
      parts: {
        rulerTop: { position: [0, h, 0] },
        // 一臂:左下滑動銷 → 右上樞軸;另一臂:左上滑動銷 → 右下樞軸
        armUp: { from: [xl, 0, Z_UP], to: [XR, h, Z_UP] },
        armDown: { from: [xl, h, Z_DOWN], to: [XR, 0, Z_DOWN] },
        pinLow: { position: [xl, 0, 0] },
        pinB: { position: [xl, h, 0] },
      },
      paths: rulerLines(edge, 1.4, h, -RULER.t / 2 + 0.002),
      readouts: [],
    };
  },
};
