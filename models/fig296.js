// 第 296 種:槓桿式擒縱(錶用)。承載擒縱叉瓦的錨形件 B 與槓桿 E–C 連成一體,槓桿一端有凹槽 E;擺輪心軸上的圓盤
// 固定著一根小銷,每次擺動的中途進入凹槽,把槓桿撥到另一邊,使叉瓦在擒縱輪 A 的齒之間進出;
// 叉瓦脫離一齒時,擒縱輪給叉瓦一個衝擊,槓桿再以交替的方向把衝量傳給擺輪。
// 擺輪每擺一次,擒縱輪轉過半個齒(原圖箭頭:順時針)。主動件是擺輪(累計擺動)。
// 推斷:擺幅、銷與凹槽接觸的範圍;擺輪只畫出帶銷的圓盤(原圖只畫到凹槽旁的圓盤)。
import { TAU, deg, swingPhase, smooth, clamp } from "./kit.js";
import { ratchetShape, shape, circle, thickLine } from "./shapes.js";

export const N = 15;
export const PITCH = TAU / N;
export const SWING = deg(150);
const WINDOW = deg(32); // 銷在凹槽裡的擺輪角度範圍(±)
const A = [0.1, -0.75, 0];
const B = [0.25, 1.35, 0];
const FORK = 2.15; // B 到凹槽 E
const ROLLER = { center: [B[0] - FORK - 0.38, B[1], 0.15], pin: 0.3 };

/** 擺輪累計擺動 v → 擺輪角、槓桿角、擒縱輪轉角 */
export function lever(v) {
  const { at, cycle, forward, f } = swingPhase(v, -SWING, SWING);
  const phi = at;
  // 銷在凹槽裡時,槓桿跟著銷走;其餘時間停在擋止(bank)上
  const c = clamp(phi, -WINDOW, WINDOW);
  const angle = -Math.asin((ROLLER.pin * Math.sin(c)) / (FORK + 0.38 - ROLLER.pin * Math.cos(c) + ROLLER.pin));
  const f0 = 0.5 - WINDOW / (2 * SWING);
  const half = 2 * cycle + (forward ? 0 : 1);
  const wheel = -(half + smooth((f - f0) / (2 * (0.5 - f0)))) * (PITCH / 2);
  return { balance: phi, lever: angle, wheel };
}
export const geometry = { WINDOW };

// 擒縱輪:棒頭齒+三根彎輻
const wheel = [
  { kind: "plate", shape: { ...ratchetShape({ teeth: N, outer: 1.62, inner: 1.3, dir: 1 }), holes: [circle(1.1).reverse()] }, thickness: 0.12 },
  ...[0, 1, 2].map((i) => ({ kind: "plate", shape: shape(thickLine([[0, 0], [0.55, 0.45], [1.15, 0.2]].map(([x, y]) => [x * Math.cos((i * TAU) / 3) - y * Math.sin((i * TAU) / 3), x * Math.sin((i * TAU) / 3) + y * Math.cos((i * TAU) / 3)]), 0.12)), thickness: 0.1 })),
  { kind: "cylinder", radius: 0.16, length: 0.25 },
];
// 錨形件與槓桿(相對 B):叉瓦往下伸進輪齒之間;槓桿往左到凹槽 E、往右到 C
const anchor = [
  { kind: "plate", shape: shape(thickLine([[-FORK, 0.05], [-0.6, 0.12], [0, 0.1], [0.9, 0.0], [1.75, 0.1]], 0.26), [circle(0.08).reverse()]), thickness: 0.1, at: [0, 0, 0.12] },
  { kind: "plate", shape: shape([[-0.85, -0.05], [-0.55, -0.05], [-0.62, -0.62], [-0.85, -0.55]]), thickness: 0.12, at: [0, 0, 0.12] },
  { kind: "plate", shape: shape([[0.55, -0.05], [0.85, -0.05], [0.85, -0.55], [0.62, -0.62]]), thickness: 0.12, at: [0, 0, 0.12] },
  // 凹槽 E:槓桿左端的叉口
  { kind: "plate", shape: shape([[-FORK - 0.25, 0.22], [-FORK + 0.1, 0.22], [-FORK + 0.1, -0.18], [-FORK - 0.25, -0.18], [-FORK - 0.25, -0.06], [-FORK - 0.05, -0.06], [-FORK - 0.05, 0.1], [-FORK - 0.25, 0.1]]), thickness: 0.12, at: [0, 0, 0.12] },
];

export default {
  figure: 296,
  parts: [
    { id: "wheelA", kind: "group", center: A, spin: 1.62, label: "A", labelOffset: [0, 0.3, 0.3], pieces: [...wheel, { kind: "box", size: [0.14, 0.14, 0.14], at: [1.2, 0, 0.08], accent: true }] },
    { id: "anchor", kind: "group", center: B, arrow: false, label: "B", labelOffset: [0.35, 0.25, 0.3], pieces: anchor },
    { id: "labelC", kind: "group", center: [B[0] + 1.75, B[1], 0], label: "C", labelOffset: [0.3, 0, 0.3] },
    { id: "labelE", kind: "group", center: [B[0] - FORK, B[1], 0], label: "E", labelOffset: [0.25, 0.32, 0.3] },
    {
      id: "roller",
      kind: "group",
      center: ROLLER.center,
      spin: 0.42,
      pieces: [
        { kind: "plate", shape: shape(circle(0.42), [circle(0.06).reverse()]), thickness: 0.08 },
        { kind: "cylinder", radius: 0.05, length: 0.3, at: [ROLLER.pin, 0, 0.0], accent: true },
        { kind: "cylinder", radius: 0.06, length: 0.6 },
      ],
    },
  ],
  driver: { part: "roller", type: "rotation", cycle: [-SWING, SWING] },
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const l = lever(v);
    return { parts: { roller: { angle: l.balance }, anchor: { angle: l.lever }, wheelA: { angle: l.wheel } }, readouts: [] };
  },
};
