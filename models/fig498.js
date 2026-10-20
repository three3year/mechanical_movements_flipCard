// 第 498 種:虹吸式壓力計。彎管的下部盛水銀;標刻度的管腳上端開口,另一管腳接到蒸汽鍋爐或其他要指示壓力的裝置。
// 一側管腳裡的水銀受壓,在該側下降、在另一側上升,直到「一側的水銀重量 + 蒸汽壓力」與「另一側的水銀重量 + 大氣壓力」平衡。
// 這是已知最精確的壓力計;但高壓需要很長的管子,所以已被其他實用上夠精確、形式也更方便的壓力計取代。
// 主動件是虛擬的「壓力」(錶壓,以水銀柱高表示)。
// 推斷:兩管腳粗細相同,所以壓力造成的水銀柱高度差,一半是左邊下降、一半是右邊上升;刻度 0–6。
// 玻璃管畫縱剖面(每根管腳前後兩半沒畫,只畫左右兩道管壁):彎頭是以 (0, BEND_Y) 為圓心、半徑 RIGHT ± BORE 的兩道弧,
// 端點接上兩管腳的管壁;接鍋爐那側的管腳頂收成一個接頭接到彎管(推斷:原圖管腳頂往左彎到旋塞)。
// 刻度刻在開口管腳後面的刻度板上(推斷:原圖刻度與數字排在管腳右邊;另列一件,不塗目標色,水銀柱才看得清楚),
// 左管腳的零點記號刻在管上;開口管腳的管口是一圈玻璃(管壁的兩半在這裡相連)。
import { clamp } from "./kit.js";
import { stream } from "./flow.js";
import { shape, thickLine, circle, rect } from "./shapes.js";
import { uTubeBend } from "./u-tube.js";

export const LEFT = -0.35;
export const RIGHT = 0.35;
export const ZERO = 0.0; // 壓力為零時兩邊的水銀面
const BOTTOM = -2.6;
const BEND_Y = BOTTOM + RIGHT; // 彎頭的圓心高度(管腳的下端)
const TOP_R = 3.4; // 開口管腳的頂
const TOP_L = 1.9; // 接鍋爐的管腳頂(往左彎出去)
export const UNIT = 0.5; // 每單位壓力的刻度間距(水銀柱高度差 = 壓力 × UNIT)
export const RANGE = [0, 6];
export const BORE = 0.12; // 管壁中心線離管軸
const WALL = 0.04; // 管壁厚
const BEND = uTubeBend({ legs: [LEFT, RIGHT], bendY: BEND_Y, bore: BORE, wall: WALL });
const INSIDE = BEND.inside; // 水銀填色離管軸(留一點空隙,不畫進管壁)

/** 壓力 p → 左、右水銀面的高度 */
export function levels(p0) {
  const p = clamp(p0, ...RANGE);
  const h = p * UNIT;
  return { left: ZERO - h / 2, right: ZERO + h / 2, diff: h };
}

const plate = (outline, z = 0, thickness = 0.1) => ({ kind: "plate", shape: shape(outline), thickness, ...(z ? { at: [0, 0, z] } : {}) });
const tube = (x, top) => [1, -1].map((s) => plate(thickLine([[x + s * BORE, top], [x + s * BORE, BEND_Y]], WALL)));
const BOARD = { x0: RIGHT - BORE - WALL / 2, x1: RIGHT + 0.85, top: TOP_R - 0.05, z: -0.05 - 0.02 }; // 刻度板:貼在開口管腳後面(頂低於管口)

export default {
  figure: 498,
  parts: [
    {
      id: "tube",
      kind: "group",
      pieces: [
        // U 形管:接鍋爐的左管腳與下面的彎頭
        ...tube(LEFT, TOP_L),
        ...BEND.walls.map((w) => plate(w)),
        // 左管腳頂收成接頭(推斷),接到往左彎的彎管與旋塞
        plate([[LEFT - BORE - WALL / 2, TOP_L], [LEFT + BORE + WALL / 2, TOP_L], [LEFT + 0.05, TOP_L + 0.12], [LEFT - 0.05, TOP_L + 0.12]]),
        plate(thickLine([[LEFT, TOP_L], [LEFT - 0.25, TOP_L + 0.3], [-2.0, TOP_L + 0.3]], 0.1)),
        { kind: "plate", shape: shape(circle(0.18, -1.45, TOP_L + 0.3)), thickness: 0.2 },
        // 左管腳的零點記號(刻在管上)
        { kind: "box", size: [0.18, 0.02, 0.02], at: [LEFT - BORE - WALL / 2 - 0.09, ZERO, 0.03] },
      ],
    },
    // 標刻度的開口管腳(水銀在裡面升起、指出壓力):獨立成一個零件當目標件
    {
      id: "gaugeLeg",
      kind: "group",
      pieces: [
        ...tube(RIGHT, TOP_R),
        { kind: "cylinder", radius: BORE + WALL / 2, inner: BORE - WALL / 2, length: 0.03, axis: [0, 1, 0], at: [RIGHT, TOP_R - 0.015, 0] }, // 管口
      ],
    },
    // 刻度板:貼在開口管腳後面,刻度線在它的正面、管腳右邊
    {
      id: "scale",
      kind: "group",
      pieces: [
        plate(rect(BOARD.x1 - BOARD.x0, BOARD.top - BEND_Y, (BOARD.x0 + BOARD.x1) / 2, (BOARD.top + BEND_Y) / 2), BOARD.z, 0.04),
        ...Array.from({ length: 7 }, (_, k) => ({ kind: "box", accent: true, size: [0.2, 0.035, 0.03], at: [RIGHT + BORE + WALL / 2 + 0.1, ZERO + (k * UNIT) / 2, BOARD.z + 0.035] })),
      ],
    },
    ...Array.from({ length: 7 }, (_, k) => ({ id: `tick${k}`, kind: "group", pieces: [], label: String(k), labelOffset: [RIGHT + 0.6, ZERO + (k * UNIT) / 2, 0.1] })),
    { id: "leftMercury", kind: "fill", fluid: "mercury", center: [LEFT, (BEND_Y + ZERO) / 2, 0], size: [2 * INSIDE, ZERO - BEND_Y, 0.08], level: 1 },
    { id: "rightMercury", kind: "fill", fluid: "mercury", center: [RIGHT, (BEND_Y + TOP_R) / 2, 0], size: [2 * INSIDE, TOP_R - BEND_Y, 0.08], level: 0.5 },
    { id: "bendMercury", kind: "fill", fluid: "mercury", center: [...BEND.center, 0], outline: BEND.mercury, size: [0, 0, 0.08], level: 1 },
  ],
  driver: { type: "virtual", label: "壓力", mode: "balance", range: RANGE, initial: 2 },
  target: "gaugeLeg", // 水銀是流體(不上目標色);標水銀柱在裡面升起的那根刻度管腳
  view: { direction: [0.03, 0.05, 1] },
  pose(p) {
    const l = levels(p);
    const leftH = ZERO - BEND_Y;
    const rightH = TOP_R - BEND_Y;
    return {
      parts: {
        leftMercury: { level: (l.left - BEND_Y) / leftH },
        rightMercury: { level: (l.right - BEND_Y) / rightH },
      },
      flows: [{ fluid: "steam", points: stream([[-2.0, TOP_L + 0.3, 0.1], [LEFT - 0.25, TOP_L + 0.3, 0.1], [LEFT, TOP_L, 0.1], [LEFT, l.left + 0.1, 0.1]], p * 3, { spacing: 0.25 }) }],
      readouts: [{ label: "壓力(水銀柱高度差)", value: `${l.diff.toFixed(2)}(刻度 ${(l.diff / UNIT).toFixed(1)})` }],
    };
  },
};
