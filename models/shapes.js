// 板件的 2D 輪廓:純函式,回傳 { outline: [[x, y], …], holes: [[[x, y], …], …] }。
// 繪圖層把輪廓沿局部 Z 擠出成板件;模型也可用同一份輪廓算接觸(凸輪、棘輪)。
// 齒輪、齒條的齒形是簡化的梯形齒,齒 0 的中心在局部 +X(齒條在局部 x = 0)。
import { TAU } from "./kit.js";

const ARC_STEP = TAU / 96;

/** 圓弧上的點(含兩端);a0 → a1 可逆時針或順時針 */
export function arcPoints(r, a0, a1, cx = 0, cy = 0) {
  const n = Math.max(1, Math.ceil(Math.abs(a1 - a0) / ARC_STEP));
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
}

export const circle = (r, cx = 0, cy = 0) => arcPoints(r, 0, TAU, cx, cy).slice(0, -1);

/** 環形(外圓 r,內孔 inner) */
export const ring = (r, inner) => ({ outline: circle(r), holes: [circle(inner).reverse()] });

/** 圓盤,可有中心孔 */
export const disc = (r, bore = 0) => ({ outline: circle(r), holes: bore ? [circle(bore).reverse()] : [] });

/** 矩形(中心在原點或指定位置) */
export function rect(w, h, cx = 0, cy = 0) {
  return [
    [cx - w / 2, cy - h / 2],
    [cx + w / 2, cy - h / 2],
    [cx + w / 2, cy + h / 2],
    [cx - w / 2, cy + h / 2],
  ];
}

/** 兩端半圓的長條:從 (0,0) 沿 +X 到 (length,0),寬 width;兩端各有銷孔 */
export function stadium(length, width, pin = 0) {
  const r = width / 2;
  const outline = [...arcPoints(r, -Math.PI / 2, Math.PI / 2, length, 0), ...arcPoints(r, Math.PI / 2, (3 * Math.PI) / 2, 0, 0)];
  const holes = pin ? [circle(pin).reverse(), circle(pin, length, 0).reverse()] : [];
  return { outline, holes };
}

/** 依極座標函式 r(φ) 取樣的輪廓(凸輪、心形輪) */
export function polarOutline(radiusAt, samples = 180) {
  return Array.from({ length: samples }, (_, i) => {
    const a = (i / samples) * TAU;
    const r = radiusAt(a);
    return [r * Math.cos(a), r * Math.sin(a)];
  });
}

// ── 齒輪 ─────────────────────────────────

/** 依節圓半徑與齒數算模數相關尺寸 */
export function gearSize(radius, teeth) {
  const m = (2 * radius) / teeth;
  return { m, addendum: m, dedendum: 1.2 * m, pitch: TAU / teeth };
}

// 一個齒在節圓上的厚度(以齒距為 1);齒側為直線、略收窄,接近原圖鑄造齒輪的方齒
const TOOTH_AT_PITCH = 0.42;
const FLANK = Math.tan((14 * Math.PI) / 180);

// 齒 i 在半徑 rho 處的半寬角
function halfWidth(radius, m, rho, inward) {
  const pitchHalf = (TOOTH_AT_PITCH * Math.PI * m) / 2;
  const d = inward ? radius - rho : rho - radius; // 朝齒頂為正
  return Math.max(0.05 * m, pitchHalf - d * FLANK) / rho;
}

/**
 * 齒輪的齒廓(封閉折線)。internal 為內齒(齒朝圓心)。
 * has(i) 決定第 i 齒在不在(不完全齒輪);缺齒處依 blank 走齒根圓或齒頂圓。
 */
export function gearProfile({ teeth, radius, internal = false, has = () => true, blank = "root" }) {
  const { m, addendum, dedendum, pitch } = gearSize(radius, teeth);
  const tip = internal ? radius - addendum : radius + addendum;
  const root = internal ? radius + dedendum : radius - dedendum;
  const blankR = blank === "tip" ? tip : root;
  const pts = [];
  for (let i = 0; i < teeth; i++) {
    const a = i * pitch;
    if (!has(i)) {
      pts.push(...arcPoints(blankR, a - pitch / 2, a + pitch / 2).slice(0, -1));
      continue;
    }
    const wr = halfWidth(radius, m, root, internal);
    const wt = halfWidth(radius, m, tip, internal);
    // 齒根圓弧(前一個齒槽的後半)→ 齒側 → 齒頂 → 齒側 → 齒根圓弧
    pts.push(...arcPoints(root, a - pitch / 2, a - wr).slice(0, -1));
    pts.push([root * Math.cos(a - wr), root * Math.sin(a - wr)]);
    pts.push(...arcPoints(tip, a - wt, a + wt));
    pts.push([root * Math.cos(a + wr), root * Math.sin(a + wr)]);
    pts.push(...arcPoints(root, a + wr, a + pitch / 2).slice(1, -1));
  }
  return pts;
}

/** 第 i 個齒的外形(從齒根到齒頂的封閉折線),用來把一個齒塗上記號色 */
export function toothOutline({ teeth, radius, internal = false }, i = 0) {
  const { m, addendum, dedendum, pitch } = gearSize(radius, teeth);
  const tip = internal ? radius - addendum : radius + addendum;
  const root = internal ? radius + dedendum : radius - dedendum;
  const base = internal ? root + 0.6 * m : root - 0.6 * m; // 往輪體裡多伸一點,記號才連在輪上
  const a = i * pitch;
  const wr = halfWidth(radius, m, root, internal);
  const wt = halfWidth(radius, m, tip, internal);
  const wb = (wr * root) / base;
  const pts = [
    [base * Math.cos(a - wb), base * Math.sin(a - wb)],
    [root * Math.cos(a - wr), root * Math.sin(a - wr)],
    ...arcPoints(tip, a - wt, a + wt),
    [root * Math.cos(a + wr), root * Math.sin(a + wr)],
    [base * Math.cos(a + wb), base * Math.sin(a + wb)],
  ];
  return internal ? pts.reverse() : pts;
}

/**
 * 齒輪板件。外齒輪:齒廓為外形,可有中心孔;內齒輪:外圓 rim 為外形,齒廓為內孔。
 * mask(i) 為 false 的齒不畫(不完全齒輪)。
 */
export function gearShape({ teeth, radius, internal = false, rim, bore = 0, mask, blank }) {
  const has = mask ?? (() => true);
  const profile = gearProfile({ teeth, radius, internal, has, blank });
  if (internal) {
    const { m } = gearSize(radius, teeth);
    return { outline: circle(rim ?? radius + 2.6 * m), holes: [profile.reverse()] };
  }
  return { outline: profile, holes: bore ? [circle(bore).reverse()] : [] };
}

/**
 * 扇形齒輪:只有 span = [a0, a1](局部角)範圍內的齒,兩側直線收到軸心。
 * 齒 i 的中心在 i·齒距,與完整齒輪相同,所以咬合計算照用 gears.meshAngle。
 */
export function sectorShape({ teeth, radius, span, bore = 0 }) {
  const { m, addendum, dedendum, pitch } = gearSize(radius, teeth);
  const tip = radius + addendum;
  const root = radius - dedendum;
  const [a0, a1] = span;
  const first = Math.ceil(a0 / pitch + 0.5 - 1e-9);
  const last = Math.floor(a1 / pitch - 0.5 + 1e-9);
  const wr = halfWidth(radius, m, root, false);
  const wt = halfWidth(radius, m, tip, false);
  const pts = [[0, 0]];
  let at = a0;
  for (let i = first; i <= last; i++) {
    const a = i * pitch;
    pts.push(...arcPoints(root, at, a - wr).slice(0, -1));
    pts.push([root * Math.cos(a - wr), root * Math.sin(a - wr)]);
    pts.push(...arcPoints(tip, a - wt, a + wt));
    at = a + wr;
  }
  pts.push(...arcPoints(root, at, a1));
  return { outline: pts, holes: bore ? [circle(bore).reverse()] : [] };
}

/** 內齒扇形段:span 範圍內的內齒(齒朝圓心),外緣是半徑 rim 的弧;齒的編號與完整內齒輪相同 */
export function internalSectorShape({ teeth, radius, span, rim }) {
  const [a0, a1] = span;
  const inner = gearProfile({ teeth, radius, internal: true }).filter(([x, y]) => {
    let a = Math.atan2(y, x);
    while (a < a0) a += TAU;
    return a <= a1;
  });
  inner.sort((p, q) => {
    const ang = ([x, y]) => {
      let a = Math.atan2(y, x);
      while (a < a0) a += TAU;
      return a;
    };
    return ang(p) - ang(q);
  });
  return { outline: [...inner, ...arcPoints(rim, a1, a0)], holes: [] };
}

/** 齒條:沿局部 X,齒朝 +Y,節線在 y = 0;齒 k 的中心在 x = (k − (n−1)/2)·齒距 */
export function rackShape({ teeth, pitch, depth }) {
  const m = pitch / Math.PI;
  const tip = m;
  const root = -1.2 * m;
  const half = (teeth - 1) / 2;
  const w = (y) => Math.max(0.05 * m, (TOOTH_AT_PITCH * pitch) / 2 - y * FLANK);
  const left = -(half + 0.5) * pitch;
  const right = (half + 0.5) * pitch;
  const pts = [[left, root - depth]];
  pts.push([left, root]);
  for (let k = 0; k < teeth; k++) {
    const x = (k - half) * pitch;
    pts.push([x - w(root), root], [x - w(tip), tip], [x + w(tip), tip], [x + w(root), root]);
  }
  pts.push([right, root], [right, root - depth]);
  return { outline: pts, holes: [] };
}

/** 棘輪:齒尖在 outer、齒根在 inner;dir = +1 時棘爪推直面使輪逆時針轉(齒 i 的直面在角度 i·齒距) */
export function ratchetShape({ teeth, outer, inner, bore = 0, dir = 1 }) {
  const pitch = TAU / teeth;
  const pts = [];
  for (let i = 0; i < teeth; i++) {
    const a = i * pitch;
    if (dir < 0) {
      // 從齒根沿斜背升到齒尖,再沿直面落回齒根
      pts.push([inner * Math.cos(a), inner * Math.sin(a)]);
      pts.push([outer * Math.cos(a + pitch * 0.92), outer * Math.sin(a + pitch * 0.92)]);
      pts.push([inner * Math.cos(a + pitch * 0.98), inner * Math.sin(a + pitch * 0.98)]);
    } else {
      pts.push([inner * Math.cos(a + pitch * 0.02), inner * Math.sin(a + pitch * 0.02)]);
      pts.push([outer * Math.cos(a + pitch * 0.08), outer * Math.sin(a + pitch * 0.08)]);
      pts.push([inner * Math.cos(a + pitch), inner * Math.sin(a + pitch)]);
    }
  }
  return { outline: pts, holes: bore ? [circle(bore).reverse()] : [] };
}

/** 任意折線外形(可帶孔) */
export const shape = (outline, holes = []) => ({ outline, holes });

/** 封閉折線(逆時針)沿法線往外(d > 0)或往內(d < 0)平移,用來畫溝槽的兩側 */
export function offsetLoop(points, d) {
  const n = points.length;
  return points.map((p, i) => {
    const prev = points[(i - 1 + n) % n];
    const next = points[(i + 1) % n];
    const nx = next[1] - prev[1];
    const ny = -(next[0] - prev[0]);
    const l = Math.hypot(nx, ny) || 1;
    return [p[0] + (nx / l) * d, p[1] + (ny / l) * d];
  });
}

/** 粗線:沿中心線 points(不封閉)兩側各偏 w/2 的封閉輪廓 */
export function thickLine(points, w) {
  const side = (s) =>
    points.map((p, i) => {
      const a = points[Math.max(0, i - 1)];
      const b = points[Math.min(points.length - 1, i + 1)];
      const t = Math.atan2(b[1] - a[1], b[0] - a[0]);
      return [p[0] - (s * w * Math.sin(t)) / 2, p[1] + (s * w * Math.cos(t)) / 2];
    });
  return [...side(1), ...side(-1).reverse()];
}

/** 正多邊形(n 邊,外接圓半徑 r;第一個頂點在角度 start) */
export const polygon = (n, r, start = 0) =>
  Array.from({ length: n }, (_, i) => [r * Math.cos(start + (i * TAU) / n), r * Math.sin(start + (i * TAU) / n)]);
