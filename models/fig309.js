// 第 309 種:馬奇(Mudge)的重力擒縱。擒縱叉瓦 A、B 不在同一根軸上,而是各自裝在上方 C 處的兩根軸上,
// 各有一根長臂往下到叉爪銷 P、Q,臂上方帶著配重球。擺在兩根叉爪銷之間擺動,每次擺動把其中一個加重的叉瓦
// 從輪中抬起(輪隨即轉過半個齒、被另一個叉瓦擋住);擺返回時,叉瓦隨之落下,由叉瓦的重量給擺衝量。
// 主動件是擺(擺桿在 P、Q 之間);目標件是擒縱輪(擒縱讓它一齒一齒地放行)。
//
// 由接觸算(models/escapement.js 的 periodic、fall):兩支叉瓦臂鉸在 C,靠配重的重量往內倒、靠在擋銷上,叉瓦伸在齒的去路上;
// 擺往右擺過空隙就推著右臂的叉爪銷 P 往外,把叉瓦 A 抬出輪外;擺回來時右臂跟著擺桿落回(由重量推擺)。
// 擒縱輪受重錘的固定力矩順時針轉,被叉瓦的鎖面擋住就停(鎖面是以各自的軸為圓心的弧,抬起時沿齒尖滑開,輪不回退),
// 放開後加速轉半個齒,碰上另一個叉瓦。叉瓦的位置依作圖法:各臂的軸在它的叉瓦處齒尖圓的切線上(兩叉瓦相隔 8.5 齒),
// 齒壓在鎖面上的力通過臂的軸,推不開臂。
// 推斷:擺幅、擺與叉爪銷之間的空隙、齒數(依原圖約三十齒)、擋銷;輪軸、C 的兩根軸裝在後面的夾板上(原圖沒畫)。
import { TAU, deg, swing } from "./kit.js";
import { anchorPallet, toothedWheel, placePoly, periodic, fall, anyOverlap, clearance } from "./escapement.js";
import { shape, thickLine, circle, rect } from "./shapes.js";
import { plateBar } from "./supports.js";

export const N = 30;
export const PITCH = TAU / N;
export const SWING = deg(4);
const GAP = deg(1.2); // 擺桿在兩根叉爪銷之間的空隙(單邊,以擺角計)
const W = [0, -0.2];
const R = 1.55;
const ROOT = 1.1;
const DX = 0.12; // 兩根軸離中線的距離
// 叉瓦在齒尖圓上的方位:各自的軸在那一點的切線上(齒壓在鎖面上時力通過軸,推不開臂)
const tangentAt = (cy) => {
  const d = Math.hypot(DX, cy - W[1]);
  return Math.atan2(cy - W[1], DX) - Math.acos(R / d); // 右臂;左臂對稱
};
// 軸 C 的高度:讓兩叉瓦相隔 8.5 齒(一個擋住齒時,另一個正好在齒間)
const CY = (() => {
  let lo = W[1] + R + 0.2;
  let hi = W[1] + 6 * R;
  for (let k = 0; k < 60; k++) {
    const mid = (lo + hi) / 2;
    const sep = Math.PI - 2 * tangentAt(mid);
    if (sep > 8.5 * PITCH) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
})();
const AT_A = tangentAt(CY);
const CR = [DX, CY]; // 右臂(叉瓦 A)的軸
const CL = [-DX, CY]; // 左臂(叉瓦 B)的軸
const PEND = [0, CY]; // 擺的懸點
const ARM = 4.8; // 軸到叉爪銷
const ROD = 0.1; // 擺桿寬

const WHEEL = toothedWheel({ teeth: N, profile: [[ROOT, 0.52], [R, 0.3], [R, 0.36], [ROOT, 1.0]] });
// 叉瓦:鎖面與各自的軸同心(幾乎沒有衝擊斜面:衝量由叉瓦的重量給)
const palletA = anchorPallet({ P: CR, O: W, R, at: AT_A, dir: -1, width: 0.12, lift: deg(0.3), lock: deg(1.2), back: 0.18 });
const palletB = anchorPallet({ P: CL, O: W, R, at: Math.PI - AT_A, dir: -1, width: 0.12, lift: deg(0.3), lock: deg(1.2), back: 0.18 });
// 臂上的叉爪銷(相對各自的軸):擺桿兩側
const PIN = 0.06;
const pinLocal = (side, C) => [side * (ROD / 2 + PIN + ARM * Math.tan(GAP)) + PEND[0] - C[0], -ARM];
const PIN_A = pinLocal(1, CR);
const PIN_B = pinLocal(-1, CL);

/** 擺累計擺動 v → 擺角 */
export const pendulumAngle = (v) => swing(v, -SWING, SWING);
const rodAt = (p) => [placePoly(rect(ROD, ARM + 0.6, 0, -(ARM + 0.6) / 2), PEND, p)];
const armAAt = (a) => [placePoly(palletA.poly, CR, a)];
const armBAt = (a) => [placePoly(palletB.poly, CL, a)];
const pinAAt = (a) => [placePoly([...circle(PIN)].map(([x, y]) => [x + PIN_A[0], y + PIN_A[1]]), CR, a)];
const pinBAt = (a) => [placePoly([...circle(PIN)].map(([x, y]) => [x + PIN_B[0], y + PIN_B[1]]), CL, a)];
const teethAt = (w) => WHEEL.teeth.map((t) => placePoly(t, W, w));

const RATE = 30; // 臂落回的角加速度(重力)
function step(s, v, dv) {
  const rod = rodAt(pendulumAngle(v));
  let { a, aw, b, bw, w, ww } = s;
  // 1. 擺桿推叉爪銷:右臂往外是逆時針(a 增加),左臂往外是順時針(b 減少)
  if (anyOverlap(rod, pinAAt(a))) [a, aw] = [a + clearance((x) => anyOverlap(rod, pinAAt(x)), a, 1, 0.3), 0];
  if (anyOverlap(rod, pinBAt(b))) [b, bw] = [b - clearance((x) => anyOverlap(rod, pinBAt(x)), b, -1, 0.3), 0];
  // 2. 臂靠重量往內倒,碰到擋銷(0)、擺桿或齒就停
  const teeth = teethAt(w);
  ({ q: a, w: aw } = fall((x) => anyOverlap(rod, pinAAt(x)) || anyOverlap(armAAt(x), teeth), { q: a, w: aw }, { sign: -1, acc: RATE, dt: dv, limit: 0, max: 0.3 }));
  ({ q: b, w: bw } = fall((x) => anyOverlap(rod, pinBAt(x)) || anyOverlap(armBAt(x), teeth), { q: b, w: bw }, { sign: 1, acc: RATE, dt: dv, limit: 0, max: 0.3 }));
  // 3. 擒縱輪:被叉瓦擋住就停,放開時加速轉
  const stops = [...armAAt(a), ...armBAt(b)];
  ({ q: w, w: ww } = fall((x) => anyOverlap(stops, teethAt(x)), { q: w, w: ww }, { sign: -1, acc: (2 * PITCH) / (0.06 * 4 * SWING) ** 2, dt: dv, max: PITCH }));
  return { a, aw, b, bw, w, ww };
}

const W0 = (() => {
  const stops = [...armAAt(0), ...armBAt(0)];
  for (let i = 0; i < 96; i++) if (!anyOverlap(stops, teethAt((-PITCH * i) / 96))) return (-PITCH * i) / 96;
  throw new Error("找不到起始齒位");
})();
const run = periodic({ period: 4 * SWING, init: { a: 0, aw: 0, b: 0, bw: 0, w: W0, ww: 0 }, step, samples: 1440, snap: { w: PITCH } });

/** 擺累計擺動 v → 擺角、左右兩叉瓦臂被抬起的角度(都以正值表示)、擒縱輪轉角(順時針為負) */
export function mudge(v) {
  const s = run.at(v);
  return { pendulum: pendulumAngle(v), left: -s.b, right: s.a, wheel: s.w };
}
export const escapement = {
  period: 4 * SWING,
  step: run.advance.w,
  angle: (v) => run.at(v).w,
  at: (v) => {
    const s = run.at(v);
    return { teeth: teethAt(s.w), stops: [...armAAt(s.a), ...armBAt(s.b)], rod: rodAt(pendulumAngle(v)), pins: [...pinAAt(s.a), ...pinBAt(s.b)] };
  },
};

// 叉瓦臂(相對各自的軸):往下到叉爪銷的長臂、叉瓦、上方伸出的配重桿與球
const tail = (p) => [p.L * Math.cos(p.psi - p.s * 0.12), p.L * Math.sin(p.psi - p.s * 0.12)];
const arm = (side, pallet, pin) => [
  { kind: "plate", shape: shape(thickLine([[0, 0], [pin[0], pin[1]]], 0.12), [circle(0.05).reverse()]), thickness: 0.08, at: [0, 0, 0.22] },
  { kind: "plate", shape: shape(thickLine([[pin[0] * 0.2, pin[1] * 0.2], tail(pallet)], 0.1)), thickness: 0.08, at: [0, 0, 0.22] },
  { kind: "plate", shape: shape(pallet.poly), thickness: 0.3, at: [0, 0, 0.1] },
  { kind: "plate", shape: shape(thickLine([[0, 0], [side * 1.0, 0.2]], 0.08)), thickness: 0.08, at: [0, 0, 0.22] },
  { kind: "sphere", radius: 0.32, at: [side * 1.25, 0.25, 0.22] },
  { kind: "cylinder", radius: PIN, length: 0.3, at: [pin[0], pin[1], 0.35] }, // 叉爪銷,伸到擺桿那一層
  { kind: "cylinder", radius: 0.05, length: 0.8, at: [0, 0, -0.2] }, // 臂的軸,往後伸進夾板
];

export default {
  figure: 309,
  parts: [
    {
      id: "wheel",
      kind: "group",
      center: [...W, 0],
      spin: R,
      pieces: [
        { kind: "plate", shape: shape(WHEEL.outline, [circle(ROOT - 0.12).reverse()]), thickness: 0.12 },
        ...Array.from({ length: 4 }, (_, i) => ({ kind: "box", size: [2 * (ROOT - 0.14), 0.1, 0.1], angle: (i * Math.PI) / 4 + 0.3 })),
        { kind: "cylinder", radius: 0.2, length: 0.2 },
        { kind: "cylinder", radius: 0.07, length: 0.56, at: [0, 0, -0.3] }, // 輪軸,往後伸進夾板
        { kind: "box", size: [0.12, 0.12, 0.14], at: [1.0, 0, 0.08], accent: true },
      ],
    },
    { id: "armB", kind: "group", center: [...CL, 0], arrow: false, pieces: arm(-1, palletB, PIN_B) },
    { id: "armA", kind: "group", center: [...CR, 0], arrow: false, pieces: arm(1, palletA, PIN_A) },
    { id: "pendulum", kind: "group", center: [...PEND, 0], arrow: false, pieces: [{ kind: "box", size: [ROD, ARM + 0.6, 0.08], at: [0, -(ARM + 0.6) / 2, 0.4] }, { kind: "cylinder", radius: 0.08, length: 0.3, at: [0, 0, 0.52] }] },
    {
      id: "frame",
      kind: "group",
      pieces: [
        ...plateBar({ points: [W, [0, CY + 0.35]], z: -0.6 }),
        { kind: "box", size: [0.5, 0.14, 0.1], at: [0, CY, -0.6] },
      ],
    },
    {
      id: "armStops",
      kind: "group",
      pieces: [
        // 兩臂的擋銷(臂靠重量往內倒時靠在上面;在臂的上段旁邊)
        { kind: "cylinder", radius: 0.05, length: 0.42, at: [CR[0] + 0.17, CY - 0.6, 0.0] },
        { kind: "cylinder", radius: 0.05, length: 0.42, at: [CL[0] - 0.17, CY - 0.6, 0.0] },
      ],
    },
    { id: "labelA", kind: "group", center: [...CR, 0], label: "A", labelOffset: [tail(palletA)[0] + 0.3, tail(palletA)[1], 0.3] },
    { id: "labelB", kind: "group", center: [...CL, 0], label: "B", labelOffset: [tail(palletB)[0] - 0.3, tail(palletB)[1], 0.3] },
    { id: "labelC", kind: "group", center: [...PEND, 0], label: "C", labelOffset: [0, 0.35, 0.3] },
    { id: "labelP", kind: "group", center: [...CR, 0], label: "P", labelOffset: [PIN_A[0] + 0.3, PIN_A[1] - 0.1, 0.3] },
    { id: "labelQ", kind: "group", center: [...CL, 0], label: "Q", labelOffset: [PIN_B[0] - 0.3, PIN_B[1] - 0.1, 0.3] },
  ],
  // 動力重演:只推擺;擒縱輪受固定的力矩(重錘)順時針轉,由兩個叉瓦輪流擋住、放行。兩支叉瓦臂也是自由零件,
  // 靠配重靠在擋銷上(擋銷另成一個零件,臂和機架之間不算碰撞)。
  replay: {
    to: 8 * SWING,
    free: { wheel: { pivot: [...W, 0], spring: -1, gravity: false }, armA: { pivot: [...CR, 0] }, armB: { pivot: [...CL, 0] } },
    ignore: [["wheel", "frame"], ["armA", "frame"], ["armB", "frame"]],
    expect: [
      { at: 2 * SWING, part: "wheel", label: "擺往右擺:抬起叉瓦 A,輪轉過半個齒、被 B 擋住", quote: "藉此在每次擺動時將其中一個加重的擒縱叉瓦從輪中抬起" },
      { at: 2 * SWING, part: "armA", label: "擺往右擺:擺推開叉爪銷 P,右臂連叉瓦 A 抬起" },
      { at: 4 * SWING, part: "wheel", label: "擺往左擺:抬起叉瓦 B,輪再轉半個齒" },
      { at: 4 * SWING, part: "armB", label: "擺往左擺:擺推開叉爪銷 Q,左臂連叉瓦 B 抬起" },
      { part: "wheel", label: "擺兩個來回,輪轉過兩個齒" },
    ],
  },
  driver: { part: "pendulum", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheel", // 擒縱輪:擒縱讓它一齒一齒地放行
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const s = run.at(v);
    return { parts: { pendulum: { angle: pendulumAngle(v) }, armA: { angle: s.a }, armB: { angle: s.b }, wheel: { angle: s.w } }, readouts: [] };
  },
};
