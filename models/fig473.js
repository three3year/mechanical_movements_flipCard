// 第 473 種:構造簡單的空氣泵。較小的桶倒扣在較大的桶裡,大桶裝水到上方虛線處;從要抽成真空的豎井引出的管子穿過水中,
// 伸到水面上方幾吋,末端有一個向上開的閥。上方的桶頂有一根短管,頂端也有一個向上開的閥,並以繩子吊在槓桿上。
// 上方的桶下降時,裡面大部分的空氣經上方的閥排出;隨後被抬起時,裡面變得稀薄,氣體便經下方的閥上升。
// 這種泵曾成功用來從又大又深的豎井中抽出碳酸氣。
// 主動件是左邊的槓桿(把手在外端)。
// 照原圖(2026-10-20 決定 (a)):兩根槓桿各鉸在頂上橫樑的托架上,外端各垂一條繩、繩下一根橫把手;桶頂兩個耳各拉一條繩,
// 交叉往上接到對面槓桿的內端(左耳的繩接左槓桿在中線右邊的內端,右耳的繩接右槓桿在中線左邊的內端),兩繩對稱、水平分力
// 抵消,桶吊在中線上。兩根槓桿怎麼同步原圖看不出來,模型讓右槓桿鏡射左槓桿的擺動(兩手同時扳;推斷);
// 兩根槓桿分前後兩層,交叉處才不相碰。桶的高度由繩長不變算出;桶做得夠深,桶口全程在水面下(原文「提起時裡面變稀薄」要有水封)。
// 推斷:兩個閥門依桶的走向開合;剖面圖。
import { Y, X, deg } from "./kit.js";
import { stroke, valveOpening, flap } from "./pump.js";
import { stream } from "./flow.js";
import { backHalf } from "./section.js";
import { shape, thickLine, circle } from "./shapes.js";

const BEAM_Y = 2.95;
const PIVOT_Y = 2.75;
const PIVOTS = { L: [-0.5, PIVOT_Y], R: [0.5, PIVOT_Y] }; // 兩根槓桿的支點(頂上橫樑前面的托架)
const LAYER = { L: 0.25, R: 0.37 }; // 兩根槓桿各在一層
const ARM_IN = 0.8; // 支點到內端(繩的繫點;越過中線到另一邊)
const HANDLE = 1.9; // 支點到外端
const HANG = 1.3; // 外端到把手
export const SWING = [deg(-15), deg(15)]; // 左槓桿:把手往上 → 往下(逆時針轉,內端把桶提起)
export const OUTER = { r: 1.05, y0: -1.6, y1: 0.4 };
export const WATER = 0.15;
export const BELL = { r: 0.78, len: 1.9 };
const LUG = 0.3; // 桶頂的耳離中線
export const ROPE = 1.2; // 耳到槓桿內端的繩
const PIPE_TOP = WATER + 0.3;

/** 槓桿轉 a → 兩根槓桿的內端與外端、倒扣桶頂的高度(由繩長算)、是否往上 */
export function bell(v) {
  const phase = stroke(v, ...SWING);
  const { at, forward } = phase;
  const endL = [PIVOTS.L[0] + ARM_IN * Math.cos(at), PIVOTS.L[1] + ARM_IN * Math.sin(at)];
  const endR = [PIVOTS.R[0] - ARM_IN * Math.cos(at), PIVOTS.R[1] + ARM_IN * Math.sin(at)];
  const outL = [PIVOTS.L[0] - HANDLE * Math.cos(at), PIVOTS.L[1] - HANDLE * Math.sin(at)];
  const outR = [PIVOTS.R[0] + HANDLE * Math.cos(at), PIVOTS.R[1] - HANDLE * Math.sin(at)];
  const lugY = endL[1] - Math.sqrt(ROPE * ROPE - (endL[0] + LUG) ** 2); // 左耳(在中線左邊)吊在左槓桿的內端(中線右邊)下
  return { angle: at, endL, endR, outL, outR, top: lugY - 0.1, rising: forward, phase };
}

const lever = (id, [x0, x1], pivot, z) => ({
  id,
  kind: "plate",
  shape: shape(thickLine([[x0, 0], [x1, 0]], 0.1), [circle(0.04).reverse()]),
  thickness: 0.1,
  center: [pivot[0], pivot[1], z],
  arrow: false,
});

export default {
  figure: 473,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.14, 4.6, 0.14], at: [-1.35, 0.6, 0] },
        { kind: "box", size: [0.14, 4.6, 0.14], at: [1.35, 0.6, 0] },
        { kind: "box", size: [3.0, 0.16, 0.3], at: [0, BEAM_Y, 0] },
        // 兩根槓桿的支座:從橫樑前面垂下的托架與樞軸銷(推斷;原圖的槓桿架在框架頂上),右邊的托架伸到前面那一層
        { kind: "box", size: [0.16, 0.24, LAYER.L - 0.05 - 0.15], at: [PIVOTS.L[0], 2.8, (0.15 + LAYER.L - 0.05) / 2] },
        { kind: "cylinder", radius: 0.035, length: 0.2, at: [PIVOTS.L[0], PIVOT_Y, LAYER.L] },
        { kind: "box", size: [0.16, 0.24, LAYER.R - 0.05 - 0.15], at: [PIVOTS.R[0], 2.8, (0.15 + LAYER.R - 0.05) / 2] },
        { kind: "cylinder", radius: 0.035, length: 0.2, at: [PIVOTS.R[0], PIVOT_Y, LAYER.R] },
        { kind: "box", size: [3.0, 0.2, 1.4], at: [0, OUTER.y0 - 0.1, 0] },
        { kind: "lathe", axis: Y, profile: [[0, 0], [OUTER.r + 0.08, 0], [OUTER.r + 0.08, OUTER.y1 - OUTER.y0], [OUTER.r, OUTER.y1 - OUTER.y0], [OUTER.r, 0.08], [0, 0.08]], at: [0, OUTER.y0, 0], ...backHalf(Y) },
        // 從豎井引來的管子(穿過水,伸到水面上)
        { kind: "plate", shape: shape(thickLine([[0.25, -2.5], [0.25, PIPE_TOP]], 0.12)), thickness: 0.12 },
      ],
    },
    { id: "water", kind: "fill", fluid: "water", shape: "cylinder", center: [0, (OUTER.y0 + 0.08 + WATER) / 2, 0], size: [2 * OUTER.r - 0.04, WATER - OUTER.y0 - 0.08, 0], level: 1 },
    {
      // 倒扣的桶(原點在桶頂;剖開前半)、頂上的短管、兩個耳與耳上的銷(繩繫在銷上)
      id: "bell",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "lathe", axis: Y, profile: [[BELL.r, -BELL.len], [BELL.r + 0.06, -BELL.len], [BELL.r + 0.06, 0], [0.1, 0], [0.1, -0.06], [BELL.r, -0.06]], ...backHalf(Y) },
        { kind: "cylinder", axis: Y, radius: 0.1, length: 0.3, at: [0, 0.15, 0] },
        ...[-1, 1].flatMap((s) => [
          { kind: "box", size: [0.12, 0.14, 0.3], at: [s * LUG, 0.07, 0.05], role: "lug" },
          { kind: "cylinder", radius: 0.03, length: 0.3, at: [s * LUG, 0.1, 0.3] },
        ]),
      ],
    },
    flap("topValve", 0.2),
    flap("pipeValve", 0.2),
    lever("leverL", [-HANDLE, ARM_IN + 0.1], PIVOTS.L, LAYER.L),
    lever("leverR", [-ARM_IN - 0.1, HANDLE], PIVOTS.R, LAYER.R),
    { id: "ropeL", kind: "rope", radius: 0.02 },
    { id: "ropeR", kind: "rope", radius: 0.02 },
    { id: "ropeHandleL", kind: "rope", radius: 0.02 },
    { id: "ropeHandleR", kind: "rope", radius: 0.02 },
    { id: "handleL", kind: "cylinder", axis: X, radius: 0.04, length: 0.5, arrow: false },
    { id: "handleR", kind: "cylinder", axis: X, radius: 0.04, length: 0.5, arrow: false },
  ],
  powered: ["topValve", "pipeValve"], // 外力來源:閥瓣是被氣流頂開的(流體傳動,沒有實體相連)
  driver: { part: "leverL", type: "rotation", cycle: SWING },
  target: "bell",
  view: { direction: [0.1, 0.1, 1] },
  pose(v) {
    const b = bell(v);
    const travel = v * 8;
    const open = deg(55);
    const flows = b.rising
      ? [{ fluid: "air", points: stream([[0.25, -2.4, 0.2], [0.25, PIPE_TOP, 0.2], [0.25, b.top - 0.3, 0.2]], travel, { spacing: 0.2 }) }]
      : [{ fluid: "air", points: stream([[0, b.top - 0.3, 0.2], [0, b.top + 0.35, 0.2], [0.2, b.top + 0.8, 0.2]], travel, { spacing: 0.15 }) }];
    const lug = (s, z) => [s * LUG, b.top + 0.1, z];
    return {
      parts: {
        leverL: { angle: b.angle },
        leverR: { angle: -b.angle },
        bell: { position: [0, b.top, 0] },
        // 閥瓣被氣流頂開、回程加速落回閥座(pump.js 的 valveOpening)
        topValve: { position: [-0.1, b.top + 0.3, 0.05], angle: open * valveOpening(!b.rising, b.phase) },
        pipeValve: { position: [0.15, PIPE_TOP, 0.05], angle: open * valveOpening(b.rising, b.phase) },
        handleL: { position: [b.outL[0], b.outL[1] - HANG, LAYER.L] },
        handleR: { position: [b.outR[0], b.outR[1] - HANG, LAYER.R] },
      },
      paths: {
        // 交叉的繩:左槓桿的內端(中線右邊)→ 左耳,右槓桿的內端(中線左邊)→ 右耳
        ropeL: { points: [[...b.endL, LAYER.L], lug(-1, LAYER.L)], closed: false, phase: 0 },
        ropeR: { points: [[...b.endR, LAYER.R], lug(1, LAYER.R)], closed: false, phase: 0 },
        ropeHandleL: { points: [[...b.outL, LAYER.L], [b.outL[0], b.outL[1] - HANG, LAYER.L]], closed: false, phase: 0 },
        ropeHandleR: { points: [[...b.outR, LAYER.R], [b.outR[0], b.outR[1] - HANG, LAYER.R]], closed: false, phase: 0 },
      },
      flows,
      readouts: [{ label: "倒扣的桶", value: b.rising ? "被提起:裡面變稀薄,氣體經下方的閥上來" : "下降:空氣經頂上的閥排出" }],
    };
  },
};
