// 第 358 種:托架的橫移運動,由鏈索輪(fusee)依皮帶作用處的直徑而改變快慢。左邊的曲柄轉動鏈索輪,
// 皮帶捲在鏈索輪的螺旋槽裡,另一端拉著右邊在導軌上的托架;皮帶捲在大直徑處時托架走得快,
// 捲到小直徑處時走得慢。主動件是曲柄。
// 推斷:皮帶從鏈索輪的大端開始捲、往小端走;托架被拉向鏈索輪(沿軸向橫移)。
// 皮帶照原圖從鏈索輪的切線方向(垂直於軸)離開:從鏈索輪前面往上,繞過機架上的導輪(推斷,原圖沒畫)轉成沿軸向,
// 再接到托架頂上的橫桿。作用處沿軸在大小端之間移動,導輪做成寬的滾筒,皮帶在導輪上的深度跟著作用處的半徑走;
// 導輪放得比鏈索輪高很多,往上的一段只斜一點(原圖的皮帶也是斜的)。
// 皮帶長不變:托架的位置 = 皮帶總長 − 捲在鏈索輪上的長 − 往上的一段 − 繞在導輪上的一段;
// 托架的速度大致是作用處的半徑 × 曲柄角速度,差的部分來自往上那一段的斜度與螺旋的升程。
// 偏離插圖:原圖托架兩根橫軸上的輪子輪面和鏈索輪軸垂直,像是沿垂直於軸的方向走;照維護者的決定(2026-10-14 (a)),
// 托架沿軸向走,輪子改成輪面和軸平行,上輪壓在上導軌頂面、下輪頂著下導軌底面(夾住導軌,推斷)。
// 托架與導軌在鏈索輪前面一層,全程不碰鏈索輪與它的軸;機架是一塊底座,兩個軸承座、導軌的柱與導輪的柱都立在上面。
import { X, Z, TAU, clamp } from "./kit.js";
import { spanBox } from "./shapes.js";

const AXIS_Y = 0.0;
const FUSEE = { from: -1.6, to: 0.5, big: 0.95, small: 0.35 };
export const TURNS = 1.25;
export const RANGE = [0, TURNS * TAU];
const PITCH = (FUSEE.to - FUSEE.from - 0.2) / TURNS;
const LIFT = 0.07; // 皮帶中心線離鏈索輪面的高度(皮帶壓在螺旋槽的凸條上)
const BELT_R = 0.045; // 皮帶(繩)的粗細(半徑)
const SHAFT = { r: 0.08, from: -2.8, to: 0.8 }; // 鏈索輪的軸(沿 x)
// 導輪(推斷):寬的滾筒,軸沿 z,在鏈索輪上方
const GUIDE = { x: 0.1, y: 3.2, r: 0.28, z0: 0.3, z1: 1.1 };
const GR = GUIDE.r + BELT_R; // 皮帶繞在導輪上的半徑
const HOOK_Y = GUIDE.y + GR; // 皮帶從導輪頂上沿軸向拉到托架
const CZ = 0.62; // 托架那一層的深度
const WHEEL = { r: 0.25, w: 0.12, z: CZ + 0.22, top: 2.5, bottom: -0.3 }; // 托架的輪:半徑、寬、深度、上下輪心的高度
const RAIL = { z0: WHEEL.z - 0.08, z1: WHEEL.z + 0.08, from: 0.9, to: 8.45, t: 0.12 };
const BASE_Y = -1.3; // 底座頂面
const HOOK = -0.41; // 皮帶接在托架頂上橫桿的左端(相對托架的位置)

/** 鏈索輪在 x 處的半徑(直線錐) */
export const radiusAt = (x) => FUSEE.big + ((FUSEE.small - FUSEE.big) * (x - FUSEE.from)) / (FUSEE.to - FUSEE.from);

// 螺旋槽:參數 s 從大端起量的轉角;曲柄轉角 theta 時,s 那一點在鏈索輪上的世界角(從 +y 往 +z 量)是 π/2 − s + theta,
// 所以 s = theta 那一點正好在鏈索輪正前方(z 最大處)——皮帶在那裡沿切線往上離開
const grooveX = (s) => FUSEE.from + 0.1 + (PITCH * s) / TAU;
const SLOPE = (FUSEE.small - FUSEE.big) / (FUSEE.to - FUSEE.from);
const P = PITCH / TAU;
// 捲在鏈索輪上的皮帶長:∫ √(ρ² + x'² + ρ'²) ds,ρ 是皮帶中心線的半徑
function coilLength(theta) {
  const n = 64;
  const f = (s) => Math.hypot(radiusAt(grooveX(s)) + LIFT, P, P * SLOPE);
  let sum = f(0) + f(theta);
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * f((theta * i) / n);
  return (sum * theta) / (3 * n);
}

/** 曲柄轉 theta → 皮帶作用處的位置與半徑、捲進的皮帶長 */
export function fusee(theta0) {
  const theta = clamp(theta0, ...RANGE);
  const x = grooveX(theta);
  return { theta, x, r: radiusAt(x), wound: coilLength(theta) };
}

// 從 xy 平面上的一點 a 往導輪拉的切點(皮帶從導輪的左邊繞上去、順時針繞到頂上)
function guideEntry([ax, ay]) {
  const dx = ax - GUIDE.x;
  const dy = ay - GUIDE.y;
  const d = Math.hypot(dx, dy);
  const phi = Math.atan2(dy, dx) - Math.acos(GR / d);
  const entry = phi < 0 ? phi + TAU : phi; // 落在左半邊(π/2 到 3π/2 之間)
  return { angle: entry, point: [GUIDE.x + GR * Math.cos(entry), GUIDE.y + GR * Math.sin(entry)], free: Math.sqrt(d * d - GR * GR) };
}

// 皮帶在曲柄轉角 theta 時的各段:捲在鏈索輪上、往上到導輪、繞在導輪上;剩下的(總長扣掉這些)是沿軸向到托架的一段
function belt(theta) {
  const f = fusee(theta);
  const rb = f.r + LIFT; // 往上那一段所在的深度(z)
  const e = guideEntry([f.x, AXIS_Y]);
  const wrap = e.angle - Math.PI / 2;
  return { f, rb, e, used: f.wound + e.free + GR * wrap };
}
// 皮帶總長:曲柄轉到底時托架停在 X_END(托架左邊離導軌左端的柱還有一點距離)
const X_END = 1.6;
const spanFor = (b, hx) => Math.hypot(hx - GUIDE.x, CZ - b.rb);
const LENGTH = (() => {
  const b = belt(RANGE[1]);
  return b.used + spanFor(b, X_END + HOOK);
})();

/** 曲柄轉 theta → 托架的位置(皮帶長不變) */
export function carriageAt(theta) {
  const b = belt(theta);
  const span = LENGTH - b.used;
  return { ...b, span, x: GUIDE.x + Math.sqrt(span * span - (CZ - b.rb) ** 2) - HOOK };
}
const CARRIAGE0 = carriageAt(0).x;

// 螺旋槽的凸條(固定在鏈索輪上,局部座標:局部 z 沿軸;世界 (x, y, z) 在局部是 (−z, y, x))
const ridge = Array.from({ length: Math.round(TURNS * 48) + 1 }, (_, i) => {
  const s = (i / 48) * TAU;
  const x = grooveX(s);
  const r = radiusAt(x) + 0.02;
  const a = Math.PI / 2 - s;
  return [-r * Math.sin(a), r * Math.cos(a), x];
});

// 軸承環(軸沿 x)與底下的座
const bearing = (x, len) => [
  { kind: "cylinder", axis: X, radius: 0.2, inner: SHAFT.r, length: len, at: [x, AXIS_Y, 0] },
  spanBox(x - len / 2, x + len / 2, BASE_Y, AXIS_Y - 0.17, -0.2, 0.2),
];
const TOP_RAIL_Y = WHEEL.top - WHEEL.r; // 上導軌頂面
const BOTTOM_RAIL_Y = WHEEL.bottom + WHEEL.r; // 下導軌底面
const railPost = (x) => spanBox(x - 0.1, x + 0.1, BASE_Y, TOP_RAIL_Y, RAIL.z0, RAIL.z1);

export default {
  figure: 358,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 底座(推斷)
        spanBox(-3.3, RAIL.to + 0.2, BASE_Y - 0.15, BASE_Y, -1.25, 1.25),
        // 鏈索輪軸的兩個軸承:左邊在曲柄與鏈索輪之間,右邊在鏈索輪小端與軸端之間(軸穿過環孔)
        ...bearing(-2.2, 0.25),
        ...bearing(0.65, 0.2),
        // 導軌:上導軌頂面托著上輪,下導軌底面擋著下輪;兩端各一根柱立在底座上
        spanBox(RAIL.from, RAIL.to, TOP_RAIL_Y - RAIL.t, TOP_RAIL_Y, RAIL.z0, RAIL.z1),
        spanBox(RAIL.from, RAIL.to, BOTTOM_RAIL_Y, BOTTOM_RAIL_Y + RAIL.t, RAIL.z0, RAIL.z1),
        railPost(RAIL.from + 0.1),
        railPost(RAIL.to - 0.1),
        // 導輪的柱:在鏈索輪後面立到導輪的高度,導輪的軸往前伸過鏈索輪上方
        spanBox(GUIDE.x - 0.12, GUIDE.x + 0.12, BASE_Y, GUIDE.y + 0.12, -1.15, -0.95),
      ],
    },
    {
      id: "fusee",
      kind: "group",
      axis: X,
      center: [0, AXIS_Y, 0],
      spin: FUSEE.big,
      spinOffset: FUSEE.from - 0.05,
      pieces: [
        { kind: "lathe", profile: [[0, FUSEE.from], [FUSEE.big, FUSEE.from], [FUSEE.small, FUSEE.to], [0, FUSEE.to]], mark: true },
        { kind: "tube", points: ridge, radius: 0.025 },
        { kind: "cylinder", radius: SHAFT.r, length: SHAFT.to - SHAFT.from, at: [0, 0, (SHAFT.from + SHAFT.to) / 2] },
        // 曲柄
        { kind: "box", size: [0.12, 0.7, 0.12], at: [0, -0.35, -2.75] },
        { kind: "cylinder", radius: 0.07, length: 0.45, at: [0, -0.7, -2.95], accent: true },
      ],
    },
    // 導輪(推斷):寬的滾筒與它的軸,軸的後端穿進機架的柱
    {
      id: "guide",
      kind: "group",
      axis: Z,
      center: [GUIDE.x, GUIDE.y, 0],
      spin: GUIDE.r,
      spinOffset: GUIDE.z1 + 0.05,
      pieces: [
        { kind: "cylinder", radius: GUIDE.r, length: GUIDE.z1 - GUIDE.z0, at: [0, 0, (GUIDE.z0 + GUIDE.z1) / 2], mark: true },
        { kind: "cylinder", radius: 0.05, length: GUIDE.z1 + 0.05 + 1.1, at: [0, 0, (GUIDE.z1 + 0.05 - 1.1) / 2] },
      ],
    },
    {
      id: "carriage",
      kind: "group",
      pieces: [
        // 兩根直桿與三根橫桿:頂上的橫桿接皮帶,另兩根橫桿托著上下兩個輪的軸
        spanBox(-0.41, -0.29, -0.75, HOOK_Y + 0.18, CZ - 0.06, CZ + 0.06),
        spanBox(0.29, 0.41, -0.75, HOOK_Y + 0.18, CZ - 0.06, CZ + 0.06),
        spanBox(-0.41, 0.41, HOOK_Y - 0.06, HOOK_Y + 0.06, CZ - 0.06, CZ + 0.06),
        spanBox(-0.41, 0.41, WHEEL.top - 0.06, WHEEL.top + 0.06, CZ - 0.06, CZ + 0.06),
        spanBox(-0.41, 0.41, WHEEL.bottom - 0.06, WHEEL.bottom + 0.06, CZ - 0.06, CZ + 0.06),
        // 輪軸:從橫桿往前穿過輪
        { kind: "cylinder", radius: 0.04, length: WHEEL.z + 0.1 - CZ, at: [0, WHEEL.top, (WHEEL.z + 0.1 + CZ) / 2] },
        { kind: "cylinder", radius: 0.04, length: WHEEL.z + 0.1 - CZ, at: [0, WHEEL.bottom, (WHEEL.z + 0.1 + CZ) / 2] },
      ],
    },
    { id: "wheelTop", kind: "pulley", axis: Z, center: [CARRIAGE0, WHEEL.top, WHEEL.z], radius: WHEEL.r, width: WHEEL.w, arrow: false },
    { id: "wheelBottom", kind: "pulley", axis: Z, center: [CARRIAGE0, WHEEL.bottom, WHEEL.z], radius: WHEEL.r, width: WHEEL.w, arrow: false },
    { id: "belt", kind: "rope", radius: BELT_R },
  ],
  driver: { part: "fusee", type: "rotation", range: RANGE, initial: 0 },
  target: "carriage", // 被拉著橫移的托架
  view: { direction: [0.08, 0.25, 1] },
  pose(theta0) {
    const c = carriageAt(theta0);
    const { theta } = c.f;
    // 捲在鏈索輪上的一段:從大端的繩頭(固定在鏈索輪上、跟著轉)沿螺旋槽到正前方的切點
    const n = theta > 1e-9 ? Math.max(2, Math.ceil((theta / TAU) * 96)) : 0;
    const coil = Array.from({ length: n + 1 }, (_, i) => {
      const s = n ? (theta * i) / n : 0;
      const x = grooveX(s);
      const rho = radiusAt(x) + LIFT;
      const a = Math.PI / 2 - s + theta;
      return [x, AXIS_Y + rho * Math.cos(a), rho * Math.sin(a)];
    });
    // 繞在導輪上的一段:從切點順時針繞到頂上(在往上那一段的深度)
    const m = Math.max(2, Math.ceil(((c.e.angle - Math.PI / 2) / TAU) * 64));
    const arc = Array.from({ length: m + 1 }, (_, i) => {
      const a = c.e.angle - ((c.e.angle - Math.PI / 2) * i) / m;
      return [GUIDE.x + GR * Math.cos(a), GUIDE.y + GR * Math.sin(a), c.rb];
    });
    const hook = [c.x + HOOK, HOOK_Y, CZ];
    // 輪沿導軌滾:上輪壓在導軌頂面(往左走時逆時針),下輪頂著導軌底面(反過來)
    const moved = c.x - CARRIAGE0;
    return {
      parts: {
        fusee: { angle: theta },
        carriage: { position: [c.x, 0, 0] },
        wheelTop: { position: [c.x, WHEEL.top, WHEEL.z], angle: -moved / WHEEL.r },
        wheelBottom: { position: [c.x, WHEEL.bottom, WHEEL.z], angle: moved / WHEEL.r },
        // 導輪頂上的皮帶往鏈索輪那邊走:導輪逆時針
        guide: { angle: (carriageAt(0).span - c.span) / GR },
      },
      // 皮帶的起點(繩頭)固定在鏈索輪上跟著轉,離起點的弧長就是材料座標,不另外移相
      paths: { belt: { points: [...coil, ...arc, hook], closed: false, phase: 0 } },
      readouts: [],
    };
  },
};
