// 第 254 種:鏈輪,用來以鏈條驅動或被鏈條驅動。輪緣正中排著一圈 Y 形的叉齒,
// 環式鏈條的直立鏈節卡在叉口裡,平躺的鏈節落在兩齒之間。
// 推斷(原圖只畫靜止的輪):鏈條繞過輪的後半圈,轉動鏈輪時鏈條跟著走。
import { facePulley, shaftPieces } from "./face-pulley.js";
import { TAU, cross, quatFromBasis } from "./kit.js";
import { shape } from "./shapes.js";

const R = 1.55;
const W = 0.85;
export const TEETH = 12;

// Y 形叉齒:Y 字在輪緣面上(輪軸 × 切線的平面),沿徑向立起成齒;相鄰的齒開口方向相反
const Y_SHAPE = shape([
  [-0.05, -0.2], [0.05, -0.2], [0.05, 0.02], [0.2, 0.2], [0.13, 0.25], [0, 0.09], [-0.13, 0.25], [-0.2, 0.2], [-0.05, 0.02],
]);
const HEIGHT = 0.24;
const forks = Array.from({ length: TEETH }, (_, i) => {
  const a = (i / TEETH) * TAU;
  const flip = i % 2 ? -1 : 1;
  const radial = [Math.cos(a), Math.sin(a), 0];
  const tangent = [-Math.sin(a) * flip, Math.cos(a) * flip, 0];
  const rotation = quatFromBasis(cross(tangent, radial), tangent, radial);
  return { kind: "plate", shape: Y_SHAPE, thickness: HEIGHT, rotation, at: [(R + HEIGHT / 2) * Math.cos(a), (R + HEIGHT / 2) * Math.sin(a), 0], accent: i === 0 };
});

export const { travel, def } = facePulley({
  figure: 254,
  seat: R + 0.2,
  wheel: {
    kind: "group",
    spin: R + 0.3,
    pieces: [
      { kind: "cylinder", radius: R, inner: R - 0.18, length: W },
      { kind: "cylinder", radius: R - 0.1, length: 0.16 },
      ...shaftPieces(0.45, 0.28, W),
      ...forks,
    ],
  },
  strand: { kind: "chain", style: "ring", pitch: 0.42, width: 0.3, normal: [1, 0, 0] },
});
export default def;
