// 第 391 種:把往復運動轉成旋轉。兩根加重的齒條 A、A¹ 以樞軸接在活塞桿的末端(原圖的 a、a),齒條末端的銷在固定的導引溝槽
// b、b 裡走;溝槽的形狀讓一根齒條上升時咬著中間的齒輪,另一根下降時咬著,所以齒輪連續朝同一方向轉。
// 肘形槓桿 C 與彈簧 d 負責把右邊齒條上的銷帶過溝槽 b 的上角。主動件是活塞桿(累計行程:上、下)。
// 推斷:齒數;溝槽、肘形槓桿、連桿、重錘的尺寸與位置(從小圖讀的)。
//
// 2026-10-20 照原圖整個重排(#391-1~3,維護者 10-14 決定 (a)):
// - 原圖齒輪中心的箭頭由上繞左到下:逆時針。齒輪左側往下、右側往上,所以 A(左)在下降時咬著齒輪往下推,A¹(右)在上升時咬著
//   往上推。齒條的節線在齒條直立時切著節圓(齒形見下面 code review 後那一段)。
// - 行程是 8 個齒距:一個來回齒輪轉 16 齒,兩根齒條每次重新咬合時,齒都落在齒輪的齒槽裡(原本 7.64 個齒距,相位逐圈漂移)。
// - 齒條的傾角由銷在溝裡的位置決定:銷走在靠齒輪的內側時齒條直立、咬著齒輪,走在外側時齒條外傾、離開齒輪。溝是一圈 D 形的溝,
//   外側是直的,內側的兩端是圓角:咬著的那一程開始時銷沿圓角滑進內側(齒條跟著齒輪的齒面一起走,齒順著齒槽進去),
//   那一程結束前沿另一個圓角滑回外側。偏離插圖:原圖左邊的溝圓角在左上與右下(右邊的在右上與左下),照那樣做,A 要在上升的末段
//   (和齒輪左側反向走)擺進齒輪,齒會對撞;所以兩個圓角都改在內側(實物可行 > 插圖外形)。行程兩端兩根齒條都在外側,
//   這一段齒輪靠慣性帶過(推斷,長短見下面 code review 後那一段)。
// - 重錘照原圖:A 的往外伸(球在左下),A¹ 的往內伸(球在兩根齒條中間)。
// - 肘形槓桿 C 鉸在右邊溝槽上方的機架上,弧臂中段的銷以一根短連桿接到 A¹ 的上端(原圖),彈簧 d 一端掛在 C 的弧臂上、另一端掛在
//   機架上。C 與連桿的角度由 A¹ 上端的位置決定(四連桿);受力(重錘把 A¹ 往內擺、d 經 C 與連桿把 A¹ 的上端往外推,銷才在上角
//   走到外側那一條)沒有算,模型照繞圈的方向走。偏離插圖:行程(8 個齒距,約 2.5 倍節圓半徑)比原圖(約 4.4 倍)短、
//   溝也跟著矮:連桿一直接著 A¹,A¹ 上端離 C 鉸銷的距離只能在「C 的臂 − 連桿」到「C 的臂 + 連桿」之間,
//   原圖那麼長的行程短連桿接不起來(實物可行 > 插圖外形;要不要改成只在上角碰到 A¹ 的推桿,寫在報告「需要你決定的」)。
//   彈簧 d 在 C 前面一層,兩端的端圈鉤在 C 與掛柱伸出來的銷上。
// - 機架:溝槽板、溝中間的島、齒輪軸、C 的鉸銷、d 的掛柱都裝在溝槽板後面的一片背板上(推斷;原圖只畫溝槽)。
//
// code review 後(2026-10-20):
// - 齒條的齒照齒輪的齒形展成(齒輪沿節線滾過時一個齒掃過的範圍就是齒槽),推齒輪的那一面(A¹ 的上面、A 的下面)就在掃過
//   範圍的邊上,直立咬著的整段都貼著齒輪的齒(間隙 0);另一面讓 0.03。原本兩者都用 shapes 的直齒側齒形,齒側不共軛,
//   咬著時間隙在 0.003 到 0.007 之間來回,從沒碰到。
// - 溝內側兩端的圓角從 0.45 縮到 0.15:咬著的那一根在行程一端前後才滑進滑出。兩根齒條都離開齒輪(間隙 > 0.02)的只剩
//   活塞離行程兩端約 0.08 以內(行程 2.01;一個來回約 8%,原本約 31%),每次換向這一段齒輪照原來的轉速轉約 0.2 弧度
//   (0.64 齒),推斷是靠齒輪軸上飛輪的慣性(模型沒有算減速)。圓角變陡,銷在圓角上被溝推著橫走(壓力角大),
//   上角那一下由 C 與 d 帶、下角由重錘帶(受力沒有算)。
import { TAU, swingPhase, rot2 } from "./kit.js";
import { shape, thickLine, ring, gearProfile } from "./shapes.js";
import { pointInPolygon, edgeDistance } from "./contact.js";

const GEAR = { center: [0, 0, 0], teeth: 20, r: 0.8 };
const PITCH = (TAU * GEAR.r) / GEAR.teeth;
export const STROKE = 8 * PITCH;
const M = (2 * GEAR.r) / GEAR.teeth; // 模數
const DEPTH = 0.16; // 齒條齒根後面的桿身寬
const POFF = 1.2 * M + DEPTH / 2; // 節線離齒條中心線(經過下端的樞軸)多遠
const PIVOT_X = GEAR.r + POFF; // 齒條直立時,樞軸離齒輪中心的水平距離
const PIN = { up: 4.5, side: 0.55, r: 0.06 }; // 齒條上端的銷:在樞軸上方多高、往外偏多少
const BASE = -3.8; // 行程最低時,齒條樞軸的高度
const AWAY = 0.65; // 銷走外側時,離內側多遠
const T = 0.15; // 溝內側兩端圓角的高度(樞軸走這麼高,咬著的齒條滑進或滑出)
const HALF = PIN.r + 0.02; // 溝的半寬

const xin = (s) => s * (PIVOT_X + PIN.side);
const xout = (s) => s * (PIVOT_X + PIN.side + AWAY);
// 咬著的那一程,銷離內側的比例(以樞軸的高度算):那一程開始的 T 之內從外側滑進內側,結束前的 T 之內滑回外側。
// 和內側的直段相切地接上,到行程端點時橫著走,和外側那一條直溝接成約 80° 的角(溝的形狀就是銷走過的軌跡)
function outward(yv) {
  const c = (v) => Math.min(1, Math.max(0, v));
  const u = Math.max(c((yv - (BASE + STROKE - T)) / T), c((BASE + T - yv) / T));
  return 1 - Math.cos((Math.PI / 2) * u);
}
/** A(s = −1)下降時咬著、A¹(s = +1)上升時咬著 */
const engaged = (s, up) => (s < 0 ? !up : up);
/** 樞軸在 yv 時,銷該在的 x:s 是哪一根,up 是活塞在上升還是下降 */
const pinTarget = (s, yv, up) => (engaged(s, up) ? xin(s) + (xout(s) - xin(s)) * outward(yv) : xout(s));

// 樞軸在 (s·PIVOT_X, yv) 時,齒條轉 a 後齒條上局部點 [lx, ly] 的位置
const rackPoint = (s, yv, a, [lx, ly]) => [s * PIVOT_X + lx * Math.cos(a) - ly * Math.sin(a), yv + lx * Math.sin(a) + ly * Math.cos(a)];
const pinAt = (s, yv, a) => rackPoint(s, yv, a, [s * PIN.side, PIN.up]);
// 齒條的傾角:讓銷落在該在的 x(銷外移時齒條外傾;銷的 x 隨傾角單調變)
function rackAngle(s, yv, up) {
  const want = pinTarget(s, yv, up);
  const miss = (a) => s * (pinAt(s, yv, a)[0] - want);
  let [lo, hi] = [-0.4, 0.4];
  if (s > 0) [lo, hi] = [hi, lo];
  for (let k = 0; k < 60; k++) {
    const mid = (lo + hi) / 2;
    if (miss(mid) < 0) lo = mid;
    else hi = mid;
  }
  const a = (lo + hi) / 2;
  return Math.abs(a) < 1e-9 ? 0 : a;
}

/** 累計行程 v → 活塞桿高度、兩根齒條的傾角、齒輪轉角(逆時針為正) */
export function racks(v) {
  const { at, cycle, forward } = swingPhase(v, 0, STROKE);
  const yv = BASE + at;
  // 上升時 A¹ 咬著齒輪右側往上推,下降時 A 咬著左側往下推:兩程都是逆時針
  const gear = (cycle * 2 * STROKE + (forward ? at : STROKE + (STROKE - at))) / GEAR.r;
  return { y: at, pivotY: yv, up: forward, angleA: rackAngle(-1, yv, forward), angleA1: rackAngle(1, yv, forward), gear };
}
export const geometry = { GEAR, STROKE, PITCH, PIN, PIVOT_X };
/** 檢查用:銷的世界座標 */
export const pinOf = (s, v) => {
  const r = racks(v);
  return pinAt(s, r.pivotY, s < 0 ? r.angleA : r.angleA1);
};
const Y_TOP = pinAt(1, BASE + STROKE, rackAngle(1, BASE + STROKE, false))[1]; // 銷的最高點(行程最高時銷在外側)

// ── 齒條 ──
// 局部原點在下端的樞軸,桿身中心線在 x = 0;齒朝齒輪(−s 那一側)。齒 k 的中心在 y0 + k·齒距:
// 齒條直立、樞軸在 BASE 時,齒落在齒輪(轉角 0、齒 0 朝 +X)的齒槽上(行程是整數個齒距,之後每次重新咬合都對得上)
const N_TEETH = 12;
const TEETH_Y = (() => {
  const y0 = PITCH / 2 - BASE; // 一個齒的中心(對齊條件,模一個齒距)
  const want = -(BASE + STROKE) - 0.4 + PITCH / 2; // 行程最高時,齒輪下緣再往下 0.4 也要有齒
  return y0 + Math.ceil((want - y0) / PITCH) * PITCH; // 最下一齒的中心
})();
const ATT = PIN.up - 0.05; // A¹ 上端接連桿的銷
// 齒條的齒照齒輪的齒形展成:齒輪沿節線滾動(不打滑)時,一個齒掃過的範圍就是齒條的齒槽。SPACE 是各深度 w
// (離節線、朝齒輪為正)的齒槽半寬;推齒輪的那一面就在掃過範圍的邊上(全程貼著齒輪的齒),另一面多讓 BACKLASH。
const BACKLASH = 0.03;
const SPACE = (() => {
  // 齒輪的一個齒(齒 0,朝 +X)連同輪心圍成的多邊形;reach 是齒輪轉 phi、齒條相對齒輪往上 r·phi 時,這個齒在 x = X 上最高到哪
  const tooth = [[0, 0], ...gearProfile({ teeth: GEAR.teeth, radius: GEAR.r }).filter(([x, y]) => Math.abs(Math.atan2(y, x)) <= Math.PI / GEAR.teeth + 1e-9).sort((a, b) => Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0]))];
  const reach = (phi, X) => {
    let hi = 0;
    const pts = tooth.map((q) => { const [x, y] = rot2(q, phi); return [x, y - GEAR.r * phi]; });
    pts.forEach((a, i) => {
      const b = pts[(i + 1) % pts.length];
      if ((a[0] - X) * (b[0] - X) <= 0 && a[0] !== b[0]) hi = Math.max(hi, a[1] + ((X - a[0]) / (b[0] - a[0])) * (b[1] - a[1]));
    });
    return hi;
  };
  // 齒輪的齒尖到齒條節線外 M 為止;再往外到齒根(1.2 M)齒槽照 −0.9 M 的寬度直下
  const levels = Array.from({ length: 20 }, (_, k) => -0.9 * M + (1.9 * M * k) / 19);
  return levels.map((w) => {
    let hs = 0;
    for (let i = -700; i <= 700; i++) hs = Math.max(hs, reach(i * 0.001, GEAR.r - w));
    return [w, hs];
  });
})();
function teethOutline(s) {
  const root = -1.2 * M;
  const half = (hs, drive) => PITCH / 2 - hs - (drive ? 0 : BACKLASH); // 齒的半寬:hs 是齒槽半寬
  const pts = [[TEETH_Y - PITCH / 2, root - DEPTH], [TEETH_Y - PITCH / 2, root]];
  for (let k = 0; k < N_TEETH; k++) {
    const c = TEETH_Y + k * PITCH;
    // 往上推的(A¹,s = +1)上面那一面推齒輪,往下推的(A)下面那一面
    const lo = SPACE.map(([w, hs]) => [c - half(hs, s < 0), w]);
    const hi = SPACE.map(([w, hs]) => [c + half(hs, s > 0), w]).reverse();
    pts.push([lo[0][0], root], ...lo, ...hi, [hi[hi.length - 1][0], root]);
  }
  pts.push([TEETH_Y + (N_TEETH - 0.5) * PITCH, root], [TEETH_Y + (N_TEETH - 0.5) * PITCH, root - DEPTH]);
  const out = pts.map(([u, w]) => [-s * (POFF + w), u]);
  const area = out.reduce((sum, p, i) => sum + p[0] * out[(i + 1) % out.length][1] - out[(i + 1) % out.length][0] * p[1], 0);
  return area < 0 ? out.reverse() : out;
}
// 重錘:A 的往外伸(−x),A¹ 的往內伸(也是 −x,球在兩根齒條中間)
const WEIGHT = { [-1]: { ball: [-1.3, -0.1], r: 0.32 }, [1]: { ball: [-1.2, 0.3], r: 0.3 } };
const unit = ([x, y]) => [x / Math.hypot(x, y), y / Math.hypot(x, y)];
const rackPieces = (s) => {
  const w = WEIGHT[s];
  const dir = unit(w.ball);
  return [
    { kind: "box", size: [DEPTH, PIN.up - 0.02, 0.2], at: [0, 0.1 + (PIN.up - 0.02) / 2, 0] }, // 桿身(從軸眼上緣到上端的臂)
    { kind: "plate", shape: shape(teethOutline(s)), thickness: 0.2, role: "teeth" },
    { kind: "plate", shape: shape(thickLine([[0, PIN.up], [s * PIN.side, PIN.up]], 0.16)), thickness: 0.2 }, // 上端往外伸到銷的臂
    { kind: "cylinder", radius: PIN.r, length: 0.49, at: [s * PIN.side, PIN.up, -0.25] }, // 往後伸進溝槽的銷
    { kind: "cylinder", radius: 0.12, inner: 0.05, length: 0.2 }, // 下端的軸眼
    // 重錘:下端的臂與球
    { kind: "plate", shape: shape(thickLine([[dir[0] * 0.1, dir[1] * 0.1], [w.ball[0] - dir[0] * w.r * 0.8, w.ball[1] - dir[1] * w.r * 0.8]], 0.11)), thickness: 0.11 },
    { kind: "sphere", radius: w.r, at: [w.ball[0], w.ball[1], 0], role: "weight" },
    ...(s > 0 ? [{ kind: "cylinder", radius: 0.05, length: 0.2, at: [0, ATT, 0.15], role: "linkPin" }] : []),
  ];
};

// ── 溝槽 b ──
// 銷的中心線就是銷走過的軌跡:外側一條直線,內側兩端是圓角(逆時針排列)
function loop(s) {
  // 中段的直溝取疏一點,兩端的圓角(高 T)取密一點
  const ys = [
    ...Array.from({ length: 24 }, (_, i) => (T * i) / 24),
    ...Array.from({ length: 25 }, (_, i) => T + ((STROKE - 2 * T) * i) / 24),
    ...Array.from({ length: 24 }, (_, i) => STROKE - T + (T * (i + 1)) / 24),
  ];
  const pts = ys.map((y) => pinAt(s, BASE + y, rackAngle(s, BASE + y, s > 0)));
  // 咬著的那一程從行程一端走到另一端;外側那一條直溝是首尾之間的那條邊
  const area = pts.reduce((sum, p, i) => sum + p[0] * pts[(i + 1) % pts.length][1] - pts[(i + 1) % pts.length][0] * p[1], 0);
  return area < 0 ? pts.reverse() : pts;
}
// 凸的封閉折線往外(d > 0)或往內(d < 0)偏 d 的輪廓:從形心往各方向找離折線正好 |d| 的點(往外偏時角上是圓角,
// 往內偏時角是尖的;直接平移各邊再求交點,在短邊與銳角處會翻出尖刺)。不用 shapes.offsetLoop:它把每個頂點沿前後兩點
// 連線的法線移 d,在外側直溝與圓角相接的約 80° 的角上,相鄰的長邊只偏了不到 d,溝在角上變窄、銷穿進溝壁約 0.03。
function offset(points, d, n = 360) {
  const c = points.reduce((m, p) => [m[0] + p[0] / points.length, m[1] + p[1] / points.length], [0, 0]);
  const signed = (q) => (pointInPolygon(q, points) ? -1 : 1) * edgeDistance(q, points);
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * TAU;
    const u = [Math.cos(t), Math.sin(t)];
    let [lo, hi] = [0, 10];
    for (let k = 0; k < 50; k++) {
      const mid = (lo + hi) / 2;
      if (signed([c[0] + u[0] * mid, c[1] + u[1] * mid]) < d) lo = mid;
      else hi = mid;
    }
    return [c[0] + u[0] * lo, c[1] + u[1] * lo];
  });
}
const SLOT_Z = -0.25; // 溝槽板在齒條後面(厚 0.3,貼著背板),銷往後伸進去
const BACK_Z = -0.45; // 背板
const slotPieces = (s) => {
  const center = loop(s);
  return [
    { kind: "plate", shape: shape(offset(center, HALF + 0.14), [offset(center, HALF).reverse()]), thickness: 0.3, at: [0, 0, SLOT_Z], role: "slot" },
    { kind: "plate", shape: shape(offset(center, -HALF)), thickness: 0.3, at: [0, 0, SLOT_Z], role: "slot" }, // 溝中間的島
  ];
};

// ── 肘形槓桿 C、連桿、彈簧 d ──
// C 的局部座標:鉸銷在原點,連桿的銷在 (0, −C_ARM);弧臂往右鼓,過了連桿的銷再伸一段
const C_PIVOT = [1.6, Y_TOP + 1.3];
const C_ARM = 2.3;
const LINK = 1.2;
const C_Z = 0.4; // C 在最前面一層,連桿在 C 與齒條之間
const LINK_Z = 0.3;
const SPRING_Z = 0.5; // 彈簧 d 在 C 前面一層,兩端鉤在 C 與掛柱伸出來的銷上
const D_COIL = { radius: 0.04, wire: 0.012 };
const HOOK = 0.055; // 彈簧端點離銷心多遠(端圈鉤著銷、不壓進銷)
const C_CURVE = [[0.1, -0.08], [0.2, -0.6], [0.2, -1.3], [0.1, -1.9], [0, -C_ARM], [-0.2, -2.75]];
const C_SPRING = [0.24, -0.45]; // 彈簧 d 掛在弧臂上的點
const D_ANCHOR = [C_PIVOT[0] + 1.3, C_PIVOT[1] - 0.05];
const rot = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];

/** A¹ 上端連桿的銷在 t 時,C 上連桿的銷的位置(兩圓的交點,取在 C 鉸銷與 t 連線左邊那一個)與 C 的轉角 */
export function toggle(t) {
  const [dx, dy] = [t[0] - C_PIVOT[0], t[1] - C_PIVOT[1]];
  const d = Math.hypot(dx, dy);
  const a = (C_ARM * C_ARM - LINK * LINK + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, C_ARM * C_ARM - a * a));
  const [ux, uy] = [dx / d, dy / d];
  // 往 P→t 的右手法線反方向(畫面上 P→t 朝下時是左邊)
  const q = [C_PIVOT[0] + a * ux + h * uy, C_PIVOT[1] + a * uy - h * ux];
  return { pin: q, angle: Math.atan2(q[1] - C_PIVOT[1], q[0] - C_PIVOT[0]) + Math.PI / 2 };
}

// 背板:兩片溝槽板、齒輪軸、C 的鉸銷、d 的掛柱都在它上面
const BACK = (() => {
  const xr = Math.abs(xout(1)) + HALF + 0.3;
  const [y0, y1] = [-0.35, Y_TOP + HALF + 0.3];
  const [cx0, cx1, cy1] = [C_PIVOT[0] - 0.35, D_ANCHOR[0] + 0.3, C_PIVOT[1] + 0.35];
  return [[-xr, y0], [xr, y0], [xr, y1], [cx1, y1], [cx1, cy1], [cx0, cy1], [cx0, y1], [-xr, y1]];
})();

export default {
  figure: 391,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(BACK), thickness: 0.1, at: [0, 0, BACK_Z] },
        ...slotPieces(-1),
        ...slotPieces(1),
        { kind: "cylinder", radius: 0.1, length: 0.6, at: [GEAR.center[0], GEAR.center[1], -0.1] }, // 齒輪軸
        { kind: "cylinder", radius: 0.05, length: C_Z + 0.05 - (BACK_Z + 0.05), at: [C_PIVOT[0], C_PIVOT[1], (C_Z + 0.05 + BACK_Z + 0.05) / 2] }, // C 的鉸銷
        { kind: "cylinder", radius: 0.035, length: SPRING_Z + 0.06 - (BACK_Z + 0.05), at: [D_ANCHOR[0], D_ANCHOR[1], (SPRING_Z + 0.06 + BACK_Z + 0.05) / 2], role: "anchor" }, // d 的掛柱
      ],
    },
    { id: "labelB1", kind: "group", center: [xout(-1) - 0.25, Y_TOP + 0.1, 0], label: "b", labelOffset: [-0.15, 0.2, 0.5] },
    { id: "labelB2", kind: "group", center: [xout(1) + 0.25, Y_TOP + 0.1, 0], label: "b", labelOffset: [0.15, 0.2, 0.5] },
    { id: "gear", kind: "gear", center: GEAR.center, teeth: GEAR.teeth, radius: GEAR.r, width: 0.25, bore: 0.1 },
    { id: "rackA", kind: "group", arrow: false, label: "A", labelOffset: [-0.45, 2.2, 0.3], pieces: rackPieces(-1) },
    { id: "rackA1", kind: "group", arrow: false, label: "A¹", labelOffset: [0.45, 2.2, 0.3], pieces: rackPieces(1) },
    {
      id: "piston",
      kind: "group",
      arrow: false,
      label: "a",
      labelOffset: [-PIVOT_X - 0.1, -0.35, 0.3],
      pieces: [
        // 活塞桿末端分成兩叉,叉端是兩根齒條的樞軸(原圖的 a、a)
        { kind: "plate", shape: shape(thickLine([[-PIVOT_X, 0], [-0.5, -0.5], [0, -0.72], [0.5, -0.5], [PIVOT_X, 0]], 0.16)), thickness: 0.12, at: [0, 0, -0.15] },
        { kind: "cylinder", radius: 0.12, length: 0.12, at: [-PIVOT_X, 0, -0.15] },
        { kind: "cylinder", radius: 0.12, length: 0.12, at: [PIVOT_X, 0, -0.15] },
        { kind: "box", size: [0.16, 1.5, 0.12], at: [0, -0.72 - 0.7, -0.15] },
        // 兩根齒條的樞軸銷:從叉端穿過齒條下端的軸眼
        { kind: "cylinder", radius: 0.05, length: 0.41, at: [-PIVOT_X, 0, -0.005] },
        { kind: "cylinder", radius: 0.05, length: 0.41, at: [PIVOT_X, 0, -0.005] },
      ],
    },
    {
      id: "toggleC",
      kind: "group",
      center: [C_PIVOT[0], C_PIVOT[1], C_Z],
      arrow: false,
      label: "C",
      labelOffset: [-0.55, -1.2, 0.2],
      pieces: [
        { kind: "plate", shape: ring(0.13, 0.05), thickness: 0.06 },
        { kind: "plate", shape: shape(thickLine(C_CURVE, 0.12)), thickness: 0.06 },
        // 肘形槓桿的另一臂:從鉸銷往左的短臂,末端一顆小球(原圖)
        { kind: "plate", shape: shape(thickLine([[-0.12, 0.01], [-0.85, 0.06]], 0.09)), thickness: 0.06 },
        { kind: "sphere", radius: 0.06, at: [-0.85, -0.02, 0] },
        { kind: "cylinder", radius: 0.04, length: 0.18, at: [0, -C_ARM, -0.06], role: "linkPin" },
        { kind: "cylinder", radius: 0.035, length: SPRING_Z + 0.06 - (C_Z - 0.03), at: [C_SPRING[0], C_SPRING[1], (SPRING_Z + 0.06 + C_Z - 0.03) / 2 - C_Z], role: "spring" },
      ],
    },
    { id: "linkC", kind: "link", width: 0.1, thickness: 0.06 },
    { id: "springD", kind: "spring", coils: 9, ...D_COIL, label: "d", labelOffset: [0.2, 0.2, 0.2] },
  ],
  driver: { part: "piston", type: "translation", direction: [0, 1, 0], cycle: [0, STROKE] },
  target: "gear",
  view: { direction: [0.03, 0.05, 1] },
  pose(v) {
    const r = racks(v);
    const att = rackPoint(1, r.pivotY, r.angleA1, [0, ATT]);
    const c = toggle(att);
    const sp = rot(C_SPRING, c.angle);
    const onC = [C_PIVOT[0] + sp[0], C_PIVOT[1] + sp[1]];
    const len = Math.hypot(D_ANCHOR[0] - onC[0], D_ANCHOR[1] - onC[1]);
    const dir = [(D_ANCHOR[0] - onC[0]) / len, (D_ANCHOR[1] - onC[1]) / len];
    return {
      parts: {
        piston: { position: [0, r.pivotY, 0] },
        rackA: { position: [-PIVOT_X, r.pivotY, 0.1], angle: r.angleA },
        rackA1: { position: [PIVOT_X, r.pivotY, 0.1], angle: r.angleA1 },
        gear: { angle: r.gear },
        toggleC: { angle: c.angle },
        linkC: { from: [c.pin[0], c.pin[1], LINK_Z], to: [att[0], att[1], LINK_Z] },
        springD: { from: [onC[0] + dir[0] * HOOK, onC[1] + dir[1] * HOOK, SPRING_Z], to: [D_ANCHOR[0] - dir[0] * HOOK, D_ANCHOR[1] - dir[1] * HOOK, SPRING_Z] },
      },
      readouts: [],
    };
  },
  waivers: [],
};
