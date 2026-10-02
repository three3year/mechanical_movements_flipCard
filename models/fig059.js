// 第 59 種:以齒輪傳遞兩種速度。下方三個皮帶輪:最左是鬆動輪(原圖皮帶在此);
// 中間的固定在小齒輪所在的軸上,右側的固定在空心軸上、空心軸一端裝著大正齒輪。
// 皮帶在中間輪時,小齒輪帶下方軸上的大齒輪,傳出較慢的運動;在右側輪時,大正齒輪帶下方的小齒輪,
// 傳出較快的速度——快慢與齒輪的直徑成比例。
import { X } from "./kit.js";
import { meshAngle } from "./gears.js";
import { pulleyOnX, belt, driven, travel } from "./belt-shift.js";

const DRUM = { y: 3.3, radius: 1.0, x: 0.6 };
const R = 1.05;
const PX = { loose: -0.55, middle: 0.05, right: 0.65 };
const M = 0.075;
const LOWER_Y = -1.35;
const SLOW = { x: -1.6, up: 12, down: 24 }; // 左端:小齒輪(上)帶大齒輪(下)
const FAST = { x: 1.75, up: 24, down: 12 }; // 右端:大正齒輪(上)帶小齒輪(下)
const gearOf = (n, y) => ({ center: [0, y, 0], axis: X, teeth: n, radius: (n * M) / 2 });

export function speeds(angle, state) {
  const belted = driven(angle, DRUM.radius, R);
  if (state === "loose") return { loose: belted, middle: 0, right: 0, lower: 0 };
  const pair = state === "middle" ? SLOW : FAST;
  const lower = meshAngle(gearOf(pair.up, 0), gearOf(pair.down, LOWER_Y), belted);
  const other = state === "middle" ? FAST : SLOW;
  const back = meshAngle(gearOf(other.down, LOWER_Y), gearOf(other.up, 0), lower);
  return {
    loose: 0,
    middle: state === "middle" ? belted : back,
    right: state === "right" ? belted : back,
    lower,
  };
}

const gearPart = (id, n, y, x) => ({ id, kind: "gear", axis: X, center: [x, y, 0], teeth: n, radius: (n * M) / 2, width: 0.34, web: false });

export default {
  figure: 59,
  parts: [
    pulleyOnX("drum", DRUM.x, DRUM.y, DRUM.radius, 1.65, { pieces: [{ kind: "cylinder", radius: 0.09, length: 3.0 }] }),
    pulleyOnX("loose", PX.loose, 0, R, 0.55),
    pulleyOnX("middle", PX.middle, 0, R, 0.55),
    pulleyOnX("right", PX.right, 0, R, 0.55),
    gearPart("slowUp", SLOW.up, 0, SLOW.x),
    gearPart("slowDown", SLOW.down, LOWER_Y, SLOW.x),
    gearPart("fastUp", FAST.up, 0, FAST.x),
    gearPart("fastDown", FAST.down, LOWER_Y, FAST.x),
    { id: "shafts", kind: "group", pieces: [{ kind: "cylinder", radius: 0.1, length: 3.8, axis: X, at: [0.1, 0, 0] }, { kind: "cylinder", radius: 0.1, length: 3.9, axis: X, at: [0.1, LOWER_Y, 0] }] },
    { id: "belt", kind: "belt" },
  ],
  driver: { part: "drum", type: "rotation" },
  states: {
    options: [
      { id: "loose", label: "鬆動輪(停)" },
      { id: "middle", label: "中間輪(慢)" },
      { id: "right", label: "右側輪(快)" },
    ],
    initial: "loose",
  },
  view: { direction: [0.05, 0.1, 1], fov: 18 },
  pose(angle, state = "loose") {
    const s = speeds(angle, state);
    const path = belt(PX[state], DRUM.y, DRUM.radius, 0, R);
    return {
      parts: {
        drum: { angle },
        loose: { angle: s.loose },
        middle: { angle: s.middle },
        right: { angle: s.right },
        slowUp: { angle: s.middle },
        fastUp: { angle: s.right },
        slowDown: { angle: s.lower },
        fastDown: { angle: s.lower },
      },
      paths: { belt: { points: path.points, closed: true, phase: travel(angle, DRUM.radius) } },
      readouts: [],
    };
  },
};
