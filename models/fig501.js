// 第 501 種:水銀氣壓計。彎管較長的管腳標著英吋刻度、頂端封閉,較短的管腳對大氣開放(或只蓋一層多孔材料)。
// 長管腳裡水銀柱上方的空氣已抽除,水銀柱由作用在短管腳水銀面上的大氣壓力支撐,隨大氣壓力的變化而升降。
// 舊式的晴雨錶用一根類似的管子裝在錶盤背面,有一個浮子放在管子的短管腳裡,經齒條與小齒輪、或繩與滑輪接到指針的心軸。
// 主動件是虛擬的「大氣壓力」(以水銀柱的英吋表示)。
// 推斷:兩管腳粗細相同,氣壓變化造成的高度差變化,一半是長管腳上升、一半是短管腳下降;28 吋以下的水銀柱縮短畫出;
// 晴雨錶的浮子機構沒有畫出。
// 玻璃管畫縱剖面(前後兩半沒畫,只畫左右兩道管壁);短管腳頂蓋一層多孔材料(推斷:原文「或僅以某種多孔材料覆蓋」),
// 英吋刻度刻在長管腳後面的刻度板上(推斷:原圖刻度排在長管腳右邊;另列一件,不塗目標色,水銀柱才看得清楚)。
import { clamp } from "./kit.js";
import { shape, thickLine, rect } from "./shapes.js";
import { uTubeBend } from "./u-tube.js";

export const RANGE = [28, 31]; // 英吋水銀柱
export const SCALE = 0.4; // 每英吋在圖上的長度
const OFFSET = 2.6; // 28 吋的水銀柱在圖上的高度(縮短表示)
const LONG_X = 0.25;
const SHORT_X = -0.25;
const BEND_Y = -2.6;
export const BORE = 0.08; // 管壁中心線離管軸
const WALL = 0.03;
const BEND = uTubeBend({ legs: [SHORT_X, LONG_X], bendY: BEND_Y, bore: BORE, wall: WALL });
const INSIDE = BEND.inside; // 水銀填色離管軸(不畫進管壁)
const BASE = -1.7; // 氣壓 28 吋時短管腳的水銀面
const TOP = 2.4; // 長管腳的封閉頂
const SHORT_TOP = -1.3;

/** 大氣壓力 h(吋)→ 長、短管腳的水銀面 */
export function columns(h0) {
  const h = clamp(h0, ...RANGE);
  const d = (h - RANGE[0]) * SCALE; // 比 28 吋多出的高度差
  const short = BASE - d / 2;
  const long = short + OFFSET + d; // 水銀柱高(圖上把 28 吋以下的部分縮短成 OFFSET)
  return { short, long, height: long - short };
}

const plate = (outline, z = 0, thickness = 0.08) => ({ kind: "plate", shape: shape(outline), thickness, ...(z ? { at: [0, 0, z] } : {}) });
const wall = (pts) => [1, -1].map((s) => plate(thickLine(pts.map(([x, y]) => [x + s * BORE, y]), WALL)));
const BOARD = { x0: LONG_X - BORE - WALL / 2, x1: LONG_X + 0.8, y0: columns(RANGE[0]).long - 0.45, z: -0.04 - 0.02 }; // 刻度板:貼在長管腳後面

export default {
  figure: 501,
  parts: [
    {
      id: "tube",
      kind: "group",
      pieces: [
        ...wall([[SHORT_X, SHORT_TOP], [SHORT_X, BEND_Y]]),
        ...BEND.walls.map((w) => plate(w)),
        // 短管腳頂蓋的多孔材料(推斷)
        plate(rect(2 * BORE + WALL, 0.05, SHORT_X, SHORT_TOP + 0.025)),
      ],
    },
    // 標刻度、頂端封閉的長管腳(水銀柱在裡面隨氣壓升降):獨立成一個零件當目標件
    {
      id: "longLeg",
      kind: "group",
      pieces: [
        ...wall([[LONG_X, TOP], [LONG_X, BEND_Y]]),
        { kind: "box", size: [2 * BORE + 0.06, 0.04, 0.08], at: [LONG_X, TOP + 0.02, 0] },
      ],
    },
    // 刻度板:貼在長管腳後面,英吋刻度在它的正面
    {
      id: "scale",
      kind: "group",
      pieces: [
        plate(rect(BOARD.x1 - BOARD.x0, TOP + 0.04 - BOARD.y0, (BOARD.x0 + BOARD.x1) / 2, (TOP + 0.04 + BOARD.y0) / 2), BOARD.z, 0.04),
        // 長管腳旁的英吋刻度(28–31):在刻度板的正面
        ...Array.from({ length: 4 }, (_, k) => ({ kind: "box", accent: true, size: [0.25, 0.035, 0.03], at: [LONG_X + BORE + WALL / 2 + 0.125, columns(RANGE[0] + k).long, BOARD.z + 0.035] })),
      ],
    },
    ...Array.from({ length: 4 }, (_, k) => ({ id: `inch${k}`, kind: "group", pieces: [], label: String(RANGE[0] + k), labelOffset: [LONG_X + 0.65, columns(RANGE[0] + k).long, 0.1] })),
    { id: "longMercury", kind: "fill", fluid: "mercury", center: [LONG_X, (BEND_Y + TOP) / 2, 0], size: [2 * INSIDE, TOP - BEND_Y, 0.06], level: 0.5 },
    { id: "shortMercury", kind: "fill", fluid: "mercury", center: [SHORT_X, (BEND_Y + SHORT_TOP) / 2, 0], size: [2 * INSIDE, SHORT_TOP - BEND_Y, 0.06], level: 0.5 },
    { id: "bendMercury", kind: "fill", fluid: "mercury", center: [...BEND.center, 0], outline: BEND.mercury, size: [0, 0, 0.06], level: 1 },
  ],
  driver: { type: "virtual", label: "大氣壓力", mode: "balance", range: RANGE, initial: 29.9, format: (h) => `${h.toFixed(1)} 吋` },
  target: "longLeg", // 水銀是流體(不上目標色);標水銀柱在裡面升降的那根刻度長管腳
  view: { direction: [0.03, 0.05, 1] },
  pose(h) {
    const c = columns(h);
    return {
      parts: {
        longMercury: { level: (c.long - BEND_Y) / (TOP - BEND_Y) },
        shortMercury: { level: (c.short - BEND_Y) / (SHORT_TOP - BEND_Y) },
      },
      readouts: [{ label: "水銀柱", value: `${clamp(h, ...RANGE).toFixed(1)} 吋(上方是真空)` }],
    };
  },
};
