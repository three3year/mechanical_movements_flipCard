// 第 168、169 種共用:抽送桿(pitman)的中段裝在一支半徑不變的第二曲柄上,右端接著往復動力
// (一根往上接到樑的直立連桿,右端因此沿以樑端為圓心的弧上下);左端的銷因此走一條橢圓形的軌跡,帶動左邊引擎主軸上的主曲柄——
// 第 168 種的主曲柄開了溝槽讓銷滑動(曲柄長隨之改變),第 169 種以一根短連桿接到半徑固定的主曲柄。
// 為了讓模型通過死點,主動件取第二曲柄,由它推算抽送桿的位置。
import { polar, add, sub, scale, norm, dist } from "./kit.js";
import { circleCircle, angleOf } from "./linkage.js";

export const C2 = [0.55, 0, 0]; // 第二曲柄的軸
export const R2 = 0.55;
export const BEAM = [3.95, 1.95, 0]; // 往復動力(樑)上的接點
const ROD = 1.75; // 直立連桿長
const L = 3.0; // 抽送桿:中段到右端
const LEFT = 2.3; // 抽送桿:中段到左端的銷

/** 第二曲柄轉 phi:抽送桿的中段、右端與左端的銷 */
export function pitman(phi) {
  const m = add(C2, polar(R2, phi));
  const r = circleCircle(m, L, BEAM, ROD, -1).point;
  const p = add(m, scale(norm(sub(m, r)), LEFT));
  return { m, r, p };
}

// 主曲柄的軸:左端的銷所走的封閉曲線的中心
export const C1 = (() => {
  let x = 0;
  let y = 0;
  const n = 360;
  for (let i = 0; i < n; i++) {
    const { p } = pitman((i / n) * 2 * Math.PI);
    x += p[0] / n;
    y += p[1] / n;
  }
  return [x, y, 0];
})();

/** 第 168 種:主曲柄的轉角與曲柄長(銷在溝槽中的位置) */
export const slotted = (phi) => {
  const { p } = pitman(phi);
  return { angle: angleOf(C1, p), length: dist(C1, p) };
};

/** 第 169 種:半徑固定的主曲柄經短連桿接到抽送桿的左端 */
export function linked(phi, r1, link) {
  const { p } = pitman(phi);
  const q = circleCircle(C1, r1, p, link, -1).point;
  return { p, q, angle: angleOf(C1, q) };
}
