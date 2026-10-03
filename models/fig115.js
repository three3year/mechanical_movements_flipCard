// 第 115 種:兩個同樣大小、互相咬合的齒輪,上輪咬上方的齒條、下輪咬下方的齒條;
// 齒輪轉動時,雙齒條框架直線移動,兩側得到相等的力與速度。主動件是上輪。
import { rackOffset, circularPitch, meshAngle } from "./gears.js";
import { arcPoints, shape } from "./shapes.js";

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
const loop = (h) => [...arcPoints(h, -Math.PI / 2, Math.PI / 2, W, 0), ...arcPoints(h, Math.PI / 2, (3 * Math.PI) / 2, -W, 0)];

export default {
  figure: 115,
  parts: [
    { id: "upper", kind: "gear", center: UPPER.center, teeth: UPPER.teeth, radius: R, width: 0.3, bore: 0.18, web: false },
    { id: "lower", kind: "gear", center: LOWER.center, teeth: LOWER.teeth, radius: R, width: 0.3, bore: 0.18, web: false },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(loop(H), [loop(H - 0.2).reverse()]), thickness: 0.3 },
        { kind: "rack", teeth: 11, pitch: PITCH, depth: 0.3, width: 0.3, at: [0, 2 * R, 0], angle: Math.PI },
        { kind: "rack", teeth: 11, pitch: PITCH, depth: 0.3, width: 0.3, at: [BOTTOM_PHASE, -2 * R, 0] },
        { kind: "box", size: [0.3, 0.4, 0.3], at: [-W - H - 0.1, 0, 0] },
        { kind: "box", size: [0.3, 0.4, 0.3], at: [W + H + 0.1, 0, 0] },
      ],
    },
  ],
  driver: { part: "upper", type: "rotation", range: [-1.8, 1.8] },
  target: "frame", // 直線移動的雙齒條框架
  view: { direction: [0.06, 0.05, 1] },
  pose(angle) {
    const { x, lower } = drive(angle);
    return { parts: { upper: { angle }, lower: { angle: lower }, frame: { position: [x, 0, 0] } }, readouts: [] };
  },
};
