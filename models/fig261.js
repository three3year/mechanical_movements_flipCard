// 第 261 種:組合式運動。圓盤 B 旋轉,盤上帶一個捲繩鼓輪;臂 A 一端鉸接在右上的 G 點,左端裝滑輪 E;
// 連桿 C 把圓盤上的曲柄銷與臂 A 相連,圓盤轉動時臂 A 繞 G 上下擺動。繩 D 一端吊著重物 W,往上繞過 E,
// 再往下捲在鼓輪上。E 上下移動時 W 移動兩倍的距離;鼓輪又一直把繩捲上來,所以 W 上下往復,
// 下行程比上行程短(每一圈淨上升一段)。主動件是圓盤 B。
// 推斷:各桿長與鼓輪半徑(依原圖比例);為了讓 W 留在畫面內,圓盤可轉的圈數有限。
// 偏離插圖(實物可行優先):原圖把鼓輪畫在圓盤看得見的那一面,原文只說「carrying a drum」、沒說哪一面。
// 曲柄半徑大於鼓輪半徑、連桿 C 又從盤心上方掃過,鼓輪若在正面,曲柄銷每圈都會掃過往上的繩;
// 所以鼓輪、繩 D、滑輪 E 與重物 W 都放在圓盤背面的平面(維護者 2026-10-12 決定),正面看時鼓輪被圓盤擋住,
// 只看得到繩從盤緣後面伸出。前面一層是曲柄銷、連桿 C 與臂 A;E 用一根短軸往後裝在臂 A 上。
// 推斷:圓盤的軸往後穿過鼓輪,伸進牆上支架的軸承(原圖支架的橫臂伸到盤後);臂 A 在接點有一根銷穿過連桿 C,
// 在 G 有樞軸銷伸進牆上的支架。
import { Z, TAU, clamp, routeRope, dist } from "./kit.js";
import { crankPin, circleCircle, angleOf } from "./linkage.js";

const B = [0.55, -1.3, 0];
export const CRANK = 0.48;
export const DRUM = 0.2;
export const G = [2.75, 1.9, 0];
export const ARM = 3.6; // G 到 E 中心
export const JOINT = 2.45; // G 到連桿 C 接點的距離
const ROD = 2.9; // 連桿 C 長
const E_R = 0.5;
const XW = -1.35; // 重物所在的直線(E 的左緣)
export const RANGE = [0, 2 * TAU];
// 深度(+z 朝前):圓盤 z ±0.08;前面一層是連桿 C、再前是臂 A;背面一層是鼓輪、繩、E、W;最後面是托住盤軸的支架
const DISC_W = 0.16;
const Z_ROD = 0.2; // 連桿 C(厚 0.06)
const ROD_T = 0.06;
const Z_ARM = 0.32; // 臂 A(厚 0.08)
const ARM_T = 0.08;
const Z_BACK = -0.25; // 鼓輪、繩、E、W 所在的平面
const HOLDER = [-0.75, -0.47]; // 托住盤軸的支架板的深度範圍(在鼓輪後面)
// 沿 z 從 z0 到 z1 的圓柱(銷、軸),中心在零件局部座標的 (x, y)
const zPin = (x, y, z0, z1, radius, more = {}) => ({ kind: "cylinder", radius, length: z1 - z0, at: [x, y, (z0 + z1) / 2], ...more });

/** 圓盤轉 theta(逆時針):曲柄銷、臂 A 的轉角、E 的中心 */
export function arm(theta) {
  const pin = crankPin(B, CRANK, theta + Math.PI / 2);
  // 連桿接點在以 G 為圓心、半徑 JOINT 的圓上,離曲柄銷 ROD
  const joint = circleCircle(G, JOINT, pin, ROD, -1).point;
  const a = angleOf(G, joint);
  const e = [G[0] + ARM * Math.cos(a), G[1] + ARM * Math.sin(a), 0];
  return { pin, joint, angle: a, e };
}

// 繩:從 W 往上到 E 的左緣,繞過 E 頂,往下到鼓輪,捲在鼓輪上
const ropeRoute = (e, yW) =>
  routeRope([
    { point: [e[0] - E_R, yW, Z_BACK] },
    { circle: { center: [e[0], e[1], Z_BACK], axis: Z, radius: E_R, sense: -1 } },
    { circle: { center: [B[0], B[1], Z_BACK], axis: Z, radius: DRUM, sense: -1 } },
  ]);
// 繩長(不含 W 那一段)只隨 E 的位置改變;W 那一段 = 總長 − 其餘 − 鼓輪捲上的量
const rest = (e) => {
  const r = ropeRoute(e, e[1] - 1);
  return r.length - 1;
};
const REST0 = arm(0).e;
const TOTAL = rest(REST0) + 4.4;

/** 圓盤轉 theta:重物 W 的高度(頂端掛繩處)與 E 的中心 */
export function weight(theta0) {
  const theta = clamp(theta0, ...RANGE);
  const { e } = arm(theta);
  const hang = TOTAL - rest(e) - DRUM * theta; // 鼓輪逆時針轉時把繩捲上
  return { yW: e[1] - hang, e };
}

export default {
  figure: 261,
  parts: [
    {
      id: "wall",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.12, 5.0, 1.2], at: [3.05, 0.0, -0.25] }, // 牆(z −0.85…0.35)
        // 托住圓盤軸的支架:橫臂伸到盤心後方(軸承),下面是弧形的撐板;整片在鼓輪後面
        { kind: "plate", shape: { outline: [[3.0, -2.2], [3.0, -1.0], [B[0] - 0.25, -1.0], [B[0] - 0.25, -1.6], [1.8, -1.65]], holes: [] }, thickness: HOLDER[1] - HOLDER[0], at: [0, 0, (HOLDER[0] + HOLDER[1]) / 2] },
        // 臂 A 的樞軸座(G),前面離臂 A 0.04
        { kind: "plate", shape: { outline: [[3.0, 1.65], [3.0, 2.15], [2.6, 2.0], [2.6, 1.8]], holes: [] }, thickness: 0.44, at: [0, 0, 0.02] },
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
      labelOffset: [0, -0.15, 0.4],
      pieces: [
        zPin(0, 0, -0.42, -DISC_W / 2, DRUM), // 鼓輪,在圓盤背面
        zPin(0, 0, -0.8, 0.128, 0.068), // 盤的軸:往後穿過鼓輪,伸進支架的軸承
        zPin(0, CRANK, -0.05, Z_ROD + ROD_T / 2 + 0.03, 0.07, { accent: true }), // 曲柄銷,只在盤前,穿過連桿 C
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
        zPin(0, 0, 0 - Z_ARM, 0.4 - Z_ARM, 0.035), // G 的樞軸銷,往後伸進支架
        zPin(JOINT, 0, 0.14 - Z_ARM, 0.38 - Z_ARM, 0.03), // 接點的銷,往後穿過連桿 C
        zPin(ARM, 0, -0.4 - Z_ARM, 0.38 - Z_ARM, 0.035), // E 的短軸,往後穿過 E
      ],
    },
    { id: "pulleyE", kind: "pulley", style: "disc", radius: E_R, width: 0.16, label: "E", labelOffset: [0, 0, 0.6] },
    { id: "ropeD", kind: "rope", label: "D", center: [XW, 0, Z_BACK], labelOffset: [-0.3, 0, 0.3] },
    { id: "weightW", kind: "box", size: [0.55, 0.85, 0.3], label: "W", labelOffset: [0, 0, 0.5] },
  ],
  driver: { part: "discB", type: "rotation", range: RANGE, initial: 0 },
  target: "weightW", // 被吊起又放下的重物
  view: { direction: [0.05, 0.05, 1], fitSamples: 16 }, // 重物在第一圈中途最低:取景在範圍內均勻取樣,W 全程留在畫面內
  pose(theta0) {
    const theta = clamp(theta0, ...RANGE);
    const { pin, joint, e } = arm(theta);
    const { yW } = weight(theta);
    const route = ropeRoute(e, yW);
    // 繩在 E 上走過的量:W 那一段變長多少,E 就轉多少
    const e0 = weight(0);
    const turn = ((e[1] - yW) - (e0.e[1] - e0.yW)) / E_R;
    return {
      parts: {
        discB: { angle: theta },
        rodC: { from: [pin[0], pin[1], Z_ROD], to: [joint[0], joint[1], Z_ROD] },
        armA: { from: [G[0], G[1], Z_ARM], to: [e[0], e[1], Z_ARM] },
        pulleyE: { position: [e[0], e[1], Z_BACK], angle: turn },
        weightW: { position: [XW, yW - 0.43, Z_BACK] },
      },
      paths: { ropeD: { points: route.points, closed: false, phase: 0 } },
      readouts: [],
    };
  },
};
