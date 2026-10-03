// 第 275 種:蝸桿的旋轉運動賦予齒條直線運動。蝸桿的軸與齒條平行,螺紋嵌在齒條的齒間;
// 蝸桿每轉一圈,齒條沿軸移動一個螺距(等於齒條的齒距)。主動件是蝸桿。
import { Y, TAU, clamp, screwAdvance } from "./kit.js";
import { rackShape } from "./shapes.js";

export const PITCH = 0.36;
export const RANGE = [-2.5 * TAU, 2.5 * TAU];
const WORM = { radius: 0.48, length: 1.9, center: [0.55, -0.55, 0] };

/** 蝸桿轉 theta → 齒條的位移(往上為正) */
export const rack = (theta) => screwAdvance(clamp(theta, ...RANGE), PITCH);

export default {
  figure: 275,
  parts: [
    { id: "worm", kind: "worm", axis: Y, center: WORM.center, radius: WORM.radius, length: WORM.length, pitch: PITCH, thread: 0.16, pieces: [{ kind: "cylinder", radius: 0.1, length: 3.2 }] },
    // 齒條:沿 y,齒朝 +x(朝蝸桿);齒距等於螺距
    { id: "rack", kind: "plate", shape: rackShape({ teeth: 13, pitch: PITCH, depth: 0.25 }), thickness: 0.3, arrow: false },
    { id: "guide", kind: "group", pieces: [{ kind: "box", size: [0.15, 0.6, 0.5], at: [-0.55, -2.0, 0] }, { kind: "box", size: [0.15, 0.6, 0.5], at: [-0.55, 1.4, 0] }] },
  ],
  driver: { part: "worm", type: "rotation", range: RANGE, initial: 0 },
  view: { direction: [0.25, 0.1, 1] },
  pose(theta) {
    // 齒條零件的局部 x 沿齒條,齒朝局部 +y:轉 −90° 讓齒條沿世界 y、齒朝 +x
    return { parts: { worm: { angle: clamp(theta, ...RANGE) }, rack: { position: [0.12, 0.2 + rack(theta), 0], angle: -Math.PI / 2 } }, readouts: [] };
  },
};
