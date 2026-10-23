// 板件的 2D 輪廓:純函式,回傳 { outline: [[x, y], …], holes: [[[x, y], …], …] }。
// 繪圖層把輪廓沿局部 Z 擠出成板件;模型也可用同一份輪廓算接觸(凸輪、棘輪)。
// 齒輪、齒條的齒形是簡化的梯形齒,齒 0 的中心在局部 +X(齒條在局部 x = 0)。
import { TAU } from "./kit.js";
import { pointInPolygon } from "./contact.js";

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
 * blank 也可以是函式 (i) => "tip" | "root",逐個缺齒處決定。
 */
export function gearProfile({ teeth, radius, internal = false, has = () => true, blank = "root" }) {
  const { m, addendum, dedendum, pitch } = gearSize(radius, teeth);
  const tip = internal ? radius - addendum : radius + addendum;
  const root = internal ? radius + dedendum : radius - dedendum;
  const blankR = (i) => ((typeof blank === "function" ? blank(i) : blank) === "tip" ? tip : root);
  const pts = [];
  const next = (i) => has((i + 1) % teeth);
  for (let i = 0; i < teeth; i++) {
    const a = i * pitch;
    if (!has(i)) {
      // 缺齒段的弧;下一個齒在的話,弧的末點留著,交界才是徑向的階(否則階會斜一個取樣步,實體多出一小片)
      // (下一個也是缺齒、但 blank 不同時,同樣留著末點,交界是徑向的階)
      const step = !next(i) && blankR(i) !== blankR((i + 1) % teeth);
      pts.push(...arcPoints(blankR(i), a - pitch / 2, a + pitch / 2).slice(0, next(i) || step ? undefined : -1));
      continue;
    }
    const wr = halfWidth(radius, m, root, internal);
    const wt = halfWidth(radius, m, tip, internal);
    // 齒根圓弧(前一個齒槽的後半)→ 齒側 → 齒頂 → 齒側 → 齒根圓弧
    pts.push(...arcPoints(root, a - pitch / 2, a - wr).slice(0, -1));
    pts.push([root * Math.cos(a - wr), root * Math.sin(a - wr)]);
    pts.push(...arcPoints(tip, a - wt, a + wt));
    pts.push([root * Math.cos(a + wr), root * Math.sin(a + wr)]);
    // 下一個齒缺的話,齒根弧的末點留著,交界同樣是徑向的階
    pts.push(...arcPoints(root, a + wr, a + pitch / 2).slice(1, next(i) ? -1 : undefined));
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
 * tips(可省):削低齒頂的齒,{ 從 a0 起算的第幾齒(0 起): 剩下的齒冠高(以模數為 1)},齒側照原來的斜度。
 */
export function sectorShape({ teeth, radius, span, bore = 0, tips = {} }) {
  const { m, addendum, dedendum, pitch } = gearSize(radius, teeth);
  const root = radius - dedendum;
  const [a0, a1] = span;
  const first = Math.ceil(a0 / pitch + 0.5 - 1e-9);
  const last = Math.floor(a1 / pitch - 0.5 + 1e-9);
  const wr = halfWidth(radius, m, root, false);
  const pts = [[0, 0]];
  let at = a0;
  for (let i = first; i <= last; i++) {
    const a = i * pitch;
    const tip = radius + (tips[i - first] ?? 1) * addendum;
    const wt = halfWidth(radius, m, tip, false);
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

/**
 * 端頭的銷孔畫出圓頭:把輪廓上離 center 最近的那條邊(銷孔圓心落在上面的平頭)換成以 center 為圓心、
 * 半徑 r 的圓弧,弧從一端點的方向繞到另一端點的方向,走外形外面那一側;其他頂點照舊。r 不小於端頭半寬時圓頭平順
 */
export function roundEnd(outline, center, r) {
  const n = outline.length;
  const [cx, cy] = center;
  const gap = (a, b) => {
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
    const t = Math.max(0, Math.min(1, ((cx - a[0]) * dx + (cy - a[1]) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(a[0] + t * dx - cx, a[1] + t * dy - cy);
  };
  let edge = 0;
  for (let i = 1; i < n; i++) if (gap(outline[i], outline[(i + 1) % n]) < gap(outline[edge], outline[(edge + 1) % n])) edge = i;
  const [a, b] = [outline[edge], outline[(edge + 1) % n]];
  const a0 = Math.atan2(a[1] - cy, a[0] - cx);
  const ccw = (((Math.atan2(b[1] - cy, b[0] - cx) - a0) % TAU) + TAU) % TAU;
  const mid = (sweep) => [cx + r * Math.cos(a0 + sweep / 2), cy + r * Math.sin(a0 + sweep / 2)];
  const sweep = pointInPolygon(mid(ccw), outline) ? ccw - TAU : ccw;
  const arc = arcPoints(r, a0, a0 + sweep, cx, cy).filter((p) => Math.hypot(p[0] - a[0], p[1] - a[1]) > 1e-9 && Math.hypot(p[0] - b[0], p[1] - b[1]) > 1e-9);
  return [...outline.slice(0, edge + 1), ...arc, ...outline.slice(edge + 1)];
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

/**
 * 輪轂上伸出幾根臂的板件輪廓(槓桿、踏板、錘柄):圓形輪轂(半徑 boss)與各臂(寬 width、從原點沿 angle 伸 length)
 * 併成一圈,臂根併進輪轂,輪轂裡可以再開樞軸孔。arms 依角度逆時針排列;相鄰兩臂的夾角要大於臂寬在輪轂上張開的角
 */
export function hubArms(boss, width, arms) {
  const h = width / 2;
  const open = Math.asin(h / boss); // 臂的一側在輪轂上張開的角
  const sorted = [...arms].sort((a, b) => a.angle - b.angle);
  return sorted.flatMap(({ angle, length }, i) => {
    const t = [Math.cos(angle), Math.sin(angle)];
    const n = [-t[1], t[0]];
    const next = sorted[(i + 1) % sorted.length].angle + (i + 1 === sorted.length ? TAU : 0);
    return [
      [length * t[0] - h * n[0], length * t[1] - h * n[1]], // 臂端的右角
      [length * t[0] + h * n[0], length * t[1] + h * n[1]], // 臂端的左角
      ...arcPoints(boss, angle + open, next - open), // 從這根臂的左側根部繞輪轂到下一根臂的右側根部
    ];
  });
}

/**
 * 沿 z 從 z0 到 z1 的圓柱附件(銷、軸、凸台):半徑 radius、圓心在 (x, y)。base 是掛著它的零件的深度,
 * z0、z1 是世界深度時傳 base,回傳的 at 換成相對零件的座標
 */
export const zCylinder = (z0, z1, radius, [x, y] = [0, 0], base = 0) => ({ kind: "cylinder", radius, length: z1 - z0, at: [x, y, (z0 + z1) / 2 - base] });

/** 由兩個角點的座標範圍定的方塊(x0..x1、y0..y1、z0..z1);extra 併進方塊(例如 role) */
export const spanBox = (x0, x1, y0, y1, z0, z1, extra = {}) => ({ kind: "box", ...extra, size: [x1 - x0, y1 - y0, z1 - z0], at: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2] });

/** 正多邊形(n 邊,外接圓半徑 r;第一個頂點在角度 start) */
export const polygon = (n, r, start = 0) =>
  Array.from({ length: n }, (_, i) => [r * Math.cos(start + (i * TAU) / n), r * Math.sin(start + (i * TAU) / n)]);
