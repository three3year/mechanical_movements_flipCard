// 第 51 種:萬向接頭(條目 50–51 的第二種)。兩根軸的端頭各彎成一個環,兩環互相套住,
// 中間的十字(銷)連著兩環;兩軸成一角度,仍能把旋轉從一軸傳到另一軸。
// 兩軸不在一直線上時,輸出軸的轉速在一圈中週期性地快慢變化(平均轉速相同)。
import { norm } from "./kit.js";
import { hooke, unwrap } from "./hooke.js";

const A1 = norm([1, 0.38, 0]); // 輸入軸:由左下往接頭
const A2 = norm([1, -0.38, 0]); // 輸出軸:由接頭往右下
const RING = { x: 0.5, z: 0.72, wire: 0.075 };

const ringPoints = Array.from({ length: 40 }, (_, i) => {
  const t = (i / 40) * 2 * Math.PI;
  return [RING.x * Math.cos(t), 0, RING.z * Math.sin(t) + 0.12];
});

const yoke = (id, axis, back) => ({
  id,
  kind: "group",
  axis,
  center: [0, 0, 0],
  spin: 0.6,
  spinOffset: back * 1.6,
  pieces: [
    { kind: "tube", points: ringPoints.map(([x, y, z]) => [x, y, back * z]), radius: RING.wire, closed: true },
    { kind: "cylinder", radius: 0.12, length: 2.4, at: [0, 0, back * 2.0] },
    { kind: "box", size: [0.2, 0.2, 0.2], at: [0, 0, back * (RING.z + 0.12)], accent: true },
  ],
});

const C0 = hooke(A1, 0, A2).angle2;

/** 輸入軸轉 angle 時:輸出軸轉角(連續)、十字朝向 */
export function joint(angle) {
  const h = hooke(A1, angle, A2);
  return { ...h, angle2: unwrap(h.angle2, angle + C0) };
}
export const shaftAngle = Math.acos(A1[0] * A2[0] + A1[1] * A2[1] + A1[2] * A2[2]);

export default {
  figure: 51,
  parts: [
    yoke("input", A1, -1),
    yoke("output", A2, 1),
    {
      id: "cross",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "cylinder", radius: 0.06, length: 2 * RING.x + 0.1, axis: [1, 0, 0] },
        { kind: "cylinder", radius: 0.06, length: 2 * RING.x + 0.1, axis: [0, 1, 0] },
        { kind: "box", size: [0.18, 0.18, 0.18] },
      ],
    },
  ],
  driver: { part: "input", type: "rotation" },
  view: { direction: [0.05, 0.35, 1] },
  pose(angle) {
    const { angle2, cross } = joint(angle);
    return { parts: { input: { angle }, output: { angle: angle2 }, cross: { rotation: cross } }, readouts: [] };
  },
};
