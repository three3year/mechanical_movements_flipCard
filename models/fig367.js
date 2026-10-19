// 第 367 種:能照指定間距畫線、不必另外量的平行尺。兩片尺葉由兩根彎曲的連桿相連(平行四邊形);上尺葉的下緣
// 有一段分度的象牙刻度,下尺葉上一根黃銅弧形指針的尖端指在刻度上,讀得出兩片尺葉之間的寬度。
// 主動件是上尺葉(帶著連桿擺開或收攏);下尺葉壓在紙上。
// 照原圖:兩根連桿由上尺葉的樞軸往右下接到下尺葉;四個鉸點都是鉚釘(尺葉上立起的鉚釘穿過連桿端的眼,頂上有釘頭);
// 上尺葉的樞軸在尺葉偏左處、下尺葉的樞軸在偏右處,所以上尺葉比下尺葉稍微偏右。
// 推斷:使用時的動作——上尺葉在起始位置沿上緣畫一條線,擺開到目前位置再畫一條,兩線平行;指針的形狀。
// 指針是固定在下尺葉上的一段黃銅弧(剛體),往上彎、伸到上尺葉的刻度上方;尺葉擺開時,上尺葉帶著刻度滑過弧的外緣,
// 弧與刻度相交處就是讀數(原本畫成一根會伸縮的桿,實物做不出來)。
// 象牙刻度是嵌在上尺葉正面的一條白色刻度帶(另列成零件,跟著上尺葉移動,才畫得出和尺葉不同的顏色);
// 連桿用深一號的主動件色,疊在上尺葉上也分得出來。
import { deg, clamp } from "./kit.js";
import { shape, rect, thickLine, ring } from "./shapes.js";
import { rulerLineParts, rulerLines } from "./ruler-lines.js";

const ARM = 1.45; // 連桿兩個鉸點的距離
const PIV_LOW = [-0.95, 2.35]; // 兩根連桿在下尺葉上的樞軸 x(下尺葉局部)
const SHIFT = 1.4; // 上尺葉的樞軸比下尺葉的樞軸偏左這麼多(上尺葉局部 x = 下尺葉的樞軸 x − SHIFT)
const PIV_UP = PIV_LOW.map((x) => x - SHIFT);
const LOW_Y = -0.75;
const RULER = { w: 5.6, h: 0.8, t: 0.1 };
const LINK = { z: RULER.t / 2 + 0.03, t: 0.06, eye: 0.1, hole: 0.05 }; // 連桿貼在兩片尺葉的正面上
// 連桿與水平的夾角(從下尺葉的樞軸量):往左上,收到兩片尺葉相貼前為止
export const RANGE = [deg(95), deg(145)];
const INITIAL = deg(117); // 原圖的姿勢

/** 連桿角 a → 上尺葉相對下尺葉的位移、兩尺葉之間的寬度 */
export function ruler(a0) {
  const a = clamp(a0, ...RANGE);
  const dx = SHIFT + ARM * Math.cos(a);
  const dy = ARM * Math.sin(a);
  return { a, dx, dy, gap: dy - RULER.h };
}
export const edge = (a) => {
  const { dx, dy } = ruler(a);
  const y = LOW_Y + dy + RULER.h / 2 + 0.06;
  return [[dx - RULER.w / 2 - 0.3, y], [dx + RULER.w / 2 + 0.3, y]];
};

// 黃銅弧(下尺葉座標,原點在下尺葉中心):從下尺葉上的鉚釘往上、往左彎,伸到上尺葉刻度的高度之上
export const ARC = Array.from({ length: 13 }, (_, i) => {
  const t = i / 12;
  return [1.12 - 1.5 * t * t, 1.1 * t];
});
/** 上尺葉擺到 a 時,黃銅弧與上尺葉下緣(刻度)相交的位置(世界 x;沒有相交回傳 null) */
export function reading(a) {
  const { dy } = ruler(a);
  const edgeY = dy - RULER.h / 2; // 下尺葉座標
  for (let i = 1; i < ARC.length; i++) {
    const [p, q] = [ARC[i - 1], ARC[i]];
    if ((p[1] - edgeY) * (q[1] - edgeY) <= 0) return p[0] + ((edgeY - p[1]) / (q[1] - p[1])) * (q[0] - p[0]);
  }
  return null;
}
// 刻度在上尺葉下緣的範圍(上尺葉局部 x)
export const SCALE = [-1.55, 0.7];

// S 形彎曲連桿(局部 +x 沿連桿):兩端是有孔的眼,中間是彎曲的桿身
const linkPieces = [
  { kind: "plate", shape: shape(thickLine(Array.from({ length: 13 }, (_, i) => { const s = 0.08 + (i / 12) * (ARM - 0.16); return [s, 0.08 * Math.sin((s / ARM) * 2 * Math.PI)]; }), 0.1)), thickness: LINK.t, accent: true },
  ...[0, ARM].map((x) => ({ kind: "plate", shape: ring(LINK.eye, LINK.hole), thickness: LINK.t, at: [x, 0, 0], accent: true })),
];
const link = (id) => ({ id, kind: "group", arrow: false, pieces: linkPieces });

// 鉚釘:從尺葉正面立起、穿過連桿的眼,頂上有釘頭(尺葉局部座標)
const rivet = (x) => [
  { kind: "cylinder", radius: LINK.hole, length: LINK.z + LINK.t / 2, at: [x, 0, (LINK.z + LINK.t / 2) / 2] },
  { kind: "cylinder", radius: 0.08, length: 0.015, at: [x, 0, LINK.z + LINK.t / 2 + 0.0075] },
];

// 象牙刻度:刻度帶與分度線(每 0.1 一條,每 0.5 一條長的),上尺葉局部座標;範圍涵蓋擺開到收攏的讀數
const SCALE_Y = -RULER.h / 2 + 0.02;
const scaleBand = [
  { kind: "box", size: [SCALE[1] - SCALE[0], 0.16, 0.02], at: [(SCALE[0] + SCALE[1]) / 2, SCALE_Y + 0.08, RULER.t / 2 + 0.01] },
  ...Array.from({ length: Math.floor((SCALE[1] - SCALE[0] - 0.07) / 0.1) + 1 }, (_, i) => {
    const long = i % 5 === 0;
    const h = long ? 0.13 : 0.07;
    return { kind: "box", size: [0.03, h, 0.01], at: [SCALE[0] + 0.05 + i * 0.1, SCALE_Y + h / 2, RULER.t / 2 + 0.025], accent: true };
  }),
];

export default {
  figure: 367,
  parts: [
    { id: "paper", kind: "box", center: [0.3, 0.2, -0.12], size: [8, 4.6, 0.04] },
    {
      id: "lower",
      kind: "plate",
      center: [0, LOW_Y, 0],
      shape: shape(rect(RULER.w, RULER.h)),
      thickness: RULER.t,
      pieces: [{ kind: "cylinder", radius: 0.06, length: 0.08, at: [ARC[0][0], ARC[0][1], 0.09] }, ...PIV_LOW.flatMap(rivet)],
    },
    { id: "upper", kind: "plate", shape: shape(rect(RULER.w, RULER.h)), thickness: RULER.t, pieces: PIV_UP.flatMap(rivet) },
    { id: "scale", kind: "group", arrow: false, pieces: scaleBand },
    link("linkL"),
    link("linkR"),
    { id: "pointer", kind: "plate", center: [0, LOW_Y, 0.15], shape: shape(thickLine(ARC, 0.06)), thickness: 0.04 },
    ...rulerLineParts(),
  ],
  driver: { part: "upper", grips: ["linkL", "linkR"], type: "rotation", range: RANGE, initial: INITIAL },
  target: "pointer", // 在刻度上指出兩片尺葉間距的指針
  view: { direction: [0.03, 0.06, 1] },
  pose(a0) {
    const r = ruler(a0);
    const at = [r.dx, LOW_Y + r.dy, 0];
    return {
      parts: {
        upper: { position: at },
        scale: { position: at },
        linkL: { position: [PIV_LOW[0], LOW_Y, LINK.z], angle: r.a },
        linkR: { position: [PIV_LOW[1], LOW_Y, LINK.z], angle: r.a },
      },
      paths: rulerLines(edge, INITIAL, r.a),
      readouts: [{ label: "兩尺葉間距", value: `${(r.gap * 10).toFixed(1)} mm` }],
    };
  },
};
