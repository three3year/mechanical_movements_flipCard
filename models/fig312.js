// 第 312 種:布洛克桑(Bloxam)的重力擒縱。兩個擒縱叉瓦臂從上方 C 處垂下,由中間的小輪交替地抬起;
// 止動則由較大的輪上的齒靠在擋止 A、B 上完成。E、F 是夾住擺的叉爪銷:擺往一邊擺時推開一個叉瓦臂、放開擋止,
// 擒縱輪轉過半個齒距,小輪隨即把另一個叉瓦臂抬起、它的擋止擋住下一齒;叉瓦臂落下時以重量給擺衝量。
// 主動件是擺;目標件是擒縱輪(大輪,擒縱讓它半齒半齒地放行)。
//
// 由接觸算(與第 310 種相同的作法,models/escapement.js 的 periodic、gravityArm、clearance、approach):兩臂與擺同在 C 處擺動,
// 臂靠重量往內倒、靠在擋銷上;擺往右擺時推開右臂的叉爪銷 F,擺返回時右臂壓在擺上、貼著擺一起落回,直到靠上擋銷或小輪的銷
// 才和擺分開(由重量推擺,這就是衝量);左臂與 E 相同。輪受重錘的固定力矩順時針轉(原圖箭頭)。小輪的銷碰到臂上的叉瓦就把臂往外抬
// (右臂的叉瓦在小輪右上、左臂的在左下),抬起的臂的擋止擋住大輪的齒(右臂的 B 在右邊、齒往下壓在它上面;
// 左臂的 A 在左邊、齒往上頂在它下面)。擋止的面是以 C 為圓心的弧,齒壓在上面推不開臂。
// 動力重演:兩支臂與擒縱輪都是自由零件(擋銷另成一個零件,臂和機架之間不算碰撞),通過。
// 推斷:擺幅、輪的齒數與小輪的銷數(都是十)、各部尺寸;輪軸與 C 的軸裝在後面的機架上(原圖沒畫)。
// 叉爪銷 E、F 照原圖在輪轂兩旁:E 在左臂從擋止 A 繞到輪轂下方的彎帶上,F 在右臂從擋止 B 往內伸到小輪的分支上。
// 偏離插圖:原圖的擺以虛線畫在輪的後面;模型的輪軸往後伸進機架,擺從輪後經過會撞到輪軸,叉爪銷伸到輪後也會掃到輪輻,
// 所以擺放在最前面,在輪轂的高度做成一個框(推斷),小輪與兩個叉瓦從框裡露出來、整個擺程都不被擺蓋住,E、F 夾著框的左右兩邊。
// 推斷的擺錘:擺桿下端、輪的下方。
// 推斷的驅動(原文只說擋止擋住輪,沒說輪為什麼轉;共用 weight-drive.js):輪軸上、輪的背面有一個鼓,繩從鼓頂往右拉到
// 機架托臂上的滑輪(在右臂外側),再垂下吊著重錘;重錘的重量就是讓輪順時針轉的固定力矩,輪被擋止擋住時重錘也停。
// 擺四個來回(輪轉四齒)重錘捲回最高處一次(上鍊)。實物也可能用發條;重錘只是示意。
import { TAU, deg, swing, Y, Z as ZAXIS } from "./kit.js";
import { placePoly, periodic, anyOverlap, clearance, approach, gravityArm } from "./escapement.js";
import { weightDrive, rewound } from "./weight-drive.js";
import { shape, thickLine, circle, rect, roundEnd } from "./shapes.js";
import { circlePolygon } from "./contact.js";

export const N = 10;
export const PITCH = TAU / N;
export const SWING = deg(3.6);
const C = [0, 3.0];
const W = [0, -0.75];
const TOOTH = { r0: 1.38, r1: 1.58, half: 0.05 };
const PIN = { r: 0.3, size: 0.035 }; // 小輪上的抬升銷
const ROD = 0.1;
const GAP = 0.03;
const Z = { wheel: 0, small: 0.2, arm: 0.42, rod: 0.55 };

// 大輪的齒(局部座標):齒 i 在 i·齒距
const teeth = Array.from({ length: N }, (_, i) => {
  const a = i * PITCH;
  return [[TOOTH.r0, -TOOTH.half], [TOOTH.r1, -TOOTH.half], [TOOTH.r1, TOOTH.half], [TOOTH.r0, TOOTH.half]].map(([x, y]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]);
});
// 小輪的銷:和齒錯開半個齒距
const pins = Array.from({ length: N }, (_, i) => circlePolygon([PIN.r * Math.cos((i + 0.5) * PITCH), PIN.r * Math.sin((i + 0.5) * PITCH)], PIN.size, 10));

// 擋止(相對 C):以 C 為圓心的弧面。B 在右、齒從上壓下來,面朝上;A 在左、齒從下頂上來,面朝下(點對稱,兩者相隔 4.5 齒)
const LOCK = deg(9); // B 擋住的齒在大輪的方位
const lockPoint = (a) => [W[0] + ((TOOTH.r0 + TOOTH.r1) / 2) * Math.cos(a), W[1] + ((TOOTH.r0 + TOOTH.r1) / 2) * Math.sin(a)];
const arcBlock = (y0, x0, x1, thick, up) => {
  const r = Math.hypot(x0 - C[0], y0 - C[1]);
  const pts = Array.from({ length: 9 }, (_, i) => {
    const x = x0 + ((x1 - x0) * i) / 8;
    return [x - C[0], -Math.sqrt(r * r - (x - C[0]) ** 2)];
  });
  return [...pts, ...pts.slice().reverse().map(([x, y]) => [x, y + (up ? thick : -thick)])];
};
const LB = lockPoint(LOCK);
const STOP_B = arcBlock(LB[1] - TOOTH.half - 0.005, 1.48, 1.85, 0.1, false); // 齒的下緣靠在 B 的上面
const LA = lockPoint(Math.PI - LOCK); // 和 B 相隔 4.5 齒
const STOP_A = arcBlock(LA[1] + TOOTH.half + 0.005, -1.48, -1.85, 0.1, true); // 齒的上緣頂在 A 的下面
// 叉瓦(相對 C):右臂的在小輪右上(銷往右推它)、左臂的在左下(銷往左推它)
const FACE_R = rect(0.06, 0.06, W[0] + 0.25 - C[0], W[1] + 0.25 - C[1]); // 銷只把它往外推約 0.05(臂抬起約 0.8°)
const FACE_L = rect(0.06, 0.06, W[0] - 0.25 - C[0], W[1] - 0.25 - C[1]);
// 擺在輪轂的高度做成框(相對 C):框裡寬 2·LOOP,上下從 LOOP_Y[1] 到 LOOP_Y[0];叉爪銷夾著框的左右兩邊
const LOOP = 0.6;
const LOOP_Y = [W[1] - 0.6 - C[1], W[1] + 0.45 - C[1]];
const SIDE = LOOP + ROD / 2; // 框的左右兩邊的中線
// 叉爪銷 F(右臂,輪轂右邊、和叉瓦同高)、E(左臂,輪轂左下方的彎帶上):在框的兩邊外側
const BEAT_R = [SIDE + ROD / 2 + GAP + 0.05, W[1] + 0.25 - C[1]];
const BEAT_L = [-SIDE - ROD / 2 - GAP - 0.05, W[1] - 0.3 - C[1]];

/** 擺累計擺動 v → 擺角 */
export const pendulumAngle = (v) => swing(v, -SWING, SWING);
const sideBar = (sgn) => rect(ROD, LOOP_Y[1] - LOOP_Y[0] + 2 * ROD, sgn * SIDE, (LOOP_Y[0] + LOOP_Y[1]) / 2);
const rodAt = (p) => [placePoly(sideBar(1), C, p), placePoly(sideBar(-1), C, p)]; // 碰叉爪銷的是框的左右兩邊
const armR = (a) => ({ face: [placePoly(FACE_R, C, a)], stop: [placePoly(STOP_B, C, a)], beat: [placePoly(circlePolygon(BEAT_R, 0.05, 10), C, a)] });
const armL = (b) => ({ face: [placePoly(FACE_L, C, b)], stop: [placePoly(STOP_A, C, b)], beat: [placePoly(circlePolygon(BEAT_L, 0.05, 10), C, b)] });
const teethAt = (w) => teeth.map((t) => placePoly(t, W, w));
const pinsAt = (w) => pins.map((p) => placePoly(p, W, w));

const RATE = 30; // 臂沒靠在擺上時落回的角加速度(重力)
function step(s, v, dv) {
  const rod = rodAt(pendulumAngle(v));
  const prev = rodAt(pendulumAngle(v - dv));
  let { a, aw, b, bw, w, ww } = s;
  // 擺推叉爪銷(右臂往外是逆時針、a 增加;左臂往外是順時針、b 減少);擺返回時臂貼著擺落回,碰到擋銷(0)或小輪的銷才停
  const p = pinsAt(w);
  ({ q: a, w: aw } = gravityArm({ beat: (x, r) => anyOverlap(r, armR(x).beat), rest: (x) => anyOverlap(armR(x).face, p) }, { q: a, w: aw }, { rod, prev, sign: -1, acc: RATE, dt: dv, limit: 0, max: 0.3 }));
  ({ q: b, w: bw } = gravityArm({ beat: (x, r) => anyOverlap(r, armL(x).beat), rest: (x) => anyOverlap(armL(x).face, p) }, { q: b, w: bw }, { rod, prev, sign: 1, acc: RATE, dt: dv, limit: 0, max: 0.3 }));
  const blockedBy = (na, nb, x) => anyOverlap([...armR(na).stop, ...armL(nb).stop], teethAt(x));
  const lift = (x) => {
    const pp = pinsAt(x);
    let na = a;
    let nb = b;
    if (anyOverlap(armR(na).face, pp)) na = a + clearance((y) => anyOverlap(armR(y).face, pp), a, 1, 0.3);
    if (anyOverlap(armL(nb).face, pp)) nb = b - clearance((y) => anyOverlap(armL(y).face, pp), b, -1, 0.3);
    if (!Number.isFinite(na) || !Number.isFinite(nb)) return null;
    if (blockedBy(na, nb, x)) return null;
    if (anyOverlap(rod, armR(na).beat) || anyOverlap(rod, armL(nb).beat)) return null;
    return { na, nb };
  };
  if (blockedBy(a, b, w)) [w, ww] = [w + clearance((x) => blockedBy(a, b, x), w, 1, PITCH), 0];
  const dist = (ww + ((2 * PITCH) / (0.06 * 4 * SWING) ** 2) * dv) * dv;
  const reached = approach((x) => lift(x) == null, w, -1, dist, 16);
  const r = lift(reached) ?? { na: a, nb: b };
  [a, b] = [r.na, r.nb];
  ww = (w - reached) / dv;
  w = reached;
  return { a, aw, b, bw, w, ww };
}

const W0 = (() => {
  for (let i = 0; i < 96; i++) {
    const x = (-PITCH * i) / 96;
    if (!anyOverlap([...armR(0).stop, ...armL(0).stop], teethAt(x)) && !anyOverlap([...armR(0).face, ...armL(0).face], pinsAt(x))) return x;
  }
  throw new Error("找不到起始位置");
})();
const run = periodic({ period: 4 * SWING, init: { a: 0, aw: 0, b: 0, bw: 0, w: W0, ww: 0 }, step, samples: 720, snap: { w: PITCH }, forward: { w: -1 } });

/** 擺累計擺動 v → 擺角、左右叉瓦臂抬起的角度(正值)、輪轉角(順時針為負) */
export function bloxam(v) {
  const s = run.at(v);
  return { pendulum: pendulumAngle(v), right: s.a, left: -s.b, wheel: s.w };
}
export const escapement = {
  period: 4 * SWING,
  step: run.advance.w,
  angle: (v) => run.at(v).w,
  at: (v) => {
    const s = run.at(v);
    const t = teethAt(s.w);
    const p = pinsAt(s.w);
    return {
      teeth: [...t, ...p],
      layers: [...t.map(() => "wheel"), ...p.map(() => "small")],
      stops: [...armR(s.a).stop, ...armL(s.b).stop, ...armR(s.a).face, ...armL(s.b).face],
      stopLayers: ["wheel", "wheel", "small", "small"],
      rod: rodAt(pendulumAngle(v)),
      beats: [...armR(s.a).beat, ...armL(s.b).beat],
    };
  },
};

// 臂(相對 C):右臂往右下到擋止 B,再有一條分支往內伸到小輪右上的叉瓦(F 在分支上);左臂往左下到擋止 A,
// 再以一條彎帶繞到輪轂的左下方、接到叉瓦(E 在彎帶上)。分支與彎帶在大輪與小輪的前面,以方柱往後接到小輪那一層的叉瓦
const armPieces = (sgn, stop, face, beat, zArm) => {
  const outer = stop.reduce((m, q) => (sgn * q[0] > sgn * m[0] ? q : m));
  const edge = stop.filter((q) => Math.abs(q[0] - outer[0]) < 1e-9); // 擋止外端的兩個角
  const stopEnd = [outer[0] - sgn * 0.03, edge.reduce((t, q) => t + q[1], 0) / edge.length];
  const faceC = [face.reduce((t, q) => t + q[0], 0) / 4, face.reduce((t, q) => t + q[1], 0) / 4];
  const bottom = [outer[0] + sgn * 0.05, outer[1] - 0.2]; // 臂的下端
  const inner = [faceC[0] + sgn * 0.05, faceC[1]]; // 分支 / 彎帶的內端(在小輪的銷圈外)
  const branch =
    sgn > 0
      ? [[outer[0] + sgn * 0.05, faceC[1]], inner] // 右臂:從臂往內的直條
      : [bottom, [bottom[0] + 0.15, W[1] - 0.35 - C[1]], [-1.3, W[1] - 0.35 - C[1]], [beat[0], beat[1]], inner]; // 左臂:繞到輪轂下方的彎帶
  return [
    // 臂的上段:C 那端畫成圓頭(半徑等於臂的半寬),C 的軸(半徑 0.05)穿過的孔縮到 0.055,落在臂裡
    { kind: "plate", shape: shape(roundEnd(thickLine([[0, 0], [outer[0] + sgn * 0.05, outer[1] + 0.3], bottom], 0.12), [0, 0], 0.06), [circle(0.055).reverse()]), thickness: 0.08, at: [0, 0, zArm] },
    { kind: "plate", shape: shape(stop), thickness: 0.1, at: [0, 0, Z.wheel] }, // 擋止(在大輪那一層)
    { kind: "box", size: [0.14, 0.14, zArm - Z.wheel], at: [stopEnd[0], stopEnd[1], (zArm + Z.wheel) / 2] }, // 擋止的外端往前接到臂
    { kind: "plate", shape: shape(thickLine(branch, sgn > 0 ? 0.06 : 0.1)), thickness: 0.06, at: [0, 0, zArm - 0.06] }, // 分支 / 彎帶(在大輪與小輪前面)
    { kind: "box", size: [0.06, 0.06, zArm - Z.small], at: [inner[0], inner[1], (zArm + Z.small) / 2 - 0.03] },
    { kind: "plate", shape: shape(face), thickness: 0.12, at: [0, 0, Z.small] }, // 叉瓦(在小輪那一層)
    { kind: "cylinder", radius: 0.05, length: Z.rod + 0.09 - (zArm - 0.09), at: [beat[0], beat[1], (Z.rod + zArm) / 2] }, // 叉爪銷,從分支 / 彎帶伸到擺的框那一層
  ];
};

// 擺(相對 C,在最前面):懸點的轂套在 C 的軸上;擺桿往下到輪轂上方,在輪轂的高度做成框(小輪與叉瓦從框裡露出來),
// 框下再接擺桿到擺錘(推斷,在輪的下方)
const BOB = { y: W[1] - 2.2 - C[1], r: 0.35 };
const LOOP_W = 2 * (SIDE + ROD / 2);
const pendulumPieces = [
  // 懸點的轂:從右臂的上段(Z.arm ± 0.04)前面開始,不和套在同一根軸上的臂重疊
  { kind: "cylinder", radius: 0.07, length: Z.rod + 0.15 - (Z.arm + 0.05), at: [0, 0, (Z.rod + 0.15 + Z.arm + 0.05) / 2] },
  { kind: "box", size: [ROD, -LOOP_Y[1] - ROD, 0.06], at: [0, (LOOP_Y[1] + ROD) / 2, Z.rod] }, // 框上的擺桿
  { kind: "box", size: [LOOP_W, ROD, 0.06], at: [0, LOOP_Y[1] + ROD / 2, Z.rod] }, // 框的上邊
  { kind: "box", size: [ROD, LOOP_Y[1] - LOOP_Y[0] + 2 * ROD, 0.06], at: [SIDE, (LOOP_Y[0] + LOOP_Y[1]) / 2, Z.rod] }, // 框的右邊(F 靠在外側)
  { kind: "box", size: [ROD, LOOP_Y[1] - LOOP_Y[0] + 2 * ROD, 0.06], at: [-SIDE, (LOOP_Y[0] + LOOP_Y[1]) / 2, Z.rod] }, // 框的左邊(E 靠在外側)
  { kind: "box", size: [LOOP_W, ROD, 0.06], at: [0, LOOP_Y[0] - ROD / 2, Z.rod] }, // 框的下邊
  { kind: "box", size: [ROD, LOOP_Y[0] - ROD - BOB.y, 0.06], at: [0, (LOOP_Y[0] - ROD + BOB.y) / 2, Z.rod] }, // 框下的擺桿
  { kind: "cylinder", radius: BOB.r, length: 0.12, at: [0, BOB.y, Z.rod] }, // 擺錘(推斷)
];

// 推斷的重錘驅動:鼓在輪的背面、套在輪軸上,繩從鼓頂往右拉到滑輪頂上(滑輪在右臂外側,裝在機架伸出的托臂上),再垂下吊重錘
const FRAME_Z = -0.65;
const ROPE_R = 0.04;
const DRUM_R = 0.18;
const DRUM = { center: [...W, -0.3], axis: ZAXIS, radius: DRUM_R + ROPE_R, sense: -1 }; // 輪往前(順時針)轉時繩從鼓上放出
const PULLEY_R = 0.13;
const PULLEY = { center: [2.25, W[1] + DRUM.radius - PULLEY_R - ROPE_R, DRUM.center[2]], axis: ZAXIS, radius: PULLEY_R + ROPE_R, sense: 1 };
const REWIND = 4 * 4 * SWING; // 擺四個來回(輪轉四齒)上鍊一次
const WEIGHT = { radius: 0.16, height: 0.42 };
const hang = weightDrive({
  drum: DRUM,
  pulleys: [PULLEY],
  eye: [PULLEY.center[0] + PULLEY.radius, W[1] - 0.4, PULLEY.center[2]],
  reserve: DRUM.radius * 4 * PITCH,
  spare: TAU * DRUM.radius,
  pitch: 2 * ROPE_R,
});
const weightAt = rewound(hang, (v) => -run.at(v).w, REWIND); // 輪往前(順時針)轉的角度
export const geometry = { DRUM, REWIND };

// 兩臂的擋銷:靠在各臂上段的內側,立在 C 下方貼著機架的橫條上(推斷)
const armStop = (sgn) => {
  const outer = (sgn > 0 ? STOP_B : STOP_A).reduce((m, q) => (sgn * q[0] > sgn * m[0] ? q : m));
  const u = [outer[0] + sgn * 0.05, outer[1] + 0.3];
  const len = Math.hypot(...u);
  const n = sgn > 0 ? [u[1] / len, -u[0] / len] : [-u[1] / len, u[0] / len];
  return [C[0] + (0.57 * u[0]) / len + 0.1 * n[0], C[1] + (0.57 * u[1]) / len + 0.1 * n[1]];
};
const STOP_PINS = [armStop(1), armStop(-1)];

export default {
  figure: 312,
  parts: [
    {
      id: "wheel",
      kind: "group",
      center: [...W, 0],
      spin: TOOTH.r1,
      pieces: [
        { kind: "plate", shape: shape(circle(1.4), [circle(1.28).reverse()]), thickness: 0.08 },
        ...Array.from({ length: N }, (_, i) => ({ kind: "box", size: [1.3, 0.05, 0.05], at: [0.65 * Math.cos((i * TAU) / N), 0.65 * Math.sin((i * TAU) / N), 0], angle: (i * TAU) / N })),
        ...teeth.map((t, i) => ({ kind: "plate", shape: shape(t), thickness: 0.08, accent: i === 0 })),
        { kind: "plate", shape: shape(circle(PIN.r + 0.04)), thickness: 0.12, at: [0, 0, Z.small - 0.12] }, // 小輪:貼在大輪的輪輻前面
        ...pins.map((p) => ({ kind: "plate", shape: shape(p), thickness: 0.12, at: [0, 0, Z.small] })), // 小輪的銷,立在小輪上
        { kind: "cylinder", radius: 0.05, length: 0.6 + Z.small - 0.06, at: [0, 0, (Z.small - 0.06 - 0.6) / 2] }, // 輪軸:從小輪穿過大輪,往後伸進機架
        { kind: "cylinder", radius: DRUM_R, length: 0.2, at: [0, 0, DRUM.center[2]] }, // 繞繩的鼓(推斷),在輪的背面
      ],
    },
    { id: "armL", kind: "group", center: [...C, 0], arrow: false, pieces: armPieces(-1, STOP_A, FACE_L, BEAT_L, Z.arm - 0.12) },
    { id: "armR", kind: "group", center: [...C, 0], arrow: false, pieces: armPieces(1, STOP_B, FACE_R, BEAT_R, Z.arm) },
    { id: "pendulum", kind: "group", center: [...C, 0], arrow: false, pieces: pendulumPieces },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(rect(0.3, 4.0, 0, (W[1] + C[1]) / 2)), thickness: 0.1, at: [0, 0, FRAME_Z] },
        { kind: "cylinder", radius: 0.05, length: 1.2, at: [C[0], C[1], -0.1] }, // C 的軸
        // 機架往右伸出的托臂與滑輪的軸(推斷)
        { kind: "box", size: [PULLEY.center[0] + 0.04, 0.1, 0.1], at: [(PULLEY.center[0] + 0.04) / 2, PULLEY.center[1], FRAME_Z] },
        { kind: "cylinder", radius: 0.035, length: PULLEY.center[2] + 0.1 - FRAME_Z, at: [PULLEY.center[0], PULLEY.center[1], (PULLEY.center[2] + 0.1 + FRAME_Z) / 2] },
      ],
    },
    {
      id: "armStops",
      kind: "group",
      pieces: [
        // 擋銷的座(推斷):貼在機架前面的橫條
        { kind: "box", size: [2 * Math.max(...STOP_PINS.map((q) => Math.abs(q[0]))) + 0.2, 0.2, 0.1], at: [0, STOP_PINS[0][1], FRAME_Z + 0.1] },
        // 兩臂的擋銷:靠在各臂上段的內側,從橫條伸到各臂那一層
        ...STOP_PINS.map((at, i) => {
          const front = (i === 0 ? Z.arm : Z.arm - 0.12) + 0.04;
          return { kind: "cylinder", radius: 0.04, length: front - FRAME_Z - 0.15, at: [...at, (front + FRAME_Z + 0.15) / 2] };
        }),
      ],
    },
    { id: "labelC", kind: "group", center: [...C, 0], label: "C", labelOffset: [0.25, 0.25, 0.6] },
    { id: "labelA", kind: "group", center: [-1.65, LA[1] + 0.2, 0.3], label: "A", labelOffset: [-0.3, 0, 0.3] },
    { id: "labelB", kind: "group", center: [1.65, LB[1] - 0.2, 0.3], label: "B", labelOffset: [0.3, 0, 0.3] },
    { id: "labelE", kind: "group", center: [C[0] + BEAT_L[0], C[1] + BEAT_L[1], 0.6], label: "E", labelOffset: [-0.15, -0.25, 0] },
    { id: "labelF", kind: "group", center: [C[0] + BEAT_R[0], C[1] + BEAT_R[1], 0.6], label: "F", labelOffset: [0.1, 0.25, 0] },
    { id: "pulley", kind: "pulley", style: "disc", center: PULLEY.center, axis: ZAXIS, radius: PULLEY_R, width: 0.1, arrow: false },
    { id: "rope", kind: "rope", radius: ROPE_R },
    { id: "weight", kind: "weight", axis: Y, radius: WEIGHT.radius, height: WEIGHT.height },
  ],
  // 動力重演:只推擺;輪受固定的力矩(重錘)順時針轉(以彈簧代替;重錘、滑輪照模型的姿勢走),兩支臂鉸在 C、靠自重靠在擋銷上,四個擺程都比。
  replay: {
    to: 8 * SWING,
    free: { wheel: { pivot: [...W, 0], spring: -1, gravity: false }, armR: { pivot: [...C, 0] }, armL: { pivot: [...C, 0] } },
    ignore: [["wheel", "frame"], ["armR", "frame"], ["armL", "frame"]],
    expect: [
      { at: 2 * SWING, part: "wheel", label: "擺往右擺:推開右臂、放開擋止 B,輪轉半個齒距、被擋止 A 擋住", quote: "止動則由擋止 A 和 B 對較大的輪的作用來完成" },
      { at: 2 * SWING, part: "armR", label: "擺往右擺:右臂被擺推開" },
      { at: 4 * SWING, part: "wheel", label: "擺往左擺:推開左臂、放開擋止 A,輪再轉半個齒距" },
      { at: 4 * SWING, part: "armL", label: "擺往左擺:左臂被擺推開" },
      { part: "wheel", label: "擺兩個來回,輪轉過兩個齒距" },
    ],
  },
  driver: { part: "pendulum", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheel", // 擒縱輪:擒縱讓它半齒半齒地放行
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const s = run.at(v);
    const hung = weightAt(v);
    const eye = hung.eye;
    return {
      parts: {
        pendulum: { angle: pendulumAngle(v) },
        armR: { angle: s.a },
        armL: { angle: s.b },
        wheel: { angle: s.w },
        pulley: { angle: hung.pulleys[0] },
        weight: { position: [eye[0], eye[1] - WEIGHT.height / 2 - WEIGHT.radius * 0.38, eye[2]] },
      },
      paths: { rope: { points: hung.rope, closed: false, phase: 0 } },
      readouts: [],
    };
  },
};
