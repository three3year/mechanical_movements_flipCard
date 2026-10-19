// 第 386 種:可摺疊的書房梯。橫檔以樞軸接在兩根側件上(平行四邊形);把一根側件往上推,橫檔跟著斜起來,兩根側件彼此靠攏,
// 收合時併成一根圓柱,橫檔收在裡面。原圖畫出展開、部分展開、收合三種狀態;模型以一根側件的上下移動走過這三種狀態。
// 主動件是右邊的側件。
// 推斷:側件是半圓形斷面,平面朝內(兩個平面貼合就併成一根圓柱);兩個平面上各開一道沿全長的槽,橫檔立起來時收進兩道槽
// 合成的方孔裡(原圖收合圖裡橫檔畫成虛線,就是收在柱裡)。橫檔的樞銷穿過槽的兩壁,離平面 PIN_IN(銷整根在側件裡),
// 所以收合到底時兩端的樞軸差 2·PIN_IN、橫檔差一點才直立。橫檔的數目依原圖;間距比橫檔長,收合時上下兩根頭尾不相碰
// (原圖收合圖裡橫檔一根接一根)。
import { clamp } from "./kit.js";
import { shape, arcPoints } from "./shapes.js";

const W = 1.1; // 橫檔長(兩端樞軸的距離;展開時兩側件的樞軸相距 W)
const R = 0.18; // 側件(半圓斷面)的半徑
const LENGTH = 6.0; // 側件長
const RUNGS = 5;
const SPACING = 1.3; // 橫檔的間距
const RUNG = { width: 0.12, thickness: 0.1 }; // 橫檔的寬(在梯面上)與厚(深度)
const PIN_IN = 0.035; // 樞銷離側件平面的距離(在半圓裡)
const SLOT = { depth: 0.1, half: 0.055 }; // 平面上的槽:深(往半圓裡)、半寬(深度方向)
export const RANGE = [0, Math.sqrt(W * W - 4 * PIN_IN * PIN_IN)]; // 右側件往上推的距離:推到兩個平面貼合

/** 右側件上移 s → 橫檔的角度、兩端樞軸的水平距離、兩側件平面的距離 */
export function fold(s0) {
  const s = clamp(s0, ...RANGE);
  const angle = Math.asin(s / W);
  const gap = W * Math.cos(angle);
  return { s, angle, gap, faceGap: Math.max(0, gap - 2 * PIN_IN) };
}

// 側件斷面(局部 u = 世界 x、v = 世界 −z,原點在圓柱的軸上):side −1 是左側件(半圓在 x < 0)、+1 是右側件;
// 平面在 u = 0,中間開一道槽(深 SLOT.depth、寬 2·SLOT.half)
const section = (side) => {
  const arc = arcPoints(R, Math.PI / 2, (3 * Math.PI) / 2).map(([u, v]) => [side * -u, v]); // 左:從 (0, R) 經 (−R, 0) 到 (0, −R)
  const slot = [[0, -SLOT.half], [side * SLOT.depth, -SLOT.half], [side * SLOT.depth, SLOT.half], [0, SLOT.half]];
  const loop = [...arc, ...slot];
  return side < 0 ? loop : loop.reverse(); // 外形逆時針
};
const rail = (side) => ({ kind: "plate", axis: [0, 1, 0], shape: shape(section(side)), thickness: LENGTH });
// 橫檔:局部 +x 由左端樞軸指向右端樞軸,兩端是圓頭;樞銷沿 z 穿過橫檔與槽的兩壁
const pin = (x) => ({ kind: "cylinder", radius: 0.025, length: 2 * SLOT.half + 0.08, at: [x, 0, 0] });

export default {
  figure: 386,
  parts: [
    { id: "railL", kind: "group", arrow: false, pieces: [rail(-1)] },
    { id: "railR", kind: "group", arrow: false, pieces: [rail(1)] },
    ...Array.from({ length: RUNGS }, (_, i) => ({
      id: `rung${i}`,
      kind: "plate",
      shape: shape([...arcPoints(RUNG.width / 2, Math.PI / 2, (3 * Math.PI) / 2), ...arcPoints(RUNG.width / 2, -Math.PI / 2, Math.PI / 2, W, 0)]),
      thickness: RUNG.thickness,
      arrow: false,
      pieces: [pin(0), pin(W)],
    })),
  ],
  driver: { part: "railR", type: "translation", direction: [0, 1, 0], range: RANGE, initial: 0 },
  target: "rung2", // 橫檔:側件一推就跟著斜起來、收合(取中間一根代表)
  view: { direction: [0.15, 0.05, 1] },
  pose(s0) {
    const f = fold(s0);
    const left = -W / 2; // 左端樞軸
    const parts = { railL: { position: [left + PIN_IN, 0, 0] }, railR: { position: [left + f.gap - PIN_IN, f.s, 0] } };
    for (let i = 0; i < RUNGS; i++) {
      const y = -((RUNGS - 1) * SPACING) / 2 + i * SPACING;
      parts[`rung${i}`] = { position: [left, y, 0], angle: f.angle };
    }
    return { parts, readouts: [] };
  },
};
