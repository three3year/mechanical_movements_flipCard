// 第 310 種:三腳式重力擒縱。擺的框架呈豎琴形,從上方吊著;擒縱輪中央附近有三根銷,負責把擒縱叉瓦 A、B 抬起,
// 兩個叉瓦各自繞擺懸掛點附近的一個中心擺動;擒縱輪由叉瓦上的擋止 D、E 鎖住。擺每擺一次,把一側的叉瓦推開、
// 放開擋止,擒縱輪轉過六分之一圈,中央的銷把另一側的叉瓦抬起、它的擋止擋住下一隻腳;叉瓦落下時以重量給擺衝量。
// 主動件是擺;目標件是擒縱輪(擒縱讓它一格一格地放行)。
//
// 由接觸算(models/escapement.js 的 periodic、fall、clearance、approach):兩支重力臂鉸在懸掛點下方,靠重量往內倒、
// 靠在擋銷上;擒縱輪受重錘的固定力矩逆時針轉。輪轉動時,中央的銷碰到臂上的叉瓦(右臂的 A 在輪心右下、左臂的 B 在左上)
// 就把臂往外推(抬起),臂上的擋止(右臂的 E、左臂的 D)擋住腳尖時輪停住——銷托著抬起的臂。擺往右擺時碰到右臂的
// 擺銷、再把它推開一點,擋止 E 滑開腳尖,輪轉六分之一圈;擺回來時右臂跟著落回(由重量推擺)。擋止的面是以臂的軸為圓心的弧,
// 腳尖壓在上面推不開臂。叉瓦、擋止、擺銷的形狀與位置是依原文與作圖推算的(原圖只看得出大致的位置)。
// 動力重演:兩支臂與擒縱輪都是自由零件(擋銷另成一個零件)。放開後輪加速轉約 60° 才撞上擋止,把很輕的臂撞開,
// 重演做不出來,寫成豁免(原因見 waivers)。
// 推斷:擺幅、各部尺寸;豎琴形框架的形狀依原圖;輪軸與兩臂的軸裝在後面的機架上(原圖沒畫)。
import { TAU, deg, swing } from "./kit.js";
import { placePoly, periodic, fall, anyOverlap, clearance, approach } from "./escapement.js";
import { shape, thickLine, circle, rect } from "./shapes.js";
import { circlePolygon } from "./contact.js";

export const STEP = TAU / 6;
export const SWING = deg(3.5);
const TOP = [0, 4.2]; // 擺的懸掛點
const W = [0, -0.6]; // 擒縱輪心
const PIV = { left: [-0.12, 3.6], right: [0.12, 3.6] };
const LEG = 1.05;
const PIN = { r: 0.32, size: 0.05 }; // 中央的抬升銷
const ROD = 0.08; // 擺桿(豎琴框架中間的直桿)寬
const GAP = 0.04; // 擺桿與擺銷之間的空隙(臂在擋銷上時)

// 世界座標(相對輪心)的形狀,轉成各臂的局部座標
const rel = ([x, y]) => [x + W[0], y + W[1]];
const toArm = (pivot) => (pts) => pts.map(rel).map(([x, y]) => [x - pivot[0], y - pivot[1]]);
const arcAbout = (pivot, r0, y0, x0, x1, n = 8) => {
  // 以臂的軸為圓心、通過 (x, y0) 的弧(擋止的面):x 從 x0 到 x1
  const p = rel([0, y0]);
  return Array.from({ length: n + 1 }, (_, i) => {
    const x = rel([x0 + ((x1 - x0) * i) / n, 0])[0];
    const r = Math.hypot(p[0] - pivot[0], p[1] - pivot[1]);
    const dy = -Math.sqrt(Math.max(0, r * r - (x - pivot[0]) ** 2));
    return [x - pivot[0], pivot[1] + dy - pivot[1] + r0];
  });
};
// 右臂(叉瓦 A、擋止 E):A 是輪心右下方的豎直面(銷往右推它);E 在右邊、下面是擋腳尖的弧面
const FACE_A = toArm(PIV.right)(rect(0.12, 0.16, 0.05 + 0.06, -0.28));
const STOP_E = (() => {
  const under = arcAbout(PIV.right, 0, 0.03, 0.85, 1.3);
  return [...under, ...under.slice().reverse().map(([x, y]) => [x, y + 0.12])];
})();
// 左臂(叉瓦 B、擋止 D):點對稱
const FACE_B = toArm(PIV.left)(rect(0.12, 0.16, -0.05 - 0.06, 0.28));
const STOP_D = (() => {
  const over = arcAbout(PIV.left, 0, -0.03, -0.85, -1.3).map(([x, y]) => [x, y]);
  // 左臂的弧在輪心水平線下方 0.03:把右臂的作法鏡射(y 方向也反過來)
  const r = Math.hypot(rel([0, -0.03])[0] - PIV.left[0], rel([0, -0.03])[1] - PIV.left[1]);
  const top = Array.from({ length: 9 }, (_, i) => {
    const xw = rel([-0.85 - (0.45 * i) / 8, 0])[0];
    return [xw - PIV.left[0], -Math.sqrt(r * r - (xw - PIV.left[0]) ** 2)];
  });
  return [...top, ...top.slice().reverse().map(([x, y]) => [x, y - 0.12])].concat(over.length ? [] : []);
})();
// 擺銷(臂上,擺桿兩側)
const BEAT_Y = -0.05;
const BEAT_A = toArm(PIV.right)([[ROD / 2 + GAP + 0.04, BEAT_Y]])[0];
const BEAT_B = toArm(PIV.left)([[-ROD / 2 - GAP - 0.04, BEAT_Y]])[0];
const beatPoly = (c) => circlePolygon(c, 0.04, 10);

// 三腳輪:三隻長腳(鎖)與中央三根銷(抬);腳在 0°、120°、240°,銷在腳後 60°
const legs = [0, 1, 2].map((i) => {
  const a = (i * TAU) / 3;
  return [[0.06, -0.06], [LEG, -0.03], [LEG, 0.03], [0.06, 0.06]].map(([x, y]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]);
});
const pins = [0, 1, 2].map((i) => {
  const a = (i * TAU) / 3 - deg(60);
  return circlePolygon([PIN.r * Math.cos(a), PIN.r * Math.sin(a)], PIN.size, 10);
});

/** 擺累計擺動 v → 擺角 */
export const pendulumAngle = (v) => swing(v, -SWING, SWING);
const rodAt = (p) => [placePoly(rect(ROD, 5.6, 0, -4.8 - 0.0), TOP, p)];
const armA = (a) => ({ face: [placePoly(FACE_A, PIV.right, a)], stop: [placePoly(STOP_E, PIV.right, a)], beat: [placePoly(beatPoly(BEAT_A), PIV.right, a)] });
const armB = (b) => ({ face: [placePoly(FACE_B, PIV.left, b)], stop: [placePoly(STOP_D, PIV.left, b)], beat: [placePoly(beatPoly(BEAT_B), PIV.left, b)] });
const legsAt = (w) => legs.map((l) => placePoly(l, W, w));
const pinsAt = (w) => pins.map((p) => placePoly(p, W, w));

const RATE = 30;
function step(s, v, dv) {
  const rod = rodAt(pendulumAngle(v));
  let { a, aw, b, bw, w, ww } = s;
  // 1. 擺桿推擺銷:右臂往外是逆時針(a 增加)、左臂往外是順時針(b 減少)
  if (anyOverlap(rod, armA(a).beat)) [a, aw] = [a + clearance((x) => anyOverlap(rod, armA(x).beat), a, 1, 0.3), 0];
  if (anyOverlap(rod, armB(b).beat)) [b, bw] = [b - clearance((x) => anyOverlap(rod, armB(x).beat), b, -1, 0.3), 0];
  // 2. 臂靠重量往內倒,碰到擋銷(0)、擺桿或抬升銷就停
  const p = pinsAt(w);
  ({ q: a, w: aw } = fall((x) => anyOverlap(rod, armA(x).beat) || anyOverlap(armA(x).face, p), { q: a, w: aw }, { sign: -1, acc: RATE, dt: dv, limit: 0, max: 0.3 }));
  ({ q: b, w: bw } = fall((x) => anyOverlap(rod, armB(x).beat) || anyOverlap(armB(x).face, p), { q: b, w: bw }, { sign: 1, acc: RATE, dt: dv, limit: 0, max: 0.3 }));
  // 3. 擒縱輪:腳被擋止擋住就停;銷碰到叉瓦時把臂往外推(推得動才前進)
  const stops = [...armA(a).stop, ...armB(b).stop];
  const lift = (x) => {
    const pp = pinsAt(x);
    let na = a;
    let nb = b;
    if (anyOverlap(armA(na).face, pp)) na = a + clearance((y) => anyOverlap(armA(y).face, pp), a, 1, 0.3);
    if (anyOverlap(armB(nb).face, pp)) nb = b - clearance((y) => anyOverlap(armB(y).face, pp), b, -1, 0.3);
    if (!Number.isFinite(na) || !Number.isFinite(nb)) return null;
    if (anyOverlap([...armA(na).stop, ...armB(nb).stop], legsAt(x))) return null;
    if (anyOverlap(rod, armA(na).beat) || anyOverlap(rod, armB(nb).beat)) return null;
    return { na, nb };
  };
  if (anyOverlap(stops, legsAt(w))) {
    // 擋止壓進腳裡(臂被擺推回時):輪被推回
    const back = clearance((x) => anyOverlap(stops, legsAt(x)), w, -1, STEP);
    [w, ww] = [w - back, 0];
  }
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
    if (!anyOverlap([...armA(0).stop, ...armB(0).stop], legsAt(x)) && !anyOverlap([...armA(0).face, ...armB(0).face], pinsAt(x))) return x;
  }
  throw new Error("找不到起始位置");
})();
const run = periodic({ period: 4 * SWING, init: { a: 0, aw: 0, b: 0, bw: 0, w: W0, ww: 0 }, step, samples: 720, snap: { w: STEP * 2 } });

/** 擺累計擺動 v → 擺角、左右叉瓦抬起的角度(正值)、擒縱輪轉角(逆時針為正) */
export function gravity(v) {
  const s = run.at(v);
  return { pendulum: pendulumAngle(v), right: s.a, left: -s.b, wheel: s.w };
}
export const escapement = {
  period: 4 * SWING,
  step: run.advance.w,
  angle: (v) => run.at(v).w,
  at: (v) => {
    const s = run.at(v);
    // 分層:腳在前一層(z 約 0)、抬升銷與叉瓦在後一層(z 約 0.1–0.25);擋止往後伸,兩層都有
    const stop = [...armA(s.a).stop, ...armB(s.b).stop];
    const face = [...armA(s.a).face, ...armB(s.b).face];
    return {
      teeth: [...legsAt(s.w), ...pinsAt(s.w)],
      layers: ["leg", "leg", "leg", "pin", "pin", "pin"],
      stops: [...stop, ...stop, ...face],
      stopLayers: [...stop.map(() => "leg"), ...stop.map(() => "pin"), ...face.map(() => "pin")],
    };
  },
};

// 豎琴形框架(相對懸掛點):兩條彎臂從上橫樑往下收到底部的擺錘桿;中間一根直桿(撥動兩臂的擺銷)
const side = (sgn) => Array.from({ length: 17 }, (_, i) => {
  const t = i / 16;
  const y = -0.5 - 6.8 * t;
  const wdt = 1.35 * Math.sin(Math.PI * Math.min(1, t * 1.15)) ** 0.7 + 0.12;
  return [sgn * wdt, y];
});
const frame = [
  { kind: "plate", shape: shape(thickLine([[-1.5, -0.45], [1.5, -0.45]], 0.2)), thickness: 0.12, at: [0, 0, 0.5] },
  { kind: "plate", shape: shape(thickLine(side(-1), 0.14)), thickness: 0.12, at: [0, 0, 0.5] },
  { kind: "plate", shape: shape(thickLine(side(1), 0.14)), thickness: 0.12, at: [0, 0, 0.5] },
  { kind: "box", size: [0.5, 0.35, 0.3], at: [0, -7.35, 0.5] },
  { kind: "box", size: [0.1, 1.2, 0.1], at: [0, -8.1, 0.5] },
  { kind: "box", size: [0.9, 0.3, 0.4], at: [0, 0.15, 0.5] },
  { kind: "plate", shape: shape(rect(ROD, 5.6, 0, -4.8)), thickness: 0.08, at: [0, 0, 0.36] }, // 中間的直桿(在擺銷那一層)
];
const armPieces = (pivot, face, stop, beat, sgn) => {
  const lo = face.reduce((m, p) => (p[1] < m[1] ? p : m));
  return [
    { kind: "plate", shape: shape(thickLine([[0, 0], [sgn * 0.08, lo[1] + 0.25]], 0.1), [circle(0.05).reverse()]), thickness: 0.08, at: [0, 0, 0.28] },
    { kind: "plate", shape: shape(thickLine([[sgn * 0.08, lo[1] + 0.25], stop[Math.floor(stop.length / 4)]], 0.08)), thickness: 0.08, at: [0, 0, 0.28] },
    { kind: "plate", shape: shape(face), thickness: 0.14, at: [0, 0, 0.18] }, // 叉瓦:在抬升銷那一層
    { kind: "plate", shape: shape(stop), thickness: 0.24, at: [0, 0, 0.12] }, // 擋止:往後伸到腳那一層
    { kind: "cylinder", radius: 0.04, length: 0.14, at: [beat[0], beat[1], 0.36] }, // 擺銷
    { kind: "cylinder", radius: 0.05, length: 0.8, at: [0, 0, -0.1] }, // 臂的軸,往後伸進機架
  ];
};

export default {
  figure: 310,
  parts: [
    { id: "pendulum", kind: "group", center: [...TOP, 0], arrow: false, pieces: frame },
    { id: "armA", kind: "group", center: [...PIV.right, 0], arrow: false, pieces: armPieces(PIV.right, FACE_A, STOP_E, BEAT_A, 1) },
    { id: "armB", kind: "group", center: [...PIV.left, 0], arrow: false, pieces: armPieces(PIV.left, FACE_B, STOP_D, BEAT_B, -1) },
    {
      id: "wheel",
      kind: "group",
      center: [...W, 0],
      spin: LEG,
      pieces: [
        ...legs.map((l, i) => ({ kind: "plate", shape: shape(l), thickness: 0.1, accent: i === 0 })),
        { kind: "plate", shape: shape(circle(0.2)), thickness: 0.16 },
        ...pins.map((p) => ({ kind: "plate", shape: shape(p), thickness: 0.22, at: [0, 0, 0.13] })), // 中央的三根抬升銷
        { kind: "cylinder", radius: 0.06, length: 0.6, at: [0, 0, -0.35] }, // 輪軸,往後伸進機架
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(rect(0.3, 4.6, 0, (W[1] + PIV.left[1]) / 2)), thickness: 0.1, at: [0, 0, -0.62] },
        { kind: "plate", shape: shape(rect(0.6, 0.3, 0, PIV.left[1])), thickness: 0.1, at: [0, 0, -0.62] },
      ],
    },
    {
      id: "armStops",
      kind: "group",
      pieces: [
        // 兩臂的擋銷(臂靠重量往內倒時靠在上面)
        { kind: "cylinder", radius: 0.04, length: 0.5, at: [PIV.right[0] - 0.13, PIV.right[1] - 0.5, -0.1] },
        { kind: "cylinder", radius: 0.04, length: 0.5, at: [PIV.left[0] + 0.13, PIV.left[1] - 0.5, -0.1] },
      ],
    },
    { id: "labelA", kind: "group", center: [...PIV.right, 0], label: "A", labelOffset: [FACE_A[0][0] + 0.2, FACE_A[0][1] - 0.2, 0.4] },
    { id: "labelB", kind: "group", center: [...PIV.left, 0], label: "B", labelOffset: [FACE_B[0][0] - 0.25, FACE_B[0][1] + 0.2, 0.4] },
    { id: "labelD", kind: "group", center: [...PIV.left, 0], label: "D", labelOffset: [STOP_D[8][0] - 0.25, STOP_D[8][1], 0.4] },
    { id: "labelE", kind: "group", center: [...PIV.right, 0], label: "E", labelOffset: [STOP_E[8][0] + 0.25, STOP_E[8][1], 0.4] },
  ],
  // 動力重演:只推擺;擒縱輪受固定的力矩(重錘)逆時針轉,兩支臂鉸在樞軸上、靠自重靠在擋銷上。從輪鎖住的時刻
  // (擺在正中、往右擺)開始。做不出來的原因見 waivers。
  replay: {
    from: SWING,
    to: 9 * SWING,
    free: { wheel: { pivot: [...W, 0], spring: 1, gravity: false }, armA: { pivot: [...PIV.right, 0] }, armB: { pivot: [...PIV.left, 0] } },
    ignore: [["wheel", "frame"], ["armA", "frame"], ["armB", "frame"]],
    expect: [
      { at: 3 * SWING, part: "wheel", label: "擺往右擺:推開右臂、放開擋止 E,輪轉六分之一圈、被擋止 D 擋住", quote: "擒縱輪由擒縱叉瓦上的擋止 D 和 E 加以鎖定" },
      { at: 3 * SWING, part: "armA", label: "擺往右擺:右臂被擺推開" },
      { at: 5 * SWING, part: "wheel", label: "擺往左擺:推開左臂、放開擋止 D,輪再轉六分之一圈" },
      { at: 5 * SWING, part: "armB", label: "擺往左擺:左臂被擺推開" },
      { part: "wheel", label: "擺兩個來回,輪轉過三分之二圈" },
    ],
  },
  driver: { part: "pendulum", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheel", // 擒縱輪:擒縱讓它一格一格地放行
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const s = run.at(v);
    return { parts: { pendulum: { angle: pendulumAngle(v) }, armA: { angle: s.a }, armB: { angle: s.b }, wheel: { angle: s.w } }, readouts: [] };
  },
  waivers: [
    { check: "replay", parts: ["wheel"], reason: "重演做不出來:重力臂鉸在樞軸上、靠自重靠在擋銷上,擺推開一支臂放開輪之後,輪在重演裡受固定的力矩、從靜止加速轉過約 60° 才碰到另一支臂的擋止,以那個速度撞上去把臂撞開(臂的質量由外形算,比輪輕得多),輪就一路轉走。實物靠臂的重量、擋止面以臂軸為圓心、輪系的慣性與阻力擋住;重演的質量、力矩與摩擦是全書一致的預設值,模型沒辦法單獨調(同一章的第 309、312 種放開後只轉半個齒距,撞上去的速度小得多,重演通過)。臂被抬起、擋住腳、落回的過程由模型的測試檢查(擋止與叉瓦不穿入輪的腳與銷、兩臂交替被抬起)" },
    { check: "replay", parts: ["armA"], reason: "重演做不出來:重力臂鉸在樞軸上、靠自重靠在擋銷上,擺推開一支臂放開輪之後,輪在重演裡受固定的力矩、從靜止加速轉過約 60° 才碰到另一支臂的擋止,以那個速度撞上去把臂撞開(臂的質量由外形算,比輪輕得多),輪就一路轉走。實物靠臂的重量、擋止面以臂軸為圓心、輪系的慣性與阻力擋住;重演的質量、力矩與摩擦是全書一致的預設值,模型沒辦法單獨調(同一章的第 309、312 種放開後只轉半個齒距,撞上去的速度小得多,重演通過)。臂被抬起、擋住腳、落回的過程由模型的測試檢查(擋止與叉瓦不穿入輪的腳與銷、兩臂交替被抬起)" },
    { check: "replay", parts: ["armB"], reason: "重演做不出來:重力臂鉸在樞軸上、靠自重靠在擋銷上,擺推開一支臂放開輪之後,輪在重演裡受固定的力矩、從靜止加速轉過約 60° 才碰到另一支臂的擋止,以那個速度撞上去把臂撞開(臂的質量由外形算,比輪輕得多),輪就一路轉走。實物靠臂的重量、擋止面以臂軸為圓心、輪系的慣性與阻力擋住;重演的質量、力矩與摩擦是全書一致的預設值,模型沒辦法單獨調(同一章的第 309、312 種放開後只轉半個齒距,撞上去的速度小得多,重演通過)。臂被抬起、擋住腳、落回的過程由模型的測試檢查(擋止與叉瓦不穿入輪的腳與銷、兩臂交替被抬起)" },
  ],
};
