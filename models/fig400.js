// 第 400 種:四向進料(A. B. Wilson 的專利,用在 Wheeler & Wilson、Sloat 等縫紉機上)。桿 A 是叉形的,第二根桿 B(帶著進料齒)
// 以樞軸接在叉口裡。桿 B 由凸輪 C 上的徑向凸起抬起,同時兩根桿被一起往前帶;彈簧產生回程,桿 B 靠自重落下。
// 進料齒因此走一個四向的循環:上、前、下、後(布每次被往前送一步)。主動件是凸輪 C。
//
// 2026-10-20(model-audit-fixes-3 票 42,照 10-14 決定 (a) 照原圖重讀):原圖的凸輪 C 是從側面看的,軸是一根和 A 平行的水平軸;
// 凸輪上半是一塊徑向凸起,凸起的側面是斜的(原圖凸起正面的那條斜線),頂著 B 下面那塊有台階的凸塊。所以同一個凸起做兩件事:
// 徑向頂起 B,斜的側面同時沿軸向推 B 的凸塊,B 鉸在 A 的叉口裡,兩根一起往前。原本的模型把凸輪軸放成垂直紙面、
// 另加一片原圖沒有的「往前推」輪廓去頂 A 的垂耳,那片與垂耳都拿掉了。
// - 凸輪 C(軸沿 x,從前面看凸輪正面往上轉,照原圖的羽毛箭頭):左邊一片升程輪廓(平底從動件的包絡線:B 的底面就是平底),
//   右邊沿軸一層層加厚的斜側面,只在凸起那一段(推斷:每層 0.01,畫成細密的台階)。斜側面從凸起剛開始升時往右長,
//   升到頂時還在長,到凸起的後段維持最厚,凸起轉過去就沒了。
// - B 靠自重坐在凸輪上(B 的轉角由 B 的底面和凸輪外緣相碰算);B 下面的凸塊在凸輪右邊,凸塊的左面被斜側面推著(A 的位置由凸塊
//   和斜側面相碰算)。凸起轉過去之後 B 先落下(凸塊仍被最厚的那層頂著,兩根桿留在前面),凸塊離開凸起,彈簧才把 A 推回擋塊。
// - 循環:上(同時開始往前)→ 前 → 下 → 後。原文的「同時」照原圖讀成「抬起時兩根桿也被帶著往前」,和原本「四段各佔四分之一圈」
//   的推斷不同:往前從抬起剛開始就開始,升到頂之後還繼續到送完一步。各段佔凸輪的多少是推斷。
// - 彈簧照原圖在 A 左端下垂的鉤的右邊,是裝在座(斜線剖面的套筒)裡的壓縮彈簧:A 往前時鉤把它壓短,它把 A 推回。
//   推回停在擋塊上(推斷,原圖沒畫;沒有擋塊時回程由凸塊碰凸輪側面擋住,B 抬起時凸塊離開凸輪就擋不住)。
// - 原圖沒畫、補上的(推斷):縫紉機的台面(進料齒從台面的開口升上來)、吊在台面下托著 A 的兩個導架、彈簧座的吊架、擋塊、
//   凸輪軸的兩個軸承吊架;全部吊在台面下、連成一件。
// - 偏離插圖:B 下面的凸塊往下伸 0.1(原圖的台階很淺,要碰得到凸起的斜側面);B 的寬度(前後)加到 0.36,讓凸輪升程的接觸點
//   (平底從動件的接觸點會前後移)都落在 B 的底面上;叉的兩片跟著往外放。
import { TAU, smooth, rot2 } from "./kit.js";
import { falling } from "./jumps.js";
import { shape, rect, circle, spanBox } from "./shapes.js";

export const LIFT = 0.1; // 凸起把 B 底面(在凸輪左面)頂起的高度
export const FEED = 0.2; // 進料步幅(原文沒有給步幅)
export const CAM_BASE = 0.4; // 升程輪廓的基圓半徑
const B_BOTTOM = -0.1; // B 放平時底面的高度
const PIN = [-1.5, 0.06]; // B 的樞軸(A 退到底時)
const PAD = B_BOTTOM - PIN[1]; // B 的底面在 B 局部的高度
const B_HALF = 0.18; // B 的半寬(前後)
const CAM_AXIS = [-1, 0, 0]; // 凸輪軸沿 x;局部 x 是世界的 +z,局部 y 是世界的 +y,局部 z 朝世界的 −x
const CAM = [0.325, B_BOTTOM - CAM_BASE, 0]; // 基圓頂剛好貼著 B 放平時的底面
const LIFT_T = 0.25; // 升程那片的厚度
const CAM_LEFT = CAM[0] - LIFT_T / 2; // B 的底面碰到凸輪的地方(凸輪的左面)
const CAM_RIGHT = CAM[0] + LIFT_T / 2; // 斜側面從這裡往右長
const GAP0 = 0.02; // A 在擋塊上時,凸塊離凸輪右面的距離
const RAMP = FEED + GAP0; // 斜側面最厚處
const DX = 0.01; // 斜側面一層的厚度
const RAMP_IN = 0.28; // 斜側面的內緣半徑(凸塊伸到的最低處以下)
const LUG = { x: CAM_RIGHT + GAP0 - PIN[0], w: 0.1, depth: 0.1, half: 0.06 }; // B 下面的凸塊(B 局部:左面的 x、寬、深、半寬)
const STOP_X = -2.3; // 擋塊的右面 = 鉤的左面(A 退到底)
const HOOK = { x0: STOP_X, x1: STOP_X + 0.15, y0: -0.35 };
const SPRING_Y = -0.2;
const SEAT = { x0: -1.88, x1: -1.58, r: 0.15, inner: 0.1 }; // 彈簧座的套筒(開口朝左,底在右)

// 凸輪轉一圈的時序(推斷):升 0–0.2、頂 0.2–0.35、落 0.35–0.55;斜側面 0.03–0.3 從 0 長到最厚、到 0.55 止;彈簧推回 0.1 圈
const RISE = 0.2;
const DWELL = 0.35;
const DROP = 0.55;
const RAMP_FROM = 0.03;
const RAMP_TO = 0.3;
const RETURN = 0.1;

const phase = (theta) => (((theta / TAU) % 1) + 1) % 1;
/** 凸輪轉 theta → B 的底面在凸輪正上方離凸輪中心的高度:升(緩緩頂起)、停、落(加速落下,到基圓撞停)、停 */
export function liftHeight(theta) {
  const f = phase(theta);
  if (f < RISE) return CAM_BASE + LIFT * smooth(f / RISE);
  if (f < DWELL) return CAM_BASE + LIFT;
  if (f < DROP) return CAM_BASE + LIFT * (1 - falling((f - DWELL) / (DROP - DWELL)));
  return CAM_BASE;
}
/** 凸輪轉到 f(0–1)時正上方那一段斜側面的厚度;凸起以外是 null */
function rampAt(f) {
  if (f > DROP) return null;
  if (f < RAMP_FROM) return 0;
  if (f < RAMP_TO) return RAMP * smooth((f - RAMP_FROM) / (RAMP_TO - RAMP_FROM));
  return RAMP;
}
// 凸輪局部角 psi 那一段轉到正上方時,凸輪轉到 f
const phaseOfLocal = (psi) => phase(Math.PI / 2 - psi);

/**
 * 平底從動件的凸輪輪廓:從動件的平面朝世界方向 alpha、離凸輪中心 h(θ)。凸輪轉 θ 時,局部方向 β = alpha − θ 上的支撐距離是
 * H(β) = h(alpha − β);輪廓點 = H·e(β) + H′·e′(β)。逆時針排列。
 */
export function camOutline(h, alpha, samples = 360) {
  const d = 1e-4;
  const H = (b) => h(alpha - b);
  return Array.from({ length: samples }, (_, i) => {
    const b = (i / samples) * TAU;
    const [v, dv] = [H(b), (H(b + d) - H(b - d)) / (2 * d)];
    return [v * Math.cos(b) - dv * Math.sin(b), v * Math.sin(b) + dv * Math.cos(b)];
  });
}
const LIFT_OUTLINE = camOutline(liftHeight, Math.PI / 2);

// 升程輪廓在局部角 psi 的半徑(從中心往外的射線碰到輪廓的地方;輪廓對中心是星形的)
function rayRadius(outline, psi) {
  const [dx, dy] = [Math.cos(psi), Math.sin(psi)];
  let best = 0;
  outline.forEach((p, i) => {
    const q = outline[(i + 1) % outline.length];
    const [ex, ey] = [q[0] - p[0], q[1] - p[1]];
    const den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-12) return;
    const t = (p[0] * ey - p[1] * ex) / den;
    const s = (p[0] * dy - p[1] * dx) / den;
    if (t > 0 && s >= -1e-9 && s <= 1 + 1e-9) best = Math.max(best, t);
  });
  return best;
}
const R_STEPS = 1440;
const R_TABLE = Array.from({ length: R_STEPS + 1 }, (_, i) => rayRadius(LIFT_OUTLINE, (i / R_STEPS) * TAU));
function liftRadius(psi) {
  const u = (((psi / TAU) % 1) + 1) % 1 * R_STEPS;
  const i = Math.floor(u);
  return R_TABLE[i] + (R_TABLE[i + 1] - R_TABLE[i]) * (u - i);
}

// 斜側面的第 k 層(從凸輪右面往右數):斜側面厚度到 (k + ½)·DX 以上的那一段凸起,外緣是升程輪廓、內緣是半徑 RAMP_IN 的圓弧
function rampLayer(k) {
  const level = (k + 0.5) * DX;
  let [lo, hi] = [RAMP_FROM, RAMP_TO];
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (rampAt(mid) < level) lo = mid;
    else hi = mid;
  }
  const [a0, a1] = [Math.PI / 2 - DROP * TAU, Math.PI / 2 - hi * TAU]; // 局部角:轉到正上方越晚的越小
  const n = Math.ceil(((a1 - a0) / TAU) * 360);
  const angles = Array.from({ length: n + 1 }, (_, i) => a0 + ((a1 - a0) * i) / n);
  return [...angles.map((a) => [liftRadius(a) * Math.cos(a), liftRadius(a) * Math.sin(a)]), ...angles.reverse().map((a) => [RAMP_IN * Math.cos(a), RAMP_IN * Math.sin(a)])];
}
const LAYERS = Math.round(RAMP / DX);

/** 凸輪轉 theta、A 往前 f 時 B 的轉角(逆時針為正):B 的底面(平底)在凸輪的左面碰到凸輪外緣的最高處 */
function bAngleAt(theta, f) {
  const D = CAM_LEFT - (PIN[0] + f);
  const K = CAM[1] + liftHeight(theta) - PIN[1];
  return Math.atan2(K, D) + Math.asin(-PAD / Math.hypot(D, K));
}

// 凸塊左面上的取樣點(B 局部的高度 × 前後)
const LUG_SAMPLES = Array.from({ length: 11 }, (_, i) => PAD - LUG.depth + (LUG.depth * i) / 10).flatMap((ly) =>
  Array.from({ length: 13 }, (_, j) => ({ ly, z: -LUG.half + (2 * LUG.half * j) / 12 })),
);
/** 凸輪轉 theta、B 轉 a 時,凸塊左面要離開凸輪(右面或斜側面)A 至少要往前多少 */
function rampContact(theta, a) {
  const [c, s] = [Math.cos(a), Math.sin(a)];
  let need = -Infinity;
  for (const { ly, z } of LUG_SAMPLES) {
    const y = PIN[1] + LUG.x * s + ly * c;
    const x0 = PIN[0] + LUG.x * c - ly * s; // A 退到底時這一點的 x
    const [u, v] = rot2([z, y - CAM[1]], -theta);
    const r = Math.hypot(u, v);
    const psi = Math.atan2(v, u);
    if (r > liftRadius(psi)) continue;
    const ramp = r >= RAMP_IN ? rampAt(phaseOfLocal(psi)) : null;
    need = Math.max(need, CAM_RIGHT + (ramp ?? 0) - x0);
  }
  return need;
}

/** 凸輪轉 theta → A 往前多少、B 的轉角:B 靠自重坐在凸輪上,A 被凸塊推著或被彈簧推回(不越過凸輪、不越過擋塊) */
function stateAt(theta) {
  const back = springBack(phase(theta));
  let [f, a] = [0, 0];
  for (let i = 0; i < 4; i++) {
    a = bAngleAt(theta, f);
    f = Math.max(0, rampContact(theta, a), back);
  }
  return { f, a };
}

// 凸塊離開凸起的時刻(凸輪轉到 RELEASE),此後彈簧把 A 推回:起步慢、越推越快,撞到擋塊停住
const scanRelease = () => {
  let prev = null;
  for (let f = DWELL; f < 1; f += 1e-4) {
    const need = rampContact(f * TAU, bAngleAt(f * TAU, FEED));
    if (prev !== null && need < prev - 0.05) return { at: f, from: prev };
    prev = need;
  }
  throw new Error("凸塊沒有離開凸起");
};
let RELEASE = { at: 2, from: 0 };
function springBack(f) {
  if (f < RELEASE.at || f > RELEASE.at + RETURN) return 0;
  return RELEASE.from * (1 - falling((f - RELEASE.at) / RETURN));
}
RELEASE = scanRelease();

// 桿 B(局部,樞軸為原點):從樞軸往右伸過凸輪上方,底面在凸輪那一段是平的(從動件的平底);右端墊高一段、上面是進料齒
const B_BAR = [[-0.1, -0.06], [1.0, PAD], [3.4, PAD], [3.4, 0.06], [-0.1, 0.06]];
const B_LUG = rect(LUG.w, LUG.depth + 0.005, LUG.x + LUG.w / 2, PAD - (LUG.depth - 0.005) / 2);
const B_RISER = [[2.45, 0], [3.4, 0], [3.4, 0.22], [2.7, 0.22], [2.45, 0.06]];
const B_SPUR = Array.from({ length: 9 }, (_, i) => [2.75 + i * 0.075, i % 2 ? 0.31 : 0.22]).concat([[3.35, 0.2], [2.75, 0.2]]);
const SPUR_TIP = [2.75 + 5 * 0.075, 0.31]; // 量進料齒升起多少的點(齒列中間的齒尖)

/** 凸輪轉 theta → 進料齒的抬起與前進量(四向循環) */
export function fourMotion(theta) {
  const { f, a } = stateAt(theta);
  return { lift: SPUR_TIP[0] * Math.sin(a) + SPUR_TIP[1] * (Math.cos(a) - 1), feed: f };
}

const BED_Y = [0.3, 0.4];
const OPENING = { x0: 0.5, x1: 2.25, z: 0.22 }; // 台面上讓進料齒升上來的開口
// 凸輪軸的軸承吊架:從台面後面吊下的板、往前伸到軸的臂、套著軸的軸承環
const hanger = (x) => [
  spanBox(x - 0.05, x + 0.05, CAM[1] - 0.08, BED_Y[0], -0.6, -0.5),
  spanBox(x - 0.05, x + 0.05, CAM[1] - 0.08, CAM[1] + 0.08, -0.5, -0.14),
  { kind: "cylinder", axis: [1, 0, 0], radius: 0.17, inner: 0.08, length: 0.1, at: [x, CAM[1], 0] },
];
// 托著 A 的導架:兩片側板從台面吊下,底下托著 A(左邊托 A 的實心段;右邊兩條托著叉的兩片,中間讓 B 通過)
const guide = (x0, x1, split) => [
  spanBox(x0, x1, -0.06, BED_Y[0], 0.29, 0.35),
  spanBox(x0, x1, -0.06, BED_Y[0], -0.35, -0.29),
  ...(split ? [spanBox(x0, x1, -0.06, 0, 0.19, 0.35), spanBox(x0, x1, -0.06, 0, -0.35, -0.19)] : [spanBox(x0, x1, -0.06, 0, -0.35, 0.35)]),
];
const CAM_SHAFT = { x0: -0.2, x1: 1.0 };

export default {
  figure: 400,
  parts: [
    {
      id: "bed",
      kind: "group",
      pieces: [
        // 台面(推斷),在進料齒的位置開口
        spanBox(-2.7, OPENING.x0, ...BED_Y, -0.7, 0.7),
        spanBox(OPENING.x1, 2.5, ...BED_Y, -0.7, 0.7),
        spanBox(OPENING.x0, OPENING.x1, ...BED_Y, OPENING.z, 0.7),
        spanBox(OPENING.x0, OPENING.x1, ...BED_Y, -0.7, -OPENING.z),
        ...guide(-1.9, -1.7, false),
        ...guide(0.7, 0.85, true),
        // 彈簧座:吊在左導架底下的套筒,開口朝左對著鉤,彈簧的右端坐在套筒底
        { kind: "cylinder", role: "seat", axis: [1, 0, 0], radius: SEAT.r, inner: SEAT.inner, length: SEAT.x1 - SEAT.x0, at: [(SEAT.x0 + SEAT.x1) / 2, SPRING_Y, 0] },
        { kind: "cylinder", axis: [1, 0, 0], radius: SEAT.r, length: 0.06, at: [SEAT.x1 + 0.03, SPRING_Y, 0] },
        // 擋塊:從台面後面吊下,伸到鉤的左邊;A 被彈簧推回時鉤靠在它上面
        spanBox(STOP_X - 0.15, STOP_X, -0.34, BED_Y[0], -0.43, -0.37),
        spanBox(STOP_X - 0.15, STOP_X, -0.34, -0.12, -0.37, 0.1, { role: "stop" }),
        ...hanger(-0.1),
        ...hanger(0.9),
      ],
    },
    {
      id: "barA",
      kind: "group",
      arrow: false,
      label: "A",
      labelOffset: [-2.3, 0.22, 0.3],
      pieces: [
        spanBox(-2.45, -1.65, 0, 0.12, -0.27, 0.27),
        // 左端往下彎的鉤:右面頂著彈簧,左面靠在擋塊上
        spanBox(HOOK.x0, HOOK.x1, HOOK.y0, 0, -0.27, 0.27, { role: "hook" }),
        // 叉:從叉根往右分成前後兩片,B 夾在中間、以銷鉸在叉根
        spanBox(-1.65, 0.95, 0, 0.12, 0.19, 0.27),
        spanBox(-1.65, 0.95, 0, 0.12, -0.27, -0.19),
      ],
    },
    { id: "pinB", kind: "cylinder", radius: 0.05, length: 0.6 },
    {
      id: "barB",
      kind: "group",
      arrow: false,
      label: "B",
      labelOffset: [4.6, -0.2, 0.3],
      pieces: [
        { kind: "plate", role: "pad", shape: shape(B_BAR, [circle(0.05).reverse()]), thickness: 2 * B_HALF },
        // 凸塊:B 底面往下的一塊,左面被凸輪的斜側面推著
        { kind: "plate", role: "lug", shape: shape(B_LUG), thickness: 2 * LUG.half },
        { kind: "plate", shape: shape(B_RISER), thickness: 2 * B_HALF },
        // 進料齒
        { kind: "plate", shape: shape(B_SPUR), thickness: 0.2 },
      ],
    },
    { id: "springA", kind: "spring", coils: 7, radius: 0.07, wire: 0.015 },
    {
      id: "cam",
      kind: "group",
      axis: CAM_AXIS,
      center: CAM,
      spin: 0.58,
      label: "C",
      labelOffset: [-0.35, 0.2, 0.6],
      pieces: [
        { kind: "plate", role: "lift", shape: shape(LIFT_OUTLINE), thickness: LIFT_T, mark: [0.3, 0], markSize: 0.05 },
        // 凸起的斜側面:沿軸一層層往右加厚(局部 z 朝世界的 −x)
        ...Array.from({ length: LAYERS }, (_, k) => ({ kind: "plate", role: "ramp", shape: shape(rampLayer(k)), thickness: DX, at: [0, 0, -(LIFT_T / 2 + (k + 0.5) * DX)] })),
        { kind: "cylinder", role: "shaft", radius: 0.08, length: CAM_SHAFT.x1 - CAM_SHAFT.x0, at: [0, 0, CAM[0] - (CAM_SHAFT.x0 + CAM_SHAFT.x1) / 2] },
      ],
    },
  ],
  // 動力重演:只推凸輪;A 沿導架滑、受彈簧往回推,B 鉸在 A 的叉根、靠自重坐在凸輪上——看凸起把 B 頂起、斜側面推著凸塊把兩根桿
  // 往前帶、B 落回、彈簧把兩根桿推回。B 的轉角只有約 0.066(3.8°),全書預設的容許誤差 0.14 會把「沒抬起」也放過,
  // 所以 B 的兩個事件把容許誤差收到 0.05(重演裡的 A 比模型慢一點、B 落得也慢一點,落回的事件放在凸起轉過去後 0.03 圈)
  replay: {
    seconds: 12,
    free: { barA: { slide: [1, 0, 0], spring: -1, gravity: false, limits: [0, FEED + 0.05] }, barB: { pivot: [PIN[0], PIN[1], 0], on: "barA" } },
    ignore: [["barA", "barB"], ["barB", "pinB"], ["barA", "pinB"]],
    expect: [
      { at: TAU * RISE, part: "barB", label: "凸輪的徑向凸起把 B 抬起", quote: "桿 B 由凸輪 C 上的徑向凸出部分抬起", tolerance: 0.05 },
      { at: TAU * RAMP_TO, part: "barA", label: "凸起的斜側面推著 B 的凸塊,兩根桿一起往前", quote: "同時這兩根桿被一起向前帶動" },
      { at: TAU * (DROP + 0.03), part: "barB", label: "凸起轉過去,B 憑自重落回", quote: "桿 B 則憑自身重力落下", tolerance: 0.05 },
      { at: TAU * 0.8, part: "barA", label: "彈簧把兩根桿推回", quote: "一根彈簧產生回程運動" },
    ],
  },
  driver: { part: "cam", type: "rotation" },
  target: "barB", // 帶著進料齒走四向循環的桿
  view: { direction: [0.06, 0.08, 1] },
  pose(theta) {
    const { f, a } = stateAt(theta);
    const pivot = [PIN[0] + f, PIN[1], 0];
    return {
      parts: {
        cam: { angle: theta },
        barA: { position: [f, 0, 0] },
        barB: { position: pivot, angle: a },
        pinB: { position: pivot },
        springA: { from: [HOOK.x1 + f, SPRING_Y, 0], to: [SEAT.x1, SPRING_Y, 0] },
      },
      readouts: [],
    };
  },
};
