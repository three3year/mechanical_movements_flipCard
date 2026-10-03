// 第 257 種:用於圓形皮帶的凹槽皮帶輪:輪緣上一道半圓形的溝槽,圓皮帶嵌在槽裡。
// 推斷(原圖只畫靜止的輪):圓皮帶繞過輪的後半圈,轉動輪子時皮帶跟著走。
import { facePulley, shaftPieces } from "./face-pulley.js";

const R = 1.62;
const W = 0.85;
const G = 0.3; // 溝槽半徑

// 半圓槽:槽心在半徑 R、z = 0,槽底在 R − G
const profile = [
  [0, -W / 2],
  [R, -W / 2],
  ...Array.from({ length: 17 }, (_, i) => {
    const a = Math.PI - (i / 16) * Math.PI; // 從 −z 側繞到 +z 側
    return [R - G * Math.sin(a), G * Math.cos(a)];
  }),
  [R, W / 2],
  [0, W / 2],
];

export const { travel, def } = facePulley({
  figure: 257,
  seat: R - G + 0.2,
  wheel: { kind: "lathe", mark: true, spin: R, profile, pieces: shaftPieces(0.42, 0.3, W) },
  strand: { kind: "rope", radius: 0.19 },
});
export default def;
