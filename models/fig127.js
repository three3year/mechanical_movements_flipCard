// 第 127 種:氣泵的運動裝置。槓桿與正齒輪固定在同一根軸上;槓桿振動時齒輪來回轉動,
// 帶動兩側直立的齒條往復直線運動。兩根齒條接著兩個泵的活塞:一根上升時另一根下降。主動件是槓桿。
import { deg } from "./kit.js";
import { rackOffset, circularPitch } from "./gears.js";

export const GEAR = { center: [0, 0, 0], teeth: 18, radius: 1.05 };
const PITCH = circularPitch(GEAR);
const LEFT = { origin: [-GEAR.radius, 0, 0], dir: [0, 1, 0], pitch: PITCH };
const RIGHT = { origin: [GEAR.radius, 0, 0], dir: [0, 1, 0], pitch: PITCH };
const LEVER = deg(-25); // 槓桿的方向(左上到右下)
const RANGE = [deg(-30), deg(30)];

/** 槓桿轉 angle:左右齒條的高度 */
export const racks = (angle) => ({ left: rackOffset(GEAR, LEFT, angle), right: rackOffset(GEAR, RIGHT, angle) });

const rack = (id, x, flip, length) => ({
  id,
  kind: "group",
  pieces: [
    { kind: "rack", teeth: 15, pitch: PITCH, depth: 0.32, width: 0.3, at: [x, 0, 0], angle: flip },
  ],
  length,
});

export default {
  figure: 127,
  parts: [
    {
      id: "gear",
      kind: "gear",
      teeth: GEAR.teeth,
      radius: GEAR.radius,
      width: 0.3,
      bore: 0.14,
      pieces: [
        { kind: "box", size: [5.6, 0.16, 0.1], at: [0, 0, -0.25], angle: LEVER },
        { kind: "cylinder", radius: 0.18, inner: 0.08, length: 0.15, at: [2.8 * Math.cos(LEVER), 2.8 * Math.sin(LEVER), -0.25] },
        { kind: "cylinder", radius: 0.18, inner: 0.08, length: 0.15, at: [-2.8 * Math.cos(LEVER), -2.8 * Math.sin(LEVER), -0.25] },
      ],
    },
    rack("left", -GEAR.radius, -Math.PI / 2),
    rack("right", GEAR.radius, Math.PI / 2),
  ],
  driver: { part: "gear", type: "rotation", range: RANGE },
  view: { direction: [0.06, 0.05, 1] },
  pose(angle) {
    const { left, right } = racks(angle);
    return { parts: { gear: { angle }, left: { position: [0, left, 0] }, right: { position: [0, right, 0] } }, readouts: [] };
  },
};
