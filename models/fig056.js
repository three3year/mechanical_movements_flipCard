// 第 56 種:車床上嚙合或脫離減速齒輪(背齒輪)的裝置。主軸上的塔輪連著小齒輪,
// 大齒輪的軸裝在一塊帶弧形溝槽的板上;溝槽偏離槓桿的支點,按下槓桿時大齒輪的軸被往後拉,
// 大齒輪退出與小齒輪的嚙合;扳起槓桿則推回嚙合。主動件是主軸(塔輪與小齒輪)。
import { deg } from "./kit.js";
import { meshAngle } from "./gears.js";
import { shape, circle, arcPoints, stadium } from "./shapes.js";

const M = 0.109;
const GEAR_AT = { engaged: [0, 0, 0], free: [-0.4, -0.08, 0] };
const GEAR = { teeth: 32, radius: (32 * M) / 2 };
const PINION = { center: [(32 + 15) * (M / 2), 0, 0.1], teeth: 15, radius: (15 * M) / 2 };
const LEVER = { pivot: [-0.62, 0.05], up: 2.7 };
const LEVER_ANGLE = { engaged: 0, free: deg(-32) };

const body = shape([
  [0.0, 0.62],
  [3.6, 0.62],
  [3.6, 0.42],
  [3.42, -2.55],
  [1.0, -2.55],
  [1.05, -1.85],
  [0.6, -0.95],
  [-0.4, -0.75],
  [-0.4, -0.25],
  [0.0, 0.0],
]);

export default {
  figure: 56,
  parts: [
    {
      id: "spindle",
      kind: "group",
      center: PINION.center,
      spin: 2.1,
      pieces: [
        { kind: "gear", teeth: PINION.teeth, radius: PINION.radius, width: 0.3, web: false },
        ...[1.3, 1.68, 2.05].map((r, i) => ({ kind: "cylinder", radius: r, inner: r - 0.12, length: 0.25, at: [0, 0, -0.45 - i * 0.25], mark: i === 2 })),
        { kind: "cylinder", radius: 1.3, length: 0.75, at: [0, 0, -0.7] },
      ],
    },
    {
      id: "gear",
      kind: "gear",
      center: GEAR_AT.engaged,
      posed: true,
      teeth: GEAR.teeth,
      radius: GEAR.radius,
      width: 0.28,
      web: false,
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: body, thickness: 0.5, at: [0, 0, 0.45] },
        { kind: "box", size: [3.0, 0.3, 0.8], at: [2.25, -2.72, 0.45] },
        { kind: "box", size: [1.8, 0.12, 0.56], at: [2.45, 0.68, 0.45] },
        { kind: "box", size: [0.45, 0.45, 0.6], at: [2.45, 0.05, 0.45] },
      ],
    },
    {
      id: "lever",
      kind: "group",
      center: [...LEVER.pivot, 0.8],
      posed: true,
      arrow: false,
      pieces: [
        { kind: "plate", shape: stadium(LEVER.up, 0.18, 0.05), thickness: 0.08, angle: Math.PI / 2 },
        {
          kind: "plate",
          shape: shape(
            [...arcPoints(0.55, deg(140), deg(330)), [0.75, 0.05], [0.3, 0.3]],
            [[...arcPoints(0.42, deg(205), deg(300)), ...arcPoints(0.28, deg(300), deg(205))].reverse()],
          ),
          thickness: 0.1,
        },
        { kind: "plate", shape: { outline: circle(0.16), holes: [] }, thickness: 0.14 },
      ],
    },
  ],
  driver: { part: "spindle", type: "rotation" },
  states: {
    options: [
      { id: "engaged", label: "嚙合(扳起槓桿)" },
      { id: "free", label: "脫離(按下槓桿)" },
    ],
    initial: "engaged",
  },
  view: { direction: [0.06, 0.05, 1] },
  pose(angle, state = "engaged") {
    const at = GEAR_AT[state];
    const gear = state === "engaged" ? meshAngle({ ...PINION, center: [PINION.center[0], 0, 0] }, { ...GEAR, center: at }, angle) : 0;
    return {
      parts: {
        spindle: { angle },
        gear: { position: at, angle: gear },
        lever: { angle: LEVER_ANGLE[state] },
      },
      readouts: [],
    };
  },
};
