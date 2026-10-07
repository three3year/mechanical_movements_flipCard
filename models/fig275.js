// 第 275 種:蝸桿的旋轉運動賦予齒條直線運動。蝸桿的軸與齒條平行,螺紋嵌在齒條的齒間;
// 蝸桿每轉一圈,齒條沿軸移動一個螺距(等於齒條的齒距)。主動件是蝸桿。
// 推斷:蝸桿軸兩端的軸承架、齒條的導塊與後面的背板(原圖只畫蝸桿與齒條);軸端的鍵條是轉向記號。
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
    {
      id: "worm",
      kind: "worm",
      axis: Y,
      center: WORM.center,
      radius: WORM.radius,
      length: WORM.length,
      pitch: PITCH,
      thread: 0.16,
      pieces: [
        { kind: "cylinder", radius: 0.1, length: 3.2 },
        { kind: "box", size: [0.05, 0.06, 0.4], at: [0.1, 0, 1.25], accent: true }, // 軸上的鍵條(看轉向)
      ],
    },
    // 齒條:沿 y,齒朝 +x(朝蝸桿);齒距等於螺距
    { id: "rack", kind: "plate", shape: rackShape({ teeth: 13, pitch: PITCH, depth: 0.25 }), thickness: 0.3, arrow: false },
    {
      id: "guide",
      kind: "group",
      pieces: [
        { kind: "box", size: [2.4, 4.8, 0.1], at: [0.05, -0.4, -0.85] }, // 背板
        // 齒條的導塊(從背板伸出)
        { kind: "box", size: [0.15, 0.6, 1.05], at: [-0.55, -2.0, -0.3] },
        { kind: "box", size: [0.15, 0.6, 1.05], at: [-0.55, 1.4, -0.3] },
        // 蝸桿軸兩端的軸承架
        ...[-2.0, 0.9].flatMap((y) => [
          { kind: "cylinder", axis: Y, radius: 0.2, inner: 0.1, length: 0.16, at: [WORM.center[0], y, 0] },
          { kind: "box", size: [0.16, 0.16, 0.62], at: [WORM.center[0], y, -0.5] },
        ]),
      ],
    },
  ],
  driver: { part: "worm", type: "rotation", range: RANGE, initial: 0 },
  target: "rack", // 直線移動的齒條
  view: { direction: [0.25, 0.1, 1] },
  pose(theta) {
    // 齒條零件的局部 x 沿齒條,齒朝局部 +y:轉 −90° 讓齒條沿世界 y、齒朝 +x
    return { parts: { worm: { angle: clamp(theta, ...RANGE) }, rack: { position: [0.12, 0.2 + rack(theta), 0], angle: -Math.PI / 2 } }, readouts: [] };
  },
  waivers: [
    { check: "interference", parts: ["worm", "rack"], reason: "蝸桿的螺紋嚙進齒條的齒 0.16(簡化齒形:螺紋與齒各自畫成實體)" },
  ],
};
