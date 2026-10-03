// 第 291 種:Arnold 的天文台計時器擒縱(自由式擒縱)。彈簧 A 的右端 b 鎖在錶板上,下側有小擋止 d,擒縱輪 B 的齒
// 依序抵在 d 上;A 上方的凸柱 i 握著一根更細的彈簧,穿過 A 左端的鉤 k 下方。擺輪軸上有小凸柱 a:
// 擺輪往箭頭方向擺時,a 把細彈簧往下壓過去(A 不動);擺回來時,a 把細彈簧連同 A 與擋止 d 一起抬起,
// 放走擒縱輪的一齒,落下的擋止立刻抓住下一齒;同時另一齒撞擊擺輪上凹槽 g 的側邊,補回擺輪損失的力。
// 擺輪每來回一次,擒縱輪轉過一齒。主動件是擺輪(累計擺動)。
// 推斷:擺幅、齒數(依原圖約十五齒)。
import { TAU, deg } from "./kit.js";
import { singleBeat } from "./escapement.js";
import { ratchetShape, shape, circle, rect, thickLine } from "./shapes.js";

export const N = 15;
export const PITCH = TAU / N;
export const SWING = deg(110);
const BAL = [-1.05, 1.05, 0.2]; // 擺輪的滾子
const WHEEL = [-0.15, -0.95, 0];
const B = [2.55, 1.0, 0]; // 彈簧 A 的固定端
const LIFT = deg(2.2); // A 被抬起的角度

/** 擺輪累計擺動 v → 擺輪角、A 被抬起的角度、擒縱輪轉角(順時針為負) */
export function chronometer(v) {
  // 回程(!forward)的中段,凸柱 a 抬起 A;隨後擒縱輪轉過一齒
  const { at, forward, f, turned } = singleBeat(v, -SWING, SWING, PITCH);
  const lift = forward ? 0 : LIFT * Math.max(0, 1 - Math.abs(f - 0.5) / 0.12);
  return { balance: at, lift, wheel: -turned };
}

const roller = shape(circle(0.55), [circle(0.08).reverse()]);

export default {
  figure: 291,
  parts: [
    {
      id: "wheelB",
      kind: "plate",
      center: WHEEL,
      shape: ratchetShape({ teeth: N, outer: 1.35, inner: 1.0, dir: -1, bore: 0.08 }),
      thickness: 0.12,
      circles: [0.85],
      mark: [0.75, 0],
      markSize: 0.06,
      spin: 1.35,
      label: "B",
      labelOffset: [0, -0.35, 0.3],
    },
    {
      id: "balance",
      kind: "group",
      center: BAL,
      spin: 0.55,
      label: "g",
      labelOffset: [0.15, -0.75, 0.3],
      pieces: [
        { kind: "plate", shape: roller, thickness: 0.12 },
        // 凹槽 g 與凸柱 a
        { kind: "plate", shape: shape(rect(0.2, 0.18, 0.5, 0)), thickness: 0.14, at: [0, 0, 0.0] },
        { kind: "cylinder", radius: 0.05, length: 0.4, at: [0, 0.42, 0.15], accent: true },
        { kind: "cylinder", radius: 0.07, length: 0.6 },
      ],
    },
    {
      id: "detentA",
      kind: "group",
      center: B,
      arrow: false,
      label: "A",
      labelOffset: [-1.3, -0.3, 0.3],
      pieces: [
        { kind: "box", size: [0.32, 0.32, 0.3] },
        { kind: "plate", shape: shape(thickLine([[0, -0.05], [-2.9, -0.12]], 0.05)), thickness: 0.1 },
        { kind: "plate", shape: shape(thickLine([[-2.9, -0.12], [-3.0, -0.02], [-2.95, 0.08]], 0.04)), thickness: 0.1 },
        // 擋止 d(下側)與凸柱 i、細彈簧(上側)
        { kind: "box", size: [0.1, 0.18, 0.12], at: [-2.2, -0.24, 0] },
        { kind: "box", size: [0.12, 0.25, 0.12], at: [-0.95, 0.06, 0] },
        { kind: "plate", shape: shape(thickLine([[-0.95, 0.15], [-3.05, 0.0]], 0.025)), thickness: 0.06 },
      ],
    },
    { id: "labelB", kind: "group", center: B, label: "b", labelOffset: [0.3, 0.3, 0.3] },
    { id: "labelK", kind: "group", center: [B[0] - 2.95, B[1], 0], label: "k", labelOffset: [0.05, 0.3, 0.3] },
    { id: "labelD", kind: "group", center: [B[0] - 2.2, B[1] - 0.3, 0], label: "d", labelOffset: [0.25, -0.1, 0.3] },
    { id: "labelI", kind: "group", center: [B[0] - 0.95, B[1] + 0.2, 0], label: "i", labelOffset: [0, 0.25, 0.3] },
    { id: "labelA2", kind: "group", center: BAL, label: "a", labelOffset: [-0.25, 0.65, 0.3] },
  ],
  waivers: [
    { check: "unsupported", parts: ["balance"], reason: "待確認:balance 與帶動(或支撐)它的零件之間差 0.08 沒貼上,接觸位置是算出來的近似,未逐一修正" },
    { check: "unsupported", parts: ["wheelB"], reason: "待確認(未修):wheelB 在動,但離帶動(或支撐)它的零件還有 0.25 的空隙,少了相連的軸、銷或連桿,尚未補上" },
    { check: "unsupported", parts: ["detentA"], reason: "待確認:detentA 與帶動(或支撐)它的零件之間差 0.08 沒貼上,接觸位置是算出來的近似,未逐一修正" },
  ],
  driver: { part: "balance", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheelB", // 擒縱輪
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const c = chronometer(v);
    return { parts: { balance: { angle: c.balance }, detentA: { angle: -c.lift }, wheelB: { angle: c.wheel } }, readouts: [] };
  },
};
