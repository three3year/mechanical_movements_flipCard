// 第 261 種:組合式運動。圓盤 B 旋轉,盤上帶一個捲繩鼓輪;臂 A 一端鉸接在右上的 G 點,左端裝皮帶輪 E;
// 連桿 C 把圓盤上的曲柄銷與臂 A 相連,圓盤轉動時臂 A 繞 G 上下振動。繩 D 一端吊著重物 W,往上繞過 E,
// 再往下捲在鼓輪上。E 上下移動時 W 移動兩倍的距離;鼓輪又一直把繩捲上來,所以 W 上下往復,
// 下行程比上行程短(每一圈淨上升一段)。主動件是圓盤 B。
// 推斷:各桿長與鼓輪半徑(依原圖比例);為了讓 W 留在畫面內,圓盤可轉的圈數有限。
import { Z, TAU, clamp, routeRope, dist } from "./kit.js";
import { crankPin, circleCircle, angleOf } from "./linkage.js";

const B = [0.55, -1.3, 0];
const CRANK = 0.48;
const DRUM = 0.2;
const G = [2.75, 1.9, 0];
const ARM = 3.6; // G 到 E 中心
const JOINT = 2.45; // G 到連桿 C 接點的距離
const ROD = 2.9; // 連桿 C 長
const E_R = 0.5;
const XW = -1.35; // 重物所在的直線(E 的左緣)
export const RANGE = [0, 2 * TAU];

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
    { point: [e[0] - E_R, yW, 0.2] },
    { circle: { center: [e[0], e[1], 0.2], axis: Z, radius: E_R, sense: -1 } },
    { circle: { center: [B[0], B[1], 0.2], axis: Z, radius: DRUM, sense: -1 } },
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
        { kind: "box", size: [0.12, 5.0, 0.8], at: [3.05, 0.0, 0] },
        { kind: "plate", shape: { outline: [[3.0, -2.2], [3.0, -0.75], [B[0] + 0.3, -1.05], [B[0] + 0.3, -1.55], [1.8, -1.6]], holes: [] }, thickness: 0.3, at: [0, 0, -0.3] },
        { kind: "plate", shape: { outline: [[3.0, 1.65], [3.0, 2.15], [2.6, 2.0], [2.6, 1.8]], holes: [] }, thickness: 0.3 },
      ],
    },
    {
      id: "discB",
      kind: "pulley",
      style: "disc",
      center: B,
      radius: 0.85,
      width: 0.16,
      label: "B",
      labelOffset: [0, -0.15, 0.4],
      pieces: [{ kind: "cylinder", radius: DRUM, length: 0.3, at: [0, 0, 0.2] }, { kind: "cylinder", radius: 0.07, length: 0.5, at: [0, CRANK, 0.2], accent: true }],
    },
    { id: "rodC", kind: "link", width: 0.12, thickness: 0.06, label: "C", labelOffset: [0.15, 1.4, 0.3] },
    { id: "armA", kind: "link", width: 0.14, thickness: 0.08, label: "A", labelOffset: [0.3, 0.3, 0.3] },
    { id: "pulleyE", kind: "pulley", style: "disc", radius: E_R, width: 0.16, label: "E", labelOffset: [0, 0, 0.4] },
    { id: "ropeD", kind: "rope", label: "D", center: [XW, 0, 0.2], labelOffset: [-0.3, 0, 0] },
    { id: "weightW", kind: "box", size: [0.55, 0.85, 0.5], label: "W", labelOffset: [0, 0, 0.4] },
  ],
  driver: { part: "discB", type: "rotation", range: RANGE, initial: 0 },
  target: "weightW", // 被吊起又放下的重物
  view: { direction: [0.05, 0.05, 1] },
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
        rodC: { from: [pin[0], pin[1], 0.4], to: [joint[0], joint[1], 0.4] }, // 連桿在鼓輪的前面,從鼓輪上方掃過
        armA: { from: [G[0], G[1], 0.05], to: [e[0], e[1], 0.05] },
        pulleyE: { position: [e[0], e[1], 0.2], angle: turn },
        weightW: { position: [XW, yW - 0.43, 0.2] },
      },
      paths: { ropeD: { points: route.points, closed: false, phase: 0 } },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["discB", "ropeD"], reason: "曲柄銷與捲繩的鼓輪畫在圓盤的同一面,曲柄銷每圈有一小段掃過垂下的繩(重疊 0.07,96 個取樣中 3 個);實物的鼓輪在圓盤的背面" },
  ],
};
