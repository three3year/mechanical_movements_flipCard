// 第 448 種:普通的提升泵。活塞(水斗)上行時,下方的閥門打開、活塞裡的閥門關上;吸水管裡的空氣被抽走,水湧上來填補真空。
// 下行時下方的閥門關上、活塞裡的閥門打開,水直接穿過活塞。活塞上方的水被抬起,每次上行都從出水口溢出。
// 這種泵不能把水抬到三十呎以上。
// 主動件是手柄(往下壓提起活塞)。
// 照原圖(2026-10-20):活塞是中間有水道的環,環上立一個弓形架,活塞桿接在架頂、不伸進水道;活塞閥在架底下翻開。
// 出水口的兩道管壁接進泵筒側壁的開口、和泵筒連成一件;手柄的耳也裝在泵筒上,手柄以樞銷鉸在耳上。
// 推斷:泵已經引過水(吸水管裡滿著水);手柄、連桿與泵筒的尺寸依原圖;剖面圖。
import { Y, deg } from "./kit.js";
import { stream } from "./flow.js";
import { lever, leverPart, stroke, flap, barrel, water, valveOpening } from "./pump.js";
import { backHalf } from "./section.js";
import { shape, thickLine } from "./shapes.js";

export const BARREL = { r: 0.42, y0: -0.3, y1: 1.6 };
const SUCTION = { r: 0.22, y0: -2.4 };
export const SPOUT_Y = 1.25;
const ROD = 1.58;
const PISTON_H = 0.25;
const BOW = { leg: 0.28, rise: 0.3, top: 0.5 }; // 活塞上的弓形架:腳的 x、腳高、架頂的高(都從活塞環頂面起算)
const BOW_TOP = PISTON_H / 2 + BOW.top + 0.03; // 架頂的上面(活塞局部),活塞桿從這裡往上
const HANDLE = { pivot: [0.9, 2.5, 0], short: 1.0, long: 2.0, link: 0.35, x: 0 };
export const SWING = [deg(20), deg(-26)]; // 手柄從上到下(往下壓提起活塞)
const OPEN = deg(55);
const HANDLE_Z = -0.115; // 手柄的耳在手柄(厚 0.08、在 z=0)後面一層
const arm = lever(HANDLE);
// 出水口的兩道壁:從泵筒內面穿過筒壁的開口往左下伸;泵筒在這兩道壁的外面之間開口
const SPOUT_UPPER = [[-BARREL.r, SPOUT_Y + 0.1], [-0.6, SPOUT_Y + 0.1], [-0.95, SPOUT_Y + 0.05], [-1.15, SPOUT_Y - 0.25]];
const SPOUT_LOWER = [[-BARREL.r, SPOUT_Y - 0.12], [-0.6, SPOUT_Y - 0.12], [-0.9, SPOUT_Y - 0.17], [-1.0, SPOUT_Y - 0.35]];
const SPOUT_OPENING = { y0: SPOUT_Y - 0.12 - 0.03, y1: SPOUT_Y + 0.1 + 0.03, side: -1, depth: 0.3 };

/** 主動量 v → 手柄角、活塞高度、是否上行 */
export function pump(v) {
  const phase = stroke(v, ...SWING);
  const { E, top } = arm(phase.at);
  return { theta: phase.at, E, top, piston: top[1] - ROD, up: phase.forward, phase };
}

export default {
  figure: 448,
  parts: [
    barrel("barrel", {
      ...BARREL,
      openings: [SPOUT_OPENING],
      pieces: [
        // 出水口(接進筒壁的開口)、手柄的耳(推斷:在手柄後面一層)與手柄的樞銷
        { kind: "plate", shape: shape(thickLine(SPOUT_UPPER, 0.06)), thickness: 0.3 },
        { kind: "plate", shape: shape(thickLine(SPOUT_LOWER, 0.06)), thickness: 0.3 },
        { kind: "plate", shape: shape(thickLine([[BARREL.r + 0.05, BARREL.y1 - 0.1], [0.75, 2.2], [0.9, 2.5]], 0.1)), thickness: 0.15, at: [0, 0, HANDLE_Z] },
        { kind: "cylinder", radius: 0.035, length: 0.3, at: [HANDLE.pivot[0], HANDLE.pivot[1], HANDLE_Z + 0.035] },
      ],
    }),
    barrel("suction", { r: SUCTION.r, y0: SUCTION.y0, y1: BARREL.y0 + 0.05, wall: 0.06 }),
    {
      id: "works",
      kind: "group",
      pieces: [
        // 泵筒底的法蘭(接吸水管)
        { kind: "lathe", axis: Y, profile: [[SUCTION.r, 0], [BARREL.r + 0.07, 0], [BARREL.r + 0.07, 0.08], [SUCTION.r, 0.08]], at: [0, BARREL.y0 - 0.08, 0], ...backHalf(Y) },
      ],
    },
    { id: "well", kind: "fill", fluid: "water", center: [0, -2.65, 0], size: [2.2, 0.5, 1.2], level: 1 },
    { id: "suctionWater", kind: "fill", fluid: "water", shape: "cylinder", center: [0, (SUCTION.y0 + BARREL.y0) / 2, 0], size: [2 * SUCTION.r - 0.02, BARREL.y0 - SUCTION.y0, 0], level: 1 },
    { id: "below", kind: "fill", fluid: "water", shape: "cylinder", size: [2 * BARREL.r - 0.02, BARREL.y1 - BARREL.y0, 0], level: 0 },
    { id: "above", kind: "fill", fluid: "water", shape: "cylinder", size: [2 * BARREL.r - 0.02, BARREL.y1 - BARREL.y0, 0], level: 0 },
    flap("footValve", 2 * SUCTION.r),
    {
      id: "piston",
      kind: "group",
      arrow: false,
      pieces: [
        // 活塞環(中間是水道)、環上的弓形架、接在架頂的活塞桿
        { kind: "lathe", axis: Y, profile: [[0.16, -PISTON_H / 2], [BARREL.r - 0.01, -PISTON_H / 2], [BARREL.r - 0.01, PISTON_H / 2], [0.16, PISTON_H / 2]], ...backHalf(Y) },
        {
          kind: "plate",
          shape: shape(thickLine([[-BOW.leg, -0.02], [-BOW.leg, BOW.rise], [-0.12, BOW.top], [-0.04, BOW.top], [0.04, BOW.top], [0.12, BOW.top], [BOW.leg, BOW.rise], [BOW.leg, -0.02]], 0.06)),
          thickness: 0.12,
          at: [0, PISTON_H / 2, 0],
        },
        { kind: "cylinder", axis: Y, radius: 0.035, length: ROD - BOW_TOP, at: [0, (ROD + BOW_TOP) / 2, 0] },
      ],
    },
    flap("pistonValve", 0.32),
    leverPart("handle", HANDLE),
    { id: "link", kind: "link", width: 0.08, thickness: 0.05 },
  ],
  driver: { part: "handle", type: "rotation", cycle: SWING },
  powered: ["footValve", "pistonValve"], // 外力來源:閥瓣是被水頂開的(流體傳動,沒有實體相連)
  target: "piston",
  view: { direction: [0.08, 0.06, 1] },
  pose(v) {
    const p = pump(v);
    const travel = v * 4;
    const pistonTop = p.piston + PISTON_H / 2;
    const flows = p.up
      ? [{ fluid: "water", points: [...stream([[0, -2.55, 0.1], [0, BARREL.y0 + 0.1, 0.1]], travel, { spacing: 0.2 }), ...stream([[-0.3, SPOUT_Y - 0.02, 0.1], [-0.98, SPOUT_Y - 0.07, 0.1], [-1.08, SPOUT_Y - 0.3, 0.1], [-1.12, SPOUT_Y - 1.2, 0.1]], travel, { spacing: 0.16 })] }]
      : [{ fluid: "water", points: stream([[0.05, p.piston - 0.35, 0.1], [0.05, pistonTop + 0.15, 0.1]], travel, { spacing: 0.12 }) }];
    return {
      parts: {
        handle: { position: HANDLE.pivot, angle: p.theta },
        link: { from: [p.E[0], p.E[1], 0.08], to: [p.top[0], p.top[1], 0.08] },
        piston: { position: [0, p.piston, 0] },
        // 下方的閥門:上行時被水頂開;活塞裡的閥門:下行時被水頂開;關上時閥瓣坐在管口 / 活塞的頂面上
        // (2026-10-07 複查:原本換向的瞬間直接翻開 / 闔上;改成被水頂開、靠自重加速落回閥座)
        footValve: { position: [-SUCTION.r, BARREL.y0 + 0.05 + 0.025, 0], angle: OPEN * valveOpening(p.up, p.phase) },
        pistonValve: { position: [-0.16, pistonTop + 0.025, 0], angle: OPEN * valveOpening(!p.up, p.phase) },
        below: water(0, BARREL.y0, p.piston - PISTON_H / 2, BARREL.y1 - BARREL.y0),
        above: water(0, pistonTop, Math.max(pistonTop, SPOUT_Y), BARREL.y1 - BARREL.y0),
      },
      flows,
      readouts: [{ label: "活塞", value: p.up ? "上行:下閥開、活塞閥關,水從出水口溢出" : "下行:下閥關、活塞閥開,水穿過活塞" }],
    };
  },
};
