// 日內瓦式擋止(第 212、215 種):主動輪 A 上一根指銷(或一個齒),每轉一圈進入從動輪 B 的一道槽一次,
// 把 B 推過一格(2π/n);其餘時間 B 被 A 的鎖定圓弧卡住不動。B 有一格不挖鎖定弧(凸弧):指銷推著 B 往那一格換格時,
// 凸弧轉過來頂到 A 的鎖定圓盤,A 就被擋住——這就是限制上發條圈數的「擋止」。擋住的角度由外形相碰算(stopRange)。純函式。
// 指銷的半徑 a 由 B 的外半徑 rb 決定:指銷剛好在 B 的外圓上、與連心線夾 π/n 處進出槽,B 每格轉 2π/n。
import { TAU, rot2 } from "./kit.js";

/**
 * C:兩輪中心距(A 在 B 正下方);rb:B 的外半徑;n:B 的格數。
 * A 的轉角 theta = 0 時指銷正對 B(在連心線上),指銷在第 k 次(theta ≈ 2πk)把 B 推過第 k 格。
 */
export function geneva({ C, rb, n }) {
  const ex = rb * Math.sin(Math.PI / n);
  const ey = -rb * Math.cos(Math.PI / n);
  const a = Math.hypot(ex, ey + C); // 指銷半徑
  const phiE = Math.atan2(ex, ey + C); // 指銷在槽中的半角(以 A 為中心)
  /** A 轉 theta(逆時針):B 的轉角(順時針為負)、指銷位置、是否正在推 B */
  function at(theta) {
    const k = Math.round(theta / TAU);
    const phi = theta - k * TAU;
    const pin = [-a * Math.sin(phi), -C + a * Math.cos(phi), 0];
    let gamma;
    if (phi > phiE) gamma = -Math.PI / n;
    else if (phi < -phiE) gamma = Math.PI / n;
    else gamma = Math.atan2(pin[1], pin[0]) + Math.PI / 2;
    return { b: -k * (TAU / n) + gamma, pin, engaged: Math.abs(phi) <= phiE, k };
  }
  const A = [0, -C];
  /** A 局部座標的點在 A 轉 theta 時的世界座標(A 的中心在 B 正下方 C 處) */
  const fromA = (theta) => (p) => {
    const [x, y] = rot2(p, theta);
    return [A[0] + x, A[1] + y];
  };
  /** 世界座標的點換到 A 轉 theta 時的局部座標 */
  const toA = (theta) => ([x, y]) => rot2([x - A[0], y - A[1]], -theta);

  /**
   * A 的鎖定圓盤(A 的局部座標,齒在 +y):半徑 lock 的圓盤,齒的兩旁挖去 B 的槽角在換格途中掃過的範圍。
   * 把 B(wheel:擋止格以外的輪廓,即每格都挖鎖定弧的那一份)在一次換格的各個姿勢換到 A 的局部座標,
   * 沿 A 的每個方向取 B 最先出現的半徑,圓盤就只到那裡、再留 clearance——槽角相對於 A 的軌跡的包絡。
   * 槽角也會掃過齒根,所以齒不能和圓盤同一片板:齒(指銷)要另由圓盤後面的曲柄托著。
   */
  function disk({ wheel, lock, clearance = 0.02, samples = 240, steps = 120 }) {
    // 各姿勢的 B 只留離 A 中心不到 lock 的邊(其餘的邊碰不到圓盤)
    const edges = [];
    for (let i = 0; i <= steps; i++) {
      const phi = -phiE * 1.2 + (2.4 * phiE * i) / steps;
      const poly = wheel.map((p) => rot2(p, at(phi).b)).map(toA(phi));
      poly.forEach((p, j) => {
        const q = poly[(j + 1) % poly.length];
        if (segmentReach(p, q) < lock + clearance) edges.push([p, q]);
      });
    }
    return Array.from({ length: samples }, (_, i) => {
      const t = (i / samples) * TAU;
      const r = Math.min(lock, rayEntry(t, edges) - clearance);
      return [r * Math.cos(t), r * Math.sin(t)];
    });
  }

  /**
   * 擋止的範圍由外形相碰決定:A 的各塊外形(parts,A 的局部座標)轉 theta,B 的輪廓(wheel,含凸弧)照日內瓦關係轉;
   * 從 from(兩者不相碰的姿勢)往兩邊轉,第一次相碰的角度就是範圍的兩端——A 的齒正推著 B 換格,凸弧轉過來頂到 A。
   * 只有換格途中 B 會動,所以只查各次換格(theta ≈ 2πk ± phiE)。
   */
  function stopRange({ parts, wheel, from = 0, turns = 12, samples = 24 }) {
    const reachB = Math.max(...wheel.map(([x, y]) => Math.hypot(x, y)));
    const reachA = Math.max(...parts.flat().map(([x, y]) => Math.hypot(x, y)));
    // 兩個輪廓相交就一定有邊相交(誰也包不住誰);只比對伸進對方輪廓範圍的邊
    const hits = (theta) => {
      const near = edgesOf(wheel.map((p) => rot2(p, at(theta).b))).filter(([p, q]) => segmentReach(p, q, A) < reachA);
      return parts.some((part) =>
        edgesOf(part.map(fromA(theta)))
          .filter(([p, q]) => segmentReach(p, q) < reachB)
          .some(([p, q]) => near.some(([r, s]) => segmentsCross(p, q, r, s))),
      );
    };
    const end = (dir) => {
      let prev = from;
      const k0 = Math.round(from / TAU);
      for (let k = k0; Math.abs(k - k0) <= turns; k += dir) {
        for (let i = 0; i <= samples; i++) {
          const theta = k * TAU + dir * phiE * (-1 + (2 * i) / samples);
          if ((theta - from) * dir <= 0) continue;
          if (hits(theta)) {
            let [lo, hi] = [prev, theta];
            for (let j = 0; j < 40; j++) {
              const mid = (lo + hi) / 2;
              if (hits(mid)) hi = mid;
              else lo = mid;
            }
            return lo;
          }
          prev = theta;
        }
      }
      return prev;
    };
    return [end(-1), end(1)];
  }
  return { a, phiE, at, disk, stopRange };
}

const edgesOf = (poly) => poly.map((p, i) => [p, poly[(i + 1) % poly.length]]);

/** 線段 p–q 離點 o(預設原點)最近的距離 */
function segmentReach(p, q, o = [0, 0]) {
  const [px, py] = [p[0] - o[0], p[1] - o[1]];
  const e = [q[0] - p[0], q[1] - p[1]];
  const t = Math.max(0, Math.min(1, -(px * e[0] + py * e[1]) / (e[0] * e[0] + e[1] * e[1] || 1)));
  return Math.hypot(px + t * e[0], py + t * e[1]);
}

/** 兩線段是否相交(只碰到端點不算) */
function segmentsCross(a, b, c, d) {
  const o = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  return o(c, d, a) * o(c, d, b) < 0 && o(a, b, c) * o(a, b, d) < 0;
}

/** 從原點沿方向 t 的射線第一次碰到邊(edges:[[p, q], …])的距離(碰不到 = Infinity) */
function rayEntry(t, edges) {
  const d = [Math.cos(t), Math.sin(t)];
  let best = Infinity;
  for (const [p, q] of edges) {
    const e = [q[0] - p[0], q[1] - p[1]];
    const den = d[0] * e[1] - d[1] * e[0];
    if (Math.abs(den) < 1e-12) continue;
    const s = (p[0] * e[1] - p[1] * e[0]) / den; // 沿射線的距離
    const u = (p[0] * d[1] - p[1] * d[0]) / den; // 沿邊的比例
    if (s > 0 && u >= 0 && u <= 1) best = Math.min(best, s);
  }
  return best;
}

/** 從動輪 B 第 j 格的凸弧(不挖鎖定弧時)兩端在 B 局部座標的角度:兩旁的槽口之間 */
export function convexArc({ rb, n, width }, j) {
  const mid = -Math.PI / 2 - Math.PI / n + (j * TAU) / n;
  const half = Math.PI / n - Math.asin(width / 2 / rb);
  return [mid - half, mid + half];
}

/**
 * 從動輪 B 的輪廓(局部座標,B 轉角 0 時第 0 道槽朝下):n 道寬 width、底在半徑 bottom 的槽;
 * 槽與槽之間是半徑 lock、圓心在 A 方向距 C 的內凹鎖定圓弧;convex 列出不挖鎖定弧(凸出,擋止用)的格。
 * 第 j 格(兩槽之間)的中心角 = −π/2 − π/n + j·2π/n。
 */
export function genevaWheel({ C, rb, n, width, bottom, lock, convex = [] }) {
  const slots = Array.from({ length: n }, (_, j) => -Math.PI / 2 + (j * TAU) / n);
  const mids = Array.from({ length: n }, (_, j) => -Math.PI / 2 - Math.PI / n + (j * TAU) / n);
  const radiusAt = (t) => {
    let r = rb;
    mids.forEach((m, j) => {
      if (convex.includes(j)) return;
      // 沿方向 t 的射線與鎖定圓(圓心 C·(cos m, sin m)、半徑 lock)的近交點
      const b = C * Math.cos(t - m);
      const disc = b * b - C * C + lock * lock;
      if (disc > 0 && b > 0) r = Math.min(r, b - Math.sqrt(disc));
    });
    return r;
  };
  const half = Math.asin(width / 2 / rb);
  const pts = [];
  slots.forEach((s, j) => {
    const next = slots[(j + 1) % n] + (j === n - 1 ? TAU : 0);
    const u = [Math.cos(s), Math.sin(s)];
    const v = [-u[1], u[0]];
    const h = Math.sqrt(rb * rb - (width / 2) ** 2);
    const corner = (along, side) => [u[0] * along + v[0] * side, u[1] * along + v[1] * side];
    pts.push(corner(h, -width / 2), corner(bottom, -width / 2), corner(bottom, width / 2), corner(h, width / 2));
    const steps = 40;
    for (let i = 1; i < steps; i++) {
      const t = s + half + ((next - half - (s + half)) * i) / steps;
      const r = radiusAt(t);
      pts.push([r * Math.cos(t), r * Math.sin(t)]);
    }
  });
  return pts;
}
