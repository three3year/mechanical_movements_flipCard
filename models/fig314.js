// 第 314 種:槓桿式天文台計時器擒縱。擒縱叉瓦 A、B 與槓桿看起來和第 296 種的槓桿式擒縱相同,但叉瓦只用來鎖住
// 擒縱輪,本身不傳遞衝量;衝量由擒縱輪的齒直接傳給擺輪上的叉瓦 C(每來回一次一次衝量)。
// 擺輪的銷每擺一次撥動槓桿,叉瓦 A、B 輪流放開、鎖住;擺輪每來回一次,擒縱輪轉過一齒。主動件是擺輪。
// 推斷:齒數、擺幅、銷與槓桿接觸的範圍。
import { TAU, deg, swingPhase, smooth, clamp } from "./kit.js";
import { ratchetShape, shape, circle, thickLine } from "./shapes.js";

export const N = 15;
export const PITCH = TAU / N;
export const SWING = deg(140);
const WINDOW = deg(30);
const WHEEL = [-0.7, 0.15, 0];
const BAL = [1.25, 1.55, 0.15];
const LEVER = [1.1, -0.35, 0]; // 槓桿樞軸
const BANK = deg(5);

/** 擺輪累計擺動 v → 擺輪角、槓桿角、擒縱輪轉角(只在往 from 那一程的中段轉一齒) */
export function leverChrono(v) {
  const { at, cycle, forward, f } = swingPhase(v, -SWING, SWING);
  const lever = BANK * clamp(-at / WINDOW, -1, 1);
  const f0 = 0.5 - WINDOW / (2 * SWING);
  const turn = forward ? 0 : smooth((f - f0) / (2 * (0.5 - f0)));
  return { balance: at, lever, wheel: -PITCH * (cycle + turn) };
}

export default {
  figure: 314,
  parts: [
    {
      id: "wheel",
      kind: "group",
      center: WHEEL,
      spin: 1.65,
      pieces: [
        { kind: "plate", shape: { ...ratchetShape({ teeth: N, outer: 1.65, inner: 1.3, dir: -1 }), holes: [circle(1.12).reverse()] }, thickness: 0.12 },
        { kind: "box", size: [2.3, 0.12, 0.08] },
        { kind: "box", size: [0.12, 2.3, 0.08] },
        { kind: "plate", shape: shape(circle(0.22), [circle(0.06).reverse()]), thickness: 0.16 },
        { kind: "box", size: [0.14, 0.14, 0.14], at: [1.2, 0, 0.08], accent: true },
      ],
    },
    {
      id: "balance",
      kind: "group",
      center: BAL,
      spin: 0.6,
      pieces: [
        { kind: "plate", shape: shape(circle(0.6), [circle(0.06).reverse()]), thickness: 0.1 },
        // 衝擊叉瓦 C 與撥槓桿的銷
        { kind: "box", size: [0.3, 0.16, 0.14], at: [-0.62, 0.15, 0.06], accent: true },
        { kind: "cylinder", radius: 0.05, length: 0.3, at: [0, -0.45, 0.1] },
        { kind: "cylinder", radius: 0.07, length: 0.6 },
      ],
    },
    {
      id: "lever",
      kind: "group",
      center: LEVER,
      arrow: false,
      pieces: [
        // 槓桿往上到擺輪下方的叉口;叉瓦 A(上)、B(下)伸向擒縱輪
        { kind: "plate", shape: shape(thickLine([[0, -0.6], [0.1, 1.5]], 0.2), [circle(0.06).reverse()]), thickness: 0.08, at: [0, 0, 0.1] },
        { kind: "plate", shape: shape(thickLine([[0, 0.2], [-0.95, 0.75]], 0.16)), thickness: 0.08, at: [0, 0, 0.1] },
        { kind: "plate", shape: shape(thickLine([[-0.05, -0.45], [-0.85, -1.1]], 0.16)), thickness: 0.08, at: [0, 0, 0.1] },
      ],
    },
    { id: "labelA", kind: "group", center: [LEVER[0] + 0.1, LEVER[1] + 0.35, 0], label: "A", labelOffset: [0.3, 0, 0.3] },
    { id: "labelB", kind: "group", center: [LEVER[0] - 0.85, LEVER[1] - 1.1, 0], label: "B", labelOffset: [-0.2, -0.25, 0.3] },
    { id: "labelC", kind: "group", center: [BAL[0] - 0.62, BAL[1] + 0.15, 0], label: "C", labelOffset: [-0.25, 0.25, 0.3] },
  ],
  driver: { part: "balance", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheel", // 擒縱輪
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const l = leverChrono(v);
    return { parts: { balance: { angle: l.balance }, lever: { angle: l.lever }, wheel: { angle: l.wheel } }, readouts: [] };
  },
  waivers: [
    { check: "interference", parts: ["balance", "lever"], reason: "槓桿的叉口套著擺輪圓盤上的銷:叉口與圓盤在圖上畫在同一層,重疊 0.04" },
    { check: "interference", parts: ["wheel", "lever"], reason: "擒縱輪的進退依擺動的相位演出(每擺一次放過一齒),沒有逐點算槓桿的掣子與輪上的衝擊塊的接觸;重疊 0.09(96 個取樣中 10 個)。列入待確認清單的動力重演名單" },
  ],
};
