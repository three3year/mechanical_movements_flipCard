// 第 448 種:普通的提升泵。活塞(水斗)上行時,下方的閥門打開、活塞裡的閥門關上;吸水管裡的空氣被抽走,水湧上來填補真空。
// 下行時下方的閥門關上、活塞裡的閥門打開,水直接穿過活塞。活塞上方的水被抬起,每次上行都從出水口溢出。
// 這種泵不能把水抬到三十呎以上。
// 主動件是手柄(往下壓提起活塞)。
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
const HANDLE = { pivot: [0.9, 2.5, 0], short: 1.0, long: 2.0, link: 0.35, x: 0 };
export const SWING = [deg(20), deg(-26)]; // 手柄從上到下(往下壓提起活塞)
const OPEN = deg(55);
const arm = lever(HANDLE);

/** 主動量 v → 手柄角、活塞高度、是否上行 */
export function pump(v) {
  const phase = stroke(v, ...SWING);
  const { E, top } = arm(phase.at);
  return { theta: phase.at, E, top, piston: top[1] - ROD, up: phase.forward, phase };
}

export default {
  figure: 448,
  parts: [
    barrel("barrel", { ...BARREL }),
    barrel("suction", { r: SUCTION.r, y0: SUCTION.y0, y1: BARREL.y0 + 0.05, wall: 0.06 }),
    {
      id: "works",
      kind: "group",
      pieces: [
        // 泵筒底(接吸水管)、出水口、頂上的支架
        { kind: "lathe", axis: Y, profile: [[SUCTION.r, 0], [BARREL.r + 0.07, 0], [BARREL.r + 0.07, 0.08], [SUCTION.r, 0.08]], at: [0, BARREL.y0 - 0.08, 0], ...backHalf(Y) },
        { kind: "plate", shape: shape(thickLine([[-BARREL.r, SPOUT_Y + 0.1], [-0.95, SPOUT_Y + 0.05], [-1.15, SPOUT_Y - 0.25]], 0.06)), thickness: 0.3 },
        { kind: "plate", shape: shape(thickLine([[-BARREL.r, SPOUT_Y - 0.12], [-0.9, SPOUT_Y - 0.17], [-1.0, SPOUT_Y - 0.35]], 0.06)), thickness: 0.3 },
        { kind: "plate", shape: shape(thickLine([[BARREL.r + 0.07, BARREL.y1 - 0.1], [0.75, 2.2], [0.9, 2.5]], 0.1)), thickness: 0.15 },
      ],
    },
    { id: "well", kind: "fill", fluid: "water", center: [0, -2.65, 0], size: [2.2, 0.5, 1.2], level: 1 },
    { id: "suctionWater", kind: "fill", fluid: "water", shape: "cylinder", center: [0, (SUCTION.y0 + BARREL.y0) / 2, 0], size: [2 * SUCTION.r - 0.02, BARREL.y0 - SUCTION.y0, 0], level: 1 },
    { id: "below", kind: "fill", fluid: "water", shape: "cylinder", size: [2 * BARREL.r - 0.02, BARREL.y1 - BARREL.y0, 0], level: 0 },
    { id: "above", kind: "fill", fluid: "water", shape: "cylinder", size: [2 * BARREL.r - 0.02, BARREL.y1 - BARREL.y0, 0], level: 0 },
    flap("footValve", 2 * SUCTION.r),
    {
      id: "piston",
      kind: "lathe",
      axis: Y,
      profile: [[0.16, -PISTON_H / 2], [BARREL.r - 0.01, -PISTON_H / 2], [BARREL.r - 0.01, PISTON_H / 2], [0.16, PISTON_H / 2]],
      ...backHalf(Y),
      arrow: false,
      pieces: [
        { kind: "cylinder", radius: 0.035, length: ROD, at: [0, 0, ROD / 2] },
        { kind: "box", size: [0.06, 0.06, 0.34], at: [0, 0, PISTON_H / 2 + 0.25] },
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
      ? [{ fluid: "water", points: [...stream([[0, -2.55, 0.1], [0, BARREL.y0 + 0.1, 0.1]], travel, { spacing: 0.2 }), ...stream([[-0.3, SPOUT_Y, 0.1], [-1.05, SPOUT_Y - 0.1, 0.1], [-1.15, SPOUT_Y - 1.2, 0.1]], travel, { spacing: 0.16 })] }]
      : [{ fluid: "water", points: stream([[0.05, p.piston - 0.35, 0.1], [0.05, pistonTop + 0.15, 0.1]], travel, { spacing: 0.12 }) }];
    return {
      parts: {
        handle: { position: HANDLE.pivot, angle: p.theta },
        link: { from: [p.E[0], p.E[1], 0.08], to: [p.top[0], p.top[1], 0.08] },
        piston: { position: [0, p.piston, 0] },
        // 下方的閥門:上行時被水頂開;活塞裡的閥門:下行時被水頂開
        // (2026-10-07 複查:原本換向的瞬間直接翻開 / 闔上;改成被水頂開、靠自重加速落回閥座)
        footValve: { position: [-SUCTION.r, BARREL.y0 + 0.03, 0], angle: OPEN * valveOpening(p.up, p.phase) },
        pistonValve: { position: [-0.16, pistonTop + 0.02, 0], angle: OPEN * valveOpening(!p.up, p.phase) },
        below: water(0, BARREL.y0, p.piston - PISTON_H / 2, BARREL.y1 - BARREL.y0),
        above: water(0, pistonTop, Math.max(pistonTop, SPOUT_Y), BARREL.y1 - BARREL.y0),
      },
      flows,
      readouts: [{ label: "活塞", value: p.up ? "上行:下閥開、活塞閥關,水從出水口溢出" : "下行:下閥關、活塞閥開,水穿過活塞" }],
    };
  },
  waivers: [
    { check: "interference", parts: ["piston", "pistonValve"], reason: "簡化畫法:活塞上的閥瓣套在活塞桿上(桿穿過閥瓣的孔沒畫),重疊 0.17" },
    { check: "interference", parts: ["works", "handle"], reason: "接合處的簡化畫法:手柄鉸接在泵體的耳上,重疊 0.08" },
    { check: "interference", parts: ["suction", "footValve"], reason: "簡化畫法:底閥的閥瓣坐在吸水管口上,重疊 0.04" },
    { check: "interference", parts: ["barrel", "works"], reason: "簡化畫法:泵筒接在泵體上,接口處重疊 0.07" },
  ],
};
