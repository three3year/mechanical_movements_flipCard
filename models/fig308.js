// 第 308 種:分離式擺鐘擒縱。擺 P 除了接收衝量與解鎖擒縱輪的那一刻之外,都與擒縱輪脫離、自由擺動。
// 只有一個擒縱叉瓦 I(在擺的橫桿上),只在擺向左擺(原圖箭頭)的期間接收衝量;槓桿 Q 鎖住擒縱輪,
// 直到快要傳遞衝量時,才由裝在擺上的制動爪 C 把它撥開解鎖。擺向右返回時,以樞軸擺動的制動爪被槓桿推向一旁。
// 擺每來回一次,擒縱輪轉過一齒。主動件是擺(擺的橫桿左右移動);目標件是擒縱輪(擒縱讓它一齒一齒地放行)。
//
// 由接觸算(models/escapement.js 的 periodic、fall,與第 291 種相同的作法):槓桿 Q 鉸在機架上,靠彈簧壓在擋銷上,
// 上端的鎖頭擋住擒縱輪右邊往下走的齒;制動爪 C 鉸在橫桿上,靠彈簧壓在橫桿的擋銷上——往左擺時它頂著擋銷、
// 推開 Q 的下臂(解鎖),往右擺時碰到 Q 的下臂就往一旁倒、從下面滑過,Q 不動。擒縱輪受重錘的固定力矩順時針轉:
// 解鎖後輪下緣往左走的齒追上叉瓦 I、推著它走(衝量),脫開後落到落回的 Q 上。
// 推斷:擒縱輪齒數(八齒,叉瓦 I 往右擺回來時要從兩齒之間的空隙下面通過)、擺的行程、Q 與 C 的形狀與位置、
// 擋銷與彈簧;擺的兩根擺桿 P 只畫出彎曲的一段(原圖)。輪軸與 Q 的樞軸裝在後面的機架上。
import { TAU, deg, swing } from "./kit.js";
import { toothedWheel, placePoly, periodic, fall, anyOverlap, clearance } from "./escapement.js";
import { shape, rect, thickLine, circle } from "./shapes.js";

export const N = 8;
export const PITCH = TAU / N;
export const TRAVEL = 0.9; // 擺橫桿的單邊行程
const W = [0, 1.45];
const R = 0.6;
const ROOT = 0.34;
const BAR = { y: 0, half: 0.275 }; // 橫桿(世界 y、半高)
const QP = [0.9, 0.55]; // 鎖定槓桿 Q 的樞軸
const CP = [0.42, BAR.half + 0.03]; // 制動爪 C 的樞軸(相對橫桿)
const I = { x: -0.2, width: 0.1, top: W[1] - R + 0.025 }; // 叉瓦 I(相對橫桿):伸進齒尖圓 0.025

// 順時針轉的尖齒:前面(角度小的一側)直、背面斜
const WHEEL = toothedWheel({ teeth: N, profile: [[ROOT, 0.06], [R, 0], [R, 0.08], [ROOT, 0.62]], bore: 0.06 });
// Q(相對樞軸):上臂到鎖頭(在輪的右下方,頂面擋住往下走的齒),下臂往左下到橫桿上方
const LOCK_AT = [W[0] + R * Math.cos(deg(-22)), W[1] + R * Math.sin(deg(-22))];
const q = (p) => [p[0] - QP[0], p[1] - QP[1]];
const Q_UPPER = thickLine([[0, 0], q([0.72, 0.95]), q([LOCK_AT[0] + 0.1, LOCK_AT[1] - 0.06])], 0.08);
const Q_HEAD = rect(0.2, 0.1, ...q([LOCK_AT[0] + 0.02, LOCK_AT[1] - 0.06])); // 鎖頭(頂面擋齒)
const Q_LOWER = thickLine([[0, 0], q([0.62, BAR.half + 0.175])], 0.08);
const Q_FINGER = rect(0.06, 0.09, ...q([0.62, BAR.half + 0.13])); // 下臂末端往下的指:右面是直的,制動爪正面推它
// C(相對自己的樞軸):往上伸的短爪
const CLICK = thickLine([[0, 0], [0, 0.09]], 0.06); // 短:只勾到 Q 下臂的末端,把 Q 撥開約 8° 就滑脫
const BANK_Q = 0; // Q 靠在擋銷上的角度(解鎖為順時針、負)
const BANK_C = 0; // C 靠在橫桿擋銷上的角度(往一旁倒為逆時針、正)

/** 擺的累計行程 v → 橫桿位移(先往右、再往左) */
export const barShift = (v) => swing(v, -TRAVEL, TRAVEL);
const qAt = (a) => [Q_UPPER, Q_HEAD, Q_LOWER, Q_FINGER].map((p) => placePoly(p, QP, a));
const qLowerAt = (a) => [Q_LOWER, Q_FINGER].map((p) => placePoly(p, QP, a));
const lockAt = (a) => [placePoly(Q_HEAD, QP, a)];
const clickAt = (x, c) => [placePoly(CLICK, [CP[0] + x, CP[1]], c)];
const palletAt = (x) => [rect(I.width, I.top - BAR.half, I.x + x, (I.top + BAR.half) / 2)];
const teethAt = (w) => WHEEL.teeth.map((t) => placePoly(t, W, w));

const RATE = 40;
function step(s, v, dv) {
  const x = barShift(v);
  let { qa, qw, c, cw, w, ww } = s;
  // 1. 制動爪碰到 Q 的下臂。往左擺時,接觸力把制動爪壓在擋銷上、把 Q 往解鎖的方向推:Q 被推開(qa 減少);
  //    往右擺時,接觸力把 Q 壓向它的擋銷(推不動)、把制動爪往一旁推:制動爪倒下(c 增加)
  const clickHit = (cc) => anyOverlap(clickAt(x, cc), qLowerAt(qa));
  const goingLeft = barShift(v) < barShift(v - dv);
  if (clickHit(c)) {
    if (goingLeft) {
      const pushBy = clearance((a) => anyOverlap(clickAt(x, c), qLowerAt(a)), qa, -1, 0.5);
      if (!Number.isFinite(pushBy)) throw new Error(`槓桿 Q 在主動量 ${v.toFixed(4)} 推不開`);
      [qa, qw] = [qa - pushBy, 0];
    } else {
      const yieldBy = clearance(clickHit, c, 1, 1.2);
      if (!Number.isFinite(yieldBy)) throw new Error(`制動爪在主動量 ${v.toFixed(4)} 倒不下`);
      [c, cw] = [c + yieldBy, 0];
    }
  } else if (c > BANK_C) {
    ({ q: c, w: cw } = fall((cc) => anyOverlap(clickAt(x, cc), qLowerAt(qa)), { q: c, w: cw }, { sign: -1, acc: RATE, dt: dv, limit: BANK_C, max: 1.2 }));
  }
  // 2. Q 被彈簧壓回擋銷;落回時碰到制動爪或齒就停
  if (qa < BANK_Q) {
    const qHit = (a) => anyOverlap(clickAt(x, c), qLowerAt(a)) || anyOverlap(lockAt(a), teethAt(w));
    ({ q: qa, w: qw } = fall(qHit, { q: qa, w: qw }, { sign: 1, acc: RATE, dt: dv, limit: BANK_Q, max: 0.5 }));
  }
  // 3. 擒縱輪:被 Q 的鎖頭、叉瓦 I 擋住就停,被推就退,放開時加速轉
  const stops = [...lockAt(qa), ...palletAt(x)];
  ({ q: w, w: ww } = fall((y) => anyOverlap(stops, teethAt(y)), { q: w, w: ww }, { sign: -1, acc: (2 * PITCH) / (0.06 * 4 * TRAVEL) ** 2, dt: dv, max: PITCH }));
  return { qa, qw, c, cw, w, ww };
}

const W0 = (() => {
  const stops = [...lockAt(BANK_Q), ...palletAt(barShift(0))];
  for (let i = 0; i < 96; i++) if (!anyOverlap(stops, teethAt((-PITCH * i) / 96))) return (-PITCH * i) / 96;
  throw new Error("找不到起始齒位");
})();
const run = periodic({ period: 4 * TRAVEL, init: { qa: BANK_Q, qw: 0, c: BANK_C, cw: 0, w: W0, ww: 0 }, step, samples: 1440, snap: { w: PITCH } });

/** 擺的累計行程 v → 橫桿位移、槓桿 Q 被撥開的角度(正)、制動爪倒向一旁的角度(負)、擒縱輪轉角(順時針為負) */
export function detached(v) {
  const s = run.at(v);
  return { x: barShift(v), lever: -s.qa, click: -s.c, wheel: s.w };
}
export const geometry = { TRAVEL };
export const escapement = {
  period: 4 * TRAVEL,
  step: run.advance.w,
  angle: (v) => run.at(v).w,
  at: (v) => {
    const s = run.at(v);
    const x = barShift(v);
    return { teeth: teethAt(s.w), stops: [...lockAt(s.qa), ...palletAt(x)], lever: qAt(s.qa), click: clickAt(x, s.c) };
  },
};

const P_ARC = (sgn) => shape(thickLine(Array.from({ length: 9 }, (_, i) => {
  const t = i / 8;
  return [sgn * (2.7 - 0.35 * Math.sin(Math.PI * t)), -1.6 + 3.2 * t];
}), 0.35));

export default {
  figure: 308,
  parts: [
    {
      id: "wheel",
      kind: "group",
      center: [...W, 0],
      spin: R,
      pieces: [
        { kind: "plate", shape: { outline: WHEEL.outline, holes: WHEEL.holes }, thickness: 0.12 },
        { kind: "cylinder", radius: 0.12, length: 0.2 },
        { kind: "cylinder", radius: 0.05, length: 0.5, at: [0, 0, -0.25] }, // 輪軸,往後伸進機架
        { kind: "cylinder", radius: 0.04, length: 0.16, at: [0.22, 0, 0.04], accent: true },
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(rect(0.6, 0.9, W[0] - 0.05, W[1] + 0.55)), thickness: 0.1, at: [0, 0, -0.5] },
        { kind: "box", size: [0.12, 1.0, 0.1], at: [W[0], W[1] + 0.1 - 0.5, -0.5] },
        { kind: "cylinder", radius: 0.1, inner: 0.05, length: 0.1, at: [W[0], W[1], -0.5] },
        { kind: "box", size: [1.1, 0.12, 0.1], at: [(W[0] + QP[0]) / 2 + 0.05, W[1] - 0.2, -0.5] },
        { kind: "box", size: [0.12, W[1] - 0.2 - QP[1], 0.1], at: [QP[0], (W[1] - 0.2 + QP[1]) / 2, -0.5] },
        { kind: "cylinder", radius: 0.05, length: 0.6, at: [QP[0], QP[1], -0.2] }, // Q 的樞軸銷
        { kind: "cylinder", radius: 0.04, length: 0.3, at: [QP[0] + 0.1, QP[1] + 0.2, -0.05] }, // Q 的擋銷
      ],
    },
    {
      id: "leverQ",
      kind: "group",
      center: [...QP, 0],
      arrow: false,
      label: "Q",
      labelOffset: [0.3, 0.3, 0.3],
      pieces: [
        { kind: "plate", shape: shape(Q_UPPER), thickness: 0.08, at: [0, 0, 0.1] },
        { kind: "plate", shape: shape(Q_HEAD), thickness: 0.2, at: [0, 0, 0.06] }, // 鎖頭,伸到輪那一層
        { kind: "plate", shape: shape(Q_LOWER), thickness: 0.08, at: [0, 0, 0.2] }, // 下臂,在制動爪那一層
        { kind: "plate", shape: shape(Q_FINGER), thickness: 0.08, at: [0, 0, 0.2] },
        { kind: "cylinder", radius: 0.08, inner: 0.05, length: 0.24, at: [0, 0, 0.12] },
      ],
    },
    {
      id: "pendulum",
      kind: "group",
      arrow: false,
      label: "P",
      labelOffset: [-3.0, -1.2, 0.3],
      pieces: [
        { kind: "plate", shape: shape(rect(5.0, 2 * BAR.half, 0, BAR.y)), thickness: 0.1, at: [0, 0, -0.15] },
        { kind: "plate", shape: P_ARC(-1), thickness: 0.12 },
        { kind: "plate", shape: P_ARC(1), thickness: 0.12 },
        { kind: "plate", shape: shape(palletAt(0)[0]), thickness: 0.14, at: [0, 0, 0.0] }, // 叉瓦 I
        { kind: "cylinder", radius: 0.03, length: 0.3, at: [CP[0], CP[1], 0.12] }, // 制動爪的樞軸銷
        { kind: "cylinder", radius: 0.03, length: 0.12, at: [CP[0] + 0.06, CP[1] + 0.04, 0.06] }, // 制動爪的擋銷(在制動爪下面一層的右側;Q 的下臂從上面一層掃過)
      ],
    },
    { id: "click", kind: "group", center: [...CP, 0.2], arrow: false, label: "C", labelOffset: [0.25, -0.15, 0.3], pieces: [{ kind: "plate", shape: shape(CLICK, [circle(0.03).reverse()]), thickness: 0.08 }] },
    { id: "labelI", kind: "group", center: [I.x, I.top - 0.15, 0], label: "I", labelOffset: [-0.25, 0, 0.3] },
    { id: "labelP2", kind: "group", center: [2.7, -1.2, 0], label: "P", labelOffset: [0.4, 0, 0.3] },
  ],
  // 動力重演:只推擺;擒縱輪受固定的力矩(重錘)順時針轉;Q 鉸在機架上、彈簧壓向擋銷;制動爪鉸在橫桿上、彈簧壓向擋銷(只能往一旁倒)
  replay: {
    to: 8 * TRAVEL,
    seconds: 24,
    free: {
      wheel: { pivot: [...W, 0], spring: -1, gravity: false },
      leverQ: { pivot: [...QP, 0], spring: 1, gravity: false, limits: [-0.5, 0] },
      click: { pivot: [...CP, 0.2], on: "pendulum", spring: -1, gravity: false, limits: [0, 1.2] },
    },
    ignore: [["wheel", "frame"], ["leverQ", "frame"]],
    expect: [
      { at: 2 * TRAVEL, part: "wheel", label: "擺往右擺:制動爪倒向一旁,輪不動", quote: "當擺向右返回時,該以樞軸擺動的制動爪會被槓桿推向一旁" },
      { at: 4 * TRAVEL, part: "wheel", label: "擺往左擺:解鎖並給衝量,輪轉一齒", quote: "槓桿 Q 將擒縱輪鎖住,直到即將傳遞衝量的時刻才由連接於擺上的制動爪 C 將其解鎖" },
      { part: "wheel", label: "擺來回兩次,輪轉兩齒" },
    ],
  },
  driver: { part: "pendulum", type: "translation", direction: [1, 0, 0], cycle: [-TRAVEL, TRAVEL] },
  target: "wheel", // 擒縱輪:擒縱讓它一齒一齒地放行
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const s = run.at(v);
    const x = barShift(v);
    return { parts: { pendulum: { position: [x, 0, 0] }, click: { position: [CP[0] + x, CP[1], 0.2], angle: s.c }, leverQ: { angle: s.qa }, wheel: { angle: s.w } }, readouts: [] };
  },
};
