// 第 129 種:中式絞盤,與千分螺桿(第 111 種)同一個原理。絞盤鼓輪分大小兩段,繩在兩段上的纏繞方向相反,
// 中間垂下的繩圈掛著一個滑輪(下接吊鉤)。轉一圈時,大段捲進一個大圓周、小段放出一個小圓周,
// 滑輪上升兩者圓周差的一半。主動件是絞盤(在可捲的圈數內往返)。
import { X, TAU, routeRope, Z } from "./kit.js";

const R1 = 0.62; // 大段半徑
const R2 = 0.42; // 小段半徑
const DRUM_Y = 2.2;
const X1 = -0.9; // 繩從大段垂下的位置
const X2 = 0.75; // 繩從小段垂下的位置
const PULLEY = { radius: (X2 - X1) / 2, x: (X1 + X2) / 2 };
const Y0 = -0.6; // 滑輪起始高度
const TURNS = 2.5;

/** 絞盤轉 theta(大段捲進為正):滑輪的高度 */
export const pulleyY = (theta) => Y0 + ((R1 - R2) * theta) / 2;
export const radii = [R1, R2];

export default {
  figure: 129,
  parts: [
    {
      id: "drum",
      kind: "group",
      center: [0, DRUM_Y, 0],
      axis: X,
      spin: R1,
      spinOffset: -2.0,
      pieces: [
        { kind: "cylinder", radius: R1, length: 1.4, at: [0, 0, -1.4], mark: true },
        { kind: "cylinder", radius: R2, length: 1.2, at: [0, 0, 1.2], mark: true },
        { kind: "cylinder", radius: R1 + 0.3, length: 0.12, at: [0, 0, -2.15] },
        { kind: "cylinder", radius: R1 + 0.3, length: 0.12, at: [0, 0, -0.65] },
        { kind: "cylinder", radius: R2 + 0.25, length: 0.12, at: [0, 0, 1.85] },
        { kind: "cylinder", radius: 0.12, length: 4.8, at: [0, 0, 0] },
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.22, DRUM_Y + 1.6, 0.4], at: [-2.45, DRUM_Y / 2 - 0.55, 0] },
        { kind: "box", size: [0.22, DRUM_Y + 1.6, 0.4], at: [2.25, DRUM_Y / 2 - 0.55, 0] },
        { kind: "box", size: [5.6, 0.12, 0.8], at: [-0.1, -1.4, 0] },
      ],
    },
    {
      id: "pulley",
      kind: "pulley",
      style: "disc",
      center: [PULLEY.x, Y0, 0],
      radius: PULLEY.radius,
      width: 0.24,
      pieces: [
        { kind: "box", size: [0.3, 0.75, 0.3], at: [0, -0.3, 0.2] },
        { kind: "tube", points: [[0, -0.7, 0.2], [0.02, -1.0, 0.2], [0.2, -1.2, 0.2], [0.3, -1.0, 0.2], [0.25, -0.85, 0.2]], radius: 0.05 },
      ],
    },
    { id: "rope", kind: "rope" },
  ],
  driver: { part: "drum", type: "rotation", range: [0, TURNS * TAU] },
  view: { direction: [0.06, 0.08, 1] },
  pose(theta) {
    const y = pulleyY(theta);
    const rope = routeRope([
      { point: [X1, DRUM_Y - R1, 0] },
      { circle: { center: [PULLEY.x, y, 0], axis: Z, radius: PULLEY.radius, sense: 1 } },
      { point: [X2, DRUM_Y - R2, 0] },
    ]);
    // 繩往大段那頭走 R1·θ;滑輪跟著繩轉
    return {
      parts: { drum: { angle: theta }, pulley: { position: [PULLEY.x, y, 0], angle: -(((R1 + R2) / 2) * theta) / PULLEY.radius } },
      paths: { rope: { points: rope.points, closed: false, phase: -R1 * theta } },
      readouts: [],
    };
  },
};

