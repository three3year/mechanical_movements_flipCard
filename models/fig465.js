// 第 465 種:平衡泵。一對泵由一個人交替踩(按)槓桿或樑的兩端來回操作。
// 主動件是樑(繞中間的支點擺動;原圖有人站在樑上)。
// 推斷:兩個泵各接在樑的一邊,一邊的活塞上升時另一邊下降;兩端的球是平衡重;泵是提升泵,上行時水從出水口流出;
// 人不畫出。
import { deg } from "./kit.js";
import { stroke, barrel, flap, water } from "./pump.js";
import { stream } from "./flow.js";
import { shape, thickLine } from "./shapes.js";

export const PIVOT = [0, 1.7, 0];
const HALF = 2.1; // 樑半長
export const ATTACH = 0.75; // 活塞桿接在樑上離支點
const ROD = 1.75;
export const SWING = [deg(-12), deg(12)];
const BARREL = { r: 0.25, y0: -1.75, y1: 0.35 };
const SPOUT_Y = 0.15;
const OPEN = deg(55);

/** 樑轉 a → 兩個活塞的高度(左、右) */
export function pistons(a) {
  return [-1, 1].map((s) => PIVOT[1] + s * ATTACH * Math.sin(a) - ROD);
}

export default {
  figure: 465,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 平台與桌形的架子、中柱
        { kind: "box", size: [3.6, 0.12, 1.2], at: [0, 0.75, 0] },
        ...[-1.6, 1.6].map((x) => ({ kind: "box", size: [0.12, 2.0, 0.12], at: [x, -0.25, 0.5] })),
        { kind: "box", size: [0.16, 1.0, 0.16], at: [0, 1.2, 0] },
        { kind: "box", size: [6.0, 0.2, 1.6], at: [0, -1.35, 0] },
      ],
    },
    { id: "pond", kind: "fill", fluid: "water", center: [0, -2.0, 0], size: [5.8, 1.1, 1.4], level: 1 },
    {
      id: "beam",
      kind: "plate",
      center: PIVOT,
      shape: shape(thickLine([[-HALF, 0], [HALF, 0]], 0.12)),
      thickness: 0.12,
      arrow: false,
      pieces: [
        { kind: "sphere", radius: 0.22, at: [-HALF - 0.1, 0.1, 0] },
        { kind: "sphere", radius: 0.22, at: [HALF + 0.1, 0.1, 0] },
        { kind: "plate", shape: shape(thickLine([[-0.9, 0.1], [-0.9, 0.9]], 0.08)), thickness: 0.06 },
        { kind: "plate", shape: shape(thickLine([[0.9, 0.1], [0.9, 0.9]], 0.08)), thickness: 0.06 },
        { kind: "plate", shape: shape(thickLine([[-0.9, 0.9], [0.9, 0.9]], 0.08)), thickness: 0.06 },
      ],
    },
    ...[0, 1].flatMap((k) => {
      const x = (k === 0 ? -1 : 1) * ATTACH;
      return [
        barrel(`barrel${k}`, { x, ...BARREL }),
        { id: `rod${k}`, kind: "cylinder", axis: [0, 1, 0], radius: 0.035, length: ROD, arrow: false, pieces: [{ kind: "cylinder", radius: BARREL.r - 0.01, length: 0.18, at: [0, 0, -ROD / 2] }] },
        { id: `water${k}`, kind: "fill", fluid: "water", shape: "cylinder", size: [2 * BARREL.r - 0.02, BARREL.y1 - BARREL.y0, 0], level: 0 },
        flap(`valve${k}`, 0.36),
      ];
    }),
  ],
  driver: { part: "beam", type: "rotation", cycle: SWING },
  view: { direction: [0.12, 0.1, 1] },
  pose(v) {
    const { at, forward } = stroke(v, ...SWING);
    const ys = pistons(at);
    const parts = { beam: { angle: at } };
    const flows = [];
    ys.forEach((y, k) => {
      const x = (k === 0 ? -1 : 1) * ATTACH;
      const up = k === 0 ? !forward : forward; // 樑逆時針轉時右邊的活塞上升
      parts[`rod${k}`] = { position: [x, y + ROD / 2, 0] };
      parts[`water${k}`] = water(x, BARREL.y0, Math.min(y + 0.1, SPOUT_Y + 0.05), BARREL.y1 - BARREL.y0);
      parts[`valve${k}`] = { position: [x - 0.18, BARREL.y0 + 0.03, 0.05], angle: up ? OPEN : 0 };
      if (up) flows.push({ fluid: "water", points: stream([[x, -1.9, 0.1], [x, y - 0.2, 0.1], [x, SPOUT_Y, 0.1], [x + (k === 0 ? -0.6 : 0.6), SPOUT_Y - 0.1, 0.1], [x + (k === 0 ? -0.7 : 0.7), -1.0, 0.1]], v * 6, { spacing: 0.16 }) });
    });
    return { parts, flows, readouts: [{ label: "出水", value: forward ? "右邊的泵" : "左邊的泵" }] };
  },
};
