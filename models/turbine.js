// 渦輪機平面圖(第 434、435 種)共用:一圈彎曲的葉片(導葉或輪上的水斗),以及沿葉片流動的水。
import { TAU, polar } from "./kit.js";
import { shape, thickLine } from "./shapes.js";

/**
 * 一片彎曲葉片的中線:從半徑 r0 到 r1,角度從 a 轉到 a + sweep(彎曲用二次曲線)
 * 回傳 2D 點
 */
export function bladeLine(r0, r1, a, sweep, n = 10) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return polar(r0 + (r1 - r0) * t, a + sweep * t * t).slice(0, 2);
  });
}

/** n 片等距的彎曲葉片(板件) */
export const blades = ({ count, r0, r1, sweep, width = 0.05, thickness = 0.3, z = 0, offset = 0 }) =>
  Array.from({ length: count }, (_, i) => ({
    kind: "plate",
    shape: shape(thickLine(bladeLine(r0, r1, offset + (i * TAU) / count, sweep), width)),
    thickness,
    at: [0, 0, z],
  }));

/** 沿葉片中線的水流路徑(3D,z 高度) */
export const bladePath = (r0, r1, a, sweep, z) => bladeLine(r0, r1, a, sweep).map(([x, y]) => [x, y, z]);
