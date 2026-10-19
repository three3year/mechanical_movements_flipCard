// 第 323 種:滾輪平行尺。簡單的直尺 B 上裝著輪軸 C,兩端一對輪 A、A 只略微凸出尺的下側,輪緣刻有細紋抓住紙張,
// 所以尺只能整體往前後滾動,始終與先前畫的線平行。主動件是尺 B(往前後推)。
// 照 525 px 原圖:尺上開兩個長方形窗,輪各在一個窗裡;輪軸 C 一整根穿過兩輪,輪外側有軸環,軸頸架在窗外的軸承上。
// 兩輪固定在同一根軸上一起轉(一個零件),所以兩輪滾過的距離相同,尺不會偏轉。
// 輪底貼著紙,尺底只比輪底高一點(略微凸出);輪心在尺面上方,軸從尺面上方跨過兩個窗。
// 推斷:軸承的形狀(原圖是平面圖,只看得到軸端的小方塊);使用時的動作——起始位置沿尺邊畫一條線,滾到目前位置再畫一條,
// 兩線平行;輪隨滾動轉。
import { X, TAU, clamp } from "./kit.js";
import { shape, rect } from "./shapes.js";
import { rulerLineParts, rulerLines } from "./ruler-lines.js";

const L = 5.0; // 尺長
const B_W = 1.5; // 尺寬
const T = 0.24; // 尺厚
const LIFT = 0.05; // 尺底比輪底(紙面)高多少:輪「僅略微凸出」
/** 輪 A:半徑(含輪緣刻紋的頂)、寬、兩輪的 x */
export const WHEEL = { radius: 0.36, width: 0.3, at: [-1.8, 1.8] };
const R = WHEEL.radius;
const WINDOW = [0.48, 0.9]; // 窗的寬(x)與長(y)
const AXLE = 0.045; // 輪軸 C 的半徑
const BEARING_X = 2.27; // 軸承的位置(窗外側)
const RULER_Z = LIFT + T / 2; // 尺的中心高度(紙面在 z 0)
export const RANGE = [-1.5, 1.5];

export const edge = (y) => [[-L / 2 - 0.3, clamp(y, ...RANGE) - B_W / 2 - 0.07], [L / 2 + 0.3, clamp(y, ...RANGE) - B_W / 2 - 0.07]];
/** 尺往前滾 y → 輪的轉角(不滑動) */
export const wheelAngle = (y) => -clamp(y, ...RANGE) / R;

// 輪緣的刻紋:沿軸向的細凸棱,棱頂就是輪的半徑(棱之間是凹紋);每個輪的第 0 道塗記號色
const RIDGES = 36;
const RIDGE_H = 0.03;
const wheelPieces = (x) => [
  { kind: "cylinder", radius: R - RIDGE_H / 2, length: WHEEL.width, at: [0, 0, x] },
  ...Array.from({ length: RIDGES }, (_, i) => {
    const a = (i / RIDGES) * TAU;
    const r = R - RIDGE_H / 2;
    return { kind: "box", size: [RIDGE_H, 0.025, WHEEL.width], at: [r * Math.cos(a), r * Math.sin(a), x], angle: a, accent: i === 0 };
  }),
  // 輪外側的軸環
  { kind: "cylinder", radius: 0.065, length: 0.04, at: [0, 0, x + Math.sign(x) * (BEARING_X - 0.05 - 0.02 - Math.abs(x))] },
];

export default {
  figure: 323,
  parts: [
    { id: "paper", kind: "box", center: [0, 0, -0.02], size: [8, 6, 0.04] },
    {
      id: "rulerB",
      kind: "plate",
      shape: shape(rect(L, B_W), WHEEL.at.map((x) => rect(...WINDOW, x, 0).reverse())),
      thickness: T,
      center: [0, 0, RULER_Z],
      label: "B",
      labelOffset: [0, 0.35, 0.3],
      // 軸承:立在尺面上、窗外側的小座,軸頸穿過它(推斷)
      pieces: [-1, 1].map((s) => ({ kind: "box", size: [0.1, 0.22, R + 0.1 - (LIFT + T)], at: [s * BEARING_X, 0, T / 2 + (R + 0.1 - (LIFT + T)) / 2] })),
    },
    // 輪軸 C 與兩輪 A、A:一個會轉的零件(局部 z 沿世界 X)
    {
      id: "wheels",
      kind: "group",
      axis: X,
      spin: R,
      spinOffset: WHEEL.at[1],
      label: "A",
      labelOffset: [WHEEL.at[0], 0.62, 0.2],
      pieces: [{ kind: "cylinder", radius: AXLE, length: 2 * BEARING_X + 0.16 }, ...WHEEL.at.flatMap(wheelPieces)],
    },
    // 另一個輪 A 與軸 C 的字母(只是標籤)
    { id: "labelA2", kind: "group", label: "A", labelOffset: [0, 0, 0] },
    { id: "labelC", kind: "group", label: "C", labelOffset: [0, 0, 0] },
    ...rulerLineParts(),
  ],
  driver: { part: "rulerB", grips: ["wheels"], type: "translation", direction: [0, 1, 0], range: RANGE, initial: 0 },
  view: { direction: [0.05, -0.25, 1] },
  pose(y0) {
    const y = clamp(y0, ...RANGE);
    return {
      parts: {
        rulerB: { position: [0, y, RULER_Z] },
        wheels: { position: [0, y, R], angle: wheelAngle(y) },
        labelA2: { position: [WHEEL.at[1], y + 0.62, R + 0.2] },
        labelC: { position: [0, y + 0.18, R + 0.15] },
      },
      paths: rulerLines(edge, 0, y, 0.002),
      readouts: [],
    };
  },
};
