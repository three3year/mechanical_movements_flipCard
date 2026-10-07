// 第 151 種:把連續的圓周運動轉換為連續但慢得多的直線運動。上方的蝸桿軸(與紙面垂直)帶動螺桿軸中央的蝸輪;
// 螺桿軸左段是右旋螺紋、右段是左旋螺紋,兩個螺帽(端頭的方塊,只能滑動不能轉)依轉向彼此靠近或分開。
// 蝸桿每轉一圈蝸輪轉一齒,螺帽每次只移動一小段。主動件是蝸桿軸(在可移動的範圍內往返)。
import { X, Z, TAU, screwAdvance } from "./kit.js";
import { pedestal, pedestalX } from "./supports.js";
// 支撐(推斷,原圖只畫出蝸桿、螺桿與螺帽):螺桿兩端架在軸承座上,蝸桿軸往後伸進軸承座;
// 兩個螺帽的底面擱在一根固定的導軌上,所以不會跟著螺桿轉,只能沿軸移動。

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
      pieces: [{ kind: "cylinder", radius: 0.1, length: 2.6, at: [0, 0, -0.3] }], // 軸:往後伸進軸承座(在蝸輪後面)
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
    {
      id: "frame",
      kind: "group",
      pieces: [
        ...pedestalX({ x: -3.3, y: 0, z: 0, bore: 0.16, floor: -0.9 }),
        ...pedestalX({ x: 3.3, y: 0, z: 0, bore: 0.16, floor: -0.9 }),
        // 螺帽的導軌(左右各一段,中間讓開蝸輪)
        { kind: "box", size: [2.55, 0.1, 0.5], at: [-1.875, -0.375, 0] },
        { kind: "box", size: [2.55, 0.1, 0.5], at: [1.875, -0.375, 0] },
        ...pedestal({ at: [0, 1.15], z: -1.35, bore: 0.1, floor: -0.9 }),
      ],
    },
  ],
  driver: { part: "worm", type: "rotation", range: [0, TURNS * TAU] },
  targets: ["nutLeft", "nutRight"], // 兩個螺帽彼此靠近或分開
  view: { direction: [0.06, 0.08, 1] },
  pose(theta) {
    const { screw, left, right } = nuts(theta);
    return {
      parts: { worm: { angle: theta }, screw: { angle: screw }, nutLeft: { position: [left, 0, 0] }, nutRight: { position: [right, 0, 0] } },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["worm", "screw"], reason: "簡化齒形:蝸桿螺紋是圓管、蝸輪以分層錯齒近似斜齒,齒頂伸進螺紋 0.07;實物的蝸輪齒是凹弧形包著蝸桿" },
  ],
};
