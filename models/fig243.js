// 第 243 種:透過皮帶輪與皮帶,把動力從一根水平軸傳到兩根垂直軸。中間的大皮帶輪裝在水平軸上(主動件),
// 皮帶從它下方繞過,兩側各經一個小導輪托起,再水平地繞到左右兩根垂直軸的皮帶筒上;
// 皮帶的回程從兩個皮帶筒的後方直接相連。
// 推斷:皮帶回程的走法(原圖只看得到前方一股)。
import { Y, Z, routeBelt, beltTravel, wheelAngle } from "./kit.js";

const LEVEL = 0.25; // 前股皮帶的高度
const DRUM_R = 0.36;
const FRONT = DRUM_R; // 前股所在的平面 z
const MAIN = { center: [0, LEVEL + 0.12, FRONT], axis: Z, radius: 0.62, sense: 1 };
const G = 0.27;
const GUIDE_L = { center: [-1.45, LEVEL - G - 0.1, FRONT], axis: Z, radius: G, sense: -1 };
const GUIDE_R = { center: [1.45, LEVEL - G - 0.1, FRONT], axis: Z, radius: G, sense: -1 };
const DRUM_L = { center: [-3.1, LEVEL, 0], axis: Y, radius: DRUM_R, sense: 1 };
const DRUM_R_ = { center: [3.1, LEVEL, 0], axis: Y, radius: DRUM_R, sense: 1 };
const belt = routeBelt([DRUM_L, GUIDE_L, MAIN, GUIDE_R, DRUM_R_]);

/** 主動輪轉 angle 時,各輪的轉角 */
export function turns(angle) {
  const travel = beltTravel(angle, MAIN.radius, MAIN.sense);
  return {
    travel,
    left: wheelAngle(travel, DRUM_R, DRUM_L.sense),
    right: wheelAngle(travel, DRUM_R, DRUM_R_.sense),
    guideL: wheelAngle(travel, G, GUIDE_L.sense),
    guideR: wheelAngle(travel, G, GUIDE_R.sense),
  };
}

// 垂直軸:長軸+帶上下凸緣的皮帶筒
const spindle = (id, c) => ({
  id,
  kind: "drum",
  center: c.center,
  axis: Y,
  radius: DRUM_R,
  width: 0.7,
  pieces: [
    { kind: "cylinder", radius: 0.12, length: 3.4 },
    { kind: "cylinder", radius: 0.6, length: 0.08, at: [0, 0, 0.38] },
    { kind: "cylinder", radius: 0.6, length: 0.08, at: [0, 0, -0.38] },
  ],
});
const guide = (id, c) => ({ id, kind: "pulley", style: "disc", center: c.center, axis: Z, radius: G, width: 0.16 });

export default {
  figure: 243,
  parts: [
    {
      id: "main",
      kind: "pulley",
      style: "disc",
      center: MAIN.center,
      axis: Z,
      radius: MAIN.radius,
      width: 0.22,
      pieces: [{ kind: "cylinder", radius: 0.08, length: 0.9, at: [0, 0, 0.35] }],
    },
    guide("guideL", GUIDE_L),
    guide("guideR", GUIDE_R),
    spindle("left", DRUM_L),
    spindle("right", DRUM_R_),
    { id: "belt", kind: "belt" },
  ],
  driver: { part: "main", type: "rotation" },
  view: { direction: [0.05, 0.22, 1] },
  pose(angle) {
    const t = turns(angle);
    return {
      parts: { main: { angle }, guideL: { angle: t.guideL }, guideR: { angle: t.guideR }, left: { angle: t.left }, right: { angle: t.right } },
      paths: { belt: { points: belt.points, closed: true, phase: t.travel } },
      readouts: [],
    };
  },
};
