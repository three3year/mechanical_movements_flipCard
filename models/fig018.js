// 第 18 種:兩個固定皮帶輪與一個可動皮帶輪。依原圖:繩從可動輪的吊點斜上到中間定滑輪的右側,
// 越過它從左側垂下、繞過可動輪底部,從右側上到頂端定滑輪的右側,越過頂輪後由左側往左下斜拉出去。
// 可動輪由三段繩吊著,繩端移動是重物的三倍。
import { Z, Y, clamp, add, scale, norm, routeRope, sheaveAngle, hoistReadouts, rod } from "./kit.js";

const RANGE = [0, 2.4];
const CEILING = 2.95;
const TOP = { center: [0, 2.25, 0], axis: Z, radius: 0.42, sense: 1 };
const MIDDLE = { center: [0, 1.35, 0], axis: Z, radius: 0.33, sense: 1 };
const R = 0.31;
const MOVABLE = { x: 0.03, y: -0.95 };
const HANGER = 0.8;
const W = { height: 0.5, radius: 0.32 };
// 繩端沿原圖的斜線方向拉:從頂輪左側往左下
const PULL = norm([-0.32, -0.95, 0]);
const LEAVE = add(TOP.center, scale([PULL[1], -PULL[0], 0], TOP.radius)); // 斜線與頂輪相切之處
const SLACK = 0.9; // 未拉時繩端離切點的距離

function layout(pull) {
  const rise = pull / 3;
  const movable = { center: [MOVABLE.x, MOVABLE.y + rise, 0], axis: Z, radius: R, sense: 1 };
  // 繩接在可動輪框的吊點(輪軸前方),斜上到中輪右側
  const anchor = [MOVABLE.x, movable.center[1] + R * 0.55, 0.14];
  const ropeEnd = add(LEAVE, scale(PULL, SLACK + pull));
  const rope = routeRope([{ point: anchor }, { circle: MIDDLE }, { circle: movable }, { circle: TOP }, { point: ropeEnd }]);
  const weight = [MOVABLE.x, movable.center[1] - HANGER, 0];
  return { rise, movable, ropeEnd, weight, rope };
}

const rest = layout(RANGE[0]);

export default {
  figure: 18,
  parts: [
    { id: "ceiling", kind: "box", center: [0, CEILING + 0.08, 0], size: [1.4, 0.16, 0.6] },
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
  driver: { part: "ropeEnd", type: "translation", range: RANGE, direction: PULL },
  target: "weight", // 被吊起的重物
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
        hanger: rod([0, CEILING, 0], TOP.center),
        link: rod(TOP.center, MIDDLE.center), // 中間定滑輪吊在頂輪下方
        strap: rod(movable.center, [MOVABLE.x, weight[1] + W.height / 2 + 0.1, 0]),
      },
      readouts: hoistReadouts(pull, rise, 3),
    };
  },
};
