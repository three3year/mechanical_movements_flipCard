// 第 309 種:馬奇(Mudge)的重力擒縱。擒縱叉瓦 A、B 不在同一根軸上,而是各自裝在上方 C 處的兩根軸上,
// 各有一根長臂往下到叉爪銷 P、Q,臂上方帶著配重球。擺在兩根叉爪銷之間擺動,每次擺動把其中一個加重的叉瓦
// 從輪中抬起(輪隨即轉過半個齒、被另一個叉瓦擋住);擺返回時,叉瓦隨之落下,由叉瓦的重量給擺衝量。
// 主動件是擺(擺桿在 P、Q 之間)。
// 推斷:擺幅、叉瓦被抬起的角度、齒數(依原圖約三十齒)。
import { TAU, deg, swing, clamp } from "./kit.js";
import { escapeStep, escapeWheelPieces } from "./escapement.js";
import { shape, thickLine, circle } from "./shapes.js";

export const N = 30;
export const PITCH = TAU / N;
export const SWING = deg(4);
const C = { left: [-0.12, 2.45, 0], right: [0.12, 2.45, 0] };
const ARM = 4.8; // 樞軸到叉爪銷
const GAP = deg(1.2); // 擺在兩根叉爪銷之間的空隙(單邊)
const WHEEL = [0, -0.2, 0];
const PEND = [0, 2.45, 0]; // 擺與兩叉瓦大致同軸

/** 擺累計擺動 v → 擺角、左右兩叉瓦臂被抬起的角度、擒縱輪轉角 */
export function mudge(v) {
  const p = swing(v, -SWING, SWING);
  // 擺往右擺過空隙,就推著右臂(叉瓦 A 在右)往右抬;往左則推左臂(叉瓦 B)
  const right = clamp(p - GAP, 0, SWING);
  const left = clamp(-p - GAP, 0, SWING);
  return { pendulum: p, left, right, wheel: -escapeStep(v, -SWING, SWING, PITCH / 2, 0.45) };
}

// 叉瓦臂(相對各自的樞軸,往下):臂、叉瓦、上方伸出的配重桿與球
const arm = (s) => [
  { kind: "plate", shape: shape(thickLine([[0, 0], [s * 0.3, -ARM]], 0.12), [circle(0.05).reverse()]), thickness: 0.08 },
  { kind: "plate", shape: shape([[s * 0.1, -1.0], [s * 1.25, -1.0], [s * 1.3, -1.2], [s * 0.15, -1.15]]), thickness: 0.1, at: [0, 0, 0.05] },
  { kind: "plate", shape: shape(thickLine([[0, 0], [s * 1.0, 0.2]], 0.08)), thickness: 0.08 },
  { kind: "sphere", radius: 0.32, at: [s * 1.25, 0.25, 0] },
  { kind: "cylinder", radius: 0.07, length: 0.3, at: [s * 0.3, -ARM, 0.1] },
];

export default {
  figure: 309,
  parts: [
    { id: "wheel", kind: "group", center: WHEEL, spin: 1.55, pieces: [...escapeWheelPieces({ teeth: N, outer: 1.55, inner: 1.32, dir: -1, rim: 0.12 }), { kind: "box", size: [0.12, 0.12, 0.14], at: [1.0, 0, 0.08], accent: true }] },
    { id: "armB", kind: "group", center: C.left, arrow: false, pieces: arm(-1) },
    { id: "armA", kind: "group", center: C.right, arrow: false, pieces: arm(1) },
    { id: "pendulum", kind: "group", center: PEND, arrow: false, pieces: [{ kind: "box", size: [0.1, ARM + 0.4, 0.08], at: [0, -(ARM + 0.4) / 2, 0.25] }, { kind: "cylinder", radius: 0.08, length: 0.5 }] },
    { id: "labelA", kind: "group", center: [1.3, 1.35, 0], label: "A", labelOffset: [0.3, 0, 0.3] },
    { id: "labelB", kind: "group", center: [-1.3, 1.35, 0], label: "B", labelOffset: [-0.3, 0, 0.3] },
    { id: "labelC", kind: "group", center: [0, 2.45, 0], label: "C", labelOffset: [0, 0.35, 0.3] },
    { id: "labelP", kind: "group", center: [0.42, 2.45 - ARM, 0], label: "P", labelOffset: [0.3, -0.1, 0.3] },
    { id: "labelQ", kind: "group", center: [-0.42, 2.45 - ARM, 0], label: "Q", labelOffset: [-0.3, -0.1, 0.3] },
  ],
  // 動力重演:只推主動件;wheel 受固定的力矩(發條或重錘),由擒縱件擋住、放行
  replay: { free: { wheel: { spring: -1, gravity: false } }, expect: [{ part: "wheel", label: "主動件走完一輪後 wheel 的位置" }] },
  driver: { part: "pendulum", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheel", // 擒縱輪
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const m = mudge(v);
    return { parts: { pendulum: { angle: m.pendulum }, armA: { angle: m.right }, armB: { angle: -m.left }, wheel: { angle: m.wheel } }, readouts: [] };
  },
  waivers: [
    { check: "replay", parts: ["wheel"], reason: "未修:動力重演不成立——「主動件走完一輪後 wheel 的位置」預期 wheel 在主動量 0.28 時已轉 -12°,實際轉了 -27°。模型的擒縱是依擺動的相位演出的:重演裡給擒縱輪一個固定的力矩後,掣子(叉瓦)沒有照一擺放一齒那樣擋住、放行(輪一路轉走,或被卡住不動)。掣子與輪齒的外形、位置要重做成真的擋得住(列入待確認清單)" },
    { check: "interference", parts: ["wheel", "armA"], reason: "擒縱輪的進退依擺動的相位演出(每擺一次放過一齒),沒有逐點算兩支擺臂的掣子與輪齒的接觸;重疊 0.10。列入待確認清單的動力重演名單" },
    { check: "interference", parts: ["wheel", "armB"], reason: "擒縱輪的進退依擺動的相位演出(每擺一次放過一齒),沒有逐點算兩支擺臂的掣子與輪齒的接觸;重疊 0.10。列入待確認清單的動力重演名單" },
  ],
};
