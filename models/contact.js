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
