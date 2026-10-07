// 第 467 種:Robertson 的液壓千斤頂。柱塞立在中空的底座上不動,附有爪鉤的圓筒在柱塞上滑動。泵從中空底座取水,
// 經柱塞裡的一根管子把水壓進圓筒,把圓筒抬起。管子底部有一個翼形螺絲操作的閥門,需要時讓水流回,把負載慢慢放下。
// 主動件是泵的手柄(右上);狀態按鈕切換「抬升」與「開閥放下」。
// 推斷:每壓一下手柄,圓筒升起一小段;開閥時水從圓筒流回底座,圓筒隨主動量慢慢降下。剖面圖。
// 泵(原圖只畫出手柄;推斷):底座右邊立著小泵筒,下端浸在底座的水裡,泵柱塞經一根短連桿接在手柄上離支點不遠處;
// 手柄的支點在泵筒左邊的支柱頂上。壓下手柄,柱塞往下把水經管子壓進柱塞裡的管、送進圓筒。
import { Y, deg, clamp } from "./kit.js";
import { stream } from "./flow.js";
import { stroke } from "./pump.js";
import { backHalf } from "./section.js";
import { shape, rect, thickLine, circle } from "./shapes.js";

const BASE = { y0: -1.7, y1: -1.0 };
const RAM = { r: 0.32, top: 0.55 }; // 固定的柱塞
const CYL = { r: 0.42, len: 1.6 }; // 滑動的圓筒(內半徑、長)
export const LIFT = 0.9; // 圓筒最多升起
const PUMP_X = 1.34; // 泵筒的軸線(在圓筒側面的爪鉤升降的範圍之外)
const PUMP_TOP = -0.45; // 泵筒頂
const PIVOT = [1.15, -0.3, 0]; // 手柄的支點
const ARM = 0.3; // 支點到接連桿處
const LINK = 0.3;
const PLUNGER = 0.5;
export const SWING = [deg(70), deg(30)]; // 手柄:上 → 下(壓)
const PER = 0.05; // 每壓一下升起

/** 累計主動量 v、狀態 → 圓筒升起多少、手柄角、是否在壓 */
export function jack(v, state = "lift") {
  const span = Math.abs(SWING[0] - SWING[1]);
  const { at, forward } = stroke(v, ...SWING);
  if (state === "release") return { rise: clamp(LIFT - v * 0.12, 0, LIFT), handle: SWING[0], pressing: false };
  const strokes = Math.floor(v / span / 2) + (forward ? (v / span) % 1 : 1);
  return { rise: clamp(strokes * PER, 0, LIFT), handle: at, pressing: forward };
}

/** 手柄轉 theta → 接連桿處 E 與泵柱塞頂的高度 */
export function plunger(theta) {
  const E = [PIVOT[0] + ARM * Math.cos(theta), PIVOT[1] + ARM * Math.sin(theta)];
  return { E, top: E[1] - Math.sqrt(LINK * LINK - (E[0] - PUMP_X) ** 2) };
}

export default {
  figure: 467,
  parts: [
    {
      id: "base",
      kind: "group",
      pieces: [
        // 中空的底座(裝水)與固定的柱塞、柱塞裡的管子
        { kind: "plate", shape: shape(rect(2.6, BASE.y1 - BASE.y0, 0.5, (BASE.y0 + BASE.y1) / 2), [rect(2.4, BASE.y1 - BASE.y0 - 0.14, 0.5, (BASE.y0 + BASE.y1) / 2).reverse()]), thickness: 1.0 },
        { kind: "lathe", axis: Y, profile: [[0.06, 0], [RAM.r, 0], [RAM.r, RAM.top - BASE.y1], [0.06, RAM.top - BASE.y1]], at: [0, BASE.y1, 0], ...backHalf(Y) },
        { kind: "plate", shape: shape(thickLine([[PUMP_X - 0.08, BASE.y1 + 0.2], [0.12, BASE.y1 + 0.2], [0.12, RAM.top]], 0.05)), thickness: 0.1, at: [0, 0, 0.05] },
        // 泵筒(下端伸進底座的水裡)與手柄支點的支柱
        { kind: "cylinder", radius: 0.1, inner: 0.065, length: PUMP_TOP - BASE.y0 - 0.2, axis: Y, at: [PUMP_X, (PUMP_TOP + BASE.y0 + 0.2) / 2, 0.05] },
        { kind: "box", size: [0.08, PIVOT[1] - BASE.y1, 0.08], at: [PIVOT[0], (PIVOT[1] + BASE.y1) / 2, 0.3] },
        { kind: "cylinder", radius: 0.03, length: 0.24, at: [PIVOT[0], PIVOT[1], 0.24] },
        // 底部的放水閥(翼形螺絲)
        { kind: "box", size: [0.08, 0.3, 0.08], at: [-0.8, BASE.y0 + 0.35, 0.5] },
        { kind: "box", size: [0.3, 0.06, 0.12], at: [-0.8, BASE.y0 + 0.5, 0.5], accent: true },
      ],
    },
    { id: "baseWater", kind: "fill", fluid: "water", center: [0.5, (BASE.y0 + BASE.y1) / 2, 0], size: [2.35, BASE.y1 - BASE.y0 - 0.16, 0.9], level: 0.6 },
    {
      id: "cylinder",
      kind: "lathe",
      axis: Y,
      profile: [[CYL.r, 0], [CYL.r + 0.12, 0], [CYL.r + 0.12, CYL.len], [0, CYL.len], [0, CYL.len - 0.12], [CYL.r, CYL.len - 0.12]],
      ...backHalf(Y),
      arrow: false,
      pieces: [
        // 頂上的托座與側面的爪鉤
        { kind: "plate", shape: shape([[-0.5, 0], [-0.55, 0.35], [-0.2, 0.12], [0.2, 0.12], [0.55, 0.35], [0.5, 0]]), thickness: 0.6, at: [0, CYL.len, 0], rotation: [Math.SQRT1_2, 0, 0, Math.SQRT1_2] },
        { kind: "plate", shape: shape(thickLine([[CYL.r + 0.1, 0.4], [CYL.r + 0.5, 0.4], [CYL.r + 0.5, 0.65]], 0.12)), thickness: 0.4, at: [0, 0, 0], rotation: [Math.SQRT1_2, 0, 0, Math.SQRT1_2] },
      ],
    },
    { id: "cylWater", kind: "fill", fluid: "water", shape: "cylinder", size: [2 * CYL.r - 0.02, LIFT + 0.1, 0], level: 0 },
    { id: "handle", kind: "plate", shape: shape(thickLine([[0, 0], [1.3, 0]], 0.1), [circle(0.035).reverse()]), thickness: 0.08, arrow: false, pieces: [{ kind: "sphere", radius: 0.1, at: [1.3, 0, 0] }] },
    { id: "plunger", kind: "cylinder", axis: Y, radius: 0.06, length: PLUNGER, arrow: false },
    { id: "link", kind: "link", width: 0.06, thickness: 0.04 },
  ],
  states: {
    initial: "lift",
    options: [
      { id: "lift", label: "壓手柄抬升" },
      { id: "release", label: "開閥放下" },
    ],
  },
  powered: ["cylinder"], // 外力來源:圓筒是被泵進來的水頂起的(液壓傳動,沒有實體相連)
  driver: { part: "handle", grips: ["plunger"], type: "rotation", cycle: SWING },
  target: "cylinder",
  view: { direction: [0.15, 0.1, 1] },
  pose(v, state = "lift") {
    const j = jack(v, state);
    const pump = plunger(j.handle);
    const bottom = RAM.top - (CYL.len - 0.12) + 0.02 + j.rise; // 圓筒底;圓筒內頂碰到柱塞頂時 rise = 0
    const travel = v * 5;
    const flows = [];
    if (state === "lift" && j.pressing && j.rise < LIFT) flows.push({ fluid: "water", points: stream([[PUMP_X, BASE.y1 - 0.3, 0.15], [PUMP_X, BASE.y1 + 0.2, 0.15], [0.12, BASE.y1 + 0.2, 0.15], [0.12, RAM.top + j.rise * 0.5, 0.15]], travel, { spacing: 0.15 }) });
    if (state === "release" && j.rise > 0) flows.push({ fluid: "water", points: stream([[0.12, RAM.top + 0.05, 0.1], [0.12, BASE.y1 + 0.2, 0.1], [-0.8, BASE.y1 + 0.2, 0.1], [-0.8, BASE.y0 + 0.2, 0.1]], travel, { spacing: 0.15 }) });
    return {
      parts: {
        cylinder: { position: [0, bottom, 0] },
        cylWater: { position: [0, RAM.top + (LIFT + 0.1) / 2, 0], level: j.rise / (LIFT + 0.1) },
        handle: { position: [PIVOT[0], PIVOT[1], 0.2], angle: j.handle },
        plunger: { position: [PUMP_X, pump.top - PLUNGER / 2, 0.05] },
        link: { from: [pump.E[0], pump.E[1], 0.14], to: [PUMP_X, pump.top, 0.1] },
      },
      flows,
      readouts: [{ label: "圓筒升起", value: j.rise.toFixed(2) }],
    };
  },
  waivers: [
  ],
};
