// 平行運動(第 332–348 種)共用的連桿閉合。純函式,平面在 xy。
//
// 瓦特直線連桿:樑(臂長 a,樞軸 O1)與半徑桿(長 b,樞軸 O2)在中間位置都是水平的、伸向相反的方向,
// 兩臂末端 B、R 由一根短桿(長 c)相連。短桿上把 B–R 分成 b : a 的那一點 P,在樑擺動時走的是近似直線;
// 活塞桿就接在 P(或經平行四邊形轉到別處)。
import { circleCircle } from "./linkage.js";

/**
 * line:直線所在的 x;y1:樑末端 B 在中間位置的高度;y2:半徑桿末端 R 的高度;
 * a:樑臂長(樞軸在 B 的哪一側由 beamSide 決定:+1 在右、−1 在左);b:半徑桿長(在另一側)。
 * 回傳 (psi) => { B, R, P }:psi 是樑從水平位置轉過的角(逆時針為正)。
 */
export function wattLinkage({ line = 0, y1, y2, a, b, beamSide = 1 }) {
  const O1 = [line + beamSide * a, y1, 0];
  const O2 = [line - beamSide * b, y2, 0];
  const c = Math.abs(y1 - y2);
  const k = b / (a + b);
  const side = beamSide * (y1 > y2 ? 1 : -1);
  const at = (psi) => {
    const dir = beamSide > 0 ? Math.PI + psi : psi;
    const B = [O1[0] + a * Math.cos(dir), O1[1] + a * Math.sin(dir), 0];
    const R = circleCircle(B, c, O2, b, side).point;
    const P = [B[0] + (R[0] - B[0]) * k, B[1] + (R[1] - B[1]) * k, 0];
    return { B, R, P, O1, O2 };
  };
  return Object.assign(at, { O1, O2, c, k });
}

/** 一串點偏離鉛直線的最大量(測試用:近似直線) */
export function verticalDeviation(points) {
  const xs = points.map((p) => p[0]);
  return Math.max(...xs) - Math.min(...xs);
}
