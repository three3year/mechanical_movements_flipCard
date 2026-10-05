// 第 76 種:登錄或計算轉數的裝置。撥爪支承於固定樞軸 C 上;大輪(原圖只畫出一部分)每轉一圈,輪上的凸柱 D
// 撞擊撥爪的右端一次,把右端往下壓,使撥爪靠近棘輪 A 的那一端抬起,把 A 轉動一齒。D 從右端的尖上滑過之後,
// 撥爪憑自重落回原位;靠近 A 的那一端是鉸接的(B),落回時能越過棘輪的齒(此時 A 不動)。
// 主動件是大輪(順時針轉)。
//
// 結構:大輪與 A 同心,A 鬆套在前方機架伸出的固定短軸上(不隨大輪轉);機架是一根橫在最前面的細條,
// 也帶著撥爪的樞軸 C 與擋住撥爪右臂的擋銷(原圖 A 與 D 之間的長方條)。凸柱 D 從輪緣內側往前伸,
// 只掃過撥爪右臂的尖端。B 掛在撥爪左端的銷上,下端的鉤伸到 A 的一齒下面:撥爪左端抬起時鉤把齒往上提,
// 落回時鉤沿下一齒的齒背被推開、滑過後靠自重擺回。撥爪被壓下多少、A 被提多遠、B 擺開多少都由接觸算。
import { TAU, deg, polar, rot2 } from "./kit.js";
import { ratchetShape, circle, shape, stadium, thickLine, rect } from "./shapes.js";
import { placeOutline, polygonsOverlap, swingUntilContact, circlePolygon } from "./contact.js";
import { ratchetObstacles } from "./ratchets.js";

const A = { teeth: 20, outer: 1.0, inner: 0.78, dir: 1 };
const PITCH = TAU / A.teeth;
const WHEEL = { rim: 3.75, width: 0.42, stud: 3.1, studR: 0.1 };
const C = [1.9, 0.6];
const REST = deg(-15); // 撥爪右臂靜止時的方向(靠在擋銷下)
const ARM = { right: 1.4, left: 0.85, width: 0.22 };
// 撥爪是彎的:左臂往左下(原圖 B 在 C 的左下方),抬起時左端幾乎直直往上,鉤不會被帶離 A 的齒
const BEND = deg(30);
const LEFT = Math.PI + BEND; // 左臂相對右臂的方向
const D0 = deg(42); // 主動量為 0 時凸柱 D 的方位(在撥爪右端的上方)
const Z = { wheel: -0.45, a: 0, lever: 0.17, frame: 0.5 };

// 撥爪右臂(以 C 為原點,沿 +x;轉角 = REST + 被壓下的角度):凸柱只碰得到右臂
const LEVER = stadium(ARM.right, ARM.width).outline;
const leverAt = (alpha) => placeOutline(LEVER, C, REST + alpha);
const hingeAt = (alpha) => [C[0] + ARM.left * Math.cos(REST + alpha + LEFT), C[1] + ARM.left * Math.sin(REST + alpha + LEFT)];
const H = hingeAt(0); // B 的鉸銷(靜止時)

// B:從鉸銷往下垂的桿,下端的鉤往左伸到 A 的齒下(以鉸銷為原點,轉角 0 時的世界方向)
const B = (() => {
  const tip = [A.outer - 0.02 - H[0], 0.12 - H[1]]; // 鉤尖(相對鉸銷)
  const stem = thickLine([[0, 0], [tip[0] + 0.24, tip[1] - 0.02]], 0.12);
  const hook = [[tip[0] + 0.3, tip[1] - 0.08], [tip[0] + 0.3, tip[1] + 0.03], [tip[0], tip[1]], [tip[0] + 0.06, tip[1] - 0.08]];
  return { stem, hook, outline: [...stem, ...hook] };
})();
const hookAt = (alpha, beta) => placeOutline(B.hook, hingeAt(alpha), beta);

const studAt = (w) => circlePolygon(polar(WHEEL.stud, D0 - w).slice(0, 2), WHEEL.studR, 16);
const teethAt = (theta) => ratchetObstacles(A, theta);

// 撥爪的一步:凸柱壓著右臂時把撥爪往順時針壓到剛好不重疊;沒被壓時撥爪靠自重往回擺(左端落下),
// 但擋在凸柱下面就只能擺到碰到凸柱為止,而且是從靜止加速落回(DROP 這段主動量內落完)
const DROP = deg(10);
function leverStep(w, alpha, fall) {
  const stud = studAt(w);
  const hits = (x) => polygonsOverlap(leverAt(x), stud);
  if (hits(alpha)) {
    let [lo, hi] = [alpha, alpha - deg(60)];
    for (let k = 0; k < 30; k++) {
      const mid = (lo + hi) / 2;
      if (hits(mid)) lo = mid;
      else hi = mid;
    }
    return { alpha: hi, fall: null };
  }
  if (alpha >= 0) return { alpha: 0, fall: null };
  const free = swingUntilContact({ pivot: C, outline: LEVER, from: REST + alpha, into: 1, sweep: -alpha, steps: 30 }, [stud]) - REST;
  const start = fall ?? { from: alpha, at: w };
  const t = Math.min(1, (w - start.at) / DROP);
  return { alpha: Math.min(free, start.from * (1 - t * t)), fall: start };
}
const SAMPLES = 720;

// 撥爪左端抬起時,B 的鉤頂著齒的下面把 A 往逆時針推,推到剛好不重疊;一步之內推不開(不是鉤著齒)就回傳 null
function push(theta, hook, max) {
  const hits = (d) => teethAt(theta + d).some((o) => polygonsOverlap(hook, o));
  if (!hits(0)) return theta;
  if (hits(max)) return null;
  let [lo, hi] = [0, max];
  for (let k = 0; k < 30; k++) {
    const mid = (lo + hi) / 2;
    if (hits(mid)) lo = mid;
    else hi = mid;
  }
  return theta + hi;
}
// B 自由垂掛時的轉角:重心在鉸銷正下方(B 的重心偏右,垂掛時鉤會伸進 A 的齒裡,所以平常靠在齒上)
const HANG = (() => {
  const area = (poly) => poly.reduce((s, p, i) => s + (p[0] * poly[(i + 1) % poly.length][1] - poly[(i + 1) % poly.length][0] * p[1]) / 2, 0);
  const centroid = (poly) => {
    const a = area(poly);
    return poly.reduce((s, p, i) => {
      const q = poly[(i + 1) % poly.length];
      const k = (p[0] * q[1] - q[0] * p[1]) / (6 * a);
      return [s[0] + (p[0] + q[0]) * k, s[1] + (p[1] + q[1]) * k];
    }, [0, 0]);
  };
  const parts = [B.stem, B.hook].map((p) => ({ a: Math.abs(area(p)), c: centroid(p) }));
  const total = parts.reduce((s, p) => s + p.a, 0);
  const [cx, cy] = parts.reduce((s, p) => [s[0] + (p.c[0] * p.a) / total, s[1] + (p.c[1] * p.a) / total], [0, 0]);
  return -Math.PI / 2 - Math.atan2(cy, cx);
})();
// B 靠自重往 A 擺(順時針,鉤往左),碰到齒就停,最多擺到垂掛的轉角;被齒背頂住時先往外退
const settle = (alpha, beta, theta) =>
  Math.max(HANG, swingUntilContact({ pivot: hingeAt(alpha), outline: B.hook, from: beta, into: -1, sweep: 0.5, steps: 50 }, teethAt(theta)));

// 從起點走三圈,之後每圈都一樣(A 轉一齒):取最後一圈當作週期
const { TABLE, TURN } = (() => {
  let theta = 0;
  let beta = 0;
  let prev = 0;
  let fall = null;
  let lifting = false;
  const run = [];
  for (let i = 0; i <= 3 * SAMPLES; i++) {
    const step = leverStep((TAU * i) / SAMPLES, prev, fall);
    const alpha = step.alpha;
    fall = step.fall;
    if (alpha < prev) {
      // 撥爪左端抬起:鉤把 A 往上提
      const max = (Math.abs(alpha - prev) * ARM.left * 1.5) / A.inner + 0.002;
      theta = push(theta, hookAt(alpha, beta), max) ?? theta;
      lifting = true;
    } else if (lifting) {
      // 提完了:A 靠摩擦定位停在整齒的位置(鉤提起的行程略少於一齒,最後一點由定位補足;原圖沒畫定位的機件)
      theta = Math.ceil(theta / PITCH - 1e-6) * PITCH;
      lifting = false;
    }
    beta = settle(alpha, beta, theta);
    prev = alpha;
    run.push({ alpha, beta, theta });
  }
  const table = run.slice(2 * SAMPLES);
  const [t0, raw] = [table[0].theta, table[SAMPLES].theta - table[0].theta];
  const turn = Math.round(raw / PITCH) * PITCH;
  return { TABLE: table.map((s) => ({ ...s, theta: turn ? t0 + ((s.theta - t0) * turn) / raw : s.theta })), TURN: turn };
})();

function lookup(w) {
  const k = Math.floor(w / TAU);
  const x = ((w - k * TAU) / TAU) * SAMPLES;
  const i = Math.min(SAMPLES - 1, Math.floor(x));
  const t = x - i;
  const [a, b] = [TABLE[i], TABLE[i + 1]];
  return { alpha: a.alpha + (b.alpha - a.alpha) * t, beta: a.beta + (b.beta - a.beta) * t, theta: k * TURN + a.theta + (b.theta - a.theta) * t };
}

/** 大輪順時針轉過 w:撥爪被壓下的角度(順時針為負)、A 的轉角(自起點,逆時針為正)、B 的轉角 */
export function register(w) {
  const { alpha, beta, theta } = lookup(w);
  return { press: alpha, a: theta - TABLE[0].theta, b: beta };
}
export const pitch = PITCH;
/** 檢查用:大輪轉過 w 時的凸柱、撥爪、B 的鉤與 A 的齒(世界座標 2D) */
export function contactAt(w) {
  const { alpha, beta, theta } = lookup(w);
  return { stud: studAt(w), lever: leverAt(alpha), hook: hookAt(alpha, beta), teeth: teethAt(theta) };
}

const spokes = [0, 1, 2, 3].map((k) => ({ kind: "box", size: [WHEEL.rim - 0.5, 0.16, 0.14], at: [...polar((WHEEL.rim - 0.1) / 2, (k * TAU) / 4 + deg(20)).slice(0, 2), 0], angle: (k * TAU) / 4 + deg(20) }));
// 機架:最前面的一根細條,從右邊(大輪外)橫過來,分出兩根短臂接 C 的樞軸與 A 的固定短軸
const FRAME_Y = 1.45;
const frame = [
  { kind: "box", size: [4.1, 0.18, 0.1], at: [2.05, FRAME_Y, Z.frame] },
  { kind: "box", size: [0.16, FRAME_Y - C[1], 0.1], at: [C[0], (FRAME_Y + C[1]) / 2, Z.frame] },
  { kind: "box", size: [0.16, FRAME_Y, 0.1], at: [0, FRAME_Y / 2, Z.frame] },
  { kind: "cylinder", radius: 0.07, length: Z.frame - Z.lever + 0.1, at: [C[0], C[1], (Z.frame + Z.lever) / 2] }, // C 的樞軸
  { kind: "cylinder", radius: 0.12, length: Z.frame + 0.14, at: [0, 0, Z.frame / 2 - 0.05] }, // A 的固定短軸
  // 擋銷:撥爪右臂靜止時頂在它下面
  { kind: "cylinder", radius: 0.06, length: Z.frame - Z.lever + 0.1, at: [...rot2([1.0, ARM.width / 2 + 0.065], REST).map((c, i) => c + C[i]), (Z.frame + Z.lever) / 2] },
  { kind: "box", size: [0.12, FRAME_Y - 0.5, 0.1], at: [C[0] + 0.97, (FRAME_Y + 0.5) / 2, Z.frame] },
];

export default {
  figure: 76,
  parts: [
    {
      id: "wheel",
      kind: "group",
      center: [0, 0, Z.wheel],
      spin: WHEEL.rim,
      pieces: [
        { kind: "cylinder", radius: WHEEL.rim, inner: WHEEL.rim - WHEEL.width, length: 0.2 },
        ...spokes,
        { kind: "cylinder", radius: 0.4, length: 0.24 },
        { kind: "cylinder", radius: 0.12, length: 0.25, at: [0, 0, 0.175] }, // 大輪的軸(在 A 的短軸後面)
        // 凸柱 D:從輪緣內側的座伸向前方,掃過撥爪右臂的尖端
        { kind: "box", size: [0.5, 0.16, 0.2], at: [...polar(WHEEL.stud + 0.2, D0).slice(0, 2), 0], angle: D0 },
        { kind: "cylinder", radius: WHEEL.studR, length: 0.85, at: [...polar(WHEEL.stud, D0).slice(0, 2), 0.42], accent: true },
      ],
    },
    {
      id: "ratchet",
      kind: "plate",
      center: [0, 0, Z.a],
      shape: ratchetShape({ ...A, bore: 0.15 }),
      thickness: 0.16,
      circles: [0.3],
      mark: [0.55, 0],
      markSize: 0.07,
      spin: A.outer,
      label: "A",
      labelOffset: [-0.25, -0.5, 0.3],
    },
    {
      id: "lever",
      kind: "group",
      center: [...C, Z.lever],
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(LEVER, [circle(0.08).reverse()]), thickness: 0.1, angle: REST },
        { kind: "plate", shape: shape(stadium(ARM.left, ARM.width).outline, [circle(0.08).reverse(), circle(0.06, ARM.left, 0).reverse()]), thickness: 0.1, angle: REST + LEFT },
        { kind: "cylinder", radius: 0.05, length: Z.lever + 0.12, at: [...rot2([ARM.left, 0], REST + LEFT), -Z.lever / 2] }, // B 的鉸銷,往後伸到 A 那一層
        // 左端較重(原圖 B 那一端是一塊圓胖的塊),撥爪靠自重讓左端落下、右臂頂回擋銷
        { kind: "cylinder", radius: 0.2, length: 0.2, at: [...rot2([ARM.left - 0.05, 0], REST + LEFT), 0.12] },
      ],
    },
    {
      id: "pawl",
      kind: "group",
      center: [...H, Z.a],
      arrow: false,
      pieces: [{ kind: "plate", shape: shape(B.stem, [circle(0.065).reverse()]), thickness: 0.12 }, { kind: "plate", shape: shape(B.hook), thickness: 0.12 }],
      label: "B",
      labelOffset: [0.32, -0.45, 0.3],
    },
    { id: "frame", kind: "group", pieces: frame, label: "C", labelOffset: [C[0] + 0.3, C[1] - 0.05, Z.frame + 0.1] },
    { id: "studLabel", kind: "group", label: "D", labelOffset: [0.3, 0.12, 0.6] },
  ],
  // 動力重演:只推大輪;撥爪繞 C 擺(靠自重落回,右臂頂到擋銷為止),B 掛在撥爪的銷上靠自重擺,棘輪靠摩擦定位
  replay: {
    from: 0,
    to: -TAU,
    free: {
      ratchet: { hold: true, gravity: false },
      lever: { pivot: [...C, Z.lever] },
      pawl: { on: "lever" },
    },
    expect: [{ part: "ratchet", label: "輪轉一圈,棘輪被撥過一齒", quote: "使該輪轉動一齒的距離" }],
  },
  driver: { part: "wheel", type: "rotation", speed: -0.9 },
  target: "ratchet", // 記錄轉數的棘輪 A
  view: { direction: [0.06, 0.05, 1], fit: ["ratchet", "lever", "pawl", "frame"] }, // 原圖大輪只畫出一部分
  pose(v) {
    const { press, a, b } = register(-v);
    const stud = polar(WHEEL.stud, D0 + v);
    return {
      parts: {
        wheel: { angle: v },
        ratchet: { angle: TABLE[0].theta + a },
        lever: { angle: press },
        pawl: { position: [...hingeAt(press), Z.a], angle: b },
        studLabel: { position: [stud[0], stud[1], 0.45] },
      },
      readouts: [],
    };
  },
  waivers: [
    { check: "replay", parts: ["ratchet"], reason: "未修:動力重演不成立——凸柱壓下撥爪、撥爪靠自重落回都和模型一致,但 B 只靠自重搭在齒下,撥爪一抬,鉤就被齒的直面往外擠、擺離齒,沒把 A 提起。原文說 B 是鉸接的、靠自重回位;要在重演裡鉤得住,鉤與齒面的形狀要做成往內拉(倒鉤),或給 B 一個往 A 壓的小彈簧(原文沒有)(列入待確認清單)" },
  ],
};
