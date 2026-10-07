// 第 87 種:能自動反向的運動。B、C 之間後方的大斜齒輪是驅動端,帶著鬆套在軸上的斜齒輪 B、C 反向轉;
// 離合器盒 D 在軸上的鍵條上滑動,與 C(或 B)嚙合時軸就隨它轉。軸經斜齒輪帶動右側的輪 E;
// E 上的凸柱轉到一端時撞上曲柄搖臂 G,經連桿把加重槓桿 F 推過垂直位置,F 便突然倒向另一側,
// 把 D 撥去與另一個齒輪嚙合,軸反轉;E 上的凸柱以相反方向轉回、再撞 G,再反轉一次。
// 主動件是驅動斜齒輪,連續轉動;軸因此來回往復。
//
// 整串都由接觸算(維護者 2026-10-07 決定重排,原本是照時序演出的):
// - E 的凸柱真的推著 G 的上臂走:G 的上臂伸到 E 背面凸柱的那一層;G 的下臂經連桿拉 F,
//   所以 F 的轉角由「G 的上臂剛好不碰凸柱」決定,一路被推到垂直(F 的重心在樞軸正上方)。
// - F 過了垂直就憑自重倒下:從被推過垂直時的轉速起算,一路加速(重心偏離樞軸正上方越遠、加速越快)。撥離合器的直臂另外做成撥叉 K,
//   和 F 鉸在同一根銷上;K 上有兩根擋銷夾著 F,中間留著空程(推斷:原文只說 F「倒下並將離合器帶入嚙合」)。
//   F 被推向垂直時離開擋銷,K 不動、D 保持嚙合、軸照轉,凸柱才推得到底;F 倒下途中才撞上另一根擋銷,
//   把 K 撥過去。若 F 與撥叉做成一體,F 還沒到垂直 D 就先脫開,軸停住、凸柱推不動,機構會卡死。
// - K 頂端的銷卡在 D 的環槽裡,D 的位置就是銷的位置;D 推到底(爪嵌滿)時 K 停住,F 也停在 K 的擋銷上。
// - D 在兩個齒輪之間(爪沒咬上)的那一段,軸不受驅動而停住;咬上另一邊後反轉。
// 每一程的長短因此由幾何決定:E 轉近一圈(凸柱從 G 上臂的一側繞到另一側),軸轉約兩圈。
// 立體化:主軸在 z = 0;K 在主軸那一層,F 在前面一層,連桿與 G 的下臂再前一層;
// G 的上臂與 E 的凸柱在 E 的背面(G 的轂前後貫穿)。G 的上臂因此大半被 E 擋住(原圖 G 在前面),
// 但凸柱若立在 E 的前面,轉到下方會掃過主軸與小斜齒輪,做不出來。
import { X, deg, TAU, polar, rot2 } from "./kit.js";
import { meshAngle, bevelGear, pitchCones, bevelContact } from "./gears.js";
import { shape, circle, stadium } from "./shapes.js";
import { circleCircle } from "./linkage.js";
import { circlePolygon, placeOutline, polygonsOverlap } from "./contact.js";
import { pedestal } from "./supports.js";

const M = 0.09;
const APEX = [-0.9, 0, 0];
const [CONE_DRIVE, CONE_SIDE] = pitchCones(26, 18);
const DRIVE = bevelGear({ apex: APEX, axis: [0, 0, 1], teeth: 26, radius: (26 * M) / 2, cone: CONE_DRIVE, width: 0.45 });
const B = bevelGear({ apex: APEX, axis: [1, 0, 0], teeth: 18, radius: (18 * M) / 2, cone: CONE_SIDE, width: 0.45 });
const C = bevelGear({ apex: APEX, axis: [-1, 0, 0], teeth: 18, radius: (18 * M) / 2, cone: CONE_SIDE, width: 0.45 });
const E_APEX = [3.3, 0, 0];
const [CONE_SMALL, CONE_E] = pitchCones(10, 20);
const SHAFT_BEVEL = bevelGear({ apex: E_APEX, axis: [1, 0, 0], teeth: 10, radius: 0.4, cone: CONE_SMALL, width: 0.3 });
const E = bevelGear({ apex: E_APEX, axis: [0, 0, 1], teeth: 20, radius: 0.8, cone: CONE_E, width: 0.3 });
const CB = bevelContact(DRIVE, B);
const CC = bevelContact(DRIVE, C);
const CE = bevelContact(SHAFT_BEVEL, E);
// 驅動輪轉 1 時 C 的轉角變化;與 C 嚙合時軸(繞 +x)的轉速 = −C 的轉速(C 的軸朝 −x)
const RATE_C = -(meshAngle(DRIVE, C, 0.01, CC) - meshAngle(DRIVE, C, 0, CC)) / 0.01;

// 離合器:D 的爪在套筒兩端,中間兩片凸緣夾出環槽;B、C 轂上的爪離 D 推到底時差 ENGAGED(爪嵌滿)
const D = { jaw: 0.32, flange: 0.1, sleeve: 0.47 };
const SHIFT = 0.3; // D 從中間推到任一邊嵌滿的距離
const ENGAGED = 0.11;
const BITE = 0.16; // 爪的齒高:D 離中間超過 SHIFT − BITE,爪就咬上了
const jawAt = C.center[0] - (APEX[0] + SHIFT + D.jaw + ENGAGED); // C(與對稱的 B)轂上的爪離齒輪中心的距離

// 撥叉 K 與加重槓桿 F,同鉸在 PIVOT;角度從 +x 量起
const PIVOT = [-0.9, -2.05];
const FORK = { reach: 1.77, bar: 1.6, width: 0.12, pin: 0.06, dogR: 0.55, dog: 0.05, dogAt: deg(44.7) };
const K_REST = Math.asin(SHIFT / FORK.reach); // K 偏離垂直的角度(D 推到底)
const LEVER = { length: 1.45, width: 0.12, ball: 0.2, link: 0.3 };
// G:曲柄搖臂,樞軸在 E 的左下(原圖);上臂朝 E 的中心伸到凸柱的路徑上(凸柱推在上臂的外段,
// 槓桿比才不會太大),下臂朝下接連桿。G 一程只擺約 24°,凸柱推它的範圍只佔 E 一圈的一小段
const G = { pivot: [2.05, -1.35], up: 1.0, down: 1.0, width: 0.14 };
const G_UP0 = Math.atan2(-G.pivot[1], E_APEX[0] - G.pivot[0]) + deg(11.75); // F 在右側靜止時上臂的方向(擺動範圍的中間指向 E 的中心)
const STUD = { at: polar(0.973, deg(262)).slice(0, 2), r: 0.09 }; // 凸柱在 E 上的位置(E 的局部座標;起點剛離開 G 的上臂)
// 驅動齒輪的轉向(原文沒寫):與 C 嚙合時軸帶 E 逆時針轉,凸柱從 G 上臂的右側推它,F 被拉向垂直
const DRIVE_DIR = -1;
const WEIGHT = 30; // F 倒下的角加速度(每單位驅動輪轉角的平方;原書沒有重量的資料,取自重倒下比凸柱推得快一些)
const Z = { fork: 0, lever: 0.3, link: 0.46, gDown: 0.38, gUp: -0.9 };

// ---- 外形(2D) ----
const bar = (from, to, w) => {
  const [dx, dy] = [to[0] - from[0], to[1] - from[1]];
  const l = Math.hypot(dx, dy);
  const [nx, ny] = [(-dy / l) * (w / 2), (dx / l) * (w / 2)];
  return [[from[0] - nx, from[1] - ny], [to[0] - nx, to[1] - ny], [to[0] + nx, to[1] + ny], [from[0] + nx, from[1] + ny]];
};
const LEVER_BAR = bar([0.14, 0], [LEVER.length, 0], LEVER.width); // F 的桿(局部:沿 +x)
const DOGS = [-1, 1].map((s) => circlePolygon(polar(FORK.dogR, s * FORK.dogAt), FORK.dog, 12)); // K 上的兩根擋銷(局部:K 沿 +x)
const G_UP = bar([0, 0], [G.up, 0], G.width); // G 的上臂(局部:沿 +x,γ = 0 時轉 G_UP0)
const forkPin = (k) => [PIVOT[0] + FORK.reach * Math.cos(k), PIVOT[1] + FORK.reach * Math.sin(k)];
const leverPin = (b) => [PIVOT[0] + LEVER.link * Math.cos(b), PIVOT[1] + LEVER.link * Math.sin(b), 0];

// F 在右側(β 小)靜止時:F 靠在 K 的下擋銷上,K 在右邊推到底(D 與 C 嚙合)
const K_RIGHT = Math.PI / 2 - K_REST;
const K_LEFT = Math.PI / 2 + K_REST;
const leverHitsDog = (b, k) => DOGS.some((d) => polygonsOverlap(placeOutline(LEVER_BAR, PIVOT, b), placeOutline(d, PIVOT, k)));
/** K 在 k 時,F 從垂直倒向 dir(−1:往右,β 變小)碰到擋銷的角度 */
function leverRest(k, dir) {
  let lo = Math.PI / 2;
  let hi = Math.PI / 2 + dir * deg(70);
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (leverHitsDog(mid, k)) hi = mid;
    else lo = mid;
  }
  return lo;
}
const F_RIGHT = leverRest(K_RIGHT, -1);
const F_LEFT = leverRest(K_LEFT, 1);

// 連桿長度:F 在右側靜止、G 的下臂朝正下方時
const G_DOWN0 = -Math.PI / 2;
const LINK = Math.hypot(G.pivot[0] + G.down * Math.cos(G_DOWN0) - leverPin(F_RIGHT)[0], G.pivot[1] + G.down * Math.sin(G_DOWN0) - leverPin(F_RIGHT)[1]);
/** F 在 β 時 G 的轉角(連桿長度不變;0 = 下臂朝正下方)與下臂端點 */
function crankG(b) {
  const end = circleCircle([...G.pivot, 0], G.down, leverPin(b), LINK, 1).point;
  return { g: Math.atan2(end[1] - G.pivot[1], end[0] - G.pivot[0]) - G_DOWN0, end };
}
const gArm = (b) => placeOutline(G_UP, G.pivot, G_UP0 + crankG(b).g);
const studAt = (shaft) => {
  const e = meshAngle(SHAFT_BEVEL, E, shaft, CE);
  const p = rot2(STUD.at, e);
  return circlePolygon([E_APEX[0] + p[0], p[1]], STUD.r, 16);
};

/** 凸柱壓著 G 的上臂時,F 從 b 往 limit 轉到 G 剛好不碰凸柱(到 limit 還碰著就停在 limit) */
function pushLever(b, limit, stud) {
  if (polygonsOverlap(gArm(limit), stud)) return limit;
  let lo = b;
  let hi = limit;
  for (let j = 0; j < 30; j++) {
    const mid = (lo + hi) / 2;
    if (polygonsOverlap(gArm(mid), stud)) lo = mid;
    else hi = mid;
  }
  return hi;
}

// ---- 逐步模擬:主動量每走一小步,依序算軸、凸柱推 G(F)、F 倒下、F 撥 K、K 推 D ----
const STEP = deg(0.5);
const stateAfter = (() => {
  const run = [];
  let shaft = 0;
  let b = F_RIGHT;
  let k = K_RIGHT;
  let fall = null; // { dir: 倒向(±1), to: 倒到的角度, w: 轉速(每單位驅動輪轉角) }
  const sideOf = (kk) => {
    const x = FORK.reach * Math.cos(kk);
    return x > SHIFT - BITE ? 1 : x < -(SHIFT - BITE) ? -1 : 0; // +1:與 C 嚙合;−1:與 B;0:都沒咬上
  };
  const cycleEnds = []; // F 倒回右側、停在 K 的擋銷上的那一步(一個週期的終點)
  for (let i = 0; cycleEnds.length < 3; i++) {
    if (i > 20000) throw new Error("第 87 種:軸沒有自動反向(凸柱推不到 G,或 F 倒不過去)");
    const engaged = sideOf(k);
    shaft += engaged * RATE_C * DRIVE_DIR * STEP;
    const stud = studAt(shaft);
    if (fall) {
      // 倒下:憑自重加速(角加速度與重心偏離樞軸正上方的水平距離成正比),從被推過垂直時的轉速起算;
      // 軸還在轉時凸柱可能追上 G,就推著 F 倒得更快(不穿過 G 的上臂)
      fall.w += WEIGHT * -Math.cos(b) * STEP;
      let next = b + fall.w * STEP;
      if (polygonsOverlap(gArm(next), stud)) {
        const pushed = pushLever(next, fall.to, stud);
        fall.w = (pushed - b) / STEP;
        next = pushed;
      }
      if ((next - fall.to) * fall.dir >= 0) {
        next = fall.to;
        if (fall.dir < 0) cycleEnds.push(run.length);
        fall = null;
      }
      b = next;
    } else if (polygonsOverlap(gArm(b), stud)) {
      // 凸柱推 G 的上臂:F 往垂直轉,轉到 G 剛好不碰凸柱;推到垂直就開始倒
      const toward = b < Math.PI / 2 ? 1 : -1;
      const before = b;
      b = pushLever(b, Math.PI / 2, stud);
      if (b === Math.PI / 2) fall = { dir: toward, to: toward > 0 ? F_LEFT : F_RIGHT, w: (b - before) / STEP };
    }
    // F 撞到擋銷就把 K 往同一邊撥,K 推到底為止
    if (leverHitsDog(b, k)) {
      const dir = b > k ? 1 : -1;
      let lo = k;
      let hi = dir > 0 ? K_LEFT : K_RIGHT;
      for (let j = 0; j < 30; j++) {
        const mid = (lo + hi) / 2;
        if (leverHitsDog(b, mid)) lo = mid;
        else hi = mid;
      }
      k = hi;
    }
    run.push({ shaft, b, k });
  }
  // 從原圖的姿勢起步的第一個週期長短不一;取第三個週期(凸柱、F、K 的相對位置每週期都一樣了)
  return run.slice(cycleEnds[1], cycleEnds[2] + 1);
})();
const DRIFT = stateAfter.at(-1).shaft - stateAfter[0].shaft; // 一個週期後軸角的差(來回兩程轉角相等時是 0)
/** 一個週期(兩程)的驅動輪轉角 */
export const period = (stateAfter.length - 1) * STEP;
const FIRST_FLIP = stateAfter.findIndex((s) => s.k > Math.PI / 2);
/** 第一程結束(K 被撥到左邊)時的驅動輪轉角 */
export const firstStroke = FIRST_FLIP * STEP;

/** 驅動輪轉 v:軸角、F 的角度 β、K 的角度、D 偏離中間的距離(+:往 C) */
export function reverser(v) {
  const n = stateAfter.length - 1;
  const q = Math.floor(v / period);
  const x = (v - q * period) / STEP;
  const i = Math.min(n - 1, Math.floor(x));
  const f = x - i;
  const [a, c] = [stateAfter[i], stateAfter[i + 1]];
  const lerp = (p, r) => p + (r - p) * f;
  const k = lerp(a.k, c.k);
  return { shaft: lerp(a.shaft, c.shaft) + q * DRIFT, lever: lerp(a.b, c.b), fork: k, clutch: FORK.reach * Math.cos(k) };
}
/** 檢查用:主動量 v 時凸柱、G 的上臂、F 的桿、K 的擋銷(世界座標 2D) */
export function contactAt(v) {
  const { shaft, lever, fork } = reverser(v);
  return { stud: studAt(shaft), arm: gArm(lever), lever: placeOutline(LEVER_BAR, PIVOT, lever), dogs: DOGS.map((d) => placeOutline(d, PIVOT, fork)) };
}
export const tipping = Math.PI / 2;

const bevel = (id, g, extra = {}) => ({ id, kind: "gear", center: g.center, axis: g.axis, teeth: g.teeth, radius: g.radius, cone: g.cone, width: g.width, ...extra });
const jaw = (z, facing) => ({ kind: "gear", crown: true, teeth: 5, radius: 0.32, width: 0.3, toothDepth: 0.16, faceWidth: 0.2, at: [0, 0, z], axis: [0, 0, facing] });

export default {
  figure: 87,
  parts: [
    bevel("drive", DRIVE, { pieces: [{ kind: "cylinder", radius: 0.12, length: 1.0, at: [0, 0, -0.75] }] }),
    bevel("b", B, { pieces: [{ kind: "cylinder", radius: 0.2, length: jawAt, at: [0, 0, jawAt / 2] }, jaw(jawAt, 1)], label: "B", labelOffset: [-0.3, 1.05, 0] }),
    bevel("c", C, { pieces: [{ kind: "cylinder", radius: 0.2, length: jawAt, at: [0, 0, jawAt / 2] }, jaw(jawAt, 1)], label: "C", labelOffset: [0.3, 1.05, 0] }),
    // 軸上的鍵條(原文的 feather,D 在上面滑動)就是轉動的記號;D 隨軸轉,箭頭只留在軸上
    { id: "shaft", kind: "cylinder", axis: X, center: [0.6, 0, 0], radius: 0.08, length: 6.6, mark: true, spin: 0.3, spinOffset: 0.75 },
    {
      id: "clutch",
      kind: "group",
      axis: X,
      center: [APEX[0], 0, 0],
      arrow: false,
      pieces: [
        jaw(-D.jaw, -1),
        jaw(D.jaw, 1),
        { kind: "cylinder", radius: 0.2, length: 2 * D.sleeve },
        { kind: "cylinder", radius: 0.38, length: 0.06, at: [0, 0, -D.flange] }, // 環槽的兩片凸緣,K 的銷卡在中間
        { kind: "cylinder", radius: 0.38, length: 0.06, at: [0, 0, D.flange] },
      ],
      label: "D",
      labelOffset: [0, 0.55, 0.4],
    },
    bevel("shaftBevel", SHAFT_BEVEL, { arrow: false }),
    bevel("e", E, {
      pieces: [
        { kind: "cylinder", radius: 1.05, inner: 0.9, length: 0.15, at: [0, 0, -0.3] },
        ...[0, 1, 2, 3].map((i) => ({ kind: "box", size: [0.85, 0.08, 0.08], at: [0.42 * Math.cos((i * Math.PI) / 2), 0.42 * Math.sin((i * Math.PI) / 2), -0.3], angle: (i * Math.PI) / 2 })),
        { kind: "cylinder", radius: STUD.r, length: 0.4, at: [...STUD.at, -0.65], accent: true }, // 凸柱立在外圈的背面,G 的上臂在那一層
        { kind: "cylinder", radius: 0.14, length: 0.5, at: [0, 0, -0.45] }, // E 的軸,往後伸進軸承
      ],
      label: "E",
      labelOffset: [0, 1.2, 0],
    }),
    {
      id: "leverF",
      kind: "group",
      center: [...PIVOT, Z.lever],
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(LEVER_BAR), thickness: 0.08 },
        { kind: "sphere", radius: LEVER.ball, at: [LEVER.length, 0, 0] },
        { kind: "cylinder", radius: 0.14, inner: 0.07, length: 0.28, at: [0, 0, -0.09] }, // 轂(往後伸到 K 的擋銷那一層,停在 K 的轂前面)
        { kind: "cylinder", radius: 0.05, length: 0.24, at: [LEVER.link, 0, 0.1] }, // 接連桿的銷
      ],
      label: "F",
      labelOffset: [0.4, 0.45, 0.2],
    },
    {
      id: "fork",
      kind: "group",
      center: [...PIVOT, Z.fork],
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(bar([0.1, 0], [FORK.bar, 0], FORK.width)), thickness: 0.08 },
        { kind: "box", size: [FORK.reach - FORK.bar + 0.04, 0.08, 0.08], at: [(FORK.reach + FORK.bar) / 2 - 0.02, 0, 0] }, // 伸進環槽的頸
        { kind: "cylinder", radius: FORK.pin, length: 0.16, at: [FORK.reach, 0, 0] }, // 卡在 D 環槽裡的銷
        { kind: "cylinder", radius: 0.14, inner: 0.07, length: 0.1 },
        ...[-1, 1].map((s) => ({ kind: "cylinder", radius: FORK.dog, length: 0.34, at: [...polar(FORK.dogR, s * FORK.dogAt).slice(0, 2), 0.2] })), // 夾著 F 的兩根擋銷
        { kind: "plate", shape: shape(bar(polar(FORK.dogR, -FORK.dogAt), polar(FORK.dogR, FORK.dogAt), 0.1)), thickness: 0.06, at: [0, 0, 0.02] }, // 托著擋銷的橫板
      ],
    },
    {
      id: "crankG",
      kind: "group",
      center: [...G.pivot, 0],
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(G_UP), thickness: 0.08, angle: G_UP0, at: [0, 0, Z.gUp] },
        { kind: "plate", shape: shape(stadium(G.down, 0.14).outline), thickness: 0.08, angle: G_DOWN0, at: [0, 0, Z.gDown] },
        { kind: "cylinder", radius: 0.12, inner: 0.06, length: Z.gDown - Z.gUp + 0.08, at: [0, 0, (Z.gDown + Z.gUp) / 2] }, // 轂前後貫穿 E 的外側
      ],
      label: "G",
      labelOffset: [-0.35, 0, 0.5],
    },
    { id: "rod", kind: "link", width: 0.08, thickness: 0.05 },
    {
      // 機架(推斷,原圖沒畫):F、K、G 的樞軸銷與支座,主軸兩端的軸承座,驅動斜齒輪與 E 的軸承
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: 0.065, length: 0.85, at: [...PIVOT, 0.0] },
        ...pedestal({ at: PIVOT, z: -0.42, bore: 0.06, floor: -2.9, depth: 0.2 }),
        { kind: "cylinder", radius: 0.055, length: 1.6, at: [...G.pivot, -0.4] },
        ...pedestal({ at: G.pivot, z: -1.1, bore: 0.05, floor: -2.9, depth: 0.2 }),
        ...[-2.45, 1.6].flatMap((x) => [
          { kind: "cylinder", axis: X, radius: 0.24, inner: 0.09, length: 0.3, at: [x, 0, 0] },
          { kind: "box", size: [0.3, 0.9, 0.2], at: [x, -0.65, 0] },
        ]),
        { kind: "cylinder", radius: 0.26, inner: 0.13, length: 0.25, at: [APEX[0], 0, -1.7] },
        { kind: "cylinder", radius: 0.26, inner: 0.15, length: 0.2, at: [E_APEX[0], 0, -1.05] },
      ],
    },
  ],
  // 動力重演:只推驅動齒輪;F、G、連桿照模型的姿勢走(連桿兩端都是鉸接,重演的自由零件只能有一個樞軸)。
  // 撥叉 K 鉸在銷上、靠自重倒向一側(倒到底的位置代表 D 嵌滿),被倒下的 F 撞上擋銷時撥過去。
  // K 頂端的銷卡在 D 的環槽裡是套住的接合,D 照模型走,不和 K 算碰撞
  replay: {
    from: 0,
    to: period + deg(40),
    seconds: 20,
    free: { fork: { limits: [0, 2 * K_REST] } },
    ignore: [["fork", "frame"], ["fork", "clutch"]],
    expect: [
      { at: firstStroke - deg(30), part: "fork", label: "F 被推向垂直時離開擋銷,K 不動(D 仍與 C 嚙合)", quote: "使連桿把加重槓桿 F 帶動至越過垂直位置" },
      { at: firstStroke + deg(30), part: "fork", label: "F 倒下撞上擋銷,把 K 撥過去(D 改與 B 嚙合)", quote: "該槓桿便會突然向左倒下,並將離合器帶入與 B 的嚙合狀態" },
      { at: period + deg(30), part: "fork", label: "第二程 F 倒回右側,又把 K 撥回來(D 回到與 C 嚙合)", quote: "將加重槓桿再次帶過垂直位置,於是再次使運動反轉" },
    ],
  },
  driver: { part: "drive", type: "rotation", speed: 1.2 },

  target: "shaft", // 自動來回反轉的軸
  view: { direction: [0.04, 0.12, 1], fov: 22 },
  pose(v) {
    const { shaft, lever, fork, clutch } = reverser(v);
    const { g, end } = crankG(lever);
    const pin = leverPin(lever);
    return {
      parts: {
        drive: { angle: DRIVE_DIR * v },
        b: { angle: meshAngle(DRIVE, B, DRIVE_DIR * v, CB) },
        c: { angle: meshAngle(DRIVE, C, DRIVE_DIR * v, CC) },
        shaft: { angle: shaft },
        clutch: { position: [APEX[0] + clutch, 0, 0], angle: shaft },
        shaftBevel: { angle: shaft },
        e: { angle: meshAngle(SHAFT_BEVEL, E, shaft, CE) },
        leverF: { angle: lever },
        fork: { angle: fork },
        crankG: { angle: g },
        rod: { from: [pin[0], pin[1], Z.link], to: [end[0], end[1], Z.link] },
      },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["c", "clutch"], reason: "簡化爪形:離合器的爪畫成方塊而不是扇形,接合時內緣互相重疊 0.05" },
    { check: "interference", parts: ["b", "clutch"], reason: "簡化爪形:離合器的爪畫成方塊而不是扇形,接合時內緣互相重疊 0.05" },
  ],
};
