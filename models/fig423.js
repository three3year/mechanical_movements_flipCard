// 第 423 種:Root 的專利雙象限引擎,原理與第 422 種相同,但用兩個單動活塞 B、B,兩者都接在同一個曲柄 D 上。
// 蒸汽經進汽閥 a 輪流引進、作用在兩個活塞的外側,從兩活塞之間的空間排出。活塞與曲柄的接法使蒸汽在曲柄每轉一圈中
// 約三分之二的時間作用在每個活塞上,所以沒有死點。
// 主動件是曲柄 D(順時針轉)。
// 推斷:兩個活塞以曲柄為中心點對稱;連桿的長度與位置是依「約三分之二」這個條件求出的(急回機構:往內推的行程佔
// 曲柄 240°);進汽閥 a 畫成隨曲柄轉的旋轉閥。
// 活塞與端壁的密封照實物:活塞板偏在轉軸的一側,朝汽室的那一面與端壁朝汽室的那一面都和軸轂相切,擺到最外時活塞貼著端壁,
// 汽室的根部由軸轂封住(原圖的樞軸圓就畫在活塞板的角上);軸轂穿過背板、由背板後面的軸承環托住。
// 排汽口(推斷,原圖沒畫)在兩活塞之間的空間的左下角,從背板出去、經管子落到底座;曲柄 D 的軸前端由底座立起的軸承座托住(推斷)。
import { Z, deg, routeBelt, beltTravel, signedAngle } from "./kit.js";
import { circleCircle } from "./linkage.js";
import { stream } from "./flow.js";
import { shape, thickLine, arcPoints, circle, rect } from "./shapes.js";

export const CRANK = 0.45;
export const PIVOTS = [[-1.3, -0.3, 0], [1.3, 0.3, 0]]; // 兩個活塞的轉軸(點對稱)
const HUB = 0.22; // 活塞軸轂半徑
export const SEAT = 0.235; // 汽缸座住軸轂的孔與端壁切面的半徑
const T = 0.14; // 活塞板厚
const PIN_O = SEAT + T / 2; // 連桿銷在活塞板的中線上:離轉軸的橫向距離
const ARM = Math.sqrt(1.7 ** 2 - PIN_O ** 2); // 連桿銷沿活塞板的位置(銷離轉軸 1.7,和原本一樣)
const GAMMA = Math.atan2(PIN_O, ARM); // 銷的方向與活塞板方向的夾角
const LINK = 0.9;
export const VANE = 1.93; // 活塞板長
const ARC = VANE + 0.1; // 象限弧壁的中心半徑

const crankPin = (theta) => [CRANK * Math.cos(theta), CRANK * Math.sin(theta), 0];
/** 曲柄轉 theta → 第 k 個活塞板的方向與連桿接點 */
export function vane(theta, k) {
  const P = PIVOTS[k];
  const q = circleCircle(P, 1.7, crankPin(theta), LINK, 1).point; // 點對稱:兩個活塞取同一側的解
  return { angle: Math.atan2(q[1] - P[1], q[0] - P[0]) + GAMMA, end: q };
}
/** 第 k 個活塞是否正被蒸汽推(往內、角度變小;曲柄順時針轉) */
export function driving(theta, k) {
  const d = vane(theta - 0.002, k).angle - vane(theta, k).angle;
  return Math.atan2(Math.sin(d), Math.cos(d)) < 0;
}
// 活塞板的擺動範圍(第 0 個;第 1 個點對稱)
const RANGE = (() => {
  const as = Array.from({ length: 720 }, (_, i) => vane((i * Math.PI) / 360, 0).angle);
  return { lo: Math.min(...as), hi: Math.max(...as) };
})();
const HI = RANGE.hi + deg(6); // 外側端壁的方向:活塞擺到最外時離端壁 6°
const LO = RANGE.lo - Math.atan2(SEAT + T, VANE) - deg(3); // 弧壁的內側端:蓋過活塞擺到最內時的板角
export const OUTER = [HI, HI + Math.PI]; // 外側端壁的方向(蒸汽從這邊進來)

const polar = (P, r, a) => [P[0] + r * Math.cos(a), P[1] + r * Math.sin(a)];
const rot = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
/** 外側端壁:朝汽室的那一面和軸轂的座孔相切(離轉軸 SEAT),內端貼著座孔的弧,外端伸到弧壁 */
function endWall(k) {
  const P = PIVOTS[k];
  const beta = OUTER[k];
  const far = -SEAT + T; // 背向汽室那一面
  const a1 = -Math.asin(-far / SEAT);
  const inner = Array.from({ length: 7 }, (_, i) => { const a = -Math.PI / 2 + ((a1 + Math.PI / 2) * i) / 6; return [SEAT * Math.cos(a), SEAT * Math.sin(a)]; });
  const local = [[ARC + 0.07, -SEAT], [ARC + 0.07, far], ...inner.slice().reverse()]; // 逆時針
  return local.map((p) => { const [x, y] = rot(p, beta); return [P[0] + x, P[1] + y]; });
}
const quadrant = (k) => {
  const [px, py] = PIVOTS[k];
  const s = k === 0 ? 0 : Math.PI;
  return [
    { kind: "plate", shape: shape(thickLine(arcPoints(ARC, LO + s, OUTER[k] - deg(3), px, py), 0.14)), thickness: 0.6 },
    { kind: "plate", role: "endWall", shape: shape(endWall(k)), thickness: 0.6 },
    // 背板後面的軸承環(推斷):座住活塞的軸轂
    { kind: "cylinder", radius: 0.36, inner: SEAT, length: 0.3, at: [px, py, -0.47] },
  ];
};
const VALVE = [1.35, 1.75];
// 通道從閥室的外壁開始(不伸進閥室裡)
const fromValve = ([x, y]) => { const d = Math.hypot(x - VALVE[0], y - VALVE[1]); return [VALVE[0] + (0.33 * (x - VALVE[0])) / d, VALVE[1] + (0.33 * (y - VALVE[1])) / d]; };
// 閥由曲柄軸經一條皮帶帶動,兩個帶輪一樣大:每圈轉一圈(推斷;原圖沒有畫出閥的傳動)
const BELT_Z = 0.56;
const BELT_R = 0.16;
const valveBelt = routeBelt([{ center: [0, 0, BELT_Z], axis: Z, radius: BELT_R, sense: 1 }, { center: [...VALVE, BELT_Z], axis: Z, radius: BELT_R, sense: 1 }]);
// 進汽通道穿過弧壁、開口在汽室的外側角落(活塞擺到最外時的板面與端壁之間)
const entry = (k, r) => polar(PIVOTS[k], r, OUTER[k] - deg(9.5));
const passages = [
  [fromValve([0.2, 2.0]), [0.2, 2.0], entry(0, ARC + 0.3), entry(0, VANE - 0.05)],
  [fromValve([2.1, 0.9]), [2.1, 0.9], [2.1, -1.2], [1.25, -2.15], entry(1, ARC + 0.3), entry(1, VANE - 0.05)],
];
export const EXHAUST = [-0.9, -1.7, 0]; // 排汽口(背板上的開口)
const BASE_TOP = -2.3; // 底座頂面:頂著背板的底緣
const BEARING_Z = 0.85; // 曲柄軸承座的中心深度

/** 外側的蒸汽:從活塞板朝汽室的面到端壁朝汽室的面(兩面都和座孔相切,所以各半徑上的角度範圍不同) */
export function chamber(theta, k, travel) {
  const P = PIVOTS[k];
  const alpha = vane(theta, k).angle;
  const span = signedAngle(OUTER[k] - alpha);
  const dots = [];
  for (let r = 0.5; r < VANE - 0.05; r += 0.27) {
    const lean = Math.asin(Math.min(1, SEAT / r)); // 兩個面在這個半徑上離徑向線的角度
    const a0 = alpha - lean + deg(2);
    const a1 = alpha + span - lean - deg(2);
    const n = Math.round((a1 - a0) / deg(6));
    if (n < 1) continue;
    for (let i = 0; i < n; i++) {
      const a = a0 + ((a1 - a0) * (i + 0.5 + 0.35 * Math.sin(travel * 3 + r * 4))) / n;
      dots.push([...polar(P, r, a), 0.05]);
    }
  }
  return dots;
}
/** 回程活塞的排汽:從它的內側經兩活塞之間的空間流到排汽口 */
export function exhaustPath(theta, k) {
  const P = PIVOTS[k];
  const alpha = vane(theta, k).angle;
  const [x, y] = rot([1.0, -(SEAT + T) - 0.18], alpha);
  const via = k === 0 ? [-0.55, -0.9] : [-0.3, -1.25];
  return [[P[0] + x, P[1] + y, 0.05], [...via, 0.05], [...EXHAUST]];
}

export default {
  figure: 423,
  parts: [
    {
      id: "casing",
      kind: "group",
      pieces: [
        ...quadrant(0),
        ...quadrant(1),
        // 背板:兩個軸轂與排汽口穿過它
        { kind: "plate", role: "back", shape: shape(rect(5.0, 4.6, 0, 0), [circle(SEAT, ...PIVOTS[0]).reverse(), circle(SEAT, ...PIVOTS[1]).reverse(), circle(0.15, EXHAUST[0], EXHAUST[1]).reverse()]), thickness: 0.04, at: [0, 0, -0.32] },
        // 底座:頂著背板的底緣,往前伸到軸承座底下
        { kind: "box", role: "base", size: [3.6, 0.25, BEARING_Z + 0.1 + 0.45], at: [0, BASE_TOP - 0.125, (BEARING_Z + 0.1 - 0.45) / 2] },
        // 排汽管(推斷):從背板的排汽口往後、再落到底座
        { kind: "box", size: [0.3, 0.3, 0.3], at: [EXHAUST[0], EXHAUST[1], -0.47] },
        { kind: "box", size: [0.3, EXHAUST[1] - BASE_TOP + 0.1, 0.3], at: [EXHAUST[0], (EXHAUST[1] + BASE_TOP - 0.1) / 2, -0.47] },
        ...passages.map((p) => ({ kind: "plate", shape: shape(thickLine(p, 0.1)), thickness: 0.3 })),
        { kind: "plate", shape: shape(circle(0.36, ...VALVE), [circle(0.26, ...VALVE).reverse()]), thickness: 0.5 },
        { kind: "box", size: [0.14, 0.6, 0.14], at: [VALVE[0], VALVE[1] + 0.6, 0] },
        // 曲柄 D 的軸承座(推斷):從底座立起的柱子,頂端的軸承環套著軸的前端
        { kind: "box", size: [0.24, -BASE_TOP + 0.02, 0.2], at: [0, (BASE_TOP + 0.02) / 2, BEARING_Z] },
        { kind: "cylinder", radius: 0.24, inner: 0.1, length: 0.2, at: [0, 0, BEARING_Z] },
      ],
    },
    ...PIVOTS.map((P, k) => ({
      id: `piston${k + 1}`,
      kind: "group",
      center: P,
      label: "B",
      labelOffset: k === 0 ? [-0.1, 0.95, 0.4] : [0.1, -0.95, 0.4],
      arrow: false,
      pieces: [
        // 活塞板偏在轉軸的一側(朝汽室的面離轉軸 SEAT、和軸轂相切),根部以一塊腹板接到軸轂
        { kind: "plate", role: "vane", shape: shape([[0, -SEAT - T], [VANE, -SEAT - T], [VANE, -SEAT], [0, -SEAT]]), thickness: 0.56 },
        { kind: "box", size: [0.22, 0.13, 0.56], at: [-0.09, -SEAT, 0] }, // 腹板在轉軸的後側(板的根部那一邊):端壁的切面只到轉軸的正下方,後側不會碰到
        { kind: "cylinder", radius: HUB, length: 0.9, at: [0, 0, -0.17] }, // 軸轂往後穿過背板、進軸承環
        { kind: "cylinder", radius: 0.05, length: 0.18, at: [ARM, -PIN_O, 0.24] },
      ],
    })),
    {
      id: "crank",
      kind: "group",
      label: "D",
      labelOffset: [-0.35, -0.45, 0.4],
      spin: 0.55,
      pieces: [
        // 曲柄盤在汽缸的前面(連桿的外側),不掃過活塞;軸端是帶動閥的帶輪
        { kind: "plate", shape: shape(circle(0.62), [circle(0.08).reverse()]), thickness: 0.1, at: [0, 0, 0.4] },
        { kind: "cylinder", role: "shaft", radius: 0.1, length: BEARING_Z + 0.12 - 0.35, at: [0, 0, (BEARING_Z + 0.12 + 0.35) / 2] }, // 軸只往前伸(連桿在盤的背面掃過軸心),前端穿過軸承座的環
        { kind: "cylinder", radius: 0.06, length: 0.14, at: [CRANK, 0, 0.33], accent: true },
        { kind: "cylinder", radius: BELT_R, length: 0.08, at: [0, 0, BELT_Z] },
      ],
    },
    {
      id: "valve",
      kind: "group",
      center: [...VALVE, 0],
      label: "a",
      labelOffset: [0.45, -0.1, 0.3],
      spin: 0.32,
      pieces: [
        { kind: "plate", shape: shape([[0, 0.24], [-0.24, 0], [0, -0.24], [0.08, 0]]), thickness: 0.4 },
        { kind: "cylinder", radius: 0.05, length: 0.6, at: [0, 0, 0.3] },
        { kind: "cylinder", radius: BELT_R, length: 0.08, at: [0, 0, BELT_Z] },
      ],
    },
    { id: "valveBelt", kind: "belt" },
    { id: "link1", kind: "link", width: 0.1, thickness: 0.05 },
    { id: "link2", kind: "link", width: 0.1, thickness: 0.05 },
  ],
  driver: { part: "crank", type: "rotation", speed: -0.6 },
  targets: ["piston1", "piston2"],
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const pin = crankPin(theta);
    const v = [vane(theta, 0), vane(theta, 1)];
    const on = [driving(theta, 0), driving(theta, 1)];
    const travel = -theta * 0.8;
    const flows = [];
    for (const k of [0, 1]) {
      if (on[k]) flows.push({ fluid: "steam", points: [...chamber(theta, k, travel), ...stream(passages[k].map(([x, y]) => [x, y, 0.2]), travel, { spacing: 0.2 })] });
      else flows.push({ fluid: "steam", points: stream(exhaustPath(theta, k), travel, { spacing: 0.2 }) });
    }
    return {
      parts: {
        piston1: { angle: v[0].angle },
        piston2: { angle: v[1].angle },
        crank: { angle: theta },
        valve: { angle: theta },
        link1: { from: [pin[0], pin[1], 0.3], to: [v[0].end[0], v[0].end[1], 0.3] },
        link2: { from: [pin[0], pin[1], 0.3], to: [v[1].end[0], v[1].end[1], 0.3] },
      },
      paths: { valveBelt: { points: valveBelt.points, closed: true, phase: beltTravel(theta, BELT_R, 1) } },
      flows,
      readouts: [
        { label: "上方活塞 B", value: on[0] ? "蒸汽推動" : "排汽回程(從兩活塞之間排出)" },
        { label: "下方活塞 B", value: on[1] ? "蒸汽推動" : "排汽回程(從兩活塞之間排出)" },
      ],
    };
  },
};
