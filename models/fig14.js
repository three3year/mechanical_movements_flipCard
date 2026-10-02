// 第 14 種:滑輪組(blocks and tackle)。上下滑輪組各三個並排的皮帶輪;
// 繩從上方滑輪組固定端出發,在上下之間往返六段,所以施力 = 重量 ÷(下方皮帶輪數 × 2)。
import { Z, Y, clamp, routeRope, sheaveAngle, hoistReadouts, rod } from "./kit.js";

const RANGE = [0, 3];
const CEILING = 2.95;
const R = 0.3;
const LANES = [-0.3, 0, 0.3];
const UPPER_Y = 2.15;
const LOWER_Y = -0.4;
const HANGER = 0.9;
const W = { height: 0.55, radius: 0.3 };
const ROPE_END = [0.85, 0.6, LANES[2]];
const SHEAVES = LANES.length;

function layout(pull) {
  const rise = pull / (2 * SHEAVES);
  const lowerY = LOWER_Y + rise;
  const upper = LANES.map((z) => ({ center: [0, UPPER_Y, z], axis: Z, radius: R, sense: -1 }));
  const lower = LANES.map((z) => ({ center: [0, lowerY, z], axis: Z, radius: R, sense: -1 }));
  const anchor = [R, UPPER_Y - R - 0.12, LANES[0] - 0.2];
  const ropeEnd = [ROPE_END[0], ROPE_END[1] - pull, ROPE_END[2]];
  const nodes = [{ point: anchor }];
  for (let i = 0; i < SHEAVES; i++) nodes.push({ circle: lower[i] }, { circle: upper[i] });
  nodes.push({ point: ropeEnd });
  const weight = [0, lowerY - HANGER, 0];
  return { rise, lowerY, upper, lower, ropeEnd, weight, rope: routeRope(nodes) };
}

const rest = layout(RANGE[0]);

const sheave = (id, center, movable) => ({ id, kind: "pulley", style: "disc", center, axis: Z, radius: R, width: 0.18, movable });

export default {
  figure: 14,
  parts: [
    { id: "ceiling", kind: "box", center: [0, CEILING + 0.08, 0], size: [1.8, 0.16, 1.2] },
    ...rest.upper.map((c, i) => sheave(`upper${i + 1}`, c.center, false)),
    ...rest.lower.map((c, i) => sheave(`lower${i + 1}`, c.center, true)),
    { id: "upperPin", kind: "shaft", center: [0, UPPER_Y, 0], axis: Z, radius: 0.06, length: 1.05 },
    { id: "lowerPin", kind: "shaft", center: [0, LOWER_Y, 0], axis: Z, radius: 0.06, length: 1.05 },
    { id: "hanger", kind: "rod" },
    { id: "strap", kind: "rod" },
    { id: "weight", kind: "weight", center: rest.weight, axis: Y, radius: W.radius, height: W.height },
    { id: "rope", kind: "rope" },
    { id: "ropeEnd", kind: "ropeEnd", center: rest.ropeEnd },
  ],
  driver: { part: "ropeEnd", type: "translation", range: RANGE, direction: [0, -1, 0] },
  view: { direction: [0.6, 0.15, 1] },
  pose(value) {
    const pull = clamp(value, ...RANGE);
    const { rise, lowerY, upper, lower, ropeEnd, weight, rope } = layout(pull);
    const parts = {
      lowerPin: { position: [0, lowerY, 0] },
      weight: { position: weight },
      ropeEnd: { position: ropeEnd },
    };
    // 繩的節點依序為 下1、上1、下2、上2…
    for (let i = 0; i < SHEAVES; i++) {
      parts[`lower${i + 1}`] = { position: lower[i].center, angle: sheaveAngle(rope, rest.rope, 2 * i, lower[i]) };
      parts[`upper${i + 1}`] = { angle: sheaveAngle(rope, rest.rope, 2 * i + 1, upper[i]) };
    }
    return {
      parts,
      paths: {
        rope: { points: rope.points, closed: false },
        hanger: rod([0, CEILING, 0], [0, UPPER_Y, 0]),
        strap: rod([0, lowerY, 0], [0, weight[1] + W.height / 2 + 0.1, 0]),
      },
      readouts: hoistReadouts(pull, rise, 2 * SHEAVES),
    };
  },
};
