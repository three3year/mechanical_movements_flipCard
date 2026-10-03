// 第 302 種:擺輪式擒縱。D 是擒縱輪(冠狀輪,從側面看是一條上緣帶齒的輪緣),下方是它軸上的小齒輪;
// C 是擺輪:一根兩端裝球的擺桿,和叉瓦 A、B 一起裝在水平的立軸上,跨在冠狀輪上方。
// 擺輪來回擺動,叉瓦 A、B 輪流擋住、放開冠狀輪前後兩側的齒,冠狀輪每擺一次轉過半個齒。主動件是擺輪。
// 推斷:齒數與擺幅(與第 299 種的立軸擒縱相同的作法)。
import { Y, TAU, deg, swing } from "./kit.js";
import { escapeStep, sawCrown } from "./escapement.js";
import { shape, thickLine, circle } from "./shapes.js";

export const N = 15;
export const PITCH = TAU / N;
export const SWING = deg(20);
const R = 1.9;
const RIM = 0.4;
const TOOTH = 0.35;
const STAFF_Y = RIM / 2 + TOOTH + 0.3; // 立軸(C)離冠狀輪中心的高度
const ARM = 2.3;

/** 擺輪累計擺動 v → 擺輪角、冠狀輪轉角 */
export function balance(v) {
  return { angle: swing(v, -SWING, SWING) + deg(-55), crown: escapeStep(v, -SWING, SWING, PITCH / 2, 0.5) };
}

const flag = (a) => shape(thickLine([[0, 0], [0.6 * Math.cos(a), 0.6 * Math.sin(a)]], 0.16));

export default {
  figure: 302,
  parts: [
    {
      id: "crownD",
      kind: "group",
      axis: Y,
      spin: R,
      spinOffset: -RIM / 2,
      label: "D",
      labelOffset: [-1.2, 0.3, 1.0],
      pieces: [
        { kind: "cylinder", radius: R, inner: R - 0.1, length: RIM },
        { kind: "plate", shape: shape(circle(R - 0.05), [circle(0.1).reverse()]), thickness: 0.08, at: [0, 0, -RIM / 2 + 0.04] },
        ...sawCrown({ teeth: N, radius: R - 0.03, height: TOOTH, base: RIM / 2, thick: 0.08 }),
        { kind: "cylinder", radius: 0.07, length: 2.6, at: [0, 0, -1.4] },
        { kind: "gear", teeth: 10, radius: 0.32, width: 0.4, at: [0, 0, -2.35] },
      ],
    },
    {
      id: "balanceC",
      kind: "group",
      center: [0, STAFF_Y, 0],
      label: "C",
      labelOffset: [0.25, 0.3, R + 0.5],
      spin: 0.3,
      pieces: [
        { kind: "cylinder", radius: 0.06, length: 2 * R + 0.6 },
        { kind: "cylinder", radius: 0.14, inner: 0.06, length: 0.16, at: [0, 0, R + 0.25] },
        // 擺桿與兩個球
        { kind: "plate", shape: shape(thickLine([[-ARM, 0], [ARM, 0]], 0.1)), thickness: 0.08, at: [0, 0, R + 0.45] },
        { kind: "sphere", radius: 0.42, at: [ARM, 0, R + 0.45] },
        { kind: "sphere", radius: 0.42, at: [-ARM, 0, R + 0.45], accent: true },
        // 叉瓦 A(前)、B(後)
        { kind: "plate", shape: flag(deg(-35)), thickness: 0.1, at: [0, 0, R - 0.05] },
        { kind: "plate", shape: flag(deg(-125)), thickness: 0.1, at: [0, 0, -R + 0.05] },
      ],
    },
    { id: "labelA", kind: "group", center: [0.45, STAFF_Y - 0.3, R], label: "A", labelOffset: [0.2, 0, 0.3] },
    { id: "labelB", kind: "group", center: [-0.45, STAFF_Y - 0.3, -R], label: "B", labelOffset: [-0.2, 0, 0.3] },
  ],
  driver: { part: "balanceC", type: "rotation", cycle: [-SWING, SWING] },
  view: { direction: [0.08, 0.15, 1] },
  pose(v) {
    const b = balance(v);
    return { parts: { balanceC: { angle: b.angle }, crownD: { angle: b.crown } }, readouts: [] };
  },
};
