// 第 32 種:摩擦輪。兩個輪面粗糙(或覆皮革、硫化橡膠)的輪靠摩擦咬合:
// 接觸點線速度相等,兩輪反向轉,轉角比為半徑反比。
import { circle } from "./shapes.js";

const LEFT = { center: [-2.0, 0, 0], radius: 1.15 };
const RIGHT = { center: [1.05, 0, 0], radius: 1.9 };

const wheel = (id, w) => ({
  id,
  kind: "plate",
  center: w.center,
  shape: { outline: circle(w.radius), holes: [] },
  thickness: 0.4,
  circles: [w.radius - 0.1, 0.48],
  hub: 0.36,
  mark: [w.radius * 0.62, 0],
  markSize: 0.1,
  spin: w.radius,
  radius: w.radius,
  pieces: [{ kind: "cylinder", radius: 0.22, length: 0.9 }],
});

export const radii = [LEFT.radius, RIGHT.radius];

export default {
  figure: 32,
  parts: [wheel("left", LEFT), wheel("right", RIGHT)],
  driver: { part: "left", type: "rotation" },
  target: "right", // 靠摩擦被帶動的輪
  view: { direction: [0.1, 0.08, 1] },
  pose(angle) {
    return { parts: { left: { angle }, right: { angle: (-angle * LEFT.radius) / RIGHT.radius } }, readouts: [] };
  },
};
