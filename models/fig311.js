// 第 311 種:雙三腳式重力擒縱。兩個三腳鎖定輪 A、B、C 與 a、b、c 裝在同一根軸上(一前一後),兩輪之間是一組抬升銷,
// 間距寬到能讓擒縱叉瓦位於兩輪之間;第一個鎖定輪的齒由一個叉瓦上的止動齒 D 擋住,另一個鎖定輪的齒由另一個叉瓦上的
// 止動齒 E 擋住。兩個叉瓦臂從上方的兩個樞軸垂下(菱形),擺桿夾在兩臂下端之間:擺每擺一次推開一個臂、放開一個止動齒,
// 擒縱輪轉過六分之一圈,抬升銷再把另一個臂抬起;臂落下時以重量給擺衝量。軸上的長條(FLY)是調速用的風扇,
// 跟著擒縱輪一起轉,讓它轉得平穩。主動件是擺;目標件是擒縱輪(擒縱讓它一格一格地放行)。
//
// 照 525 px 原圖排(2026-10-16 決定):兩臂在兩輪之間那一層(叉瓦與抬升銷也在這一層),兩輪的腳錯開 60°;
// D 在右臂的肘角、裝在臂的正面,伸到前輪那一層;E 在左臂的肘角、裝在臂的背面(原圖畫成虛線),伸到後輪那一層。
// 原圖 A 的腳尖由上往下壓在 D 的上端、後輪的腳由下往上頂到 E 的下端,所以輪受重錘的固定力矩順時針轉:
// 前輪的腳轉到輪心右上方約 30° 被 D 擋住,再轉 60° 換後輪的腳到左上方約 150° 被 E 擋住,如此輪流。
//
// 由接觸算(models/escapement.js 的 periodic、gravityArm、clearance、approach):兩支臂靠重量往內倒、靠在擋銷上。
// 兩輪之間的抬升銷碰到臂上的叉瓦(右臂的在輪心右上、左臂的在左下)就把臂往外抬,接著它那一邊的止動齒擋住腳、
// 輪停住,抬起的臂由銷托著。擺往外推那支臂的下端,止動齒滑開腳尖,輪轉六分之一圈,銷再抬起另一支臂;
// 擺回來時被推開的臂壓在擺上、貼著擺一起落回,直到靠上擋銷才和擺分開(由臂的重量推擺,這就是衝量)。
// 止動齒擋腳的面是以臂的軸為圓心的弧,腳壓在上面的力通過臂的軸,推不開臂;臂往外擺時這個面沿著自己滑開。
// 動力重演:兩支臂與擒縱輪都是自由零件(擋銷另成一個零件);放開後輪加速、抬升銷撞開臂,重演做不出來,寫成豁免(原因見 REPLAY_WAIVER)。
// 推斷:擺幅、各部尺寸;叉瓦、抬升銷的形狀與相位(原圖只看得出叉瓦在輪心右上與左下);兩輪內側夾著抬升銷的輪轂盤;
// 輪軸、兩臂的軸裝在後面的機架上,兩臂的擋銷立在機架的橫條上(原圖都沒畫)。
// 推斷的擺(原圖只畫了上方的懸掛彈簧與下端夾在兩臂之間的一段):擺掛在機架頂端背面的懸掛座上,擺桿在機架後面往下
// (不蓋住輪),下端是擺錘;在兩臂下端的高度往前伸出撥叉,夾在兩臂的擺銷之間。
// 推斷的驅動(原文只說止動齒擋住輪,沒說輪為什麼轉;共用 weight-drive.js):輪軸上、後輪的背面有一個鼓,繩從鼓頂往右
// 拉到機架托臂上的滑輪,再垂下吊著重錘;重錘的重量就是讓輪順時針轉的固定力矩,輪被止動齒擋住時重錘也停。
// 擺兩個來回(輪轉三分之二圈)重錘捲回最高處一次(上鍊)。實物也可能用發條;重錘只是示意。
import { TAU, deg, swing, Y, Z as ZAXIS } from "./kit.js";
import { placePoly, periodic, anyOverlap, clearance, approach, gravityArm } from "./escapement.js";
import { weightDrive, rewound } from "./weight-drive.js";
import { shape, thickLine, circle, rect } from "./shapes.js";
import { circlePolygon } from "./contact.js";

export const STEP = TAU / 6;
export const SWING = deg(3.2);
const W = [0, 0];
const LEG = 1.4;
const PIV = { right: [0.115, 3.2], left: [-0.115, 3.2] }; // 兩臂的軸(原圖在擺的懸掛點兩旁)
const PEND = [0, 3.2];
const BEAT_Y = -2.95; // 兩臂下端(擺銷)的高度
const PIN = { r: 0.25, size: 0.045 }; // 兩輪之間的抬升銷
const BETA = deg(10); // 抬升銷相對前輪腳的方位
const ROD = 0.16; // 撥叉寬
const GAP = 0.04; // 臂落到底時擺銷與撥叉的空隙
const BEAT_R = 0.05;
const LIFT = 0.025; // 抬升銷把臂抬起的角度(輪鎖住時)
const LOCK = 0.03; // 止動齒蓋住腳尖的深度(擺再把臂推開這麼多,腳就放開)
// D 擋住前輪腳時腳的方位(腳根的方向;鎖住時腳的中線約在 30°、彎過的腳尖約在 27°,原圖約 29°);E 擋住後輪腳時的方位
// 和它差 120°(兩個叉瓦對輪心點對稱,托著它們的抬升銷才對得上)
const LOCK_D = deg(32);
const LOCK_E = LOCK_D + TAU / 3;
const Z = { front: 0.25, back: -0.25, arm: 0, plate: -0.9, pend: -1.2, fly: 0.47 };

// 腳(局部座標):前輪 A、C、B 在 0°、120°、240°,後輪 a、c、b 在 60°、180°、300°(錯開 60°)。
// 腳的外段往前(順時針)彎(原圖的腳是彎的):腳尖的前緣角最先碰到止動齒的弧面,鎖住時接觸點落在以臂軸為圓心的弧上,
// 腳推不開臂、臂往外擺時腳也不會沿著止動齒的邊往前滑(直的腳是腳的側邊靠在止動齒的內端角上)
const BEND = deg(12);
const KNEE_R = 0.95; // 腳開始彎的半徑
const LEG_TIP = (() => {
  const u = [Math.cos(-BEND), Math.sin(-BEND)];
  const l = -KNEE_R * u[0] + Math.sqrt((KNEE_R * u[0]) ** 2 - KNEE_R ** 2 + LEG ** 2); // 腳尖中心在半徑 LEG 上
  const c = [KNEE_R + l * u[0], l * u[1]];
  const n = [-u[1], u[0]];
  // 腳尖斜切成尖:前緣角是腳上離輪心最遠的一點(後緣角往回縮),止動齒滑過前緣角就完全放開,不會再被腳尖的端面拖著
  return { lead: [c[0] - 0.03 * n[0], c[1] - 0.03 * n[1]], trail: [c[0] + 0.03 * n[0] - 0.06 * u[0], c[1] + 0.03 * n[1] - 0.06 * u[1]] };
})();
const LEG_SHAPE = [[0.06, -0.06], [KNEE_R, -0.05], LEG_TIP.lead, LEG_TIP.trail, [KNEE_R, 0.05], [0.06, 0.06]];
const turn = (a) => ([x, y]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
const legPoly = (a) => LEG_SHAPE.map(turn(a));
const FRONT = [0, 1, 2].map((i) => legPoly((i * TAU) / 3));
const BACK = [0, 1, 2].map((i) => legPoly((i * TAU) / 3 + TAU / 6));
// 三根銷是同一個多邊形轉 120°(各自做多邊形時折線的角對叉瓦的方位不同,三根銷抬起臂的角度差一點,週期接不上)
const PIN0 = circlePolygon([PIN.r * Math.cos(BETA), PIN.r * Math.sin(BETA)], PIN.size, 12);
const PINS = [0, 1, 2].map((i) => PIN0.map(turn((i * TAU) / 3)));

// 世界座標的點(臂抬起 lift 時)換成臂的局部座標
const toArm = (pivot, lift) => (pts) =>
  pts.map(([x, y]) => {
    const [u, v] = [x - pivot[0], y - pivot[1]];
    return [u * Math.cos(-lift) - v * Math.sin(-lift), u * Math.sin(-lift) + v * Math.cos(-lift)];
  });
// 止動齒:擋腳的面是以臂的軸為圓心、通過腳尖前緣角的弧(腳順時針轉到 lock 時);out 是臂往外抬時這個弧在臂軸周圍
// 轉的方向(右臂逆時針 +1、左臂順時針 −1),弧從蓋住腳尖 LOCK 的內端伸到外端;塊身沿腳前進的方向(往外偏)伸出
const stopBlock = (pivot, lock, out, lift) => {
  const tip = turn(lock)(LEG_TIP.lead);
  const rho = Math.hypot(tip[0] - pivot[0], tip[1] - pivot[1]);
  const at = Math.atan2(tip[1] - pivot[1], tip[0] - pivot[0]);
  const face = Array.from({ length: 33 }, (_, i) => {
    const a = at + (out * (-LOCK + ((LOCK + 0.16) * i) / 32)) / rho;
    return [pivot[0] + rho * Math.cos(a), pivot[1] + rho * Math.sin(a)];
  });
  const u = [Math.cos(lock - deg(70)), Math.sin(lock - deg(70))]; // 腳前進的方向往外偏 20°:放開後腳從塊身內側經過,不擦著它
  const body = face.map(([x, y]) => [x + 0.14 * u[0], y + 0.14 * u[1]]).reverse();
  return toArm(pivot, lift)([...face, ...body]);
};
const STOP_D = stopBlock(PIV.right, LOCK_D, 1, LIFT);
const STOP_E = stopBlock(PIV.left, LOCK_E, -1, -LIFT);
// 叉瓦:輪鎖在 D 上時(前輪 0° 的腳在 LOCK_D),托著右臂的銷在 BETA + LOCK_D;右臂的叉瓦左面正好靠在它右邊,下緣在銷心下方一點
// (放開後銷往右下走,很快從叉瓦下方離開,不會把被擺推開的臂再往外抬)。左臂的叉瓦和它對輪心點對稱
const HOLD = BETA + LOCK_D;
const PALLET = (() => {
  const c = [PIN.r * Math.cos(HOLD), PIN.r * Math.sin(HOLD)];
  return rect(0.1, 0.15, c[0] + PIN.size + 0.05, c[1] - 0.01 + 0.075);
})();
const FACE_R = toArm(PIV.right, LIFT)(PALLET);
const FACE_L = toArm(PIV.left, -LIFT)(PALLET.map(([x, y]) => [-x, -y]));
// 擺銷(臂的下端,撥叉兩側)
const BEAT = { right: [ROD / 2 + GAP + BEAT_R, BEAT_Y], left: [-ROD / 2 - GAP - BEAT_R, BEAT_Y] };
const BEAT_RL = toArm(PIV.right, 0)([BEAT.right])[0];
const BEAT_LL = toArm(PIV.left, 0)([BEAT.left])[0];

/** 擺累計擺動 v → 擺角 */
export const pendulumAngle = (v) => swing(v, -SWING, SWING);
const FINGER = 0.4; // 撥叉夾在兩擺銷之間那一段的高
const rodAt = (p) => [placePoly(rect(ROD, FINGER, 0, BEAT_Y - PEND[1]), PEND, p)];
const armR = (a) => ({ face: [placePoly(FACE_R, PIV.right, a)], stop: [placePoly(STOP_D, PIV.right, a)], beat: [placePoly(circlePolygon(BEAT_RL, BEAT_R, 12), PIV.right, a)] });
const armL = (b) => ({ face: [placePoly(FACE_L, PIV.left, b)], stop: [placePoly(STOP_E, PIV.left, b)], beat: [placePoly(circlePolygon(BEAT_LL, BEAT_R, 12), PIV.left, b)] });
const frontAt = (w) => FRONT.map((l) => placePoly(l, W, w));
const backAt = (w) => BACK.map((l) => placePoly(l, W, w));
const pinsAt = (w) => PINS.map((p) => placePoly(p, W, w));

const RATE = 30; // 臂沒靠在擺上時落回的角加速度(重力)
function step(s, v, dv) {
  const rod = rodAt(pendulumAngle(v));
  const prev = rodAt(pendulumAngle(v - dv));
  let { a, aw, b, bw, w, ww } = s;
  // 擺推擺銷(右臂往外是逆時針、a 增加;左臂往外是順時針、b 減少);擺返回時臂貼著擺落回,碰到擋銷(0)或抬升銷才停
  const p = pinsAt(w);
  ({ q: a, w: aw } = gravityArm({ beat: (x, r) => anyOverlap(r, armR(x).beat), rest: (x) => anyOverlap(armR(x).face, p) }, { q: a, w: aw }, { rod, prev, sign: -1, acc: RATE, dt: dv, limit: 0, max: 0.3 }));
  ({ q: b, w: bw } = gravityArm({ beat: (x, r) => anyOverlap(r, armL(x).beat), rest: (x) => anyOverlap(armL(x).face, p) }, { q: b, w: bw }, { rod, prev, sign: 1, acc: RATE, dt: dv, limit: 0, max: 0.3 }));
  // 止動齒只擋自己那一個鎖定輪的腳(D 擋前輪、E 擋後輪)
  const blockedBy = (na, nb, x) => anyOverlap(armR(na).stop, frontAt(x)) || anyOverlap(armL(nb).stop, backAt(x));
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
  if (blockedBy(a, b, w)) [w, ww] = [w + clearance((x) => blockedBy(a, b, x), w, 1, STEP), 0];
  const dist = (ww + ((2 * STEP) / (0.06 * 4 * SWING) ** 2) * dv) * dv;
  const reached = approach((x) => lift(x) == null, w, -1, dist, 16);
  const r = lift(reached) ?? { na: a, nb: b };
  [a, b] = [r.na, r.nb];
  ww = (w - reached) / dv;
  w = reached;
  return { a, aw, b, bw, w, ww };
}

const W0 = (() => {
  for (let i = 0; i < 96; i++) {
    const x = (-STEP * 2 * i) / 96;
    if (!anyOverlap(armR(0).stop, frontAt(x)) && !anyOverlap(armL(0).stop, backAt(x)) && !anyOverlap([...armR(0).face, ...armL(0).face], pinsAt(x))) return x;
  }
  throw new Error("找不到起始位置");
})();
const run = periodic({ period: 4 * SWING, init: { a: 0, aw: 0, b: 0, bw: 0, w: W0, ww: 0 }, step, samples: 720, snap: { w: STEP * 2 }, forward: { w: -1 } });

/** 擺累計擺動 v → 擺角、左右叉瓦抬起的角度(正值)、擒縱輪轉角(順時針為負) */
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
    const f = frontAt(s.w);
    const k = backAt(s.w);
    const p = pinsAt(s.w);
    return {
      teeth: [...f, ...k, ...p],
      layers: [...f.map(() => "front"), ...k.map(() => "back"), ...p.map(() => "mid")],
      stops: [...armR(s.a).stop, ...armL(s.b).stop, ...armR(s.a).face, ...armL(s.b).face],
      stopLayers: ["front", "back", "mid", "mid"],
      rod: rodAt(pendulumAngle(v)),
      beats: [...armR(s.a).beat, ...armL(s.b).beat],
    };
  },
};

// 臂(相對各自的軸,在兩輪之間那一層):菱形的一邊——從軸往外到肘角、再往內收到下端的擺銷;肘角上的止動齒
// (D 在正面、E 在背面)、從臂往內伸到叉瓦的三角形框
const KNEE = [1.36, 0.52]; // 右臂的肘角(左臂對稱)
const ARM_W = 0.16;
const armPieces = (pivot, sgn, stop, face, beat, stopZ) => {
  const rel = ([x, y]) => [x - pivot[0], y - pivot[1]];
  const knee = rel([sgn * KNEE[0], KNEE[1]]);
  const along = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  const xs = face.map((q) => q[0]);
  const outer = sgn > 0 ? Math.max(...xs) : Math.min(...xs);
  const ys = face.map((q) => q[1]);
  const root = [outer, (Math.min(...ys) + Math.max(...ys)) / 2]; // 三角形框接在叉瓦外側的中點
  const start = along([0, 0], knee, 0.05 / Math.hypot(...knee)); // 臂身從轂下方一點開始(兩臂的軸只隔 0.23,臂身寬,不能都畫到軸心)
  return [
    { kind: "plate", shape: shape(thickLine([start, knee, beat], ARM_W)), thickness: 0.08, at: [0, 0, Z.arm] },
    { kind: "plate", shape: shape(circle(0.07), [circle(0.05).reverse()]), thickness: 0.08, at: [0, 0, Z.arm] }, // 臂的轂
    { kind: "plate", shape: shape(stop), thickness: 0.24, at: [0, 0, stopZ] }, // 止動齒(貼在臂的正面 / 背面,伸到它擋的那一個鎖定輪那一層)
    { kind: "plate", shape: shape(thickLine([along([0, 0], knee, 0.62), root, along(knee, beat, 0.4)], 0.07)), thickness: 0.08, at: [0, 0, Z.arm] }, // 往內伸到叉瓦的三角形框
    { kind: "plate", shape: shape(face), thickness: 0.14, at: [0, 0, Z.arm] }, // 叉瓦(兩輪之間)
    { kind: "cylinder", radius: BEAT_R, length: 0.24, at: [beat[0], beat[1], Z.arm - 0.1] }, // 擺銷,往後伸到撥叉那一層
    { kind: "cylinder", radius: 0.05, length: 0.04 - (Z.plate - 0.04), at: [0, 0, (0.04 + Z.plate - 0.04) / 2] }, // 臂的軸,往後伸進機架
  ];
};

// 兩臂的擋銷(推斷):在各臂上段的內側,臂落到底(角度 0)時正好貼著;立在機架前面的橫條上
const BANK_R = 0.04;
const bank = (pivot, sgn) => {
  const knee = [sgn * KNEE[0], KNEE[1]];
  const len = Math.hypot(knee[0] - pivot[0], knee[1] - pivot[1]);
  const t = [(knee[0] - pivot[0]) / len, (knee[1] - pivot[1]) / len];
  const n = sgn > 0 ? [t[1], -t[0]] : [-t[1], t[0]]; // 臂往內倒時上段移動的方向(右臂順時針、左臂逆時針)
  const d = ARM_W / 2 + BANK_R;
  return [pivot[0] + 0.6 * t[0] + d * n[0], pivot[1] + 0.6 * t[1] + d * n[1]];
};
const BANKS = [bank(PIV.right, 1), bank(PIV.left, -1)];

// 推斷的擺:在機架後面(Z.pend),懸點的銷插進機架頂端背面的懸掛座;撥叉在兩臂下端的高度往前伸到擺銷那一層
const FORK_Z = [-0.2, -0.06];
const BOB = { y: BEAT_Y - PEND[1] - 1.0, r: 0.38 };
const pendulumPieces = [
  { kind: "cylinder", radius: 0.09, length: 0.16, at: [0, 0, Z.pend] }, // 懸點的轂
  { kind: "cylinder", radius: 0.04, length: 0.3, at: [0, 0, Z.pend + 0.08] }, // 懸點的銷,往前插進懸掛座
  { kind: "box", size: [0.1, -BOB.y, 0.08], at: [0, BOB.y / 2, Z.pend] }, // 擺桿
  { kind: "box", size: [ROD, 0.12, FORK_Z[0] - Z.pend + 0.04], at: [0, BEAT_Y - PEND[1], (FORK_Z[0] + Z.pend - 0.04) / 2] }, // 撥叉往前伸的一段(在輪的下方)
  { kind: "box", size: [ROD, FINGER, FORK_Z[1] - FORK_Z[0]], at: [0, BEAT_Y - PEND[1], (FORK_Z[0] + FORK_Z[1]) / 2] }, // 撥叉夾在兩擺銷之間的一段
  { kind: "cylinder", radius: BOB.r, length: 0.14, at: [0, BOB.y, Z.pend] }, // 擺錘
];

// 推斷的重錘驅動:鼓在後輪的背面、套在輪軸上,繩從鼓頂往右拉到滑輪頂上(滑輪在右臂外側,裝在機架伸出的托臂上),再垂下吊重錘
const ROPE_R = 0.03;
const DRUM_R = 0.1;
const DRUM = { center: [...W, -0.5], axis: ZAXIS, radius: DRUM_R + ROPE_R, sense: -1 }; // 輪往前(順時針)轉時繩從鼓上放出
const PULLEY_R = 0.1;
const PULLEY = { center: [1.9, W[1] + DRUM.radius - PULLEY_R - ROPE_R, DRUM.center[2]], axis: ZAXIS, radius: PULLEY_R + ROPE_R, sense: 1 };
const REWIND = 2 * 4 * SWING; // 擺兩個來回(輪轉三分之二圈)上鍊一次
const WEIGHT = { radius: 0.16, height: 0.42 };
const hang = weightDrive({
  drum: DRUM,
  pulleys: [PULLEY],
  eye: [PULLEY.center[0] + PULLEY.radius, -0.6, PULLEY.center[2]],
  reserve: DRUM.radius * 2 * 2 * STEP,
  spare: TAU * DRUM.radius,
  pitch: 2 * ROPE_R,
});
const weightAt = rewound(hang, (v) => -run.at(v).w, REWIND); // 輪往前(順時針)轉的角度
export const geometry = { DRUM, REWIND };

// 腳的字母(照原圖:前輪 A、C、B 在 0°、120°、240° 的腳,後輪 a、c、b 在 60°、180°、300°),跟著腳轉
const TAGS = [
  { id: "labelA", text: "A", at: 0, z: Z.front },
  { id: "labelC", text: "C", at: TAU / 3, z: Z.front },
  { id: "labelB", text: "B", at: (2 * TAU) / 3, z: Z.front },
  { id: "labela", text: "a", at: TAU / 6, z: Z.back },
  { id: "labelc", text: "c", at: TAU / 2, z: Z.back },
  { id: "labelb", text: "b", at: (5 * TAU) / 6, z: Z.back },
];
const tagAt = (t, w) => [W[0] + (LEG + 0.18) * Math.cos(t.at + w), W[1] + (LEG + 0.18) * Math.sin(t.at + w), t.z];

// 動力重演做不出來的原因(2026-10-19 照新的幾何重跑後重寫;擋銷改到臂的內側、貼著臂之後一樣失敗)
const REPLAY_WAIVER =
  "重演做不出來:兩支重力臂鉸在樞軸上、靠自重靠在擋銷上(擋銷在臂內側、臂落到底時正好貼著),擺推開右臂、放開止動齒 D 之後,輪在重演裡受固定的力矩從靜止加速,轉了約 40° 才由抬升銷碰上左臂的叉瓦,這時銷已經轉得很快,一撞就把左臂撞開約 10°(止動齒 E 離開後輪腳的路徑),輪就一路轉走,兩支臂也跟著被撞得亂擺。實物靠調速風扇(FLY)的空氣阻力讓輪轉得慢,銷是慢慢把叉瓦抬起的;重演沒有空氣阻力,質量、力矩與摩擦是全書一致的預設值,模型沒辦法單獨調(同一章的第 309、312 種放開後只轉半個齒距,撞上去的速度小得多,重演通過;第 310 種同一個原因)。臂被抬起、擋住腳、貼著擺落回的過程由模型的測試檢查(止動齒與叉瓦不穿入輪的腳與銷、止動齒擋著腳時輪不動、兩臂交替被抬起、臂貼著擺落下、輪不回退)";

export default {
  figure: 311,
  parts: [
    {
      id: "wheel",
      kind: "group",
      center: [...W, 0],
      spin: LEG,
      pieces: [
        ...FRONT.map((l, i) => ({ kind: "plate", shape: shape(l), thickness: 0.06, at: [0, 0, Z.front], accent: i === 0 })), // 前輪 A、C、B
        ...BACK.map((l) => ({ kind: "plate", shape: shape(l), thickness: 0.06, at: [0, 0, Z.back] })), // 後輪 a、c、b
        // 兩輪內側的輪轂盤(推斷),夾著抬升銷
        { kind: "plate", shape: shape(circle(PIN.r + PIN.size + 0.03)), thickness: 0.06, at: [0, 0, Z.front - 0.06] },
        { kind: "plate", shape: shape(circle(PIN.r + PIN.size + 0.03)), thickness: 0.06, at: [0, 0, Z.back + 0.06] },
        ...PINS.map((p) => ({ kind: "plate", shape: shape(p), thickness: 2 * (Z.front - 0.09), at: [0, 0, Z.arm] })), // 兩輪之間的抬升銷
        { kind: "cylinder", radius: 0.08, length: Z.fly + 0.02 - Z.plate, at: [0, 0, (Z.fly + 0.02 + Z.plate) / 2] }, // 輪軸:從風扇往後穿過兩輪,伸進機架
        { kind: "cylinder", radius: DRUM_R, length: 0.2, at: [0, 0, DRUM.center[2]] }, // 繞繩的鼓(推斷),在後輪的背面
        { kind: "box", size: [3.4, 0.06, 0.04], at: [0, 0, Z.fly], angle: deg(62) }, // 調速風扇(FLY)
      ],
    },
    { id: "armL", kind: "group", center: [...PIV.left, 0], arrow: false, pieces: armPieces(PIV.left, -1, STOP_E, FACE_L, BEAT_LL, Z.arm - 0.16) },
    { id: "armR", kind: "group", center: [...PIV.right, 0], arrow: false, pieces: armPieces(PIV.right, 1, STOP_D, FACE_R, BEAT_RL, Z.arm + 0.16) },
    { id: "pendulum", kind: "group", center: [...PEND, 0], arrow: false, pieces: pendulumPieces },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(rect(0.36, 3.85, 0, 1.55)), thickness: 0.1, at: [0, 0, Z.plate] }, // 機架(推斷):輪軸與兩臂的軸裝在上面
        { kind: "box", size: [0.4, 0.3, 0.17], at: [0, PEND[1], Z.plate - 0.135] }, // 擺的懸掛座(推斷):機架頂端的背面
        // 機架往右伸出的托臂與滑輪的軸(推斷)
        { kind: "box", size: [PULLEY.center[0] + 0.04, 0.1, 0.1], at: [(PULLEY.center[0] + 0.04) / 2, PULLEY.center[1], Z.plate] },
        { kind: "cylinder", radius: 0.035, length: PULLEY.center[2] + 0.1 - Z.plate, at: [PULLEY.center[0], PULLEY.center[1], (PULLEY.center[2] + 0.1 + Z.plate) / 2] },
      ],
    },
    {
      id: "armStops",
      kind: "group",
      pieces: [
        // 擋銷的橫條(推斷):貼在機架前面
        { kind: "box", size: [2 * Math.abs(BANKS[0][0]) + 0.2, 0.16, 0.1], at: [0, BANKS[0][1], Z.plate + 0.1] },
        // 兩臂的擋銷,從橫條伸到臂那一層
        ...BANKS.map((at) => ({ kind: "cylinder", radius: BANK_R, length: 0.04 - (Z.plate + 0.15), at: [...at, (0.04 + Z.plate + 0.15) / 2] })),
      ],
    },
    { id: "pulley", kind: "pulley", style: "disc", center: PULLEY.center, axis: ZAXIS, radius: PULLEY_R, width: 0.08, arrow: false },
    { id: "rope", kind: "rope", radius: ROPE_R },
    { id: "weight", kind: "weight", axis: Y, radius: WEIGHT.radius, height: WEIGHT.height },
    ...TAGS.map((t) => ({ id: t.id, kind: "group", center: tagAt(t, W0), label: t.text, labelOffset: [0, 0, 0.3] })),
    { id: "labelD", kind: "group", center: [KNEE[0] + 0.2, KNEE[1] + 0.15, Z.front], label: "D", labelOffset: [0.15, 0, 0.3] },
    { id: "labelE", kind: "group", center: [-KNEE[0] - 0.2, KNEE[1] + 0.25, Z.back], label: "E", labelOffset: [-0.15, 0, 0.6] },
  ],
  // 動力重演:只推擺;擒縱輪受固定的力矩(重錘)順時針轉(以彈簧代替;重錘、滑輪照模型的姿勢走),兩支臂鉸在樞軸上、
  // 靠自重靠在擋銷上。從輪鎖住的時刻(擺在正中、往右擺)開始。做不出來的原因見 waivers。
  replay: {
    from: SWING,
    to: 9 * SWING,
    free: { wheel: { pivot: [...W, 0], spring: -1, gravity: false }, armR: { pivot: [...PIV.right, 0] }, armL: { pivot: [...PIV.left, 0] } },
    ignore: [["wheel", "frame"], ["armR", "frame"], ["armL", "frame"]],
    expect: [
      { at: 3 * SWING, part: "wheel", label: "擺往右擺:推開右臂、放開止動齒 D,輪轉六分之一圈、後輪的腳被止動齒 E 擋住", quote: "前述第一個鎖定輪的齒由其中一個擒縱叉瓦上的止動齒 D 所擋住" },
      { at: 3 * SWING, part: "armR", label: "擺往右擺:右臂被擺推開" },
      { at: 5 * SWING, part: "wheel", label: "擺往左擺:推開左臂、放開止動齒 E,輪再轉六分之一圈" },
      { at: 5 * SWING, part: "armL", label: "擺往左擺:左臂被擺推開" },
      { part: "wheel", label: "擺兩個來回,輪轉過三分之二圈" },
    ],
  },
  driver: { part: "pendulum", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheel", // 擒縱輪:擒縱讓它一格一格地放行
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
        ...Object.fromEntries(TAGS.map((t) => [t.id, { position: tagAt(t, s.w) }])),
      },
      paths: { rope: { points: hung.rope, closed: false, phase: 0 } },
      readouts: [],
    };
  },
  waivers: [
    { check: "replay", parts: ["wheel"], reason: REPLAY_WAIVER },
    { check: "replay", parts: ["armR"], reason: REPLAY_WAIVER },
    { check: "replay", parts: ["armL"], reason: REPLAY_WAIVER },
  ],
};
