// 非圓齒輪(橢圓、矩形……)的運動學:純函式。節曲線以極座標 r(φ)(輪局部角)描述。
// 兩輪在固定的中心距 D 上純滾動:接觸點在連心線上,r1 + r2 = D,r1·dθ1 = r2·dθ2(反向)。
// 齒依節曲線的弧長均分,兩輪滾過的弧長相等,所以齒距相同就一直咬合。
import { TAU } from "./kit.js";

const N = 2048;

/** 單調遞增的取樣表 xs → ys 的線性內插(xs 必須遞增) */
export function interpolate(xs, ys, x) {
  if (x <= xs[0]) return ys[0];
  const last = xs.length - 1;
  if (x >= xs[last]) return ys[last];
  let lo = 0;
  let hi = last;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (xs[mid] <= x) lo = mid;
    else hi = mid;
  }
  const t = (x - xs[lo]) / (xs[hi] - xs[lo] || 1);
  return ys[lo] + (ys[hi] - ys[lo]) * t;
}

/** 累積積分表:x 從 0 到 span 取 N 段,∫ f dx(梯形法) */
export function cumulative(f, span, n = N) {
  const xs = [0];
  const ys = [0];
  let prev = f(0);
  for (let i = 1; i <= n; i++) {
    const x = (span * i) / n;
    const v = f(x);
    xs.push(x);
    ys.push(ys[i - 1] + ((prev + v) / 2) * (span / n));
    prev = v;
  }
  return { xs, ys };
}

/** 週期函式的取樣:x 超出 [0, span] 時依 period(每週期 y 增加多少)外推 */
export function periodic(table, span) {
  const total = table.ys[table.ys.length - 1];
  return (x) => {
    const k = Math.floor(x / span);
    return k * total + interpolate(table.xs, table.ys, x - k * span);
  };
}

/** 反函數(y 必須單調遞增) */
export function inverseOf(table) {
  return { xs: table.ys, ys: table.xs };
}

/**
 * 主動輪節曲線 r1 的共軛輪:回傳中心距 D、從動輪轉角 θ2(θ1)(與主動輪反向)與從動輪節曲線 r2(φ)。
 * 主動輪轉一圈時從動輪轉 turns 圈(預設 1):以二分法找出 D。
 * 接觸點:主動輪在局部角 contact − θ1,從動輪在局部角 contact + π − θ2(contact 是連心線方向)。
 */
export function conjugate(r1, { turns = 1, contact = 0 } = {}) {
  const spin = (D) => cumulative((t) => r1(contact - t) / (D - r1(contact - t)), TAU).ys[N];
  let max = 0;
  for (let i = 0; i < 360; i++) max = Math.max(max, r1((i / 360) * TAU));
  let lo = max * 1.0001;
  let hi = max * 20;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (spin(mid) > TAU * turns) lo = mid;
    else hi = mid;
  }
  const D = (lo + hi) / 2;
  const table = cumulative((t) => r1(contact - t) / (D - r1(contact - t)), TAU);
  const angle = periodic(table, TAU); // 從動輪轉過的角度(取正值;實際轉向與主動輪相反)
  // 從動輪節曲線:從動輪轉 a 時,接觸點在它的局部角 contact + π + a,距離 D − r1
  const phis = [];
  const radii = [];
  for (let i = 0; i <= N; i++) {
    phis.push(table.ys[i]);
    radii.push(D - r1(contact - table.xs[i]));
  }
  const r2 = (phi) => {
    const local = (((phi - contact - Math.PI) % (TAU * turns)) + TAU * turns) % (TAU * turns);
    return interpolate(phis, radii, local);
  };
  return { D, driven: (theta) => -angle(theta), r2 };
}

/** 節曲線上取樣:回傳每點的 [x, y]、弧長 s、外法線 n */
export function samplePitch(r, n = 720) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    pts.push([r(a) * Math.cos(a), r(a) * Math.sin(a)]);
  }
  const s = [0];
  for (let i = 1; i <= n; i++) {
    const p = pts[i % n];
    const q = pts[i - 1];
    s.push(s[i - 1] + Math.hypot(p[0] - q[0], p[1] - q[1]));
  }
  return { pts, s, length: s[n] };
}

/** 節曲線上局部角 phi 處的弧長(從局部角 0 起算) */
export function arcAt(r, phi) {
  const table = cumulative((a) => {
    const d = (r(a + 1e-4) - r(a - 1e-4)) / 2e-4;
    return Math.hypot(r(a), d);
  }, TAU, 1024);
  return periodic(table, TAU)(phi);
}

/**
 * 依節曲線做非圓齒輪的齒廓:teeth 個齒依弧長均分,齒 0 的中心在弧長 start 處。
 * 齒高 addendum、齒根 dedendum(沿外法線);梯形齒。
 */
export function noncircularOutline(r, { teeth, addendum, dedendum, start = 0, n = 1440 }) {
  const { pts, s, length } = samplePitch(r, n);
  const pitch = length / teeth;
  const out = [];
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const next = pts[(i + 1) % n];
    let nx = next[1] - prev[1];
    let ny = -(next[0] - prev[0]);
    const l = Math.hypot(nx, ny) || 1;
    nx /= l;
    ny /= l;
    const u = (s[i] - start) / pitch;
    const c = Math.abs(u - Math.round(u)); // 0 為齒中心,0.5 為齒槽中心
    let h;
    if (c < 0.14) h = addendum;
    else if (c < 0.27) h = addendum - ((addendum + dedendum) * (c - 0.14)) / 0.13;
    else h = -dedendum;
    out.push([pts[i][0] + nx * h, pts[i][1] + ny * h]);
  }
  return out;
}
