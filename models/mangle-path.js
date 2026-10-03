// 曼格輪與曼格式齒條的通用運動學(第 192–194、197、198 種):齒輪(或齒條框架)上一條封閉的「節路徑」,
// 小齒輪在路徑的左側沿著它滾動。純函式。
//   曼格輪(mode "wheel"):小齒輪的軸被溝槽引導(軸上有萬向接頭可以擺動),在世界中只沿輪心正下方的直線升降;
//     輪轉到讓「小齒輪軸心在輪上的位置」落在這條直線上。
//   曼格式齒條(mode "slide"):框架只平移;小齒輪軸心在框架上的位置 Q,由呼叫端決定誰去配合
//     (第 197 種小齒輪升降、第 198 種齒條升降)。
//
// 路徑由幾段組成(輪或框架的局部座標):
//   { arc: [cx, cy], r, from, to }:圓弧(from → to,角度可增可減);
//   { line: [x0, y0], to: [x1, y1] }:直線;
//   { pin: [x, y], sweep }:端點的單一齒(銷)——小齒輪繞著它擺過 sweep 角(路徑在這裡掉頭)。
// 小齒輪的節圓與路徑相切、在路徑左側;滾動不滑動:小齒輪相對輪的轉角 dθ = dQ · (k × n) / RP
// (Q 是小齒輪軸心,n 是由接觸點指向軸心的單位向量)。小齒輪在世界中的轉角 = 相對輪的轉角 + 輪的轉角。
import { TAU } from "./kit.js";

const STEP = 0.01;

/** 一段路徑的取樣點(不含終點)與末端的法線 */
function samplesOf(seg, startNormal) {
  if (seg.arc) {
    const n = Math.max(2, Math.ceil((Math.abs(seg.to - seg.from) * seg.r) / STEP));
    // 沿 +角度走時左側是圓心那一側
    const normalAt = (a) => (seg.to > seg.from ? [-Math.cos(a), -Math.sin(a)] : [Math.cos(a), Math.sin(a)]);
    const list = Array.from({ length: n }, (_, i) => {
      const a = seg.from + ((seg.to - seg.from) * i) / n;
      return { p: [seg.arc[0] + seg.r * Math.cos(a), seg.arc[1] + seg.r * Math.sin(a)], n: normalAt(a) };
    });
    return { list, end: normalAt(seg.to) };
  }
  if (seg.line) {
    const d = [seg.to[0] - seg.line[0], seg.to[1] - seg.line[1]];
    const l = Math.hypot(...d);
    const normal = [-d[1] / l, d[0] / l];
    const n = Math.max(2, Math.ceil(l / STEP));
    const list = Array.from({ length: n }, (_, i) => ({ p: [seg.line[0] + (d[0] * i) / n, seg.line[1] + (d[1] * i) / n], n: normal }));
    return { list, end: normal };
  }
  const start = Math.atan2(startNormal[1], startNormal[0]);
  const n = 40;
  const list = Array.from({ length: n }, (_, i) => {
    const b = start + (seg.sweep * i) / n;
    return { p: seg.pin, n: [Math.cos(b), Math.sin(b)] };
  });
  return { list, end: [Math.cos(start + seg.sweep), Math.sin(start + seg.sweep)] };
}

/**
 * segments:依序首尾相接、繞成一圈的路徑段;rp:小齒輪節圓半徑;mode:"wheel" 或 "slide"。
 * 銷段的起始法線由前一段的末端法線接上。
 */
export function manglePath(segments, rp, mode = "wheel") {
  const pts = [];
  let normal = null;
  for (const seg of segments) {
    const { list, end } = samplesOf(seg, normal);
    pts.push(...list);
    normal = end;
  }
  pts.push({ ...pts[0] }); // 回到起點
  const q = pts.map(({ p, n }) => [p[0] + rp * n[0], p[1] + rp * n[1]]);
  // 輪的轉角:讓軸心落在輪心正下方(連續展開);齒條框架不轉
  const wheel = [];
  for (let i = 0; i < q.length; i++) {
    if (mode === "slide") {
      wheel.push(0);
      continue;
    }
    let w = -Math.PI / 2 - Math.atan2(q[i][1], q[i][0]);
    if (i) w += TAU * Math.round((wheel[i - 1] - w) / TAU);
    wheel.push(w);
  }
  // 小齒輪相對輪的轉角(滾動),再加上輪的轉角得到世界中的轉角
  const pinion = [0];
  let rel = 0;
  for (let i = 1; i < q.length; i++) {
    const n = pts[i - 1].n;
    const m = pts[i].n;
    const k = [-(n[1] + m[1]) / 2, (n[0] + m[0]) / 2];
    rel += ((q[i][0] - q[i - 1][0]) * k[0] + (q[i][1] - q[i - 1][1]) * k[1]) / rp;
    pinion.push(rel + wheel[i] - wheel[0]);
  }
  const sense = Math.sign(pinion[pinion.length - 1]);
  const period = Math.abs(pinion[pinion.length - 1]);
  const drive = pinion.map((a) => a * sense); // 主動量:小齒輪往 sense 方向轉,遞增
  const radius = q.map(([x, y]) => Math.hypot(x, y));

  /**
   * 小齒輪轉了 alpha(沿 sense 方向):輪的轉角、小齒輪軸心離輪心的距離 r、
   * 軸心在輪(框架)上的位置 q、小齒輪在世界中轉過的角度。
   */
  function at(alpha) {
    const k = Math.floor(alpha / period);
    const t = alpha - k * period;
    let lo = 0;
    let hi = drive.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (drive[mid] <= t) lo = mid;
      else hi = mid;
    }
    const f = drive[hi] > drive[lo] ? (t - drive[lo]) / (drive[hi] - drive[lo]) : 0;
    const lerp = (arr) => arr[lo] + (arr[hi] - arr[lo]) * f;
    const point = [q[lo][0] + (q[hi][0] - q[lo][0]) * f, q[lo][1] + (q[hi][1] - q[lo][1]) * f];
    return { wheel: lerp(wheel), y: -lerp(radius), q: point, pinion: sense * alpha, index: lo + f };
  }
  /** 小齒輪的起始轉角:起點(弧長 0,輪上一齒的中心)正對小齒輪的一個齒間 */
  const n0 = pts[0].n;
  const phase = (np) => Math.atan2(-n0[1], -n0[0]) + wheel[0] + Math.PI / np;
  /** 小齒輪軸心走到輪上 test(q) 為真的第一個位置時的主動量 */
  const driveWhere = (test) => drive[q.findIndex((p, i) => i > 0 && test(p))];
  return { at, period, sense, drive, phase, driveWhere, pitch: pts.map(({ p }) => p), centers: q, wheel, pinionAngles: pinion };
}

/** 一串圓弧與直線的總長(用來讓齒距整除路徑) */
export const arcLength = (segments) =>
  segments.reduce((sum, s) => sum + (s.arc ? Math.abs(s.to - s.from) * s.r : s.line ? Math.hypot(s.to[0] - s.line[0], s.to[1] - s.line[1]) : 0), 0);

/** 連接兩點的半圓端頭(逆時針繞過去,小齒輪在半圓內側) */
export function cap(a, b) {
  const c = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const from = Math.atan2(a[1] - c[1], a[0] - c[0]);
  return { arc: c, r: Math.hypot(a[0] - c[0], a[1] - c[1]), from, to: from + Math.PI };
}

/** 圓弧段上角度 a 處的點 */
export const arcPoint = (c, r, a) => [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];

/** 小齒輪軸心在輪的正下方(曼格輪的起始位置) */
export const belowHub = ([x, y]) => x > 0 && y < 0 && Math.abs(Math.atan2(y, x) + Math.PI / 2) < 0.02;
