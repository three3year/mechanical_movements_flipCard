// 剖面圖的畫法:旋轉體(lathe)剖掉朝向讀者的那一半,切面封上剖面形狀,看得到裡面(原圖的剖面圖)。
import { planeAngle } from "./kit.js";

/** 繞 axis 的旋轉體留下背向 front 的一半:回傳 lathe 的 cut 與 sweep */
export function backHalf(axis, front = [0, 0, 1]) {
  return { cut: planeAngle(axis, front) + Math.PI / 2, sweep: Math.PI };
}

/** 一段沿軸的鋸齒(螺紋的剖面):半徑在 r0、r1 之間來回,從 z0 到 z1 共 n 齒 */
export function threadProfile(r0, r1, z0, z1, n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = z0 + ((z1 - z0) * i) / n;
    pts.push([r0, a], [r1, a + (z1 - z0) / n / 2]);
  }
  pts.push([r0, z1]);
  return pts;
}
