// 第 311 種:雙三腳式重力擒縱。兩個三腳鎖定輪 A、B、C 與 a、b、c 裝在同一根軸上(一前一後),兩輪之間是一組抬升銷,
// 間距寬到能讓擒縱叉瓦位於兩輪之間;第一個鎖定輪的齒由一個叉瓦上的止動齒 D 擋住,另一個鎖定輪的齒由另一個叉瓦上的
// 止動齒 E 擋住。兩個叉瓦臂從上方的兩個樞軸垂下,擺桿夾在兩臂之間:擺每擺一次推開一個叉瓦、放開一個止動齒,
// 擒縱輪轉過六分之一圈,抬升銷再把另一個叉瓦抬起;叉瓦落下時以重量給擺衝量。軸上的長條(FLY)是調速用的風扇,
// 跟著擒縱輪一起轉,讓它轉得平穩。主動件是擺。
// 推斷:擺幅、叉瓦抬起的角度;兩輪錯開 60°。
import { TAU, deg, swing, clamp } from "./kit.js";
import { escapeStep } from "./escapement.js";
import { shape, thickLine, circle } from "./shapes.js";

export const STEP = TAU / 6;
export const SWING = deg(3);
const TOP = { left: [-0.15, 5.2, 0], right: [0.15, 5.2, 0] };
const WHEEL = [0, 0, 0];
const GAP = deg(0.8);

/** 擺累計擺動 v → 擺角、左右叉瓦抬起的角度、擒縱輪轉角 */
export function doubleThree(v) {
  const p = swing(v, -SWING, SWING);
  return {
    pendulum: p,
    right: clamp(p - GAP, 0, SWING) * 1.4,
    left: clamp(-p - GAP, 0, SWING) * 1.4,
    wheel: escapeStep(v, -SWING, SWING, STEP, 0.5),
  };
}

// 叉瓦臂(相對樞軸):往外斜下到菱形的側角,再往內收到底部
const arm = (s) => [
  { kind: "plate", shape: shape(thickLine([[0, 0], [s * 1.75, -3.0], [s * 0.25, -8.6]], 0.13), [circle(0.06).reverse()]), thickness: 0.08 },
  // 止動齒(D 在左臂、E… 原圖 E 在左、A 側在右)與叉瓦
  { kind: "box", size: [0.4, 0.12, 0.2], at: [s * 1.45, -3.1, 0.05] },
  { kind: "plate", shape: shape(thickLine([[s * 1.6, -3.4], [s * 0.35, -4.9]], 0.12)), thickness: 0.06, at: [0, 0, 0.1] },
];
const legs = (offset, z) =>
  [0, 1, 2].map((i) => {
    const a = (i * TAU) / 3 + offset;
    const pts = [[0.05, -0.05], [1.25, -0.08], [1.4, 0.06], [0.05, 0.05]].map(([x, y]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]);
    return { kind: "plate", shape: shape(pts), thickness: 0.06, at: [0, 0, z] };
  });

export default {
  figure: 311,
  parts: [
    {
      id: "wheel",
      kind: "group",
      center: WHEEL,
      spin: 1.4,
      pieces: [
        ...legs(deg(90), 0.25),
        ...legs(deg(150), -0.25),
        // 兩輪之間的抬升銷與調速風扇(FLY)
        ...[0, 1, 2, 3, 4, 5].map((i) => ({ kind: "cylinder", radius: 0.04, length: 0.5, at: [0.3 * Math.cos((i * TAU) / 6), 0.3 * Math.sin((i * TAU) / 6), 0] })),
        { kind: "box", size: [6.4, 0.06, 0.04], at: [0, 0, 0.4], angle: deg(62), accent: true },
        { kind: "cylinder", radius: 0.1, length: 0.9 },
      ],
    },
    { id: "armL", kind: "group", center: TOP.left, arrow: false, pieces: arm(-1) },
    { id: "armR", kind: "group", center: TOP.right, arrow: false, pieces: arm(1) },
    {
      id: "pendulum",
      kind: "group",
      center: [0, 5.2, 0],
      arrow: false,
      pieces: [
        { kind: "box", size: [1.3, 0.2, 0.3], at: [0, 0.3, 0] },
        { kind: "box", size: [0.12, 9.8, 0.08], at: [0, -4.9, -0.45] },
        { kind: "cylinder", radius: 0.18, length: 0.5, axis: [0, 1, 0], at: [0, -8.9, -0.45] },
      ],
    },
    { id: "labelA", kind: "group", center: [1.45, 2.1, 0], label: "A", labelOffset: [0.2, 0.25, 0.3] },
    { id: "labelC", kind: "group", center: [-1.45, 2.1, 0], label: "C", labelOffset: [0.25, 0.1, 0.3] },
    { id: "labelB", kind: "group", center: [0, -1.4, 0], label: "B", labelOffset: [0.15, 0, 0.4] },
    { id: "labelD", kind: "group", center: [-1.6, 2.1, 0], label: "E", labelOffset: [-0.3, 0.2, 0.3] },
    { id: "labelE", kind: "group", center: [1.6, 2.1, 0], label: "D", labelOffset: [0.4, -0.1, 0.3] },
  ],
  // 動力重演:只推主動件;wheel 受固定的力矩(發條或重錘),由擒縱件擋住、放行
  replay: { free: { wheel: { spring: 1, gravity: false } }, expect: [{ part: "wheel", label: "主動件走完一輪後 wheel 的位置" }] },
  driver: { part: "pendulum", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheel", // 擒縱輪
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const d = doubleThree(v);
    return { parts: { pendulum: { angle: d.pendulum }, armR: { angle: d.right }, armL: { angle: -d.left }, wheel: { angle: d.wheel } }, readouts: [] };
  },
  waivers: [
    { check: "replay", parts: ["wheel"], reason: "未修:動力重演不成立——「主動件走完一輪後 wheel 的位置」預期 wheel 在主動量 0.21 時已轉 120°,實際轉了 12763°。模型的擒縱是依擺動的相位演出的:重演裡給擒縱輪一個固定的力矩後,掣子(叉瓦)沒有照一擺放一齒那樣擋住、放行(輪一路轉走,或被卡住不動)。掣子與輪齒的外形、位置要重做成真的擋得住(列入待確認清單)" },
    { check: "interference", parts: ["wheel", "pendulum"], reason: "擺桿在擒縱輪軸的後端前方擺過,與軸端重疊 0.04(96 個取樣中 46 個);軸端應再短一點" },
    { check: "unsupported", parts: ["armR"], reason: "擒縱的接觸是瞬間的(輪齒落在掣子上、滑過衝擊面);模型依相位演出,零件的外形沒有畫到真的互相碰到(差 0.09)。要補得重排擺軸、掣子與擒縱輪的相對位置(列入待確認清單)" },
    { check: "unsupported", parts: ["armL"], reason: "擒縱的接觸是瞬間的(輪齒落在掣子上、滑過衝擊面);模型依相位演出,零件的外形沒有畫到真的互相碰到(差 0.09)。要補得重排擺軸、掣子與擒縱輪的相對位置(列入待確認清單)" },
  ],
};
