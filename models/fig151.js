// 第 151 種:把連續的圓周運動轉換為連續但慢得多的直線運動。上方的蝸桿軸(與紙面垂直)帶動螺桿軸中央的蝸輪;
// 螺桿軸左段是右旋螺紋、右段是左旋螺紋,兩個螺帽(端頭的方塊,只能滑動不能轉)依轉向彼此靠近或分開。
// 蝸桿每轉一圈蝸輪轉一齒,螺帽每次只移動一小段。主動件是蝸桿軸(在可移動的範圍內往返)。
import { X, Z, TAU, screwAdvance } from "./kit.js";

const N = 30; // 蝸輪齒數
const PITCH = 0.3; // 螺紋的螺距
const X0 = 2.6; // 螺帽離中心的起始距離
const TURNS = N * 4; // 蝸桿可轉的圈數(螺桿轉 4 圈)

/** 蝸桿轉 theta:螺桿(蝸輪)的轉角與兩螺帽的位置 */
export function nuts(theta) {
  const screw = theta / N;
  const d = screwAdvance(screw, PITCH);
  return { screw, left: -X0 + d, right: X0 - d };
}
export const reduction = N;

export default {
  figure: 151,
  parts: [
    {
      id: "worm",
      kind: "worm",
      axis: Z,
      center: [0, 1.15, 0],
      radius: 0.32,
      length: 1.0,
      pitch: (TAU * 0.85) / N,
      thread: 0.08,
      pieces: [{ kind: "cylinder", radius: 0.1, length: 2.0 }],
    },
    {
      id: "screw",
      kind: "group",
      axis: X,
      spin: 0.85,
      pieces: [
        { kind: "gear", teeth: N, radius: 0.85, width: 0.4, web: false, slices: 5, twist: 0.12 },
        { kind: "worm", radius: 0.22, length: 2.4, pitch: PITCH, thread: 0.06, hand: 1, at: [0, 0, -1.95] },
        { kind: "worm", radius: 0.22, length: 2.4, pitch: PITCH, thread: 0.06, hand: -1, at: [0, 0, 1.95] },
        { kind: "cylinder", radius: 0.16, length: 7.0 },
      ],
    },
    { id: "nutLeft", kind: "box", center: [-X0, 0, 0], size: [0.55, 0.65, 0.65] },
    { id: "nutRight", kind: "box", center: [X0, 0, 0], size: [0.55, 0.65, 0.65] },
  ],
  driver: { part: "worm", type: "rotation", range: [0, TURNS * TAU] },
  view: { direction: [0.06, 0.08, 1] },
  pose(theta) {
    const { screw, left, right } = nuts(theta);
    return {
      parts: { worm: { angle: theta }, screw: { angle: screw }, nutLeft: { position: [left, 0, 0] }, nutRight: { position: [right, 0, 0] } },
      readouts: [],
    };
  },
};
