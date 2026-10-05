// 第 77 種:槓桿 C 繞支點 A 振動,透過兩根交替作動的棘爪,使輪 B 旋轉,幾乎是連續的運動。
// 兩根棘爪分別掛在 A 上下兩側的銷上,左端是 U 形的鉤,套住輪面上的一根凸柱:槓桿頂端往左擺時
// 上棘爪往左推、下棘爪退回;往右擺時換下棘爪推。輪 B 逆時針轉(原圖箭頭)。主動量是槓桿的累計擺動量。
//
// 接觸:U 形鉤的開口朝輪心,後壁(靠銷那一側)推凸柱;前後兩邊的外側是斜面——棘爪退回時,
// 凸柱從前面的斜面把鉤頂起、滑出 U 形,鉤的後背再滑過下一根凸柱,越過後靠自重落下、把它套進 U 形裡。
// 棘爪靠自重壓在凸柱上;擺到多少、輪被推多遠都由接觸算(原圖沒有彈簧)。
// 立體化:棘爪在凸柱那一層(輪緣的前面),槓桿在最前面一層,掛棘爪的銷往後伸;槓桿的樞軸裝在後面的立柱上。
import { TAU, deg, polar } from "./kit.js";
import { bodyPoint } from "./linkage.js";
import { circle, shape, stadium, thickLine } from "./shapes.js";
import { circlePolygon, placeOutline, polygonsOverlap, swingUntilContact } from "./contact.js";

const WHEEL = { radius: 2.0, studR: 1.72, studs: 26, stud: 0.09 };
const PITCH = TAU / WHEEL.studs;
const A = [3.05, 0.65, 0.42];
const PINS = { upper: [0, 1.1], lower: [0, -1.0] }; // 槓桿上兩根銷(相對 A,槓桿直立時)
const SWING = deg(30);
const AT = { upper: deg(75), lower: deg(35) }; // 槓桿直立時,兩個鉤套住的凸柱在輪上的方位
const Z = 0.25; // 棘爪那一層(凸柱的前段)

const ccw = (poly) => {
  let area = 0;
  for (let i = 0; i < poly.length; i++) {
    const [a, b] = [poly[i], poly[(i + 1) % poly.length]];
    area += a[0] * b[1] - b[0] * a[1];
  }
  return area < 0 ? poly.reverse() : poly;
};

// U 形鉤的外形,以 (沿輪逆時針的切線 a, 往輪外的法線 b) 表示,原點在套住的凸柱中心:
// 半圓形的凹口套住凸柱,後壁(a < 0,伸到凸柱中心以下)推凸柱;前緣很淺,
// 後背是斜面(退回時從下一根凸柱上滑過)
const R = WHEEL.stud + 0.015;
const HOOK = [
  [-0.3, R + 0.07],
  [-0.25, 0.02],
  [-0.19, -0.05],
  [-R, -0.05],
  ...Array.from({ length: 14 }, (_, i) => {
    const a = deg(180 - (130 * i) / 13);
    return [R * Math.cos(a), R * Math.sin(a)];
  }),
  [0.13, 0.06],
  [0.16, R + 0.03],
  [0.05, R + 0.09],
];

const pinAt = (which, psi) => bodyPoint(A, psi, PINS[which]).slice(0, 2);
function pawlShapes(which) {
  const pin = pinAt(which, 0);
  const S = polar(WHEEL.studR, AT[which]);
  const t = [-Math.sin(AT[which]), Math.cos(AT[which])];
  const n = [Math.cos(AT[which]), Math.sin(AT[which])];
  const local = ([a, b]) => [S[0] + a * t[0] + b * n[0] - pin[0], S[1] + a * t[1] + b * n[1] - pin[1]];
  return { hook: ccw(HOOK.map(local)), shank: thickLine([[0, 0], local([-0.26, R + 0.03])], 0.12) };
}
const PAWLS = { upper: pawlShapes("upper"), lower: pawlShapes("lower") };

// 輪的轉角為 θ 時,鉤附近的凸柱(多邊形)
function studsNear(theta, near) {
  const out = [];
  const from = Math.round((Math.atan2(near[1], near[0]) - theta) / PITCH);
  for (let i = from - 3; i <= from + 3; i++) {
    const [x, y] = polar(WHEEL.studR, theta + i * PITCH);
    out.push(circlePolygon([x, y], WHEEL.stud, 16));
  }
  return out;
}
const hookAt = (which, psi, angle) => placeOutline(PAWLS[which].hook, pinAt(which, psi), angle);
const centerOf = (poly) => poly.reduce((s, p) => [s[0] + p[0] / poly.length, s[1] + p[1] / poly.length], [0, 0]);

// 往前推的鉤碰到凸柱:把輪往逆時針轉到剛好不重疊;一步之內轉不開(不是後壁推著凸柱)就回傳 null
function push(theta, hook, max) {
  const near = centerOf(hook);
  const hits = (d) => studsNear(theta + d, near).some((o) => polygonsOverlap(hook, o));
  if (!hits(0)) return theta;
  if (hits(max)) return null;
  let lo = 0;
  let hi = max;
  for (let k = 0; k < 30; k++) {
    const mid = (lo + hi) / 2;
    if (hits(mid)) lo = mid;
    else hi = mid;
  }
  return theta + hi;
}

// 棘爪靠自重往下擺(兩根都是逆時針),停在碰到凸柱的地方;被凸柱頂住時先往上退
const settle = (which, psi, angle, theta) =>
  swingUntilContact({ pivot: pinAt(which, psi), outline: PAWLS[which].hook, from: angle, into: 1, sweep: 0.3, steps: 60 }, studsNear(theta, centerOf(hookAt(which, psi, angle))));

function leverAt(v) {
  const u = v / SWING;
  const k = Math.floor(u);
  const f = u - k;
  const s = k % 2 === 0 ? f : 1 - f;
  return -SWING / 2 + SWING * s;
}

// 從起點走三個來回,之後每個來回都一樣:取最後一個來回當作週期
const SAMPLES = 480; // 一個來回(主動量 2·SWING)的取樣數
const { TABLE, TURN } = (() => {
  let theta = 0;
  const angle = { upper: 0, lower: 0 };
  let prev = -SWING / 2;
  const run = [];
  for (let i = 0; i <= 3 * SAMPLES; i++) {
    const psi = leverAt((2 * SWING * i) / SAMPLES);
    // ψ 增加時上銷往左(上棘爪推)、ψ 減少時下銷往左(下棘爪推)
    const which = psi > prev ? "upper" : psi < prev ? "lower" : null;
    if (which) {
      const max = (Math.abs(psi - prev) * 0.9) / WHEEL.studR + 0.002;
      theta = push(theta, hookAt(which, psi, angle[which]), max) ?? theta;
    }
    for (const w of ["upper", "lower"]) angle[w] = settle(w, psi, angle[w], theta);
    prev = psi;
    run.push({ theta, upper: angle.upper, lower: angle.lower });
  }
  // 每個來回推過整數根凸柱;逐步推開時累積的微小誤差(一個來回約 0.05°)按比例攤掉,播久了才不會越差越多
  const table = run.slice(2 * SAMPLES);
  const [t0, raw] = [table[0].theta, table[SAMPLES].theta - table[0].theta];
  const turn = Math.round(raw / PITCH) * PITCH;
  return { TABLE: table.map((s) => ({ ...s, theta: t0 + ((s.theta - t0) * turn) / raw })), TURN: turn };
})();

function lookup(v) {
  const period = 2 * SWING;
  const k = Math.floor(v / period);
  const x = ((v - k * period) / period) * SAMPLES;
  const i = Math.min(SAMPLES - 1, Math.floor(x));
  const t = x - i;
  const [a, b] = [TABLE[i], TABLE[i + 1]];
  return { theta: k * TURN + a.theta + (b.theta - a.theta) * t, upper: a.upper + (b.upper - a.upper) * t, lower: a.lower + (b.lower - a.lower) * t };
}

/** 主動量 v(槓桿的累計擺動):輪 B 的轉角(自起點) */
export const wheelAngle = (v) => lookup(v).theta - TABLE[0].theta;
export const swing = SWING;
export const studPitch = PITCH;
/** 檢查用:主動量 v 時兩個鉤與附近的凸柱(世界座標 2D) */
export function contactAt(v) {
  const { theta, upper, lower } = lookup(v);
  const psi = leverAt(v);
  const hooks = [hookAt("upper", psi, upper), hookAt("lower", psi, lower)];
  return { hooks, studs: hooks.flatMap((h) => studsNear(theta, centerOf(h))) };
}

const studs = Array.from({ length: WHEEL.studs }, (_, i) => ({
  kind: "cylinder",
  radius: WHEEL.stud,
  length: 0.4,
  at: [...polar(WHEEL.studR, i * PITCH).slice(0, 2), 0.15],
  accent: i === 0,
}));

const pawlPart = (which) => ({
  id: which === "upper" ? "pawlUpper" : "pawlLower",
  kind: "group",
  center: [...pinAt(which, 0), Z],
  arrow: false,
  pieces: [
    { kind: "plate", shape: shape(PAWLS[which].shank, [circle(0.07).reverse()]), thickness: 0.1 },
    { kind: "plate", shape: shape(PAWLS[which].hook), thickness: 0.1 },
  ],
});

export default {
  figure: 77,
  parts: [
    {
      id: "wheel",
      kind: "group",
      spin: WHEEL.radius,
      pieces: [
        { kind: "cylinder", radius: WHEEL.radius, inner: 1.42, length: 0.25 },
        ...[0, 1, 2, 3].map((k) => ({ kind: "box", size: [1.15, 0.2, 0.18], at: [...polar(0.95, (k * TAU) / 4).slice(0, 2), 0], angle: (k * TAU) / 4 })),
        { kind: "cylinder", radius: 0.45, inner: 0.25, length: 0.3 },
        ...studs,
      ],
      label: "B",
      labelOffset: [-1.85, 1.15, 0.3],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: 0.24, length: 0.7, at: [0, 0, -0.15] }, // 輪軸
        { kind: "cylinder", radius: 0.08, length: 0.6, at: [A[0], A[1], 0.15] }, // 槓桿的樞軸,從後面的立柱伸出
        { kind: "box", size: [0.3, 2.2, 0.1], at: [A[0], A[1] - 0.9, -0.15] },
      ],
    },
    {
      id: "lever",
      kind: "group",
      center: A,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(stadium(3.2, 0.32).outline.map(([x, y]) => [x - 2.15, y]), [circle(0.09).reverse()]), thickness: 0.1, angle: Math.PI / 2 },
        // 掛棘爪的兩根銷往後伸到棘爪那一層
        { kind: "cylinder", radius: 0.06, length: 0.32, at: [...PINS.upper, -0.11] },
        { kind: "cylinder", radius: 0.06, length: 0.32, at: [...PINS.lower, -0.11] },
      ],
      label: "C",
      labelOffset: [0, -1.4, 0],
    },
    { id: "labelA", kind: "group", center: A, label: "A", labelOffset: [0.42, 0, 0.1] },
    pawlPart("upper"),
    pawlPart("lower"),
  ],
  // 動力重演:只推槓桿;兩根棘爪掛在槓桿的銷上靠自重壓在凸柱上,輪靠摩擦定位,由兩根棘爪輪流推動
  replay: {
    free: { wheel: { hold: true, gravity: false }, pawlUpper: { on: "lever" }, pawlLower: { on: "lever" } },
    expect: [{ part: "wheel", label: "槓桿一個來回,兩個棘爪把輪推過的角度" }],
  },
  driver: { part: "lever", type: "rotation", cycle: [-SWING / 2, SWING / 2] },
  target: "wheel", // 近乎連續旋轉的輪 B
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const psi = leverAt(v);
    const { theta, upper, lower } = lookup(v);
    return {
      parts: {
        lever: { angle: psi },
        wheel: { angle: theta },
        pawlUpper: { position: [...pinAt("upper", psi), Z], angle: upper },
        pawlLower: { position: [...pinAt("lower", psi), Z], angle: lower },
      },
      readouts: [],
    };
  },
};
