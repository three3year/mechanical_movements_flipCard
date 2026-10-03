// 第 440 種:一個橫向隔成兩等分的水槽,由下方的框架支在一根軸上。水落下裝滿其中一邊時,水槽繞軸擺動,把那邊的水倒出,
// 同時另一邊被帶到水流下方裝水,又使水槽擺回來。這個裝置曾被用作水錶。
// 主動件是虛擬的「進程」:每單位是一個來回(兩次傾倒)。
// 推斷:水流落在軸的正上方,隔板的頂端偏向哪邊,水就落進另一邊(抬高的那一邊);各階段所佔的進程。
import { deg, smooth, clamp } from "./kit.js";
import { stream } from "./flow.js";
import { shape, rect } from "./shapes.js";

export const TILT = deg(16);
const PIVOT = [0, 0.5, 0];
const HALF = 1.6; // 水槽半長
const DEPTH = 1.0;

/** 進程 v → 水槽傾角(正:左邊低)、兩邊的存量、累計傾倒次數 */
export function trough(v) {
  const n = Math.floor(v);
  const u = v - n;
  // 前半:右邊(抬高)裝水;0.4–0.5 翻到右邊低、右邊倒空;後半:左邊裝水;0.9–1 翻回
  if (u < 0.4) return { tilt: TILT, right: u / 0.4, left: 0, count: 2 * n };
  if (u < 0.5) {
    const s = smooth((u - 0.4) / 0.1);
    return { tilt: TILT * (1 - 2 * s), right: 1 - clamp((u - 0.42) / 0.08, 0, 1), left: 0, count: 2 * n + (u > 0.45 ? 1 : 0) };
  }
  if (u < 0.9) return { tilt: -TILT, right: 0, left: (u - 0.5) / 0.4, count: 2 * n + 1 };
  const s = smooth((u - 0.9) / 0.1);
  return { tilt: -TILT * (1 - 2 * s), right: 0, left: 1 - clamp((u - 0.92) / 0.08, 0, 1), count: 2 * n + 1 + (u > 0.95 ? 1 : 0) };
}

const SPOUT = [[2.6, 3.0, 0], [0.5, 2.15, 0], [0, 1.8, 0], [0, 1.0, 0]];

export default {
  figure: 440,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [3.0, 0.15, 1.6], at: [0, -1.35, 0] },
        { kind: "box", size: [0.12, 1.9, 0.12], at: [-0.5, -0.4, 0.65], angle: deg(-14) },
        { kind: "box", size: [0.12, 1.9, 0.12], at: [0.5, -0.4, 0.65], angle: deg(14) },
        { kind: "box", size: [0.12, 1.9, 0.12], at: [-0.5, -0.4, -0.65], angle: deg(-14) },
        { kind: "box", size: [0.12, 1.9, 0.12], at: [0.5, -0.4, -0.65], angle: deg(14) },
        { kind: "cylinder", radius: 0.06, length: 1.5, at: [PIVOT[0], PIVOT[1], 0] },
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
        { kind: "plate", shape: shape([[-0.35, 0.13], [0, 1.0], [0.35, 0.13], [0.28, 0.13], [0, 0.85], [-0.28, 0.13]]), thickness: DEPTH, at: [0, 0, 0] },
        // 支架
        { kind: "plate", shape: shape(rect(0.5, 0.3, 0, 0)), thickness: 0.08, at: [0, 0, DEPTH / 2 + 0.05] },
      ],
    },
    { id: "waterLeft", kind: "fill", fluid: "water", size: [HALF - 0.4, 0.45, DEPTH - 0.08], level: 0 },
    { id: "waterRight", kind: "fill", fluid: "water", size: [HALF - 0.4, 0.45, DEPTH - 0.08], level: 0 },
  ],
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
    if (t.right > 0 && t.tilt < TILT - 1e-6) flows.push({ fluid: "water", points: stream([tip(1), [tip(1)[0] + 0.3, -1.25, 0.3]], v * 12, { spacing: 0.15 }) });
    if (t.left > 0 && t.tilt > -TILT + 1e-6) flows.push({ fluid: "water", points: stream([tip(-1), [tip(-1)[0] - 0.3, -1.25, 0.3]], v * 12, { spacing: 0.15 }) });
    return {
      parts: {
        trough: { angle },
        waterLeft: { position: at(-(HALF + 0.35) / 2 - 0.1, 0.36), angle, level: t.left },
        waterRight: { position: at((HALF + 0.35) / 2 + 0.1, 0.36), angle, level: t.right },
      },
      flows,
      readouts: [{ label: "傾倒次數(水量計數)", value: String(t.count) }],
    };
  },
};
