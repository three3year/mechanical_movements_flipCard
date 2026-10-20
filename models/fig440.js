// 第 440 種:一個橫向隔成兩等分的水槽,由下方的框架支在一根軸上。水落下裝滿其中一邊時,水槽繞軸擺動,把那邊的水倒出,
// 同時另一邊被帶到水流下方裝水,又使水槽擺回來。這個裝置曾被用作水錶。
// 主動件是虛擬的「進程」:每單位是一個來回(兩次傾倒)。
// 推斷:水流落在軸的正上方,隔板的頂端偏向哪邊,水就落進另一邊(抬高的那一邊);各階段所佔的進程。
// 2026-10-07 複查:翻轉原本是平順地轉過去;水槽是靠裝滿那一邊的重量翻倒的,改成加速翻過去、撞到底座上的擋柱停住
// (擋柱是推斷,原圖沒畫)。
// 2026-10-20(#440-1~3):
// - 框架照原圖改成軸的前後各一根直立支柱(頂端圓頭、軸穿過頂端的軸孔),站在底座上,每根支柱兩側各一根斜撐從底座撐到支柱
//   (後面那根支柱與斜撐是推斷,原圖只畫前面的);原本四隻斜腳的頂端碰不到軸。
// - 翻到底的傾角由接觸算:槽底沿弧往下擺,擺到碰上擋柱就停(擋柱的高度是定的,`TILT` 是算出來的),翻到底時槽底靠在擋柱上。
// - 倒水的時機由槽底的幾何算:水槽兩端開口,裝滿那一邊的水積在隔板邊,要等那一端的槽底降到比隔板那頭低(傾角過 0)
//   才從開口流出,存量隨傾角加大加速倒空;原本右端還抬著就開始流了。
import { deg, clamp, rot2 } from "./kit.js";
import { falling } from "./jumps.js";
import { stream } from "./flow.js";
import { shape, rect, arcPoints } from "./shapes.js";
import { swingUntilContact } from "./contact.js";

export const PIVOT = [0, 0.5, 0];
const HALF = 1.6; // 水槽半長
const DEPTH = 1.0;
const WALL = 0.35; // 隔板在槽底佔的半寬
export const BASE_TOP = -1.275;
const BASE_BOTTOM = -1.425;

/** 槽底的側面輪廓(相對於軸) */
export const BOTTOM = rect(2 * HALF, 0.06, 0, 0.1);

// 擋柱(推斷,原圖沒畫):底座上、槽底兩端的下方各一根,高度是定的
const STOP = { x: 1.42, w: 0.1, top: 0.15, depth: 0.2 };
/** 擋柱的側面輪廓(世界座標;k = 1 右、−1 左) */
export const stopOutline = (k) => rect(STOP.w, STOP.top - BASE_BOTTOM - 0.02, k * STOP.x, (STOP.top + BASE_BOTTOM + 0.02) / 2);

/** 翻到底的傾角:槽底從水平往下擺,擺到碰上擋柱就停(由接觸算) */
export const TILT = -swingUntilContact({ pivot: PIVOT, outline: BOTTOM, from: 0, into: -1, sweep: deg(30), steps: 120 }, [stopOutline(1)]);

// 直立支柱:站在底座上,頂端是繞軸心的圓頭(原圖前面的支柱頂上有軸孔)
const POST_W = 0.24;
const POST_Z = 0.68;
const POST_T = 0.12;
export const POST = [[-POST_W / 2, BASE_TOP - 0.03], [POST_W / 2, BASE_TOP - 0.03], ...arcPoints(POST_W / 2, 0, Math.PI, PIVOT[0], PIVOT[1])];
const AXLE_HALF = POST_Z + POST_T / 2;

/** 裝滿的那一邊(k = 1 右、−1 左)在傾角 tilt 時開口的那一端是不是比隔板那頭低:是就往外倒 */
export const pours = (tilt, k) => rot2([k * HALF, 0.13], tilt)[1] < rot2([k * WALL, 0.13], tilt)[1] - 1e-9;

// 一邊倒空的過程:從開口那端開始低於隔板那頭算起,存量隨傾角加大加速減少(倒到底 −TILT 時倒空)
const remaining = (tilt, k) => (pours(tilt, k) ? 1 - falling(clamp((-k * tilt) / TILT, 0, 1)) : 1);

/** 進程 v → 水槽傾角(正:左邊低)、兩邊的存量、累計傾倒次數 */
export function trough(v) {
  const n = Math.floor(v);
  const u = v - n;
  // 前半:右邊(抬高)裝水;0.4–0.5 翻到右邊低、右邊倒空;後半:左邊裝水;0.9–1 翻回
  if (u < 0.4) return { tilt: TILT, right: u / 0.4, left: 0, count: 2 * n };
  if (u < 0.5) {
    const s = falling((u - 0.4) / 0.1); // 裝滿的一邊比較重,水槽加速翻過去,撞到擋柱停住
    const tilt = TILT * (1 - 2 * s);
    return { tilt, right: remaining(tilt, 1), left: 0, count: 2 * n + (pours(tilt, 1) ? 1 : 0) };
  }
  if (u < 0.9) return { tilt: -TILT, right: 0, left: (u - 0.5) / 0.4, count: 2 * n + 1 };
  const s = falling((u - 0.9) / 0.1);
  const tilt = -TILT * (1 - 2 * s);
  return { tilt, right: 0, left: remaining(tilt, -1), count: 2 * n + 1 + (pours(tilt, -1) ? 1 : 0) };
}

const SPOUT = [[2.6, 3.0, 0], [0.5, 2.15, 0], [0, 1.8, 0], [0, 1.0, 0]];

// 斜撐:從底座上 (x0, y0) 到支柱上 (x1, y1) 的方條
const brace = (x0, y0, x1, y1, z) => {
  const L = Math.hypot(x1 - x0, y1 - y0);
  return { kind: "box", size: [0.12, L, 0.12], at: [(x0 + x1) / 2, (y0 + y1) / 2, z], angle: Math.atan2(-(x1 - x0), y1 - y0) };
};

export default {
  figure: 440,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [3.0, 0.15, 1.6], at: [0, (BASE_TOP + BASE_BOTTOM) / 2, 0] },
        // 前後兩根直立支柱,軸穿過頂端的軸孔(後面那根是推斷)
        ...[1, -1].map((k) => ({ kind: "plate", shape: shape(POST), thickness: POST_T, at: [0, 0, k * POST_Z] })),
        { kind: "cylinder", radius: 0.06, length: 2 * AXLE_HALF, at: [PIVOT[0], PIVOT[1], 0] },
        // 每根支柱兩側的斜撐:從底座撐到支柱的中段
        ...[1, -1].flatMap((k) => [1, -1].map((s) => brace(s * 1.2, BASE_TOP - 0.05, s * 0.08, -0.25, k * POST_Z))),
        // 兩根擋柱:水槽翻到底時,槽底的一端靠在上面
        ...[-1, 1].map((k) => ({ kind: "box", size: [STOP.w, STOP.top - BASE_BOTTOM - 0.02, STOP.depth], at: [k * STOP.x, (STOP.top + BASE_BOTTOM + 0.02) / 2, 0] })),
        // 斜槽
        { kind: "box", size: [2.4, 0.08, 0.35], at: [1.5, 2.6, 0], angle: Math.atan2(2.15 - 3.0, 0.5 - 2.6) + Math.PI },
      ],
    },
    {
      id: "trough",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "box", size: [2 * HALF, 0.06, DEPTH], at: [0, 0.1, 0] },
        { kind: "box", size: [2 * HALF, 0.55, 0.05], at: [0, 0.37, DEPTH / 2] },
        { kind: "box", size: [2 * HALF, 0.55, 0.05], at: [0, 0.37, -DEPTH / 2] },
        // 中央的隔板(兩片斜板)
        { kind: "plate", shape: shape([[-WALL, 0.13], [0, 1.0], [WALL, 0.13], [0.28, 0.13], [0, 0.85], [-0.28, 0.13]]), thickness: DEPTH, at: [0, 0, 0] },
        // 支架(套在軸上)
        { kind: "plate", shape: shape(rect(0.5, 0.3, 0, 0)), thickness: 0.08, at: [0, 0, DEPTH / 2 + 0.05] },
      ],
    },
    { id: "waterLeft", kind: "fill", fluid: "water", size: [HALF - 0.4, 0.45, DEPTH - 0.08], level: 0 },
    { id: "waterRight", kind: "fill", fluid: "water", size: [HALF - 0.4, 0.45, DEPTH - 0.08], level: 0 },
  ],
  powered: ["trough"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "來回", speed: 0.1 },
  target: "trough",
  view: { direction: [0.3, 0.35, 1] },
  pose(v) {
    const t = trough(v);
    // 正的 tilt:逆時針轉,左邊低
    const angle = t.tilt;
    const at = (x, y) => [PIVOT[0] + x * Math.cos(angle) - y * Math.sin(angle), PIVOT[1] + x * Math.sin(angle) + y * Math.cos(angle), 0];
    const flows = [{ fluid: "water", points: stream(SPOUT, v * 12, { spacing: 0.16 }) }];
    const tip = (side) => at(side * HALF, 0.2);
    // 開口那一端降到比隔板那頭低、槽裡還有水,才從那一端流出
    if (t.right > 0 && pours(angle, 1)) flows.push({ fluid: "water", points: stream([tip(1), [tip(1)[0] + 0.3, -1.25, 0.3]], v * 12, { spacing: 0.15 }) });
    if (t.left > 0 && pours(angle, -1)) flows.push({ fluid: "water", points: stream([tip(-1), [tip(-1)[0] - 0.3, -1.25, 0.3]], v * 12, { spacing: 0.15 }) });
    return {
      parts: {
        trough: { angle },
        waterLeft: { position: at(-(HALF + WALL) / 2 - 0.1, 0.36), angle, level: t.left },
        waterRight: { position: at((HALF + WALL) / 2 + 0.1, 0.36), angle, level: t.right },
      },
      flows,
      readouts: [{ label: "傾倒次數(水量計數)", value: String(t.count) }],
    };
  },
};
