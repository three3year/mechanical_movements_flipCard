// 第 127 種:氣泵的運動裝置。槓桿與正齒輪固定在同一根軸上;槓桿振動時齒輪來回轉動,
// 帶動兩側直立的齒條往復直線運動。兩根齒條接著兩個泵的活塞:一根上升時另一根下降。主動件是槓桿。
// 齒條的背面沿著兩根直立的導軌滑動,導軌上兩處有夾住齒條前後面的導板;齒輪軸裝在後面的軸承座上。
// 槓桿在齒輪後面、導軌的導板後面擺動(導軌、導板、軸承座是推斷;原圖的齒條接到畫面外的泵)。
import { deg } from "./kit.js";
import { rackOffset, circularPitch } from "./gears.js";
import { pedestal } from "./supports.js";

export const GEAR = { center: [0, 0, 0], teeth: 18, radius: 1.05 };
const PITCH = circularPitch(GEAR);
const LEFT = { origin: [-GEAR.radius, 0, 0], dir: [0, 1, 0], pitch: PITCH };
const RIGHT = { origin: [GEAR.radius, 0, 0], dir: [0, 1, 0], pitch: PITCH };
const LEVER = deg(-25); // 槓桿的方向(左上到右下)
const RANGE = [deg(-30), deg(30)];
const LEVER_Z = -0.42;
const RAIL_X = GEAR.radius + 0.54; // 導軌在齒條背面外側
const FLOOR = -3.9;

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
        { kind: "box", size: [5.6, 0.16, 0.1], at: [0, 0, LEVER_Z], angle: LEVER },
        { kind: "cylinder", radius: 0.18, inner: 0.08, length: 0.15, at: [2.8 * Math.cos(LEVER), 2.8 * Math.sin(LEVER), LEVER_Z] },
        { kind: "cylinder", radius: 0.18, inner: 0.08, length: 0.15, at: [-2.8 * Math.cos(LEVER), -2.8 * Math.sin(LEVER), LEVER_Z] },
        { kind: "cylinder", radius: 0.14, length: 1.0, at: [0, 0, -0.4] }, // 軸:往後伸進軸承座
      ],
    },
    rack("left", -GEAR.radius, -Math.PI / 2),
    rack("right", GEAR.radius, Math.PI / 2),
    {
      id: "frame",
      kind: "group",
      pieces: [
        ...pedestal({ at: [0, 0], z: -0.75, bore: 0.14, floor: FLOOR }),
        ...[-1, 1].flatMap((side) => [
          { kind: "box", size: [0.08, 7.4, 0.46], at: [side * RAIL_X, -0.2, 0] }, // 導軌
          { kind: "box", size: [0.8, 0.18, 0.6], at: [side * RAIL_X, FLOOR - 0.09, 0] },
          // 兩處導板夾住齒條背部的前後面
          ...[-1.9, 1.9].flatMap((y) => [
            { kind: "box", size: [0.32, 0.3, 0.04], at: [side * (RAIL_X - 0.16), y, 0.19] },
            { kind: "box", size: [0.32, 0.3, 0.04], at: [side * (RAIL_X - 0.16), y, -0.19] },
          ]),
        ]),
      ],
    },
  ],
  driver: { part: "gear", type: "rotation", range: RANGE },
  targets: ["left", "right"], // 往復直線運動的兩根齒條(泵的活塞)
  view: { direction: [0.06, 0.05, 1] },
  pose(angle) {
    const { left, right } = racks(angle);
    return { parts: { gear: { angle }, left: { position: [0, left, 0] }, right: { position: [0, right, 0] } }, readouts: [] };
  },
};
