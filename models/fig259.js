// 第 259 種:V 形槽皮帶輪,槽的兩斜面刻有徑向的凹紋,增加皮帶的附著力(與第 258 種的平滑槽相比)。
// 推斷(原圖只畫靜止的輪):圓皮帶繞過輪的後半圈,轉動輪子時皮帶跟著走。
import { facePulley, shaftPieces } from "./face-pulley.js";
import { R, W, DEPTH, vProfile } from "./fig258.js";
import { TAU, Y, Z, quatMul, quatAxisAngle } from "./kit.js";

export const GROOVES = 60;
const Z_IN = 0.03; // 槽底兩側斜面的起點
const Z_OUT = W / 2 - 0.04; // 輪緣處斜面的終點
const SLOPE = Math.atan2(Z_OUT - Z_IN, DEPTH); // 斜面與徑向的夾角
const LEN = Math.hypot(Z_OUT - Z_IN, DEPTH);

// 斜面上的凸棱:兩側各一圈,沿斜面從槽底到輪緣(棱之間就是凹紋)
const ridges = [];
for (let i = 0; i < GROOVES; i++) {
  const a = (i / GROOVES) * TAU;
  const mid = R - DEPTH / 2;
  for (const side of [1, -1]) {
    ridges.push({
      kind: "box",
      size: [LEN * 0.92, 0.03, 0.03],
      // 局部 X 先繞 Y 傾向斜面,再繞軸轉到第 i 道
      rotation: quatMul(quatAxisAngle(Z, a), quatAxisAngle(Y, -side * SLOPE)),
      at: [mid * Math.cos(a), mid * Math.sin(a), (side * (Z_IN + Z_OUT)) / 2],
    });
  }
}

export const { travel, def } = facePulley({
  figure: 259,
  seat: R - DEPTH + 0.26,
  wheel: { kind: "lathe", mark: true, spin: R, profile: vProfile, pieces: [...shaftPieces(0.42, 0.3, W), ...ridges] },
  strand: { kind: "rope", radius: 0.16 },
});
export default def;
