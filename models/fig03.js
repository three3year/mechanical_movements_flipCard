// 第 3 種:用導引皮帶輪把運動傳到與其成直角的軸上。兩個導引輪各導一葉皮帶,
// 把大輪(軸朝前後)的水平皮帶轉成垂直,繞到下方軸朝左右的皮帶筒上。
import { X, Z, routeBelt, beltTravel, wheelAngle } from "./kit.js";

const WHEEL = { center: [1.4, 1.6, 0], axis: Z, radius: 0.95, sense: 1 };
const DRUM = { center: [-1.2, -1.8, 0], axis: X, radius: 0.45, sense: 1 };
const G = 0.3;
const DRUM_X = DRUM.center[0];
// 上葉:由大輪頂端水平往左,經前方導引輪轉下;下葉:由後方導引輪轉上,水平回到大輪底端
const GUIDE_FRONT = { center: [DRUM_X + G, WHEEL.center[1] + WHEEL.radius - G, DRUM.radius], axis: Z, radius: G, sense: 1 };
const GUIDE_BACK = { center: [DRUM_X + G, WHEEL.center[1] - WHEEL.radius - G, -DRUM.radius], axis: Z, radius: G, sense: -1 };
const belt = routeBelt([WHEEL, GUIDE_FRONT, DRUM, GUIDE_BACK]);

const guide = (id, c) => ({ id, kind: "pulley", style: "disc", center: c.center, axis: Z, radius: G, width: 0.18 });

export default {
  figure: 3,
  parts: [
    { id: "driver", kind: "pulley", style: "spoked", center: WHEEL.center, axis: Z, radius: WHEEL.radius, width: 0.3 },
    guide("guideFront", GUIDE_FRONT),
    guide("guideBack", GUIDE_BACK),
    { id: "driven", kind: "drum", center: DRUM.center, axis: X, radius: DRUM.radius, width: 1.1 },
    { id: "belt", kind: "belt" },
  ],
  driver: { part: "driver", type: "rotation" },
  view: { direction: [0.75, 0.35, 1] },
  pose(angle) {
    const travel = beltTravel(angle, WHEEL.radius, WHEEL.sense);
    return {
      parts: {
        driver: { angle },
        guideFront: { angle: wheelAngle(travel, G, GUIDE_FRONT.sense) },
        guideBack: { angle: wheelAngle(travel, G, GUIDE_BACK.sense) },
        driven: { angle: wheelAngle(travel, DRUM.radius, DRUM.sense) },
      },
      paths: { belt: { points: belt.points, closed: true, phase: travel } },
      readouts: [],
    };
  },
};
