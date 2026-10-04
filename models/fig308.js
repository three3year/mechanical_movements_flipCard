// 第 308 種:分離式擺鐘擒縱。擺 P 除了接收衝量與解鎖擒縱輪的那一刻之外,都與擒縱輪脫離、自由擺動。
// 只有一個擒縱叉瓦 I(在擺的橫桿上),只在擺向左擺(原圖箭頭)的期間接收衝量;槓桿 Q 鎖住擒縱輪,
// 直到快要傳遞衝量時,才由裝在擺上的制動爪 C 把它撥開解鎖。擺向右返回時,以樞軸擺動的制動爪被槓桿推向一旁。
// 擺每來回一次,擒縱輪轉過一齒。主動件是擺(擺的橫桿左右移動)。
// 推斷:擒縱輪齒數、擺的行程;擺的兩根擺桿 P 只畫出彎曲的一段(原圖)。
import { TAU, smooth } from "./kit.js";
import { singleBeat } from "./escapement.js";
import { ratchetShape, shape, rect, thickLine, circle } from "./shapes.js";

export const N = 12;
export const PITCH = TAU / N;
export const TRAVEL = 0.9; // 擺橫桿的單邊行程
const WHEEL = [0.05, 1.45, 0];
const QP = [0.65, 0.55, 0]; // 鎖定槓桿 Q 的樞軸
const BAR_Y = 0.0;

/** 擺的累計行程 v(往左為「去程」)→ 橫桿位移、槓桿 Q 的角、制動爪的角、擒縱輪轉角 */
export function detached(v) {
  // 一程往右(返回)、一程往左;往左那一程的中段解鎖並給衝量
  const { at, forward, f, turned } = singleBeat(v, -TRAVEL, TRAVEL, PITCH, 0.47, 0.2);
  const x = at;
  const going = !forward; // 往 from 那一程 = 往左
  const bump = (c, w) => Math.max(0, 1 - Math.abs(f - c) / w);
  return {
    x,
    lever: going ? 0.22 * bump(0.45, 0.1) : 0,
    click: going ? 0 : -0.6 * smooth(bump(0.5, 0.12) * 2),
    wheel: -turned,
  };
}
export const geometry = { TRAVEL };

const P_ARC = (s) => shape(thickLine(Array.from({ length: 9 }, (_, i) => {
  const t = i / 8;
  return [s * (2.7 - 0.35 * Math.sin(Math.PI * t)), -1.6 + 3.2 * t];
}), 0.35));

export default {
  figure: 308,
  parts: [
    { id: "wheel", kind: "plate", center: WHEEL, shape: ratchetShape({ teeth: N, outer: 0.6, inner: 0.45, dir: -1, bore: 0.06 }), thickness: 0.12, hub: 0.12, mark: [0.3, 0], markSize: 0.05, spin: 0.6 },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(rect(0.6, 0.9, WHEEL[0] - 0.05, WHEEL[1] + 0.55)), thickness: 0.1, at: [0, 0, -0.25] },
        { kind: "cylinder", radius: 0.08, length: 0.3, at: [QP[0], QP[1], 0] },
      ],
    },
    {
      id: "leverQ",
      kind: "group",
      center: QP,
      arrow: false,
      label: "Q",
      labelOffset: [0.4, 0.3, 0.3],
      pieces: [{ kind: "plate", shape: shape(thickLine([[0, 0], [-0.25, 0.55], [-0.3, 0.75]], 0.1)), thickness: 0.08, at: [0, 0, 0.1] }, { kind: "plate", shape: shape(thickLine([[0, 0], [-0.55, -0.35]], 0.1)), thickness: 0.08, at: [0, 0, 0.1] }],
    },
    {
      id: "pendulum",
      kind: "group",
      arrow: false,
      label: "P",
      labelOffset: [-3.0, -1.2, 0.3],
      pieces: [
        { kind: "plate", shape: shape(rect(5.0, 0.55, 0, BAR_Y)), thickness: 0.1, at: [0, 0, -0.15] },
        { kind: "plate", shape: P_ARC(-1), thickness: 0.12 },
        { kind: "plate", shape: P_ARC(1), thickness: 0.12 },
        // 叉瓦 I:立在橫桿上,伸到擒縱輪下緣
        { kind: "plate", shape: shape(rect(0.12, 0.65, -0.25, BAR_Y + 0.55)), thickness: 0.14, at: [0, 0, 0.05] },
        { kind: "cylinder", radius: 0.05, length: 0.3, at: [0.05, BAR_Y + 0.12, 0.05] },
      ],
    },
    { id: "click", kind: "plate", shape: shape(thickLine([[0, 0], [0.3, 0.35]], 0.08), [circle(0.03).reverse()]), thickness: 0.08, arrow: false, label: "C", labelOffset: [0.35, -0.2, 0.3] },
    { id: "labelI", kind: "group", center: [-0.25, 0.85, 0], label: "I", labelOffset: [-0.25, 0, 0.3] },
    { id: "labelP2", kind: "group", center: [2.7, -1.2, 0], label: "P", labelOffset: [0.4, 0, 0.3] },
  ],
  driver: { part: "pendulum", type: "translation", direction: [1, 0, 0], cycle: [-TRAVEL, TRAVEL] },
  target: "wheel", // 擒縱輪
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const d = detached(v);
    return {
      parts: {
        pendulum: { position: [d.x, 0, 0] },
        click: { position: [d.x + 0.05, BAR_Y + 0.12, 0.12], angle: d.click },
        leverQ: { angle: d.lever },
        wheel: { angle: d.wheel },
      },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["frame", "pendulum"], reason: "擺擺到極限時,擺桿的上端碰到機架上的銷(重疊 0.13,96 個取樣中 6 個);擺幅是示意的大小" },
    { check: "interference", parts: ["leverQ", "pendulum"], reason: "擺上的銷撥動槓桿 Q 的過程依相位演出,不逐點算接觸;重疊 0.07(96 個取樣中 34 個)" },
    { check: "interference", parts: ["leverQ", "click"], reason: "槓桿 Q 與止回爪的接觸依相位演出;兩者交會時重疊 0.06(96 個取樣中 15 個)" },
  ],
};
