// 第 256 種:用於扁皮帶的普通皮帶輪:寬而平的輪面(中間略為隆起,皮帶自然留在中央)。
// 推斷(原圖只畫靜止的輪):扁皮帶繞過輪的後半圈,轉動輪子時皮帶跟著走。
// 扁皮帶畫成矩形斷面的扁帶,寬約輪面的 0.8 倍,內面貼著輪面隆起的頂。
import { facePulley, shaftPieces } from "./face-pulley.js";

const R = 1.6;
const W = 0.9;
const BELT = { width: 0.72, thickness: 0.08 };

export const { travel, def } = facePulley({
  figure: 256,
  seat: R + BELT.thickness / 2 + 0.01, // 扁帶內面貼著隆起的頂(間隙 0.01)
  wheel: {
    kind: "lathe",
    mark: true,
    spin: R,
    profile: [[0, -W / 2], [R - 0.04, -W / 2], [R, 0], [R - 0.04, W / 2], [0, W / 2]],
    pieces: shaftPieces(0.42, 0.3, W),
  },
  strand: { kind: "belt", ...BELT },
});
export default def;
