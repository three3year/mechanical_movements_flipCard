// 非圓齒輪與「軸心可擺動」的圓齒輪咬合(第 196、201、221、222 種共用):純函式。
// 非圓齒輪 G 的軸心固定(或沿已知路徑移動),節曲線 r(φ)(局部角);圓齒輪 P 的軸心裝在一支繞 O 擺動、
// 長 L 的臂(或框架)上,被壓著保持咬合:兩軸心的距離永遠 = r(φ) + rp,接觸點在連心線上。
// 以 G 的接觸局部角 φ 為參數取一圈的表:P 軸心位置、G 的轉角、P 的轉角(純滾動積分)與臂的轉角。
// 滾動:相對連心線,r·d(θG − β) = −rp·d(θP − β)(β 是 G→P 連心線的方向)。
import { TAU } from "./kit.js";
import { circleCircle } from "./linkage.js";
import { interpolate } from "./noncircular.js";

const N = 1440;

/**
 * r:G 的節曲線(局部角 → 半徑);fixed:固定的那個軸心;rp:P 的節圓半徑;
 * pivot、arm:另一個軸心所在擺臂的樞軸與長度;moving:擺動的是 "pinion"(P,預設)還是 "gear"(G);
 * side:circleCircle 取哪一個交點。回傳的 center 是擺動的那個軸心。
 */
export function swingMesh({ r, fixed, rp, pivot, arm, side = 1, moving = "pinion" }) {
  const rows = [];
  for (let i = 0; i <= N; i++) {
    const phi = (i / N) * TAU;
    const p = circleCircle(fixed, r(phi) + rp, pivot, arm, side).point;
    const [g, q] = moving === "pinion" ? [fixed, p] : [p, fixed];
    const beta = Math.atan2(q[1] - g[1], q[0] - g[0]); // G → P
    rows.push({ phi, p, beta });
  }
  // β 連續展開
  for (let i = 1; i <= N; i++) rows[i].beta += TAU * Math.round((rows[i - 1].beta - rows[i].beta) / TAU);
  let pinion = 0;
  for (let i = 0; i <= N; i++) {
    const row = rows[i];
    row.gear = row.beta - row.phi;
    if (i) {
      const prev = rows[i - 1];
      pinion += row.beta - prev.beta + (((r(row.phi) + r(prev.phi)) / 2) * (row.phi - prev.phi)) / rp;
    }
    row.pinion = pinion;
    row.arm = Math.atan2(row.p[1] - pivot[1], row.p[0] - pivot[0]);
  }
  const PHI = rows.map((w) => w.phi);
  const GEAR = rows.map((w) => -w.gear); // 遞增(G 順時針轉為正)
  const PIN = rows.map((w) => w.pinion); // 遞增
  const PX = rows.map((w) => w.p[0]);
  const PY = rows.map((w) => w.p[1]);
  const BETA = rows.map((w) => w.beta);
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
