// 第 17 種:西班牙式滑輪組(單)。頂端定滑輪、中間的動滑輪(runner)、下方掛重物的滑輪框。
// 第一條繩從下方滑輪框越過定滑輪,吊住中間動滑輪;第二條繩從下方滑輪框越過中間動滑輪到繩端。
// 重物升 y,中間動滑輪降 y,繩端拉 3y。
import { Z, Y, clamp, routeRope, sheaveAngle, hoistReadouts, rod } from "./kit.js";

const RANGE = [0, 1.5];
const CEILING = 2.9;
const TOP = { center: [0, 2.25, 0], axis: Z, radius: 0.3, sense: -1 };
const LOWER = { x: -0.3, y: -0.8, radius: 0.25 };
const RUNNER = { x: 0.3 + 0.25, y: 1.0, radius: 0.25 };
const HANGER = 0.8;
const W = { height: 0.55, radius: 0.32 };
const ROPE_END = [RUNNER.x + RUNNER.radius, 0.3, 0];

function layout(pull) {
  const rise = pull / 3;
  const lower = [LOWER.x, LOWER.y + rise, 0];
  const runner = { center: [RUNNER.x, RUNNER.y - rise, 0], axis: Z, radius: RUNNER.radius, sense: -1 };
  const hook = [RUNNER.x - RUNNER.radius, runner.center[1] + RUNNER.radius + 0.15, 0];
  const ropeEnd = [ROPE_END[0], ROPE_END[1] - pull, 0];
  const main = routeRope([{ point: [LOWER.x, lower[1] + LOWER.radius, 0] }, { circle: TOP }, { point: hook }]);
  // 第二條繩接在下方滑輪框伸出的橫桿上,正對動滑輪左側,各段繩都垂直
  const yoke = [RUNNER.x - RUNNER.radius, lower[1], 0];
  const fall = routeRope([{ point: yoke }, { circle: runner }, { point: ropeEnd }]);
  const weight = [LOWER.x, lower[1] - HANGER, 0];
  return { rise, lower, runner, hook, yoke, ropeEnd, main, fall, weight };
}

const rest = layout(RANGE[0]);

export default {
  figure: 17,
  parts: [
    { id: "ceiling", kind: "box", center: [0.2, CEILING + 0.08, 0], size: [2.2, 0.16, 0.6] },
    { id: "top", kind: "pulley", style: "disc", center: TOP.center, axis: Z, radius: TOP.radius, width: 0.2 },
    { id: "runner", kind: "pulley", style: "disc", center: rest.runner.center, axis: Z, radius: RUNNER.radius, width: 0.2 },
    { id: "lower", kind: "pulley", style: "disc", center: rest.lower, axis: Z, radius: LOWER.radius, width: 0.2 },
    { id: "hanger", kind: "rod" },
    { id: "runnerHook", kind: "rod" },
    { id: "strap", kind: "rod" },
    { id: "yoke", kind: "rod" },
    { id: "weight", kind: "weight", center: rest.weight, axis: Y, radius: W.radius, height: W.height },
    { id: "main", kind: "rope" },
    { id: "fall", kind: "rope" },
    { id: "ropeEnd", kind: "ropeEnd", center: rest.ropeEnd },
  ],
  driver: { part: "ropeEnd", type: "translation", range: RANGE, direction: [0, -1, 0] },
  target: "weight", // 被吊起的重物
  pose(value) {
    const pull = clamp(value, ...RANGE);
    const { rise, lower, runner, hook, yoke, ropeEnd, main, fall, weight } = layout(pull);
    return {
      parts: {
        top: { angle: sheaveAngle(main, rest.main, 0, TOP) },
        lower: { position: lower },
        runner: { position: runner.center, angle: sheaveAngle(fall, rest.fall, 0, runner) },
        weight: { position: weight },
        ropeEnd: { position: ropeEnd },
      },
      paths: {
        main: { points: main.points, closed: false },
        fall: { points: fall.points, closed: false },
        hanger: rod([TOP.center[0], CEILING, 0], TOP.center),
        runnerHook: rod(hook, runner.center),
        yoke: rod(lower, yoke),
        strap: rod(lower, [weight[0], weight[1] + W.height / 2 + 0.1, 0]),
      },
      readouts: hoistReadouts(pull, rise, 3),
    };
  },
};
