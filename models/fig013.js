// 第 13 種:下方皮帶輪可動。繩一端固定,另一端的移動速度是重物的兩倍(2:1)。
import { Z, Y, clamp, routeRope, sheaveAngle, hoistReadouts, rod } from "./kit.js";

const RANGE = [0, 2];
const CEILING = 2.9;
const R = 0.33;
const FIXED = { center: [-0.36, 2.2, 0], axis: Z, radius: R, sense: 1 };
const MOVABLE_Y = -0.6;
const ANCHOR = [0.36 + R, CEILING, 0];
const HANGER = 0.95; // 可動輪軸心到重物中心
const W = { height: 0.55, radius: 0.3 };
const ROPE_END = [-0.36 - R, 0.6, 0];

function layout(pull) {
  // 繩長守恆:可動輪兩側各短 rise,繩端就得拉 2·rise
  const rise = pull / 2;
  const movable = { center: [0.36, MOVABLE_Y + rise, 0], axis: Z, radius: R, sense: -1 };
  const weight = [0.36, movable.center[1] - HANGER, 0];
  const ropeEnd = [ROPE_END[0], ROPE_END[1] - pull, 0];
  const rope = routeRope([{ point: ANCHOR }, { circle: movable }, { circle: FIXED }, { point: ropeEnd }]);
  return { rise, movable, weight, ropeEnd, rope };
}

const rest = layout(RANGE[0]);

export default {
  figure: 13,
  parts: [
    { id: "ceiling", kind: "box", center: [0, CEILING + 0.08, 0], size: [2.2, 0.16, 0.6] },
    { id: "fixed", kind: "pulley", style: "disc", center: FIXED.center, axis: Z, radius: R, width: 0.2 },
    { id: "movable", kind: "pulley", style: "disc", center: rest.movable.center, axis: Z, radius: R, width: 0.2 },
    { id: "hanger", kind: "rod" },
    { id: "strap", kind: "rod" },
    { id: "weight", kind: "weight", center: rest.weight, axis: Y, radius: W.radius, height: W.height },
    { id: "rope", kind: "rope" },
    { id: "ropeEnd", kind: "ropeEnd", center: rest.ropeEnd },
  ],
  driver: { part: "ropeEnd", type: "translation", range: RANGE, direction: [0, -1, 0] },
  target: "weight", // 被吊起的重物
  pose(value) {
    const pull = clamp(value, ...RANGE);
    const { rise, movable, weight, ropeEnd, rope } = layout(pull);
    return {
      parts: {
        fixed: { angle: sheaveAngle(rope, rest.rope, 1, FIXED) },
        movable: { position: movable.center, angle: sheaveAngle(rope, rest.rope, 0, movable) },
        weight: { position: weight },
        ropeEnd: { position: ropeEnd },
      },
      paths: {
        rope: { points: rope.points, closed: false },
        hanger: rod([FIXED.center[0], CEILING, 0], FIXED.center),
        strap: rod(movable.center, [weight[0], weight[1] + W.height / 2 + 0.1, 0]),
      },
      readouts: hoistReadouts(pull, rise, 2),
    };
  },
};
