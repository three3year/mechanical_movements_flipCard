// 第 310 種:三腳式重力擒縱。擺的框架呈豎琴形,從上方吊著;擒縱輪中央附近有三根銷,負責把擒縱叉瓦 A、B 抬起,
// 兩個叉瓦各自繞擺懸掛點附近的一個中心擺動;擒縱輪由叉瓦上的擋止 D、E 鎖住。擺每擺一次,把一側的叉瓦推開、
// 放開擋止,擒縱輪轉過六分之一圈,中央的銷把另一側的叉瓦抬起;叉瓦落下時以重量給擺衝量。主動件是擺。
// 推斷:擺幅、叉瓦被抬起的角度;豎琴形框架的形狀依原圖。
import { TAU, deg, swing, clamp } from "./kit.js";
import { escapeStep } from "./escapement.js";
import { shape, thickLine, circle } from "./shapes.js";

export const STEP = TAU / 6;
export const SWING = deg(3);
const TOP = [0, 4.2, 0]; // 擺的懸掛點
const WHEEL = [0, -0.6, 0];
const PIV = { left: [-0.12, 3.6, 0], right: [0.12, 3.6, 0] };
const GAP = deg(1);

/** 擺累計擺動 v → 擺角、左右叉瓦抬起的角度、擒縱輪轉角 */
export function gravity(v) {
  const p = swing(v, -SWING, SWING);
  return {
    pendulum: p,
    right: clamp(p - GAP, 0, SWING) * 1.5,
    left: clamp(-p - GAP, 0, SWING) * 1.5,
    wheel: escapeStep(v, -SWING, SWING, STEP, 0.5),
  };
}

// 豎琴形框架(相對懸掛點):兩條彎臂從上橫樑往下收到底部的擺錘桿
const side = (s) => Array.from({ length: 17 }, (_, i) => {
  const t = i / 16;
  const y = -0.5 - 6.8 * t;
  const w = 1.35 * Math.sin(Math.PI * Math.min(1, t * 1.15)) ** 0.7 + 0.12;
  return [s * w, y];
});
const frame = [
  { kind: "plate", shape: shape(thickLine([[-1.5, -0.45], [1.5, -0.45]], 0.2)), thickness: 0.12 },
  { kind: "plate", shape: shape(thickLine(side(-1), 0.14)), thickness: 0.12 },
  { kind: "plate", shape: shape(thickLine(side(1), 0.14)), thickness: 0.12 },
  { kind: "box", size: [0.5, 0.35, 0.3], at: [0, -7.35, 0] },
  { kind: "box", size: [0.1, 1.2, 0.1], at: [0, -8.1, 0] },
  { kind: "box", size: [0.9, 0.3, 0.4], at: [0, 0.15, 0] },
];
// 叉瓦臂(相對各自的中心,往下):臂末端的叉瓦與擋止
const arm = (s) => [
  { kind: "plate", shape: shape(thickLine([[0, 0], [s * 0.15, -3.6], [s * 0.55, -4.15]], 0.1), [circle(0.05).reverse()]), thickness: 0.08 },
  { kind: "box", size: [0.3, 0.12, 0.2], at: [s * 0.55, -4.2, 0.05] },
  { kind: "box", size: [0.12, 0.3, 0.2], at: [s * 1.05, -4.45, 0.05] },
];
const legs = [0, 1, 2].map((i) => {
  const a = (i * TAU) / 3 + deg(30);
  return [[0.05, -0.05], [1.05, -0.03], [1.05, 0.03], [0.05, 0.05]].map(([x, y]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]);
});

export default {
  figure: 310,
  parts: [
    { id: "pendulum", kind: "group", center: TOP, arrow: false, pieces: frame },
    { id: "armA", kind: "group", center: PIV.right, arrow: false, pieces: arm(1) },
    { id: "armB", kind: "group", center: PIV.left, arrow: false, pieces: arm(-1) },
    {
      id: "wheel",
      kind: "group",
      center: WHEEL,
      spin: 1.05,
      label: "A",
      labelOffset: [0.2, -0.35, 0.3],
      pieces: [
        ...legs.map((l, i) => ({ kind: "plate", shape: shape(l), thickness: 0.1, accent: i === 0 })),
        { kind: "plate", shape: shape(circle(0.2), [circle(0.06).reverse()]), thickness: 0.16 },
        // 中央附近的三根抬升銷
        ...[0, 1, 2].map((i) => ({ kind: "cylinder", radius: 0.05, length: 0.3, at: [0.32 * Math.cos((i * TAU) / 3 + deg(90)), 0.32 * Math.sin((i * TAU) / 3 + deg(90)), 0.12] })),
      ],
    },
    { id: "labelB", kind: "group", center: [-0.65, -0.55, 0], label: "B", labelOffset: [-0.2, 0.3, 0.3] },
    { id: "labelD", kind: "group", center: [-1.15, -0.85, 0], label: "D", labelOffset: [-0.3, 0, 0.3] },
    { id: "labelE", kind: "group", center: [1.15, -0.85, 0], label: "E", labelOffset: [0.3, 0.2, 0.3] },
  ],
  driver: { part: "pendulum", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheel", // 擒縱輪
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const g = gravity(v);
    return { parts: { pendulum: { angle: g.pendulum }, armA: { angle: g.right }, armB: { angle: -g.left }, wheel: { angle: g.wheel } }, readouts: [] };
  },
  waivers: [
    { check: "interference", parts: ["pendulum", "wheel"], reason: "擒縱輪的進退依擺動的相位演出(每擺一次放過一齒),沒有逐點算擺與輪齒的接觸;重疊 0.11(96 個取樣中 37 個)。列入待確認清單的動力重演名單" },
    { check: "interference", parts: ["armB", "wheel"], reason: "擒縱輪的進退依擺動的相位演出(每擺一次放過一齒),沒有逐點算重力臂的掣子與輪齒的接觸;重疊 0.09(96 個取樣中 57 個)。列入待確認清單的動力重演名單" },
    { check: "interference", parts: ["armA", "wheel"], reason: "擒縱輪的進退依擺動的相位演出(每擺一次放過一齒),沒有逐點算重力臂的掣子與輪齒的接觸;重疊 0.10(96 個取樣中 55 個)。列入待確認清單的動力重演名單" },
    { check: "interference", parts: ["pendulum", "armB"], reason: "重力擒縱:擺推開重力臂、重力臂落回推擺的過程依相位演出;擺與臂端的方塊重疊 0.11" },
    { check: "interference", parts: ["pendulum", "armA"], reason: "重力擒縱:擺推開重力臂、重力臂落回推擺的過程依相位演出;擺與臂端的方塊重疊 0.11" },
  ],
};
