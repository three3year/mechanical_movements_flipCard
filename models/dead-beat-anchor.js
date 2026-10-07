// 擒縱叉(錨形件)與順時針轉的擒縱輪的接觸(第 396、402 種共用;ADR-0001:以運動學規則描述接觸,不用碰撞引擎)。純函式,平面在 xy。
// - 擒縱輪的齒是窄齒、寬齒間,前緣(轉動方向那一側)是近乎沿半徑的鎖面;
// - 叉瓦的鎖面是以擒縱叉樞軸為圓心的弧(擺過頭時滑過齒尖、不推輪:靜擊式),尖端是斜的衝擊面;
// - 擒縱輪受發條的固定力矩往順時針轉,碰到叉瓦就停;叉瓦壓進齒裡就把輪推開(往較近的一邊);放開後從靜止加速轉過去。
import { TAU } from "./kit.js";
import { circle, arcPoints } from "./shapes.js";
import { polygonsOverlap } from "./contact.js";

/** 擒縱輪(順時針轉):回傳 { teeth(局部的齒多邊形,外加齒根圓), outline(畫圖用的外形), pitch } */
export function escapeWheel({ teeth, outer, inner }) {
  const pitch = TAU / teeth;
  const tooth = [[inner, 0], [outer, 0.06], [outer, 0.1], [inner, 0.32]]; // [半徑, 齒距的比例];前緣在角度小的一側
  const polys = Array.from({ length: teeth }, (_, i) => tooth.map(([r, f]) => [r * Math.cos((i + f) * pitch), r * Math.sin((i + f) * pitch)]));
  const outline = polys.flatMap((p, i) => [...p, ...arcPoints(inner, (i + 0.32) * pitch, (i + 1) * pitch).slice(1, -1)]);
  return { teeth: [...polys, circle(inner + 0.005)], outline, pitch };
}

/**
 * 靜擊式叉瓦:擒縱叉樞軸 P、擒縱輪中心 O、齒尖圓半徑 outer;叉瓦放在輪上方位 at 處。回傳叉瓦在擒縱叉局部座標
 * (原點在 P、擒縱叉居中)的多邊形(逆時針)。齒朝 P 走來的進齒叉瓦鎖在外側面,另一個鎖在內側面。
 */
export function deadBeatPallet({ P, O, outer, at, width = 0.1, lift, back = 0.3 }) {
  const C = [O[0] + outer * Math.cos(at), O[1] + outer * Math.sin(at)];
  const L = Math.hypot(C[0] - P[0], C[1] - P[1]);
  const psi = Math.atan2(C[1] - P[1], C[0] - P[0]);
  const vel = [Math.sin(at), -Math.cos(at)]; // 順時針轉時齒尖的速度方向
  const entry = vel[0] * (P[0] - C[0]) + vel[1] * (P[1] - C[1]) > 0;
  const toO = Math.atan2(O[1] - P[1], O[0] - P[0]);
  const s = Math.sign(Math.atan2(Math.sin(toO - psi), Math.cos(toO - psi))); // 往輪心是 ψ 的哪一側
  const [lockR, otherR] = entry ? [L + width / 2, L - width / 2] : [L - width / 2, L + width / 2];
  const pt = (r, q) => [r * Math.cos(q), r * Math.sin(q)];
  const lockAt = psi - (s * lift) / 2;
  const n = 8;
  const lock = Array.from({ length: n + 1 }, (_, i) => pt(lockR, lockAt - (s * back * i) / n));
  const other = Array.from({ length: n + 1 }, (_, i) => pt(otherR, lockAt + s * lift - (s * (back + lift) * i) / n)).reverse();
  const poly = [...lock, ...other];
  let area = 0;
  for (let i = 0; i < poly.length; i++) area += poly[i][0] * poly[(i + 1) % poly.length][1] - poly[(i + 1) % poly.length][0] * poly[i][1];
  return area < 0 ? poly.reverse() : poly;
}

/** 叉瓦離輪最遠的那一端(接擒縱叉的臂) */
export const palletRoot = (poly) => [(poly[8][0] + poly[9][0]) / 2, (poly[8][1] + poly[9][1]) / 2];

/**
 * 擒縱輪的轉角表:lever(v) 是主動量 v 時擒縱叉的轉角,period 是一個來回的主動量。先空走 warmup 個來回,取下一個來回當週期;
 * 每個來回放走整數個齒,逐步算的微小誤差按比例攤掉。回傳 { angle(v)(絕對轉角), perCycle, at(v)(檢查用的外形) }。
 */
export function escapeByAnchor({ P, O, wheel, pallets, lever, period, samples = 720, warmup = 2, drop = 0.08, start = 0.13 }) {
  const dir = -1; // 順時針
  const { teeth, pitch } = wheel;
  const palletsAt = (b) => pallets.map((poly) => poly.map(([x, y]) => [P[0] + x * Math.cos(b) - y * Math.sin(b), P[1] + x * Math.sin(b) + y * Math.cos(b)]));
  const teethAt = (a) => teeth.map((t) => t.map(([x, y]) => [O[0] + x * Math.cos(a) - y * Math.sin(a), O[1] + x * Math.sin(a) + y * Math.cos(a)]));
  const hits = (a, b) => {
    const ts = teethAt(a);
    return palletsAt(b).some((p) => ts.some((t) => polygonsOverlap(p, t)));
  };
  const acc = (2 * pitch) / (drop * period) ** 2;
  const dv = period / samples;
  let a = start;
  let w = 0;
  const run = [];
  for (let i = 0; i <= (warmup + 1) * samples; i++) {
    const b = lever(i * dv);
    if (hits(a, b)) {
      const clear = (sgn) => {
        let d = 0;
        while (hits(a + sgn * d, b) && d < pitch) d += pitch / 400;
        return d;
      };
      const [back, fwd] = [clear(-dir), clear(dir)];
      a += back <= fwd ? -dir * back : dir * fwd;
      w = 0;
    } else {
      w += acc * dv;
      const step = w * dv;
      const n = Math.max(1, Math.ceil(step / (pitch / 100)));
      let k = 1;
      for (; k <= n; k++) if (hits(a + (dir * step * k) / n, b)) break;
      if (k <= n) {
        a += (dir * step * (k - 1)) / n;
        w = 0;
      } else a += dir * step;
    }
    if (i >= warmup * samples) run.push(a);
  }
  const [a0, raw] = [run[0], run[samples] - run[0]];
  const turn = Math.round(raw / pitch) * pitch;
  const table = run.map((x) => a0 + ((x - a0) * turn) / raw);
  const angle = (v) => {
    const k = Math.floor(v / period);
    const x = ((v - k * period) / period) * samples;
    const i = Math.max(0, Math.min(samples - 1, Math.floor(x)));
    return k * turn + table[i] + (table[i + 1] - table[i]) * (x - i);
  };
  return { angle, perCycle: turn, at: (v) => ({ pallets: palletsAt(lever(v)), teeth: teethAt(angle(v)) }) };
}
