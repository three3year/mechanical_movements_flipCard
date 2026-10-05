// 第 80 種:槓桿 C 振動時,兩根交叉的鉤形棘爪交替鉤住槽形齒條桿 A 兩側的齒,把 A 一步一步往上提。
// 槓桿左端上升時,左端掛的棘爪(交叉到右側)鉤住右側的齒把 A 提起;右端上升時換另一根。
// 主動量是槓桿的累計擺動量;A 每一程都被提起,幾乎連續地上升。
//
// 接觸:齒是鋸齒——下緣水平(鉤子從下面頂住它往上提)、上緣是斜面(鉤子往下退時沿斜面被推開,
// 滑過齒尖後靠自重擺回、落進下一格)。兩根棘爪掛在槓桿的銷上自由擺動,擺到多少、桿被提多高都由接觸算。
// 鉤子退回時沿斜面滑過幾個齒、落進更下面一格;下一程先空走一段才頂到齒(棘輪的空行程),
// 桿每一程上升一個齒距。
// 立體化:棘爪的桿身在齒條桿前面交叉(兩根在不同層),末端彎回齒條桿那一層成鉤;
// 槓桿的樞軸從後面的機架穿過齒條桿的長槽(長槽兼作導引,深度是推斷)。
import { deg } from "./kit.js";
import { bodyPoint } from "./linkage.js";
import { shape, circle, stadium, thickLine, rect } from "./shapes.js";
import { placeOutline, polygonsOverlap, swingUntilContact } from "./contact.js";

const PIVOT = [0, 1.55, 0.42];
const PINS = { left: [-0.65, 0], right: [0.65, 0] };
const SWING = deg(30);
const STROKE = 2 * PINS.right[0] * Math.sin(SWING / 2); // 銷一程升降的高度
const BAR = { y: -0.8, width: 0.95, length: 11.0, slot: 0.16, depth: 0.12, pitch: 0.18, gap: 0.08, tongue: 0.05 };
const EDGE = BAR.width / 2;
// 桿很長,兩端在畫面外;齒是等距的,桿的位置以 10 個齒距為一輪循環顯示,看起來就是一直往上
const LOOP = BAR.pitch * 10;
const HOOK_Y = -0.4; // 鉤子上緣的高度(槓桿水平、棘爪未擺動時)

// 棘爪(鉤在 side 那一側):桿身從銷斜下到對側齒條桿外面,末端是 J 形的鉤,鉤舌往內伸到齒下
const OUTER = EDGE + BAR.depth + 0.09; // 鉤子直段的內側,在齒尖外面
const ccw = (poly) => {
  let area = 0;
  for (let i = 0; i < poly.length; i++) {
    const [a, b] = [poly[i], poly[(i + 1) % poly.length]];
    area += a[0] * b[1] - b[0] * a[1];
  }
  return area < 0 ? poly.reverse() : poly;
};
function pawlShapes(side) {
  const pin = bodyPoint(PIVOT, 0, PINS[side === 1 ? "left" : "right"]);
  const local = ([x, y]) => [side * x - pin[0], y - pin[1]];
  const H = HOOK_Y;
  const hook = ccw(
    [
      [EDGE + 0.02, H],
      [OUTER, H],
      [OUTER, H + 0.4],
      [OUTER + 0.1, H + 0.4],
      [OUTER + 0.1, H - 0.1],
      [OUTER - 0.05, H - BAR.tongue],
      [EDGE + 0.05, H - BAR.tongue],
      [EDGE + 0.02, H - 0.02], // 鉤舌內端下緣倒角:往下退時沿齒的斜面滑開
    ].map(local),
  );
  const end = local([OUTER + 0.05, H + 0.35]);
  return { hook, shank: thickLine([[0, 0], end], 0.1), end };
}
const PAWLS = { left: { side: 1, ...pawlShapes(1) }, right: { side: -1, ...pawlShapes(-1) } };

const pinAt = (which, psi) => bodyPoint(PIVOT, psi, PINS[which]).slice(0, 2);

// 一顆齒(右側,下緣在 y):下緣水平、上緣斜面;斜面頂端離上一顆齒的下緣留 GAP,鉤舌放得進去、不會卡死
const tooth = (side, y) => ccw([[side * EDGE, y], [side * (EDGE + BAR.depth), y], [side * EDGE, y + BAR.pitch - BAR.gap]]);
// 桿的高度為 h 時,鉤子高度附近的齒(齒的下緣落在 h + j·齒距)
function teethNear(h) {
  const teeth = [];
  const j0 = Math.floor((HOOK_Y - 1.0 - h) / BAR.pitch);
  for (let j = j0; j <= j0 + 8; j++) for (const s of [1, -1]) teeth.push(tooth(s, h + j * BAR.pitch));
  return teeth;
}
const BODY = rect(BAR.width, 2.4, 0, HOOK_Y);
const barObstacles = (h) => [BODY, ...teethNear(h)];
const hookAt = (which, psi, angle) => placeOutline(PAWLS[which].hook, pinAt(which, psi), angle);

// 鉤子頂到齒的下緣時把桿往上推,推到剛好不重疊(只看齒)。推的量不會超過這一步銷升起的高度(加一點擺動的餘裕);
// 超過就表示不是鉤住齒的下緣(例如鉤舌壓在下面一齒的斜面上),回傳 null
function lift(h, hook, max) {
  const hits = (dh) => teethNear(h + dh).some((o) => polygonsOverlap(hook, o));
  if (!hits(0)) return h;
  if (hits(max)) return null;
  let lo = 0;
  let hi = max;
  for (let k = 0; k < 30; k++) {
    const mid = (lo + hi) / 2;
    if (hits(mid)) lo = mid;
    else hi = mid;
  }
  return h + hi;
}

// 棘爪靠自重往內擺(左爪順時針、右爪逆時針),停在碰到齒或桿身的地方;被斜面頂住時先往外退
const settle = (which, psi, angle, obstacles) =>
  swingUntilContact({ pivot: pinAt(which, psi), outline: PAWLS[which].hook, from: angle, into: -PAWLS[which].side, sweep: 0.3, steps: 60 }, obstacles);

// 從任意起點走三個來回,之後每個來回都一樣(每一程桿升一個齒距):取最後一個來回當作週期
const SAMPLES = 480; // 一個來回(主動量 2·SWING)的取樣數
const { TABLE, RISE } = (() => {
  let h = 0;
  let angle = { left: 0, right: 0 };
  let prev = SWING / 2;
  let pins = { left: pinAt("left", prev), right: pinAt("right", prev) };
  const run = [];
  for (let i = 0; i <= 3 * SAMPLES; i++) {
    const v = (2 * SWING * i) / SAMPLES;
    const psi = leverAt(v);
    for (const which of ["left", "right"]) {
      // 銷上升的那根(左爪在 ψ 減少時、右爪在 ψ 增加時)頂著齒把桿推上去
      const rising = which === "left" ? psi < prev : psi > prev;
      // 先只對桿身擺好(銷略往內移時鉤舌被桿身頂開),再把頂到齒下緣的重疊化成桿的上升:
      // 正在提的鉤子被拉力壓在齒下,不會因為往外擺而翻過齒
      if (rising) {
        const max = pinAt(which, psi)[1] - pins[which][1] + 0.004;
        h = lift(h, hookAt(which, psi, angle[which]), max) ?? h;
        const swung = settle(which, psi, angle[which], [BODY]);
        const lifted = lift(h, hookAt(which, psi, swung), max);
        if (lifted !== null) [angle[which], h] = [swung, lifted];
      }
    }
    pins = { left: pinAt("left", psi), right: pinAt("right", psi) };
    for (const which of ["left", "right"]) angle[which] = settle(which, psi, angle[which], barObstacles(h));
    prev = psi;
    run.push({ h, left: angle.left, right: angle.right });
  }
  // 每個來回提起整數個齒距;逐步推開時累積的微小誤差按比例攤掉,播久了才不會越差越多
  const table = run.slice(2 * SAMPLES);
  const [h0, raw] = [table[0].h, table[SAMPLES].h - table[0].h];
  const rise = Math.round(raw / BAR.pitch) * BAR.pitch;
  return { TABLE: table.map((s) => ({ ...s, h: h0 + ((s.h - h0) * rise) / raw })), RISE: rise };
})();

function leverAt(v) {
  const u = v / SWING;
  const k = Math.floor(u);
  const f = u - k;
  const s = k % 2 === 0 ? f : 1 - f;
  return SWING / 2 - SWING * s;
}

function lookup(v) {
  const period = 2 * SWING;
  const k = Math.floor(v / period);
  const x = ((v - k * period) / period) * SAMPLES;
  const i = Math.min(SAMPLES - 1, Math.floor(x));
  const t = x - i;
  const [a, b] = [TABLE[i], TABLE[i + 1]];
  // h 是絕對高度(齒的下緣落在 h + j·齒距),不是自起點的位移
  return { h: k * RISE + a.h + (b.h - a.h) * t, left: a.left + (b.left - a.left) * t, right: a.right + (b.right - a.right) * t };
}

/** 主動量 v:齒條桿 A 的高度(往上為正) */
export const barHeight = (v) => lookup(v).h - TABLE[0].h;
export const swing = SWING;
export const pitch = BAR.pitch;
export const stroke = STROKE;
/** 檢查用:主動量 v 時兩個鉤子與桿上的齒(世界座標 2D) */
export function contactAt(v) {
  const { h, left, right } = lookup(v);
  const psi = leverAt(v);
  return { hooks: [hookAt("left", psi, left), hookAt("right", psi, right)], bar: barObstacles(h) };
}

// 齒在桿上的位置:桿顯示的位移 = 自起點的上升量對 LOOP 取餘數再減 LOOP/2(5 個齒距),齒的下緣仍落在 h + j·齒距
const teeth = (side) =>
  Array.from({ length: Math.floor(BAR.length / BAR.pitch) - 2 }, (_, i) => {
    const y = -BAR.length / 2 + 0.3 + i * BAR.pitch;
    return { kind: "plate", shape: shape(tooth(side, 0).map(([x, ty]) => [x - side * EDGE, ty])), thickness: 0.12, at: [side * EDGE, y, 0] };
  });
// 讓桿上的齒下緣(桿局部 y = -L/2 + 0.3 + i·齒距)對齊 h + j·齒距:桿中心的高度補上這個餘數
const mod = (x, m) => ((x % m) + m) % m;
const TEETH_SHIFT = mod(TABLE[0].h, BAR.pitch) - mod(BAR.y - BAR.length / 2 + 0.3, BAR.pitch);

const pawlPart = (which, z) => ({
  id: which === "left" ? "pawlLeft" : "pawlRight",
  kind: "group",
  center: [...pinAt(which, 0), z],
  arrow: false,
  pieces: [
    { kind: "plate", shape: shape(PAWLS[which].shank, [circle(0.055).reverse()]), thickness: 0.06 },
    // 鉤子從桿身那一層往後伸到齒條桿那一層
    { kind: "plate", shape: shape(PAWLS[which].hook), thickness: z + 0.06, at: [0, 0, -z / 2] },
  ],
});

export default {
  figure: 80,
  parts: [
    {
      id: "bar",
      kind: "group",
      center: [0, BAR.y, 0],
      pieces: [
        { kind: "plate", shape: shape(stadium(BAR.length, BAR.width).outline.map(([x, y]) => [y, x - BAR.length / 2]), [stadium(BAR.length * 0.9, BAR.slot * 2).outline.map(([x, y]) => [y, x - BAR.length * 0.45]).reverse()]), thickness: 0.12 },
        ...teeth(1),
        ...teeth(-1),
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 機架在齒條桿後面,往上接到畫面外;樞軸從機架穿過桿的長槽到前面的槓桿
        { kind: "plate", shape: shape(rect(1.3, 0.7, 0, PIVOT[1])), thickness: 0.08, at: [0, 0, -0.2] },
        { kind: "box", size: [0.3, 2.0, 0.08], at: [0, PIVOT[1] + 1.3, -0.2] },
        { kind: "cylinder", radius: 0.06, length: 0.66, at: [0, PIVOT[1], 0.13] },
      ],
    },
    { id: "labelA", kind: "group", label: "A", labelOffset: [0, -0.75, 0.2] },
    {
      id: "lever",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(stadium(3.6, 0.2).outline.map(([x, y]) => [x - 1.8, y]), [circle(0.065).reverse()]), thickness: 0.08 },
        { kind: "sphere", radius: 0.32, at: [-1.95, 0, 0] },
        { kind: "sphere", radius: 0.32, at: [1.95, 0, 0] },
        { kind: "cylinder", radius: 0.1, length: 0.12, at: [0, 0, 0.08] },
        // 掛棘爪的兩根銷往後伸到各自的棘爪那一層(左爪在前一層、右爪在後一層)
        { kind: "cylinder", radius: 0.045, length: 0.34, at: [PINS.left[0], 0, -0.13] },
        { kind: "cylinder", radius: 0.045, length: 0.22, at: [PINS.right[0], 0, -0.07] },
      ],
      label: "C",
      labelOffset: [1.2, 0.45, 0],
    },
    pawlPart("left", 0.17),
    pawlPart("right", 0.29),
  ],
  // 動力重演:只推槓桿;兩根棘爪掛在槓桿的銷上靠自重擺動,齒桿在長槽上滑動、靠摩擦定位,由棘爪輪流提起
  replay: {
    free: { bar: { slide: [0, 1, 0], hold: true, gravity: false }, pawlLeft: { on: "lever" }, pawlRight: { on: "lever" } },
    expect: [{ part: "bar", label: "槓桿一個來回,齒桿被提上去的距離" }],
  },
  driver: { part: "lever", type: "rotation", cycle: [SWING / 2, -SWING / 2] },
  target: "bar",
  view: { direction: [0.06, 0.05, 1], fit: ["lever", "frame", "pawlLeft", "pawlRight"] },
  pose(v) {
    const psi = leverAt(v);
    const { h, left, right } = lookup(v);
    const shown = mod(h - TABLE[0].h, LOOP) - LOOP / 2;
    return {
      parts: {
        bar: { position: [0, BAR.y + TEETH_SHIFT + shown, 0] },
        lever: { angle: psi },
        pawlLeft: { position: [...pinAt("left", psi), 0.17], angle: left },
        pawlRight: { position: [...pinAt("right", psi), 0.29], angle: right },
      },
      readouts: [],
    };
  },
};
