// 第 4 種:把運動傳到與其成直角、但兩軸位於同一平面上的軸。
// 上方大輪的皮帶交叉而下,經左右兩個導引輪轉成水平,繞過下方軸直立的皮帶輪。
import { Y, Z, routeBelt, beltTravel, wheelAngle } from "./kit.js";

const TOP = { center: [0, 1.8, 0], axis: Z, radius: 0.8, sense: 1 };
const G = 0.3;
const LOW = -1.5;
const RIGHT = { center: [1.5, LOW, 0], axis: Z, radius: G, sense: -1 };
const LEFT = { center: [-1.5, LOW, 0], axis: Z, radius: G, sense: -1 };
// 直立軸的皮帶輪略往前,皮帶繞過它的前半圈;兩軸仍同在 x = 0 的平面上
const FLAT = { center: [0, LOW - G - 0.05, 0.55], axis: Y, radius: 0.45, sense: -1 };
const belt = routeBelt([TOP, RIGHT, FLAT, LEFT]);

const guide = (id, c) => ({ id, kind: "pulley", style: "disc", center: c.center, axis: Z, radius: G, width: 0.2 });

export default {
  figure: 4,
  parts: [
    { id: "driver", kind: "pulley", style: "spoked", center: TOP.center, axis: Z, radius: TOP.radius, width: 0.3 },
    guide("guideRight", RIGHT),
    guide("guideLeft", LEFT),
    { id: "driven", kind: "pulley", style: "disc", center: FLAT.center, axis: Y, radius: FLAT.radius, width: 0.3 },
    { id: "spindle", kind: "shaft", center: FLAT.center, axis: Y, radius: 0.06, length: 1, marker: true },
    { id: "belt", kind: "belt" },
  ],
  driver: { part: "driver", type: "rotation" },
  view: { direction: [0.3, 0.75, 1] },
  pose(angle) {
    const travel = beltTravel(angle, TOP.radius, TOP.sense);
    const driven = wheelAngle(travel, FLAT.radius, FLAT.sense);
    return {
      parts: {
        driver: { angle },
        guideRight: { angle: wheelAngle(travel, G, RIGHT.sense) },
        guideLeft: { angle: wheelAngle(travel, G, LEFT.sense) },
        driven: { angle: driven },
        spindle: { angle: driven },
      },
      paths: { belt: { points: belt.points, closed: true, phase: travel } },
      readouts: [],
    };
  },
};
