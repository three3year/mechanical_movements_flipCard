// 第 449 種:現代的提升泵。運作與前一種相同,只是活塞桿穿過填料函,出水口由一個向上開的瓣閥封住;水可以抬到泵上方的任何高度。
// 主動件是活塞桿(上下往復)。
// 推斷:泵已經引過水;出水管從泵筒頂端往右、往上,頂上是向上開的瓣閥;剖面圖。
import { Y, deg } from "./kit.js";
import { stream } from "./flow.js";
import { stroke, flap, barrel, water, pipeWalls, valveOpening } from "./pump.js";
import { backHalf } from "./section.js";

export const BARREL = { r: 0.42, y0: -1.1, y1: 1.0 };
const SUCTION = { r: 0.22, y0: -2.3 };
export const STROKE = [-0.55, 0.45]; // 活塞高度(下 → 上)
const PISTON_H = 0.25;
const ROD = 2.3;
const OUT = [[BARREL.r, 0.75], [0.95, 0.75], [0.95, 1.95]];
const OPEN = deg(55);

export default {
  figure: 449,
  parts: [
    barrel("barrel", { ...BARREL }),
    barrel("suction", { r: SUCTION.r, y0: SUCTION.y0, y1: BARREL.y0 + 0.05, wall: 0.06 }),
    {
      id: "works",
      kind: "group",
      pieces: [
        // 泵筒底、頂蓋與填料函
        { kind: "lathe", axis: Y, profile: [[SUCTION.r, 0], [BARREL.r + 0.07, 0], [BARREL.r + 0.07, 0.08], [SUCTION.r, 0.08]], at: [0, BARREL.y0 - 0.08, 0], ...backHalf(Y) },
        { kind: "lathe", axis: Y, profile: [[0.05, 0], [BARREL.r + 0.07, 0], [BARREL.r + 0.07, 0.1], [0.05, 0.1]], at: [0, BARREL.y1, 0], ...backHalf(Y) },
        { kind: "lathe", axis: Y, profile: [[0.05, 0], [0.13, 0], [0.13, 0.3], [0.05, 0.3]], at: [0, BARREL.y1 + 0.1, 0], ...backHalf(Y) },
        // 出水管與頂上的喇叭口
        ...pipeWalls(OUT, 0.3),
        { kind: "lathe", axis: Y, profile: [[0.16, 0], [0.22, 0], [0.32, 0.5], [0.26, 0.5]], at: [0.95, 1.95, 0], ...backHalf(Y) },
      ],
    },
    { id: "well", kind: "fill", fluid: "water", center: [0, -2.55, 0], size: [2.2, 0.5, 1.2], level: 1 },
    { id: "suctionWater", kind: "fill", fluid: "water", shape: "cylinder", center: [0, (SUCTION.y0 + BARREL.y0) / 2, 0], size: [2 * SUCTION.r - 0.02, BARREL.y0 - SUCTION.y0, 0], level: 1 },
    { id: "below", kind: "fill", fluid: "water", shape: "cylinder", size: [2 * BARREL.r - 0.02, BARREL.y1 - BARREL.y0, 0], level: 0 },
    { id: "above", kind: "fill", fluid: "water", shape: "cylinder", size: [2 * BARREL.r - 0.02, BARREL.y1 - BARREL.y0, 0], level: 0 },
    { id: "outWater", kind: "fill", fluid: "water", center: [0.95, 1.35, 0], size: [0.26, 1.2, 0.3], level: 1 },
    flap("footValve", 2 * SUCTION.r),
    {
      id: "piston",
      kind: "lathe",
      axis: Y,
      profile: [[0.16, -PISTON_H / 2], [BARREL.r - 0.01, -PISTON_H / 2], [BARREL.r - 0.01, PISTON_H / 2], [0.16, PISTON_H / 2]],
      ...backHalf(Y),
      arrow: false,
      pieces: [{ kind: "cylinder", radius: 0.035, length: ROD, at: [0, 0, ROD / 2] }],
    },
    flap("pistonValve", 0.32),
    flap("outValve", 0.3),
  ],
  driver: { part: "piston", type: "translation", direction: [0, 1, 0], cycle: STROKE },
  powered: ["footValve", "pistonValve", "outValve"], // 外力來源:閥瓣是被水頂開的(流體傳動,沒有實體相連)
  target: "outValve", // 出水口向上開的瓣閥:水從這裡被送到泵上方
  view: { direction: [0.08, 0.06, 1] },
  pose(v) {
    const phase = stroke(v, ...STROKE);
    const { at: y, forward: up } = phase;
    const travel = v * 4;
    const top = y + PISTON_H / 2;
    const flows = up
      ? [{ fluid: "water", points: [...stream([[0, -2.45, 0.1], [0, BARREL.y0 + 0.1, 0.1]], travel, { spacing: 0.2 }), ...stream([[0.1, 0.85, 0.1], [0.95, 0.75, 0.1], [0.95, 2.3, 0.1], [1.4, 2.0, 0.1], [1.5, 1.2, 0.1]], travel, { spacing: 0.16 })] }]
      : [{ fluid: "water", points: stream([[0.05, y - 0.35, 0.1], [0.05, top + 0.15, 0.1]], travel, { spacing: 0.12 }) }];
    return {
      parts: {
        piston: { position: [0, y, 0] },
        // (2026-10-07 複查:原本換向的瞬間直接翻開 / 闔上;改成被水頂開、靠自重加速落回閥座)
        footValve: { position: [-SUCTION.r, BARREL.y0 + 0.03, 0], angle: OPEN * valveOpening(up, phase) },
        pistonValve: { position: [-0.16, top + 0.02, 0], angle: OPEN * valveOpening(!up, phase) },
        // 出水口的瓣閥:上行時被水頂開(向上開)
        outValve: { position: [0.8, 1.95, 0], angle: OPEN * valveOpening(up, phase) },
        below: water(0, BARREL.y0, y - PISTON_H / 2, BARREL.y1 - BARREL.y0),
        above: water(0, top, BARREL.y1, BARREL.y1 - BARREL.y0),
      },
      flows,
      readouts: [{ label: "活塞", value: up ? "上行:下閥開、活塞閥關,出水瓣閥被頂開" : "下行:下閥關、活塞閥開,出水瓣閥關上" }],
    };
  },
  waivers: [
    { check: "interference", parts: ["piston", "pistonValve"], reason: "簡化畫法:活塞上的閥瓣套在活塞桿上(桿穿過閥瓣的孔沒畫),重疊 0.17" },
    { check: "interference", parts: ["works", "outValve"], reason: "簡化畫法:出水閥的閥瓣坐在閥座上,重疊 0.05(96 個取樣中 50 個)" },
    { check: "interference", parts: ["suction", "footValve"], reason: "簡化畫法:底閥的閥瓣坐在吸水管口上,重疊 0.04" },
    { check: "interference", parts: ["barrel", "works"], reason: "簡化畫法:泵筒接在泵體上,接口處重疊 0.07" },
  ],
};
