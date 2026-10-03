// 第 421 種:船用筒狀引擎。活塞上連著一根筒管(trunk),連桿的下端直接接在活塞上(在筒管裡);筒管穿過汽缸蓋上的填料函。
// 活塞上側的有效面積因筒管而大為減少;為了讓活塞兩側的動力相等,高壓蒸汽先作用在活塞上側,
// 之後再排進汽缸下方的部分,在那裡膨脹做功。
// 主動件是曲柄(飛輪,原圖以虛線畫出)。
// 推斷:下行時新蒸汽進上側、下側排汽;上行時上側的蒸汽經旁邊的轉汽管流進下側膨脹。汽缸與筒管畫成剖面。
import { TAU, Y } from "./kit.js";
import { crankSlider, cylinderParts } from "./vertical-engine.js";
import { stream } from "./flow.js";
import { backHalf } from "./section.js";
import { shape, circle, rect } from "./shapes.js";

const CRANK = [0, 2.0, 0];
const R = 0.5;
const ROD = 2.6;
const CYL = { x: 0, top: 0.25, length: 1.6, radius: 1.0 };
export const TRUNK = 0.32; // 筒管外半徑
/** 活塞上側、下側的有效面積(上側被筒管佔去) */
export const AREA = { upper: Math.PI * (CYL.radius ** 2 - TRUNK ** 2), lower: Math.PI * CYL.radius ** 2 };

export const piston = (theta) => crankSlider(CRANK, R, ROD, theta);
/** 曲柄轉 theta → 活塞是否往下走 */
export const downward = (theta) => {
  const t = ((theta % TAU) + TAU) % TAU;
  return t > Math.PI / 2 && t < (3 * Math.PI) / 2;
};

const bottom = CYL.top - CYL.length;
const inlet = [[-1.9, CYL.top + 0.8, 0.3], [-1.9, CYL.top - 0.15, 0.3], [-CYL.radius, CYL.top - 0.15, 0.3]];
const transfer = [[CYL.radius, CYL.top - 0.15, 0.3], [1.55, CYL.top - 0.15, 0.3], [1.55, bottom + 0.15, 0.3], [CYL.radius, bottom + 0.15, 0.3]];
const exhaust = [[-CYL.radius, bottom + 0.15, 0.3], [-1.6, bottom + 0.15, 0.3], [-1.6, bottom - 0.7, 0.3]];

export default {
  figure: 421,
  parts: [
    ...cylinderParts(CYL),
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 汽缸座、汽缸蓋上的填料函
        { kind: "box", size: [2.8, 0.25, 1.4], at: [0, bottom - 0.25, 0] },
        { kind: "lathe", axis: Y, profile: [[TRUNK + 0.02, 0], [TRUNK + 0.2, 0], [TRUNK + 0.2, 0.35], [TRUNK + 0.02, 0.35]], at: [0, CYL.top + 0.12, 0], ...backHalf(Y) },
        // 進汽管、轉汽管、排汽管
        { kind: "box", size: [0.14, 1.0, 0.14], at: [-1.9, CYL.top + 0.3, 0.3] },
        { kind: "box", size: [0.9, 0.12, 0.12], at: [-1.45, CYL.top - 0.15, 0.3] },
        { kind: "box", size: [0.55, 0.12, 0.12], at: [1.27, CYL.top - 0.15, 0.3] },
        { kind: "box", size: [0.14, CYL.length - 0.3, 0.14], at: [1.55, CYL.top - CYL.length / 2, 0.3] },
        { kind: "box", size: [0.55, 0.12, 0.12], at: [1.27, bottom + 0.15, 0.3] },
        { kind: "box", size: [0.6, 0.12, 0.12], at: [-1.3, bottom + 0.15, 0.3] },
        { kind: "box", size: [0.14, 0.7, 0.14], at: [-1.6, bottom - 0.2, 0.3] },
      ],
    },
    { id: "trunk", kind: "lathe", axis: Y, profile: [[TRUNK - 0.06, 0], [TRUNK, 0], [TRUNK, 1.75], [TRUNK - 0.06, 1.75]], ...backHalf(Y) },
    {
      id: "flywheel",
      kind: "group",
      center: CRANK,
      spin: 1.4,
      pieces: [
        { kind: "plate", shape: shape(circle(1.3), [circle(1.18).reverse()]), thickness: 0.12, at: [0, 0, -0.5] },
        ...[0, 1, 2].map((i) => ({ kind: "box", size: [2.4, 0.08, 0.06], at: [0, 0, -0.5], angle: (i * Math.PI) / 3 })),
        { kind: "cylinder", radius: 0.12, length: 0.7, at: [0, 0, -0.2] },
        { kind: "plate", shape: shape(rect(R + 0.2, 0.18, R / 2, 0)), thickness: 0.08, at: [0, 0, 0.12] },
        { kind: "cylinder", radius: 0.07, length: 0.3, at: [R, 0, 0.2], accent: true },
      ],
    },
    { id: "rod", kind: "link", width: 0.14, thickness: 0.08 },
  ],
  driver: { part: "flywheel", type: "rotation" },
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const { pin, y } = piston(theta);
    const down = downward(theta);
    const top = y + 0.11;
    const low = y - 0.11;
    const travel = theta * 1.5;
    const flows = down
      ? [
          { fluid: "steam", points: stream(inlet, travel, { spacing: 0.2 }) },
          { fluid: "steam", points: stream(exhaust, travel, { spacing: 0.2 }) },
        ]
      : [{ fluid: "steam", points: stream(transfer, travel, { spacing: 0.2 }) }];
    return {
      parts: {
        flywheel: { angle: theta },
        rod: { from: [pin[0], pin[1], 0.25], to: [0, y, 0.25] },
        piston: { position: [0, y, 0] },
        trunk: { position: [0, top, 0] },
        steamUp: { position: [0, top + CYL.length / 2, 0], level: Math.max(0, CYL.top - top) / CYL.length },
        steamDown: { position: [0, bottom + CYL.length / 2, 0], level: down ? 0 : Math.max(0, low - bottom) / CYL.length },
      },
      flows,
      readouts: [
        { label: "活塞", value: down ? "下行:高壓蒸汽推上側,下側排汽" : "上行:上側的蒸汽轉進下側膨脹" },
        { label: "上側 / 下側有效面積", value: (AREA.upper / AREA.lower).toFixed(2) },
      ],
    };
  },
};
