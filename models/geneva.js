// 日內瓦式擋止(第 212、215 種):主動輪 A 上一根指銷(或一個齒),每轉一圈進入從動輪 B 的一道槽一次,
// 把 B 推過一格(2π/n);其餘時間 B 被 A 的鎖定圓弧卡住不動。B 的槽中有一格不開槽(凸弧),
// A 的指銷進不去,A 就被擋住——這就是限制上發條圈數的「擋止」。純函式。
// 指銷的半徑 a 由 B 的外半徑 rb 決定:指銷剛好在 B 的外圓上、與連心線夾 π/n 處進出槽,B 每格轉 2π/n。
import { TAU } from "./kit.js";

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
  /** 只允許 steps 格(之後指銷碰到不開槽的凸弧):A 可轉的範圍 */
  const range = (steps) => [-(TAU - phiE), TAU * (steps - 1) + (TAU - phiE)];
  return { a, phiE, at, range };
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
