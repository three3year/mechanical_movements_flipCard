// 第 258 種:用於圓形皮帶、表面平滑的 V 形槽皮帶輪:圓皮帶楔進 V 形槽的兩斜面之間。
// 推斷(原圖只畫靜止的輪):圓皮帶繞過輪的後半圈,轉動輪子時皮帶跟著走。
import { facePulley, shaftPieces } from "./face-pulley.js";

export const R = 1.62;
export const W = 0.85;
export const DEPTH = 0.5; // 槽深
export const vProfile = [[0, -W / 2], [R, -W / 2], [R, -W / 2 + 0.04], [R - DEPTH, -0.03], [R - DEPTH, 0.03], [R, W / 2 - 0.04], [R, W / 2], [0, W / 2]];

export const { travel, def } = facePulley({
  figure: 258,
  seat: R - DEPTH + 0.26,
  wheel: { kind: "lathe", mark: true, spin: R, profile: vProfile, pieces: shaftPieces(0.42, 0.3, W) },
  strand: { kind: "rope", radius: 0.16 },
});
export default def;
