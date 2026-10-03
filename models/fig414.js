// 第 414 種:渦形齒輪與滑動小齒輪。渦形盤 A 的齒沿一條渦線排在盤面上;小齒輪 B 靠鍵條(feather)裝在軸上,
// 可沿軸滑動,始終咬著渦線上的齒。小齒輪等速轉時,咬合處離盤心越來越遠或越來越近,
// 所以渦形盤 A 朝一個方向轉時越轉越慢(或越快),朝相反方向轉時情形相反。
// 主動件是小齒輪 B 的軸;小齒輪隨咬合處沿軸滑動。
// 推斷:渦線是阿基米德渦線,繞一圈不到;盤背後以一根輻條接到軸上(原圖只畫齒)。
import { Y, TAU, clamp } from "./kit.js";
import { shape, circle, thickLine } from "./shapes.js";

export const R0 = 0.42; // 渦線起點的半徑
export const K = 0.55 / TAU; // 每轉一弧度半徑增加的量
const SPAN = 0.9 * TAU; // 渦線轉過的角度
export const RB = 0.16; // 小齒輪的節圓半徑
const BAND = 0.3; // 齒帶寬
const FACE = 0.06; // 盤面(齒根)的 z
const TOOTH_H = 0.07;

/** 渦線參數 t(從起點轉過的角度)→ 半徑 */
export const radiusAt = (t) => R0 + K * t;
/** 小齒輪轉 v → 咬合處的渦線參數 t(小齒輪轉過的弧長 = 渦線上滾過的弧長) */
export function contact(v) {
  const t = (-R0 + Math.sqrt(R0 * R0 + 2 * K * RB * v)) / K;
  return clamp(t, 0, SPAN);
}
export const RANGE = [0, (R0 * SPAN + (K * SPAN * SPAN) / 2) / RB];

// 盤上(局部)渦線參數 t 的點在 -90° + t 方向:咬合處在正下方時,盤轉過 -t
const spiral = (t, r = radiusAt(t)) => [r * Math.cos(-Math.PI / 2 + t), r * Math.sin(-Math.PI / 2 + t)];
const bandLine = Array.from({ length: 121 }, (_, i) => spiral((SPAN * i) / 120));

// 齒:沿渦線等弧長排列的徑向短條
const PITCH = (TAU * RB) / 10;
const teeth = [];
for (let t = 0, s = 0, next = PITCH / 2; t <= SPAN; t += 0.002) {
  s += 0.002 * Math.hypot(radiusAt(t), K);
  if (s >= next) {
    const [x, y] = spiral(t);
    teeth.push({ kind: "box", size: [BAND, 0.045, TOOTH_H], at: [x, y, FACE + TOOTH_H / 2], angle: -Math.PI / 2 + t });
    next += PITCH;
  }
}

export default {
  figure: 414,
  parts: [
    {
      id: "volute",
      kind: "group",
      label: "A",
      labelOffset: [1.45, 0.1, 0.2],
      spin: 1.25,
      pieces: [
        { kind: "plate", shape: shape(thickLine(bandLine, BAND)), thickness: 0.04, at: [0, 0, FACE - 0.02], mark: spiral(SPAN - 0.12), markSize: 0.07 },
        ...teeth,
        // 盤背後的輪轂與一根輻條(連到渦線內端)
        { kind: "plate", shape: shape(thickLine([[0, 0], spiral(0.15, R0 + K * 0.15 - BAND / 2 + 0.05)], 0.14)), thickness: 0.04, at: [0, 0, FACE - 0.06] },
        { kind: "cylinder", radius: 0.1, length: 0.5, at: [0, 0, -0.3] },
      ],
    },
    {
      id: "shaft",
      kind: "group",
      axis: Y,
      arrow: false,
      pieces: [
        { kind: "cylinder", radius: 0.045, length: 3.2 },
        { kind: "box", size: [0.03, 0.03, 3.0], at: [0, 0.05, 0] }, // 鍵條
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
    const z = FACE + TOOTH_H / 2 + RB;
    return {
      parts: {
        volute: { angle: -t },
        shaft: { position: [0, 0, z], angle: v },
        pinion: { position: [0, -r, z], angle: v },
      },
      readouts: [{ label: "A 的轉速 / B 的轉速", value: (RB / r).toFixed(3) }],
    };
  },
};
