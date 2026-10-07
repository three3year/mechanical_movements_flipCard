// 第 115 種:兩個同樣大小、互相咬合的齒輪,上輪咬上方的齒條、下輪咬下方的齒條;
// 齒輪轉動時,雙齒條框架直線移動,兩側得到相等的力與速度。主動件是上輪。
// 兩輪的軸裝在後面同一根立架的軸承上;框架兩端的耳伸成桿,穿在固定的導套裡(立架、導套是推斷,原圖只畫到兩端的耳)。
import { rackOffset, circularPitch, meshAngle } from "./gears.js";
import { arcPoints, shape } from "./shapes.js";
import { squareGuide } from "./supports.js";

const R = 0.72;
export const UPPER = { center: [0, R, 0], teeth: 14, radius: R };
export const LOWER = { center: [0, -R, 0], teeth: 14, radius: R };
const PITCH = circularPitch(UPPER);
const TOP = { origin: [0, 2 * R, 0], dir: [1, 0, 0], pitch: PITCH };
const BOTTOM = { origin: [0, -2 * R, 0], dir: [1, 0, 0], pitch: PITCH };

/** 上輪轉 angle:框架位置(由上方齒條決定)、下輪轉角、下方齒條需要的位置 */
export function drive(angle) {
  const lower = meshAngle(UPPER, LOWER, angle);
  return { x: rackOffset(UPPER, TOP, angle), lower, bottomX: rackOffset(LOWER, BOTTOM, lower) };
}
const D0 = drive(0);
const BOTTOM_PHASE = ((((D0.bottomX - D0.x) % PITCH) + PITCH) % PITCH);

const W = 1.4;
const H = 2 * R + 0.65;
const ROD = { length: 3.2, at: W + H - 0.12 + 1.6 }; // 兩端的桿(內端伸進框架 0.12)
const FLOOR = -2.6;
const axle = { kind: "cylinder", radius: 0.18, length: 0.95, at: [0, 0, -0.325] }; // 往後伸進立架的軸承
const loop = (h) => [...arcPoints(h, -Math.PI / 2, Math.PI / 2, W, 0), ...arcPoints(h, Math.PI / 2, (3 * Math.PI) / 2, -W, 0)];

export default {
  figure: 115,
  parts: [
    { id: "upper", kind: "gear", center: UPPER.center, teeth: UPPER.teeth, radius: R, width: 0.3, bore: 0.18, web: false, pieces: [axle] },
    { id: "lower", kind: "gear", center: LOWER.center, teeth: LOWER.teeth, radius: R, width: 0.3, bore: 0.18, web: false, pieces: [axle] },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(loop(H), [loop(H - 0.2).reverse()]), thickness: 0.3 },
        { kind: "rack", teeth: 11, pitch: PITCH, depth: 0.3, width: 0.3, at: [0, 2 * R, 0], angle: Math.PI },
        { kind: "rack", teeth: 11, pitch: PITCH, depth: 0.3, width: 0.3, at: [BOTTOM_PHASE, -2 * R, 0] },
        { kind: "box", size: [ROD.length, 0.2, 0.3], at: [-ROD.at, 0, 0] },
        { kind: "box", size: [ROD.length, 0.2, 0.3], at: [ROD.at, 0, 0] },
      ],
    },
    {
      id: "stand",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: 0.33, inner: 0.18, length: 0.4, at: [0, R, -0.6] },
        { kind: "cylinder", radius: 0.33, inner: 0.18, length: 0.4, at: [0, -R, -0.6] },
        { kind: "box", size: [0.5, R + 0.35 - FLOOR, 0.2], at: [0, (R + 0.35 + FLOOR) / 2, -0.9] },
        { kind: "box", size: [1.4, 0.18, 0.8], at: [0, FLOOR - 0.09, -0.7] },
        ...[-1, 1].flatMap((side) => [
          ...squareGuide({ at: [side * ROD.at, 0, 0], width: 0.2, thickness: 0.3 }),
          { kind: "box", size: [0.2, -0.18 - FLOOR, 0.2], at: [side * ROD.at, (-0.18 + FLOOR) / 2, 0] },
          { kind: "box", size: [0.8, 0.18, 0.6], at: [side * ROD.at, FLOOR - 0.09, 0] },
        ]),
      ],
    },
  ],
  driver: { part: "upper", type: "rotation", range: [-1.8, 1.8] },
  target: "frame", // 直線移動的雙齒條框架
  view: { direction: [0.06, 0.05, 1], fit: ["upper", "lower", "frame"] },
  pose(angle) {
    const { x, lower } = drive(angle);
    return { parts: { upper: { angle }, lower: { angle: lower }, frame: { position: [x, 0, 0] } }, readouts: [] };
  },
};
