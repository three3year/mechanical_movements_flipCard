// 第 216 種:外側(內齒)與內側(外齒)兩個缺齒式齒輪裝在同一根軸上、一起轉,交替地與下方的小齒輪咬合:
// 外側大圈的上半有朝內的齒,內側小輪的下半有朝外的齒。輪連續旋轉時,小齒輪先被內側小輪的齒帶著反向慢慢轉
// (正向的慢運動),等外側大圈的齒轉到下方,換成被它帶著同向快轉(快速的反向運動)。主動件是輪(兩個缺齒式齒輪一起)。
// 推斷:齒數 12(內)、38(外)、小齒輪 13,同齒距,小齒輪軸心到輪心 = 內輪半徑 + 小齒輪半徑(原圖內側小輪和
// 小齒輪差不多大);外圈與內側小輪由背面一整塊背板連成一件(原圖畫在同一塊大圓盤上),小齒輪的軸因此改從前面的托架撐住。
// 「交替地」:兩圈不能同時咬著小齒輪(方向相反,會卡死)。小齒輪的齒頂圓在內側小輪那邊離連線約 ±32° 內、外圈那邊
// 約 ±19° 內都碰得到齒,所以交出的那一圈最後一齒和接手的那一圈第一齒要隔開將近 60°:內側小輪只留下半圈中間的 5 齒、
// 外圈只留上半圈中間的 14 齒(原圖是各佔半圈;507movements 的動畫也是各不到半圈、換手時留空檔)。
// 換手由外形相碰決定:交出的那一圈的齒不再推得到、也掃不到小齒輪時,小齒輪停住;接手的那一圈第一齒轉來碰到它時,
// 小齒輪對著它的是齒槽,由它接著帶。齒數取 12 / 13 / 38 是為了這一點:停住的姿勢由交出的那一圈決定,
// 接手的第一齒碰到它時是對著齒槽還是對著齒頂,看兩圈和小齒輪的齒數;12 / 14 / 40 時外圈交給內側小輪的那一次差半個齒距
// (齒頂對齒頂),12 / 13 / 38 兩次換手都只差一成齒距以內。
import { TAU } from "./kit.js";
import { pedestal } from "./supports.js";
import { shape, circle, gearProfile } from "./shapes.js";
import { resample } from "./noncircular.js";
import { placeOutline } from "./contact.js";

const PITCH = 0.38;
const NS = 12;
const NP = 13;
const NI = NS + 2 * NP;
const r = (n) => (n * PITCH) / TAU;
const RS = r(NS);
const RP = r(NP);
const RI = r(NI);
const D = RS + RP;
const PC = [0, -D];
const KS = RS / RP;
const KI = RI / RP;
const STEP_P = TAU / NP;
const wrap = (a) => ((a % TAU) + TAU) % TAU;
// 內側小輪的齒:下半圈(局部角 π–2π)兩端各去掉一齒;外圈的齒:上半圈(0–π)兩端各去掉三齒
const innerHas = (i) => i >= NS / 2 + 1 && i <= NS - 1;
const outerHas = (k) => k >= 3 && k <= NI / 2 - 3;
const innerProfile = gearProfile({ teeth: NS, radius: RS, has: innerHas });
const ringProfile = gearProfile({ teeth: NI, radius: RI, internal: true, has: outerHas });
const pinionProfile = gearProfile({ teeth: NP, radius: RP });
const PINION0 = Math.PI / 2 + Math.PI / NP; // 小齒輪轉角 0 時的姿勢:齒槽朝上

// 兩條咬合線(小齒輪轉角對輪轉角),都讓齒對著齒槽:內側小輪帶動時反向(θ = π/2 時它局部角 π 的齒在上方的接觸點,
// 小齒輪齒槽朝上);外圈帶動時同向(θ = π/2 時它局部角 π 的齒在下方的接觸點,小齒輪齒數是奇數,齒槽朝下要再轉半個齒距)
const innerLine = (theta) => -KS * (theta - Math.PI / 2);
const outerLine = (theta) => KI * (theta - Math.PI / 2) + ((NP % 2) * STEP_P) / 2;

// 齒廓都是以自己的中心為中心的星形(每個方向只交一次):用極座標表判斷點在不在齒的實體裡,穿入深度取到齒廓的最近距離。
// 這裡只拿來決定換手的時刻(載入時要算上百個姿勢,contact.js 的一般多邊形算法太慢);整圈不穿入由測試用 contact.js 檢查
function star(profile) {
  const pts = resample(profile, 0.005)
    .map(([x, y]) => [Math.atan2(y, x), Math.hypot(x, y), x, y])
    .sort((a, b) => a[0] - b[0]);
  const n = pts.length;
  const index = (a) => {
    let [lo, hi] = [0, n - 1];
    if (a < pts[0][0] || a >= pts[hi][0]) return hi;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (pts[mid][0] <= a) lo = mid;
      else hi = mid;
    }
    return lo;
  };
  return {
    vertices: profile,
    radiusAt(a) {
      const i = index(a);
      const [p, q] = [pts[i], pts[(i + 1) % n]];
      const span = wrap(q[0] - p[0]) || 1;
      return p[1] + ((q[1] - p[1]) * wrap(a - p[0])) / span;
    },
    distance(x, y) {
      const i = index(Math.atan2(y, x));
      let best = Infinity;
      for (let k = -80; k <= 80; k++) {
        const p = pts[(i + k + n) % n];
        best = Math.min(best, Math.hypot(p[2] - x, p[3] - y));
      }
      return best;
    },
  };
}
const STARS = { inner: star(innerProfile), outer: star(ringProfile), pinion: star(pinionProfile) };
// 點(另一個輪的局部座標)在不在齒的實體裡:外齒輪在齒廓內、內齒圈在齒廓外
const inside = (s, [x, y], internal) => (Math.hypot(x, y) > s.radiusAt(Math.atan2(y, x))) === internal;
const toLocal = ([x, y], [cx, cy], angle) => {
  const [c, s] = [Math.cos(-angle), Math.sin(-angle)];
  return [(x - cx) * c - (y - cy) * s, (x - cx) * s + (y - cy) * c];
};
/** 輪轉 theta、小齒輪轉角 q 時,內側小輪(which = "inner")或外圈("outer")和小齒輪互相伸進對方的深度(超過 limit 就不再算下去) */
function depth(theta, q, which, limit = Infinity) {
  const wheel = STARS[which];
  const internal = which === "outer";
  const pinionAngle = PINION0 + q;
  let d = 0;
  for (const p of placeOutline(pinionProfile, PC, pinionAngle)) {
    const local = toLocal(p, [0, 0], theta);
    if (inside(wheel, local, internal)) d = Math.max(d, wheel.distance(...local));
    if (d > limit) return d;
  }
  for (const p of placeOutline(wheel.vertices, [0, 0], theta)) {
    if (Math.hypot(p[0] - PC[0], p[1] - PC[1]) > RP + 0.2) continue;
    const local = toLocal(p, PC, pinionAngle);
    if (inside(STARS.pinion, local, false)) d = Math.max(d, STARS.pinion.distance(...local));
  }
  return d;
}
const TOUCH = 0.012; // 簡化齒形咬合時齒頂互相擦到約 0.01,超過這個才算頂到

/**
 * 一次換手:交出的那一圈(from)沿咬合線 line 帶著小齒輪。小齒輪在它的齒推不到、往外走時也掃不到小齒輪的那一刻停住
 * (從 near 之前往後找第一個「停在這裡,之後都不會再被它頂到」的輪轉角);再往後找接手的那一圈(to)第一次碰到
 * 停著的小齒輪的時刻,接手的咬合線平移整數個齒距在那一刻接上(碰到時對著齒槽,平移量取最接近的整數)。
 */
function handover({ from, to, line, next, near }) {
  const step = Math.PI / 180;
  const holds = (x) => {
    for (let k = 1; k <= 25; k++) if (depth(x + k * step, line(x), from, TOUCH) > TOUCH) return false;
    return true;
  };
  let t = near - 0.45;
  while (!holds(t)) {
    t += step;
    if (t > near + 0.5) throw new Error(`第 216 種:${from} 的齒一直碰得到小齒輪`);
  }
  let [lo, hi] = [t - step, t];
  for (let k = 0; k < 10; k++) [lo, hi] = holds((lo + hi) / 2) ? [lo, (lo + hi) / 2] : [(lo + hi) / 2, hi];
  const stop = hi;
  const held = line(stop);
  const touches = (u) => depth(u, held, to, TOUCH) > TOUCH;
  let u = stop;
  while (!touches(u + step)) {
    u += step;
    if (u > stop + 1) throw new Error(`第 216 種:找不到 ${to} 接手的時刻`);
  }
  [lo, hi] = [u, u + step];
  for (let k = 0; k < 10; k++) [lo, hi] = touches((lo + hi) / 2) ? [lo, (lo + hi) / 2] : [(lo + hi) / 2, hi];
  const slope = next(1) - next(0);
  const shift = Math.round((held - next(hi)) / STEP_P) * STEP_P;
  return { stop, start: (held - shift - next(0)) / slope, held, line: (x) => next(x) + shift };
}
// A:內側小輪交給外圈(θ = π/2 附近);B:外圈交給內側小輪(θ = 3π/2 附近)
const A = handover({ from: "inner", to: "outer", line: innerLine, next: outerLine, near: Math.PI / 2 });
const B = handover({ from: "outer", to: "inner", line: A.line, next: innerLine, near: 1.5 * Math.PI });
const CYCLE = B.start - TAU; // 一圈從內側小輪接手時算起
const PER_CYCLE = B.line(B.start) - innerLine(CYCLE); // 每圈小齒輪淨轉的角度

/** 輪轉 theta(逆時針):小齒輪的轉角,與目前由哪一圈帶動("none" 是換手的空檔) */
export function pinion(theta) {
  const k = Math.floor((theta - CYCLE) / TAU);
  const t = theta - k * TAU;
  let angle;
  let by;
  if (t < A.stop) [angle, by] = [innerLine(t), "inner"];
  else if (t < A.start) [angle, by] = [A.held, "none"];
  else if (t < B.stop) [angle, by] = [A.line(t), "outer"];
  else [angle, by] = [B.held, "none"];
  return { angle: angle + k * PER_CYCLE, by };
}
export const radii = { RS, RP, RI };
/** 兩次換手的空檔(輪轉角,第一圈) */
export const dwells = [[A.stop, A.start], [B.stop, B.start]];
/** 平面外形(各自的局部座標):內側小輪、外圈的齒廓(內孔)、小齒輪 */
export const outlines = { inner: innerProfile, ring: ringProfile, pinion: pinionProfile };

const innerGear = resample(innerProfile, 0.03);
const outerTeeth = resample(ringProfile, 0.03);
const BACK_Z = -0.13; // 背板:在外圈、內側小輪與小齒輪後面
const PIN_FRONT = 0.45; // 小齒輪軸的托架:在輪的前面
const FLOOR = -4.24;
const POST_X = RI + 0.75; // 托架的立柱在輪外

export default {
  figure: 216,
  parts: [
    {
      id: "wheel",
      kind: "group",
      spin: RI + 0.45,
      pieces: [
        { kind: "plate", shape: shape(circle(RI + 0.4), [[...outerTeeth].reverse()]), thickness: 0.2 },
        // 推斷:背板把外圈和軸轂連成一件(原圖外圈與內側小輪畫在同一塊大圓盤上);小齒輪在它前面
        { kind: "plate", shape: shape(circle(RI + 0.4), [circle(0.2).reverse()]), thickness: 0.06, at: [0, 0, BACK_Z], mark: [0, -(RI + 0.34)], markSize: 0.06 },
        { kind: "plate", shape: shape(innerGear, [circle(0.2).reverse()]), thickness: 0.2 },
        { kind: "cylinder", radius: 0.42, inner: 0.2, length: 0.3, mark: true },
      ],
    },
    // 小齒輪的轉向箭頭擺在輪的前面一層,不被上方的內側小輪擋住
    { id: "pinion", kind: "gear", center: [0, -D, 0], teeth: NP, radius: RP, width: 0.18, bore: 0.12, hub: false, spinOffset: 0.3 },
    {
      id: "bearings",
      kind: "group",
      pieces: [
        // 推斷(原圖只畫出輪轂):輪的固定軸往後伸進一座落地的軸承座
        { kind: "cylinder", radius: 0.1, length: 0.63, at: [0, 0, -0.215] },
        ...pedestal({ at: [0, 0], z: -0.53, bore: 0.1, floor: FLOOR, depth: 0.2 }),
        // 推斷:小齒輪的固定軸往前伸進輪前面的托架(背板擋在後面,軸不能往後伸);托架的橫臂往右伸到輪外再落地,
        // 不擋住小齒輪上下兩處的咬合
        { kind: "cylinder", radius: 0.1, length: PIN_FRONT + 0.1 - -0.08, at: [0, -D, (PIN_FRONT + 0.1 + -0.08) / 2] },
        { kind: "cylinder", radius: 0.25, inner: 0.1, length: 0.2, at: [0, -D, PIN_FRONT] },
        { kind: "box", size: [POST_X + 0.15 - 0.2, 0.26, 0.2], at: [(POST_X + 0.15 + 0.2) / 2, -D, PIN_FRONT] },
        { kind: "box", size: [0.3, -D + 0.13 - FLOOR, 0.2], at: [POST_X, (-D + 0.13 + FLOOR) / 2, PIN_FRONT] },
        { kind: "box", size: [1.0, 0.18, 0.6], at: [POST_X, FLOOR - 0.09, PIN_FRONT] },
      ],
    },
  ],
  driver: { part: "wheel", type: "rotation" },
  target: "pinion",
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    return { parts: { wheel: { angle: theta }, pinion: { angle: PINION0 + pinion(theta).angle } }, readouts: [] };
  },
};
