// 圓筒溝槽凸輪(第 106、107、108 種):圓筒表面切出一道溝,從動件的銷插在溝裡。
// 溝以 g(φ) 描述:圓筒局部角 φ 處,溝中心沿軸的位置。圓筒轉 θ 後,固定在局部角 at 方向的銷
// 落在圓筒局部角 at − θ 處,所以從動件沿軸的位置 = g(at − θ)。溝的兩側以凸條(管)畫出。
import { TAU } from "./kit.js";

/** 溝兩側凸條的折線(圓筒的局部座標:軸沿局部 z) */
export function grooveRidges(g, { radius, width, samples = 240, from = 0, to = TAU }) {
  const side = (offset) =>
    Array.from({ length: samples + 1 }, (_, i) => {
      const phi = from + ((to - from) * i) / samples;
      return [radius * Math.cos(phi), radius * Math.sin(phi), g(phi) + offset];
    });
  return [side(width / 2), side(-width / 2)];
}

/** 三角波:φ 在一個週期內線性往返,振幅 amp,週期 period(0 處在 −amp) */
export function triangle(phi, amp, period = TAU) {
  const u = (((phi / period) % 1) + 1) % 1;
  return amp * (u < 0.5 ? -1 + 4 * u : 3 - 4 * u);
}

/** 兩端略為圓滑的三角波(溝的轉折處不能是尖角);round 是圓滑區佔半週期的比例 */
export function roundedTriangle(phi, amp, period = TAU, round = 0.12) {
  const u = (((phi / period) % 1) + 1) % 1;
  const s = u < 0.5 ? u * 2 : (1 - u) * 2; // 0 → 1 → 0
  // 中段線性,兩端以拋物線接上(斜率連續)
  const r = round;
  let f;
  if (s < r) f = (s * s) / (2 * r);
  else if (s > 1 - r) f = 1 - r - ((1 - s) * (1 - s)) / (2 * r);
  else f = s - r / 2;
  const scaleTo = 1 - r; // f 在 0 → 1 − r 之間
  return amp * (-1 + (2 * f) / scaleTo);
}
