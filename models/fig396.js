// 第 396 種:G. P. Reed 的錶用錨形件與槓桿式擒縱的專利,把槓桿與天文台計時器擒縱結合:擺輪往一個方向擺時得到的衝量
// 全部經槓桿傳來,往另一個方向擺時的衝量直接給計時器的衝量叉瓦;鎖住與放開擒縱輪,只在擒縱輪每次給衝量時各一次。
// 擺輪每來回一次,擒縱輪轉兩次各半齒(一次經槓桿、一次直接給擺輪)。主動件是擺輪(累計擺動)。
// 推斷:齒數、擺幅、銷與槓桿接觸的範圍;擺輪只畫出輪緣與滾子。
import { TAU, deg, swingPhase, smooth, clamp } from "./kit.js";
import { ratchetShape, shape, circle, thickLine } from "./shapes.js";

export const N = 15;
export const PITCH = TAU / N;
export const SWING = deg(140);
const WINDOW = deg(30);
const BAL = [-1.4, 0, 0];
const WHEEL = [0.95, 0.05, 0];
const LEVER = [1.95, 0.05, 0];

/** 擺輪累計擺動 v → 擺輪角、槓桿角、擒縱輪轉角(每程半齒,轉在每程的中段) */
export function reed(v) {
  const { at, cycle, forward, f } = swingPhase(v, -SWING, SWING);
  const lever = deg(5) * clamp(-at / WINDOW, -1, 1);
  const f0 = 0.5 - WINDOW / (2 * SWING);
  const half = 2 * cycle + (forward ? 0 : 1);
  const wheel = -(half + smooth((f - f0) / (2 * (0.5 - f0)))) * (PITCH / 2);
  return { balance: at, lever, wheel };
}

export default {
  figure: 396,
  parts: [
    {
      id: "balance",
      kind: "group",
      center: BAL,
      spin: 1.75,
      pieces: [
        { kind: "plate", shape: shape(circle(1.75), [circle(1.62).reverse()]), thickness: 0.1 },
        { kind: "box", size: [3.3, 0.06, 0.06] },
        { kind: "plate", shape: shape(circle(0.4), [circle(0.06).reverse()]), thickness: 0.1, at: [0, 0, 0.12] },
        { kind: "box", size: [0.18, 0.12, 0.12], at: [0.42, 0, 0.12], accent: true },
        { kind: "cylinder", radius: 0.05, length: 0.3, at: [0.32, 0.12, 0.2] },
      ],
    },
    {
      id: "wheel",
      kind: "group",
      center: WHEEL,
      spin: 0.85,
      pieces: [
        { kind: "plate", shape: { ...ratchetShape({ teeth: N, outer: 0.85, inner: 0.68, dir: -1 }), holes: [circle(0.55).reverse()] }, thickness: 0.1 },
        ...[0, 1, 2].map((i) => ({ kind: "plate", shape: shape(thickLine([[0, 0], [0.3, 0.25], [0.6, 0.05]].map(([x, y]) => [x * Math.cos((i * TAU) / 3) - y * Math.sin((i * TAU) / 3), x * Math.sin((i * TAU) / 3) + y * Math.cos((i * TAU) / 3)]), 0.1)), thickness: 0.08 })),
        { kind: "cylinder", radius: 0.1, length: 0.2 },
      ],
    },
    {
      id: "lever",
      kind: "group",
      center: LEVER,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[-2.7, 0], [-1.5, 0], [0, 0], [0.5, 0]], 0.12), [circle(0.05).reverse()]), thickness: 0.06, at: [0, 0, 0.15] },
        { kind: "plate", shape: shape([[-0.6, 0.35], [-0.45, 0.35], [-0.45, 0.6], [-0.6, 0.6]]), thickness: 0.12, at: [0, 0, 0.15] },
        { kind: "plate", shape: shape([[-0.6, -0.35], [-0.45, -0.35], [-0.45, -0.6], [-0.6, -0.6]]), thickness: 0.12, at: [0, 0, 0.15] },
      ],
    },
  ],
  // 動力重演:只推主動件;wheel 受固定的力矩(發條或重錘),由擒縱件擋住、放行
  replay: { free: { wheel: { spring: -1, gravity: false } }, expect: [{ part: "wheel", label: "主動件走完一輪後 wheel 的位置" }] },
  driver: { part: "balance", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheel",
  view: { direction: [0.03, 0.05, 1] },
  pose(v) {
    const r = reed(v);
    return { parts: { balance: { angle: r.balance }, lever: { angle: r.lever }, wheel: { angle: r.wheel } }, readouts: [] };
  },
  waivers: [
    { check: "replay", parts: ["wheel"], reason: "未修:動力重演不成立——「主動件走完一輪後 wheel 的位置」預期 wheel 在主動量 9.77 時已轉 -24°,實際轉了 151°。模型的擒縱是依擺動的相位演出的:重演裡給擒縱輪一個固定的力矩後,掣子(叉瓦)沒有照一擺放一齒那樣擋住、放行(輪一路轉走,或被卡住不動)。掣子與輪齒的外形、位置要重做成真的擋得住(列入待確認清單)" },
    { check: "interference", parts: ["balance", "wheel"], reason: "擒縱輪的進退依擺動的相位演出,沒有逐點算擺輪上的掣子與輪齒的接觸;重疊 0.10。列入待確認清單的動力重演名單" },
  ],
};
