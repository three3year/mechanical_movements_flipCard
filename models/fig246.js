// 第 246 種:縮放圖器。兩支長臂在右端 R 鉸接;下臂的另一端裝在固定樞軸 C 上,上臂末端是鉛筆 A;
// 兩根短桿與兩長臂的中點組成平行四邊形,左頂點是描摹點 B。C、B、A 永遠在同一直線上,且 CA = 2·CB:
// 以 B 描一張平面圖,鉛筆就畫出兩倍大的同一張圖。
// 主動件是描摹點 B,沿著紙上的平面圖(灰線)走一圈;鉛筆的軌跡由 pose 回傳(畫到目前為止的部分)。
// 照原圖與 507movements 的動畫:C 是固定樞軸上一個圓形的滑塊,下臂穿過它再往外伸;鉛筆裝在套在上臂上的方形滑塊下,
// 上臂也伸過滑塊。兩個滑塊跟著各自的臂轉,沿臂移動就改變比例(原文);這裡和動畫一樣固定在比例為 2 的位置。
// 每個接點是一根桿的眼套著另一根桿的銷:四根桿分三層,短桿 B–U 和上臂同一層(兩者是平行四邊形的對邊,不會交疊)。
// 推斷:平面圖的形狀(一棟小房子的輪廓);固定樞軸的底座;兩臂伸過滑塊的長度。
import { TAU, sub, add, scale, len, lerp3 } from "./kit.js";
import { circleCircle } from "./linkage.js";

const C = [-2.4, -2.3, 0];
const HALF = 2.0; // 長臂的一半 = 短桿長
export const RATIO = 2;
// 平面圖(以描摹點 B 描的線,逆時針):一棟小房子
const PLAN = [[-0.45, -0.4], [0.45, -0.4], [0.45, 0.2], [0, 0.55], [-0.45, 0.2]].map(([x, y]) => [-2.6 + x, -0.3 + y, 0]);
const Z = { paper: -0.12, bars: 0.12, trace: -0.05 };
const EXT = 0.55; // 兩支長臂伸過滑塊的長度
const ARM = { width: 0.13, thickness: 0.06 };
// 長臂:局部 +x 沿著臂,原點在臂量起的那一端(下臂在 C、上臂在 R);臂身從 from 到 to
const armPieces = (from, to, eyes, pin) => [
  { kind: "box", size: [to - from, ARM.width, ARM.thickness], at: [(from + to) / 2, 0, 0] },
  ...[from, to].map((x) => ({ kind: "cylinder", radius: ARM.width / 2, length: ARM.thickness, at: [x, 0, 0] })), // 圓頭
  ...eyes.map((x) => ({ kind: "cylinder", radius: ARM.width / 2 + 0.03, length: ARM.thickness, at: [x, 0, 0] })), // 接點的眼
  ...(pin === undefined ? [] : [{ kind: "cylinder", radius: ARM.width * 0.2, length: ARM.thickness * 2.2, at: [pin, 0, 0] }]), // 接點的銷
];
const heading = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);

const edges = PLAN.map((p, i) => len(sub(PLAN[(i + 1) % PLAN.length], p)));
const PERIM = edges.reduce((a, b) => a + b, 0);

/** 平面圖上參數 s(一圈為 1)的點 */
export function planPoint(s) {
  let d = (((s % 1) + 1) % 1) * PERIM;
  for (let i = 0; i < PLAN.length; i++) {
    if (d <= edges[i]) return lerp3(PLAN[i], PLAN[(i + 1) % PLAN.length], d / edges[i]);
    d -= edges[i];
  }
  return PLAN[0];
}

/** 描摹點在 B 時的各接點:U(下臂中點)、R(兩臂鉸點)、T(上臂中點)、A(鉛筆) */
export function pantograph(B) {
  const U = circleCircle(C, HALF, B, HALF, -1).point;
  const R = add(C, scale(sub(U, C), 2));
  const T = add(B, sub(R, U));
  const A = sub(scale(T, 2), R);
  return { B, U, R, T, A };
}
export const fixedC = C;

const lift = (p, z) => [p[0], p[1], z];

export default {
  figure: 246,
  parts: [
    { id: "paper", kind: "box", center: [-1.5, 0.2, Z.paper - 0.05], size: [5.8, 6.0, 0.04] },
    { id: "plan", kind: "rod", radius: 0.02 },
    { id: "drawing", kind: "trace" },
    // 固定樞軸 C:釘在紙上的底座與往上伸進滑塊的軸
    { id: "pivotC", kind: "group", center: lift(C, 0), label: "C", labelOffset: [-0.15, 0.45, 0.2], pieces: [
      { kind: "cylinder", radius: 0.16, length: 0.1, at: [0, 0, -0.1] }, // 底座:紙面(z −0.15)到 −0.05
      { kind: "cylinder", radius: 0.06, length: 0.12, at: [0, 0, 0.01] }, // 軸:伸進滑塊,停在下臂之下
    ] },
    // C 的滑塊:圓形,套在下臂上、轉在固定樞軸上
    { id: "sliderC", kind: "cylinder", radius: 0.21, length: 0.2, center: lift(C, Z.bars) },
    { id: "armLow", kind: "group", pieces: armPieces(-EXT, 2 * HALF, [HALF], 2 * HALF) },
    { id: "armHigh", kind: "group", pieces: armPieces(0, 2 * HALF + EXT, [0, HALF]) },
    { id: "linkBT", kind: "link", width: 0.11, thickness: 0.05 },
    { id: "linkBU", kind: "link", width: 0.11, thickness: 0.05 },
    { id: "tracerB", kind: "lathe", profile: [[0, -0.18], [0.06, -0.08], [0.07, 0.2], [0, 0.2]], label: "B", labelOffset: [-0.35, 0, 0.2] },
    // 鉛筆 A 裝在套在上臂上的方形滑塊下,筆尖在臂的軸線上
    { id: "pencilA", kind: "group", label: "A", labelOffset: [-0.2, 0.4, 0.3], pieces: [
      { kind: "lathe", profile: [[0, -0.2], [0.05, -0.1], [0.07, 0.0], [0, 0.0]] },
      { kind: "box", size: [0.32, 0.27, 0.16], at: [0, 0, Z.bars + 0.08 - (Z.trace + 0.2)] },
    ] },
  ],
  // grips 留空:描跡針沿任意路徑走(數值微分拖動,不需要 direction);鉛筆 A 是目標件,不當抓取處
  driver: { part: "tracerB", type: "translation", grips: [], speed: 0.08 },
  target: "pencilA",
  view: { direction: [0.03, 0.06, 1] },
  pose(s) {
    const B = planPoint(s);
    const { U, R, T, A } = pantograph(B);
    // 鉛筆從起點畫到目前位置(超過一圈就是完整的圖)
    const span = Math.max(-1, Math.min(1, s));
    const n = Math.max(2, Math.round(Math.abs(span) * 160));
    const from = s - span;
    const drawn = Array.from({ length: n + 1 }, (_, i) => lift(pantograph(planPoint(from + (span * i) / n)).A, Z.trace));
    return {
      parts: {
        sliderC: { position: lift(C, Z.bars), angle: heading(C, R) },
        armLow: { position: lift(C, Z.bars), angle: heading(C, R) },
        armHigh: { position: lift(R, Z.bars + 0.08), angle: heading(R, A) },
        linkBT: { from: lift(B, Z.bars + 0.16), to: lift(T, Z.bars + 0.16) },
        linkBU: { from: lift(B, Z.bars + 0.08), to: lift(U, Z.bars + 0.08) },
        tracerB: { position: lift(B, Z.trace + 0.18) },
        pencilA: { position: lift(A, Z.trace + 0.2), angle: heading(R, A) },
      },
      paths: {
        plan: { points: [...PLAN, PLAN[0]].map((p) => lift(p, Z.trace)), closed: false },
        drawing: { points: drawn, closed: false },
      },
      readouts: [],
    };
  },
};
