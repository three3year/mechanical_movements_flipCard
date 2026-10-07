// 第 389 種:由偏心輪、棘爪與棘輪(棘齒桿)操作的升降千斤頂。千斤頂的柱身裡有一根直立的棘齒桿,頂端是托座;
// 轉動柱身旁的偏心輪,偏心輪帶著下方的棘爪上下,每轉一圈把棘齒桿往上推;上方的棘爪是擋止,扣住棘齒不讓它退下。
// 主動件是偏心輪(以手柄轉)。
// 推斷:齒距與偏心距;棘爪的位置依原圖。
//
// 由接觸算(2026-10-07 複查,原本棘齒桿的高度照進度表每圈升一齒,棘爪固定在偏心環上、擋止固定在柱身上):
// - 棘齒做成鋸齒:每齒的下面是水平的直面(棘爪頂著它),上面是斜面(棘齒桿上升時,擋止的爪尖沿斜面被推開)。
// - 兩個棘爪都是鉸接的:下方的棘爪鉸在偏心環吊臂下端的銷上,上方的擋止鉸在柱身伸出的耳上;兩個爪尖都朝左上,
//   靠自重往左擺、搭在齒上(爪身像一根斜撐:棘齒桿壓在爪尖上時,爪只會被壓得更緊)。
// - 偏心輪往上帶時,下方的爪尖頂著齒的直面把棘齒桿推上去;往下時爪尖沿斜面滑過一齒、越過齒尖後靠自重落進下一齒。
//   棘齒桿被推上去時,擋止的爪尖被斜面推開,越過齒尖後落進下一齒;下方的爪退下時,棘齒桿靠自重落一點點,坐在擋止上。
// - 推多遠、爪何時滑過齒尖、棘齒桿停在哪裡,都由爪與齒的外形相碰決定;爪落進齒間、棘齒桿落到擋止上都是加速落下。
//   偏心距 0.25(行程 0.5)時,每圈推上兩齒(原文沒說每圈幾齒;行程要比一齒多出一截,爪才越得過齒尖)。
// 偏心環與吊臂、擋止的耳、偏心輪軸的托架是推斷(原圖只畫出偏心輪與兩個棘爪)。
import { TAU } from "./kit.js";
import { shape, circle, rect, thickLine } from "./shapes.js";
import { placeOutline, pointInPolygon, edgeDistance, polygonsOverlap } from "./contact.js";

export const PITCH = 0.22;
const ECC = { center: [0.75, 0.6, 0.3], e: 0.25, r: 0.42 }; // 偏心輪在棘齒桿的前面一層,只經偏心環與棘爪推棘齒桿
const HANG = 0.6; // 偏心環的吊臂長(偏心輪中心到下方棘爪的鉸銷)
export const TURNS = 5; // 升 2.2(十齒)
export const RANGE = [0, TURNS * TAU];
const ROOT = 0.14; // 齒根(棘齒桿右緣)
const TIP = 0.28; // 齒尖
const TEETH = 18;
const RACK_START = -0.65; // 逐步算的起點:棘齒桿放在這個高度,先空轉兩圈讓它坐到擋止上
const PAWL_Z = 0.1; // 下方的爪那一層
const STOP_Z = -0.02; // 擋止那一層(在下方的爪後面,兩個爪交錯時不相碰)
const SLOPE = 0.6; // 斜面佔齒距的比例;其餘是齒根的立壁(爪尖卡在直面下、立壁旁的角落)

// 棘齒桿的局部座標:第 i 齒的直面在 y_i,斜面從齒尖 (TIP, y_i) 往左上回到齒根 (ROOT, y_i + SLOPE·PITCH),再沿齒根的立壁到上一齒的直面
const toothY = (i) => -(TEETH * PITCH) / 2 + i * PITCH;
const rackShape = (() => {
  const pts = [[-0.14, toothY(0) - 0.2], [ROOT, toothY(0) - 0.2]];
  for (let i = 0; i < TEETH; i++) pts.push([ROOT, toothY(i)], [TIP, toothY(i)], [ROOT, toothY(i) + PITCH * SLOPE]);
  pts.push([ROOT, toothY(TEETH - 1) + PITCH + 0.6], [-0.14, toothY(TEETH - 1) + PITCH + 0.6]);
  return shape(pts);
})();

// 齒面:棘齒桿局部高度 y 處,齒面的 x(斜面上由齒尖往左上收到齒根;齒與齒之間、齒列以外是齒根)
const surfaceX = (y) => {
  const i = Math.floor((y - toothY(0)) / PITCH);
  if (i < 0 || i >= TEETH) return ROOT;
  const u = y - toothY(i);
  return u < PITCH * SLOPE ? TIP - ((TIP - ROOT) * u) / (PITCH * SLOPE) : ROOT;
};
// 檢查用:各齒的三角形(局部座標)
const toothPolys = Array.from({ length: TEETH }, (_, i) => [[ROOT, toothY(i)], [TIP, toothY(i)], [ROOT, toothY(i) + PITCH * SLOPE]]);

// 棘爪:鉸銷在原點,爪尖在局部 (len, 0)。爪尖是鳥嘴形:上緣從爪尖往右下斜(爪擺到最左時,上緣仍低於爪尖,
// 卡在直面下時不會戳進上方的齒),下緣很短(不碰下方的斜面);爪身從鉸銷接到鳥嘴的後端。
// maxAngle:爪擺得最左時的轉角(決定上緣的斜度)
function pawlOutline(len, maxAngle) {
  const up = -(maxAngle + 0.2);
  const low = up - 0.6;
  const ub = [len + 0.14 * Math.cos(up), 0.14 * Math.sin(up)];
  const lb = [len + 0.06 * Math.cos(low), 0.06 * Math.sin(low)];
  const mid = [(ub[0] + lb[0]) / 2, (ub[1] + lb[1]) / 2];
  const arm = thickLine([[0, 0], mid], 0.07);
  const half = arm.length / 2;
  // 爪身的左側(局部 +y,爪擺在左上時朝下)→ 鳥嘴下緣的後端 → 爪尖 → 鳥嘴上緣的後端 → 爪身的右側
  return [...arm.slice(0, half - 1), lb, [len, 0], ub, ...arm.slice(half + 1)];
}
const LOWER = { len: 0.86 };
LOWER.outline = pawlOutline(LOWER.len, 2.7);
const UPPER = { len: 0.58, pivot: [0.36, 0.72] };
UPPER.outline = pawlOutline(UPPER.len, 2.0);
const tipOf = (which, pin, angle) => [pin[0] + which.len * Math.cos(angle), pin[1] + which.len * Math.sin(angle)];

/** 偏心輪轉 theta → 偏心輪中心(偏心環跟著平移)與下方棘爪的鉸銷 */
export function hinge(theta) {
  const disc = [ECC.center[0] + ECC.e * Math.cos(theta), ECC.center[1] + ECC.e * Math.sin(theta)];
  return { disc, pin: [disc[0], disc[1] - HANG] };
}

// 依接觸逐步算。爪身是細長的斜撐,只有爪尖碰得到齒:爪尖在齒面右邊就是沒碰到(gap ≥ 0)。
// 爪尖有兩種狀態:
// - 卡在齒根的角落(直面下方、齒根的立壁旁):棘齒桿的直面壓在爪尖上,爪身是斜撐,只會被壓得更緊——爪往上帶時把棘齒桿推上去,
//   棘齒桿往下落時坐在爪尖上。下方的爪往下退時,爪尖離開直面,沿下一齒的斜面滑下去。
// - 搭在斜面上:被斜面擠進去時往右(順時針)擺開;沿斜面往上走到直面底下,就進了角落。
// 每一小步:(1) 下方的爪隨偏心環移動;(2) 擋止被上升的斜面推開;(3) 沒卡住的爪靠自重往左擺,(4) 棘齒桿靠自重往下落,
// 都是越落越快,碰到就停。
const STEPS = 720; // 每圈的步數
const DT = TAU / STEPS;
const FALL = 60; // 落下的加速度(主動量的單位;爪、棘齒桿一樣)
const EPS = 1e-6;
const flatAbove = (y) => Math.ceil((y - toothY(0)) / PITCH - 1e-9); // 局部高度 y 上方最近的直面
function simulate(turns) {
  let h = RACK_START;
  let lower = 2.0; // 下方爪的轉角
  let upper = 1.6; // 擋止的轉角
  let engaged = -1; // 下方的爪尖卡在第幾齒直面下的角落(-1:沒卡住)
  const speed = { lower: 0, upper: 0, rack: 0 };
  // 離齒面多遠(負的是壓進去):爪的每個頂點對齒面,加上齒尖有沒有伸進爪身
  const gap = (which, pin, angle, hh = h) => {
    const poly = placeOutline(which.outline, pin, angle);
    let g = Infinity;
    for (const [x, y] of poly) g = Math.min(g, x - surfaceX(y - hh));
    // 爪身涵蓋的高度範圍內,每個齒尖
    let [y0, y1] = [Infinity, -Infinity];
    for (const [, y] of poly) [y0, y1] = [Math.min(y0, y), Math.max(y1, y)];
    for (let j = Math.max(0, flatAbove(y0 - hh) - 1); j < TEETH && toothY(j) + hh <= y1; j++) {
      const corner = [TIP, toothY(j) + hh];
      if (pointInPolygon(corner, poly)) g = Math.min(g, -edgeDistance(corner, poly));
      else if (polygonsOverlap(poly, toothPolys[j].map(([x, y]) => [x, y + hh]))) g = Math.min(g, -1e-3); // 爪身的邊斜穿過直面
    }
    return g;
  };
  // 爪尖貼著齒根立壁時的爪角
  const atRoot = (which, pin) => Math.acos(Math.max(-1, Math.min(1, (ROOT + 1e-4 - pin[0]) / which.len)));
  // 下方的爪尖卡在第 k 齒直面下的角落:爪靠自重往左擺,停在爪尖碰到立壁、或爪身碰到下一齒的齒尖為止(棘齒桿坐在爪尖上)
  const seated = (pin, k) => {
    const rest = (a) => tipOf(LOWER, pin, a)[1] - toothY(k) + EPS; // 爪角 a 時棘齒桿的高度
    const clear = (a) => gap(LOWER, pin, a, rest(a)) >= -1e-9;
    let hi = atRoot(LOWER, pin);
    if (clear(hi)) return hi;
    let lo = Math.acos(Math.max(-1, Math.min(1, (TIP - 0.01 - pin[0]) / LOWER.len)));
    for (let j = 0; j < 30; j++) {
      const mid = (lo + hi) / 2;
      if (clear(mid)) lo = mid;
      else hi = mid;
    }
    return lo;
  };
  // 爪尖被斜面擠進去:往右(順時針)擺到剛好貼著齒面。若擺的途中爪尖往上越過了上方的直面,回傳 null(爪尖進了角落)
  const pushOut = (which, pin, angle) => {
    if (gap(which, pin, angle) >= 0) return angle;
    const [x0, y0] = tipOf(which, pin, angle);
    const k = flatAbove(y0 - h);
    const ceiling = k >= 0 && k < TEETH && x0 < TIP ? toothY(k) + h : Infinity;
    // 往右擺的步子由小而大(0.002 起加倍),跨過頭再用二分法找回剛好貼著的地方
    let d = 0;
    let step = 0.002;
    do {
      d += step;
      step = Math.min(step * 2, 0.02);
      if (tipOf(which, pin, angle - d)[1] > ceiling) return null;
    } while (gap(which, pin, angle - d) < 0 && d < 0.6);
    let [lo, hi] = [angle - d, angle - d + step / 2];
    for (let j = 0; j < 30; j++) {
      const mid = (lo + hi) / 2;
      if (gap(which, pin, mid) >= 0) lo = mid;
      else hi = mid;
    }
    return lo;
  };
  // 靠自重往左(逆時針)擺:越擺越快,爪尖碰到齒面就停
  const swingIn = (key, which, pin, angle) => {
    speed[key] += FALL * DT;
    const span = speed[key] * DT;
    const n = Math.max(1, Math.ceil(span / 0.004));
    for (let j = 1; j <= n; j++) {
      const next = angle + (span * j) / n;
      if (gap(which, pin, next) < 0) {
        let [lo, hi] = [angle + (span * (j - 1)) / n, next];
        for (let m = 0; m < 30; m++) {
          const mid = (lo + hi) / 2;
          if (gap(which, pin, mid) >= 0) lo = mid;
          else hi = mid;
        }
        speed[key] = 0;
        return lo;
      }
    }
    return angle + span;
  };
  // 爪尖上方最近的直面離爪尖多遠(爪尖在齒根與齒尖之間時,棘齒桿往下落會被它擋住)
  const room = (tip) => {
    if (tip[0] >= TIP || tip[0] < ROOT - 0.02) return { d: Infinity, k: -1 };
    const y = tip[1] - h;
    const k = flatAbove(y);
    return k < 0 || k >= TEETH ? { d: Infinity, k: -1 } : { d: toothY(k) - y, k };
  };
  // 起點:棘齒桿先架著,兩個爪擺到搭在齒上
  for (let i = 0; i < 400; i++) {
    lower = swingIn("lower", LOWER, hinge(0).pin, lower);
    upper = swingIn("upper", UPPER, UPPER.pivot, upper);
  }
  const run = [];
  for (let i = 0; i <= turns * STEPS; i++) {
    const { pin } = hinge(i * DT);
    // (1) 下方的爪
    if (engaged >= 0) {
      lower = seated(pin, engaged);
      const want = tipOf(LOWER, pin, lower)[1] - toothY(engaged) + EPS;
      if (want >= h) {
        h = want; // 頂著直面把棘齒桿推上去
        speed.rack = 0;
      } else engaged = -1; // 爪往下退,爪尖離開直面
    }
    if (engaged < 0) {
      const out = pushOut(LOWER, pin, lower);
      if (out === null) {
        const k = flatAbove(tipOf(LOWER, pin, lower)[1] - h);
        engaged = k;
        lower = seated(pin, k);
        h = Math.max(h, tipOf(LOWER, pin, lower)[1] - toothY(k) + EPS);
        speed.rack = 0;
      } else lower = out;
    }
    // (2) 擋止
    upper = pushOut(UPPER, UPPER.pivot, upper) ?? atRoot(UPPER, UPPER.pivot);
    // (3) 沒卡住的爪靠自重往左擺
    if (engaged < 0) lower = swingIn("lower", LOWER, pin, lower);
    upper = swingIn("upper", UPPER, UPPER.pivot, upper);
    // (4) 棘齒桿靠自重往下落,落到直面碰上爪尖為止
    speed.rack += FALL * DT;
    const [rl, ru] = [room(tipOf(LOWER, pin, lower)), room(tipOf(UPPER, UPPER.pivot, upper))];
    const limit = Math.max(0, Math.min(rl.d, ru.d) - EPS);
    const drop = Math.min(speed.rack * DT, limit);
    if (drop < speed.rack * DT) speed.rack = 0;
    h -= drop;
    if (engaged < 0 && rl.k >= 0 && rl.d - drop < 1e-4) {
      engaged = rl.k; // 棘齒桿落下來坐在下方的爪尖上
      lower = seated(pin, rl.k);
    }
    run.push({ h, lower, upper });
  }
  return run;
}

// 先空轉兩圈,之後每圈都一樣:取第三圈當作週期;每圈升的高度是整數個齒距,逐步推開的微小誤差按比例攤掉
const { TABLE, LIFT, STEP } = (() => {
  const run = simulate(3);
  const table = run.slice(2 * STEPS);
  const [h0, raw] = [table[0].h, table[STEPS].h - table[0].h];
  const step = Math.round(raw / PITCH) * PITCH;
  return { TABLE: table.map((s) => ({ ...s, h: h0 + ((s.h - h0) * step) / raw })), LIFT: raw, STEP: step };
})();
/** 偏心輪每轉一圈,棘齒桿升的高度(整數個齒距,由接觸算出) */
export const perTurn = STEP;
export const rawLift = LIFT; // 檢查用:逐步推開時一圈實際升的高度
const H0 = TABLE[0].h; // 主動量 0 時棘齒桿的位置(空轉兩圈後)

function lookup(theta) {
  const k = Math.floor(theta / TAU);
  const x = ((theta - k * TAU) / TAU) * STEPS;
  const i = Math.max(0, Math.min(STEPS - 1, Math.floor(x)));
  const t = x - i;
  const [a, b] = [TABLE[i], TABLE[i + 1]];
  return { h: k * STEP + a.h + (b.h - a.h) * t - TABLE[0].h, lower: a.lower + (b.lower - a.lower) * t, upper: a.upper + (b.upper - a.upper) * t };
}

/** 偏心輪轉 theta → 棘齒桿上升的高度(自起點) */
export const rack = (theta) => lookup(theta).h;

/** 檢查用:偏心轉 theta 時兩個爪與棘齒(世界座標 2D) */
export function contactAt(theta) {
  const s = lookup(theta);
  const { pin } = hinge(theta);
  const h = H0 + s.h;
  return {
    pawls: [placeOutline(LOWER.outline, pin, s.lower), placeOutline(UPPER.outline, UPPER.pivot, s.upper)],
    teeth: toothPolys.map((t) => t.map(([x, y]) => [x, y + h])),
    lower: s.lower,
    upper: s.upper,
  };
}

const pawlPart = (id, which, thickness) => ({ id, kind: "group", arrow: false, pieces: [{ kind: "plate", shape: shape(which.outline), thickness }] }); // 鉸銷穿過爪身的孔(孔沒畫)

export default {
  figure: 389,
  parts: [
    {
      id: "body",
      kind: "group",
      pieces: [
        // 柱身(剖面)與底座
        { kind: "plate", shape: shape([[-1.4, -2.8], [1.6, -2.8], [1.6, -2.5], [0.9, -2.3], [0.55, -1.0], [0.5, 1.8], [0.3, 1.8], [0.3, -2.5], [-0.25, -2.5], [-0.25, 1.8], [-0.55, 1.8], [-0.6, -1.0], [-0.95, -2.3], [-1.4, -2.5]]), thickness: 0.5, at: [0, 0, -0.3] },
        // 擋止的耳與鉸銷(從柱身右側伸出)
        { kind: "plate", shape: shape(rect(0.2, 0.24, UPPER.pivot[0] + 0.06, UPPER.pivot[1])), thickness: 0.5, at: [0, 0, -0.3] },
        { kind: "cylinder", radius: 0.035, length: 0.14, at: [UPPER.pivot[0], UPPER.pivot[1], -0.04] },
        // 偏心輪軸的托架:柱身右側伸出一塊板,軸往後伸進板上的軸承
        { kind: "plate", shape: shape(rect(0.55, 0.36, ECC.center[0] - 0.12, ECC.center[1])), thickness: 0.5, at: [0, 0, -0.3] },
      ],
    },
    {
      id: "rack",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: rackShape, thickness: 0.3 },
        { kind: "plate", shape: shape(rect(0.9, 0.18, 0, toothY(TEETH - 1) + PITCH + 0.7)), thickness: 0.5 },
      ],
    },
    {
      id: "eccentric",
      kind: "group",
      center: ECC.center,
      spin: ECC.r + ECC.e,
      pieces: [
        { kind: "plate", shape: shape(circle(ECC.r), [circle(0.06, -ECC.e, 0).reverse()]), thickness: 0.18, at: [ECC.e, 0, 0] },
        { kind: "cylinder", radius: 0.06, length: 0.85, at: [0, 0, -0.2] },
        { kind: "box", size: [1.0, 0.08, 0.08], at: [0.5, 0, 0.25], accent: true },
      ],
    },
    // 偏心環:套在偏心輪外、不跟著轉,往下伸出一根吊臂,下端的銷掛著下方的棘爪
    {
      id: "strap",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "cylinder", radius: ECC.r + 0.07, inner: ECC.r, length: 0.18 },
        { kind: "box", size: [0.08, HANG - ECC.r - 0.07 + 0.04, 0.1], at: [0, -(HANG + ECC.r + 0.07) / 2 + 0.02, 0] },
        { kind: "cylinder", radius: 0.035, length: 0.3, at: [0, -HANG, -0.1] },
      ],
    },
    pawlPart("pawl", LOWER, 0.1),
    pawlPart("stop", UPPER, 0.08),
  ],
  // 動力重演:只推偏心輪(偏心環跟著平移);兩個爪鉸接、靠自重搭在齒上,棘齒桿只靠自重與兩個爪的支撐
  replay: {
    to: 3 * TAU,
    seconds: 30,
    free: {
      rack: { slide: [0, 1, 0] },
      pawl: { pivot: [hinge(0).pin[0], hinge(0).pin[1], PAWL_Z], on: "strap" },
      stop: { pivot: [UPPER.pivot[0], UPPER.pivot[1], STOP_Z] },
    },
    ignore: [["rack", "body"]],
    expect: [
      { at: TAU, part: "rack", label: "偏心輪轉一圈,棘爪把棘齒桿推上兩齒", quote: "由偏心輪、棘爪與棘輪所操作的升降千斤頂" },
      { at: 2 * TAU, part: "rack", label: "再轉一圈,擋止扣住、棘齒桿再升兩齒", quote: "上方的棘爪為一個擋止裝置" },
      { part: "rack", label: "轉三圈,升六齒" },
    ],
  },
  driver: { part: "eccentric", type: "rotation", range: RANGE, initial: 0 },
  target: "rack", // 一齒一齒被頂上去的棘齒桿
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const s = lookup(theta);
    const { disc, pin } = hinge(theta);
    return {
      parts: {
        rack: { position: [0, H0 + s.h, 0] },
        eccentric: { angle: theta },
        strap: { position: [disc[0], disc[1], ECC.center[2]] },
        pawl: { position: [pin[0], pin[1], PAWL_Z], angle: s.lower },
        stop: { position: [UPPER.pivot[0], UPPER.pivot[1], STOP_Z], angle: s.upper },
      },
      readouts: [],
    };
  },
};

// 測試用
export const geometry = { PITCH, ROOT, TIP };
