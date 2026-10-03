// 第 506 種:另一種周轉輪系,第一個輪與最後一個輪都不固定。m、n 是一根軸,承載輪系的臂 k、l 牢牢固定在上面;臂上承載著
// 兩個互相固定、在臂上轉的輪 d、e。輪 b 與 c 結合在一起,一同在軸 m、n 上自由轉;f 與 g 也固定在一起,一同在軸上自由轉。
// c、d、e、f 構成一個周轉輪系,c 是第一個輪,f 是最後一個輪。軸 A 是主動軸,上面牢牢固定著 a 與 h:a 咬 b,把運動傳給
// 周轉輪系的第一個輪 c;h 帶動 g,把運動傳給最後一個輪 f。這樣傳給輪系兩端的運動,產生臂 k、l 與軸 m、n 的合成運動。
// 這個輪系可以改:把 g 與 f 分開,g 固定在軸 m、n 上,f 只在軸上鬆轉;A 照樣經 a、b 帶動 c,同時經 h 使 g、軸 m、n 與臂 k、l
// 轉動,合成的轉動就傳給鬆的 f。
// 主動件是軸 A(左邊的手柄);狀態按鈕切換原來的接法與改過的接法。
// 推斷:齒數 a 20、b 40、h 21、g 40(兩端的速度略有不同,臂便慢慢轉);c、f 一樣大,d、e 是同一個行星;
// a 與 h 從左邊咬 b(下)與 g(上),所以 b、g 轉向相反。
import { X, Y } from "./kit.js";
import { armOf, lastWheel } from "./epicyclic.js";
import { planetRotation, planetSpin } from "./bevel-train.js";
import { shape, thickLine } from "./shapes.js";

export const TEETH = { a: 20, b: 40, h: 21, g: 40 };
export const E_CF = -1; // c → f(經 d、e)的輪系值:c、f 一樣大,方向相反
const RB = 0.85; // b、g
const RC = 0.45; // c、f
const RD = 0.35; // d、e
const Y_B = -0.85;
const Y_G = 0.85;

/** 主動軸 A 轉 a、接法 → b(c)、g、f 與臂(軸 m、n)的轉角 */
export function train(A, state = "original") {
  const c = (A * TEETH.a) / TEETH.b; // a 咬 b
  const g = (-A * TEETH.h) / TEETH.g; // h 從另一邊咬 g,方向相反
  if (state === "original") return { c, g, f: g, arm: armOf(c, g, E_CF) };
  // 改過的接法:g 固定在軸上,臂跟著 g 轉;f 是合成的結果
  return { c, g, arm: g, f: lastWheel(c, g, E_CF) };
}

export default {
  figure: 506,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.2, 3.2, 0.6], at: [-2.1, 0, 0] },
        { kind: "box", size: [2.4, 0.2, 0.6], at: [-1.0, 1.55, 0] },
        { kind: "box", size: [2.6, 0.2, 1.0], at: [-0.9, -1.7, 0] },
        { kind: "box", size: [0.4, 0.3, 0.4], at: [0, -1.45, 0] },
      ],
    },
    // 主動軸 A(水平,在左)與 a、h
    {
      id: "shaftA",
      kind: "group",
      axis: X,
      center: [-1.15, 0, 0],
      label: "A",
      labelOffset: [-1.0, 0.4, 0.3],
      spin: 0.9,
      pieces: [
        { kind: "cylinder", radius: 0.07, length: 2.0, at: [0, 0, -0.6] },
        { kind: "bevel", radius: RB * 0.5 + 0.2, height: 0.22, axis: [0, 0, 1], at: [0, 0, 0.15] },
        { kind: "box", size: [0.08, 0.5, 0.08], at: [0, -0.25, -1.55] },
        { kind: "cylinder", radius: 0.06, length: 0.3, axis: [1, 0, 0], at: [0.12, -0.5, -1.55], accent: true },
      ],
    },
    { id: "labela", kind: "group", pieces: [], label: "a", labelOffset: [-0.8, -0.6, 0.4] },
    { id: "labelh", kind: "group", pieces: [], label: "h", labelOffset: [-0.8, 0.6, 0.4] },
    { id: "wheelB", kind: "group", axis: Y, center: [0, Y_B, 0], label: "b", labelOffset: [0.6, -0.25, 0.4], spin: RB + 0.1, pieces: [{ kind: "bevel", radius: RB, height: 0.2, axis: [0, 0, 1] }, { kind: "bevel", radius: RC, height: 0.2, axis: [0, 0, 1], at: [0, 0, 0.45] }] },
    { id: "wheelG", kind: "group", axis: Y, center: [0, Y_G, 0], label: "g", labelOffset: [0.6, 0.25, 0.4], spin: RB + 0.1, pieces: [{ kind: "bevel", radius: RB, height: 0.2, axis: [0, 0, -1] }] },
    { id: "wheelF", kind: "group", axis: Y, center: [0, Y_G - 0.45, 0], label: "f", labelOffset: [-0.55, 0.05, 0.4], pieces: [{ kind: "bevel", radius: RC, height: 0.2, axis: [0, 0, -1] }] },
    { id: "labelc", kind: "group", pieces: [], label: "c", labelOffset: [-0.55, -0.35, 0.4] },
    // 軸 m、n 與臂 k、l,臂上的 d、e
    {
      id: "shaftMN",
      kind: "group",
      axis: Y,
      label: "m",
      labelOffset: [0.25, -1.4, 0.4],
      spin: 0.3,
      pieces: [
        { kind: "cylinder", radius: 0.07, length: 3.0 },
        { kind: "plate", shape: shape(thickLine([[-RC - 0.25, 0], [RC + 0.25, 0]], 0.08)), thickness: 0.08, rotation: [Math.SQRT1_2, 0, 0, Math.SQRT1_2] },
      ],
    },
    { id: "labeln", kind: "group", pieces: [], label: "n", labelOffset: [0.25, 1.4, 0.4] },
    { id: "labelk", kind: "group", pieces: [], label: "k", labelOffset: [0, 0.25, 0.5] },
    { id: "wheelD", kind: "bevel", radius: RD, height: 0.18, axis: [-1, 0, 0], label: "d", labelOffset: [0.35, 0.3, 0.3], arrow: false },
  ],
  states: {
    initial: "original",
    options: [
      { id: "original", label: "原來的接法(f、g 一起)" },
      { id: "modified", label: "改過的接法(g 固定在軸上)" },
    ],
  },
  driver: { part: "shaftA", type: "rotation", speed: 1.0 },
  target: "shaftMN", // 得到合成運動的臂 k、l 與軸 m、n
  view: { direction: [0.35, 0.3, 1] },
  pose(A, state = "original") {
    const t = train(A, state);
    const rotY = ([x, y, z], a) => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];
    return {
      parts: {
        shaftA: { angle: A },
        wheelB: { angle: t.c },
        wheelG: { angle: t.g },
        wheelF: { angle: t.f },
        shaftMN: { angle: t.arm },
        labelk: { position: rotY([RC + 0.3, 0, 0], t.arm) },
        wheelD: { position: rotY([RC + 0.05, 0, 0], t.arm), rotation: planetRotation(Y, t.arm, [-1, 0, 0], planetSpin(t.c - t.arm, RC, RD)) },
      },
      readouts: [
        { label: "臂 k、l 的轉速 / 軸 A", value: train(1, state).arm.toFixed(4) },
        ...(state === "modified" ? [{ label: "f 的轉速 / 軸 A", value: train(1, state).f.toFixed(4) }] : []),
      ],
    };
  },
};
