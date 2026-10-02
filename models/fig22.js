// 第 22 種:原文規則適用的配置。每個可動輪由一條繩環繞,繩一端固定在天花板、另一端接在上一個可動輪的中心;
// 最上面的可動輪的繩越過定滑輪到繩端。三個可動輪:省力比 2³ = 8。
import { Z, Y, clamp, routeRope, sheaveAngle, hoistReadouts, rod } from "./kit.js";

const RANGE = [0, 2];
const CEILING = 2.95;
const R = 0.3;
const MOVABLE = [
  { x: -0.5, y: -0.9 },
  { x: -0.2, y: 0.1 },
  { x: 0.1, y: 1.2 },
];
const FIXED = { center: [0.1 + R + R, 2.3, 0], axis: Z, radius: R, sense: -1 };
const HANGER = 0.85;
const W = { height: 0.5, radius: 0.34 };
const HANDLE = [FIXED.center[0] + R + 0.15, 0.8, 0];
const N = MOVABLE.length;

function layout(pull) {
  const rise = pull / 2 ** N;
  // 繩長守恆:每往上一個可動輪,上升量加倍
  const circles = MOVABLE.map((m, i) => ({ center: [m.x, m.y + rise * 2 ** i, 0], axis: Z, radius: R, sense: 1 }));
  const handle = [HANDLE[0], HANDLE[1] - pull, 0];
  const ropes = circles.map((c, i) => {
    const anchor = [c.center[0] - R, CEILING, 0];
    if (i === N - 1) return routeRope([{ point: anchor }, { circle: c }, { circle: FIXED }, { point: handle }]);
    const next = circles[i + 1].center;
    return routeRope([{ point: anchor }, { circle: c }, { point: [next[0], next[1] - R - 0.1, 0] }]);
  });
  const weight = [circles[0].center[0], circles[0].center[1] - HANGER, 0];
  return { rise, circles, handle, ropes, weight };
}

const rest = layout(RANGE[0]);

export default {
  figure: 22,
  parts: [
    { id: "ceiling", kind: "box", center: [0, CEILING + 0.08, 0], size: [2.2, 0.16, 0.6] },
    ...rest.circles.map((c, i) => ({
      id: `movable${i + 1}`,
      kind: "pulley",
      style: "disc",
      center: c.center,
      axis: Z,
      radius: R,
      width: 0.2,
      movable: true,
    })),
    { id: "fixed", kind: "pulley", style: "disc", center: FIXED.center, axis: Z, radius: R, width: 0.2 },
    { id: "hanger", kind: "rod" },
    ...rest.circles.slice(1).map((_, i) => ({ id: `eye${i + 2}`, kind: "rod" })),
    { id: "strap", kind: "rod" },
    { id: "weight", kind: "weight", center: rest.weight, axis: Y, radius: W.radius, height: W.height },
    ...rest.ropes.map((_, i) => ({ id: `rope${i + 1}`, kind: "rope" })),
    { id: "handle", kind: "handle", center: rest.handle },
  ],
  driver: { part: "handle", type: "translation", range: RANGE, direction: [0, -1, 0] },
  pose(value) {
    const pull = clamp(value, ...RANGE);
    const { rise, circles, handle, ropes, weight } = layout(pull);
    const parts = {
      fixed: { angle: sheaveAngle(ropes[N - 1], rest.ropes[N - 1], 1, FIXED) },
      weight: { position: weight },
      handle: { position: handle },
    };
    const paths = {
      hanger: rod([FIXED.center[0], CEILING, 0], FIXED.center),
      strap: rod(circles[0].center, [weight[0], weight[1] + W.height / 2 + 0.1, 0]),
    };
    circles.forEach((c, i) => {
      parts[`movable${i + 1}`] = { position: c.center, angle: sheaveAngle(ropes[i], rest.ropes[i], 0, c) };
      paths[`rope${i + 1}`] = { points: ropes[i].points, closed: false };
      if (i > 0) paths[`eye${i + 1}`] = rod([c.center[0], c.center[1] - R - 0.1, 0], c.center); // 下一條繩接在輪的中心
    });
    return { parts, paths, readouts: hoistReadouts(pull, rise, 2 ** N) };
  },
};
