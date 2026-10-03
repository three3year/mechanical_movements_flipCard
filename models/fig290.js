// 第 290 種:另一種擺式擒縱。擒縱輪 D 在一個圓環形框架的中間;框架從上端 C 吊著,下端 K 接著擺,
// 環的內側左右各有一個叉瓦 B、A。框架隨擺左右擺動,兩個叉瓦輪流擋住、放開輪的齒(E、H 是其中兩個齒),
// 擺每擺一次,輪轉過半個齒。主動件是框架(擺)。
// 推斷:輪的轉向與齒數(依原圖七齒);擺幅。
import { TAU, deg, swing } from "./kit.js";
import { escapeStep } from "./escapement.js";
import { ratchetShape, shape, circle, rect } from "./shapes.js";

export const N = 7;
export const PITCH = TAU / N;
export const SWING = deg(5);
const C = [0, 2.3, 0];

/** 框架累計擺動 v → 擒縱輪轉角(逆時針為正) */
export const wheelAngle = (v) => escapeStep(v, -SWING, SWING, PITCH / 2, 0.5);

// 框架(相對 C):直桿往下到圓環,圓環內左右兩個叉瓦,再往下接擺桿
const RING = { y: -2.3, outer: 1.2, inner: 1.03 };
const frame = [
  { kind: "plate", shape: shape(circle(RING.outer), [circle(RING.inner).reverse()]), thickness: 0.14, at: [0, RING.y, 0] },
  { kind: "plate", shape: shape(rect(0.14, 1.12, 0, -0.56)), thickness: 0.14 },
  { kind: "plate", shape: shape(rect(0.14, 1.5, 0, RING.y - RING.outer - 0.75)), thickness: 0.14 },
  // 叉瓦 A(右)、B(左):從環內緣往內伸的方塊
  { kind: "plate", shape: shape(rect(0.42, 0.3, 0.84, RING.y + 0.12)), thickness: 0.2 },
  { kind: "plate", shape: shape(rect(0.42, 0.3, -0.84, RING.y - 0.12)), thickness: 0.2 },
  { kind: "cylinder", radius: 0.12, inner: 0.05, length: 0.3 },
];

export default {
  figure: 290,
  parts: [
    { id: "wheelD", kind: "plate", shape: ratchetShape({ teeth: N, outer: 0.78, inner: 0.42, dir: 1, bore: 0.08 }), thickness: 0.16, hub: 0.16, circles: [0.26], mark: [0.34, 0], markSize: 0.05, spin: 0.8, label: "D", labelOffset: [0.12, -0.12, 0.3] },
    { id: "frame", kind: "group", center: C, arrow: false, label: "C", labelOffset: [0.25, -0.3, 0.3], pieces: frame },
    { id: "labelA", kind: "group", center: [0.9, 0.12, 0], label: "A", labelOffset: [0.12, 0, 0.3] },
    { id: "labelB", kind: "group", center: [-0.9, -0.12, 0], label: "B", labelOffset: [-0.12, 0, 0.3] },
    { id: "labelK", kind: "group", center: [0, -1.55, 0], label: "K", labelOffset: [0.25, 0, 0.3] },
    { id: "labelE", kind: "group", center: [0.62, 0.35, 0], label: "E", labelOffset: [0, 0, 0.3] },
    { id: "labelH", kind: "group", center: [-0.4, -0.62, 0], label: "H", labelOffset: [0, 0, 0.3] },
  ],
  driver: { part: "frame", type: "rotation", cycle: [-SWING, SWING] },
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    return { parts: { frame: { angle: swing(v, -SWING, SWING) }, wheelD: { angle: wheelAngle(v) } }, readouts: [] };
  },
};
