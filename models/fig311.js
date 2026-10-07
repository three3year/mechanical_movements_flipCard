// 第 311 種:雙三腳式重力擒縱。兩個三腳鎖定輪 A、B、C 與 a、b、c 裝在同一根軸上(一前一後),兩輪之間是一組抬升銷,
// 間距寬到能讓擒縱叉瓦位於兩輪之間;第一個鎖定輪的齒由一個叉瓦上的止動齒 D 擋住,另一個鎖定輪的齒由另一個叉瓦上的
// 止動齒 E 擋住。兩個叉瓦臂從上方的兩個樞軸垂下(菱形),擺桿夾在兩臂下端之間:擺每擺一次推開一個臂、放開一個止動齒,
// 擒縱輪轉過六分之一圈,抬升銷再把另一個臂抬起;臂落下時以重量給擺衝量。軸上的長條(FLY)是調速用的風扇,
// 跟著擒縱輪一起轉,讓它轉得平穩。主動件是擺;目標件是擒縱輪(擒縱讓它一格一格地放行)。
//
// 由接觸算(與第 310 種相同的作法,models/escapement.js 的 periodic、fall、clearance、approach):兩支臂靠重量往內倒、
// 靠在擋銷上;擒縱輪受重錘的固定力矩逆時針轉。兩輪之間的抬升銷碰到臂上的叉瓦(右臂的在輪心右下、左臂的在左上)
// 就把臂往外抬,抬起的臂的止動齒擋住它那一個鎖定輪的腳(左臂的 D 擋前輪、右臂的 E 擋後輪)。擺往外推臂的下端時,
// 止動齒滑開腳尖,輪轉六分之一圈;擺回來時臂跟著落回。止動齒擋腳的面是以臂的軸為圓心的弧,腳壓在上面推不開臂。
// 偏離插圖:原圖兩輪錯開 60°;照這種「一隻腳被一邊的止動齒擋住、下一隻被另一邊擋住」的作法,兩輪的腳對齊。
// 動力重演:兩支臂與擒縱輪都是自由零件(擋銷另成一個零件);和第 310 種一樣,輪撞開臂、重演做不出來,寫成豁免。
// 推斷:擺幅、各部尺寸與層次(臂在最前、擺桿再前一層);輪軸與兩臂的軸裝在後面的機架上(原圖沒畫)。
import { TAU, deg, swing } from "./kit.js";
import { placePoly, periodic, fall, anyOverlap, clearance, approach } from "./escapement.js";
import { shape, thickLine, circle, rect } from "./shapes.js";
import { circlePolygon } from "./contact.js";

export const STEP = TAU / 6;
export const SWING = deg(3.2);
const W = [0, 0];
const TOP = { left: [-0.15, 5.2], right: [0.15, 5.2] };
const PEND = [0, 5.2];
const LEG = 1.4;
const PIN = { r: 0.32, size: 0.05 };
const ROD = 0.12;
const GAP = 0.04;
const BOTTOM = -3.4; // 兩臂下端(擺銷)的高度
const Z = { front: 0.25, back: -0.25, mid: 0, arm: 0.62, rod: 0.78 };

// 擋止的弧面:以臂的軸為圓心、通過 (x, y0) 一帶,x 從 x0 到 x1
const arcFace = (pivot, y0, x0, x1, thick, below) => {
  const r = Math.hypot(x0 - pivot[0], y0 - pivot[1]);
  const pts = Array.from({ length: 9 }, (_, i) => {
    const x = x0 + ((x1 - x0) * i) / 8;
    return [x - pivot[0], -Math.sqrt(r * r - (x - pivot[0]) ** 2)];
  });
  return [...pts, ...pts.slice().reverse().map(([x, y]) => [x, y + (below ? -thick : thick)])];
};
const toLocal = (pivot) => (pts) => pts.map(([x, y]) => [x - pivot[0], y - pivot[1]]);
// 右臂:止動齒 E(後輪那一層,擋往上走的腳)、叉瓦(兩輪之間,輪心右下)
const STOP_E = arcFace(TOP.right, 0.03, 1.2, 1.65, 0.12, false);
const FACE_R = toLocal(TOP.right)(rect(0.12, 0.16, 0.11, -0.28));
// 左臂:止動齒 D(前輪那一層,擋往下走的腳)、叉瓦(輪心左上);點對稱
const STOP_D = arcFace(TOP.left, -0.03, -1.2, -1.65, 0.12, true);
const FACE_L = toLocal(TOP.left)(rect(0.12, 0.16, -0.11, 0.28));
// 擺銷(臂的下端,擺桿兩側)
const BEAT_R = [ROD / 2 + GAP + 0.05 - TOP.right[0], BOTTOM - TOP.right[1]];
const BEAT_L = [-ROD / 2 - GAP - 0.05 - TOP.left[0], BOTTOM - TOP.left[1]];

const legPoly = (i) => {
  const a = (i * TAU) / 3;
  return [[0.06, -0.06], [LEG, -0.03], [LEG, 0.03], [0.06, 0.06]].map(([x, y]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]);
};
const legs = [0, 1, 2].map(legPoly);
const pins = [0, 1, 2].map((i) => {
  const a = (i * TAU) / 3 - deg(60);
  return circlePolygon([PIN.r * Math.cos(a), PIN.r * Math.sin(a)], PIN.size, 10);
});

/** 擺累計擺動 v → 擺角 */
export const pendulumAngle = (v) => swing(v, -SWING, SWING);
const rodAt = (p) => [placePoly(rect(ROD, 5.2 - BOTTOM + 0.4, 0, -(5.2 - BOTTOM + 0.4) / 2), PEND, p)];
const armR = (a) => ({ face: [placePoly(FACE_R, TOP.right, a)], stop: [placePoly(STOP_E, TOP.right, a)], beat: [placePoly(circlePolygon(BEAT_R, 0.05, 10), TOP.right, a)] });
const armL = (b) => ({ face: [placePoly(FACE_L, TOP.left, b)], stop: [placePoly(STOP_D, TOP.left, b)], beat: [placePoly(circlePolygon(BEAT_L, 0.05, 10), TOP.left, b)] });
const legsAt = (w) => legs.map((l) => placePoly(l, W, w)); // 前、後兩輪的腳對齊
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
  // 止動齒只擋自己那一個鎖定輪的腳(E 擋後輪、D 擋前輪);兩輪的腳對齊,所以都和同一組腳比
  const blockedBy = (na, nb, x) => anyOverlap([...armR(na).stop, ...armL(nb).stop], legsAt(x));
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
  if (blockedBy(a, b, w)) [w, ww] = [w - clearance((x) => blockedBy(a, b, x), w, -1, STEP), 0];
  const dist = (ww + ((2 * STEP) / (0.06 * 4 * SWING) ** 2) * dv) * dv;
  const reached = approach((x) => lift(x) == null, w, 1, dist, 16);
  const r = lift(reached) ?? { na: a, nb: b };
  [a, b] = [r.na, r.nb];
  ww = (reached - w) / dv;
  w = reached;
  return { a, aw, b, bw, w, ww };
}

const W0 = (() => {
  for (let i = 0; i < 96; i++) {
    const x = (STEP * 2 * i) / 96;
    if (!anyOverlap([...armR(0).stop, ...armL(0).stop], legsAt(x)) && !anyOverlap([...armR(0).face, ...armL(0).face], pinsAt(x))) return x;
  }
  throw new Error("找不到起始位置");
})();
const run = periodic({ period: 4 * SWING, init: { a: 0, aw: 0, b: 0, bw: 0, w: W0, ww: 0 }, step, samples: 720, snap: { w: STEP * 2 } });

/** 擺累計擺動 v → 擺角、左右叉瓦抬起的角度(正值)、擒縱輪轉角(逆時針為正) */
export function doubleThree(v) {
  const s = run.at(v);
  return { pendulum: pendulumAngle(v), right: s.a, left: -s.b, wheel: s.w };
}
export const escapement = {
  period: 4 * SWING,
  step: run.advance.w,
  angle: (v) => run.at(v).w,
  at: (v) => {
    const s = run.at(v);
    const l = legsAt(s.w);
    const p = pinsAt(s.w);
    return {
      teeth: [...l, ...l, ...p],
      layers: [...l.map(() => "back"), ...l.map(() => "front"), ...p.map(() => "mid")],
      stops: [...armR(s.a).stop, ...armL(s.b).stop, ...armR(s.a).face, ...armL(s.b).face],
      stopLayers: ["back", "front", "mid", "mid"],
    };
  },
};

// 臂(相對各自的軸):菱形的一邊——從軸往外到側角、再往內收到下端的擺銷;側角處的止動齒、往內伸到輪心旁的叉瓦
const CORNER = 1.95;
const armPieces = (pivot, sgn, stop, face, beat, stopZ) => {
  const corner = [sgn * CORNER - pivot[0], 0.1 - pivot[1]];
  const faceEnd = face.reduce((m, q) => (sgn * q[0] > sgn * m[0] ? q : m));
  return [
    { kind: "plate", shape: shape(thickLine([[0, 0], corner, beat], 0.13), [circle(0.06).reverse()]), thickness: 0.08, at: [0, 0, Z.arm] },
    { kind: "plate", shape: shape(stop), thickness: 0.08, at: [0, 0, stopZ] }, // 止動齒(在它擋的那一個鎖定輪那一層)
    { kind: "box", size: [0.1, 0.1, Z.arm - stopZ + 0.04], at: [sgn * 1.8 - pivot[0], stop[0][1] + (sgn > 0 ? 0.06 : -0.06), (Z.arm + stopZ) / 2] }, // 側角往後伸到止動齒(在腳尖圓外)
    { kind: "plate", shape: shape(thickLine([[sgn * 1.8 - pivot[0], faceEnd[1]], faceEnd], 0.08)), thickness: 0.1, at: [0, 0, Z.mid] }, // 往內伸到叉瓦的橫條(兩輪之間)
    { kind: "box", size: [0.1, 0.1, Z.arm - Z.mid + 0.04], at: [sgn * 1.8 - pivot[0], faceEnd[1], (Z.arm + Z.mid) / 2] },
    { kind: "plate", shape: shape(face), thickness: 0.14, at: [0, 0, Z.mid] }, // 叉瓦
    { kind: "cylinder", radius: 0.05, length: 0.3, at: [beat[0], beat[1], (Z.arm + Z.rod) / 2] }, // 擺銷
    { kind: "cylinder", radius: 0.05, length: 1.1, at: [0, 0, Z.arm - 0.5] }, // 臂的軸,往後伸進機架
  ];
};

export default {
  figure: 311,
  parts: [
    {
      id: "wheel",
      kind: "group",
      center: [...W, 0],
      spin: LEG,
      pieces: [
        ...legs.map((l, i) => ({ kind: "plate", shape: shape(l), thickness: 0.06, at: [0, 0, Z.front], accent: i === 0 })), // 前輪 A、B、C
        ...legs.map((l) => ({ kind: "plate", shape: shape(l), thickness: 0.06, at: [0, 0, Z.back] })), // 後輪 a、b、c
        ...pins.map((p) => ({ kind: "plate", shape: shape(p), thickness: 0.3, at: [0, 0, Z.mid] })), // 兩輪之間的抬升銷
        { kind: "cylinder", radius: 0.1, length: 0.9, at: [0, 0, 0] },
        { kind: "cylinder", radius: 0.05, length: 0.7, at: [0, 0, -0.75] }, // 輪軸,往後伸進機架
        { kind: "box", size: [3.4, 0.06, 0.04], at: [0, 0, 0.47], angle: deg(62) }, // 調速風扇(FLY)
      ],
    },
    { id: "armL", kind: "group", center: [...TOP.left, 0], arrow: false, pieces: armPieces(TOP.left, -1, STOP_D, FACE_L, BEAT_L, Z.front) },
    { id: "armR", kind: "group", center: [...TOP.right, 0], arrow: false, pieces: armPieces(TOP.right, 1, STOP_E, FACE_R, BEAT_R, Z.back) },
    {
      id: "pendulum",
      kind: "group",
      center: [...PEND, 0],
      arrow: false,
      pieces: [
        { kind: "box", size: [ROD, 5.2 - BOTTOM + 0.4, 0.08], at: [0, -(5.2 - BOTTOM + 0.4) / 2, Z.rod] },
        { kind: "cylinder", radius: 0.08, length: 0.3, at: [0, 0, Z.rod] },
        { kind: "cylinder", radius: 0.18, length: 0.5, axis: [0, 1, 0], at: [0, BOTTOM - 0.6 - 5.2, Z.rod] },
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(rect(0.3, 5.5, 0, 2.6)), thickness: 0.1, at: [0, 0, -1.15] },
        { kind: "plate", shape: shape(rect(1.6, 0.4, 0, 5.3)), thickness: 0.1, at: [0, 0, -1.15] },
        { kind: "box", size: [1.3, 0.2, 0.3], at: [0, 5.55, Z.rod] },
      ],
    },
    {
      id: "armStops",
      kind: "group",
      pieces: [
        // 兩臂的擋銷(臂靠重量往內倒時靠在上面)
        { kind: "cylinder", radius: 0.04, length: 0.3, at: [TOP.right[0] + 0.32, TOP.right[1] - 0.45, Z.arm] },
        { kind: "cylinder", radius: 0.04, length: 0.3, at: [TOP.left[0] - 0.32, TOP.left[1] - 0.45, Z.arm] },
      ],
    },
    { id: "labelA", kind: "group", center: [1.0, 0.12, Z.front], label: "A", labelOffset: [0, 0.25, 0.3] },
    { id: "labelB", kind: "group", center: [-0.5, -0.85, Z.front], label: "B", labelOffset: [0.15, 0, 0.4] },
    { id: "labelC", kind: "group", center: [-0.5, 0.85, Z.front], label: "C", labelOffset: [0.25, 0.1, 0.3] },
    { id: "labelD", kind: "group", center: [-1.5, -0.1, Z.front], label: "D", labelOffset: [-0.3, -0.2, 0.3] },
    { id: "labelE", kind: "group", center: [1.5, 0.1, Z.back], label: "E", labelOffset: [0.4, 0.2, 0.3] },
  ],
  // 動力重演:只推擺;擒縱輪受固定的力矩(重錘)逆時針轉,兩支臂鉸在樞軸上、靠自重靠在擋銷上。從輪鎖住的時刻
  // (擺在正中、往右擺)開始。做不出來的原因見 waivers。
  replay: {
    from: SWING,
    to: 9 * SWING,
    free: { wheel: { pivot: [...W, 0], spring: 1, gravity: false }, armR: { pivot: [...TOP.right, 0] }, armL: { pivot: [...TOP.left, 0] } },
    ignore: [["wheel", "frame"], ["armR", "frame"], ["armL", "frame"]],
    expect: [
      { at: 3 * SWING, part: "wheel", label: "擺往右擺:推開右臂、放開止動齒 E,輪轉六分之一圈、被止動齒 D 擋住", quote: "前述第一個鎖定輪的齒由其中一個擒縱叉瓦上的止動齒 D 所擋住" },
      { at: 3 * SWING, part: "armR", label: "擺往右擺:右臂被擺推開" },
      { at: 5 * SWING, part: "wheel", label: "擺往左擺:推開左臂、放開止動齒 D,輪再轉六分之一圈" },
      { at: 5 * SWING, part: "armL", label: "擺往左擺:左臂被擺推開" },
      { part: "wheel", label: "擺兩個來回,輪轉過三分之二圈" },
    ],
  },
  driver: { part: "pendulum", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheel", // 擒縱輪:擒縱讓它一格一格地放行
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const s = run.at(v);
    return { parts: { pendulum: { angle: pendulumAngle(v) }, armR: { angle: s.a }, armL: { angle: s.b }, wheel: { angle: s.w } }, readouts: [] };
  },
  waivers: [
    { check: "replay", parts: ["wheel"], reason: "重演做不出來:重力臂鉸在樞軸上、靠自重靠在擋銷上,擺推開一支臂放開輪之後,輪在重演裡受固定的力矩、從靜止加速轉過約 60° 才碰到另一支臂的擋止,以那個速度撞上去把臂撞開(臂的質量由外形算,比輪輕得多),輪就一路轉走。實物靠臂的重量、擋止面以臂軸為圓心、輪系的慣性與阻力擋住;重演的質量、力矩與摩擦是全書一致的預設值,模型沒辦法單獨調(同一章的第 309、312 種放開後只轉半個齒距,撞上去的速度小得多,重演通過)。臂被抬起、擋住腳、落回的過程由模型的測試檢查(擋止與叉瓦不穿入輪的腳與銷、兩臂交替被抬起)" },
  ],
};
