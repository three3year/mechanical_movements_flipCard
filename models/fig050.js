// 第 50 種:萬向接頭(條目 50–51 的第一種)。兩根軸的叉頭之間夾一個 8 字形的中間件,
// 中間件兩端各有一個十字銷,等於兩個萬向接頭串在一起。中間件兩端的叉在同一平面,
// 兩邊的夾角相等,第一個接頭造成的快慢變化被第二個抵消,輸出軸與輸入軸等速轉。
import { norm } from "./kit.js";
import { hooke, unwrap } from "./hooke.js";

const A1 = norm([1, 0.5, 0]); // 輸入軸:由左下往第一個接頭
const AM = [1, 0, 0]; // 中間件
const A3 = norm([1, -0.5, 0]); // 輸出軸:由第二個接頭往右下
const J = 0.78; // 兩個接頭離中心的距離
const PIN = 0.42;

const fork = (back) => [
  { kind: "box", size: [2 * PIN + 0.2, 0.22, 0.16], at: [0, 0, back * 0.5] },
  { kind: "box", size: [0.14, 0.24, 0.62], at: [PIN, 0, back * 0.2] },
  { kind: "box", size: [0.14, 0.24, 0.62], at: [-PIN, 0, back * 0.2] },
  { kind: "cylinder", radius: 0.13, length: 2.2, at: [0, 0, back * 1.6] },
];

const yoke = (id, axis, at, back) => ({ id, kind: "group", axis, center: at, spin: 0.55, spinOffset: back * 1.4, pieces: fork(back) });

const eye = (z) => ({
  kind: "tube",
  points: Array.from({ length: 36 }, (_, i) => {
    const t = (i / 36) * 2 * Math.PI;
    return [PIN * Math.cos(t), 0, z + 0.55 * Math.sin(t)];
  }),
  radius: 0.08,
  closed: true,
});

const crossPart = (id, at) => ({
  id,
  kind: "group",
  center: at,
  arrow: false,
  pieces: [
    { kind: "cylinder", radius: 0.055, length: 2 * PIN + 0.1, axis: [1, 0, 0] },
    { kind: "cylinder", radius: 0.055, length: 2 * PIN + 0.1, axis: [0, 1, 0] },
    { kind: "box", size: [0.15, 0.15, 0.15] },
  ],
});

const C1 = hooke(A1, 0, AM).angle2;
const C3 = hooke(AM, C1, A3).angle2;

/** 輸入軸轉 angle 時:中間件、輸出軸的轉角(連續)與兩個十字的朝向 */
export function doubleJoint(angle) {
  const first = hooke(A1, angle, AM);
  const middle = unwrap(first.angle2, angle + C1);
  const second = hooke(AM, middle, A3);
  const output = unwrap(second.angle2, angle + C3);
  return { middle, output, cross1: first.cross, cross2: second.cross };
}

export default {
  figure: 50,
  parts: [
    yoke("input", A1, [-J, 0, 0], -1),
    yoke("output", A3, [J, 0, 0], 1),
    { id: "middle", kind: "group", axis: AM, center: [0, 0, 0], spin: 0.5, pieces: [eye(-J), eye(J), { kind: "box", size: [0.2, 0.2, 0.5] }] },
    crossPart("cross1", [-J, 0, 0]),
    crossPart("cross2", [J, 0, 0]),
  ],
  driver: { part: "input", type: "rotation" },
  view: { direction: [0.05, 0.4, 1] },
  pose(angle) {
    const { middle, output, cross1, cross2 } = doubleJoint(angle);
    return {
      parts: {
        input: { angle },
        middle: { angle: middle },
        output: { angle: output },
        cross1: { rotation: cross1 },
        cross2: { rotation: cross2 },
      },
      readouts: [],
    };
  },
};
