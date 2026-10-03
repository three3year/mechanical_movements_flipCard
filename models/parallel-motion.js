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

/**
 * 兩臂伸向同一側的直線連桿(樑與半徑桿都從接頭往左伸,第 338 種):樑 O1–B 長 a、短桿 B–R 長 c,
 * 擺動範圍中點時 R 在 B 的 up 方向(單位向量);半徑桿 O2–R 的長度由此決定。直線點 P 在 B–R 的延長線上
 * (P = B + t·(B − R)),t 取讓 P 在擺動範圍內最接近鉛直線的值。
 */
export function sameSideLinkage({ O1, O2, a, c, up, range, side = 1 }) {
  const mid = (range[0] + range[1]) / 2;
  const Bm = [O1[0] + a * Math.cos(mid), O1[1] + a * Math.sin(mid), 0];
  const u = Math.hypot(up[0], up[1]);
  const Rm = [Bm[0] + (c * up[0]) / u, Bm[1] + (c * up[1]) / u, 0];
  const b = Math.hypot(Rm[0] - O2[0], Rm[1] - O2[1]);
  // 選擇讓中點位置剛好落在 Rm 的那一個交點
  const pick = [1, -1].find((s) => {
    const q = circleCircle(Bm, c, O2, b, s).point;
    return Math.hypot(q[0] - Rm[0], q[1] - Rm[1]) < 1e-6;
  }) ?? side;
  const joints = (psi) => {
    const B = [O1[0] + a * Math.cos(psi), O1[1] + a * Math.sin(psi), 0];
    const R = circleCircle(B, c, O2, b, pick).point;
    return { B, R };
  };
  const pointAt = (psi, t) => {
    const { B, R } = joints(psi);
    return [B[0] + t * (B[0] - R[0]), B[1] + t * (B[1] - R[1]), 0];
  };
  // 偏差以行程為比例:取最直的那一點(只在接頭下方不遠處找,活塞桿接在那裡)
  let best = { t: 0, dev: Infinity };
  for (let t = 0; t <= 1.2; t += 0.01) {
    const ps = Array.from({ length: 13 }, (_, i) => pointAt(range[0] + ((range[1] - range[0]) * i) / 12, t));
    const span = Math.max(...ps.map((p) => p[1])) - Math.min(...ps.map((p) => p[1]));
    const dev = verticalDeviation(ps) / span;
    if (dev < best.dev) best = { t, dev };
  }
  const at = (psi) => ({ ...joints(psi), P: pointAt(psi, best.t) });
  return Object.assign(at, { t: best.t, b, O1, O2 });
}
