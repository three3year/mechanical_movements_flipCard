// 第 367 種:能照指定間距畫線、不必另外量的平行尺。兩片尺葉由兩根彎曲的連桿相連(平行四邊形);上尺葉的下緣
// 有一段分度的象牙刻度,下尺葉上一根黃銅弧形指針的尖端指在刻度上,讀得出兩片尺葉之間的寬度。
// 主動件是上尺葉(帶著連桿擺開或收攏);下尺葉壓在紙上。
// 推斷:使用時的動作——上尺葉在起始位置沿上緣畫一條線,擺開到目前位置再畫一條,兩線平行;指針的形狀。
// 指針是固定在下尺葉上的一段黃銅弧(剛體),往上彎、伸到上尺葉的刻度底下;尺葉擺開時,上尺葉帶著刻度滑過弧的外緣,
// 弧與刻度相交處就是讀數(原本畫成一根會伸縮的桿,實物做不出來)。
import { deg, clamp } from "./kit.js";
import { shape, rect, thickLine, circle } from "./shapes.js";
import { rulerLineParts, rulerLines } from "./ruler-lines.js";

const ARM = 1.45;
const PIV = [-1.6, 1.55]; // 兩根連桿在下尺葉上的樞軸 x
const LOW_Y = -0.75;
const RULER = { w: 5.6, h: 0.8 };
export const RANGE = [deg(35), deg(85)]; // 連桿與水平的夾角

/** 連桿角 a → 上尺葉相對下尺葉的位移、兩尺葉之間的寬度 */
export function ruler(a0) {
  const a = clamp(a0, ...RANGE);
  const dx = ARM * Math.cos(a);
  const dy = ARM * Math.sin(a);
  return { a, dx, dy, gap: dy - RULER.h };
}
export const edge = (a) => {
  const { dx, dy } = ruler(a);
  const y = LOW_Y + dy + RULER.h / 2 + 0.06;
  return [[dx - RULER.w / 2 - 0.3, y], [dx + RULER.w / 2 + 0.3, y]];
};

// 黃銅弧(下尺葉座標,原點在下尺葉中心):從下尺葉上的鉚釘往上、往左彎到上尺葉刻度的高度之上
export const ARC = Array.from({ length: 13 }, (_, i) => {
  const t = i / 12;
  return [0.65 - 0.95 * t * t, 0.2 + 1.55 * t];
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

// S 形彎曲連桿(局部 +x 沿連桿)
const sLink = shape(thickLine(Array.from({ length: 9 }, (_, i) => [(i / 8) * ARM, 0.08 * Math.sin((i / 8) * 2 * Math.PI)]), 0.1), [circle(0.05).reverse(), circle(0.05, ARM, 0).reverse()]);

export default {
  figure: 367,
  parts: [
    { id: "paper", kind: "box", center: [0.3, 0.2, -0.12], size: [8, 4.6, 0.04] },
    { id: "lower", kind: "plate", center: [0, LOW_Y, 0], shape: shape(rect(RULER.w, RULER.h)), thickness: 0.1, pieces: [{ kind: "cylinder", radius: 0.06, length: 0.08, at: [ARC[0][0], ARC[0][1], 0.09] }] },
    {
      id: "upper",
      kind: "plate",
      shape: shape(rect(RULER.w, RULER.h)),
      thickness: 0.1,
      // 下緣的象牙刻度
      pieces: Array.from({ length: 13 }, (_, i) => ({ kind: "box", size: [0.02, i % 2 ? 0.12 : 0.2, 0.05], at: [-0.75 + i * 0.12, -RULER.h / 2 + (i % 2 ? 0.06 : 0.1), 0.06] })),
    },
    { id: "linkL", kind: "plate", shape: sLink, thickness: 0.06, arrow: false },
    { id: "linkR", kind: "plate", shape: sLink, thickness: 0.06, arrow: false },
    { id: "pointer", kind: "plate", center: [0, LOW_Y, 0.15], shape: shape(thickLine(ARC, 0.06)), thickness: 0.04 },
    ...rulerLineParts(),
  ],
  driver: { part: "upper", grips: ["linkL", "linkR"], type: "rotation", range: RANGE, initial: deg(55) },
  target: "pointer", // 在刻度上指出兩片尺葉間距的指針
  view: { direction: [0.03, 0.06, 1] },
  pose(a0) {
    const r = ruler(a0);
    const z = 0.08; // 連桿貼著兩片尺葉的上面
    return {
      parts: {
        upper: { position: [r.dx, LOW_Y + r.dy, 0] },
        linkL: { position: [PIV[0], LOW_Y, z], angle: r.a },
        linkR: { position: [PIV[1], LOW_Y, z], angle: r.a },
      },
      paths: rulerLines(edge, deg(55), r.a),
      readouts: [{ label: "兩尺葉間距", value: `${(r.gap * 10).toFixed(1)} mm` }],
    };
  },
};
