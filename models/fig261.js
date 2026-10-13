// 第 261 種:組合式運動。圓盤 B 旋轉,盤上帶一個捲繩鼓輪;臂 A 一端鉸接在右上的 G 點,左端裝滑輪 E;
// 連桿 C 把圓盤上的曲柄銷與臂 A 相連,圓盤轉動時臂 A 繞 G 上下擺動。繩 D 一端吊著重物 W,往上繞過 E,
// 再往下捲在鼓輪上。E 上下移動時 W 移動兩倍的距離;鼓輪又一直把繩捲上來,所以 W 上下往復,
// 下行程比上行程短(每一圈淨上升一段)。主動件是圓盤 B。
// 推斷:各桿長(依原圖比例);為了讓 W 留在畫面內,圓盤可轉的圈數有限。
// 鼓輪照原圖放在圓盤正面(2026-10-13 使用者要求看得到捲繩,改回正面,取代 10/12 的決定 (a):鼓輪移到盤後)。
// 繩 D 照原圖:從 W 往上經 E 的左邊、繞過 E 頂,從 E 的右邊往下到鼓輪的左邊,再逆時針(正面看)捲在鼓輪上;
// 圓盤逆時針轉時鼓輪左邊往下走,把繩捲上來。
// 推斷:鼓輪做成窄的捲繩輪(寬度只容一股繩),繩一層疊一層往外捲成渦線,正面就看得出一圈圈捲上去
// (鼓輪若做長、繩沿軸排,正面看各圈疊在同一個圓上,看不出圈數)。繩頭固定在筒身上;起始時已捲著一圈。
// 推斷(實物可行):曲柄銷不能直接立在盤面上——繩從鼓輪往上到 E,曲柄半徑又大於鼓輪,立在盤面的長銷每圈都會掃過繩;
// 鼓輪也不能伸到連桿 C 的前面,因為連桿 C 每圈從盤心上方掃過。所以鼓輪前面有一個三爪的擋盤(擋住繩不往前滑出),
// 曲柄銷立在其中一爪上;分層由後往前:支架 → 圓盤 → 繩、鼓輪、E、W → 擋盤與曲柄銷 → 連桿 C → 臂 A。
// 繩、E、W 那一層全程在擋盤、曲柄銷與連桿 C 的後面,彼此不相交。E 用一根短軸從臂 A 往後裝。
// 推斷:圓盤的軸往後穿過支架的軸承(原圖支架的橫臂伸到盤後);臂 A 在接點有一根銷穿過連桿 C,
// 在 G 有樞軸銷伸進牆上的支架。
import { Z, TAU, clamp, routeRope, dist } from "./kit.js";
import { crankPin, circleCircle, angleOf } from "./linkage.js";

const B = [0.55, -1.3, 0];
export const CRANK = 0.48;
export const ROPE = 0.045; // 繩的半徑(繪圖層畫繩的粗細)
export const HUB = 0.1; // 鼓輪筒身的半徑
export const LAYER = 0.094; // 繩每多捲一圈,往外疊一層的厚度(繩粗 0.09)
export const R0 = HUB + ROPE; // 最裡面那圈(繩頭)的繩心半徑
export const TURNS0 = 1; // 起始時鼓輪上捲著的圈數
export const SPIDER_R = 0.6; // 擋盤三爪的長度(蓋過捲滿時的最外圈)
export const G = [2.75, 1.9, 0];
export const ARM = 3.6; // G 到 E 中心
export const JOINT = 2.45; // G 到連桿 C 接點的距離
const ROD = 2.9; // 連桿 C 長
export const E_R = 0.5;
const XW = -1.35; // 繩的標籤放在這條直線上(起始時 E 的左緣附近)
const W_SIZE = [0.55, 0.85, 0.2];
export const RANGE = [0, 1.5 * TAU];
// 深度(+z 朝前)
const DISC_W = 0.16; // 圓盤 z ±0.08
export const DRUM_Z = [DISC_W / 2, 0.2]; // 鼓輪筒身:從盤面到擋盤
export const Z_ROPE = (DRUM_Z[0] + DRUM_Z[1]) / 2; // 繩、E、W 所在的平面
const SPIDER_T = 0.05; // 擋盤厚
const Z_ROD = 0.3; // 連桿 C(厚 0.06)
const ROD_T = 0.06;
const Z_ARM = 0.42; // 臂 A(厚 0.08)
const ARM_T = 0.08;
const HOLDER = [-0.38, -0.14]; // 托住盤軸的支架板的深度範圍(在圓盤後面)
const COIL_SAMPLES = 96; // 鼓輪上的繩每圈取樣幾點
// 沿 z 從 z0 到 z1 的圓柱(銷、軸),中心在零件局部座標的 (x, y)
const zPin = (x, y, z0, z1, radius, more = {}) => ({ kind: "cylinder", radius, length: z1 - z0, at: [x, y, (z0 + z1) / 2], ...more });
// 擋盤的一爪:從盤心往角 a 伸出的長條(板件,沿 z 擠出)
const claw = (a, width, z0, z1) => {
  const [c, s] = [Math.cos(a), Math.sin(a)];
  const w = width / 2;
  const outline = [[w * s, -w * c], [SPIDER_R * c + w * s, SPIDER_R * s - w * c], [SPIDER_R * c - w * s, SPIDER_R * s + w * c], [-w * s, w * c]];
  return { kind: "plate", shape: { outline, holes: [] }, thickness: z1 - z0, at: [0, 0, (z0 + z1) / 2] };
};

/** 圓盤轉 theta(逆時針):曲柄銷、臂 A 的轉角、E 的中心 */
export function arm(theta) {
  const pin = crankPin(B, CRANK, theta + Math.PI / 2);
  // 連桿接點在以 G 為圓心、半徑 JOINT 的圓上,離曲柄銷 ROD
  const joint = circleCircle(G, JOINT, pin, ROD, -1).point;
  const a = angleOf(G, joint);
  const e = [G[0] + ARM * Math.cos(a), G[1] + ARM * Math.sin(a), 0];
  return { pin, joint, angle: a, e };
}

/** 鼓輪上離繩頭 u(弧度)處的繩心半徑:每捲一圈往外疊一層 */
export const coilRadius = (u) => R0 + (LAYER * u) / TAU;
// 半徑隨角線性增加的渦線,從繩頭量到 u 的弧長(封閉解)
const C = LAYER / TAU;
const F = (r) => (r * Math.hypot(r, C) + C * C * Math.log(r + Math.hypot(r, C))) / (2 * C);
/** 鼓輪上捲著 u(弧度)的繩長 */
export const woundLength = (u) => F(coilRadius(u)) - F(R0);

// 沒捲上的那段繩(在繩的平面):從 W 往上到 E 的左緣,順時針繞過 E 頂,從 E 的右邊往下,
// 逆時針搭上鼓輪最外圈(繩心半徑 r)的左邊
const freeRoute = (e, yW, r) =>
  routeRope([
    { point: [e[0] - E_R, yW, Z_ROPE] },
    { circle: { center: [e[0], e[1], Z_ROPE], axis: Z, radius: E_R, sense: -1 } },
    { circle: { center: [B[0], B[1], Z_ROPE], axis: Z, radius: r, sense: 1 } },
  ]);
// routeRope 在最後一個輪上只停在切點(其後是重合的點):去掉重合的點
const trimmed = (route) => {
  let n = route.points.length;
  while (n > 2 && dist(route.points[n - 2], route.points[n - 1]) < 1e-12) n--;
  return route.points.slice(0, n);
};
// 切點在鼓輪上的角(逆時針,0 朝右)
const tangentAngle = (p) => {
  const a = Math.atan2(p[1] - B[1], p[0] - B[0]);
  return a < 0 ? a + TAU : a;
};

/**
 * 圓盤轉 theta、W 掛繩處在 yW 時繩的形狀。繩頭固定在筒身上跟著圓盤轉:繩頭的角 = HEAD0 + theta;
 * coil 是鼓輪上捲著的角度(從切點逆時針量到繩頭)。最外圈的半徑隨 coil 變大,切點又隨最外圈的半徑移動,反覆逼近。
 */
function ropeAt(theta, e, yW, coil = HEAD0 + theta - Math.PI) {
  let route;
  let points;
  for (let i = 0; i < 8; i++) {
    route = freeRoute(e, yW, coilRadius(coil));
    points = trimmed(route);
    coil = HEAD0 + theta - tangentAngle(points.at(-1));
  }
  const phi = tangentAngle(points.at(-1));
  return { route, points, phi, coil, free: route.length, wound: woundLength(coil) };
}

// 起始時(theta = 0)鼓輪上捲著 TURNS0 圈,W 那段繩長 H0
const H0 = 2.9;
const E0 = arm(0).e;
const HEAD0 = tangentAngle(trimmed(freeRoute(E0, E0[1] - H0, coilRadius(TURNS0 * TAU))).at(-1)) + TURNS0 * TAU;
/** 繩 D 的全長(從 W 到繩頭,不可伸長) */
export const LENGTH = (() => {
  const r = ropeAt(0, E0, E0[1] - H0);
  return r.free + r.wound;
})();

/**
 * 圓盤轉 theta:重物 W 的高度(頂端掛繩處)、E 的中心與繩的形狀。
 * 繩長守恆:W 到切點這段(含繞過 E 的弧)+ 捲在鼓輪上的長度 = LENGTH;鼓輪逆時針轉時把繩捲上,W 那段就短了。
 */
export function weight(theta0) {
  const theta = clamp(theta0, ...RANGE);
  const { e } = arm(theta);
  // 繩長隨 W 的高度線性變化,修正一兩次即收斂(切點與捲著的圈數也跟著動,所以反覆幾次)
  let yW = e[1] - H0;
  let rope = ropeAt(theta, e, yW);
  for (let i = 0; i < 12; i++) {
    const over = rope.free + rope.wound - LENGTH;
    if (Math.abs(over) < 1e-12) break;
    yW += over; // W 吊在 E 左緣的正下方,那段繩垂直:W 每降 1,繩長多 1
    rope = ropeAt(theta, e, yW, rope.coil);
  }
  return { yW, e, rope };
}

// 繩從 W 搭上 E 的那一點:離 W 的弧長(繩的材料座標)與它在 E 上的角
const onE = ({ e, rope }) => {
  const enter = rope.points[1];
  return { s: rope.route.arrivals[0], psi: Math.atan2(enter[1] - e[1], enter[0] - e[0]) };
};
let E_REF; // theta = 0 時的 onE(第一次用到時才算:LENGTH 要先算好)
/** 繩在 E 上不打滑:E 的轉角(逆時針為正) */
export function pulleyTurn(theta, w = weight(theta)) {
  E_REF ??= onE(weight(0));
  const a = onE(w);
  // 繩繞 E 是順時針:E 上角 α 處的繩,材料座標 = s + E_R(ψ − α);貼著 E 的那段繩和 E 一起轉,
  // 所以 s / E_R + ψ − E 的轉角不變
  return (a.s - E_REF.s) / E_R + (a.psi - E_REF.psi);
}

/** 繩 D 的折線:從 W 起,經 E、鼓輪最外圈的切點,沿渦線一圈圈往裡到繩頭 */
export function ropePoints(theta, { rope } = weight(theta)) {
  const pts = [...rope.points];
  const n = Math.max(2, Math.ceil((rope.coil / TAU) * COIL_SAMPLES));
  for (let i = 1; i <= n; i++) {
    const u = rope.coil * (1 - i / n); // 離繩頭的角度(從最外圈往裡走)
    const a = rope.phi + (rope.coil - u);
    const r = coilRadius(u);
    pts.push([B[0] + r * Math.cos(a), B[1] + r * Math.sin(a), Z_ROPE]);
  }
  return pts;
}

export default {
  figure: 261,
  parts: [
    {
      id: "wall",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.12, 5.0, 1.2], at: [3.05, 0.0, -0.25] }, // 牆(z −0.85…0.35)
        // 托住圓盤軸的支架:橫臂伸到盤心後方(軸承),下面是弧形的撐板;整片在圓盤後面
        { kind: "plate", shape: { outline: [[3.0, -2.2], [3.0, -1.0], [B[0] - 0.25, -1.0], [B[0] - 0.25, -1.6], [1.8, -1.65]], holes: [] }, thickness: HOLDER[1] - HOLDER[0], at: [0, 0, (HOLDER[0] + HOLDER[1]) / 2] },
        // 臂 A 的樞軸座(G),前面離臂 A 0.04
        { kind: "plate", shape: { outline: [[3.0, 1.65], [3.0, 2.15], [2.6, 2.0], [2.6, 1.8]], holes: [] }, thickness: 0.44, at: [0, 0, Z_ARM - ARM_T / 2 - 0.04 - 0.22] },
      ],
    },
    {
      id: "discB",
      kind: "pulley",
      style: "disc",
      center: B,
      radius: 0.85,
      width: DISC_W,
      label: "B",
      labelOffset: [0.55, -0.55, 0.4],
      pieces: [
        zPin(0, 0, DRUM_Z[0], DRUM_Z[1], HUB), // 鼓輪筒身,在圓盤正面
        // 鼓輪前面的三爪擋盤,曲柄銷立在朝上的那一爪上
        ...[0, 1, 2].map((k) => claw(Math.PI / 2 + (k * TAU) / 3, 0.07, DRUM_Z[1], DRUM_Z[1] + SPIDER_T)),
        zPin(0, 0, DRUM_Z[1], DRUM_Z[1] + SPIDER_T, HUB), // 擋盤的轂
        zPin(0, 0, HOLDER[0] - 0.04, DRUM_Z[1] + SPIDER_T + 0.005, 0.068), // 盤的軸:往後穿過支架的軸承
        zPin(0, CRANK, DRUM_Z[1] + SPIDER_T - 0.01, Z_ROD + ROD_T / 2 + 0.03, 0.06, { accent: true }), // 曲柄銷,立在擋盤上,穿過連桿 C
      ],
    },
    { id: "rodC", kind: "link", width: 0.12, thickness: ROD_T, pins: false, label: "C", labelOffset: [0.15, 1.4, 0.3] },
    {
      id: "armA",
      kind: "link",
      width: 0.14,
      thickness: ARM_T,
      pins: false,
      label: "A",
      labelOffset: [0.3, 0.3, 0.3],
      // 臂的局部座標:x 沿臂(G 在 0、E 在 ARM),z 是離臂中面的深度(世界 z − Z_ARM)
      pieces: [
        zPin(0, 0, -ARM_T / 2 - 0.3, ARM_T / 2 + 0.02, 0.035), // G 的樞軸銷,往後伸進支架
        zPin(JOINT, 0, Z_ROD - ROD_T / 2 - 0.02 - Z_ARM, ARM_T / 2 + 0.02, 0.03), // 接點的銷,往後穿過連桿 C
        zPin(ARM, 0, Z_ROPE - 0.12 - Z_ARM, ARM_T / 2 + 0.02, 0.035), // E 的短軸,往後穿過 E
      ],
    },
    { id: "pulleyE", kind: "pulley", style: "disc", radius: E_R, width: 0.16, label: "E", labelOffset: [0, 0, 0.6] },
    { id: "ropeD", kind: "rope", label: "D", center: [XW, 0, Z_ROPE], labelOffset: [-0.3, 0, 0.3] },
    { id: "weightW", kind: "box", size: W_SIZE, label: "W", labelOffset: [0, 0, 0.5] },
  ],
  driver: { part: "discB", type: "rotation", range: RANGE, initial: 0 },
  target: "weightW", // 被吊起又放下的重物
  view: { direction: [0.05, 0.05, 1], fitSamples: 16 }, // 重物在第一圈中途最低:取景在範圍內均勻取樣,W 全程留在畫面內
  pose(theta0) {
    const theta = clamp(theta0, ...RANGE);
    const { pin, joint, e } = arm(theta);
    const w = weight(theta);
    // 繩的起點是 W 的吊環(繩的一端),繩不伸長:離起點的弧長就是材料座標,記號不另外移相
    return {
      parts: {
        discB: { angle: theta },
        rodC: { from: [pin[0], pin[1], Z_ROD], to: [joint[0], joint[1], Z_ROD] },
        armA: { from: [G[0], G[1], Z_ARM], to: [e[0], e[1], Z_ARM] },
        pulleyE: { position: [e[0], e[1], Z_ROPE], angle: pulleyTurn(theta, w) },
        weightW: { position: [w.e[0] - E_R, w.yW - W_SIZE[1] / 2, Z_ROPE] }, // 繩繫在 W 頂上,W 吊在 E 左緣的正下方
      },
      paths: { ropeD: { points: ropePoints(theta, w), closed: false, phase: 0 } },
      readouts: [],
    };
  },
};
