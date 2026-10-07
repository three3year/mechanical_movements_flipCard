// 第 312 種:布洛克桑(Bloxam)的重力擒縱。兩個擒縱叉瓦臂從上方 C 處垂下,由中間的小輪交替地抬起;
// 止動則由較大的輪上的齒靠在擋止 A、B 上完成。E、F 是夾住擺的叉爪銷:擺往一邊擺時推開一個叉瓦臂、放開擋止,
// 擒縱輪轉過半個齒距,小輪隨即把另一個叉瓦臂抬起、它的擋止擋住下一齒;叉瓦臂落下時以重量給擺衝量。
// 主動件是擺;目標件是擒縱輪(大輪,擒縱讓它半齒半齒地放行)。
//
// 由接觸算(與第 310 種相同的作法,models/escapement.js 的 periodic、fall、clearance、approach):兩臂與擺同在 C 處擺動,
// 臂靠重量往內倒、靠在擋銷上;輪受重錘的固定力矩順時針轉(原圖箭頭)。小輪的銷碰到臂上的叉瓦就把臂往外抬
// (右臂的叉瓦在小輪右上、左臂的在左下),抬起的臂的擋止擋住大輪的齒(右臂的 B 在右邊、齒往下壓在它上面;
// 左臂的 A 在左邊、齒往上頂在它下面)。擋止的面是以 C 為圓心的弧,齒壓在上面推不開臂。
// 動力重演:兩支臂與擒縱輪都是自由零件(擋銷另成一個零件,臂和機架之間不算碰撞),通過。
// 推斷:擺幅、輪的齒數與小輪的銷數(都是十)、各部尺寸;輪軸與 C 的軸裝在後面的機架上(原圖沒畫)。
import { TAU, deg, swing } from "./kit.js";
import { placePoly, periodic, fall, anyOverlap, clearance, approach } from "./escapement.js";
import { shape, thickLine, circle, rect } from "./shapes.js";
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
// 叉爪銷 F(右臂)、E(左臂):在擺桿兩側
const PIN_Y = 0.7 - C[1];
const BEAT_R = [ROD / 2 + GAP + 0.05, PIN_Y];
const BEAT_L = [-ROD / 2 - GAP - 0.05, PIN_Y];

/** 擺累計擺動 v → 擺角 */
export const pendulumAngle = (v) => swing(v, -SWING, SWING);
const rodAt = (p) => [placePoly(rect(ROD, 4.8, 0, -2.4), C, p)];
const armR = (a) => ({ face: [placePoly(FACE_R, C, a)], stop: [placePoly(STOP_B, C, a)], beat: [placePoly(circlePolygon(BEAT_R, 0.05, 10), C, a)] });
const armL = (b) => ({ face: [placePoly(FACE_L, C, b)], stop: [placePoly(STOP_A, C, b)], beat: [placePoly(circlePolygon(BEAT_L, 0.05, 10), C, b)] });
const teethAt = (w) => teeth.map((t) => placePoly(t, W, w));
const pinsAt = (w) => pins.map((p) => placePoly(p, W, w));

const RATE = 30;
function step(s, v, dv) {
  const rod = rodAt(pendulumAngle(v));
  let { a, aw, b, bw, w, ww } = s;
  if (anyOverlap(rod, armR(a).beat)) [a, aw] = [a + clearance((x) => anyOverlap(rod, armR(x).beat), a, 1, 0.3), 0];
  if (anyOverlap(rod, armL(b).beat)) [b, bw] = [b - clearance((x) => anyOverlap(rod, armL(x).beat), b, -1, 0.3), 0];
  const p = pinsAt(w);
  ({ q: a, w: aw } = fall((x) => anyOverlap(rod, armR(x).beat) || anyOverlap(armR(x).face, p), { q: a, w: aw }, { sign: -1, acc: RATE, dt: dv, limit: 0, max: 0.3 }));
  ({ q: b, w: bw } = fall((x) => anyOverlap(rod, armL(x).beat) || anyOverlap(armL(x).face, p), { q: b, w: bw }, { sign: 1, acc: RATE, dt: dv, limit: 0, max: 0.3 }));
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
const run = periodic({ period: 4 * SWING, init: { a: 0, aw: 0, b: 0, bw: 0, w: W0, ww: 0 }, step, samples: 720, snap: { w: PITCH } });

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
    };
  },
};

// 臂(相對 C):右臂往右下到擋止 B,再往內收;左臂往左下到擋止 A。叉瓦以一段橫條接到臂上,叉爪銷在擺桿旁
const armPieces = (sgn, stop, face, beat, zArm) => {
  const outer = stop.reduce((m, q) => (sgn * q[0] > sgn * m[0] ? q : m));
  const faceC = [face.reduce((s, q) => s + q[0], 0) / 4, face.reduce((s, q) => s + q[1], 0) / 4];
  return [
    { kind: "plate", shape: shape(thickLine([[0, 0], [outer[0] + sgn * 0.05, outer[1] + 0.3], [outer[0] + sgn * 0.05, outer[1] - 0.2]], 0.12), [circle(0.06).reverse()]), thickness: 0.08, at: [0, 0, zArm] },
    { kind: "plate", shape: shape(stop), thickness: 0.1, at: [0, 0, Z.wheel] }, // 擋止(在大輪那一層)
    { kind: "box", size: [0.1, 0.1, zArm - Z.wheel + 0.04], at: [outer[0] + sgn * 0.0, stop[0][1] + (sgn > 0 ? -0.05 : 0.05), (zArm + Z.wheel) / 2] },
    { kind: "plate", shape: shape(thickLine([[outer[0], faceC[1]], [faceC[0] + sgn * 0.05, faceC[1]]], 0.06)), thickness: 0.06, at: [0, 0, zArm - 0.06] }, // 往內伸到叉瓦的橫條(在大輪與小輪前面)
    { kind: "box", size: [0.06, 0.06, zArm - Z.small], at: [faceC[0] + sgn * 0.05, faceC[1], (zArm + Z.small) / 2 - 0.03] },
    { kind: "plate", shape: shape(face), thickness: 0.12, at: [0, 0, Z.small] }, // 叉瓦(在小輪那一層)
    { kind: "cylinder", radius: 0.05, length: 0.22, at: [beat[0], beat[1], (zArm + Z.rod) / 2] }, // 叉爪銷
  ];
};

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
        { kind: "plate", shape: shape(circle(PIN.r + 0.04)), thickness: 0.06, at: [0, 0, Z.small - 0.1] }, // 小輪
        ...pins.map((p) => ({ kind: "plate", shape: shape(p), thickness: 0.12, at: [0, 0, Z.small] })),
        { kind: "cylinder", radius: 0.05, length: 0.6, at: [0, 0, -0.3] }, // 輪軸,往後伸進機架
      ],
    },
    { id: "armL", kind: "group", center: [...C, 0], arrow: false, pieces: armPieces(-1, STOP_A, FACE_L, BEAT_L, Z.arm - 0.12) },
    { id: "armR", kind: "group", center: [...C, 0], arrow: false, pieces: armPieces(1, STOP_B, FACE_R, BEAT_R, Z.arm) },
    { id: "pendulum", kind: "group", center: [...C, 0], arrow: false, pieces: [{ kind: "box", size: [ROD, 4.8, 0.06], at: [0, -2.4, Z.rod] }, { kind: "cylinder", radius: 0.07, length: 0.3, at: [0, 0, Z.rod] }] },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(rect(0.3, 4.0, 0, (W[1] + C[1]) / 2)), thickness: 0.1, at: [0, 0, -0.65] },
        { kind: "cylinder", radius: 0.05, length: 1.2, at: [C[0], C[1], -0.1] }, // C 的軸
      ],
    },
    {
      id: "armStops",
      kind: "group",
      pieces: [
        // 兩臂的擋銷:靠在各臂上段的內側
        ...[1, -1].map((sgn) => {
          const outer = (sgn > 0 ? STOP_B : STOP_A).reduce((m, q) => (sgn * q[0] > sgn * m[0] ? q : m));
          const u = [outer[0] + sgn * 0.05, outer[1] + 0.3];
          const len = Math.hypot(...u);
          const n = sgn > 0 ? [u[1] / len, -u[0] / len] : [-u[1] / len, u[0] / len];
          const at = [C[0] + (0.57 * u[0]) / len + 0.1 * n[0], C[1] + (0.57 * u[1]) / len + 0.1 * n[1]];
          return { kind: "cylinder", radius: 0.04, length: 0.14, at: [...at, sgn > 0 ? Z.arm : Z.arm - 0.12] };
        }),
      ],
    },
    { id: "labelC", kind: "group", center: [...C, 0], label: "C", labelOffset: [0.25, 0.25, 0.6] },
    { id: "labelA", kind: "group", center: [-1.65, LA[1] + 0.2, 0.3], label: "A", labelOffset: [-0.3, 0, 0.3] },
    { id: "labelB", kind: "group", center: [1.65, LB[1] - 0.2, 0.3], label: "B", labelOffset: [0.3, 0, 0.3] },
    { id: "labelE", kind: "group", center: [-0.15, 0.7, 0.6], label: "E", labelOffset: [-0.3, 0, 0] },
    { id: "labelF", kind: "group", center: [0.15, 0.7, 0.6], label: "F", labelOffset: [0.3, 0, 0] },
  ],
  // 動力重演:只推擺;輪受固定的力矩(重錘)順時針轉,兩支臂鉸在 C、靠自重靠在擋銷上,四個擺程都比。
  replay: {
    to: 8 * SWING,
    free: { wheel: { pivot: [...W, 0], spring: -1, gravity: false }, armR: { pivot: [...C, 0] }, armL: { pivot: [...C, 0] } },
    ignore: [["wheel", "frame"], ["armR", "frame"], ["armL", "frame"]],
    expect: [
      { at: 2 * SWING, part: "wheel", label: "擺往右擺:推開右臂、放開擋止 B,輪轉半個齒距、被擋止 A 擋住", quote: "止動則由較大的輪上的擋止 A 和 B 的作用來完成" },
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
    return { parts: { pendulum: { angle: pendulumAngle(v) }, armR: { angle: s.a }, armL: { angle: s.b }, wheel: { angle: s.w } }, readouts: [] };
  },
};
