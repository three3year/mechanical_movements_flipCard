// 第 291、313 種共用:彈簧止動式(天文台計時器)擒縱的機構。止動器(彈簧 A / 止動器)一端鎖在錶板上,另一端附近的擋止
// (鎖石)擋住擒縱輪的齒;止動器旁的細彈簧(通過彈簧)鉸在它上面、被彈力頂著它末端的鉤。擺輪上的凸柱(齒 V)往一個方向擺時,
// 只把細彈簧壓彎、從旁邊過去(止動器不動);往另一個方向擺時,推著細彈簧連止動器一起推開,放走擒縱輪的一齒;
// 同時另一齒追上擺輪滾子上的凹槽側邊、推著它走(衝量),脫出後落到落回的擋止上。擺輪每來回一次,擒縱輪轉過一齒。
//
// 由接觸算(models/escapement.js 的 periodic、fall):止動器與細彈簧都是鉸接的零件——止動器靠彈簧壓在擋銷上,
// 細彈簧靠自身彈力頂著鉤;凸柱碰到細彈簧的尖端時,往一邊推就只壓彎細彈簧,往另一邊推就連止動器一起推開;放開後都加速彈回。
// 擒縱輪受發條的固定力矩順時針轉,被擋止擋住就停。
// 立體化:止動器在擒縱輪後面一層,擋止往前伸到輪那一層;細彈簧與凸柱在輪前面一層;滾子與輪同一層。
// 兩張圖用同一套機構:第 313 種是第 291 種整組轉 −90°(止動器的固定端在下、擒縱輪在左、擺輪在右上)。
// 推斷:擺幅、齒數(依原圖約十五齒)、凹槽的形狀與位置、止動器被推開的量;擺輪本身沒畫(原圖只畫滾子),
// 軸都裝在後面的夾板條上(原圖沒畫)。
import { TAU, deg, swing } from "./kit.js";
import { toothedWheel, placePoly, periodic, fall, anyOverlap, clearance } from "./escapement.js";
import { shape, rect, circle, arcPoints } from "./shapes.js";
import { circlePolygon } from "./contact.js";
import { plateBar } from "./supports.js";

export const N = 15;
export const PITCH = TAU / N;
export const SWING = deg(120);
const W = [-0.63, -0.13]; // 擒縱輪心
const R = 1.35;
const ROOT = 1.0;
const B = [2.6, 1.45]; // 彈簧 A 的固定端 b(樞軸)
const BAL = [-1.38, 1.56]; // 擺輪軸
const I = [0.6, 1.56]; // 細彈簧的固定點(凸柱 i 上)
const PIN = { r: 0.32, size: 0.07 }; // 凸柱 a:離擺輪軸的距離、半徑
const ROLLER = 0.549; // 衝擊滾子的半徑(伸進齒尖圓 0.05)
const NOTCH = { at: deg(-103), width: deg(26), depth: 0.2 }; // 凹槽 g(擺輪居中時的方位)

// 齒:順時針轉,前面(角度小的一側)往前傾,齒尖細
const WHEEL = toothedWheel({ teeth: N, profile: [[ROOT, 0.35], [R, 0.05], [R, 0.1], [ROOT, 0.9]], bore: 0.08 });
// A(相對 b):往左的細長條,擋止 d 往下伸到齒尖圓內 0.04;左端的鉤 k 蓋在細彈簧上方
const BAR = rect(3.28, 0.08, -1.64, 0);
const STOP_D = rect(0.08, 0.27, -2.906, -0.175); // d:x = −0.31(輪的 76° 方位),下緣 y = 1.14
const HOOK = [rect(0.08, 0.24, -3.32 + 0.04, 0.08), rect(0.08, 0.075, -3.32 + 0.04, 0.1625)];
// 細彈簧(相對 i):往左伸過鉤 k 到尖端
const SPRING = rect(1.58, 0.03, -0.86, 0); // 右端貼著凸柱 i 的左面(鉸在 i 上)
// 衝擊滾子(相對擺輪軸,擺輪居中時):圓周上切一個凹槽 g
const rollerOutline = (() => {
  const a0 = NOTCH.at - NOTCH.width / 2;
  const a1 = NOTCH.at + NOTCH.width / 2;
  const rim = arcPoints(ROLLER, a1, a0 + TAU, 0, 0);
  const inner = ROLLER - NOTCH.depth;
  return [...rim, [inner * Math.cos(a0), inner * Math.sin(a0)], [inner * Math.cos(a1), inner * Math.sin(a1)]];
})();

/** 擺輪累計擺動 v → 擺輪角(居中時為 0;先往箭頭方向——順時針——擺) */
export const balanceAngle = (v) => swing(v, SWING, -SWING);

// 各零件在世界座標的外形(2D)
const detentAt = (alpha) => [BAR, STOP_D, ...HOOK].map((p) => placePoly(p, B, alpha));
const stopAt = (alpha) => [placePoly(STOP_D, B, alpha)];
const hookAt = (alpha) => HOOK.map((p) => placePoly(p, B, alpha));
const iAt = (alpha) => placePoly([I.map((x, k) => x - B[k])], B, alpha)[0];
const springAt = (alpha, phi) => [placePoly(SPRING, iAt(alpha), alpha + phi)];
const pinAt = (beta) => [circlePolygon([BAL[0] + PIN.r * Math.cos(beta), BAL[1] + PIN.r * Math.sin(beta)], PIN.size, 16)];
const rollerAt = (beta) => [placePoly(rollerOutline, BAL, beta)];
const teethAt = (w) => WHEEL.teeth.map((t) => placePoly(t, W, w));
const BANK = 0; // A 落在擋銷上的角度(抬起為負:繞 b 順時針)

const RATE = 60; // 彈回的角加速度(每單位主動量平方)
function step(s, v, dv) {
  const beta = balanceAngle(v);
  const pin = pinAt(beta);
  let { alpha, wa, phi, wp, w, ww } = s;
  // 1. 細彈簧:被凸柱壓下就彎下去(phi 增加);被往上推就頂著鉤 k(phi = 0)連 A 一起抬起(alpha 減少)
  const springHit = (p) => anyOverlap(pin, springAt(alpha, p));
  if (springHit(phi)) {
    const down = clearance(springHit, phi, 1, 1);
    // 往上:先讓細彈簧回到鉤上,再抬 A
    const liftHit = (a) => anyOverlap(pin, springAt(a, 0));
    const up = phi > 1e-9 && !springHit(0) ? phi : phi + clearance(liftHit, alpha, -1, 0.3);
    if (down <= up) [phi, wp] = [phi + down, 0];
    else {
      const clear = clearance(liftHit, alpha, -1, 0.3);
      [phi, wp, alpha, wa] = [0, 0, alpha - clear, 0];
    }
  } else {
    ({ q: phi, w: wp } = fall(springHit, { q: phi, w: wp }, { sign: -1, acc: RATE, dt: dv, limit: 0, max: 1 }));
  }
  // 2. A:沒被抬著時被自己的彈簧壓回擋銷;落回時碰到凸柱(隔著細彈簧)或齒尖就停
  const detentHit = (a) => anyOverlap(pin, springAt(a, phi)) || anyOverlap(stopAt(a), teethAt(w));
  if (alpha < BANK) ({ q: alpha, w: wa } = fall(detentHit, { q: alpha, w: wa }, { sign: 1, acc: RATE, dt: dv, limit: BANK, max: 0.3 }));
  // 3. 擒縱輪:被 d、滾子擋住就停,被推就退,放開時加速轉
  const stops = [...stopAt(alpha), ...rollerAt(beta)];
  const wheelHit = (x) => anyOverlap(stops, teethAt(x));
  ({ q: w, w: ww } = fall(wheelHit, { q: w, w: ww }, { sign: -1, acc: (2 * PITCH) / (0.06 * 4 * SWING) ** 2, dt: dv, max: PITCH }));
  return { alpha, wa, phi, wp, w, ww };
}

// 起始齒位:擺輪在一端時不碰 d 與滾子的位置
const W0 = (() => {
  const stops = [...stopAt(BANK), ...rollerAt(balanceAngle(0))];
  for (let i = 0; i < 96; i++) if (!anyOverlap(stops, teethAt((-PITCH * i) / 96))) return (-PITCH * i) / 96;
  throw new Error("找不到起始齒位");
})();
const run = periodic({ period: 4 * SWING, init: { alpha: BANK, wa: 0, phi: 0, wp: 0, w: W0, ww: 0 }, step, samples: 1440, snap: { w: PITCH } });

/** 擺輪累計擺動 v → 擺輪角、A 被抬起的角度(抬起為正)、細彈簧被壓下的角度、擒縱輪轉角(順時針為負) */
export function chronometer(v) {
  const s = run.at(v);
  return { balance: balanceAngle(v), lift: -s.alpha, flex: s.phi, wheel: s.w };
}
export const escapement = {
  period: 4 * SWING,
  step: run.advance.w,
  angle: (v) => run.at(v).w,
  at: (v) => {
    const s = run.at(v);
    const beta = balanceAngle(v);
    return { teeth: teethAt(s.w), stops: [...stopAt(s.alpha), ...rollerAt(beta)], detent: detentAt(s.alpha), spring: springAt(s.alpha, s.phi), pin: pinAt(beta) };
  },
};

const local = (p, origin) => p.map(([x, y]) => [x - origin[0], y - origin[1]]);

/**
 * 依這套機構做出模型定義:turn 是整組轉的角度(第 291 種 0、第 313 種 −90°);mirror:轉完之後再左右鏡像(第 313 種);
 * ids 是擒縱輪、止動器、細彈簧的零件 id;labels:[{ text, at(機構座標), offset }];texts:各處的說明(重演的標籤與原文)。
 * 鏡像時機構的計算不變,只把外形、位置左右翻過來,轉角與轉向(重演的彈簧、擋止的範圍、主動件的往復)都反號。
 */
export function detentEscapement({ figure, turn = 0, mirror = false, ids, labels, texts, view }) {
  const c = Math.cos(turn);
  const s = Math.sin(turn);
  const m = mirror ? -1 : 1;
  const rot = ([x, y]) => [m * (x * c - y * s), x * s + y * c];
  const at3 = (p, z = 0) => [...rot(p), z];
  // 零件局部座標的外形與位置:機構座標轉 turn 之後再鏡像,等於局部座標先鏡像、轉角改成 m·(角 + turn)
  const flip = ([x, y]) => [m * x, y];
  const flipShape = (sh) => (mirror ? { outline: sh.outline.map(flip).reverse(), holes: (sh.holes ?? []).map((h) => h.map(flip).reverse()) } : sh);
  const flipPiece = (piece) => ({ ...piece, ...(piece.shape ? { shape: flipShape(piece.shape) } : {}), ...(piece.at ? { at: [m * piece.at[0], piece.at[1], piece.at[2]] } : {}), ...(piece.angle != null ? { angle: m * piece.angle } : {}) });
  const angle = (a) => m * (a + turn);
  const def = {
    figure,
    parts: [
      {
        id: ids.wheel,
        kind: "group",
        center: at3(W),
        spin: R,
        pieces: [
          { kind: "plate", shape: { outline: WHEEL.outline, holes: WHEEL.holes }, thickness: 0.12 },
          { kind: "cylinder", radius: 0.14, length: 0.2 },
          { kind: "cylinder", radius: 0.05, length: 0.5, at: [0, 0, -0.25] }, // 輪軸,往後伸進夾板條
          { kind: "cylinder", radius: 0.06, length: 0.16, at: [0.6, 0, 0.04], accent: true },
        ],
      },
      {
        id: "balance",
        kind: "group",
        center: at3(BAL),
        spin: ROLLER,
        pieces: [
          { kind: "plate", shape: shape(rollerOutline, [circle(0.06).reverse()]), thickness: 0.12 }, // 衝擊滾子與凹槽
          { kind: "plate", shape: shape(rect(PIN.r + 0.1, 0.1, (PIN.r + 0.1) / 2, 0)), thickness: 0.06, at: [0, 0, 0.27] }, // 托著凸柱的小臂
          { kind: "cylinder", radius: PIN.size, length: 0.2, at: [PIN.r, 0, 0.17], accent: true }, // 凸柱
          { kind: "cylinder", radius: 0.06, length: 1.05, at: [0, 0, -0.13] }, // 擺輪軸,往後伸進夾板條
        ],
      },
      {
        id: ids.detent,
        kind: "group",
        center: at3(B),
        arrow: false,
        pieces: [
          { kind: "plate", shape: shape(BAR), thickness: 0.08, at: [0, 0, -0.15] },
          { kind: "plate", shape: shape(STOP_D), thickness: 0.26, at: [0, 0, -0.06] }, // 擋止(鎖石),往前伸到輪那一層
          { kind: "plate", shape: shape(HOOK[0]), thickness: 0.08, at: [0, 0, -0.15] },
          { kind: "plate", shape: shape(HOOK[1]), thickness: 0.4, at: [0, 0, 0.01] }, // 鉤,往前蓋在細彈簧外側
          { kind: "plate", shape: shape(local(rect(0.1, 0.16, I[0], I[1] - 0.07), B)), thickness: 0.38, at: [0, 0, 0] }, // 細彈簧的固定座
        ],
      },
      { id: ids.spring, kind: "group", center: at3(I), arrow: false, pieces: [{ kind: "plate", shape: shape(SPRING), thickness: 0.06, at: [0, 0, 0.15] }] },
      { id: "foot", kind: "group", pieces: [{ kind: "box", size: [0.34, 0.34, 0.5], at: [B[0] + 0.2, B[1], -0.15] }, { kind: "cylinder", radius: 0.05, length: 0.08, at: [B[0] - 0.45, B[1] - 0.085, -0.15] }] }, // 鎖在錶板上的座與止動器的擋銷
      { id: "plate", kind: "group", pieces: plateBar({ points: [W, BAL, B], z: -0.5, width: 0.22, boss: 0.15 }) },
      ...labels.map((l, k) => ({ id: `label${k}`, kind: "group", center: at3(l.at), label: l.text, labelOffset: [...rot(l.offset ?? [0, 0.25]), 0.3] })),
    ],
    // 動力重演:只推擺輪;擒縱輪受固定的力矩順時針轉;止動器繞固定端鉸接、被彈簧壓在擋銷上(推開為順時針);
    // 細彈簧鉸在固定座上、被彈力頂著鉤(只能往一邊彎)
    replay: {
      to: 8 * SWING,
      seconds: 20,
      free: {
        [ids.wheel]: { pivot: at3(W), spring: -m, gravity: false },
        [ids.detent]: { pivot: at3(B), spring: m, gravity: false, limits: mirror ? [0, 0.3] : [-0.3, 0] },
        [ids.spring]: { pivot: at3(I), on: ids.detent, spring: -m, gravity: false, limits: mirror ? [-0.4, 0] : [0, 0.4] },
      },
      ignore: [[ids.wheel, "plate"], ["balance", "plate"], [ids.detent, "foot"]],
      expect: [
        { at: 2 * SWING, part: ids.wheel, ...texts.pass },
        { at: 4 * SWING, part: ids.wheel, ...texts.release },
        { part: ids.wheel, label: "擺輪來回兩次,擒縱輪轉過兩齒" },
      ],
    },
    driver: { part: "balance", type: "rotation", cycle: [m * SWING, -m * SWING] },
    target: ids.wheel, // 擒縱輪:擒縱讓它一齒一齒地放行
    view,
    pose(v) {
      const st = run.at(v);
      return {
        parts: {
          balance: { angle: angle(balanceAngle(v)) },
          [ids.detent]: { angle: angle(st.alpha) },
          [ids.spring]: { position: at3(iAt(st.alpha)), angle: angle(st.alpha + st.phi) },
          [ids.wheel]: { angle: angle(st.w) },
          foot: { angle: angle(0) },
          plate: { angle: angle(0) },
        },
        readouts: [],
      };
    },
  };
  if (mirror) def.parts = def.parts.map((part) => (part.pieces ? { ...part, pieces: part.pieces.map(flipPiece) } : part));
  return def;
}
