// U 形管的彎頭(第 498、501 種的水銀管共用):玻璃管畫縱剖面,彎頭是以兩管腳正中、管腳下端為圓心的半圈,
// 外、內兩道管壁的弧端點接上兩管腳的管壁;彎頭一直裝滿水銀。
// 純函式,不依賴 Three.js。
import { thickLine, arcPoints } from "./shapes.js";

/**
 * 兩管腳的管軸在 x = legs[0]、legs[1],下端(彎頭的圓心高度)在 y = bendY;bore 是管壁中心線離管軸,wall 是管壁厚,
 * 水銀填色離管壁內面再留 gap。
 * 回傳 center:彎頭圓心 [x, y];inside:水銀填色離管軸;walls:外、內兩道管壁的外形(世界座標);
 * mercury:彎頭裡的水銀(兩道弧之間的半圈)的外形,以彎頭圓心為原點。
 */
export function uTubeBend({ legs: [x0, x1], bendY, bore, wall, gap = 0.005 }) {
  const cx = (x0 + x1) / 2;
  const r = (x1 - x0) / 2;
  const inside = bore - wall / 2 - gap;
  const arc = (radius, a0, a1, cy = 0) => arcPoints(radius, a0, a1, cx, cy);
  return {
    center: [cx, bendY],
    inside,
    walls: [r + bore, r - bore].map((radius) => thickLine(arc(radius, Math.PI, 2 * Math.PI, bendY), wall)),
    mercury: [...arcPoints(r + inside, Math.PI, 2 * Math.PI), ...arcPoints(r - inside, 2 * Math.PI, Math.PI)],
  };
}
