// 第 102 種:一般的螺栓與螺帽,由圓周運動產生直線運動。轉動螺帽(右旋螺紋),
// 螺帽每轉一圈沿螺栓前進一個螺距,往螺栓頭靠近。主動件是螺帽(在螺紋的長度內往返)。
// 原文要的直線運動就是螺帽自己的移動,螺栓不動:只有主動件在動,不標目標件(同維護者決定的那 14 張)。
import { Y, TAU, screwAdvance } from "./kit.js";
import { polygon, circle, shape } from "./shapes.js";

const PITCH = 0.32;
const BOTTOM = -1.45; // 螺帽最低處(螺栓末端)
const TURNS = 4;
const HEX = shape(polygon(6, 0.62, Math.PI / 6), [circle(0.3).reverse()]);

/** 螺帽轉 angle(繞 +y):螺帽的高度 */
export const nutHeight = (angle) => BOTTOM + screwAdvance(angle, PITCH);
export const pitch = PITCH;

export default {
  figure: 102,
  parts: [
    {
      id: "bolt",
      kind: "group",
      pieces: [
        { kind: "worm", axis: Y, radius: 0.34, length: 3.0, pitch: PITCH, thread: 0.07, at: [0, -0.2, 0] },
        { kind: "plate", shape: shape(polygon(6, 0.62, Math.PI / 6)), thickness: 0.42, axis: Y, at: [0, 1.5, 0] },
      ],
    },
    {
      id: "nut",
      kind: "plate",
      axis: Y,
      center: [0, BOTTOM, 0],
      shape: HEX,
      thickness: 0.42,
      mark: [0.45, 0],
      markSize: 0.07,
      spin: 0.62,
    },
  ],
  driver: { part: "nut", type: "rotation", range: [0, TURNS * TAU] },
  view: { direction: [0.25, 0.3, 1] },
  pose(angle) {
    return { parts: { nut: { position: [0, nutHeight(angle), 0], angle } }, readouts: [] };
  },
  waivers: [
    { check: "interference", parts: ["bolt", "nut"], reason: "螺帽轉在螺栓上:螺栓的螺紋咬進螺帽孔壁 0.04,是螺紋嚙合(螺帽的孔畫成光孔)" },
  ],
};
