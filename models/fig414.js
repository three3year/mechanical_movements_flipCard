// 第 414 種:渦形齒輪與滑動小齒輪。渦形盤 A 的齒沿一條渦線排在盤面上;小齒輪 B 靠鍵條(feather)裝在軸上,
// 可沿軸滑動,始終咬著渦線上的齒。小齒輪等速轉時,咬合處離盤心越來越遠或越來越近,
// 所以渦形盤 A 朝一個方向轉時越轉越慢(或越快),朝相反方向轉時情形相反。
// 主動件是小齒輪 B 的軸;小齒輪隨咬合處沿軸滑動。
// 推斷:渦線是阿基米德渦線,繞一圈半多(原圖左側與上方兩圈齒並排);齒照小齒輪滾過的量(∫r dt)等距排,
// 和咬合處的算法一致,小齒輪的齒才一直落在渦形齒之間;盤背後以三根輻條接到輪轂(原圖只畫齒);
// 機架(原圖沒畫):背後的立柱托著渦形盤的輪轂,上下各伸出一隻臂托著小齒輪的軸。
import { Y, TAU, clamp } from "./kit.js";
import { shape, circle, rect, thickLine, spanBox } from "./shapes.js";

export const R0 = 0.42; // 渦線起點的半徑
export const K = 0.45 / TAU; // 每轉一弧度半徑增加的量
export const SPAN = 1.6 * TAU; // 渦線轉過的角度
export const RB = 0.16; // 小齒輪的節圓半徑
const BAND = 0.3; // 齒帶寬
const FACE = 0.06; // 盤面(齒根)的 z
const TOOTH_H = 0.07;
const SHAFT_Z = FACE + TOOTH_H / 2 + RB; // 小齒輪的軸的高度

/** 渦線參數 t(從起點轉過的角度)→ 半徑 */
export const radiusAt = (t) => R0 + K * t;
/** 小齒輪滾過的量 s(= RB × 小齒輪轉角)→ 咬合處的渦線參數 t:s = ∫ r dt = R0 t + K t² / 2 */
const paramAt = (s) => (-R0 + Math.sqrt(R0 * R0 + 2 * K * s)) / K;
/** 小齒輪轉 v → 咬合處的渦線參數 t */
export function contact(v) {
  return clamp(paramAt(RB * v), 0, SPAN);
}
export const RANGE = [0, (R0 * SPAN + (K * SPAN * SPAN) / 2) / RB];

// 盤上(局部)渦線參數 t 的點在 -90° + t 方向:咬合處在正下方時,盤轉過 -t
const spiral = (t, r = radiusAt(t)) => [r * Math.cos(-Math.PI / 2 + t), r * Math.sin(-Math.PI / 2 + t)];
const bandLine = Array.from({ length: 241 }, (_, i) => spiral((SPAN * i) / 240));

// 齒:照小齒輪滾過的量每隔一個齒距一根徑向短條;小齒輪轉角 0 時齒槽在正下方,所以第 k 根齒在 s = k × 齒距
const PITCH = (TAU * RB) / 10;
const teeth = [];
for (let k = 0; ; k++) {
  const t = paramAt(k * PITCH);
  if (t > SPAN) break;
  const [x, y] = spiral(t);
  teeth.push({ kind: "box", size: [BAND, 0.04, TOOTH_H], at: [x, y, FACE + TOOTH_H / 2], angle: -Math.PI / 2 + t });
}

// 輻條:從輪轂到渦線在那個方向上最外一圈的齒帶
const spoke = (a) => {
  let t = a + Math.PI / 2;
  while (t + TAU <= SPAN) t += TAU;
  return { kind: "plate", shape: shape(thickLine([[0, 0], spiral(t, radiusAt(t) + BAND / 2 - 0.05)], 0.14)), thickness: 0.04, at: [0, 0, FACE - 0.06] };
};

const EYE = { y: 1.55, bore: 0.05, outer: 0.14, length: 0.16 };

export default {
  figure: 414,
  parts: [
    {
      id: "volute",
      kind: "group",
      label: "A",
      labelOffset: [1.45, 0.1, 0.2],
      spin: 1.35,
      pieces: [
        { kind: "plate", shape: shape(thickLine(bandLine, BAND)), thickness: 0.04, at: [0, 0, FACE - 0.02], mark: spiral(SPAN - 0.12), markSize: 0.07 },
        ...teeth,
        // 盤背後的三根輻條與輪轂(輪轂往後穿過機架的軸承)
        ...[Math.PI / 2, (7 * Math.PI) / 6, (11 * Math.PI) / 6].map(spoke),
        { kind: "cylinder", radius: 0.1, length: 0.5, at: [0, 0, -0.25] },
      ],
    },
    // 機架(推斷):背後的立柱(開孔托著渦形盤的輪轂)、腳,上下各一隻臂伸到前面,末端的軸承眼套著小齒輪的軸
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(rect(0.36, 3.6, 0, -0.1), [circle(0.105).reverse()]), thickness: 0.16, at: [0, 0, -0.38] },
        spanBox(-0.8, 0.8, -2.02, -1.9, -0.5, 0.1),
        ...[1, -1].map((s) => spanBox(-0.08, 0.08, s * EYE.y - 0.08, s * EYE.y + 0.08, -0.3, SHAFT_Z - EYE.outer)),
        ...[1, -1].map((s) => ({ kind: "lathe", axis: Y, profile: [[EYE.bore, -EYE.length / 2], [EYE.outer, -EYE.length / 2], [EYE.outer, EYE.length / 2], [EYE.bore, EYE.length / 2]], at: [0, s * EYE.y, SHAFT_Z] })),
      ],
    },
    {
      id: "shaft",
      kind: "group",
      axis: Y,
      arrow: false,
      pieces: [
        { kind: "cylinder", radius: 0.045, length: 3.4 },
        { kind: "box", size: [0.03, 0.03, 2.8], at: [0, 0.05, 0] }, // 鍵條(兩端留在軸承之內)
      ],
    },
    { id: "pinion", kind: "gear", axis: Y, teeth: 10, radius: RB, width: 0.16, bore: 0.05, label: "B", labelOffset: [0.3, -0.15, 0.1], spin: 0.25 },
  ],
  driver: { part: "pinion", grips: ["shaft"], type: "rotation", range: RANGE, initial: RANGE[1] * 0.78 },
  target: "volute",
  view: { direction: [0.25, -0.2, 1] },
  pose(v0) {
    const v = clamp(v0, ...RANGE);
    const t = contact(v);
    const r = radiusAt(t);
    return {
      parts: {
        volute: { angle: -t },
        shaft: { position: [0, 0, SHAFT_Z], angle: v },
        pinion: { position: [0, -r, SHAFT_Z], angle: v },
      },
      readouts: [{ label: "A 的轉速 / B 的轉速", value: (RB / r).toFixed(3) }],
    };
  },
};
