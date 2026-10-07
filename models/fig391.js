// 第 391 種:把往復運動轉成旋轉。兩根加重的齒條 A、A¹ 以樞軸接在活塞桿的末端(底下的橫件),齒條末端的銷在固定的導引溝槽
// b、b 裡走;溝槽的形狀讓一根齒條上升時咬著中間的齒輪,另一根下降時咬著,所以齒輪連續朝同一方向轉。
// 肘節槓桿 C 與彈簧 d 負責把右邊齒條上的銷帶過溝槽 b 的上角。主動件是活塞桿(累計行程:上、下)。
// 推斷:齒數;溝槽與肘節的尺寸。
//
// 由接觸算(2026-10-07 複查):原本兩根齒條照進度表左右平移(行程兩端換咬合),溝槽畫在銷碰不到的地方,齒條也沒有樞軸
// (演出的動作)。現在:
// - 齒條的下端以銷鉸在活塞桿的橫件上(原圖的 a),上端的銷伸進溝槽 b;溝槽是一圈封閉的溝,中間是島。齒條的傾角由銷在溝裡的
//   位置決定:銷走在靠齒輪的那一邊時齒條直立、咬著齒輪,走在外側那一邊時齒條外傾、離開齒輪。
// - 左邊的 A:上升時銷沿內側(咬著齒輪,把齒輪往順時針推),到上方沿斜溝滑到外側;下降時走外側,到下方沿斜溝回到內側。
//   右邊的 A¹ 反過來:上升時走外側,到頂後經斜溝回到內側、下降時咬著齒輪(也是順時針)。
// - 溝在行程的兩端各有一個岔口(銷停下換向時,可以走回頭路,也可以繼續繞);齒條下端的重錘把齒條往外壓、肘節 C 經彈簧 d
//   把 A¹ 的銷往內推過上角,所以銷都沿溝繞圈(原文:重錘與 C、d 的作用)。這一段的受力沒有算,模型照繞圈的方向走。
// - 肘節 C 鉸在上方的機架上,下緣靠在 A¹ 的銷上時被銷頂起、彈簧 d 被拉長;銷離開後 C 落在擋上。C 的角度由它的下緣與銷相碰決定。
import { TAU, swingPhase } from "./kit.js";
import { shape, thickLine, rect } from "./shapes.js";
import { placeOutline, pointInPolygon, edgeDistance } from "./contact.js";

const GEAR = { center: [0, 0.3, 0], teeth: 18, r: 0.75 };
const PITCH = (TAU * GEAR.r) / GEAR.teeth;
export const STROKE = 2.0;
const PIVOT_X = GEAR.r + 0.07; // 齒條節線(經過下端的樞軸)離齒輪中心的距離
const PIN = { up: 4.25, side: 0.1, r: 0.06 }; // 齒條上端的銷:在樞軸上方多高、往外偏多少
const BASE = -3.3; // 行程最低時,齒條樞軸的高度
const AWAY = 0.5; // 銷走外側時,離內側多遠
const T = 0.35; // 斜溝的高度
const Y_BOT = BASE + PIN.up; // 銷的最低、最高點
const Y_TOP = Y_BOT + STROKE;

// 兩條溝(銷的中心線,逆時針排列的四邊形);s = −1 左邊的 A,+1 右邊的 A¹
const xin = (s) => s * (PIVOT_X + PIN.side);
const xout = (s) => s * (PIVOT_X + PIN.side + AWAY);
const LOOP = {
  [-1]: [[xin(-1), Y_BOT], [xin(-1), Y_TOP - T], [xout(-1), Y_TOP], [xout(-1), Y_BOT + T]],
  [1]: [[xout(1), Y_BOT], [xout(1), Y_TOP], [xin(1), Y_TOP - T], [xin(1), Y_BOT + T]],
};

/** 銷在溝裡、高度 y 時的 x:s 是哪一根,up 是活塞在上升還是下降 */
export function pinX(s, y, up) {
  const t = (a, b, v) => Math.min(1, Math.max(0, (v - a) / (b - a)));
  if (s < 0) return up ? xin(s) + (xout(s) - xin(s)) * t(Y_TOP - T, Y_TOP, y) : xout(s) + (xin(s) - xout(s)) * t(Y_BOT + T, Y_BOT, y);
  return up ? xout(s) : xout(s) + (xin(s) - xout(s)) * (t(Y_TOP, Y_TOP - T, y) - t(Y_BOT + T, Y_BOT, y));
}

// 樞軸在 (s·PIVOT_X, yv) 時,齒條轉 a 後銷的位置
const pinAt = (s, yv, a) => {
  const [lx, ly] = [s * PIN.side, PIN.up];
  return [s * PIVOT_X + lx * Math.cos(a) - ly * Math.sin(a), yv + lx * Math.sin(a) + ly * Math.cos(a)];
};
// 齒條的傾角:讓銷剛好落在溝的中心線上(銷外移時齒條外傾)
function rackAngle(s, yv, up) {
  const miss = (a) => {
    const [x, y] = pinAt(s, yv, a);
    return s * (x - pinX(s, y, up));
  };
  let [lo, hi] = [-0.3, 0.3];
  if (s > 0) [lo, hi] = [hi, lo];
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (miss(mid) < 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** 累計行程 v → 活塞桿高度、兩根齒條的傾角、齒輪轉角 */
export function racks(v) {
  const { at, cycle, forward } = swingPhase(v, 0, STROKE);
  const yv = BASE + at;
  // 上升時 A 咬著齒輪往上推(齒輪順時針),下降時 A¹ 咬著往下推(也是順時針)
  const gear = -(cycle * 2 * STROKE + (forward ? at : STROKE + (STROKE - at))) / GEAR.r;
  return { y: at, pivotY: yv, up: forward, angleA: rackAngle(-1, yv, forward), angleA1: rackAngle(1, yv, forward), gear };
}
export const geometry = { GEAR, STROKE, LOOP, PIN, PIVOT_X };
/** 檢查用:銷的世界座標 */
export const pinOf = (s, v) => {
  const r = racks(v);
  return pinAt(s, r.pivotY, s < 0 ? r.angleA : r.angleA1);
};

// 齒條:局部原點在下端的樞軸,節線在 x = 0;齒朝齒輪(−s 那一側),桿身在外側
const rackPiece = (s) => {
  const teeth = [];
  for (let i = 0; i < 17; i++) teeth.push({ kind: "box", size: [0.14, PITCH * 0.45, 0.2], at: [-s * 0.07, 0.35 + i * PITCH, 0] });
  return [
    { kind: "box", size: [0.2, 4.45, 0.2], at: [s * 0.1, 2.2, 0] },
    ...teeth,
    { kind: "cylinder", radius: PIN.r, length: 0.55, at: [s * PIN.side, PIN.up, -0.25] }, // 往後伸進溝槽的銷(經過肘節 C 那一層)
    { kind: "cylinder", radius: 0.1, inner: 0.05, length: 0.2 }, // 下端的軸眼
    // 重錘:下端往外伸的臂與球
    { kind: "box", size: [0.5, 0.1, 0.12], at: [s * 0.3, -0.12, 0] },
    { kind: "sphere", radius: 0.2, at: [s * 0.62, -0.2, 0] },
  ];
};

// 溝槽 b:機架上的板挖出一圈溝,中間是島(銷的中心線往外、往內各偏溝的半寬)
const HALF = PIN.r + 0.02;
function offsetQuad(points, d) {
  // 凸四邊形(逆時針)的每條邊往外平移 d,相鄰兩條平移後的邊求交點
  const n = points.length;
  const lines = points.map((p, i) => {
    const q = points[(i + 1) % n];
    const [dx, dy] = [q[0] - p[0], q[1] - p[1]];
    const l = Math.hypot(dx, dy);
    const nrm = [dy / l, -dx / l];
    return { p: [p[0] + nrm[0] * d, p[1] + nrm[1] * d], d: [dx, dy] };
  });
  return lines.map((a, i) => {
    const b = lines[(i - 1 + n) % n];
    const den = b.d[0] * a.d[1] - b.d[1] * a.d[0];
    const t = ((a.p[0] - b.p[0]) * a.d[1] - (a.p[1] - b.p[1]) * a.d[0]) / den;
    return [b.p[0] + b.d[0] * t, b.p[1] + b.d[1] * t];
  });
}
const SLOT_Z = -0.35; // 溝槽板在齒條後面,銷往後伸進去
const C_Z = -0.15; // 肘節 C 在齒條與溝槽板之間
const slotPieces = (s) => {
  const outer = offsetQuad(LOOP[s], HALF);
  const island = offsetQuad(LOOP[s], -HALF);
  const cx = (xin(s) + xout(s)) / 2;
  return [
    { kind: "plate", shape: shape(rect(AWAY + 0.75, STROKE + T + 0.6, cx, (Y_BOT + Y_TOP) / 2), [outer.slice().reverse()]), thickness: 0.1, at: [0, 0, SLOT_Z] },
    { kind: "plate", shape: shape(island), thickness: 0.1, at: [0, 0, SLOT_Z] },
  ];
};

// 肘節 C:鉸在 A¹ 的溝上方,下緣是一條斜邊;銷頂到斜邊時把 C 往上推,彈簧 d 拉著 C 的上臂
const C_PIVOT = [xin(1) + 0.15, Y_TOP + 0.8];
const C_EDGE = [[-0.3, -0.77], [0.7, -0.77]]; // 下緣離鉸銷要比銷最近時還近,銷才一路貼著下緣 // 下緣(C 的局部座標)
const C_REST = -0.2; // 沒被頂起時,C 落在擋上的角度
const D_ANCHOR = [C_PIVOT[0] + 0.2, C_PIVOT[1] + 0.9];
const C_ARM = [-0.35, 0.3]; // 彈簧 d 接在 C 上臂的這一點
const rot = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
const C_OUTLINE = thickLine([C_ARM, [0, 0], C_EDGE[0], C_EDGE[1]], 0.08);
/** C 的角度:C 的外形剛好不壓到銷(銷沒頂到時落在擋上) */
export function toggleAngle(pin) {
  const clear = (a) => {
    const poly = placeOutline(C_OUTLINE, C_PIVOT, a);
    return !pointInPolygon(pin, poly) && edgeDistance(pin, poly) >= PIN.r + 0.005;
  };
  if (clear(C_REST)) return C_REST;
  let [lo, hi] = [C_REST, C_REST + 0.8]; // 銷在支點右邊往上頂:C 逆時針轉
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (clear(mid)) hi = mid;
    else lo = mid;
  }
  return hi;
}
export const toggleOutline = (pin) => placeOutline(C_OUTLINE, C_PIVOT, toggleAngle(pin));

export default {
  figure: 391,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        ...slotPieces(-1),
        ...slotPieces(1),
        { kind: "cylinder", radius: 0.1, length: 0.5, at: GEAR.center },
        // 肘節 C 的鉸銷與擋、彈簧 d 的錨
        { kind: "cylinder", radius: 0.04, length: 0.25, at: [C_PIVOT[0], C_PIVOT[1], C_Z - 0.08] },
        { kind: "box", size: [0.1, 0.1, 0.1], at: [C_PIVOT[0] + 0.53, C_PIVOT[1] - 0.99, C_Z] }, // C 的擋(下緣的尾端靠在這裡)
        { kind: "box", size: [0.1, 0.25, 0.1], at: [D_ANCHOR[0], D_ANCHOR[1] + 0.1, C_Z] },
      ],
    },
    { id: "labelB1", kind: "group", center: [xout(-1) - 0.2, Y_TOP + 0.1, 0], label: "b", labelOffset: [-0.15, 0.2, 0.5] },
    { id: "labelB2", kind: "group", center: [xout(1) + 0.2, Y_TOP + 0.1, 0], label: "b", labelOffset: [0.15, 0.2, 0.5] },
    { id: "gear", kind: "gear", center: GEAR.center, teeth: GEAR.teeth, radius: GEAR.r, width: 0.25, bore: 0.1 },
    { id: "rackA", kind: "group", arrow: false, label: "A", labelOffset: [-0.45, 1.2, 0.3], pieces: rackPiece(-1) },
    { id: "rackA1", kind: "group", arrow: false, label: "A¹", labelOffset: [0.45, 1.2, 0.3], pieces: rackPiece(1) },
    {
      id: "piston",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(rect(2.4, 0.18)), thickness: 0.2, at: [0, -0.15, -0.2] },
        { kind: "box", size: [0.14, 1.4, 0.14], at: [0, -0.9, -0.2] },
        // 兩根齒條的樞軸銷(原圖的 a)
        { kind: "cylinder", radius: 0.05, length: 0.45, at: [-PIVOT_X, 0, -0.05] },
        { kind: "cylinder", radius: 0.05, length: 0.45, at: [PIVOT_X, 0, -0.05] },
      ],
    },
    { id: "toggleC", kind: "group", center: [C_PIVOT[0], C_PIVOT[1], C_Z], arrow: false, label: "C", labelOffset: [-0.3, 0.15, 0.2], pieces: [{ kind: "plate", shape: shape(C_OUTLINE), thickness: 0.06 }] },
    { id: "springD", kind: "spring", coils: 6, radius: 0.06, wire: 0.015, label: "d", labelOffset: [0.2, 0.2, 0.2] },
  ],
  driver: { part: "piston", type: "translation", direction: [0, 1, 0], cycle: [0, STROKE] },
  target: "gear",
  view: { direction: [0.03, 0.05, 1] },
  pose(v) {
    const r = racks(v);
    const pin1 = pinAt(1, r.pivotY, r.angleA1);
    const c = toggleAngle(pin1);
    const arm = rot(C_ARM, c);
    return {
      parts: {
        piston: { position: [0, r.pivotY, 0.0] },
        rackA: { position: [-PIVOT_X, r.pivotY, 0.1], angle: r.angleA },
        rackA1: { position: [PIVOT_X, r.pivotY, 0.1], angle: r.angleA1 },
        gear: { angle: r.gear },
        toggleC: { angle: c },
        springD: { from: [C_PIVOT[0] + arm[0], C_PIVOT[1] + arm[1], C_Z], to: [D_ANCHOR[0], D_ANCHOR[1], C_Z] },
      },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["gear", "rackA"], reason: "簡化齒形:齒條的齒畫成方塊,與齒輪的梯形齒重疊 0.12(96 個取樣中 32 個)" },
    { check: "interference", parts: ["gear", "rackA1"], reason: "簡化齒形:齒條的齒畫成方塊,與齒輪的梯形齒重疊 0.13(96 個取樣中 31 個)" },
  ],
};
