// 第 113 種:齒條與小齒輪,把圓周運動轉換為直線運動(或反之)。齒條固定在上方的平板下面,
// 平板兩端靠在滾輪上;轉動小齒輪,齒條連同平板直線移動,移動量等於節圓上轉過的弧長。
import { rackOffset, circularPitch } from "./gears.js";

export const PINION = { center: [0, 0, 0], teeth: 14, radius: 0.7 };
const PITCH = circularPitch(PINION);
const RACK = { origin: [0, PINION.radius, 0], dir: [1, 0, 0], pitch: PITCH };
const TEETH = 19;

/** 小齒輪轉 angle:齒條的位移 */
export const rackX = (angle) => rackOffset(PINION, RACK, angle);
export const pitch = PITCH;

export default {
  figure: 113,
  parts: [
    { id: "pinion", kind: "gear", center: PINION.center, teeth: PINION.teeth, radius: PINION.radius, width: 0.3, bore: 0.12 },
    {
      id: "rack",
      kind: "group",
      pieces: [
        { kind: "rack", teeth: TEETH, pitch: PITCH, depth: 0.35, width: 0.3, at: [0, PINION.radius, 0], angle: Math.PI },
        { kind: "box", size: [7.4, 0.14, 0.5], at: [0, PINION.radius + 0.57, 0] },
      ],
    },
    {
      id: "rollers",
      kind: "group",
      pieces: [-3.2, 3.2].map((x) => ({ kind: "cylinder", radius: 0.3, inner: 0.2, length: 0.4, at: [x, PINION.radius + 0.2, 0] })),
    },
  ],
  driver: { part: "pinion", type: "rotation", range: [-2.6, 2.6] },
  view: { direction: [0.06, 0.06, 1] },
  pose(angle) {
    return { parts: { pinion: { angle }, rack: { position: [rackX(angle), 0, 0] } }, readouts: [] };
  },
};

