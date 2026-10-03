// 第 367 種:能照指定間距畫線、不必另外量的平行尺。兩片尺葉由兩根彎曲的連桿相連(平行四邊形);上尺葉的下緣
// 有一段分度的象牙刻度,下尺葉上一根黃銅弧形指針的尖端指在刻度上,讀得出兩片尺葉之間的寬度。
// 主動件是上尺葉(帶著連桿擺開或收攏);下尺葉壓在紙上。
// 推斷:使用時的動作——上尺葉在起始位置沿上緣畫一條線,擺開到目前位置再畫一條,兩線平行;指針的形狀。
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

// S 形彎曲連桿(局部 +x 沿連桿)
const sLink = shape(thickLine(Array.from({ length: 9 }, (_, i) => [(i / 8) * ARM, 0.08 * Math.sin((i / 8) * 2 * Math.PI)]), 0.1), [circle(0.05).reverse(), circle(0.05, ARM, 0).reverse()]);

export default {
  figure: 367,
  parts: [
    { id: "paper", kind: "box", center: [0.3, 0.2, -0.12], size: [8, 4.6, 0.04] },
    { id: "lower", kind: "plate", center: [0, LOW_Y, 0], shape: shape(rect(RULER.w, RULER.h)), thickness: 0.1, pieces: [{ kind: "cylinder", radius: 0.06, length: 0.2, at: [0.3, 0.2, 0.05] }] },
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
    { id: "pointer", kind: "link", width: 0.05, thickness: 0.04, stretch: true },
    ...rulerLineParts(),
  ],
  driver: { part: "upper", grips: ["linkL", "linkR"], type: "rotation", range: RANGE, initial: deg(55) },
  target: "pointer", // 在刻度上指出兩片尺葉間距的指針
  view: { direction: [0.03, 0.06, 1] },
  pose(a0) {
    const r = ruler(a0);
    const z = 0.12;
    const tip = [r.dx - 0.15, LOW_Y + r.dy - RULER.h / 2 + 0.08, z + 0.05];
    return {
      parts: {
        upper: { position: [r.dx, LOW_Y + r.dy, 0] },
        linkL: { position: [PIV[0], LOW_Y, z], angle: r.a },
        linkR: { position: [PIV[1], LOW_Y, z], angle: r.a },
        // 黃銅弧形指針:從下尺葉上的支點伸到上尺葉下緣的刻度
        pointer: { from: [0.3, LOW_Y + 0.2, z + 0.05], to: tip },
      },
      paths: rulerLines(edge, deg(55), r.a),
      readouts: [{ label: "兩尺葉間距", value: `${(r.gap * 10).toFixed(1)} mm` }],
    };
  },
};
