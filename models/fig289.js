// 第 289 種:靜止式(靜擊式)擒縱(時鐘)。與第 288 種相同的部件:錨形件 L 繞軸 a 振動,兩端叉瓦夾著擒縱輪 A。
// 叉瓦的鎖面切成與軸 a 同心的曲線,所以齒抵住叉瓦的期間輪完全靜止,只有齒滑過衝擊面 c、e 與 d、b 時才前進。
// 輪依原圖箭頭轉,擺每擺一次放走半個齒。主動件是錨形件(擺)。
// 推斷:擺幅。
import { TAU, deg, swing } from "./kit.js";
import { escapeStep, escapeWheelPieces } from "./escapement.js";
import { shape, thickLine, circle, arcPoints } from "./shapes.js";

export const N = 30;
export const PITCH = TAU / N;
export const SWING = deg(5);
const A = [0, -0.55, 0];
const AXIS = [0, 2.0, 0];

/** 錨形件累計擺動 v → 擒縱輪轉角(順時針為負;鎖住期間不動) */
export const wheelAngle = (v) => -escapeStep(v, -SWING, SWING, PITCH / 2, 0.55);

// 錨形件(相對軸 a):直桿 L 往下,接一道圍著擒縱輪的弧形臂,兩端是叉瓦
const R_ARM = 1.4; // 弧形臂(在輪的前方)中心線到輪心的距離
const arc = arcPoints(R_ARM, deg(200), deg(-20)).map(([x, y]) => [x + A[0] - AXIS[0], y + A[1] - AXIS[1]]);
const STEM = A[1] + R_ARM - AXIS[1]; // 直桿下端(弧形臂頂)
const anchor = shape(thickLine([[0, 0], [0, STEM], ...arc.slice(Math.floor(arc.length / 2) + 1)], 0.26), [circle(0.1).reverse()]);
const anchorLeft = shape(thickLine([[0, STEM], ...arc.slice(0, Math.floor(arc.length / 2)).reverse()], 0.26));
const pallet = (s) => {
  const end = s < 0 ? arc[0] : arc[arc.length - 1];
  return shape([[end[0] - 0.12, end[1] + 0.05], [end[0] + 0.12, end[1] + 0.05], [end[0] + s * 0.32, end[1] - 0.3], [end[0] + s * 0.1, end[1] - 0.28]].map(([x, y]) => [x - s * 0.15, y]));
};

export default {
  figure: 289,
  parts: [
    { id: "wheelA", kind: "group", center: A, spin: 1.5, label: "A", labelOffset: [0, 0.35, 0.3], pieces: [...escapeWheelPieces({ teeth: N, outer: 1.5, inner: 1.27, dir: -1, rim: 0.1 }), { kind: "box", size: [0.12, 0.12, 0.14], at: [1.08, 0, 0.08], accent: true }] },
    {
      id: "anchor",
      kind: "group",
      center: AXIS,
      arrow: false,
      label: "L",
      labelOffset: [-0.3, -0.5, 0.3],
      pieces: [
        { kind: "plate", shape: anchor, thickness: 0.12, at: [0, 0, 0.22] },
        { kind: "plate", shape: anchorLeft, thickness: 0.12, at: [0, 0, 0.22] },
        { kind: "plate", shape: pallet(-1), thickness: 0.3, at: [0, 0, 0.12] },
        { kind: "plate", shape: pallet(1), thickness: 0.3, at: [0, 0, 0.12] },
        { kind: "cylinder", radius: 0.2, inner: 0.09, length: 0.3 },
      ],
    },
    { id: "labelA", kind: "group", center: AXIS, label: "a", labelOffset: [0.4, 0.1, 0.4] },
  ],
  driver: { part: "anchor", type: "rotation", cycle: [-SWING, SWING] },
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    return { parts: { anchor: { angle: swing(v, -SWING, SWING) }, wheelA: { angle: wheelAngle(v) } }, readouts: [] };
  },
};
