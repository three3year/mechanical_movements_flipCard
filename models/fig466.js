// 第 466 種:液壓機。水由泵經小管壓進柱塞圓筒,進到實心柱塞下方,把柱塞往上推。得到的力與泵柱塞、柱塞兩者的面積比
// (直徑平方比)成正比;例如泵柱塞直徑 1 吋、柱塞 30 吋,柱塞受的向上壓力就是加在泵柱塞上向下壓力的 900 倍。
// 主動件是泵的手柄(每壓一下,柱塞上升一點)。
// 推斷:泵在右邊的水箱裡,有吸水閥與出水閥;模型裡柱塞與泵柱塞的直徑比依原圖(約 7 : 1),每一下柱塞上升
// 泵行程的 1/52(畫面上放大 8 倍才看得出來);讀數另外列出原文 30 : 1 的例子。剖面圖。
import { Y, deg } from "./kit.js";
import { stream } from "./flow.js";
import { lever, leverPart, stroke, flap, barrel, pipeWalls } from "./pump.js";
import { backHalf } from "./section.js";
import { shape, rect } from "./shapes.js";

export const RAM_D = 1.3; // 柱塞直徑
export const PLUNGER_D = 0.18; // 泵柱塞直徑
const RAM = { x: -1.2, y0: -1.6, y1: 0.0 }; // 柱塞圓筒
const RAM_LEN = 1.5;
export const RAM_TRAVEL = 0.8;
const PUMP_X = 1.6;
const PUMP = { y0: -0.9, y1: 0.4 };
const HANDLE = { pivot: [PUMP_X + 0.55, 1.75, 0], short: 0.55, long: 1.4, link: 0.3, x: PUMP_X };
export const SWING = [deg(25), deg(-20)];
const ROD = 1.25;
const OPEN = deg(55);
const arm = lever(HANDLE);
const LO = arm(SWING[0]).top[1] - ROD;
const HI = arm(SWING[1]).top[1] - ROD;
export const PUMP_STROKE = HI - LO;

/** 累計主動量 v → 泵柱塞高度、是否壓下、柱塞(大)已升起多少 */
export function press(v) {
  const span = Math.abs(SWING[1] - SWING[0]);
  const { at, forward } = stroke(v, ...SWING);
  const { E, top } = arm(at);
  const y = top[1] - ROD;
  // 每一次下壓把泵行程的水送進圓筒:柱塞上升 = 泵行程 × 面積比
  const strokes = Math.floor(v / span / 2) + (forward ? 0 : (v / span) % 1);
  const ratio = (PLUNGER_D / RAM_D) ** 2;
  const rise = Math.min(RAM_TRAVEL, strokes * PUMP_STROKE * ratio * 8);
  return { theta: at, E, top, plunger: y, down: !forward, rise };
}

export default {
  figure: 466,
  parts: [
    barrel("ramCylinder", { x: RAM.x, r: RAM_D / 2, y0: RAM.y0, y1: RAM.y1, wall: 0.18 }),
    barrel("pump", { x: PUMP_X, r: PLUNGER_D / 2 + 0.03, y0: PUMP.y0, y1: PUMP.y1, wall: 0.06 }),
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "lathe", axis: Y, profile: [[0, 0], [RAM_D / 2 + 0.18, 0], [RAM_D / 2 + 0.18, 0.15], [0, 0.15]], at: [RAM.x, RAM.y0 - 0.15, 0], ...backHalf(Y) },
        // 機架:兩根立柱與頂上的橫樑
        { kind: "box", size: [0.16, 3.6, 0.16], at: [RAM.x - 1.0, 0.1, 0] },
        { kind: "box", size: [0.16, 3.6, 0.16], at: [RAM.x + 1.0, 0.1, 0] },
        { kind: "box", size: [2.3, 0.35, 0.8], at: [RAM.x, 2.05, 0] },
        // 泵的水箱、從泵到圓筒的小管、手柄支柱
        { kind: "plate", shape: shape(rect(1.3, 1.1, PUMP_X, -1.0), [rect(1.2, 1.05, PUMP_X, -0.98).reverse()]), thickness: 0.8 },
        ...pipeWalls([[PUMP_X - 0.12, PUMP.y0 + 0.15], [0.4, PUMP.y0 + 0.15], [0.4, RAM.y0 + 0.1], [RAM.x + RAM_D / 2 + 0.1, RAM.y0 + 0.1]], 0.08, 0.04, 0.2),
        { kind: "box", size: [0.1, 1.5, 0.1], at: [HANDLE.pivot[0], HANDLE.pivot[1] - 0.75, -0.15] },
      ],
    },
    { id: "cistern", kind: "fill", fluid: "water", center: [PUMP_X, -1.0, 0], size: [1.15, 1.0, 0.7], level: 0.75 },
    { id: "ramWater", kind: "fill", fluid: "water", shape: "cylinder", size: [RAM_D - 0.02, RAM_TRAVEL + 0.3, 0], level: 0 },
    {
      id: "ram",
      kind: "cylinder",
      axis: Y,
      radius: RAM_D / 2 - 0.02,
      length: RAM_LEN,
      arrow: false,
      pieces: [
        { kind: "box", size: [1.8, 0.15, 0.8], at: [0, 0, RAM_LEN / 2 + 0.08] },
        // 被壓的貨包
        { kind: "box", size: [1.3, 0.5, 0.6], at: [0, 0, RAM_LEN / 2 + 0.42] },
      ],
    },
    { id: "plunger", kind: "cylinder", axis: Y, radius: PLUNGER_D / 2, length: ROD, arrow: false },
    leverPart("handle", HANDLE),
    { id: "link", kind: "link", width: 0.06, thickness: 0.04 },
    flap("suction", 0.18),
    flap("delivery", 0.14),
  ],
  driver: { part: "handle", grips: ["plunger"], type: "rotation", cycle: SWING },
  view: { direction: [0.08, 0.08, 1] },
  pose(v) {
    const p = press(v);
    const ramBottom = RAM.y0 + 0.05 + p.rise;
    const travel = v * 5;
    return {
      parts: {
        handle: { position: HANDLE.pivot, angle: p.theta },
        link: { from: [p.E[0], p.E[1], 0.06], to: [p.top[0], p.top[1], 0.06] },
        plunger: { position: [PUMP_X, p.plunger + ROD / 2, 0] },
        ram: { position: [RAM.x, ramBottom + RAM_LEN / 2, 0] },
        ramWater: { position: [RAM.x, RAM.y0 + (RAM_TRAVEL + 0.3) / 2, 0], level: (p.rise + 0.05) / (RAM_TRAVEL + 0.3) },
        suction: { position: [PUMP_X - 0.09, PUMP.y0 + 0.02, 0.05], angle: p.down ? 0 : OPEN },
        delivery: { position: [PUMP_X - 0.12, PUMP.y0 + 0.08, 0.05], angle: Math.PI / 2 + (p.down ? OPEN : 0) },
      },
      flows: p.down && p.rise < RAM_TRAVEL ? [{ fluid: "water", points: stream([[PUMP_X, p.plunger - 0.2, 0.2], [PUMP_X - 0.12, PUMP.y0 + 0.15, 0.2], [0.4, PUMP.y0 + 0.15, 0.2], [0.4, RAM.y0 + 0.1, 0.2], [RAM.x + 0.3, RAM.y0 + 0.1, 0.2]], travel, { spacing: 0.15 }) }] : [],
      readouts: [
        { label: "力的倍數(模型)", value: `${Math.round((RAM_D / PLUNGER_D) ** 2)} 倍` },
        { label: "原文的例子", value: "1 吋 : 30 吋 → 900 倍" },
      ],
    };
  },
};
