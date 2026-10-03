// 第 473 種:構造簡單的空氣泵。較小的桶倒扣在較大的桶裡,大桶裝水到上方虛線處;從要抽成真空的豎井引出的管子穿過水中,
// 伸到水面上方幾吋,末端有一個向上開的閥。上方的桶頂有一根短管,頂端也有一個向上開的閥,並以繩子吊在槓桿上。
// 上方的桶下降時,裡面大部分的空氣經上方的閥排出;隨後被抬起時,裡面變得稀薄,氣體便經下方的閥上升。
// 這種泵曾成功用來從又大又深的豎井中抽出碳酸氣。
// 主動件是槓桿(把手在左)。
// 推斷:槓桿繞框架頂上的支點擺動,右端以繩子吊著倒扣的桶;兩個閥門依桶的走向開合;剖面圖。
import { Y, deg } from "./kit.js";
import { stroke, flap } from "./pump.js";
import { stream } from "./flow.js";
import { backHalf } from "./section.js";
import { shape, thickLine } from "./shapes.js";

const PIVOT = [0.0, 2.75, 0];
const ARM = 1.0; // 支點到吊繩
const HANDLE = 1.9;
export const SWING = [deg(-12), deg(12)]; // 把手往上 → 往下(逆時針轉,右端把桶提起)
const OUTER = { r: 1.05, y0: -1.6, y1: 0.4 };
export const WATER = 0.15;
const BELL = { r: 0.78, len: 1.4 };
const PIPE_TOP = WATER + 0.3;
const ROPE = 1.1;

/** 槓桿轉 a → 倒扣桶頂的高度、是否往上 */
export function bell(v) {
  const { at, forward } = stroke(v, ...SWING);
  const end = [PIVOT[0] + ARM * Math.cos(at), PIVOT[1] + ARM * Math.sin(at)];
  return { angle: at, end, top: end[1] - ROPE, rising: forward };
}

export default {
  figure: 473,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.14, 4.6, 0.14], at: [-1.35, 0.6, 0] },
        { kind: "box", size: [0.14, 4.6, 0.14], at: [1.35, 0.6, 0] },
        { kind: "box", size: [3.0, 0.16, 0.3], at: [0, 2.95, 0] },
        { kind: "box", size: [3.0, 0.2, 1.4], at: [0, OUTER.y0 - 0.1, 0] },
        { kind: "lathe", axis: Y, profile: [[0, 0], [OUTER.r + 0.08, 0], [OUTER.r + 0.08, OUTER.y1 - OUTER.y0], [OUTER.r, OUTER.y1 - OUTER.y0], [OUTER.r, 0.08], [0, 0.08]], at: [0, OUTER.y0, 0], ...backHalf(Y) },
        // 從豎井引來的管子(穿過水,伸到水面上)
        { kind: "plate", shape: shape(thickLine([[0.25, -2.5], [0.25, PIPE_TOP]], 0.12)), thickness: 0.12 },
      ],
    },
    { id: "water", kind: "fill", fluid: "water", shape: "cylinder", center: [0, (OUTER.y0 + 0.08 + WATER) / 2, 0], size: [2 * OUTER.r - 0.04, WATER - OUTER.y0 - 0.08, 0], level: 1 },
    {
      id: "bell",
      kind: "lathe",
      axis: Y,
      profile: [[BELL.r, -BELL.len], [BELL.r + 0.06, -BELL.len], [BELL.r + 0.06, 0], [0.1, 0], [0.1, -0.06], [BELL.r, -0.06]],
      ...backHalf(Y),
      arrow: false,
      pieces: [{ kind: "cylinder", radius: 0.1, length: 0.3, at: [0, 0, 0.15] }],
    },
    flap("topValve", 0.2),
    flap("pipeValve", 0.2),
    { id: "lever", kind: "plate", shape: shape(thickLine([[-HANDLE, 0], [ARM + 0.1, 0]], 0.1)), thickness: 0.1, center: PIVOT, arrow: false, pieces: [{ kind: "sphere", radius: 0.12, at: [-HANDLE, 0, 0] }] },
    { id: "rope", kind: "rope", radius: 0.02 },
  ],
  driver: { part: "lever", type: "rotation", cycle: SWING },
  view: { direction: [0.1, 0.1, 1] },
  pose(v) {
    const b = bell(v);
    const travel = v * 8;
    const open = deg(55);
    const flows = b.rising
      ? [{ fluid: "air", points: stream([[0.25, -2.4, 0.2], [0.25, PIPE_TOP, 0.2], [0.25, b.top - 0.3, 0.2]], travel, { spacing: 0.2 }) }]
      : [{ fluid: "air", points: stream([[0, b.top - 0.3, 0.2], [0, b.top + 0.35, 0.2], [0.2, b.top + 0.8, 0.2]], travel, { spacing: 0.15 }) }];
    return {
      parts: {
        lever: { angle: b.angle },
        bell: { position: [0, b.top, 0] },
        topValve: { position: [-0.1, b.top + 0.3, 0.05], angle: b.rising ? 0 : open },
        pipeValve: { position: [0.15, PIPE_TOP, 0.05], angle: b.rising ? open : 0 },
      },
      paths: { rope: { points: [[...b.end, 0], [0, b.top + 0.3, 0]], closed: false, phase: 0 } },
      flows,
      readouts: [{ label: "倒扣的桶", value: b.rising ? "被提起:裡面變稀薄,氣體經下方的閥上來" : "下降:空氣經頂上的閥排出" }],
    };
  },
};
