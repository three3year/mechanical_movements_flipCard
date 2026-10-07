// 第 470 種:蒸汽錘。汽缸固定在上方,錘頭接在活塞桿的下端。蒸汽輪流被引進活塞下方、再排出,使錘升起、落下。
// 主動件是虛擬的「進程」:每單位是錘一次。
// 推斷:進汽時蒸汽把活塞連同錘頂上去;排汽後錘靠自重落下打在砧上;各階段所佔的進程;汽缸畫成剖面。
// 動力重演不適用:錘是被蒸汽頂起的,沒有實體的主動件可推(重演只推主動件,其餘由碰撞與重力帶動);
// 靠重力的只有落下那一段,已演出加速的過程、撞到砧停住。
import { Y, smooth } from "./kit.js";
import { stream } from "./flow.js";
import { backHalf } from "./section.js";
import { shape } from "./shapes.js";

const CYL = { y0: 1.4, y1: 2.6, r: 0.45 };
export const ANVIL_TOP = -1.15;
const HEAD_H = 0.55;
const ROD = 2.15; // 活塞到錘頭頂
export const LIFT = 0.95; // 錘升起的高度

/** 進程 v → 錘頭底的高度、階段 */
export function hammer(v) {
  const u = v - Math.floor(v);
  if (u < 0.5) return { y: ANVIL_TOP + LIFT * smooth(u / 0.45), phase: "進汽:蒸汽在活塞下方,把錘抬起", steam: true };
  if (u < 0.6) return { y: ANVIL_TOP + LIFT, phase: "排汽", steam: false };
  if (u < 0.72) return { y: ANVIL_TOP + LIFT * (1 - ((u - 0.6) / 0.12) ** 2), phase: "錘靠自重落下", steam: false };
  return { y: ANVIL_TOP, phase: "打在砧上", steam: false };
}

const legs = shape([[-2.0, -1.8], [-1.35, -1.8], [-1.0, 1.25], [1.0, 1.25], [1.35, -1.8], [2.0, -1.8], [1.45, 1.7], [-1.45, 1.7]], [[[-0.9, 1.05], [0.9, 1.05], [1.15, -1.8], [-1.15, -1.8]].reverse()]);
const INLET = [[-2.3, 2.0, 0.3], [-0.7, 2.0, 0.3], [-0.7, CYL.y0 + 0.15, 0.3], [-0.2, CYL.y0 + 0.15, 0.3]];
const EXHAUST = [[0.2, CYL.y0 + 0.15, 0.3], [0.7, CYL.y0 + 0.15, 0.3], [0.7, 2.9, 0.3]];

export default {
  figure: 470,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: legs, thickness: 0.5 },
        { kind: "lathe", axis: Y, profile: [[0.06, 0], [CYL.r + 0.1, 0], [CYL.r + 0.1, CYL.y1 - CYL.y0], [0, CYL.y1 - CYL.y0], [0, CYL.y1 - CYL.y0 - 0.1], [CYL.r, CYL.y1 - CYL.y0 - 0.1], [CYL.r, 0.1], [0.06, 0.1]], at: [0, CYL.y0, 0], ...backHalf(Y) },
        // 砧與底座
        { kind: "box", size: [0.9, 0.5, 0.8], at: [0, ANVIL_TOP - 0.25, 0] },
        { kind: "box", size: [4.4, 0.2, 1.2], at: [0, -1.9, 0] },
        // 進汽管、排汽管與閥箱
        { kind: "box", size: [1.6, 0.12, 0.12], at: [-1.5, 2.0, 0.3] },
        { kind: "box", size: [0.12, 0.6, 0.12], at: [-0.7, 1.75, 0.3] },
        { kind: "box", size: [0.12, 1.4, 0.12], at: [0.7, 2.2, 0.3] },
        // 側面的操縱桿
        { kind: "box", size: [0.06, 2.2, 0.06], at: [1.6, 0.3, 0.3] },
      ],
    },
    { id: "steam", kind: "fill", fluid: "steam", shape: "cylinder", size: [2 * CYL.r - 0.04, CYL.y1 - CYL.y0, 0], level: 0 },
    {
      id: "hammer",
      kind: "box",
      size: [0.75, HEAD_H, 0.7],
      arrow: false,
      pieces: [
        { kind: "cylinder", radius: 0.07, length: ROD, axis: Y, at: [0, HEAD_H / 2 + ROD / 2, 0] },
        { kind: "cylinder", radius: CYL.r - 0.02, length: 0.18, axis: Y, at: [0, HEAD_H / 2 + ROD, 0] },
      ],
    },
  ],
  powered: ["hammer"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "下", speed: 0.25 },
  target: "hammer",
  view: { direction: [0.12, 0.1, 1] },
  pose(v) {
    const h = hammer(v);
    const piston = h.y + HEAD_H + ROD;
    const travel = v * 8;
    return {
      parts: {
        hammer: { position: [0, h.y + HEAD_H / 2, 0] },
        steam: { position: [0, CYL.y0 + 0.1 + (CYL.y1 - CYL.y0) / 2, 0], level: h.steam || h.phase === "排汽" ? Math.max(0, piston - 0.09 - CYL.y0 - 0.1) / (CYL.y1 - CYL.y0) : 0 },
      },
      flows: [{ fluid: "steam", points: h.steam ? stream(INLET, travel, { spacing: 0.2 }) : stream(EXHAUST, travel, { spacing: 0.2 }) }],
      readouts: [{ label: "階段", value: h.phase }],
    };
  },
};
