// 第 389 種:由偏心輪、棘爪與棘輪(棘齒桿)操作的升降千斤頂。千斤頂的柱身裡有一根直立的棘齒桿,頂端是托座;
// 轉動柱身旁的偏心輪,偏心輪帶著下方的棘爪上下,每轉一圈把棘齒桿往上推一齒;上方的棘爪是擋止,扣住棘齒不讓它退下。
// 主動件是偏心輪(以手柄轉)。
// 推斷:齒距與偏心距;棘爪的位置依原圖。
import { TAU, deg } from "./kit.js";
import { indexStep } from "./jumps.js";
import { shape, circle, rect, thickLine } from "./shapes.js";

const PITCH = 0.22;
const ECC = { center: [0.75, 0.6, 0.2], e: 0.12, r: 0.42 };
export const TURNS = 10;
export const RANGE = [0, TURNS * TAU];

/** 偏心輪轉 theta → 棘齒桿上升的高度(每圈一齒;推的那一段在偏心輪由低往高的半圈) */
export const rack = (theta) => indexStep(theta, { from: deg(-90), span: Math.PI, step: PITCH });

// 棘齒桿:齒朝右,上面是直的(擋止扣在這裡)、下面是斜的
const TEETH = 18;
const rackShape = (() => {
  const pts = [[-0.14, -TEETH * PITCH / 2 - 0.2]];
  for (let i = 0; i < TEETH; i++) {
    const y = -TEETH * PITCH / 2 + i * PITCH;
    pts.push([0.14, y], [0.28, y + PITCH * 0.9], [0.14, y + PITCH * 0.9]);
  }
  pts.push([0.14, TEETH * PITCH / 2 + 0.6], [-0.14, TEETH * PITCH / 2 + 0.6]);
  return shape(pts);
})();

export default {
  figure: 389,
  parts: [
    {
      id: "body",
      kind: "group",
      pieces: [
        // 柱身(剖面)與底座
        { kind: "plate", shape: shape([[-1.4, -2.8], [1.6, -2.8], [1.6, -2.5], [0.9, -2.3], [0.55, -1.0], [0.5, 1.8], [0.2, 1.8], [0.2, -2.5], [-0.25, -2.5], [-0.25, 1.8], [-0.55, 1.8], [-0.6, -1.0], [-0.95, -2.3], [-1.4, -2.5]]), thickness: 0.5, at: [0, 0, -0.3] },
        // 上方的擋止棘爪(固定在柱身上)
        { kind: "plate", shape: shape(thickLine([[0.55, 1.65], [0.3, 1.4], [0.3, 1.25]], 0.08)), thickness: 0.1, at: [0, 0, 0.1] },
        { kind: "cylinder", radius: 0.05, length: 0.3, at: [0.55, 1.65, 0.1] },
      ],
    },
    {
      id: "rack",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: rackShape, thickness: 0.3 },
        { kind: "plate", shape: shape(rect(0.9, 0.18, 0, TEETH * PITCH / 2 + 0.7)), thickness: 0.5 },
      ],
    },
    {
      id: "eccentric",
      kind: "group",
      center: ECC.center,
      spin: ECC.r + ECC.e,
      pieces: [
        { kind: "plate", shape: shape(circle(ECC.r), [circle(0.06, -ECC.e, 0).reverse()]), thickness: 0.18, at: [ECC.e, 0, 0] },
        { kind: "cylinder", radius: 0.06, length: 0.5 },
        { kind: "box", size: [1.0, 0.08, 0.08], at: [0.5, 0, 0.25], accent: true },
      ],
    },
    { id: "pawl", kind: "plate", shape: shape(thickLine([[0, 0], [-0.5, 0.25]], 0.08), [circle(0.03).reverse()]), thickness: 0.1, arrow: false },
  ],
  driver: { part: "eccentric", type: "rotation", range: RANGE, initial: 0 },
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const h = rack(theta);
    // 下方的棘爪:掛在偏心輪上,爪尖隨偏心輪上下,往左伸到棘齒
    const c = [ECC.center[0] + ECC.e * Math.cos(theta), ECC.center[1] - 0.6 + ECC.e * Math.sin(theta), 0.25];
    return { parts: { rack: { position: [0, h - 0.2, 0] }, eccentric: { angle: theta }, pawl: { position: c, angle: 0 } }, readouts: [] };
  },
};
