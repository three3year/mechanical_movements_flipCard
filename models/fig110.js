// 第 110 種:捲線機上導引線繞到線軸的機構,把均勻的圓周運動轉換為均勻的直線運動。
// 上方的滾軸分兩段,各切細螺紋,左段右旋、右段左旋。下方與滾軸平行的心軸上有兩支搖臂,
// 各承載一個半螺帽,一個從上方、一個從下方扣在螺紋上;一個嚙合時另一個脫離。
// 把右端的槓桿往左或往右扳,心軸轉一點、換另一個半螺帽嚙合,心軸(連同搖臂)就朝相反方向橫移。
// 主動件是滾軸(在行程內往返);狀態是槓桿的位置。
import { X, deg, TAU, screwAdvance } from "./kit.js";
import { shape } from "./shapes.js";

const PITCH = 0.16;
const ROLLER_Y = 1.25;
const SPINDLE_Y = -0.4;
const ARMS = { left: -1.0, right: 0.75 }; // 左臂橫移到底也碰不到機架
const TURNS = 5;
const TILT = deg(6);

/** 滾軸轉 angle、槓桿在 state:心軸的橫移量 */
export const traverse = (angle, state) => (state === "right" ? 1 : -1) * screwAdvance(angle, PITCH);
export const pitch = PITCH;

const arm = (x, from) => [
  // 臂從滾軸的後方繞上去(不穿過滾軸),半螺帽從臂往前伸到滾軸的正上方 / 正下方
  { kind: "box", size: [0.22, ROLLER_Y - SPINDLE_Y + (from > 0 ? 0.45 : -0.45), 0.18], at: [x, (ROLLER_Y - SPINDLE_Y + (from > 0 ? 0.45 : -0.45)) / 2, -0.45] },
  { kind: "plate", shape: shape([[-0.25, 0], [0.25, 0], [0.25, 0.18], [-0.25, 0.18]]), thickness: 0.75, at: [x, ROLLER_Y - SPINDLE_Y + from * 0.31 - (from < 0 ? 0.18 : 0), -0.2] },
  { kind: "box", size: [0.5, 0.35, 0.8], at: [x, 0, -0.2] },
];

export default {
  figure: 110,
  parts: [
    {
      id: "roller",
      kind: "group",
      axis: X,
      center: [0, ROLLER_Y, 0],
      spin: 0.3,
      pieces: [
        { kind: "worm", radius: 0.3, length: 1.5, pitch: PITCH, thread: 0.05, hand: 1, at: [0, 0, -1.25] },
        { kind: "worm", radius: 0.3, length: 1.5, pitch: PITCH, thread: 0.05, hand: -1, at: [0, 0, 0.95] },
        { kind: "cylinder", radius: 0.18, length: 4.4 },
      ],
    },
    {
      id: "spindle",
      kind: "group",
      center: [0, SPINDLE_Y, 0],
      posed: true,
      arrow: false,
      pieces: [
        { kind: "cylinder", axis: X, radius: 0.1, length: 6.0, at: [0.8, 0, 0] },
        ...arm(ARMS.left, -1),
        ...arm(ARMS.right, 1),
        // 槓桿在機架外側夠遠處,心軸橫移到底也碰不到機架
        { kind: "box", size: [0.3, 0.3, 0.3], at: [3.5, 0, 0] },
        { kind: "box", size: [0.1, 2.0, 0.1], at: [3.5, 0, 0] },
        { kind: "sphere", radius: 0.12, at: [3.5, 1.0, 0] },
        { kind: "sphere", radius: 0.12, at: [3.5, -1.0, 0] },
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.45, 2.6, 0.8], at: [-2.35, 0.45, 0] },
        { kind: "box", size: [0.45, 2.6, 0.8], at: [2.15, 0.45, 0] },
      ],
    },
  ],
  driver: { part: "roller", type: "rotation", range: [0, TURNS * TAU] },
  target: "spindle", // 來回橫移的心軸(導引線)
  states: {
    options: [
      { id: "right", label: "槓桿扳向右(上方半螺帽嚙合)" },
      { id: "left", label: "槓桿扳向左(下方半螺帽嚙合)" },
    ],
    initial: "right",
  },
  view: { direction: [0.08, 0.12, 1] },
  pose(angle, state = "right") {
    // 心軸繞自己的軸轉一點,讓一個半螺帽貼上螺紋、另一個離開(以小角度表示)
    const tilt = state === "right" ? TILT : -TILT;
    return {
      parts: { roller: { angle }, spindle: { position: [traverse(angle, state), SPINDLE_Y, 0], rotation: [Math.sin(tilt / 2), 0, 0, Math.cos(tilt / 2)] } },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["roller", "spindle"], reason: "心軸的撥臂伸進滾子的螺紋 0.10:撥臂的尖端嵌在螺紋之間的螺旋槽裡,由螺紋帶著橫移(螺紋畫成細線,沒有畫出槽)" },
  ],
};
