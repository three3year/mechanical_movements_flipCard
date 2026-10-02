// 流體示意(ADR-0002):沿固定路徑移動的點、容器的存量,全是主動量的純函式,不模擬流體。
import { add, sub, scale, len, dot, clamp } from "./kit.js";

/** 折線長度 */
export function pathLength(points) {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += len(sub(points[i], points[i - 1]));
  return total;
}

/** 折線上離起點弧長 s 的點 */
export function pointAlong(points, s) {
  let rest = Math.max(0, s);
  for (let i = 1; i < points.length; i++) {
    const seg = sub(points[i], points[i - 1]);
    const l = len(seg);
    if (rest <= l || i === points.length - 1) return add(points[i - 1], scale(seg, l ? Math.min(rest, l) / l : 0));
    rest -= l;
  }
  return points[0];
}

/**
 * 沿路徑流動的一串點:間距 spacing,流過的距離 travel(通常是進程 × 流速)。
 * from、to(0–1)只在路徑的這一段上畫點,例如水斗傾倒時才出現的那一段。
 */
export function stream(points, travel, { spacing = 0.22, from = 0, to = 1 } = {}) {
  const total = pathLength(points);
  const start = from * total;
  const end = to * total;
  const dots = [];
  const offset = ((travel % spacing) + spacing) % spacing;
  for (let s = offset; s <= total; s += spacing) if (s >= start && s <= end) dots.push(pointAlong(points, s));
  return dots;
}

/** 點到折線的最短距離(測試用:流體示意的點只在路徑上) */
export function distanceToPath(points, p) {
  let best = Infinity;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const ab = sub(points[i], a);
    const t = clamp(dot(sub(p, a), ab) / (dot(ab, ab) || 1), 0, 1);
    best = Math.min(best, len(sub(p, add(a, scale(ab, t)))));
  }
  return best;
}

/** 在 [lo, hi] 之間線性升到 1、在 [hi2, lo2] 之間線性降回 0 的梯形;用來描述水斗的裝水與傾倒 */
export function ramp(x, lo, hi, hi2, lo2) {
  if (x <= lo || x >= lo2) return 0;
  if (x < hi) return (x - lo) / (hi - lo);
  if (x <= hi2) return 1;
  return (lo2 - x) / (lo2 - hi2);
}
