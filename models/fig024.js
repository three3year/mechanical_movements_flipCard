// 第 24 種:正齒輪。兩個外咬合的正齒輪,齒數照原圖(左 28、右 34);
// 拖動左輪,右輪依齒數比反向轉動,齒互相嵌入。
import { meshAngle } from "./gears.js";

const M = 0.075; // 模數:兩輪齒距相同才能咬合
const LEFT = { center: [-(28 * M) / 2 - 0.0, 0, 0], teeth: 28, radius: (28 * M) / 2 };
const RIGHT = { center: [(34 * M) / 2, 0, 0], teeth: 34, radius: (34 * M) / 2 };
const SHIFT = (LEFT.radius - RIGHT.radius) / 2; // 讓兩輪整體置中
LEFT.center[0] += SHIFT;
RIGHT.center[0] += SHIFT;

export default {
  figure: 24,
  parts: [
    { id: "left", kind: "gear", center: LEFT.center, teeth: LEFT.teeth, radius: LEFT.radius, width: 0.22, bore: 0.12 },
    { id: "right", kind: "gear", center: RIGHT.center, teeth: RIGHT.teeth, radius: RIGHT.radius, width: 0.22, bore: 0.12 },
  ],
  driver: { part: "left", type: "rotation" },
  view: { direction: [0.12, 0.1, 1] },
  pose(angle) {
    return {
      parts: { left: { angle }, right: { angle: meshAngle(LEFT, RIGHT, angle) } },
      readouts: [],
    };
  },
};
