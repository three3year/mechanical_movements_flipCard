// 第 507 種:另一種周轉輪系,設計用來產生極慢的運動。m 是一根固定軸,上面鬆套著一根長套筒,套筒下端固定輪 D、上端固定輪 E;
// 長套筒上又套著一根較短的套筒,兩端是輪 A 與 H。輪 C 同時咬 D 與 A;承載輪系的臂 m、n 在軸上自由轉,在 n 處的凸柱上
// 承載著結合在一起的 F 與 G。若 A 10 齒、C 100 齒、D 10 齒、E 61 齒、F 49 齒、G 41 齒、H 51 齒,
// 則輪 C 每轉一圈,臂 m、n 就轉 25,000 圈(反過來,轉動臂時 C 轉得極慢)。
// 主動件是臂 m、n(在頂上);C 經側面的軸 a 轉得極慢。
// 推斷:C 是裝在橫軸 a 上的傘齒輪,從側面同時咬下面的 D 與上面的 A,所以 D、A 轉向相反——這樣原文的齒數正好得到 25,000;
// 畫面上 C 與 D、A 的大小不照齒數比例(否則 D、A 小到看不見)。
import { Y, X } from "./kit.js";
import { armOf, trainValue } from "./epicyclic.js";
import { shape, thickLine } from "./shapes.js";

export const TEETH = { A: 10, C: 100, D: 10, E: 61, F: 49, G: 41, H: 51 };
/** E → H(經臂上的 F、G)的輪系值 */
export const E_EH = trainValue([[TEETH.E, TEETH.F, -1], [TEETH.G, TEETH.H, -1]]);

/** C 轉 c → E(與 D 一起)、H(與 A 一起)的轉角與臂的轉角 */
export function slow(c) {
  const e = (c * TEETH.C) / TEETH.D; // D 與 E
  const h = (-c * TEETH.C) / TEETH.A; // A 與 H(從另一邊被咬,方向相反)
  return { e, h, arm: armOf(e, h, E_EH) };
}
/** 臂轉一圈時 C 的轉數 */
export const C_PER_ARM = 1 / slow(1).arm;

const R_E = 0.72;
const R_F = 1.3 - R_E;
const R_H = 0.72;
const R_G = 1.3 - R_H;

export default {
  figure: 507,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [3.0, 0.15, 1.2], at: [0.3, -2.1, 0] },
        { kind: "cylinder", radius: 0.07, length: 4.0, axis: Y, at: [0, -0.1, 0] },
        { kind: "box", size: [0.25, 1.6, 0.3], at: [1.25, -1.25, 0] },
      ],
    },
    // 長套筒:下端 D、上端 E
    { id: "sleeveDE", kind: "group", axis: Y, spin: R_E + 0.1, label: "E", labelOffset: [R_E + 0.25, 1.15, 0.3], arrow: false, pieces: [{ kind: "cylinder", radius: 0.12, length: 2.9, at: [0, 0, -0.25] }, { kind: "bevel", radius: 0.28, height: 0.18, axis: [0, 0, 1], at: [0, 0, -1.6] }, { kind: "gear", teeth: TEETH.E, radius: R_E, width: 0.1, at: [0, 0, 1.15] }] },
    { id: "labelD", kind: "group", pieces: [], label: "D", labelOffset: [-0.45, -1.6, 0.3] },
    // 短套筒:A、H
    { id: "sleeveAH", kind: "group", axis: Y, label: "H", labelOffset: [R_H + 0.25, 0.85, 0.3], arrow: false, pieces: [{ kind: "cylinder", radius: 0.18, length: 1.6, at: [0, 0, 0.1] }, { kind: "bevel", radius: 0.28, height: 0.18, axis: [0, 0, -1], at: [0, 0, -0.65] }, { kind: "gear", teeth: TEETH.H, radius: R_H, width: 0.1, at: [0, 0, 0.85] }] },
    { id: "labelA", kind: "group", pieces: [], label: "A", labelOffset: [-0.45, -0.65, 0.3] },
    // C:橫軸 a 上的傘齒輪,同時咬 D(下)與 A(上)
    { id: "wheelC", kind: "group", axis: X, center: [0.55, -1.12, 0], label: "C", labelOffset: [0.25, 0.75, 0.3], spin: 0.6, pieces: [{ kind: "bevel", radius: 0.5, height: 0.2, axis: [0, 0, -1] }, { kind: "cylinder", radius: 0.06, length: 0.9, at: [0, 0, 0.45] }] },
    { id: "labela", kind: "group", pieces: [], label: "a", labelOffset: [1.35, -0.85, 0.3] },
    // 臂 m、n 與凸柱上的 F、G
    { id: "arm", kind: "group", axis: Y, label: "m", labelOffset: [-0.2, 1.75, 0.3], spin: 1.5, pieces: [{ kind: "plate", shape: shape(thickLine([[-0.2, 0], [1.45, 0]], 0.14)), thickness: 0.08, rotation: [Math.SQRT1_2, 0, 0, Math.SQRT1_2], at: [0, 0, 1.6] }, { kind: "cylinder", radius: 0.05, length: 0.9, at: [1.3, 0, 1.2] }] },
    { id: "planetFG", kind: "group", axis: Y, label: "F", labelOffset: [0.7, 0.2, 0.3], arrow: false, pieces: [{ kind: "gear", teeth: TEETH.F, radius: R_F, width: 0.1, at: [0, 0, 0.3] }, { kind: "gear", teeth: TEETH.G, radius: R_G, width: 0.1, at: [0, 0, 0] }] },
    { id: "labelG", kind: "group", pieces: [], label: "G", labelOffset: [0, 0, 0.3] },
  ],
  waivers: [
    { check: "unsupported", parts: ["wheelC"], reason: "待確認(未修):wheelC 在動,但離帶動(或支撐)它的零件還有 0.24 的空隙,少了相連的軸、銷或連桿,尚未補上" },
  ],
  driver: { part: "arm", type: "rotation", speed: 0.8, initial: Math.PI }, // 起始時 F、G 在左邊(依原圖)
  target: "wheelC", // 轉得極慢的輪 C
  view: { direction: [0.3, 0.35, 1] },
  pose(arm) {
    // 轉動臂:C 轉 arm × C_PER_ARM(極慢),E、H 也很慢
    const s = slow(arm * C_PER_ARM);
    const rotY = ([x, y, z], a) => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];
    const n = rotY([1.3, 0, 0], arm);
    // F、G 相對臂的自轉:E 相對臂轉 (e − arm),F 轉 −(e − arm)·E/F
    const fg = arm - ((s.e - arm) * TEETH.E) / TEETH.F;
    return {
      parts: {
        arm: { angle: arm },
        planetFG: { position: [n[0], 0.85, n[2]], angle: fg },
        labelG: { position: [n[0], 0.85, n[2]] },
        sleeveDE: { angle: s.e },
        sleeveAH: { angle: s.h },
        wheelC: { angle: arm * C_PER_ARM },
      },
      readouts: [
        { label: "臂轉一圈,C 轉", value: `1 / ${Math.round(1 / Math.abs(C_PER_ARM)).toLocaleString()} 圈` },
        { label: "C 已轉過", value: `${((arm * C_PER_ARM * 180) / Math.PI * 3600).toFixed(1)} 角秒` },
      ],
    };
  },
};
