// 第 18 種:兩個固定皮帶輪與一個可動皮帶輪。繩從可動輪框出發,
// 越過下方定滑輪、繞過可動輪、越過上方定滑輪到繩端:可動輪由三段繩吊著,繩端移動是重物的三倍。
import { Z, Y, clamp, routeRope, sheaveAngle, hoistReadouts, rod } from "./kit.js";

const RANGE = [0, 2.4];
const CEILING = 2.95;
// 各段繩都垂直:中輪右側對準動滑輪右側,頂輪左側對準動滑輪左側
const TOP = { center: [0.09, 2.25, 0], axis: Z, radius: 0.42, sense: -1 };
const MIDDLE = { center: [0.07, 1.3, 0], axis: Z, radius: 0.26, sense: -1 };
const R = 0.33;
const MOVABLE_Y = -0.6;
const HANGER = 0.9;
const W = { height: 0.5, radius: 0.3 };
const ROPE_END = [TOP.center[0] + TOP.radius, 0.5, 0];

function layout(pull) {
  const rise = pull / 3;
  const movable = { center: [0, MOVABLE_Y + rise, 0], axis: Z, radius: R, sense: -1 };
  const anchor = [MIDDLE.center[0] - MIDDLE.radius, movable.center[1] + R + 0.15, 0];
  const ropeEnd = [ROPE_END[0], ROPE_END[1] - pull, 0];
  const rope = routeRope([{ point: anchor }, { circle: MIDDLE }, { circle: movable }, { circle: TOP }, { point: ropeEnd }]);
  const weight = [0, movable.center[1] - HANGER, 0];
  return { rise, movable, ropeEnd, weight, rope };
}

const rest = layout(RANGE[0]);

export default {
  figure: 18,
  parts: [
    { id: "ceiling", kind: "box", center: [0, CEILING + 0.08, 0], size: [1.6, 0.16, 0.6] },
    { id: "top", kind: "pulley", style: "disc", center: TOP.center, axis: Z, radius: TOP.radius, width: 0.2 },
    { id: "middle", kind: "pulley", style: "disc", center: MIDDLE.center, axis: Z, radius: MIDDLE.radius, width: 0.2 },
    { id: "movable", kind: "pulley", style: "disc", center: rest.movable.center, axis: Z, radius: R, width: 0.2, movable: true },
    { id: "hanger", kind: "rod" },
    { id: "link", kind: "rod" },
    { id: "strap", kind: "rod" },
    { id: "weight", kind: "weight", center: rest.weight, axis: Y, radius: W.radius, height: W.height },
    { id: "rope", kind: "rope" },
    { id: "ropeEnd", kind: "ropeEnd", center: rest.ropeEnd },
  ],
  driver: { part: "ropeEnd", type: "translation", range: RANGE, direction: [0, -1, 0] },
  pose(value) {
    const pull = clamp(value, ...RANGE);
    const { rise, movable, ropeEnd, weight, rope } = layout(pull);
    return {
      parts: {
        middle: { angle: sheaveAngle(rope, rest.rope, 0, MIDDLE) },
        movable: { position: movable.center, angle: sheaveAngle(rope, rest.rope, 1, movable) },
        top: { angle: sheaveAngle(rope, rest.rope, 2, TOP) },
        weight: { position: weight },
        ropeEnd: { position: ropeEnd },
      },
      paths: {
        rope: { points: rope.points, closed: false },
        hanger: rod([TOP.center[0], CEILING, 0], TOP.center),
        link: rod(TOP.center, MIDDLE.center), // 下方定滑輪吊在上方定滑輪下
        strap: rod(movable.center, [0, weight[1] + W.height / 2 + 0.1, 0]),
      },
      readouts: hoistReadouts(pull, rise, 3),
    };
  },
};
