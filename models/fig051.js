// 第 51 種:萬向接頭(條目 50–51 的第二種)。兩根軸的端頭各彎成一個環,兩環互相套住,
// 中間的十字(銷)連著兩環;兩軸成一角度,仍能把旋轉從一軸傳到另一軸。
// 兩軸不在一直線上時,輸出軸的轉速在一圈中週期性地快慢變化(平均轉速相同)。
// 結構推斷:原圖兩軸畫到圖邊就截斷、沒畫軸承;接頭要能傳動,兩軸各自得架在固定的軸承上。
// 這裡在兩軸的外端各補一個軸承座(套在軸上的軸承環 + 立在底板上的座),底板連著兩座,
// 讓讀者看出兩軸是各自被固定住、只能轉動,夾角由軸承座決定。不改接頭幾何。
import { norm, scale } from "./kit.js";
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

// 軸承座:套在軸上的軸承環(軸向同軸),與一個從底板立起來的座
const BASE_TOP = -1.75;
function seat(axis, along) {
  const c = scale(axis, along);
  return [
    { kind: "cylinder", axis, radius: 0.23, inner: 0.13, length: 0.36, at: c },
    { kind: "box", size: [0.44, c[1] - BASE_TOP, 0.44], at: [c[0], (c[1] + BASE_TOP) / 2, c[2]] },
  ];
}

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
    {
      id: "bearings",
      kind: "group",
      pieces: [
        ...seat(A1, -2.7), // 輸入軸外端
        ...seat(A2, 2.7), // 輸出軸外端
        { kind: "box", size: [6.2, 0.1, 1.0], at: [0, BASE_TOP - 0.05, 0] }, // 底板
      ],
    },
  ],
  driver: { part: "input", type: "rotation" },
  target: "output", // 被接頭帶動的輸出軸
  view: { direction: [0.05, 0.35, 1] },
  pose(angle) {
    const { angle2, cross } = joint(angle);
    return { parts: { input: { angle }, output: { angle: angle2 }, cross: { rotation: cross } }, readouts: [] };
  },
};
