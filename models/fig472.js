// 第 472 種:Grimshaw 的壓縮空氣錘。錘頭接在活塞 A 上,活塞在汽缸 B 裡;空氣像蒸汽進蒸汽機一樣,經頂上的滑閥輪流引進
// 活塞的上方與下方。空氣來自機架裡的儲氣槽 C,由空氣泵 D 供應;空氣泵由旋轉驅動軸 E 上的曲柄帶動。
// 主動件是驅動軸 E。
// 推斷:驅動軸每轉兩圈,錘打一下(滑閥在錘到頂、到底時換向);空氣泵每轉一圈打一次氣進儲氣槽;剖面圖。
import { TAU, Y, smooth } from "./kit.js";
import { stream } from "./flow.js";
import { backHalf } from "./section.js";
import { shape } from "./shapes.js";

const E = [-1.0, 2.05, 0]; // 驅動軸
const PUMP = { x: -1.55, r: 0.28, y0: -1.4, y1: 0.45 };
const CRANK_R = 0.55;
const PUMP_ROD = 2.6;
const CYL = { x: 1.3, r: 0.32, y0: 1.2, y1: 2.3 };
export const ANVIL_TOP = -0.9;
const HAMMER_ROD = 1.55;
const LIFT = 0.75;

/** 驅動軸轉 theta → 錘頭底的高度、空氣在活塞哪一側 */
export function hammer(theta) {
  const u = (((theta / (2 * TAU)) % 1) + 1) % 1;
  const y = u < 0.55 ? ANVIL_TOP + LIFT * smooth(u / 0.5) : u < 0.75 ? ANVIL_TOP + LIFT * (1 - smooth((u - 0.55) / 0.2)) : ANVIL_TOP;
  const below = u < 0.55; // 抬錘時空氣在下方
  return { y, below, u };
}

const frame = shape([[-2.1, -2.0], [2.2, -2.0], [2.2, -1.75], [1.85, -1.6], [1.75, -0.8], [0.75, -0.8], [0.6, 0.4], [0.9, 1.0], [1.75, 1.0], [1.75, 2.5], [-0.5, 2.5], [-0.5, 1.75], [-0.15, 1.6], [-0.3, -0.6], [-1.1, -1.75], [-2.1, -1.75]]);

export default {
  figure: 472,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: frame, thickness: 0.5, at: [0, 0, -0.5] },
        { kind: "box", size: [0.7, 0.3, 0.6], at: [CYL.x, ANVIL_TOP - 0.15, 0] },
        { kind: "lathe", axis: Y, profile: [[0.07, 0], [CYL.r + 0.07, 0], [CYL.r + 0.07, CYL.y1 - CYL.y0], [0, CYL.y1 - CYL.y0], [0, CYL.y1 - CYL.y0 - 0.08], [CYL.r, CYL.y1 - CYL.y0 - 0.08], [CYL.r, 0.08], [0.07, 0.08]], at: [CYL.x, CYL.y0, 0], ...backHalf(Y) },
        { kind: "box", size: [0.5, 0.18, 0.4], at: [CYL.x, CYL.y1 + 0.09, 0] },
        { kind: "lathe", axis: Y, profile: [[PUMP.r, 0], [PUMP.r + 0.06, 0], [PUMP.r + 0.06, PUMP.y1 - PUMP.y0], [PUMP.r, PUMP.y1 - PUMP.y0]], at: [PUMP.x, PUMP.y0, 0], ...backHalf(Y) },
        { kind: "box", size: [3.0, 0.14, 0.14], at: [0.35, 2.05, 0.2] },
      ],
    },
    { id: "labels", kind: "group", pieces: [], label: "B", labelOffset: [CYL.x + 0.55, CYL.y1 - 0.2, 0.4] },
    { id: "labelC", kind: "group", pieces: [], label: "C", labelOffset: [0.2, 0.2, 0.4] },
    { id: "labelD", kind: "group", pieces: [], label: "D", labelOffset: [PUMP.x - 0.5, PUMP.y0 + 0.5, 0.4] },
    {
      id: "shaftE",
      kind: "group",
      center: E,
      label: "E",
      labelOffset: [-0.35, -0.3, 0.4],
      spin: 0.45,
      pieces: [
        { kind: "cylinder", radius: 0.08, length: 0.8 },
        { kind: "plate", shape: shape([[0, -0.1], [-CRANK_R, -0.1], [-CRANK_R, 0.1], [0, 0.1]]), thickness: 0.06, at: [0, 0, 0.3] },
        { kind: "pulley", style: "spoked", radius: 0.42, width: 0.08, at: [0, 0, -0.3] },
      ],
    },
    { id: "pumpRod", kind: "link", width: 0.07, thickness: 0.05 },
    { id: "pumpPiston", kind: "cylinder", axis: Y, radius: PUMP.r - 0.02, length: 0.16, arrow: false },
    {
      id: "piston",
      kind: "cylinder",
      axis: Y,
      radius: CYL.r - 0.02,
      length: 0.14,
      arrow: false,
      label: "A",
      labelOffset: [0.5, 0, 0.4],
      pieces: [
        { kind: "cylinder", radius: 0.06, length: HAMMER_ROD, at: [0, 0, -HAMMER_ROD / 2] },
        { kind: "box", size: [0.55, 0.55, 0.35], at: [0, 0, -HAMMER_ROD - 0.17] },
      ],
    },
  ],
  driver: { part: "shaftE", type: "rotation" },
  view: { direction: [0.08, 0.08, 1] },
  pose(theta) {
    const h = hammer(theta);
    const piston = h.y + 0.35 + HAMMER_ROD;
    const crank = [E[0] + CRANK_R * Math.cos(theta + Math.PI), E[1] + CRANK_R * Math.sin(theta + Math.PI), 0.35];
    const pumpY = crank[1] - Math.sqrt(PUMP_ROD ** 2 - (crank[0] - PUMP.x) ** 2); // 空氣泵活塞
    const travel = theta * 0.8;
    const toCyl = h.below ? [[0.3, 0.2, 0.3], [CYL.x - 0.7, 0.2, 0.3], [CYL.x - 0.7, CYL.y0 + 0.2, 0.3], [CYL.x - 0.2, CYL.y0 + 0.2, 0.3]] : [[0.3, 0.2, 0.3], [CYL.x - 0.7, 0.2, 0.3], [CYL.x - 0.7, CYL.y1 + 0.09, 0.3], [CYL.x, CYL.y1 - 0.1, 0.3]];
    return {
      parts: {
        shaftE: { angle: theta },
        pumpRod: { from: [crank[0], crank[1], 0.35], to: [PUMP.x, pumpY, 0.35] },
        pumpPiston: { position: [PUMP.x, pumpY - 0.08, 0] },
        piston: { position: [CYL.x, piston, 0] },
      },
      flows: [
        { fluid: "air", points: [...stream([[PUMP.x, PUMP.y1, 0.3], [PUMP.x, PUMP.y1 + 0.3, 0.3], [0.0, PUMP.y1 + 0.3, 0.3], [0.2, 0.0, 0.3]], travel, { spacing: 0.25 }), ...stream(toCyl, travel, { spacing: 0.2 })] },
      ],
      readouts: [{ label: "滑閥送空氣到", value: h.below ? "活塞下方(抬錘)" : "活塞上方(打擊)" }],
    };
  },
};
