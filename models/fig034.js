// 第 34 種:內齒式正齒輪與小齒輪。小齒輪(16 齒)在內齒輪(40 齒)裡面咬合,
// 原文:「使用內齒式齒輪時,兩者的旋轉方向相同」。
import { meshAngle } from "./gears.js";

const M = 0.075;
const RING = { center: [0, 0, 0], teeth: 40, radius: (40 * M) / 2, internal: true };
const PINION = { center: [-(RING.radius - (16 * M) / 2), 0, 0], teeth: 16, radius: (16 * M) / 2 };

export default {
  figure: 34,
  parts: [
    { id: "pinion", kind: "gear", center: PINION.center, teeth: PINION.teeth, radius: PINION.radius, width: 0.24, bore: 0.08 },
    { id: "ring", kind: "gear", internal: true, center: RING.center, teeth: RING.teeth, radius: RING.radius, rim: RING.radius * 1.12, width: 0.2 },
  ],
  driver: { part: "pinion", type: "rotation" },
  view: { direction: [0.12, 0.1, 1] },
  pose(angle) {
    return {
      parts: { pinion: { angle }, ring: { angle: meshAngle(PINION, RING, angle) } },
      readouts: [],
    };
  },
};
