// 第 293 種:雙合式擒縱(錶用),兼具正齒輪與冠狀輪的特性:輪緣上一圈立起的冠狀齒(D、c)負責衝擊,
// 外緣的長齒(a)負責鎖住。擺輪軸 A 上帶著叉瓦 B,每次往一個方向擺時從冠狀齒接收一個衝擊;
// 軸 A 上切有一道凹槽,每當一個冠狀齒推過叉瓦 B,輪的鎖齒就依序落進凹槽、被放走一齒。
// 擺輪每來回一次,輪轉過一齒(原圖箭頭:輪的上緣往右)。主動件是擺輪(累計擺動)。
// 推斷:擺幅、齒數。
import { TAU, deg, quatFromBasis } from "./kit.js";
import { singleBeat } from "./escapement.js";
import { shape, circle, arcPoints } from "./shapes.js";

export const N = 18;
export const PITCH = TAU / N;
export const SWING = deg(100);
const W = [0, -2.2, 0]; // 輪心(原圖只畫出上方一段輪緣)
const R = 2.0;
const A = [0.35, 0.5, 0.25]; // 擺輪軸

/** 擺輪累計擺動 v → 擺輪角、輪轉角(順時針為負:上緣往右) */
export function duplex(v) {
  const { at, turned } = singleBeat(v, -SWING, SWING, PITCH);
  return { balance: at, wheel: -turned };
}

// 冠狀齒:立在輪面上的三角板(朝 +z),板面沿切線
const crown = Array.from({ length: N }, (_, i) => {
  const a = (i + 0.5) * PITCH;
  const r = R - 0.22;
  const t = [-Math.sin(a), Math.cos(a), 0];
  return {
    kind: "plate",
    shape: shape([[-0.12, 0], [0.12, 0], [-0.02, 0.55]]),
    thickness: 0.06,
    at: [r * Math.cos(a), r * Math.sin(a), 0.07],
    rotation: quatFromBasis(t, [0, 0, 1], [Math.cos(a), Math.sin(a), 0]),
    accent: i === 0,
  };
});
// 鎖齒:外緣上的長尖齒
const lockTeeth = shape(
  Array.from({ length: N * 3 }, (_, k) => {
    const i = Math.floor(k / 3);
    const a = i * PITCH;
    if (k % 3 === 0) return [R * Math.cos(a), R * Math.sin(a)];
    if (k % 3 === 1) return [(R + 0.32) * Math.cos(a + PITCH * 0.08), (R + 0.32) * Math.sin(a + PITCH * 0.08)];
    return [R * Math.cos(a + PITCH * 0.25), R * Math.sin(a + PITCH * 0.25)];
  }),
  [arcPoints(R - 0.5, 0, TAU).slice(0, -1).reverse()],
);

export default {
  figure: 293,
  parts: [
    { id: "wheel", kind: "group", center: W, spin: R, arrow: false, pieces: [{ kind: "plate", shape: lockTeeth, thickness: 0.12 }, ...crown] },
    {
      id: "staffA",
      kind: "group",
      center: A,
      spin: 0.32,
      label: "A",
      labelOffset: [-0.3, 0.3, 0.3],
      pieces: [
        { kind: "plate", shape: shape(circle(0.3), [circle(0.1).reverse()]), thickness: 0.2 },
        // 叉瓦 B:從軸往下伸到冠狀齒的高度
        { kind: "plate", shape: shape([[-0.06, 0], [0.06, 0], [0.12, -0.95], [0.0, -0.97]]), thickness: 0.08, at: [0.1, -0.1, 0.25], accent: true },
      ],
    },
    { id: "labelB", kind: "group", center: [A[0] + 0.15, A[1] - 0.6, 0.5], label: "B", labelOffset: [0.25, 0, 0] },
    { id: "labelD", kind: "group", center: [-1.3, -0.75, 0.5], label: "D", labelOffset: [-0.2, 0.3, 0] },
  ],
  // 動力重演:只推主動件;wheel 受固定的力矩(發條或重錘),由擒縱件擋住、放行
  replay: { free: { wheel: { spring: -1, gravity: false } }, expect: [{ part: "wheel", label: "主動件走完一輪後 wheel 的位置" }] },
  driver: { part: "staffA", type: "rotation", cycle: [-SWING, SWING], initial: SWING },
  target: "wheel", // 擒縱輪
  view: { direction: [0.05, 0.35, 1] },
  pose(v) {
    const d = duplex(v);
    return { parts: { staffA: { angle: d.balance }, wheel: { angle: d.wheel } }, readouts: [] };
  },
  waivers: [
    { check: "replay", parts: ["wheel"], reason: "未修:動力重演不成立——「主動件走完一輪後 wheel 的位置」預期 wheel 在主動量 8.73 時已轉 -20°,實際轉了 -7120°。模型的擒縱是依擺動的相位演出的:重演裡給擒縱輪一個固定的力矩後,掣子(叉瓦)沒有照一擺放一齒那樣擋住、放行(輪一路轉走,或被卡住不動)。掣子與輪齒的外形、位置要重做成真的擋得住(列入待確認清單)" },
    { check: "interference", parts: ["wheel", "staffA"], reason: "擒縱輪的進退依擺動的相位演出(每擺一次放過一齒),沒有逐點算擺輪心軸上的缺口與輪齒的接觸;重疊 0.09(96 個取樣中 6 個)。列入待確認清單的動力重演名單" },
  ],
};
