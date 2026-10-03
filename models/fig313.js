// 第 313 種:天文台計時器擒縱(現今常見的作法)。擒縱輪的齒由止動器(detent,沿右邊直立的彈簧,下端 D 固定)
// 上的鎖石擋住。擺輪朝箭頭方向轉時,軸上的齒 V 把通過彈簧往左按,連帶把止動器推開,放走擒縱輪的一齒,
// 擒縱輪的齒隨即推擺輪上的衝擊叉瓦;擺輪返回時,齒 V 只把通過彈簧推開而通過,不動止動器,止動器靠在擋止 E、P 上。
// 擺輪每來回一次,擒縱輪轉過一齒。主動件是擺輪(累計擺動)。
// 推斷:齒數與擺幅;止動器被推開的角度。
import { TAU, deg } from "./kit.js";
import { singleBeat } from "./escapement.js";
import { ratchetShape, shape, circle, thickLine } from "./shapes.js";

export const N = 15;
export const PITCH = TAU / N;
export const SWING = deg(110);
const WHEEL = [-0.65, -0.35, 0];
const BAL = [1.35, 1.5, 0.15];
const D = [1.3, -2.1, 0]; // 止動器下端的固定處
const PUSH = deg(2.5);

/** 擺輪累計擺動 v → 擺輪角、止動器被推開的角度、擒縱輪轉角 */
export function chronometer(v) {
  // 擺輪往箭頭方向(往 from)擺的那一程,中段推開止動器、擒縱輪轉一齒
  const { at, forward, f, turned } = singleBeat(v, -SWING, SWING, PITCH);
  const detent = forward ? 0 : PUSH * Math.max(0, 1 - Math.abs(f - 0.5) / 0.12);
  return { balance: at, detent, wheel: -turned };
}

export default {
  figure: 313,
  parts: [
    {
      id: "wheel",
      kind: "group",
      center: WHEEL,
      spin: 1.75,
      pieces: [
        { kind: "plate", shape: { ...ratchetShape({ teeth: N, outer: 1.75, inner: 1.4, dir: -1 }), holes: [circle(1.22).reverse()] }, thickness: 0.12 },
        { kind: "box", size: [2.5, 0.12, 0.08] },
        { kind: "box", size: [0.12, 2.5, 0.08] },
        { kind: "cylinder", radius: 0.14, length: 0.25 },
        { kind: "box", size: [0.14, 0.14, 0.14], at: [1.3, 0, 0.08], accent: true },
      ],
    },
    {
      id: "balance",
      kind: "group",
      center: BAL,
      spin: 0.75,
      label: "V",
      labelOffset: [0.25, 0.05, 0.3],
      pieces: [
        { kind: "plate", shape: shape(circle(0.75), [circle(0.08).reverse()]), thickness: 0.1 },
        // 衝擊叉瓦與齒 V
        { kind: "box", size: [0.16, 0.3, 0.14], at: [-0.75, 0, 0.06], accent: true },
        { kind: "box", size: [0.25, 0.08, 0.1], at: [-0.12, -0.3, 0.12] },
        { kind: "cylinder", radius: 0.07, length: 0.6 },
      ],
    },
    {
      id: "detent",
      kind: "group",
      center: D,
      arrow: false,
      label: "D",
      labelOffset: [0.3, 0.1, 0.3],
      pieces: [
        { kind: "box", size: [0.28, 0.3, 0.3] },
        { kind: "plate", shape: shape(thickLine([[0, 0.1], [-0.05, 2.9], [-0.25, 3.35]], 0.06)), thickness: 0.08 },
        // 鎖石(擋住擒縱輪的齒)與通過彈簧
        { kind: "box", size: [0.2, 0.12, 0.12], at: [-0.15, 2.05, 0.04] },
        { kind: "plate", shape: shape(thickLine([[0.03, 1.2], [0.05, 3.15], [-0.2, 3.45]], 0.025)), thickness: 0.05, at: [0, 0, 0.08] },
      ],
    },
    { id: "stopE", kind: "group", center: [D[0] + 0.25, D[1] + 2.0, 0], label: "E", labelOffset: [0.3, 0, 0.3], pieces: [{ kind: "box", size: [0.15, 0.25, 0.25] }] },
    { id: "labelP", kind: "group", center: [D[0] + 0.25, D[1] + 0.5, 0], label: "P", labelOffset: [0.3, 0, 0.3] },
  ],
  driver: { part: "balance", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheel", // 擒縱輪
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const c = chronometer(v);
    return { parts: { balance: { angle: c.balance }, detent: { angle: c.detent }, wheel: { angle: c.wheel } }, readouts: [] };
  },
};
