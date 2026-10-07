// 第 352 種:第 129 種中式絞盤的另一種配置。A 形架頂上兩個導輪,絞盤的鼓輪分大小兩段裝在架腳之間;
// 一條繩的兩端分別纏在大段與小段上(纏繞方向相反),中間往上繞過兩個導輪,再垂下一個繩圈吊著重物的滑輪。
// 轉一圈時大段捲進一個大圓周、小段放出一個小圓周,重物上升兩者差的一半。主動件是絞盤(以手柄轉動)。
// 推斷:鼓輪的兩段半徑與可轉的圈數;手柄的形狀。
// 繩不打滑:大段捲進的速度是 R1·ω、小段放出的是 R2·ω,所以左導輪以 R1·ω、右導輪以 R2·ω 的表面速度轉,
// 吊重物的滑輪一邊升一邊以兩者平均的表面速度轉;繩上的色段跟著繩走(大段捲進多少,繩頭就往那邊收多少)。
import { X, Z, TAU, clamp, routeRope } from "./kit.js";

const R1 = 0.48; // 大段
const R2 = 0.3; // 小段
const DRUM_Y = -2.2;
const X1 = -0.65; // 大段在 x 的位置
const X2 = 1.05; // 小段在 x 的位置
const G = { left: [-0.55, 1.75, 0], right: [0.55, 1.75, 0], r: 0.17 };
const PULLEY = 0.32;
export const TURNS = 3;
export const RANGE = [0, TURNS * TAU];
const Y0 = -0.4; // 重物滑輪的起始高度

/** 絞盤轉 theta → 重物滑輪的高度 */
export const pulleyY = (theta) => Y0 + ((R1 - R2) * clamp(theta, ...RANGE)) / 2;
export const radii = [R1, R2];
/** 絞盤轉 theta → 左、右導輪與吊重滑輪的轉角(繩不打滑) */
export const sheaves = (theta0) => {
  const theta = clamp(theta0, ...RANGE);
  return { left: (R1 * theta) / G.r, right: (R2 * theta) / G.r, pulley: (-(R1 + R2) * theta) / (2 * PULLEY) };
};

export default {
  figure: 352,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.25, 5.4, 0.3], at: [-1.55, -0.3, -0.4], angle: -0.38 },
        { kind: "box", size: [0.25, 5.4, 0.3], at: [1.55, -0.3, -0.4], angle: 0.38 },
        { kind: "box", size: [1.6, 0.3, 0.4], at: [0, 2.15, -0.4] },
        { kind: "cylinder", radius: 0.06, length: 0.5, at: G.left },
        { kind: "cylinder", radius: 0.06, length: 0.5, at: G.right },
      ],
    },
    { id: "guideL", kind: "pulley", style: "disc", center: G.left, radius: G.r, width: 0.12 },
    { id: "guideR", kind: "pulley", style: "disc", center: G.right, radius: G.r, width: 0.12 },
    {
      id: "drum",
      kind: "group",
      axis: X,
      center: [0, DRUM_Y, 0],
      spin: R1,
      spinOffset: X1,
      pieces: [
        { kind: "cylinder", radius: 0.07, length: 4.6 },
        { kind: "cylinder", radius: R1, length: 1.0, at: [0, 0, X1], mark: true },
        { kind: "cylinder", radius: R2, length: 0.7, at: [0, 0, X2], mark: true },
        // 手柄(左端穿過鼓輪的兩根撬棒)
        { kind: "box", size: [0.06, 1.6, 0.06], at: [0, 0, -1.6] },
        { kind: "box", size: [1.6, 0.06, 0.06], at: [0, 0, -1.6] },
      ],
    },
    { id: "pulley", kind: "pulley", style: "disc", radius: PULLEY, width: 0.12 },
    { id: "weight", kind: "lathe", axis: [0, 1, 0], profile: [[0, -0.7], [0.42, -0.7], [0.32, 0], [0.12, 0.05], [0, 0.05]] },
    { id: "rope", kind: "rope" },
  ],
  driver: { part: "drum", type: "rotation", range: RANGE, initial: 0 },
  target: "weight", // 被吊起的重物
  view: { direction: [0.06, 0.06, 1] },
  pose(theta0) {
    const theta = clamp(theta0, ...RANGE);
    const y = pulleyY(theta);
    const z = 0;
    const route = routeRope([
      { point: [X1, DRUM_Y + R1, z] },
      { circle: { center: [G.left[0], G.left[1], z], axis: Z, radius: G.r, sense: -1 } },
      { circle: { center: [0, y, z], axis: Z, radius: PULLEY, sense: 1 } },
      { circle: { center: [G.right[0], G.right[1], z], axis: Z, radius: G.r, sense: -1 } },
      { point: [X2, DRUM_Y + R2, z] },
    ]);
    return {
      parts: {
        drum: { angle: theta },
        guideL: { angle: sheaves(theta).left },
        guideR: { angle: sheaves(theta).right },
        pulley: { position: [0, y, z], angle: sheaves(theta).pulley },
        weight: { position: [0, y - PULLEY - 0.06, z] },
      },
      paths: { rope: { points: route.points, closed: false, phase: -R1 * theta } },
      readouts: [],
    };
  },
};
