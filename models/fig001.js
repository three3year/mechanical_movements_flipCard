// 第 1 種:簡單皮帶輪與開口皮帶,兩輪同向旋轉。
import { Z, routeBelt, beltTravel, wheelAngle } from "./kit.js";

const top = { center: [0, 1.5, 0], axis: Z, radius: 0.9, sense: 1 };
const bottom = { center: [0, -1.5, 0], axis: Z, radius: 0.8, sense: 1 };
const belt = routeBelt([top, bottom]);

export default {
  figure: 1,
  parts: [
    { id: "driver", kind: "pulley", style: "spoked", center: top.center, axis: Z, radius: top.radius, width: 0.3 },
    { id: "driven", kind: "pulley", style: "spoked", center: bottom.center, axis: Z, radius: bottom.radius, width: 0.3 },
    { id: "belt", kind: "belt" },
  ],
  driver: { part: "driver", type: "rotation" },
  pose(angle) {
    const travel = beltTravel(angle, top.radius, top.sense);
    return {
      parts: {
        driver: { angle },
        driven: { angle: wheelAngle(travel, bottom.radius, bottom.sense) },
      },
      paths: { belt: { points: belt.points, closed: true, phase: travel } },
      readouts: [],
    };
  },
};
