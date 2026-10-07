// 第 407 種:畫尖拱的儀器。水平桿上開有溝槽,裝著一個帶銷的滑塊,繩圈套在銷上;彈性木材做的拱形尺固定在上面,與水平桿成直角。
// 把水平桿的上緣放在起拱線上、拱形尺的背面對著開口的拱腳,再把拱形尺傾斜到它的上緣碰到拱頂石;鉛筆固定在拱形尺與繩相連處。
//
// 2026-10-07 複查:原本模型把它當成「以銷為圓心、繩長為半徑」的圓規,拱形尺畫成一段不動的弧、鉛筆沿弧走(主動件是鉛筆)。
// 原圖是一張弓:拱形尺的根部夾在水平桿左端、與桿成直角,頂端由一條繩拉到溝槽裡滑塊的銷上;滑塊移動,繩把尺的頂端往下拉,
// 尺就彎成不同的弧(拱的一側),頂端的鉛筆對到拱頂。改成:主動件是溝槽裡的滑塊(左右移),繩長不變,拱形尺彎成一段
// 圓弧(根部與拱腳相切,原文「支點於其基部仍保持與拱腳相切」),彎多少由「頂端到滑塊銷的距離 = 繩長」決定;紅線是尺的外緣
// (要畫的拱的一側)。
// 推斷:彈性尺彎成圓弧(實際是彈性曲線,差不多);尺長取等邊尖拱一側的弧長;繩長取滑塊在中間時剛好彎成等邊尖拱。
import { clamp } from "./kit.js";
import { shape, rect } from "./shapes.js";

const SPAN = 3.4;
const Y0 = -1.6; // 起拱線(水平桿的上緣)
const BASE = [-SPAN / 2, Y0]; // 拱形尺的根部(在左邊的拱腳)
export const LENGTH = (SPAN * Math.PI) / 3; // 拱形尺的長(等邊尖拱一側的弧長)
const PIN_Y = Y0 + 0.05; // 滑塊上的銷
const tipOf = (k) => (k < 1e-6 ? [BASE[0], BASE[1] + LENGTH] : [BASE[0] + (1 - Math.cos(k * LENGTH)) / k, BASE[1] + Math.sin(k * LENGTH) / k]);
// 繩斜斜地拉到拱頂右下方的滑塊(滑塊往右,繩把頂端往右下拉,尺彎得更厲害);
// 繩長取滑塊在 MID 時,尺剛好彎成以右邊拱腳為圓心、跨度為半徑的弧(等邊尖拱)
const K_EQ = 1 / SPAN;
const MID = 0.9;
export const STRING = Math.hypot(tipOf(K_EQ)[0] - MID, tipOf(K_EQ)[1] - PIN_Y);
export const RANGE = [0.35, 1.45]; // 滑塊的位置

/** 滑塊在 x → 拱形尺的曲率(繩長不變:頂端到銷的距離 = 繩長) */
export function curvature(x0) {
  const x = clamp(x0, ...RANGE);
  const miss = (k) => {
    const t = tipOf(k);
    return Math.hypot(t[0] - x, t[1] - PIN_Y) - STRING;
  };
  // 曲率越大頂端越往右下、離銷越近
  let [lo, hi] = [1e-4, 1.2];
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (miss(mid) > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** 曲率 k 時,拱形尺上離根部 s 的點(局部:中線往外 off) */
export function bowPoint(k, s, off = 0) {
  const a = k * s; // 切線從直立往右轉的角
  const p = k < 1e-6 ? [BASE[0], BASE[1] + s] : [BASE[0] + (1 - Math.cos(a)) / k, BASE[1] + Math.sin(a) / k];
  return [p[0] - off * Math.cos(a), p[1] + off * Math.sin(a)];
}
export const pencil = (x) => tipOf(curvature(x));

export default {
  figure: 407,
  parts: [
    { id: "paper", kind: "box", center: [0, 0, -0.12], size: [5.4, 5.0, 0.04] },
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 有溝槽的水平桿(上緣在起拱線上),左邊的拱腳,與夾住拱形尺根部的座
        { kind: "plate", shape: shape(rect(SPAN + 0.6, 0.35, 0, Y0 - 0.18), [rect(SPAN - 0.3, 0.12, 0.25, Y0 - 0.18).reverse()]), thickness: 0.15 },
        { kind: "box", size: [0.12, 4.2, 0.12], at: [BASE[0] - 0.2, Y0 + 2.1, 0] },
        { kind: "box", size: [0.3, 0.3, 0.2], at: [BASE[0] - 0.03, Y0 + 0.15, 0] },
      ],
    },
    { id: "bow", kind: "rod", radius: 0.07 },
    { id: "string", kind: "rope", radius: 0.02 },
    // 溝槽裡的滑塊與銷(繩圈套在銷上)
    { id: "slider", kind: "group", pieces: [{ kind: "box", size: [0.3, 0.14, 0.14], at: [0, Y0 - 0.18, 0] }, { kind: "cylinder", radius: 0.04, length: 0.3, at: [0, PIN_Y, 0.05] }] },
    { id: "pencil", kind: "lathe", profile: [[0, -0.1], [0.05, 0], [0.06, 0.4], [0, 0.4]] },
    { id: "trace", kind: "trace" },
  ],
  driver: { part: "slider", type: "translation", direction: [1, 0, 0], range: RANGE, initial: MID },
  target: "pencil", // 拱形尺頂端的鉛筆:對到拱頂,沿尺的外緣畫出拱的一側
  view: { direction: [0.03, 0.05, 1] },
  pose(x0) {
    const x = clamp(x0, ...RANGE);
    const k = curvature(x);
    const bow = Array.from({ length: 33 }, (_, i) => [...bowPoint(k, (LENGTH * i) / 32), 0.05]);
    const edge = Array.from({ length: 33 }, (_, i) => [...bowPoint(k, (LENGTH * i) / 32, 0.08), 0.01]);
    const tip = tipOf(k);
    return {
      parts: { slider: { position: [x, 0, 0] }, pencil: { position: [tip[0], tip[1], 0.1] } },
      paths: { bow: { points: bow, closed: false }, string: { points: [[tip[0], tip[1], 0.05], [x, PIN_Y, 0.05]], closed: false, phase: 0 }, trace: { points: edge, closed: false } },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["frame", "bow"], reason: "接合處:拱形尺的根部夾在水平桿左端的座裡(座的夾縫沒畫)" },
  ],
};
