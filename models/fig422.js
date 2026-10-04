// 第 422 種:擺動活塞引擎。汽缸 A 的剖面是扇形;活塞 B 裝在搖臂軸 C 上,蒸汽經滑閥 D 輪流引進汽缸、作用在活塞的一側
// 或另一側,方式與一般的往復式引擎相同。搖臂軸接到曲柄上產生旋轉運動。
// 主動件是曲柄(在汽缸後面);活塞 B 隨之來回擺動。
// 推斷:曲柄、搖臂與連桿的位置與長度(原圖沒有畫出);汽缸前面剖開;滑閥 D 依活塞擺動的方向把蒸汽送到推它的那一側,
// 另一側經滑閥排汽;汽缸裡的蒸汽以點表示。
import { deg } from "./kit.js";
import { circleCircle } from "./linkage.js";
import { stream } from "./flow.js";
import { shape, thickLine, arcPoints, circle, rect } from "./shapes.js";

export const RADIUS = 2.2; // 扇形汽缸的內半徑
export const HALF = deg(33); // 扇形的半張角
const ARM = 0.8; // 搖臂(在汽缸後面,朝下)
export const CRANK = { center: [1.9, -1.0, 0], radius: 0.3 };
const COUPLER = Math.hypot(CRANK.center[0], CRANK.center[1] + ARM);
const BACK = -0.75;

const crankPin = (phi) => [CRANK.center[0] + CRANK.radius * Math.cos(phi), CRANK.center[1] + CRANK.radius * Math.sin(phi), 0];
/** 曲柄轉 phi → 活塞偏離中線的角度(逆時針為正) */
export function vane(phi) {
  const end = circleCircle(crankPin(phi), COUPLER, [0, 0, 0], ARM, 1).point;
  return Math.atan2(end[1], end[0]) + Math.PI / 2;
}

// 滑閥的傳動(推斷;原圖沒有畫):搖臂軸前端一根朝上的撥臂,臂端的銷在滑閥垂下的叉架兩根叉指之間;
// 活塞擺到行程的末端時,銷碰到叉指、把滑閥推到另一邊,其餘時間滑閥停在原位(撥桿式閥動)
const TAPPET = 1.2; // 撥臂長
const VALVE_Y = RADIUS + 0.62;
const VALVE_TRAVEL = 0.36;
const tipX = (phi) => -TAPPET * Math.sin(vane(phi));
const TIP = (() => {
  const xs = Array.from({ length: 720 }, (_, i) => tipX((i * Math.PI) / 360));
  return { min: Math.min(...xs), max: Math.max(...xs) };
})();
const GAP = TIP.max - TIP.min - VALVE_TRAVEL; // 銷在兩根叉指之間的空行程
const YOKE0 = (TIP.max + TIP.min) / 2; // 叉架中心相對滑閥的位置
/** 曲柄轉 phi → 滑閥的位置:銷往右走時推右叉指,往左走時推左叉指,沒碰到時滑閥停在上一次被推到的地方 */
export function valveAt(phi) {
  const tip = tipX(phi);
  const right = tipX(phi + 0.01) > tip;
  const yoke = right ? Math.max(TIP.min + GAP / 2, tip - GAP / 2) : Math.min(TIP.max - GAP / 2, tip + GAP / 2);
  return yoke - YOKE0;
}

// 汽缸壁:扇形加上搖臂軸的軸轂
const sector = (r, half, hub) => [
  ...arcPoints(r, Math.PI / 2 + half, Math.PI / 2 - half),
  ...arcPoints(hub, Math.PI / 2 - half - 0.3, -Math.PI * 1.5 + half + 0.3),
];
const wall = shape(sector(RADIUS + 0.16, HALF + deg(5), 0.62), [sector(RADIUS, HALF, 0.38).reverse()]);
const polar = (r, a) => [r * Math.cos(a), r * Math.sin(a)];
const passage = (s) => [polar(RADIUS + 0.32, Math.PI / 2 + s * HALF), polar(RADIUS + 0.32, Math.PI / 2 + s * 0.2), [s * 0.35, RADIUS + 0.45]];

/** 一側汽缸裡的蒸汽(從活塞到該側的端壁) */
function chamberDots(from, to, travel) {
  const dots = [];
  const n = Math.max(1, Math.round(Math.abs(to - from) / deg(6)));
  for (let r = 0.55; r < RADIUS - 0.1; r += 0.3) {
    for (let i = 0; i <= n; i++) {
      const a = from + ((to - from) * (i + 0.5 + 0.3 * Math.sin(travel * 3 + r * 5))) / (n + 1);
      dots.push([...polar(r, a), 0.05]);
    }
  }
  return dots;
}

export default {
  figure: 422,
  parts: [
    {
      id: "cylinder",
      kind: "group",
      label: "A",
      labelOffset: [-1.55, 0.6, 0.4],
      pieces: [
        { kind: "plate", shape: wall, thickness: 0.6 },
        { kind: "plate", shape: shape(sector(RADIUS + 0.16, HALF + deg(5), 0.62)), thickness: 0.05, at: [0, 0, -0.33] },
        // 底座
        { kind: "plate", shape: shape(rect(2.2, 0.3, 0, -0.75)), thickness: 0.7 },
        // 兩條通到汽缸兩端的汽道
        { kind: "plate", shape: shape(thickLine(passage(1), 0.12)), thickness: 0.3 },
        { kind: "plate", shape: shape(thickLine(passage(-1), 0.12)), thickness: 0.3 },
        // 閥箱與進汽管
        { kind: "plate", shape: shape(rect(1.2, 0.5, 0, RADIUS + 0.62), [rect(1.0, 0.3, 0, RADIUS + 0.62).reverse()]), thickness: 0.4 },
        { kind: "box", size: [0.9, 0.14, 0.14], at: [1.05, RADIUS + 0.7, 0] },
        { kind: "box", size: [0.14, 0.5, 0.14], at: [0, RADIUS + 1.1, 0] },
      ],
    },
    {
      id: "piston",
      kind: "group",
      label: "B",
      labelOffset: [0.25, 1.1, 0.4],
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(rect(0.14, RADIUS - 0.42, 0, (RADIUS + 0.4) / 2)), thickness: 0.56 },
        { kind: "cylinder", radius: 0.36, length: 0.56 },
        { kind: "cylinder", radius: 0.1, length: 1.3, at: [0, 0, -0.3] },
        // 搖臂(汽缸後面)
        { kind: "plate", shape: shape(thickLine([[0, 0], [0, -ARM]], 0.14), [circle(0.04, 0, -ARM).reverse()]), thickness: 0.08, at: [0, 0, BACK] },
        // 軸的前端與撥臂、臂端的銷
        { kind: "cylinder", radius: 0.07, length: 0.2, at: [0, 0, 0.45] },
        { kind: "plate", shape: shape(thickLine([[0, 0], [0, TAPPET]], 0.1)), thickness: 0.06, at: [0, 0, 0.5] },
        { kind: "cylinder", radius: 0.05, length: 0.14, at: [0, TAPPET, 0.43] },
      ],
    },
    { id: "shaftC", kind: "group", label: "C", labelOffset: [0, -0.05, 0.45], pieces: [{ kind: "cylinder", radius: 0.12, length: 0.1, at: [0, 0, 0.33] }] },
    {
      id: "valve",
      kind: "group",
      label: "D",
      labelOffset: [0, 0.35, 0.3],
      pieces: [
        { kind: "box", size: [0.5, 0.26, 0.3] },
        // 閥桿往前伸出閥箱,接著垂下的叉架
        { kind: "cylinder", radius: 0.04, length: 0.42, at: [YOKE0, 0, 0.2] },
        { kind: "box", size: [GAP + 0.26, 0.08, 0.06], at: [YOKE0, 0, 0.42] },
        ...[-1, 1].map((s) => ({ kind: "box", size: [0.08, VALVE_Y - TAPPET + 0.3, 0.06], at: [YOKE0 + s * (GAP / 2 + 0.09), -(VALVE_Y - TAPPET + 0.3) / 2, 0.42] })),
      ],
    },
    {
      id: "crank",
      kind: "group",
      center: CRANK.center,
      spin: 0.45,
      pieces: [
        { kind: "plate", shape: shape(circle(0.42), [circle(0.06).reverse()]), thickness: 0.1, at: [0, 0, BACK - 0.12] },
        { kind: "cylinder", radius: 0.05, length: 0.3, at: [CRANK.radius, 0, BACK] },
      ],
    },
    { id: "coupler", kind: "link", width: 0.1, thickness: 0.05 },
  ],
  driver: { part: "crank", type: "rotation" },
  target: "piston",
  view: { direction: [0.15, 0.1, 1] },
  pose(phi) {
    const psi = vane(phi);
    const ahead = vane(phi + 0.01) - psi; // 活塞的擺動方向
    const side = ahead < 0 ? 1 : -1; // 蒸汽在哪一側推(+1 左側)
    const pin = crankPin(phi);
    const end = polar(ARM, psi - Math.PI / 2);
    const travel = phi * 1.2;
    const wallAngle = Math.PI / 2 + side * HALF;
    return {
      parts: {
        piston: { angle: psi },
        valve: { position: [valveAt(phi), VALVE_Y, 0.05] },
        crank: { angle: phi },
        coupler: { from: [pin[0], pin[1], BACK + 0.08], to: [end[0], end[1], BACK + 0.08] },
      },
      flows: [
        { fluid: "steam", points: chamberDots(Math.PI / 2 + psi + side * deg(5), wallAngle, travel) },
        { fluid: "steam", points: stream(passage(side).map(([x, y]) => [x, y, 0.2]).reverse(), travel, { spacing: 0.2 }) },
      ],
      readouts: [{ label: "蒸汽推活塞", value: side > 0 ? "左側進汽、右側排汽" : "右側進汽、左側排汽" }],
    };
  },
};
