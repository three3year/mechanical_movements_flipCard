// 棘輪與棘爪的接觸規則(ADR-0001:以運動學規則描述接觸,不用碰撞引擎)。純函式,平面在 xy。
// 棘輪的齒形與 shapes.ratchetShape 相同:dir = +1 時棘爪推動輪逆時針轉,−1 順時針。
import { TAU, wrap } from "./kit.js";
import { swingPhase } from "./kit.js";

/** 棘輪表面在輪局部角 a 處離圓心的距離(與 ratchetShape 的折線一致) */
export function ratchetRadius({ teeth, outer, inner, dir = 1 }, a) {
  const pitch = TAU / teeth;
  let f = wrap(a) / pitch;
  f -= Math.floor(f);
  if (dir < 0) {
    // 齒根(0)沿斜背升到齒尖(0.92),直面落回齒根(0.98)
    if (f < 0.92) return inner + ((outer - inner) * f) / 0.92;
    if (f < 0.98) return outer - ((outer - inner) * (f - 0.92)) / 0.06;
    return inner;
  }
  // 鏡像:齒根(0.02)沿直面升到齒尖(0.08),斜背落回齒根(1)
  if (f < 0.02) return inner;
  if (f < 0.08) return inner + ((outer - inner) * (f - 0.02)) / 0.06;
  return outer - ((outer - inner) * (f - 0.08)) / 0.92;
}

/**
 * 棘爪靠在輪上:棘爪繞 pivot 擺動,爪尖在離 pivot length 處。從 from(爪尖朝外的角度)
 * 往 into(+1 逆時針 / −1 順時針)方向轉,直到爪尖第一次碰到輪面。回傳棘爪轉角與爪尖位置。
 * wheel:{ center, angle, teeth, outer, inner, dir }。
 */
export function pawlRest({ pivot, length, from, into, sweep = 1.2 }, wheel) {
  const tipAt = (psi) => [pivot[0] + length * Math.cos(psi), pivot[1] + length * Math.sin(psi)];
  const gap = (psi) => {
    const [x, y] = tipAt(psi);
    const dx = x - wheel.center[0];
    const dy = y - wheel.center[1];
    return Math.hypot(dx, dy) - ratchetRadius(wheel, Math.atan2(dy, dx) - wheel.angle);
  };
  const steps = 240;
  let prev = from;
  let psi = from;
  for (let i = 1; i <= steps; i++) {
    psi = from + (into * sweep * i) / steps;
    if (gap(psi) <= 0) {
      let lo = prev;
      let hi = psi;
      for (let k = 0; k < 40; k++) {
        const mid = (lo + hi) / 2;
        if (gap(mid) > 0) lo = mid;
        else hi = mid;
      }
      psi = lo;
      break;
    }
    prev = psi;
  }
  const [x, y] = tipAt(psi);
  return { angle: psi, tip: [x, y, pivot[2] ?? 0] };
}

/**
 * 往復推動的棘輪累計前進量。v 是累計行程(見 kit.swing),span 是單程行程;
 * 推程中輪跟著推爪前進 pushed(0 → step),回程不動。回傳累計前進量(以 step 為單位的角度或長度)。
 */
export function ratchetAdvance(v, span, step, pushed) {
  const { cycle, forward } = swingPhase(v, 0, span);
  return cycle * step + (forward ? pushed : step);
}
