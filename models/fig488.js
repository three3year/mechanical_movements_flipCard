// 第 488 種:螺旋槳。槳葉是螺紋的片段,在水中旋轉的效果與螺絲在螺帽中一樣,沿軸的方向產生運動,推進船隻。
// 主動件是槳軸(由引擎轉動,讀者直接抓軸轉)。
// 推斷:兩片槳葉,各斜一個螺距角;軸沿左右方向;槳轉動時把水往右推,船往左(軸的方向)前進。
import { X, deg, quatAxisAngle, quatMul } from "./kit.js";
import { stream } from "./flow.js";
import { shape } from "./shapes.js";

export const PITCH_ANGLE = deg(35); // 槳葉相對旋轉平面的斜角
const BLADE = shape([[0.12, -0.18], [0.7, -0.4], [1.3, -0.42], [1.75, -0.25], [1.85, 0.05], [1.6, 0.3], [1.0, 0.32], [0.4, 0.2], [0.12, 0.12]]);

export default {
  figure: 488,
  parts: [
    // 船尾的軸承與撐著它的支架(推斷;原圖只畫出槳與軸)
    { id: "hull", kind: "group", pieces: [{ kind: "cylinder", radius: 0.2, inner: 0.13, length: 0.5, axis: [1, 0, 0], at: [-1.0, 0, 0] }, { kind: "box", size: [0.4, 1.0, 0.12], at: [-1.0, 0.7, 0] }] },
    {
      id: "shaft",
      kind: "group",
      axis: X,
      spin: 2.0,
      pieces: [
        { kind: "cylinder", radius: 0.12, length: 3.2, at: [0, 0, 0.2] },
        { kind: "box", size: [0.06, 0.06, 2.2], at: [0.12, 0, 0.75], accent: true }, // 軸上的鍵條(記號)
        { kind: "cylinder", radius: 0.22, length: 0.5 },
        { kind: "cylinder", radius: 0.2, length: 0.12, at: [0, 0, 1.6] },
      ],
    },
    // 兩片槳葉(固定在軸上、跟著軸轉;獨立成一個零件當目標件):在旋轉平面(局部 xy)上,各繞自己的長邊斜 PITCH_ANGLE
    {
      id: "blades",
      kind: "group",
      axis: X,
      arrow: false,
      pieces: [
        ...[0, 1].map((k) => ({ kind: "plate", shape: BLADE, thickness: 0.05, rotation: quatMul(quatAxisAngle([0, 0, 1], k * Math.PI + Math.PI / 2), quatAxisAngle([1, 0, 0], PITCH_ANGLE)), ...(k === 0 ? { mark: [1.3, 0] } : {}) })),
      ],
    },
  ],
  driver: { part: "shaft", type: "rotation", speed: 1.0 },
  target: "blades", // 槳軸就是主動件;標把水往後推、沿軸向產生推力的槳葉
  view: { direction: [0.3, 0.2, 1] },
  pose(theta) {
    // 槳每轉一圈把水往右推一個螺距(示意)
    const wash = [-0.6, 0, 0.6].flatMap((y) => [-0.5, 0.5].flatMap((z) => stream([[-2.4, y, z], [2.4, y, z]], theta * 0.4, { spacing: 0.4 })));
    return {
      parts: { shaft: { angle: theta }, blades: { angle: theta } },
      flows: [{ fluid: "water", points: wash }],
      readouts: [{ label: "推力", value: "沿軸向左(水被推向右)" }],
    };
  },
};

