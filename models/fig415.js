// 第 415 種:P. Dickson 的專利裝置,把擺動變成朝任一方向的間歇圓周運動。擺動傳給槓桿 A,A 上側靠近輪 D 的軸處
// 以鉸鏈裝著兩個棘爪 B 與 C;A 上側的小曲柄 E 用繩子連到每一個棘爪。棘爪 C 貼著輪 D 的內緣時,輪朝一個方向轉,
// 此時棘爪 B 脫開;抬起作動中的 C、經曲柄 E 讓對面的 B 嚙合,輪 D 的轉向就反過來。
// 主動件是槓桿 A(由下方的拉桿往復擺動);狀態按鈕切換由 C 或 B 嚙合。
// 推斷:槓桿 A 繞輪 D 的軸擺動;棘爪是靠楔住內緣摩擦帶動的楔形爪:朝一邊擺時楔住、帶著輪轉,擺回來時滑過,輪停住。
import { deg, swingPhase } from "./kit.js";
import { shape, circle, rect, thickLine } from "./shapes.js";

export const SWING = deg(18); // 槓桿擺動的半幅
const RIM = 0.92; // 輪 D 內側輪緣(棘爪貼著的那一圈)的半徑
const OUTER = 1.75; // 輪 D 的外緣
const PIVOT = { B: [-0.3, 0.12], C: [0.3, 0.12] };
const TIP = { B: [-RIM * Math.cos(deg(32)), RIM * Math.sin(deg(32))], C: [RIM * Math.cos(deg(32)), RIM * Math.sin(deg(32))] };
const LIFT = deg(16); // 被繩子抬起的棘爪轉開的角度
const E_AT = [0, 0.5];

/** 累計行程 v → 槓桿的轉角與輪 D 的轉角(C 嚙合:逆時針擺時帶著輪逆時針轉;B 嚙合時相反) */
export function motion(v, state = "C") {
  const span = 2 * SWING;
  const { at, forward, f } = swingPhase(v, -SWING, SWING);
  const k = Math.floor(v / span);
  let wheel;
  if (state === "C") wheel = span * Math.floor((k + 1) / 2) + (forward ? f * span : 0);
  else wheel = -span * (Math.floor(k / 2) + (forward ? 0 : f));
  return { lever: at, wheel, driving: state === "C" ? forward : !forward };
}

const rot = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
const pawlShape = (side) => {
  const P = PIVOT[side];
  const T = TIP[side];
  const d = [T[0] - P[0], T[1] - P[1]];
  return shape(thickLine([[0, 0], [d[0] * 0.75, d[1] * 0.75], d], 0.13), [circle(0.04).reverse()]);
};
const STEM = -1.3; // 槓桿下端(接拉桿)

export default {
  figure: 415,
  parts: [
    {
      id: "wheel",
      kind: "group",
      label: "D",
      labelOffset: [1.25, -0.95, 0.3],
      spin: OUTER + 0.1,
      pieces: [
        { kind: "plate", shape: shape(circle(OUTER), [circle(OUTER - 0.12).reverse()]), thickness: 0.3, mark: [OUTER - 0.06, 0], markSize: 0.1 },
        { kind: "plate", shape: shape(circle(RIM + 0.08), [circle(RIM).reverse()]), thickness: 0.24 },
        { kind: "plate", shape: shape(circle(OUTER)), thickness: 0.04, at: [0, 0, -0.17] },
        { kind: "cylinder", radius: 0.08, length: 0.5, at: [0, 0, -0.1] },
      ],
    },
    {
      id: "lever",
      kind: "group",
      label: "A",
      labelOffset: [0.12, -0.95, 0.3],
      arrow: false,
      pieces: [
        // T 形的槓桿:橫頭(兩棘爪的鉸鏈)、往下的柄、往上的短柱(裝曲柄 E)
        { kind: "plate", shape: shape(thickLine([[-0.62, 0.05], [-0.4, -0.2], [0.4, -0.2], [0.62, 0.05]], 0.16)), thickness: 0.06, at: [0, 0, 0.05] },
        { kind: "plate", shape: shape(rect(0.16, 1.2, 0, -0.75)), thickness: 0.06, at: [0, 0, 0.05] },
        { kind: "plate", shape: shape(rect(0.07, 0.5, 0, 0.25)), thickness: 0.05, at: [0, 0, 0.05] },
        { kind: "cylinder", radius: 0.07, length: 0.2, at: [0, STEM, 0.1] },
        { kind: "cylinder", radius: 0.05, length: 0.2, at: [PIVOT.B[0], PIVOT.B[1], 0.1] },
        { kind: "cylinder", radius: 0.05, length: 0.2, at: [PIVOT.C[0], PIVOT.C[1], 0.1] },
      ],
    },
    { id: "pawlB", kind: "plate", shape: pawlShape("B"), thickness: 0.06, label: "B", labelOffset: [-0.15, 0.2, 0.2], arrow: false },
    { id: "pawlC", kind: "plate", shape: pawlShape("C"), thickness: 0.06, label: "C", labelOffset: [0.15, 0.2, 0.2], arrow: false },
    { id: "crank", kind: "plate", shape: shape(thickLine([[-0.22, 0], [0.22, 0]], 0.07), [circle(0.025).reverse()]), thickness: 0.05, label: "E", labelOffset: [0, 0.22, 0.2], arrow: false, accent: true },
    { id: "cordB", kind: "rope", radius: 0.012 },
    { id: "cordC", kind: "rope", radius: 0.012 },
    { id: "rod", kind: "link", width: 0.1, thickness: 0.05 },
  ],
  states: {
    initial: "C",
    options: [
      { id: "C", label: "C 嚙合" },
      { id: "B", label: "B 嚙合" },
    ],
  },
  driver: { part: "lever", type: "rotation", cycle: [-SWING, SWING], initial: SWING },
  target: "wheel",
  view: { direction: [0.05, 0.06, 1] },
  pose(v, state = "C") {
    const m = motion(v, state);
    const a = m.lever;
    const place = (p, z) => [...rot(p, a), z];
    // 被抬起的棘爪繞自己的鉸鏈轉開(C 逆時針、B 順時針,爪尖離開內緣)
    const lift = { B: state === "B" ? 0 : -LIFT, C: state === "C" ? 0 : LIFT };
    // 曲柄 E 朝被抬起的那一邊傾斜(拉緊那邊的繩)
    const tiltE = state === "C" ? deg(20) : deg(-20);
    const eEnd = (s) => [E_AT[0] + s * 0.22 * Math.cos(tiltE), E_AT[1] + s * 0.22 * Math.sin(tiltE)];
    const pawlMid = (side) => {
      const P = PIVOT[side];
      const T = TIP[side];
      const d = rot([(T[0] - P[0]) * 0.4, (T[1] - P[1]) * 0.4], lift[side]);
      return [P[0] + d[0], P[1] + d[1]];
    };
    const stem = place([0, STEM], 0.14);
    return {
      parts: {
        wheel: { angle: m.wheel },
        lever: { angle: a },
        pawlB: { position: place(PIVOT.B, 0.12), angle: a + lift.B },
        pawlC: { position: place(PIVOT.C, 0.12), angle: a + lift.C },
        crank: { position: place(E_AT, 0.14), angle: a + tiltE },
        rod: { from: stem, to: [stem[0] + 2.6, stem[1], 0.14] },
      },
      paths: {
        cordB: { points: [place(eEnd(-1), 0.14), place(pawlMid("B"), 0.14)], closed: false, phase: 0 },
        cordC: { points: [place(eEnd(1), 0.14), place(pawlMid("C"), 0.14)], closed: false, phase: 0 },
      },
      readouts: [{ label: "輪 D", value: m.driving ? (state === "C" ? "被帶著逆時針轉" : "被帶著順時針轉") : "停住(棘爪滑過)" }],
    };
  },
  waivers: [
    { check: "interference", parts: ["wheel", "rod"], reason: "簡化畫法:桿的端頭貼著輪面,重疊 0.04" },
    { check: "interference", parts: ["wheel", "lever"], reason: "簡化畫法:槓桿貼著輪面,重疊 0.10" },
  ],
};
