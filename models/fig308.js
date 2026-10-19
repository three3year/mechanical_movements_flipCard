// 第 308 種:分離式擺式擒縱。擺 P 除了接收衝量與解鎖擒縱輪的那一刻之外,都與擒縱輪脫離、自由擺動。
// 只有一個擒縱叉瓦 I(在擺的橫桿上),只在擺向左擺(原圖箭頭)的期間接收衝量;槓桿 Q 鎖住擒縱輪,
// 直到快要傳遞衝量時,才由裝在擺上的制動爪 C 把它撥開解鎖。擺向右返回時,以樞軸擺動的制動爪被槓桿推向一旁。
// 擺每來回一次,擒縱輪轉過一齒。主動件是擺(擺的橫桿左右移動);目標件是擒縱輪(擒縱讓它一齒一齒地放行)。
//
// 照 525 px 原圖的配置:擒縱輪(5 個往前彎的鉤形齒)裝在上方用螺絲固定的托架下端;槓桿 Q 是曲柄形的長槓桿,
// 樞軸(圓頭)在輪的右上方,上臂往左橫在輪頂上、末端的端面擋住輪頂的齒尖,長臂從樞軸斜過輪的前面往下到橫桿上,
// 末端被 C 勾住。C 鉸在橫桿的正面,是一支往左上彎的鉤、往右伸出一條尾巴,兩側各有一根擋銷(原圖 C 下方的兩個黑點)。
// 叉瓦 I 是橫桿正面頂緣下方、用兩根螺絲鎖住的一塊板,右端的端面伸進輪齒經過的那一層。
//
// 由接觸算(models/escapement.js 的 periodic、fall,與第 291 種相同的作法):Q 鉸在托架的臂上,靠彈簧把上臂壓在擋銷上,
// 上臂末端的端面擋住輪頂往右走的齒尖(樞軸和齒尖壓在端面上的點一樣高,齒推端面的力通過樞軸、推不動 Q,解鎖時端面
// 往上抬、不把輪推回);C 靠彈簧把尾巴壓在右邊的擋銷上——往左擺時鉤尖頂著 Q 長臂末端的右側,把長臂往左推、Q 繞樞軸順時針轉,上臂末端抬起(解鎖);長臂末端
// 升過鉤尖就脫開,Q 落回。往右擺時鉤尖碰到長臂末端的左側,C 往一旁倒(鉤尖往左下、從長臂末端底下鑽過,左邊的擋銷限住
// 倒下的角度),Q 被推向擋銷、不動。擒縱輪受重錘的固定力矩順時針轉:解鎖後輪下方往左走的齒尖追上叉瓦 I 的右端、
// 推著它走(衝量),齒尖升過 I 的頂面脫開後,下一齒落到落回的 Q 上。
// 推斷:擺的行程、Q 與 C 的擋銷與彈簧、I 伸進齒尖圓的深度、各零件的前後層次;托架的螺絲把托架鎖在畫面外的機架上
// (原圖只畫托架);Q 的樞軸裝在托架往右伸出的臂上(原圖沒畫,Q 的樞軸在托架外側)。擺的兩根擺桿 P 只畫出彎曲的一段(原圖)。
// 推斷的驅動(原文只說 Q 鎖住輪,沒說輪為什麼轉;共用 weight-drive.js):輪軸往後穿過橫桿的上方,軸上有一個鼓,繩從鼓底
// 往左上拉到托架往左伸出的臂上的滑輪,再垂下吊著重錘(繩與重錘在擺的後面一層;放在輪的左邊,從正面看繩不橫過 Q);
// 重錘的重量就是讓輪順時針轉的固定力矩,輪被 Q 鎖住時重錘也停。擺兩個來回(輪轉兩齒)重錘捲回最高處一次(上鍊,畫面上一下子回到上面)。實物也可能用發條;重錘只是示意。
import { TAU, swing, Y, Z } from "./kit.js";
import { toothedWheel, placePoly, periodic, fall, anyOverlap, clearance } from "./escapement.js";
import { shape, rect, thickLine, circle } from "./shapes.js";
import { plateBar } from "./supports.js";
import { weightDrive, rewound } from "./weight-drive.js";

export const N = 5; // 原圖數得 5 齒(齒尖相隔約 72°)
export const PITCH = TAU / N;
export const TRAVEL = 0.9; // 擺橫桿的單邊行程
const BX = 0.2; // 橫桿在行程中央時的中心(原圖輪心在橫桿中心略左)
const BAR = { half: 0.72, length: 5.0 }; // 橫桿(中心 y = 0)
const W = [0, 1.33]; // 輪心:原圖輪心在橫桿頂緣上方約 0.6
const R = 0.85; // 齒尖圓
const ROOT = 0.2;
const HUB = 0.17; // 輪轂(原圖輪心的圓頭)

// 往前彎的鉤形齒:從輪轂徑向伸出,愈到齒尖愈往轉的方向(順時針,角度小的一側)彎;齒尖在 f = 0
const HOOK = 0.42; // 齒根比齒尖落後的角度(齒距的比例)
const BLADE = 0.065; // 齒根的半寬
const hook = (() => {
  const n = 12;
  const pts = (side) =>
    Array.from({ length: n + 1 }, (_, k) => {
      const u = k / n; // 0 齒根 → 1 齒尖
      const r = ROOT + (R - ROOT) * u;
      const half = (BLADE * (1 - u)) / (r * PITCH);
      return [r, HOOK * (1 - u * u) + side * half];
    });
  const lead = pts(-1); // 前緣(凹):齒根 → 齒尖
  const trail = pts(1).reverse().slice(1); // 後緣(凸):齒尖 → 齒根
  return [...lead, ...trail];
})();
const WHEEL = toothedWheel({ teeth: N, profile: hook, bore: 0.05 });

// 叉瓦 I:橫桿正面的一塊板(相對行程中央的橫桿),右端的端面伸進齒尖圓 0.025
const I = { right: 0.4, width: 1.0, top: W[1] - R + 0.025, height: 0.22 };
const PALLET = rect(I.width, I.height, I.right - I.width / 2, I.top - I.height / 2);

// 槓桿 Q(相對樞軸):樞軸在輪的右上方;上臂往左橫在輪頂上,末端的端面(x ≈ LOCK_X)擋住齒尖
const QP = [0.69, W[1] + 0.85]; // 和齒尖頂著端面的點一樣高
const LOCK_X = 0.06;
const ARM_LOW = W[1] + 0.795; // 上臂的下緣
const q = (p) => [p[0] - QP[0], p[1] - QP[1]];
// 上臂:下緣在 ARM_LOW、厚 0.13;末端的端面是以樞軸為圓心的圓弧(和齒尖接觸的地方幾乎垂直),Q 抬起時端面沿自己滑開、不把輪推回
const Q_UPPER = (() => {
  const [lo, hi] = [ARM_LOW - QP[1], ARM_LOW + 0.13 - QP[1]];
  const L = QP[0] - LOCK_X;
  const face = Array.from({ length: 9 }, (_, i) => {
    const y = hi + ((lo - hi) * i) / 8;
    return [-Math.sqrt(L * L - y * y), y];
  });
  return [[0, lo], [0, hi], ...face];
})();
const Q_HEAD = circle(0.1); // 樞軸的圓頭
const Q_END = [-0.26, -0.08]; // 長臂末端(C 勾住的地方)
const Q_LONG = thickLine([[0, 0], q(Q_END)], 0.1);
const Q_BANK = { at: [0.55, ARM_LOW - 0.035], r: 0.035 }; // Q 的擋銷:頂著上臂的下緣(在齒尖圓外)

// 制動爪 C(相對自己的樞軸):往左下再往上彎的鉤,鉤尖頂著 Q 長臂末端;往右的尾巴靠在右邊的擋銷上
const CP = [0.09, -0.28]; // 相對行程中央的橫桿
const C_TIP = [-0.32, 0.24];
const C_HOOK = thickLine([[0, 0], [-0.16, -0.05], [-0.28, 0.0], [-0.33, 0.12], C_TIP], 0.08);
const C_NIB = circle(0.04, ...C_TIP);
const C_TAIL = rect(0.45, 0.14, 0.225, 0);
const C_BOSS = circle(0.07);
const C_BANK = { at: [0.31, -0.07 - 0.045], r: 0.045 }; // 尾巴下面的擋銷(相對 C 的樞軸;原圖的點離尾巴約 0.1,移上來貼著尾巴,C 才靠得住)
const C_STOP = { at: [-0.41, -0.08], r: 0.045 }; // 鉤左下方的擋銷(原圖的位置):限住 C 往一旁倒的角度(約 0.41 rad;往右擺時實際倒約 0.28 rad)
const BANK_Q = 0; // Q 靠在擋銷上的角度(解鎖為順時針、負)
const BANK_C = 0; // C 靠在擋銷上的角度(往一旁倒為逆時針、正)

const disc = ({ at, r }, [dx, dy] = [0, 0]) => circle(r, at[0] + dx, at[1] + dy);
const clickPolys = [C_HOOK, C_NIB, C_TAIL, C_BOSS];
/** C 往一旁倒,鉤碰到左邊擋銷的角度 */
const C_YIELD = clearance((c) => !anyOverlap(clickPolys.map((p) => placePoly(p, [0, 0], c)), [disc(C_STOP)]), 0, 1, 2);

/** 擺的累計行程 v → 橫桿位移(先往右、再往左) */
export const barShift = (v) => swing(v, -TRAVEL, TRAVEL);
const qAt = (a) => [Q_UPPER, Q_HEAD, Q_LONG].map((p) => placePoly(p, QP, a));
const qLongAt = (a) => [placePoly(Q_LONG, QP, a)];
const lockAt = (a) => [placePoly(Q_UPPER, QP, a)];
const clickAt = (x, c) => [C_HOOK, C_NIB, C_TAIL].map((p) => placePoly(p, [CP[0] + x, CP[1]], c));
const palletAt = (x) => [PALLET.map(([px, py]) => [px + x, py])];
const teethAt = (w) => WHEEL.teeth.map((t) => placePoly(t, W, w));

const RATE = 40;
function step(s, v, dv) {
  const x = barShift(v);
  let { qa, qw, c, cw, w, ww } = s;
  // 1. 制動爪碰到 Q 的長臂末端。往左擺時,接觸力把制動爪壓在擋銷上、把 Q 往解鎖的方向推:Q 被推開(qa 減少);
  //    往右擺時,接觸力把 Q 壓向它的擋銷(推不動)、把制動爪往一旁推:制動爪倒下(c 增加)
  const clickHit = (cc) => anyOverlap(clickAt(x, cc), qLongAt(qa));
  const goingLeft = barShift(v) < barShift(v - dv);
  let pushed = false;
  if (clickHit(c)) {
    if (goingLeft) {
      const pushBy = clearance((a) => anyOverlap(clickAt(x, c), qLongAt(a)), qa, -1, 0.5);
      if (!Number.isFinite(pushBy)) throw new Error(`槓桿 Q 在主動量 ${v.toFixed(4)} 推不開`);
      [qa, qw, pushed] = [qa - pushBy, 0, true];
    } else {
      const yieldBy = clearance(clickHit, c, 1, C_YIELD - c);
      if (!Number.isFinite(yieldBy)) throw new Error(`制動爪在主動量 ${v.toFixed(4)} 倒到擋銷上還讓不開`);
      [c, cw] = [c + yieldBy, 0];
    }
  } else if (c > BANK_C) {
    ({ q: c, w: cw } = fall((cc) => anyOverlap(clickAt(x, cc), qLongAt(qa)), { q: c, w: cw }, { sign: -1, acc: RATE, dt: dv, limit: BANK_C, max: C_YIELD }));
  }
  // 2. 沒被制動爪推著時,Q 被彈簧壓回擋銷;落回時碰到制動爪或齒就停(Q 被推開時上臂末端略往左,把齒推回一點,由 3 處理)
  if (qa < BANK_Q && !pushed) {
    const qHit = (a) => anyOverlap(clickAt(x, c), qLongAt(a)) || anyOverlap(lockAt(a), teethAt(w));
    ({ q: qa, w: qw } = fall(qHit, { q: qa, w: qw }, { sign: 1, acc: RATE, dt: dv, limit: BANK_Q, max: 0.5 }));
  }
  // 3. 擒縱輪:被 Q 上臂的端面、叉瓦 I 擋住就停,被推就退,放開時加速轉
  const stops = [...lockAt(qa), ...palletAt(x)];
  ({ q: w, w: ww } = fall((y) => anyOverlap(stops, teethAt(y)), { q: w, w: ww }, { sign: -1, acc: (2 * PITCH) / (0.06 * 4 * TRAVEL) ** 2, dt: dv, max: PITCH }));
  return { qa, qw, c, cw, w, ww };
}

const W0 = (() => {
  const stops = [...lockAt(BANK_Q), ...palletAt(barShift(0))];
  for (let i = 0; i < 96; i++) if (!anyOverlap(stops, teethAt((-PITCH * i) / 96))) return (-PITCH * i) / 96;
  throw new Error("找不到起始齒位");
})();
const run = periodic({ period: 4 * TRAVEL, init: { qa: BANK_Q, qw: 0, c: BANK_C, cw: 0, w: W0, ww: 0 }, step, samples: 1440, snap: { w: PITCH }, forward: { w: -1 } }); // forward:抹平折線近似造成的萬分之幾弧度的數值回退 // forward:抹平折線近似造成的萬分之幾弧度的數值回退

/** 擺的累計行程 v → 橫桿位移、槓桿 Q 被撥開的角度(正)、制動爪倒向一旁的角度(負)、擒縱輪轉角(順時針為負) */
export function detached(v) {
  const s = run.at(v);
  return { x: barShift(v), lever: -s.qa, click: -s.c, wheel: s.w };
}

// 前後層次(z):Q 的長臂與 C 在最前面;輪與 Q 的上臂、叉瓦 I 的端面同一層;擺的橫桿在輪的後面;鼓、繩與重錘在橫桿後面;托架最後
const Z_FRONT = 0.14; // Q 的長臂、C(厚 0.08)
const Z_BAR = -0.2; // 橫桿與兩條彎條 P(厚 0.12)
const Z_DRUM = -0.42; // 鼓、繩、滑輪、重錘
const Z_BRACKET = -0.62; // 托架(厚 0.1)

// 推斷的重錘驅動:鼓套在輪軸上(在橫桿後面),繩從鼓底往左上拉到滑輪頂上(輪往前轉時鼓底往左走、放出繩),再從滑輪左側垂下吊重錘
const ROPE_R = 0.03;
const DRUM_R = 0.12;
const DRUM = { center: [...W, Z_DRUM], axis: Z, radius: DRUM_R + ROPE_R, sense: -1 }; // 輪往前(順時針)轉時繩從鼓上放出
const PULLEY_R = 0.12;
const PULLEY = { center: [-1.15, W[1] + 0.7, Z_DRUM], axis: Z, radius: PULLEY_R + ROPE_R, sense: -1 };
const REWIND = 2 * 4 * TRAVEL; // 擺兩個來回(輪轉兩齒)上鍊一次
const WEIGHT = { radius: 0.12, height: 0.34 };
const hang = weightDrive({
  drum: DRUM,
  pulleys: [PULLEY],
  eye: [PULLEY.center[0] - PULLEY.radius, W[1] + 0.45, Z_DRUM],
  reserve: DRUM.radius * 2 * PITCH,
  spare: TAU * DRUM.radius,
  pitch: 2 * ROPE_R,
});
const weightAt = rewound(hang, (v) => -run.at(v).w, REWIND); // 輪往前(順時針)轉的角度

export const geometry = { TRAVEL, W, R, QP, CP, Q_BANK, C_BANK, C_STOP, C_YIELD, DRUM, REWIND, Z_FRONT, Z_BAR };
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

// 兩條彎條 P(原圖只畫出中段,上下端是撕開的斷口),和橫桿同一層、兩端伸進彎條
const P_ARC = (sgn) => shape(thickLine(Array.from({ length: 9 }, (_, i) => {
  const t = i / 8;
  return [BX + sgn * (2.68 - 0.35 * Math.sin(Math.PI * t)), -1.25 + 3.55 * t];
}), 0.35));
const BRACKET = [[-0.37, W[1] + 1.17], [0.43, W[1] + 1.17], [0.17, W[1]], [-0.17, W[1]]]; // 托架往下收窄到輪心

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
        { kind: "cylinder", radius: HUB, length: 0.16 }, // 輪轂
        { kind: "cylinder", radius: 0.05, length: -Z_BRACKET + 0.05, at: [0, 0, (Z_BRACKET - 0.05) / 2] }, // 輪軸,往後穿過鼓伸進托架
        { kind: "cylinder", radius: DRUM_R, length: 0.16, at: [0, 0, Z_DRUM] }, // 繞繩的鼓(推斷)
        { kind: "cylinder", radius: 0.03, length: 0.04, at: [0.1, 0, 0.09], accent: true },
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 托架:上端用螺絲固定的方塊,往下收窄到輪心(原圖);輪軸插進下端的凸台
        { kind: "plate", shape: shape(rect(0.8, 0.75, 0.03, W[1] + 1.545)), thickness: 0.1, at: [0, 0, Z_BRACKET] },
        { kind: "plate", shape: shape(BRACKET), thickness: 0.1, at: [0, 0, Z_BRACKET] },
        { kind: "cylinder", radius: 0.17, length: 0.16, at: [W[0], W[1], Z_BRACKET] },
        { kind: "cylinder", radius: 0.17, length: 0.06, at: [0.03, W[1] + 1.56, Z_BRACKET + 0.08], accent: true }, // 固定托架的螺絲
        // 托架往右伸出的臂(推斷):Q 的樞軸;往左伸出的臂(推斷):滑輪的軸
        ...plateBar({ points: [[0.3, QP[1]], QP], z: Z_BRACKET, width: 0.14, boss: 0.1 }),
        ...plateBar({ points: [[-0.2, W[1] + 0.9], PULLEY.center], z: Z_BRACKET, width: 0.14, boss: 0.1 }),
        { kind: "cylinder", radius: 0.04, length: Z_FRONT + 0.06 - Z_BRACKET, at: [...QP, (Z_FRONT + 0.06 + Z_BRACKET) / 2] }, // Q 的樞軸銷
        { kind: "cylinder", radius: Q_BANK.r, length: 0.05 - Z_BRACKET, at: [...Q_BANK.at, (0.05 + Z_BRACKET) / 2] }, // Q 的擋銷,往後伸到托架的臂
        { kind: "box", size: [0.1, QP[1] - Q_BANK.at[1], 0.1], at: [Q_BANK.at[0], (QP[1] + Q_BANK.at[1]) / 2, Z_BRACKET] },
        { kind: "cylinder", radius: 0.035, length: Z_DRUM + 0.1 - Z_BRACKET, at: [PULLEY.center[0], PULLEY.center[1], (Z_DRUM + 0.1 + Z_BRACKET) / 2] }, // 滑輪的軸
      ],
    },
    {
      id: "leverQ",
      kind: "group",
      center: [...QP, 0],
      arrow: false,
      label: "Q",
      labelOffset: [Q_END[0] - QP[0] - 0.3, Q_END[1] - QP[1] - 0.05, 0.3],
      pieces: [
        { kind: "plate", shape: shape(Q_UPPER), thickness: 0.1 }, // 上臂,和輪同一層:末端的端面擋住齒尖
        { kind: "plate", shape: shape(Q_LONG), thickness: 0.08, at: [0, 0, Z_FRONT] }, // 長臂,斜過輪的前面
        { kind: "cylinder", radius: 0.1, inner: 0.045, length: Z_FRONT + 0.04 + 0.05, at: [0, 0, (Z_FRONT + 0.04 - 0.05) / 2] }, // 樞軸的圓頭,連起兩層
      ],
    },
    {
      id: "pendulum",
      kind: "group",
      arrow: false,
      label: "P",
      labelOffset: [BX - 3.2, -1.0, 0.3],
      pieces: [
        { kind: "plate", shape: shape(rect(BAR.length, 2 * BAR.half, BX, 0)), thickness: 0.12, at: [0, 0, Z_BAR] },
        { kind: "plate", shape: P_ARC(-1), thickness: 0.12, at: [0, 0, Z_BAR] },
        { kind: "plate", shape: P_ARC(1), thickness: 0.12, at: [0, 0, Z_BAR] },
        { kind: "plate", shape: shape(PALLET), thickness: 0.2, at: [0, 0, -0.04] }, // 叉瓦 I:從橫桿正面伸到輪那一層
        ...[-0.75, -0.15].map((dx) => ({ kind: "cylinder", radius: 0.045, length: 0.03, at: [I.right + dx, I.top - I.height / 2, 0.075] })), // 鎖住 I 的螺絲
        { kind: "cylinder", radius: 0.03, length: Z_FRONT + 0.06 - Z_BAR, at: [...CP, (Z_FRONT + 0.06 + Z_BAR) / 2] }, // C 的樞軸銷
        ...[C_BANK, C_STOP].map((b) => ({ kind: "cylinder", radius: b.r, length: Z_FRONT + 0.04 - Z_BAR, at: [CP[0] + b.at[0], CP[1] + b.at[1], (Z_FRONT + 0.04 + Z_BAR) / 2] })), // C 兩側的擋銷
      ],
    },
    { id: "click", kind: "group", center: [...CP, Z_FRONT], arrow: false, label: "C", labelOffset: [0.05, 0.3, 0.3], pieces: [{ kind: "plate", shape: shape(C_HOOK, []), thickness: 0.08 }, { kind: "plate", shape: shape(C_NIB), thickness: 0.08 }, { kind: "plate", shape: shape(C_TAIL), thickness: 0.08 }, { kind: "plate", shape: shape(C_BOSS, [circle(0.03).reverse()]), thickness: 0.08 }] },
    { id: "pulley", kind: "pulley", style: "disc", center: PULLEY.center, axis: Z, radius: PULLEY_R, width: 0.08, arrow: false },
    { id: "rope", kind: "rope", radius: ROPE_R },
    { id: "weight", kind: "weight", axis: Y, radius: WEIGHT.radius, height: WEIGHT.height },
    { id: "labelI", kind: "group", center: [I.right, I.top - I.height / 2, 0], label: "I", labelOffset: [0.2, 0, 0.3] },
    { id: "labelP2", kind: "group", center: [BX + 2.68, -1.0, 0], label: "P", labelOffset: [0.4, 0, 0.3] },
  ],
  // 動力重演:只推擺;擒縱輪受固定的力矩(重錘)順時針轉(以彈簧代替;重錘、滑輪照模型的姿勢走);Q 鉸在托架的臂上、彈簧壓向擋銷;
  // 制動爪鉸在橫桿上、彈簧把尾巴壓向右邊的擋銷(只能往一旁倒,倒到左邊的擋銷為止)
  replay: {
    to: 8 * TRAVEL,
    seconds: 24,
    free: {
      wheel: { pivot: [...W, 0], spring: -1, gravity: false },
      leverQ: { pivot: [...QP, 0], spring: 1, gravity: false, limits: [-0.5, 0] },
      click: { pivot: [...CP, Z_FRONT], on: "pendulum", spring: -1, gravity: false, limits: [0, C_YIELD] },
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
    const hung = weightAt(v);
    const eye = hung.eye;
    return {
      parts: {
        pendulum: { position: [x, 0, 0] },
        click: { position: [CP[0] + x, CP[1], Z_FRONT], angle: s.c },
        leverQ: { angle: s.qa },
        wheel: { angle: s.w },
        pulley: { angle: hung.pulleys[0] },
        weight: { position: [eye[0], eye[1] - WEIGHT.height / 2 - WEIGHT.radius * 0.38, eye[2]] },
      },
      paths: { rope: { points: hung.rope, closed: false, phase: 0 } },
      readouts: [],
    };
  },
};
