// 第 12 種:吊重物的簡單皮帶輪。施力必須等於重量才能平衡(1:1)。
import { Z, Y, clamp, routeRope, sheaveAngle, hoistReadouts, rod } from "./kit.js";

const RANGE = [0, 1.6];
const CEILING = 2.9;
const F = { center: [0, 2.2, 0], axis: Z, radius: 0.38, sense: 1 };
const W = { x: F.radius, y: -1.6, height: 0.55, radius: 0.3 };
const ROPE_END = [-F.radius, 0.4, 0];

function layout(pull) {
  const rise = pull; // 定滑輪只改變方向:繩端拉多少,重物升多少
  const weight = [W.x, W.y + rise, 0];
  const eye = [W.x, weight[1] + W.height / 2 + 0.1, 0];
  const ropeEnd = [ROPE_END[0], ROPE_END[1] - pull, 0];
  return { rise, weight, ropeEnd, rope: routeRope([{ point: eye }, { circle: F }, { point: ropeEnd }]) };
}

const rest = layout(RANGE[0]);

export default {
  figure: 12,
  parts: [
    { id: "ceiling", kind: "box", center: [0, CEILING + 0.08, 0], size: [2, 0.16, 0.6] },
    { id: "pulley", kind: "pulley", style: "disc", center: F.center, axis: Z, radius: F.radius, width: 0.2 },
    { id: "hanger", kind: "rod" },
    { id: "weight", kind: "weight", center: rest.weight, axis: Y, radius: W.radius, height: W.height },
    { id: "rope", kind: "rope" },
    { id: "ropeEnd", kind: "ropeEnd", center: rest.ropeEnd },
  ],
  driver: { part: "ropeEnd", type: "translation", range: RANGE, direction: [0, -1, 0] },
  pose(value) {
    const pull = clamp(value, ...RANGE);
    const { rise, weight, ropeEnd, rope } = layout(pull);
    return {
      parts: {
        pulley: { angle: sheaveAngle(rope, rest.rope, 0, F) },
        weight: { position: weight },
        ropeEnd: { position: ropeEnd },
      },
      paths: {
        rope: { points: rope.points, closed: false },
        hanger: rod([0, CEILING, 0], F.center),
      },
      readouts: hoistReadouts(pull, rise, 1),
    };
  },
};
