// 第 255 種:帶凸緣的皮帶輪,用來以扁皮帶驅動或被扁皮帶驅動。輪面兩側的凸緣擋住扁皮帶,不讓它滑出。
// 推斷(原圖只畫靜止的輪):扁皮帶繞過輪的後半圈,轉動輪子時皮帶跟著走。
// 扁皮帶畫成矩形斷面的扁帶,寬約兩側凸緣之間輪面的 0.8 倍,兩邊各離凸緣一點,看得出凸緣把它擋在輪面上。
import { facePulley, shaftPieces } from "./face-pulley.js";

const R = 1.45;
const FLANGE = 1.72;
const W = 0.85;
const F = 0.09;
const BELT = { width: 0.54, thickness: 0.08 }; // 凸緣之間的輪面寬 W − 2F = 0.67

export const { travel, def } = facePulley({
  figure: 255,
  seat: R + BELT.thickness / 2 + 0.01, // 扁帶內面貼著輪面(間隙 0.01)
  wheel: {
    kind: "lathe",
    mark: true,
    spin: FLANGE,
    profile: [
      [0, -W / 2], [FLANGE, -W / 2], [FLANGE, -W / 2 + F], [R, -W / 2 + F],
      [R, W / 2 - F], [FLANGE, W / 2 - F], [FLANGE, W / 2], [0, W / 2],
    ],
    pieces: shaftPieces(0.42, 0.3, W),
  },
  strand: { kind: "belt", ...BELT },
});
export default def;
