// 第 232 種:振動搖臂 B,把間歇的圓周運動傳給齒形輪。A 是套在輪軸上、可自由擺動的一塊板,頂端以樞軸掛著
// 弧形的棘爪 C;B 也繞輪軸擺動,經一根短連桿接到 C 上。B 被抬起時先把 C 從齒間抬出,接著帶著 A 與 C 往後越過圓周;
// B 下降時 C 先落進兩齒之間的空隙,接著帶著輪一起轉。主動量是 B 的累計擺動量。
//
// 接觸(由接觸算):連桿長度固定,C 抬起多少由 B 相對 A 轉了多少決定(四連桿)。C 抬到頂時上緣碰到 A 上的擋銷,
// B 再往上就帶著 A、C 往後轉。B 下降時 C 往下落,爪尖碰到齒(落到齒間底部)就落不下去,B 再往下便帶著 A、C 一起轉,
// 爪尖頂著齒的側面把輪往前推。C 落多深、A 何時被帶動、輪被推多遠,都由爪尖與齒相碰算出。
// 推斷:擋銷的位置(C 抬起的上限);B 每擺一程,A 往後轉過一齒多一點,C 落進下一個齒間,輪每個來回前進一齒;
// 輪軸裝在後面的軸承座上(原圖只畫輪轂)。
import { TAU, deg, rot2, swingPhase } from "./kit.js";
import { shape, circle, thickLine, arcPoints, gearProfile, toothOutline, gearSize } from "./shapes.js";
import { resample } from "./noncircular.js";
import { circleCircle } from "./linkage.js";
import { placeOutline, polygonsOverlap } from "./contact.js";
import { pedestal } from "./supports.js";

const N = 20;
const PITCH = TAU / N;
const R = 2.1; // 輪的節圓
const { addendum, dedendum } = gearSize(R, N);
const ROOT = R - dedendum;
const C_PIVOT = [0.05, 2.85]; // C 在 A 上的樞軸(A 的局部座標)
const B_PIN = [0.75, 0]; // 連桿在 B 上的銷
const C_PIN = [0.75, 2.62]; // 連桿在 C 上的銷(C 落到底、A 轉角 0 時)
const LINK = Math.hypot(C_PIN[0] - B_PIN[0], C_PIN[1] - B_PIN[1]);
const C_ARM = [C_PIN[0] - C_PIVOT[0], C_PIN[1] - C_PIVOT[1]];
const LIFT_MAX = deg(20); // C 抬到頂(上緣碰到 A 上的擋銷)
const GAP = deg(38) + PITCH / 2; // 起始時 C 的爪尖所在的齒間(兩齒之間)的方位

// C 的外形(局部座標:原點在樞軸):從樞軸沿輪緣往右彎下的弧形桿身,末端是伸進齒間的楔形爪尖
const cArc = Array.from({ length: 12 }, (_, i) => {
  const a = deg(88) - ((deg(88) - GAP - deg(4)) * i) / 11;
  const r = R + 0.75 - (0.36 * i) / 11;
  return [r * Math.cos(a) - C_PIVOT[0], r * Math.sin(a) - C_PIVOT[1]];
});
// 爪尖:楔形,兩側斜度和齒槽的齒側一樣,底部在齒根圓上方一點(世界座標下,齒間居中、C 落到底時)
const TIP_WORLD = (() => {
  const at = (r, da) => [r * Math.cos(GAP + da / r), r * Math.sin(GAP + da / r)];
  const lo = ROOT + 0.03;
  const hi = R + addendum + 0.12;
  return [at(lo, -0.05), at(lo, 0.05), at(hi, 0.15), at(hi, -0.15)];
})();
const TIP = TIP_WORLD.map(([x, y]) => [x - C_PIVOT[0], y - C_PIVOT[1]]);

// B 相對 A 轉 r 時,C 相對 A 的抬起角(連桿長度固定;r = 0 時 C 落到底)
function liftOf(r) {
  const bpin = rot2(B_PIN, r);
  const arm = Math.hypot(...C_ARM);
  const p = circleCircle([...bpin, 0], LINK, [...C_PIVOT, 0], arm, -1).point;
  return Math.atan2(p[1] - C_PIVOT[1], p[0] - C_PIVOT[0]) - Math.atan2(C_ARM[1], C_ARM[0]);
}
// 反過來:C 抬起 lift 時,B 相對 A 的轉角(liftOf 是遞增的,二分法)
function relOf(lift) {
  let [lo, hi] = [deg(-10), deg(30)];
  for (let k = 0; k < 50; k++) {
    const mid = (lo + hi) / 2;
    if (liftOf(mid) < lift) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
const REL_MAX = relOf(LIFT_MAX);
const SWING = PITCH * 1.25 + REL_MAX; // B 的擺幅:A 每程往後轉約 1.25 齒
const LOW = -SWING / 2;
const HIGH = SWING / 2;

// 輪的齒(世界座標):每齒一塊,加齒根圓
const teethAt = (theta) => {
  const out = [];
  for (let i = 0; i < N; i++) out.push(toothOutline({ teeth: N, radius: R }, i).map((p) => rot2(p, theta)));
  out.push(circle(ROOT - 0.02));
  return out;
};
const tipAt = (a, lift) => placeOutline(TIP, rot2(C_PIVOT, a), a + lift);
// disc:是否連齒根圓一起算(爪尖落下時算;A 帶著爪尖繞輪心轉、推齒時只看齒——爪尖沿齒根圓走,不會更深)
const tipHits = (a, lift, theta, disc = true) => {
  const tip = tipAt(a, lift);
  return teethAt(theta).some((t, i) => (disc || i < N) && polygonsOverlap(tip, t));
};

// 逐步算:狀態是 A 的轉角 a、C 的抬起角 lift、輪的轉角 θ;B 的轉角 b 由主動量給出
const SAMPLES = 600; // 一個來回
const STEP_V = (2 * SWING) / SAMPLES;
function stepTo(s, b0, b, down) {
  let { a, lift, theta } = s;
  if (!down) {
    // B 往上:C 跟著抬起;抬到頂之後 A、C 被帶著往後
    const r = Math.min(b - a, REL_MAX);
    a = b - r;
    lift = liftOf(r);
    // 爪尖抬出齒間時擦到齒側:把輪往前推開(輪不會被拖著倒轉)
    for (let k = 0; k < 40 && tipHits(a, lift, theta); k++) theta -= PITCH / 400;
    return { a, lift, theta };
  }
  // B 往下:A 不動、C 先落;落到碰到齒(r_c)就落不下去,B 剩下的行程帶著 A、C 一起轉,
  // 爪尖頂著齒的側面把輪往前(順時針)推開
  const rPrev = b0 - a;
  const rTry = b - a;
  let r = rTry;
  if (tipHits(a, liftOf(rTry), theta)) {
    let [lo, hi] = [rTry, rPrev];
    for (let k = 0; k < 40; k++) {
      const mid = (lo + hi) / 2;
      if (tipHits(a, liftOf(mid), theta)) lo = mid;
      else hi = mid;
    }
    r = hi;
  }
  a = b - r;
  lift = liftOf(r);
  // 只看原本碰到的那一齒:輪轉開它就好(轉過頭會碰到後面那一齒,那不是這一步的事)
  const tip = tipAt(a, lift);
  const pressed = teethAt(theta).slice(0, N).map((t, i) => (polygonsOverlap(tip, t) ? i : -1)).filter((i) => i >= 0);
  const still = (p) => {
    const teeth = teethAt(theta - p);
    return pressed.some((i) => polygonsOverlap(tip, teeth[i]));
  };
  if (pressed.length) {
    let [p0, p1] = [0, PITCH / 4];
    for (let k = 0; k < 40; k++) {
      const mid = (p0 + p1) / 2;
      if (still(mid)) p0 = mid;
      else p1 = mid;
    }
    theta -= p1;
  }
  return { a, lift, theta };
}

const { TABLE, ADVANCE } = (() => {
  let s = { a: LOW, lift: 0, theta: LOW }; // 起始時 C 落在齒間(齒間隨 A 轉到 LOW)
  const run = [];
  let prevB = LOW;
  for (let i = 0; i <= 3 * SAMPLES; i++) {
    const b = swingPhase(i * STEP_V, LOW, HIGH).at;
    s = stepTo(s, prevB, b, b < prevB);
    prevB = b;
    run.push({ b, ...s });
  }
  const table = run.slice(2 * SAMPLES);
  const raw = table[SAMPLES].theta - table[0].theta;
  const advance = Math.round(raw / PITCH) * PITCH;
  if (!advance || Math.abs(raw - advance) > PITCH * 0.05) throw new Error(`第 232 種:每個來回推了 ${(raw / PITCH).toFixed(2)} 齒`);
  const t0 = table[0].theta;
  return { TABLE: table.map((e) => ({ ...e, theta: t0 + ((e.theta - t0) * advance) / raw })), ADVANCE: advance };
})();
const W0 = TABLE[0].theta; // 輪的絕對轉角 = 自起點的轉角 + W0

/** 主動量 v(B 的累計擺動):B、A 的轉角(A 自起點),C 的抬起角與輪的轉角(自起點) */
export function motion(v) {
  const period = 2 * SWING;
  const k = Math.floor(v / period + 1e-12);
  const x = Math.max(0, ((v - k * period) / period) * SAMPLES);
  const i = Math.min(SAMPLES - 1, Math.floor(x));
  const t = x - i;
  const [p, q] = [TABLE[i], TABLE[i + 1]];
  const lerp = (key) => p[key] + (q[key] - p[key]) * t;
  // A、C 每個來回回到同一個位置;輪每個來回前進一齒
  return { b: swingPhase(v, LOW, HIGH).at, a: lerp("a"), lift: lerp("lift"), wheel: lerp("theta") - TABLE[0].theta + k * ADVANCE };
}
export const geometry = { PITCH, SWING, LIFT_MAX };
/** 檢查用:主動量 v 時 C 的爪尖與輪的齒(世界座標 2D) */
export function contactAt(v) {
  const { a, lift, wheel } = motion(v);
  return { tip: tipAt(a, lift), teeth: teethAt(wheel + W0).slice(0, N) };
}

const wheelShape = shape(resample(gearProfile({ teeth: N, radius: R }), 0.03), [circle(0.15).reverse()]);
const plateA = shape(
  [[-0.45, -0.45], [1.75, -0.4], [1.8, 0.45], [0.85, 0.75], [0.35, 1.2], [0.35, 2.75], ...arcPoints(0.28, 0, Math.PI, 0.05, 2.85), [-0.25, 0.4]],
  [circle(0.17).reverse()],
);
const cShape = shape(thickLine(cArc, 0.3), [circle(0.06).reverse()]);
// A 上的擋銷:C 抬到頂時,桿身上緣靠在它上面(C 局部座標的 STOP_ON_C 點,沿桿身的法線往外)
const STOP_ON_C = cArc[3];
const STOP = (() => {
  const [x, y] = rot2(STOP_ON_C, LIFT_MAX);
  const [dx, dy] = rot2([cArc[4][0] - cArc[2][0], cArc[4][1] - cArc[2][1]], LIFT_MAX);
  const l = Math.hypot(dx, dy);
  const off = 0.15 + 0.07; // 桿身半寬 + 銷半徑
  return [C_PIVOT[0] + x - (dy / l) * off, C_PIVOT[1] + y + (dx / l) * off];
})();

export default {
  figure: 232,
  parts: [
    { id: "wheel", kind: "plate", shape: wheelShape, thickness: 0.2, hub: 0.3, mark: [-1.4, -0.6], markSize: 0.09, spin: R + 0.2 },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: 0.15, length: 1.5, at: [0, 0, 0.15] }, // 輪軸,A 與 B 都套在上面
        ...pedestal({ at: [0, 0], z: -0.45, bore: 0.15, floor: -2.9 }),
      ],
    },
    {
      id: "plateA",
      kind: "group",
      arrow: false,
      label: "A",
      labelOffset: [-0.15, 1.6, 0.3],
      pieces: [
        { kind: "plate", shape: plateA, thickness: 0.1, at: [0, 0, 0.18] },
        { kind: "cylinder", radius: 0.06, length: 0.32, at: [...C_PIVOT, 0.3] }, // C 的樞軸銷
        { kind: "cylinder", radius: 0.07, length: 0.28, at: [...STOP, 0.3] }, // 擋銷:C 抬起的上限
      ],
    },
    {
      id: "pawlC",
      kind: "group",
      center: [...C_PIVOT, 0.3],
      arrow: false,
      label: "C",
      labelOffset: [1.3, -0.55, 0.3],
      pieces: [
        { kind: "plate", shape: cShape, thickness: 0.1 },
        { kind: "plate", shape: shape(TIP), thickness: 0.36, at: [0, 0, -0.25] }, // 爪尖往後伸到齒輪那一層
        { kind: "cylinder", radius: 0.06, length: 0.14, at: [C_ARM[0], C_ARM[1], 0.11] }, // 掛連桿的銷往前伸到連桿
      ],
    },
    { id: "leverB", kind: "plate", shape: shape(thickLine([[0, 0], [4.0, 0]], 0.36), [circle(0.16).reverse()]), thickness: 0.1, center: [0, 0, 0.58], arrow: false, label: "B", labelOffset: [3.0, 0.1, 0] },
    { id: "link", kind: "link", width: 0.16, thickness: 0.06 },
  ],
  // 動力重演:只推 B;A、C 照模型走(C 由連桿帶著抬起、落下),輪靠摩擦定位,由 C 的爪尖推動
  replay: {
    to: 4 * SWING,
    seconds: 16,
    free: { wheel: { hold: true, gravity: false } },
    // 輪、A 都套在同一根軸上:輪轂與軸、輪轂與 A 的貼合面不算碰撞(否則 A 擺動時會把輪磨著帶走)
    ignore: [["wheel", "frame"], ["wheel", "plateA"]],
    expect: [
      { at: SWING, part: "wheel", label: "B 抬起:C 抬出齒間、往後越過圓周,輪不動", quote: "當搖臂 B 被抬起時,棘爪 C 會從輪的齒間被抬起,並向後越過圓周移動" },
      { at: 2 * SWING, part: "wheel", label: "B 下降:C 落進齒間,帶著輪轉一齒", quote: "當搖臂下降時,棘爪會再次落入兩齒之間的空隙中,並帶動輪一起轉動" },
      { at: 4 * SWING, part: "wheel", label: "兩個來回後輪轉兩齒" },
    ],
  },
  driver: { part: "leverB", type: "rotation", cycle: [LOW, HIGH] },
  target: "wheel",
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const { b, a, lift, wheel } = motion(v);
    const pivot = rot2(C_PIVOT, a);
    const cAngle = a + lift;
    const arm = rot2(C_ARM, cAngle);
    const bPin = rot2(B_PIN, b);
    return {
      parts: {
        wheel: { angle: wheel + W0 },
        plateA: { angle: a },
        pawlC: { position: [pivot[0], pivot[1], 0.3], angle: cAngle },
        leverB: { angle: b },
        link: { from: [bPin[0], bPin[1], 0.5], to: [pivot[0] + arm[0], pivot[1] + arm[1], 0.5] },
      },
      readouts: [],
    };
  },
};
