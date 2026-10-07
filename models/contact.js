// 靠接觸運作的零件(擋止爪、制動桿、靠在銷上的槓桿)的一般規則(ADR-0001):
// 零件繞樞軸往某方向擺(重力或彈簧),停在第一次碰到障礙物的位置。純函式,平面在 xy。
// 外形與障礙物都是 2D 折線多邊形。
import { rot2 } from "./kit.js";

/** 局部輪廓繞樞軸 pivot 轉 angle 後的世界座標(2D) */
export const placeOutline = (outline, pivot, angle) =>
  outline.map((p) => {
    const [x, y] = rot2(p, angle);
    return [pivot[0] + x, pivot[1] + y];
  });

function segmentsCross(a, b, c, d) {
  const o = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const d1 = o(c, d, a);
  const d2 = o(c, d, b);
  const d3 = o(a, b, c);
  const d4 = o(a, b, d);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

export function pointInPolygon([x, y], poly) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

const bounds = (poly) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of poly) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  return [x0, y0, x1, y1];
};

/** 兩個多邊形是否相交(邊相交或一個的頂點在另一個裡面) */
export function polygonsOverlap(a, b) {
  const [ax0, ay0, ax1, ay1] = bounds(a);
  const [bx0, by0, bx1, by1] = bounds(b);
  if (ax1 < bx0 || bx1 < ax0 || ay1 < by0 || by1 < ay0) return false;
  for (let i = 0; i < a.length; i++) {
    const p = a[i];
    const q = a[(i + 1) % a.length];
    for (let j = 0; j < b.length; j++) if (segmentsCross(p, q, b[j], b[(j + 1) % b.length])) return true;
  }
  return pointInPolygon(a[0], b) || pointInPolygon(b[0], a);
}

/**
 * 繞 pivot 擺動的零件(局部輪廓 outline)從 from 往 into(+1 逆時針 / −1 順時針)擺,
 * 停在第一次碰到 obstacles(世界座標多邊形)的轉角;擺過 sweep 仍沒碰到就停在盡頭。
 */
export function swingUntilContact({ pivot, outline, from, into, sweep = 1.2, steps = 60 }, obstacles) {
  const hits = (angle) => {
    const placed = placeOutline(outline, pivot, angle);
    return obstacles.some((o) => polygonsOverlap(placed, o));
  };
  // 起點若已碰到障礙物,先往回退到離開為止
  for (let i = 0; i < steps && hits(from); i++) from -= (into * sweep) / steps;
  let prev = from;
  for (let i = 1; i <= steps; i++) {
    const angle = from + (into * sweep * i) / steps;
    if (hits(angle)) {
      let lo = prev;
      let hi = angle;
      for (let k = 0; k < 30; k++) {
        const mid = (lo + hi) / 2;
        if (hits(mid)) hi = mid;
        else lo = mid;
      }
      return lo;
    }
    prev = angle;
  }
  return from + into * sweep;
}

/** 點到多邊形邊界的距離 */
export function edgeDistance(p, poly) {
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
    best = Math.min(best, Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy));
  }
  return best;
}

// 實體:多邊形,或 { outline, holes }(在孔裡的點不算在實體裡)
const asSolid = (s) => (Array.isArray(s) ? { outline: s, holes: [] } : { outline: s.outline, holes: s.holes ?? [] });
const inSolid = (p, s) => pointInPolygon(p, s.outline) && !s.holes.some((h) => pointInPolygon(p, h));
const solidEdgeDistance = (p, s) => Math.min(edgeDistance(p, s.outline), ...s.holes.map((h) => edgeDistance(p, h)));

/**
 * 兩個實體互相穿入的深度:一個的頂點伸進另一個裡面多深(最大值;0 = 沒穿)。
 * 各可以是多邊形或 { outline, holes }。簡化的梯形齒咬合時齒頂會互相擦到約 0.001
 */
export function penetrationDepth(a, b) {
  const A = asSolid(a);
  const B = asSolid(b);
  const ba = bounds(A.outline);
  const bb = bounds(B.outline);
  if (ba[2] < bb[0] || bb[2] < ba[0] || ba[3] < bb[1] || bb[3] < ba[1]) return 0;
  let depth = 0;
  for (const p of A.outline) if (inSolid(p, B)) depth = Math.max(depth, solidEdgeDistance(p, B));
  for (const p of B.outline) if (inSolid(p, A)) depth = Math.max(depth, solidEdgeDistance(p, A));
  return depth;
}

/** 圓(銷、滾子)近似成多邊形 */
export const circlePolygon = (center, r, n = 14) =>
  Array.from({ length: n }, (_, i) => [center[0] + r * Math.cos((i / n) * Math.PI * 2), center[1] + r * Math.sin((i / n) * Math.PI * 2)]);

/**
 * 擋止的位置:擋止爪在主動量的一個週期 period 內落下(轉角驟變)的那一點。
 * restAngle(v) 是擋止爪靠在輪上的轉角;回傳落下時的主動量(週期內)。
 */
export function dropValue(restAngle, period, samples = 720) {
  let best = 0;
  let at = 0;
  let prev = restAngle(0);
  for (let i = 1; i <= samples; i++) {
    const v = (period * i) / samples;
    const angle = restAngle(v);
    const jump = Math.abs(angle - prev);
    if (jump > best) {
      best = jump;
      at = v;
    }
    prev = angle;
  }
  return at;
}

/** 反轉時被擋住的主動量:從 v 往回轉,碰到的最近一個擋止位置(offset + k·period ≤ v) */
export const lastStop = (v, offset, period) => offset + Math.floor((v - offset) / period + 1e-9) * period;

/**
 * 靠在轉動零件上的從動件,滑脫後不是瞬間落下:resting(v) 是它靠著時的抬起量(週期 period,滑脫的那一刻驟降),
 * 回傳的函式在滑脫後的 drop 這段主動量內,讓它從滑脫前的高度加速落回(起步慢、越來越快),落下途中碰到東西就靠在上面。
 */
export function withFall(resting, period, drop, samples = 720) {
  let at = 0;
  let step = 0;
  for (let i = 1; i <= samples; i++) {
    const d = resting((period * (i - 1)) / samples) - resting((period * i) / samples);
    if (d > step) [step, at] = [d, (period * (i - 1)) / samples];
  }
  const height = resting(at);
  return (v) => {
    const since = (((v - at) % period) + period) % period;
    const lift = resting(v);
    if (since >= drop) return lift;
    const t = since / drop;
    return Math.max(lift, height * (1 - t * t));
  };
}

/**
 * 靠自重(或彈簧)搭在齒上的爪:restAt(v) 是主動量 v 時它靠在齒上的轉角(由接觸算)。爪尖滑過齒尖時,靠著的轉角
 * 會在一瞬間跳低,實物是加速落下。回傳 v 時爪的轉角:最近 window 這段主動量裡,每個時刻靠著的轉角再以 accel
 * (每單位主動量平方的轉角)加速落下,取其中最高的,但不低於此刻靠著的轉角——爪不穿進齒,也不比自由落下快。
 * into:落下的轉向(+1 逆時針 / −1 順時針)。restAt 要用相對於裝爪的零件的轉角(那個零件本身也在轉時)。
 */
export function fallingRest(restAt, v, { into, accel, window, samples = 12 }) {
  let angle = restAt(v);
  for (let i = 1; i <= samples; i++) {
    const dv = (window * i) / samples;
    const held = restAt(v - dv) + into * 0.5 * accel * dv * dv;
    if (into < 0 ? held > angle : held < angle) angle = held;
  }
  return angle;
}

/**
 * 被推的零件(位置或轉角 value)往 dir(+1 / −1)推到剛好不再重疊:overlaps(v) 回答在 v 時是否重疊。
 * 一步最多推 max(通常是推它的零件這一步走的量加一點餘裕);推了 max 仍重疊就表示不是被這一面推,回傳原值。
 */
export function pushUntilClear(value, dir, max, overlaps) {
  if (!overlaps(value)) return value;
  if (overlaps(value + dir * max)) return value;
  let [lo, hi] = [0, max];
  for (let k = 0; k < 30; k++) {
    const mid = (lo + hi) / 2;
    if (overlaps(value + dir * mid)) lo = mid;
    else hi = mid;
  }
  return value + dir * hi;
}
