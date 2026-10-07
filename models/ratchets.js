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

/**
 * 棘輪當作接觸的障礙物(世界座標多邊形):每個齒一個三角形,加上齒根圓。
 * 拆成小塊,接觸判斷時外框測試就能略過大部分的齒。
 */
export function ratchetObstacles({ teeth, outer, inner, dir = 1 }, angle, center = [0, 0]) {
  const pitch = (2 * Math.PI) / teeth;
  const at = (r, a) => [center[0] + r * Math.cos(a + angle), center[1] + r * Math.sin(a + angle)];
  const tri = [];
  for (let i = 0; i < teeth; i++) {
    const a = i * pitch;
    tri.push(
      dir < 0
        ? [at(inner, a), at(outer, a + 0.92 * pitch), at(inner, a + 0.98 * pitch)]
        : [at(inner, a + 0.02 * pitch), at(outer, a + 0.08 * pitch), at(inner, a + pitch)],
    );
  }
  const disc = Array.from({ length: teeth * 2 }, (_, i) => at(inner, (i / (teeth * 2)) * 2 * Math.PI));
  return [...tri, disc];
}

/**
 * 雙作用棘爪(兩根棘爪交替推動,第 77–80 種):主動量 v 是累計行程,搖桿在 from 與 to 之間往復。
 * f1(ψ):搖桿往 to 走時被第一根棘爪推動的從動件位置;f2(ψ):往 from 走時被第二根推動的位置。
 * 從動件每一程都被推,累計前進「幾乎連續」。回傳從動件的累計位置。
 */
export function doubleAction(v, from, to, f1, f2) {
  const { at, cycle, forward } = swingPhase(v, from, to);
  const d1 = f1(to) - f1(from);
  const d2 = f2(from) - f2(to);
  const base = cycle * (d1 + d2);
  return forward ? base + f1(at) - f1(from) : base + d1 + f2(at) - f2(to);
}

/**
 * 被自重或彈簧壓在棘輪上的爪,逐步跟著主動量 x 走:齒背把爪抬起時爪跟著被抬(停在碰到的角度);
 * 過了齒尖,爪從靜止以固定的角加速度 acc(每單位主動量平方的弧度)落回,碰到輪面就停。
 * rest(x):主動量 x 時爪能落到的最深角度(爪尖碰到輪面,例如 pawlRest 的 angle);into:爪落下時角度的增減方向(±1)。
 * 從 x0 起(爪靠在輪上)逐步算到 x1,回傳 at(x)(x 超出範圍時取端點)。
 */
export function pawlTrack({ rest, x0, x1, into = 1, acc, samples = 1200 }) {
  const dx = (x1 - x0) / samples;
  const table = [rest(x0)];
  let psi = table[0];
  let w = 0;
  for (let i = 1; i <= samples; i++) {
    const limit = rest(x0 + i * dx);
    const next = psi + into * (w + acc * dx) * dx;
    if (into * (next - limit) >= 0) {
      psi = limit;
      w = 0;
    } else {
      psi = next;
      w += acc * dx;
    }
    table.push(psi);
  }
  return (x) => {
    const f = Math.min(samples, Math.max(0, (x - x0) / dx));
    const i = Math.min(samples - 1, Math.floor(f));
    return table[i] + (table[i + 1] - table[i]) * (f - i);
  };
}
