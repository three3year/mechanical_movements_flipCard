// 非圓齒輪與「軸心可擺動」的圓齒輪咬合(第 196、201、221、222 種共用):純函式。
// 非圓齒輪 G 的軸心固定(或沿已知路徑移動),節曲線 r(φ)(局部角);圓齒輪 P 的軸心裝在一支繞 O 擺動、
// 長 L 的臂(或框架)上,被壓著保持咬合:P 的節圓與 G 的節曲線相切——P 的軸心在接觸點的法線上、離接觸點 rp
// (非圓曲線的法線不過 G 的軸心,所以不是「連心線上、離 G 軸心 r + rp」;那樣擺 P 會斜著咬進 G)。
// 以 G 的接觸局部角 φ 為參數取一圈的表:P 軸心位置、G 的轉角、P 的轉角(純滾動積分)與臂的轉角。
// 滾動:兩輪滾過的弧長相等。G 的齒是沿節曲線弧長均分的,P 的轉角用弧長積分齒才一直對得上
// (用 r·dφ 積分的話一圈下來相位會偏掉,齒頂撞進對方的齒)。
import { TAU } from "./kit.js";
import { circleCircle } from "./linkage.js";
import { interpolate } from "./noncircular.js";

const N = 1440;

/**
 * r:G 的節曲線(局部角 → 半徑);fixed:固定的那個軸心;rp:P 的節圓半徑;
 * pivot、arm:另一個軸心所在擺臂的樞軸與長度;moving:擺動的是 "pinion"(P,預設)還是 "gear"(G);
 * side:circleCircle 取哪一個交點。回傳的 center 是擺動的那個軸心。
 * 狀態裡的 beta 是 G 軸心 → P 軸心的方向,gamma 是 P 軸心 → 接觸點的方向(世界角;排 P 的齒相位用它)。
 */
export function swingMesh({ r, fixed, rp, pivot, arm, side = 1, moving = "pinion" }) {
  // 節曲線上的點、外法線(局部座標)與 P 軸心的局部位置
  const local = (phi) => {
    const rr = r(phi);
    const d = (r(phi + 1e-4) - r(phi - 1e-4)) / 2e-4;
    const p = [rr * Math.cos(phi), rr * Math.sin(phi)];
    const t = [d * Math.cos(phi) - rr * Math.sin(phi), d * Math.sin(phi) + rr * Math.cos(phi)]; // 切線(φ 增加的方向)
    const l = Math.hypot(t[0], t[1]);
    const n = [t[1] / l, -t[0] / l];
    return { p, n, c: [p[0] + rp * n[0], p[1] + rp * n[1]] };
  };
  const rows = [];
  for (let i = 0; i <= N; i++) {
    const phi = (i / N) * TAU;
    const { p: pt, n, c } = local(phi);
    const dist = Math.hypot(c[0], c[1]); // 兩軸心的距離
    const p = circleCircle(fixed, dist, pivot, arm, side).point;
    const [g, q] = moving === "pinion" ? [fixed, p] : [p, fixed];
    const beta = Math.atan2(q[1] - g[1], q[0] - g[0]); // G → P
    rows.push({ phi, p, g, beta, cLocal: Math.atan2(c[1], c[0]), nLocal: Math.atan2(-n[1], -n[0]), pt });
  }
  // β 連續展開
  for (let i = 1; i <= N; i++) rows[i].beta += TAU * Math.round((rows[i - 1].beta - rows[i].beta) / TAU);
  let pinion = 0;
  let gamma = 0;
  for (let i = 0; i <= N; i++) {
    const row = rows[i];
    row.gear = row.beta - row.cLocal; // G 的轉角:局部的軸心方向轉到世界的 β
    row.gamma = row.gear + row.nLocal; // P 軸心看接觸點的方向(世界角)
    if (i) {
      const prev = rows[i - 1];
      row.gamma = prev.gamma + Math.atan2(Math.sin(row.gamma - prev.gamma), Math.cos(row.gamma - prev.gamma)); // 連續展開
      const ds = Math.hypot(row.pt[0] - prev.pt[0], row.pt[1] - prev.pt[1]); // 節曲線弧長(與 noncircularOutline 同樣的折線)
      pinion += row.gamma - prev.gamma + ds / rp;
    } else gamma = row.gamma;
    row.pinion = pinion;
    row.arm = Math.atan2(row.p[1] - pivot[1], row.p[0] - pivot[0]);
    // 接觸點(世界座標):G 軸心 + 節曲線上的點轉 G 的轉角
    const cos = Math.cos(row.gear);
    const sin = Math.sin(row.gear);
    row.contact = [row.g[0] + row.pt[0] * cos - row.pt[1] * sin, row.g[1] + row.pt[0] * sin + row.pt[1] * cos, 0];
  }
  // gear 連續展開(cLocal 在 ±π 處會跳)
  for (let i = 1; i <= N; i++) rows[i].gear += TAU * Math.round((rows[i - 1].gear - rows[i].gear) / TAU);
  const PHI = rows.map((w) => w.phi);
  const GEAR = rows.map((w) => -w.gear); // 遞增(G 順時針轉為正)
  const PIN = rows.map((w) => w.pinion); // 遞增
  const PX = rows.map((w) => w.p[0]);
  const PY = rows.map((w) => w.p[1]);
  const BETA = rows.map((w) => w.beta);
  const GAMMA = rows.map((w) => w.gamma);
  const CX = rows.map((w) => w.contact[0]);
  const CY = rows.map((w) => w.contact[1]);
  const gearTurn = GEAR[N] - GEAR[0]; // = 2π
  const pinionTurn = PIN[N];

  /** 參數 φ(可超過一圈)時的狀態 */
  function state(phi) {
    const k = Math.floor(phi / TAU);
    const f = phi - k * TAU;
    const at = (arr) => interpolate(PHI, arr, f);
    const p = [at(PX), at(PY), 0];
    return {
      phi,
      center: p,
      gear: -(at(GEAR) + k * gearTurn), // G 的轉角(逆時針為正)
      pinion: at(PIN) + k * pinionTurn, // P 的轉角(逆時針為正)
      beta: at(BETA),
      gamma: at(GAMMA) + k * (GAMMA[N] - GAMMA[0]),
      contact: [at(CX), at(CY), 0], // 接觸點(世界座標)
      arm: Math.atan2(p[1] - pivot[1], p[0] - pivot[0]),
    };
  }
  const phiFrom = (table, turn, v) => {
    const k = Math.floor((v - table[0]) / turn);
    return k * TAU + interpolate(table, PHI, v - k * turn);
  };
  return {
    state,
    /** G 轉到 angle(逆時針為正;G 實際順時針轉時 angle 遞減)時的狀態 */
    byGear: (angle) => state(phiFrom(GEAR, gearTurn, -angle)),
    /** P 轉到 angle 時的狀態 */
    byPinion: (angle) => state(phiFrom(PIN, pinionTurn, angle)),
    pinionTurn,
    start: rows[0],
  };
}
