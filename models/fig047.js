// 第 47 種:摩擦式離合器盒,以底部的槓桿使其嚙合或脫離,用來連接或斷開重型機械。
// 左邊的杯形盤鬆套在軸上、持續轉動;右邊的圓盤軸孔內有溝槽,在軸上的長鍵上滑動(隨軸轉)。
// 槓桿把右盤推進杯內,靠摩擦帶動軸;拉開時軸停住、杯形盤照轉。
import { X } from "./kit.js";
import { CLUTCH_STATES, bellCrank, leverTurn } from "./clutch-parts.js";

const SHIFT = 0.4;
const DISC_X = { engaged: 3.32, free: 3.32 + SHIFT };
const LEVER = { pivot: [4.6, -1.55], up: 1.4, out: 1.6 };

export default {
  figure: 47,
  parts: [
    {
      id: "cup",
      kind: "group",
      axis: X,
      center: [3.0, 0, 0],
      spin: 2.0,
      pieces: [
        { kind: "cylinder", radius: 2.0, length: 0.42, at: [0, 0, -0.32] },
        { kind: "cylinder", radius: 2.0, inner: 1.62, length: 0.62, at: [0, 0, 0.2], mark: true },
        { kind: "cylinder", radius: 0.55, length: 0.95, at: [0, 0, -0.75] },
      ],
    },
    { id: "shaft", kind: "cylinder", axis: X, center: [3.8, 0, 0], radius: 0.24, length: 4.2, arrow: false },
    {
      id: "disc",
      kind: "group",
      axis: X,
      center: [DISC_X.engaged, 0, 0],
      posed: true,
      spin: 1.55,
      spinOffset: 0.4,
      pieces: [
        { kind: "cylinder", radius: 1.55, length: 0.38, at: [0, 0, 0.19], mark: true },
        { kind: "cylinder", radius: 0.6, length: 1.3, at: [0, 0, 1.0] },
        { kind: "cylinder", radius: 0.48, length: 0.2, at: [0, 0, 1.25] },
      ],
    },
    bellCrank(LEVER),
  ],
  driver: { part: "cup", type: "rotation" },
  target: "shaft", // 離合器接合時才被帶動的軸
  states: CLUTCH_STATES,
  view: { direction: [0.08, 0.15, 1], fov: 14 },
  pose(angle, state = "engaged") {
    const turn = state === "engaged" ? angle : 0;
    return {
      parts: {
        cup: { angle },
        shaft: { angle: turn },
        disc: { position: [DISC_X[state], 0, 0], angle: turn },
        lever: { angle: leverTurn(DISC_X[state] - DISC_X.engaged, LEVER.up) },
      },
      readouts: [],
    };
  },
};
