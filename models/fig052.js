// 第 52 種:另一種離合器盒。左邊的圓盤固定著兩根凸柱;右邊的碟形輪上有兩個對應的孔,
// 在軸上滑動。以槓桿把它推向左盤,凸柱插進孔中,兩盤便一起旋轉;拉開時右輪與它的軸停住。
import { X, polar } from "./kit.js";
import { circle, shape } from "./shapes.js";
import { CLUTCH_STATES, bellCrank, leverTurn } from "./clutch-parts.js";

const STUD_R = 1.15;
const SHIFT = 0.8;
const WHEEL_X = { engaged: 2.92, free: 2.92 + SHIFT };
const LEVER = { pivot: [4.3, -1.35], up: 1.25, out: 1.7 };

const holes = [0, Math.PI].map((a) => circle(0.16, ...polar(STUD_R, a).slice(0, 2)).reverse());

export default {
  figure: 52,
  parts: [
    {
      id: "disc",
      kind: "group",
      axis: X,
      center: [2.1, 0, 0],
      spin: 1.48,
      pieces: [
        { kind: "cylinder", radius: 1.48, length: 0.6, mark: true },
        { kind: "cylinder", radius: 0.42, length: 0.6, at: [0, 0, -0.6] },
        { kind: "cylinder", radius: 0.2, length: 2.4, at: [0, 0, -0.4] },
        ...[0, Math.PI].map((a) => ({ kind: "cylinder", radius: 0.13, length: 0.55, at: [...polar(STUD_R, a).slice(0, 2), 0.57] })),
      ],
    },
    {
      id: "wheel",
      kind: "plate",
      axis: X,
      center: [WHEEL_X.engaged, 0, 0],
      shape: shape(circle(1.7), [...holes, circle(0.22).reverse()]),
      thickness: 0.36,
      posed: true,
      spin: 1.7,
      mark: [0, 1.4],
      markSize: 0.1,
    },
    {
      id: "shaft",
      kind: "group",
      axis: X,
      center: [5.0, 0, 0],
      arrow: false,
      posed: true,
      pieces: [
        { kind: "cylinder", radius: 0.2, length: 4.0, at: [0, 0, -1.0] },
        { kind: "cylinder", radius: 0.42, length: 0.55, at: [0, 0, -1.65] },
        { kind: "cylinder", radius: 0.35, length: 0.12, at: [0, 0, -0.8] },
        { kind: "lathe", profile: [[0, 0.9], [0.32, 0.9], [0.42, 1.2], [0.42, 1.55], [0.25, 1.85], [0, 1.85]] },
      ],
    },
    bellCrank(LEVER),
  ],
  driver: { part: "disc", type: "rotation" },
  target: "shaft", // 離合器接合時才被帶動的軸
  states: CLUTCH_STATES,
  view: { direction: [0.1, 0.15, 1], fov: 14 },
  pose(angle, state = "engaged") {
    const turn = state === "engaged" ? angle : 0;
    const x = WHEEL_X[state];
    return {
      parts: {
        disc: { angle },
        wheel: { position: [x, 0, 0], angle: turn },
        shaft: { angle: turn },
        lever: { angle: leverTurn(x - WHEEL_X.engaged, LEVER.up) },
      },
      readouts: [],
    };
  },
};
