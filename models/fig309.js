// 第 309 種:馬奇(Mudge)的重力擒縱。擒縱叉瓦 A、B 不在同一根軸上,而是各自裝在上方 C 處的兩根軸上,
// 各有一根長臂往下到叉爪銷 P、Q,臂上方帶著配重球。擺在兩根叉爪銷之間擺動,每次擺動把其中一個加重的叉瓦
// 從輪中抬起(輪隨即轉過半個齒、被另一個叉瓦擋住);擺返回時,叉瓦隨之落下,由叉瓦的重量給擺衝量。
// 主動件是擺(擺桿在 P、Q 之間);目標件是擒縱輪(擒縱讓它一齒一齒地放行)。
//
// 由接觸算(models/escapement.js 的 periodic、gravityArm、fall):兩支叉瓦臂鉸在 C,靠配重的重量往內倒、靠在兩臂之間的擋銷上,
// 叉瓦伸在齒的去路上;擺往右擺過空隙就推著右臂的叉爪銷 P 往外,把叉瓦 A 抬出輪外;擺回來時右臂壓在擺上、貼著擺一起落回,
// 直到靠上擋銷才和擺分開(由叉瓦的重量推擺,這就是衝量)。
// 擒縱輪受重錘的固定力矩順時針轉,被叉瓦的鎖面擋住就停(鎖面是以各自的軸為圓心的弧,抬起時沿齒尖滑開,輪不回退),
// 放開後加速轉半個齒,碰上另一個叉瓦。叉瓦的位置依作圖法:各臂的軸在它的叉瓦處齒尖圓的切線上(兩叉瓦相隔 8.5 齒),
// 齒壓在鎖面上的力通過臂的軸,推不開臂。
// 推斷:擺幅、擺與叉爪銷之間的空隙、齒數(依原圖約三十齒)、擋銷;輪軸、C 的兩根軸裝在後面的夾板上(原圖沒畫)。
// 推斷的擺(原圖沒畫擺,只畫了兩臂下端的 P、Q):擺掛在夾板頂端背面的懸掛座上,擺桿在夾板後面往下(不蓋住輪),
// 下端是擺錘;在 P、Q 的高度從擺桿往前伸出一根撥叉,伸到叉爪銷那一層、夾在 P、Q 之間(時鐘的擺叉)。
// 推斷的驅動(原文只說叉瓦擋住輪,沒說輪為什麼轉;共用 weight-drive.js):輪軸上、輪的背面有一個鼓,繩從鼓頂往右拉到
// 夾板托臂上的滑輪,再垂下吊著重錘;重錘的重量就是讓輪順時針轉的固定力矩,輪被叉瓦擋住時重錘也停。
// 擺八個來回(輪轉八齒)重錘捲回最高處一次(上鍊,畫面上一下子回到上面)。實物也可能用發條;重錘只是示意。
import { TAU, deg, swing, Y, Z } from "./kit.js";
import { anchorPallet, toothedWheel, placePoly, periodic, fall, anyOverlap, gravityArm } from "./escapement.js";
import { shape, thickLine, circle, rect, roundEnd } from "./shapes.js";
import { plateBar } from "./supports.js";
import { edgeDistance } from "./contact.js";
import { weightDrive, rewound } from "./weight-drive.js";

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
const FINGER = 0.4; // 撥叉夾在 P、Q 之間那一段的高
const rodAt = (p) => [placePoly(rect(ROD, FINGER, 0, -ARM), PEND, p)]; // 撥叉:碰叉爪銷的只有這一段
const armAAt = (a) => [placePoly(palletA.poly, CR, a)];
const armBAt = (a) => [placePoly(palletB.poly, CL, a)];
const pinAAt = (a) => [placePoly([...circle(PIN)].map(([x, y]) => [x + PIN_A[0], y + PIN_A[1]]), CR, a)];
const pinBAt = (a) => [placePoly([...circle(PIN)].map(([x, y]) => [x + PIN_B[0], y + PIN_B[1]]), CL, a)];
const teethAt = (w) => WHEEL.teeth.map((t) => placePoly(t, W, w));

const RATE = 30; // 臂沒靠在擺上時落回的角加速度(重力)
function step(s, v, dv) {
  const rod = rodAt(pendulumAngle(v));
  const prev = rodAt(pendulumAngle(v - dv));
  let { a, aw, b, bw, w, ww } = s;
  // 1. 擺桿推叉爪銷(右臂往外是逆時針、a 增加;左臂往外是順時針、b 減少);擺返回時臂貼著擺桿落回,碰到擋銷(0)或齒才停
  const teeth = teethAt(w);
  ({ q: a, w: aw } = gravityArm({ beat: (x, r) => anyOverlap(r, pinAAt(x)), rest: (x) => anyOverlap(armAAt(x), teeth) }, { q: a, w: aw }, { rod, prev, sign: -1, acc: RATE, dt: dv, limit: 0, max: 0.3 }));
  ({ q: b, w: bw } = gravityArm({ beat: (x, r) => anyOverlap(r, pinBAt(x)), rest: (x) => anyOverlap(armBAt(x), teeth) }, { q: b, w: bw }, { rod, prev, sign: 1, acc: RATE, dt: dv, limit: 0, max: 0.3 }));
  // 2. 擒縱輪:被叉瓦擋住就停,放開時加速轉
  const stops = [...armAAt(a), ...armBAt(b)];
  ({ q: w, w: ww } = fall((x) => anyOverlap(stops, teethAt(x)), { q: w, w: ww }, { sign: -1, acc: (2 * PITCH) / (0.06 * 4 * SWING) ** 2, dt: dv, max: PITCH }));
  return { a, aw, b, bw, w, ww };
}

const W0 = (() => {
  const stops = [...armAAt(0), ...armBAt(0)];
  for (let i = 0; i < 96; i++) if (!anyOverlap(stops, teethAt((-PITCH * i) / 96))) return (-PITCH * i) / 96;
  throw new Error("找不到起始齒位");
})();
const run = periodic({ period: 4 * SWING, init: { a: 0, aw: 0, b: 0, bw: 0, w: W0, ww: 0 }, step, samples: 1440, snap: { w: PITCH }, forward: { w: -1 } });

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
    return { teeth: teethAt(s.w), stops: [...armAAt(s.a), ...armBAt(s.b)], rod: rodAt(pendulumAngle(v)), beats: [...pinAAt(s.a), ...pinBAt(s.b)] };
  },
};

// 叉瓦臂(相對各自的軸):往下到叉爪銷的長臂、叉瓦、上方伸出的配重桿與球
const tail = (p) => [p.L * Math.cos(p.psi - p.s * 0.12), p.L * Math.sin(p.psi - p.s * 0.12)];
const ARM_Z = 0.22; // 長臂的深度
// 長臂:軸那一端畫成圓頭(半徑 = 臂的半寬),軸孔落在臂裡;擋銷的半徑也由這份外形量(圓頭在軸上方,碰不到擋銷)
const barOf = (pin) => roundEnd(thickLine([[0, 0], [pin[0], pin[1]]], 0.12), [0, 0], 0.06);
const arm = (side, pallet, pin) => [
  { kind: "plate", shape: shape(barOf(pin), [circle(0.05).reverse()]), thickness: 0.08, at: [0, 0, ARM_Z] },
  { kind: "plate", shape: shape(thickLine([[pin[0] * 0.2, pin[1] * 0.2], tail(pallet)], 0.1)), thickness: 0.08, at: [0, 0, 0.22] },
  { kind: "plate", shape: shape(pallet.poly), thickness: 0.3, at: [0, 0, 0.1] },
  { kind: "plate", shape: shape(thickLine([[0, 0], [side * 1.0, 0.2]], 0.08)), thickness: 0.08, at: [0, 0, 0.22] },
  { kind: "sphere", radius: 0.32, at: [side * 1.25, 0.25, 0.22] },
  { kind: "cylinder", radius: PIN, length: 0.3, at: [pin[0], pin[1], 0.35] }, // 叉爪銷,伸到擺桿那一層
  { kind: "cylinder", radius: 0.05, length: 0.8, at: [0, 0, -0.2] }, // 臂的軸,往後伸進夾板
];

// 夾板條(推斷)在 z = PLATE_Z;擋銷(推斷)在兩臂之間、C 下方 0.6,兩臂落到底(角度 0)時正好貼著兩支長臂的內側,往後伸到夾板條
const PLATE_Z = -0.6;
const STOP = [0, CY - 0.6];
const STOP_R = Math.min(edgeDistance(STOP, placePoly(barOf(PIN_A), CR, 0)), edgeDistance(STOP, placePoly(barOf(PIN_B), CL, 0)));
const STOP_Z = [PLATE_Z + 0.04, ARM_Z + 0.04]; // 從夾板條的前面到長臂的前面

// 推斷的擺:在夾板條後面(PEND_Z),懸點的銷插進夾板頂端背面的懸掛座;撥叉在 P、Q 的高度往前伸到叉爪銷那一層
const PEND_Z = -0.9;
const PIN_Z = [0.2, 0.5]; // 叉爪銷的深度範圍
const BOB = { y: -(ARM + 1.2), r: 0.38 };
const pendulumPieces = [
  { kind: "cylinder", radius: 0.09, length: 0.16, at: [0, 0, PEND_Z] }, // 懸點的轂
  { kind: "cylinder", radius: 0.04, length: 0.3, at: [0, 0, PEND_Z + 0.08] }, // 懸點的銷,往前插進懸掛座
  { kind: "box", size: [ROD, -BOB.y, 0.08], at: [0, BOB.y / 2, PEND_Z] }, // 擺桿
  { kind: "box", size: [ROD, 0.12, PIN_Z[0] - PEND_Z + 0.04], at: [0, -ARM, (PIN_Z[0] + PEND_Z - 0.04) / 2] }, // 撥叉往前伸的一段(在輪的下方)
  { kind: "box", size: [ROD, FINGER, PIN_Z[1] - PIN_Z[0]], at: [0, -ARM, (PIN_Z[0] + PIN_Z[1]) / 2] }, // 撥叉夾在 P、Q 之間的一段
  { kind: "cylinder", radius: BOB.r, length: 0.14, at: [0, BOB.y, PEND_Z] }, // 擺錘
];

// 推斷的重錘驅動:鼓在輪的背面、套在輪軸上,繩從鼓頂往右拉到滑輪頂上(滑輪在輪的右外側,裝在夾板條伸出的托臂上),再垂下吊重錘
const ROPE_R = 0.04;
const DRUM_R = 0.18;
const DRUM = { center: [...W, -0.3], axis: Z, radius: DRUM_R + ROPE_R, sense: -1 }; // 輪往前(順時針)轉時繩從鼓上放出
const PULLEY_R = 0.13;
const PULLEY = { center: [1.85, W[1] + DRUM.radius - PULLEY_R - ROPE_R, DRUM.center[2]], axis: Z, radius: PULLEY_R + ROPE_R, sense: 1 };
const REWIND = 8 * 4 * SWING; // 擺八個來回(輪轉八齒)上鍊一次
const WEIGHT = { radius: 0.16, height: 0.42 };
const hang = weightDrive({
  drum: DRUM,
  pulleys: [PULLEY],
  eye: [PULLEY.center[0] + PULLEY.radius, -0.6, PULLEY.center[2]],
  reserve: DRUM.radius * 8 * PITCH,
  spare: TAU * DRUM.radius,
  pitch: 2 * ROPE_R,
});
const weightAt = rewound(hang, (v) => -run.at(v).w, REWIND); // 輪往前(順時針)轉的角度
export const geometry = { DRUM, REWIND };

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
        // 輪輻照原圖是 X 形的 4 根(兩塊貫穿直徑、相隔 90°),兩端伸進輪緣
        ...Array.from({ length: 2 }, (_, i) => ({ kind: "box", size: [2 * (ROOT - 0.06), 0.1, 0.1], angle: Math.PI / 4 + (i * Math.PI) / 2 })),
        { kind: "cylinder", radius: 0.2, length: 0.2 },
        { kind: "cylinder", radius: 0.07, length: 0.56, at: [0, 0, -0.3] }, // 輪軸,往後伸進夾板
        { kind: "cylinder", radius: DRUM_R, length: 0.2, at: [0, 0, DRUM.center[2]] }, // 繞繩的鼓(推斷),在輪的背面
        { kind: "box", size: [0.12, 0.12, 0.14], at: [1.0, 0, 0.08], accent: true },
      ],
    },
    { id: "armB", kind: "group", center: [...CL, 0], arrow: false, pieces: arm(-1, palletB, PIN_B) },
    { id: "armA", kind: "group", center: [...CR, 0], arrow: false, pieces: arm(1, palletA, PIN_A) },
    { id: "pendulum", kind: "group", center: [...PEND, 0], arrow: false, pieces: pendulumPieces },
    {
      id: "frame",
      kind: "group",
      pieces: [
        ...plateBar({ points: [W, [0, CY + 0.35]], z: PLATE_Z }),
        { kind: "box", size: [0.5, 0.14, 0.1], at: [0, CY, PLATE_Z] },
        { kind: "box", size: [0.4, 0.4, 0.17], at: [0, CY, PLATE_Z - 0.135] }, // 擺的懸掛座(推斷):夾板條頂端的背面
        // 夾板條往右伸出的托臂與滑輪的軸(推斷)
        { kind: "box", size: [PULLEY.center[0] + 0.04, 0.1, 0.1], at: [(PULLEY.center[0] + 0.04) / 2, PULLEY.center[1], PLATE_Z] },
        { kind: "cylinder", radius: 0.035, length: PULLEY.center[2] + 0.1 - PLATE_Z, at: [PULLEY.center[0], PULLEY.center[1], (PULLEY.center[2] + 0.1 + PLATE_Z) / 2] },
      ],
    },
    {
      id: "armStops",
      kind: "group",
      pieces: [
        // 兩臂之間的擋銷:臂靠重量往內倒、落到底時兩臂的長臂都靠在它上面;往後伸到夾板條
        { kind: "cylinder", radius: STOP_R, length: STOP_Z[1] - STOP_Z[0], at: [...STOP, (STOP_Z[0] + STOP_Z[1]) / 2] },
      ],
    },
    { id: "pulley", kind: "pulley", style: "disc", center: PULLEY.center, axis: Z, radius: PULLEY_R, width: 0.1, arrow: false },
    { id: "rope", kind: "rope", radius: ROPE_R },
    { id: "weight", kind: "weight", axis: Y, radius: WEIGHT.radius, height: WEIGHT.height },
    { id: "labelA", kind: "group", center: [...CR, 0], label: "A", labelOffset: [tail(palletA)[0] + 0.3, tail(palletA)[1], 0.3] },
    { id: "labelB", kind: "group", center: [...CL, 0], label: "B", labelOffset: [tail(palletB)[0] - 0.3, tail(palletB)[1], 0.3] },
    { id: "labelC", kind: "group", center: [...PEND, 0], label: "C", labelOffset: [0, 0.35, 0.3] },
    { id: "labelP", kind: "group", center: [...CR, 0], label: "P", labelOffset: [PIN_A[0] + 0.3, PIN_A[1] - 0.1, 0.3] },
    { id: "labelQ", kind: "group", center: [...CL, 0], label: "Q", labelOffset: [PIN_B[0] - 0.3, PIN_B[1] - 0.1, 0.3] },
  ],
  // 動力重演:只推擺;擒縱輪受固定的力矩(重錘)順時針轉(以彈簧代替;重錘、滑輪照模型的姿勢走),由兩個叉瓦輪流擋住、放行。
  // 兩支叉瓦臂也是自由零件,靠配重靠在擋銷上(擋銷另成一個零件,臂和機架之間不算碰撞)。
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
    const hung = weightAt(v);
    const eye = hung.eye;
    return {
      parts: {
        pendulum: { angle: pendulumAngle(v) },
        armA: { angle: s.a },
        armB: { angle: s.b },
        wheel: { angle: s.w },
        pulley: { angle: hung.pulleys[0] },
        weight: { position: [eye[0], eye[1] - WEIGHT.height / 2 - WEIGHT.radius * 0.38, eye[2]] },
      },
      paths: { rope: { points: hung.rope, closed: false, phase: 0 } },
      readouts: [],
    };
  },
};
