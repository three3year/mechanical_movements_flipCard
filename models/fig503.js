// 第 503 種:一種非常簡單的周轉輪系。F、G 是固定在中央軸 A 上的臂,傘齒輪 C、D 鬆套在中央軸上;臂做成傘齒輪 B 的軸,B 在上面
// 自由轉動。可以把運動加在 C、D 兩個輪上,產生臂的合成運動;或者把運動加在臂與其中一個輪上,產生另一個輪的合成運動。
// 主動件是傘齒輪 C;狀態按鈕選擇 D 怎麼轉(固定、與 C 反向同速、與 C 同向同速)。
// 推斷:C、D 一樣大,所以臂(軸 A)的轉角 = (C + D) / 2;軸 A 直立,C 在下、D 在上,B 在右邊的臂上。
import { Y } from "./kit.js";
import { armOf } from "./epicyclic.js";
import { planetRotation, planetSpin } from "./bevel-train.js";
import { shape, thickLine } from "./shapes.js";

const R = 0.85; // C、D
const RB = 0.5; // B
const H = 0.25;
export const E_CD = -1; // C → D 的輪系值(以臂為參考)
const D_RATE = { fixed: 0, opposite: -1, same: 1 };

/** C 轉 c、狀態 → D 與臂(軸 A)的轉角 */
export function differential(c, state = "fixed") {
  const d = D_RATE[state] * c;
  return { c, d, arm: armOf(c, d, E_CD) };
}

export default {
  figure: 503,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [3.2, 0.15, 1.2], at: [0, -1.75, 0] },
        { kind: "box", size: [0.3, 0.25, 0.3], at: [0, 1.62, 0] },
        { kind: "box", size: [0.3, 0.25, 0.3], at: [0, -1.55, 0] },
      ],
    },
    {
      id: "shaftA",
      kind: "group",
      axis: Y,
      label: "A",
      labelOffset: [-0.3, 1.45, 0.3],
      spin: 0.35,
      pieces: [
        { kind: "cylinder", radius: 0.09, length: 3.3 },
        { kind: "box", size: [0.05, 0.05, 0.6], at: [0.09, 0, 1.2], accent: true }, // 軸上的鍵條(記號)
        // 臂 F、G:從軸伸到 B 的軸
        { kind: "plate", shape: shape(thickLine([[0, 0.12], [R * 0.9 + 0.35, 0.12]], 0.12)), thickness: 0.08, rotation: [Math.SQRT1_2, 0, 0, Math.SQRT1_2] },
      ],
    },
    { id: "labelF", kind: "group", pieces: [], label: "F", labelOffset: [0.35, 0.3, 0.3] },
    { id: "labelG", kind: "group", pieces: [], label: "G", labelOffset: [R + 0.55, 0.0, 0.3] },
    { id: "wheelC", kind: "bevel", center: [0, -R * 0.55, 0], axis: [0, 1, 0], radius: R, height: H, label: "C", labelOffset: [-R - 0.2, -0.3, 0.3] },
    { id: "wheelD", kind: "bevel", center: [0, R * 0.55, 0], axis: [0, -1, 0], radius: R, height: H, label: "D", labelOffset: [-R - 0.2, 0.3, 0.3] },
    { id: "wheelB", kind: "bevel", center: [R * 0.9, 0, 0], axis: [-1, 0, 0], radius: RB, height: H, label: "B", labelOffset: [0.4, 0.55, 0.3], arrow: false },
  ],
  states: {
    initial: "fixed",
    options: [
      { id: "fixed", label: "D 固定" },
      { id: "opposite", label: "D 與 C 反向同速" },
      { id: "same", label: "D 與 C 同向同速" },
    ],
  },
  driver: { part: "wheelC", type: "rotation", speed: 0.5 },
  target: "shaftA", // 得到合成運動的臂(軸 A)
  view: { direction: [0.3, 0.35, 1] },
  pose(c, state = "fixed") {
    const t = differential(c, state);
    const spin = planetSpin(t.c - t.arm, R, RB);
    const rotY = ([x, y, z], a) => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];
    return {
      parts: {
        wheelC: { angle: t.c },
        wheelD: { angle: -t.d },
        shaftA: { angle: t.arm },
        wheelB: { position: rotY([R * 0.9, 0, 0], t.arm), rotation: planetRotation(Y, t.arm, [-1, 0, 0], spin) },
      },
      readouts: [{ label: "臂(軸 A)的轉速 / C", value: differential(1, state).arm.toFixed(2) }],
    };
  },
};
