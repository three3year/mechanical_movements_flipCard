// 第 31 種:蝸桿與蝸輪。蝸桿每轉一圈,螺紋沿軸前進一個節距,推蝸輪轉過一齒(與第 29 種結果相同)。
// 蝸輪的齒始終落在螺紋之間:螺紋在蝸桿頂端的位置由繪圖層的螺旋(viewer/parts.js worm)算出。
import { TAU, X } from "./kit.js";

const WHEEL = { teeth: 26, radius: 1.7 };
const PITCH = (TAU * WHEEL.radius) / WHEEL.teeth;
const WORM = { radius: 0.42, length: 1.25, center: [0, WHEEL.radius + 0.42 - 0.04, 0] };

// 蝸桿轉 theta 時,螺紋在蝸桿底部(朝蝸輪,世界 −y)的軸向位置:
// 螺旋局部角 a 處在 z = −L/2 + a·節距/2π;底部是局部角 −π/2,轉 theta 後對應 a = −π/2 − theta
const crestX = (theta) => -WORM.length / 2 + ((-Math.PI / 2 - theta) / TAU) * PITCH;

/** 蝸桿轉 theta 時蝸輪的轉角:頂端的齒落在兩道螺紋之間,隨螺紋前進(每圈一齒) */
export const wheelAngle = (theta) => Math.PI / 2 - (crestX(theta) + PITCH / 2) / WHEEL.radius;
export const TEETH = WHEEL.teeth;

export default {
  figure: 31,
  parts: [
    {
      id: "worm",
      kind: "worm",
      axis: X,
      center: WORM.center,
      radius: WORM.radius,
      length: WORM.length,
      pitch: PITCH,
      thread: 0.13,
      pieces: [{ kind: "cylinder", radius: 0.1, length: 3.0 }],
    },
    { id: "wheel", kind: "gear", center: [0, 0, 0], teeth: WHEEL.teeth, radius: WHEEL.radius, width: 0.3, bore: 0.12 },
  ],
  waivers: [
    { check: "interference", parts: ["worm", "wheel"], reason: "簡化齒形:蝸桿螺紋是圓管、蝸輪是直齒,齒頂伸進蝸桿芯 0.04;實物的蝸輪齒是凹弧形包著蝸桿" },
  ],
  driver: { part: "worm", type: "rotation" },
  target: "wheel", // 每圈轉過一齒的蝸輪
  view: { direction: [0.08, 0.06, 1] },
  pose(theta) {
    return { parts: { worm: { angle: theta }, wheel: { angle: wheelAngle(theta) } }, readouts: [] };
  },
};
