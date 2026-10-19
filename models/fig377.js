// 第 377 種:踏車。長圓筒的周邊排著踏板,人扶著前面的橫桿、踩在踏板上往上走,圓筒被人的重量帶著轉;
// 軸端的大齒輪把動力傳出去(碾穀物、在中國用來抽水灌溉)。主動件是虛擬的「進程」:踏車已轉了幾圈。
// 照原圖:人在圓筒朝讀者的那一側(離頂約 25°–50°)往上爬,面向圓筒、背對讀者;重量經支撐腳壓在 +z 那一側的踏板上,
// 讓圓筒繞 +x 轉,他踩的那一側往下走。兩隻腳輪流:踩著的腳停在一片踏板上跟著往下走,另一隻抬起往上邁一步(隔一片踏板落下)。
// 身體立在支撐腳的上方(支撐腳從身體前面被帶到身體後面,重心約在中間、略偏圓筒那側),手只扶著前面的橫桿,
// 不是往後仰吊在橫桿上。
// 推斷:踏板數、人的步伐與圓筒轉速的對應、腿分成上下兩節(膝);只畫一個人;
// 扶手的橫桿由兩端立在底座上的立柱撐著(原圖用一根斜木條撐著,斜木條會擋住人,改成立柱)。
import { X, TAU, partPoint } from "./kit.js";
import { shape, circle } from "./shapes.js";
import { circleCircle } from "./linkage.js";

const R = 1.35; // 圓筒半徑(踏板外緣)
const CORE = 1.2; // 圓筒本體(踏板釘在它外面)
const LEN = 4.4;
const TREADS = 16;
const SPACING = TAU / TREADS;
const AXLE = 0.12;
const GEAR_X = -LEN / 2 - 0.6; // 軸端的大齒輪
const BASE_TOP = -1.95; // 底板頂面:比大齒輪的齒轉到最低處(−1.91)低
const LEG_W = 0.12;
const LIFT = 0.25; // 邁步時腳抬離踏板的高度
const PERSON = [0.6, 2.0, 0.72]; // 髖(身體下緣的中點):z 約在支撐腳走過的範圍(0.52–0.95)的中間、略偏圓筒那側
// 扶手的橫桿(中心),在人的前面、約胸口高;兩端的立柱在 x −2.45、2.75。偏離插圖:原圖橫桿約在頭的高度、人往前傾;
// 模型的人身體直立、手臂是一根直桿,橫桿要低於肩,手臂才從肩往前下擱到橫桿頂上、不切過橫桿的後緣
const RAIL = { y: 2.5, z: 0.3, x: [-2.51, 2.81] };
const ARM_W = 0.08;

/** 進程 p → 圓筒轉角 */
export function treadmill(p) {
  return { drum: TAU * p }; // 繞 +x 轉:人那一側(+z)往下走
}

const treads = Array.from({ length: TREADS }, (_, i) => {
  const a = i * SPACING;
  const r = (CORE + R) / 2;
  return { kind: "box", size: [R - CORE, 0.32, LEN], at: [r * Math.cos(a), r * Math.sin(a), 0], angle: a, accent: i === 0, role: "tread" }; // 一片踏板塗記號色
});
const gearTeeth = Array.from({ length: 16 }, (_, i) => {
  const a = (i * TAU) / 16;
  return { kind: "box", size: [0.4, 0.3, 0.25], at: [1.7 * Math.cos(a), 1.7 * Math.sin(a), GEAR_X], angle: a, role: "tooth" };
});

// 踏板在世界中的角度 ψ(從 +y 往 +z 量):圓筒轉角 θ 時,第 i 片在 ψ0 + iΔ + θ
const psi = (p) => Math.atan2(p[2], p[1]);
const TREAD0 = psi(partPoint([0, 0, 0], X, 0, [R, 0, 0]));
const LAND = TREAD0 + Math.round(((25 * Math.PI) / 180 - TREAD0) / SPACING) * SPACING; // 腳落在離頂約 25° 的那一片踏板上
const FOOT = R + LEG_W / 2; // 腳(小腿端頭的圓)貼著踏板外緣時,端點離軸的距離

/** 進程 p → 腳 k(phase 0 或 1)在 yz 平面的位置與是否踩著 */
export function foot(p, phase) {
  const u = treadmill(p).drum / SPACING + phase;
  const m = ((u % 2) + 2) % 2;
  if (m < 1) {
    const a = LAND + m * SPACING; // 踩著:跟著踏板往下走
    return { at: [FOOT * Math.cos(a), FOOT * Math.sin(a)], stance: true };
  }
  const s = m - 1;
  const a = LAND + SPACING - s * SPACING; // 邁步:抬起往上
  const r = FOOT + LIFT * Math.sin(Math.PI * s);
  return { at: [r * Math.cos(a), r * Math.sin(a)], stance: false };
}

const LEGS = { A: { side: 1, phase: 0 }, B: { side: -1, phase: 1 } };
const HIP = [PERSON[1], PERSON[2]];
const LEG_LEN = 0.53 * Math.max(...[LAND, LAND + SPACING].map((a) => Math.hypot(FOOT * Math.cos(a) - HIP[0], FOOT * Math.sin(a) - HIP[1])));

function legPose(p, k) {
  const { side, phase } = LEGS[k];
  const f = foot(p, phase).at;
  // 在 yz 平面解膝的位置(兩節一樣長),膝往前(−z,圓筒那一側)凸
  const knee = [1, -1].map((s) => circleCircle([HIP[0], HIP[1], 0], LEG_LEN, [f[0], f[1], 0], LEG_LEN, s).point).reduce((a, b) => (b[1] < a[1] ? b : a));
  const [xt, xs] = [PERSON[0] + side * 0.24, PERSON[0] + side * 0.36]; // 大腿貼著身體側面,小腿在大腿外側
  return {
    thigh: { from: [xt, ...HIP], to: [xt, knee[0], knee[1]] },
    shin: { from: [xs, knee[0], knee[1]], to: [xs, ...f] },
  };
}

// 兩手從肩往前下伸到橫桿頂上
const arm = (side) => ({ from: [PERSON[0] + side * 0.22, PERSON[1] + 0.75, PERSON[2]], to: [PERSON[0] + side * 0.22, RAIL.y + 0.05 + ARM_W / 2, RAIL.z] });
const trestle = shape([[-1.0, BASE_TOP], [1.0, BASE_TOP], [0.3, 0.2], [-0.3, 0.2]]);
const post = (x) => ({ kind: "box", size: [0.12, RAIL.y + 0.05 - BASE_TOP, 0.12], at: [x, (RAIL.y + 0.05 + BASE_TOP) / 2, RAIL.z], role: "railPost" });

export default {
  figure: 377,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: trestle, thickness: 0.3, at: [-3.35, 0, 0], axis: X },
        { kind: "plate", shape: trestle, thickness: 0.3, at: [2.45, 0, 0], axis: X },
        { kind: "box", size: [6.4, 0.15, 1.6], at: [0, BASE_TOP - 0.075, 0], role: "base" },
        // 人前面的扶手:橫桿與兩端的立柱(推斷)
        post(-2.45),
        post(2.75),
        { kind: "box", size: [RAIL.x[1] - RAIL.x[0], 0.1, 0.1], at: [(RAIL.x[0] + RAIL.x[1]) / 2, RAIL.y, RAIL.z], role: "rail" },
      ],
    },
    {
      id: "drum",
      kind: "group",
      axis: X,
      spin: R + 0.2, // 箭頭在踏板外面、圓筒右端
      spinOffset: LEN / 2 + 0.05,
      pieces: [
        ...treads,
        { kind: "cylinder", radius: CORE, length: LEN - 0.2, role: "core" },
        { kind: "cylinder", radius: AXLE, length: LEN + 2.2, at: [0, 0, -0.6], role: "axle" },
        // 軸端的大齒輪
        { kind: "plate", shape: shape(circle(1.55), [circle(AXLE).reverse()]), thickness: 0.25, at: [0, 0, GEAR_X], role: "gear" },
        ...gearTeeth,
      ],
    },
    // 人:身體、頭,兩手扶著橫桿,兩條腿另外擺動
    {
      id: "person",
      kind: "group",
      center: PERSON,
      arrow: false,
      pieces: [
        { kind: "box", size: [0.36, 0.85, 0.3], at: [0, 0.425, 0], role: "torso" },
        { kind: "sphere", radius: 0.18, at: [0, 0.85 + 0.18, 0] },
      ],
    },
    { id: "armA", kind: "link", axis: X, width: ARM_W, thickness: 0.08, pins: false },
    { id: "armB", kind: "link", axis: X, width: ARM_W, thickness: 0.08, pins: false },
    ...Object.keys(LEGS).flatMap((k) => [
      { id: `thigh${k}`, kind: "link", axis: X, width: LEG_W, thickness: 0.12 },
      { id: `shin${k}`, kind: "link", axis: X, width: LEG_W, thickness: 0.12 },
    ]),
  ],
  powered: ["drum"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.06 },
  target: "drum", // 被人踩著轉的圓筒
  view: { direction: [0.55, 0.35, 1] },
  pose(p) {
    const parts = { drum: { angle: treadmill(p).drum }, armA: arm(1), armB: arm(-1) };
    for (const k of Object.keys(LEGS)) {
      const l = legPose(p, k);
      parts[`thigh${k}`] = l.thigh;
      parts[`shin${k}`] = l.shin;
    }
    return { parts, readouts: [] };
  },
};
