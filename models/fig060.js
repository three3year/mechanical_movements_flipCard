// 第 60 種:以皮帶傳遞兩種速度。上方軸有一大一小兩個皮帶輪;下方軸有四個皮帶輪,最外側兩個鬆動、
// 內側兩個固定。原圖左皮帶在鬆動輪、右皮帶在固定輪,下方軸由小輪帶動、轉得較慢;
// 把右皮帶移到鬆動輪、左皮帶移到固定輪,下方軸改由大輪帶動,轉得較快。
import { pulleyOnX, belt, driven, travel } from "./belt-shift.js";

const TOP_Y = 3.45;
const LEFT_TOP = { x: -1.55, radius: 1.25 };
const RIGHT_TOP = { x: 0.95, radius: 0.72 };
const R = 1.2;
const PX = { leftLoose: -1.85, leftFast: -1.3, rightFast: 0.68, rightLoose: 1.23 };
const BELTS = {
  slow: { left: "leftLoose", right: "rightFast" },
  fast: { left: "leftFast", right: "rightLoose" },
};

export function speeds(angle, state) {
  const viaLeft = driven(angle, LEFT_TOP.radius, R);
  const viaRight = driven(angle, RIGHT_TOP.radius, R);
  const lower = state === "fast" ? viaLeft : viaRight;
  return {
    lower,
    leftLoose: state === "slow" ? viaLeft : 0,
    rightLoose: state === "fast" ? viaRight : 0,
  };
}

export default {
  figure: 60,
  parts: [
    pulleyOnX("top", LEFT_TOP.x, TOP_Y, LEFT_TOP.radius, 1.1, {
      pieces: [
        { kind: "cylinder", radius: RIGHT_TOP.radius, length: 0.95, at: [0, 0, RIGHT_TOP.x - LEFT_TOP.x] },
        { kind: "cylinder", radius: 0.12, length: 5.2, at: [0, 0, 1.2] },
      ],
    }),
    pulleyOnX("leftLoose", PX.leftLoose, 0, R, 0.52),
    pulleyOnX("leftFast", PX.leftFast, 0, R, 0.52),
    pulleyOnX("rightFast", PX.rightFast, 0, R, 0.52),
    pulleyOnX("rightLoose", PX.rightLoose, 0, R, 0.52),
    { id: "shaft", kind: "cylinder", axis: [1, 0, 0], radius: 0.12, length: 5.6, center: [-0.3, 0, 0], arrow: false },
    { id: "beltLeft", kind: "belt" },
    { id: "beltRight", kind: "belt" },
  ],
  driver: { part: "top", type: "rotation" },
  states: {
    options: [
      { id: "slow", label: "慢(左鬆、右固定)" },
      { id: "fast", label: "快(左固定、右鬆)" },
    ],
    initial: "slow",
  },
  view: { direction: [0.05, 0.1, 1], fov: 18 },
  pose(angle, state = "slow") {
    const s = speeds(angle, state);
    const b = BELTS[state];
    const left = belt(PX[b.left], TOP_Y, LEFT_TOP.radius, 0, R);
    const right = belt(PX[b.right], TOP_Y, RIGHT_TOP.radius, 0, R);
    return {
      parts: {
        top: { angle },
        leftLoose: { angle: s.leftLoose },
        leftFast: { angle: s.lower },
        rightFast: { angle: s.lower },
        rightLoose: { angle: s.rightLoose },
        shaft: { angle: s.lower },
      },
      paths: {
        beltLeft: { points: left.points, closed: true, phase: travel(angle, LEFT_TOP.radius) },
        beltRight: { points: right.points, closed: true, phase: travel(angle, RIGHT_TOP.radius) },
      },
      readouts: [],
    };
  },
};
