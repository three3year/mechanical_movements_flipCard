// 萬向接頭(虎克接頭)的運動學:純函式。
// 輸入叉的銷沿方向 p1(垂直於輸入軸 a1,隨輸入轉);十字的另一根銷 p2 同時垂直於 p1 與輸出軸 a2,
// 輸出叉的銷就沿 p2。由此得出輸出轉角與十字的朝向;兩軸成角度時輸出轉速週期性地快慢變化。
import { cross, norm, dot, planeBasis, planeAngle, rotateAbout, quatFromBasis, scale } from "./kit.js";

/** 軸 axis 轉 angle 時,叉的銷方向(局部 +X 在世界中的方向) */
export const pinDirection = (axis, angle) => rotateAbout(planeBasis(axis)[0], norm(axis), angle);

/**
 * 一個萬向接頭:輸入軸 a1 轉 angle1。回傳十字的兩根銷方向、十字朝向(四元數)與輸出軸 a2 的轉角。
 * prev:上一個 p2 方向(用來選定符號、讓輸出連續;省略時取與 a2×p1 同向)。
 */
export function hooke(a1, angle1, a2) {
  const p1 = pinDirection(a1, angle1);
  const p2 = norm(cross(norm(a2), p1));
  const angle2 = planeAngle(a2, p2);
  return { p1, p2, angle2, cross: quatFromBasis(p1, p2, norm(cross(p1, p2))) };
}

/** 把角度 a 換成最接近 ref 的同位角(相差 2π 的整數倍),讓轉角連續 */
export const unwrap = (a, ref) => a + 2 * Math.PI * Math.round((ref - a) / (2 * Math.PI));

/** 由兩個銷方向反推:輸出叉的銷要沿 p2,輸出軸轉角 */
export const outputAngle = (a2, p2) => planeAngle(a2, p2);

export { dot, scale };
