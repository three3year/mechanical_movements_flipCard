// 連桿閉合的運動學:以兩圓交點等幾何解法求姿勢,純函式。所有機構都在 xy 平面上(z 保留)。
// 到達極限位置時(兩圓不相交)不讓零件分離:回傳最接近的可達姿勢,並標記 reach = false。
import { add, sub, scale, len, norm, dot, clamp } from "./kit.js";

const perp2 = (v) => [-v[1], v[0], 0];

/**
 * 以 c1 為圓心、半徑 r1 的圓與以 c2 為圓心、半徑 r2 的圓的交點。
 * side = +1 取 c1→c2 左側的交點,−1 取右側。兩圓不相交時取連心線上最接近的點。
 */
export function circleCircle(c1, r1, c2, r2, side = 1) {
  const d = sub(c2, c1);
  const dd = Math.hypot(d[0], d[1]) || 1e-12;
  const a = (r1 * r1 - r2 * r2 + dd * dd) / (2 * dd);
  const h2 = r1 * r1 - a * a;
  const u = [d[0] / dd, d[1] / dd, 0];
  const h = Math.sqrt(Math.max(0, h2));
  const p = add(add(c1, scale(u, clamp(a, -r1, r1))), scale(perp2(u), side * h));
  return { point: [p[0], p[1], c1[2] ?? 0], reach: h2 >= -1e-9 };
}

/** 曲柄銷:繞 pivot、半徑 r、轉角 angle(xy 平面,從 +X 量起) */
export const crankPin = (pivot, r, angle) => [pivot[0] + r * Math.cos(angle), pivot[1] + r * Math.sin(angle), pivot[2] ?? 0];

/**
 * 曲柄滑塊:曲柄銷 pin 經長 rod 的連桿,帶動在直線(origin, dir)上的滑塊。
 * side 選擇直線上的兩個解中沿 dir 較遠(+1)或較近(−1)的一個。回傳滑塊位置與沿 dir 的座標。
 */
export function sliderOnLine(pin, rod, origin, dir, side = 1) {
  const u = norm(dir);
  const w = sub(pin, origin);
  const along = dot(w, u);
  const off = len(sub(w, scale(u, along)));
  const h2 = rod * rod - off * off;
  const s = along + side * Math.sqrt(Math.max(0, h2));
  return { point: add(origin, scale(u, s)), s, reach: h2 >= -1e-9 };
}

/**
 * 四連桿:曲柄繞 a 轉(長 crank、轉角 angle),連桿長 coupler,搖桿繞 b(長 rocker)。
 * 回傳曲柄銷 pin、連桿與搖桿的接點 joint;side 選擇組裝方式。
 */
export function fourBar({ a, b, crank, coupler, rocker, angle, side = 1 }) {
  const pin = crankPin(a, crank, angle);
  const { point: joint, reach } = circleCircle(pin, coupler, b, rocker, side);
  return { pin, joint, reach };
}

/** 從 from 指向 to 的平面角(xy) */
export const angleOf = (from, to) => Math.atan2(to[1] - from[1], to[0] - from[0]);

/** 剛體上的點:以 origin 為原點、轉角 angle,局部座標 [x, y] */
export const bodyPoint = (origin, angle, [x, y]) => [
  origin[0] + x * Math.cos(angle) - y * Math.sin(angle),
  origin[1] + x * Math.sin(angle) + y * Math.cos(angle),
  origin[2] ?? 0,
];

/** 以二分法求單調函式 f 在 [lo, hi] 中等於 target 的引數 */
export function solve(f, target, lo, hi, iterations = 60) {
  const rising = f(hi) > f(lo);
  for (let i = 0; i < iterations; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) < target === rising) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** 兩點連線的中點 */
export const midpoint = (a, b) => scale(add(a, b), 0.5);
