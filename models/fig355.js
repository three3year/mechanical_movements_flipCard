// 第 355 種:陀螺儀(rotascope)。金屬碟片 C 的心軸裝在環 A 的軸承裡;讓碟片繞自己的軸高速旋轉,再把環 A 一側的
// 樞軸 F 放在立柱 G 頂端的軸承上,碟片與環好像不受重力,不會掉下來,反而繞著鉛直軸轉起來(進動)。
// 主動件是虛擬的「進程」:進動轉過的圈數;碟片的自轉以固定倍數跟著進程(運動學描述,不模擬角動量)。
// 推斷:進動與自轉的轉速比。
import { X, Y, Z, TAU, quatMul, quatAxisAngle, quatFromZ } from "./kit.js";
import { shape, circle, thickLine } from "./shapes.js";

const F = [-1.3, 0.75, 0]; // 樞軸 F(立柱 G 頂端)
const ARM = 1.55; // F 到碟片中心
export const SPIN_PER_TURN = 24; // 進動一圈,碟片自轉的圈數
const R = 1.05;

/** 進程 p → 進動角、碟片中心、碟片的自轉角 */
export function gyro(p) {
  const phi = TAU * p;
  const center = [F[0] + ARM * Math.cos(phi), F[1], -ARM * Math.sin(phi)];
  return { phi, center, spin: SPIN_PER_TURN * phi };
}

// 環 A 與 F 臂(局部座標:F 在原點,碟片軸沿 +x)
const ringA = [
  { kind: "cylinder", axis: Y, radius: 1.3, inner: 1.2, length: 0.12, at: [ARM, 0, 0] },
  { kind: "cylinder", axis: X, radius: 0.12, length: 0.3, at: [ARM - 1.25, 0, 0] },
  { kind: "cylinder", axis: X, radius: 0.12, length: 0.3, at: [ARM + 1.25, 0, 0] },
  { kind: "plate", shape: shape(thickLine([[0, 0.05], [0.12, 0.25], [0.3, 0.25]], 0.08)), thickness: 0.08 },
  { kind: "sphere", radius: 0.09 },
];

export default {
  figure: 355,
  parts: [
    {
      id: "postG",
      kind: "group",
      label: "G",
      labelOffset: [0.3, -0.9, 0.2],
      pieces: [
        { kind: "cylinder", axis: Y, radius: 0.09, length: 2.6, at: [F[0], F[1] - 1.35, 0] },
        { kind: "lathe", axis: Y, profile: [[0, 0], [0.9, 0], [0.75, 0.3], [0.2, 0.45], [0, 0.45]], at: [F[0], F[1] - 3.0, 0] },
      ],
    },
    { id: "ringA", kind: "group", center: F, arrow: false, label: "A", labelOffset: [ARM + 1.45, 0.2, 0], pieces: ringA },
    {
      id: "diskC",
      kind: "group",
      spin: R,
      label: "C",
      labelOffset: [0, 0, 0],
      pieces: [
        { kind: "lathe", profile: [[0, -0.12], [R, -0.12], [R, 0.12], [0, 0.12]] },
        { kind: "cylinder", radius: 0.05, length: 2.6 },
        { kind: "cylinder", radius: 0.2, length: 0.5 },
        { kind: "box", size: [0.2, 0.2, 0.26], at: [R - 0.2, 0, 0], accent: true },
      ],
    },
    { id: "labelF", kind: "group", center: F, label: "F", labelOffset: [-0.2, 0.35, 0] },
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.08 },
  target: "diskC", // 高速自轉、帶著環繞鉛直軸進動的碟片 C
  view: { direction: [0.9, 0.35, 0.7] },
  pose(p) {
    const g = gyro(p);
    const q = quatAxisAngle(Y, g.phi);
    // 碟片:軸沿 F→碟片中心的方向(水平),隨進動轉,再繞自己的軸自轉
    const disk = quatMul(q, quatMul(quatFromZ(X), quatAxisAngle(Z, g.spin)));
    return { parts: { ringA: { rotation: q }, diskC: { position: g.center, rotation: disk } }, readouts: [] };
  },
};
