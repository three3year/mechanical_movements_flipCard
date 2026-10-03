// 第 11 種:不用導引皮帶輪達成與第 3 種相同的結果:上方皮帶筒的軸朝左右,
// 下方皮帶輪的軸朝前後,皮帶在兩輪之間扭轉四分之一圈。
import { X, Z, routeBelt, beltTravel, wheelAngle } from "./kit.js";

const DRUM = { center: [0, 1.7, 0], axis: X, radius: 0.5, sense: 1 };
const WHEEL = { center: [0, -1.6, 0], axis: Z, radius: 0.85, sense: 1 };
const belt = routeBelt([DRUM, WHEEL]);

export default {
  figure: 11,
  parts: [
    { id: "driver", kind: "drum", center: DRUM.center, axis: X, radius: DRUM.radius, width: 1.1 },
    { id: "driven", kind: "pulley", style: "spoked", center: WHEEL.center, axis: Z, radius: WHEEL.radius, width: 0.3 },
    { id: "belt", kind: "belt" },
  ],
  driver: { part: "driver", type: "rotation" },
  target: "driven", // 軸朝前後的從動輪
  view: { direction: [0.8, 0.35, 1] },
  pose(angle) {
    const travel = beltTravel(angle, DRUM.radius, DRUM.sense);
    return {
      parts: {
        driver: { angle },
        driven: { angle: wheelAngle(travel, WHEEL.radius, WHEEL.sense) },
      },
      paths: { belt: { points: belt.points, closed: true, phase: travel } },
      readouts: [],
    };
  },
};
