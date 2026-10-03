// 第 462 種:鏈式泵,以連續的圓周運動抬水。無端鏈條帶著木製或金屬的碟片,碟片與一根不漏水的圓筒配合,形成一連串裝滿水的水斗。
// 動力加在上方的輪上。
// 主動件是上方的輪(左邊的鏈條往上走)。
// 推斷:圓筒套在鏈條左邊的一段上,下端浸在水裡,上端通到左上的水槽;碟片在筒裡時,碟片之間裝滿水,到筒頂就把水倒進水槽;
// 圓筒畫成剖面。
import { TAU, polar, quatFromZ } from "./kit.js";
import { stream } from "./flow.js";
import { backHalf } from "./section.js";
import { shape, circle } from "./shapes.js";

export const TOP = [0.5, 2.0, 0];
export const BOTTOM = [0.5, -1.7, 0];
export const R = 0.45; // 鏈輪半徑
const SPACING = 0.42; // 碟片間距
export const TUBE = { x: TOP[0] - R, y0: -1.25, y1: 1.6, r: 0.18 };
export const WATER = -0.9; // 水面
const RUN = TOP[1] - BOTTOM[1];
export const LOOP = 2 * RUN + TAU * R;
const DISCS = Math.round(LOOP / SPACING);

/** 鏈條上弧長 s 處的位置與切線(從左下開始往上走) */
export function chainAt(s0) {
  const s = ((s0 % LOOP) + LOOP) % LOOP;
  if (s < RUN) return { p: [TOP[0] - R, BOTTOM[1] + s, 0], t: [0, 1, 0] };
  if (s < RUN + Math.PI * R) {
    const a = Math.PI - (s - RUN) / R;
    return { p: polar(R, a).map((c, i) => c + TOP[i]), t: [Math.sin(a), -Math.cos(a), 0] };
  }
  if (s < 2 * RUN + Math.PI * R) return { p: [TOP[0] + R, TOP[1] - (s - RUN - Math.PI * R), 0], t: [0, -1, 0] };
  const a = -(s - 2 * RUN - Math.PI * R) / R;
  return { p: polar(R, a).map((c, i) => c + BOTTOM[i]), t: [Math.sin(a), -Math.cos(a), 0] };
}

const sprocket = (center) => ({
  kind: "group",
  pieces: [
    { kind: "plate", shape: shape(circle(R * 0.85), [circle(0.06).reverse()]), thickness: 0.08 },
    ...Array.from({ length: 8 }, (_, i) => ({ kind: "box", size: [2 * R + 0.25, 0.05, 0.05], at: [0, 0, 0], angle: (i * Math.PI) / 8 })),
  ],
  center,
});

export default {
  figure: 462,
  parts: [
    {
      id: "works",
      kind: "group",
      pieces: [
        { kind: "lathe", axis: [0, 1, 0], profile: [[TUBE.r, 0], [TUBE.r + 0.06, 0], [TUBE.r + 0.06, TUBE.y1 - TUBE.y0], [TUBE.r, TUBE.y1 - TUBE.y0]], at: [TUBE.x, TUBE.y0, 0], ...backHalf([0, 1, 0]) },
        // 左上的水槽與岸
        { kind: "box", size: [1.6, 0.08, 0.6], at: [TUBE.x - 0.9, TUBE.y1 - 0.05, 0] },
        { kind: "box", size: [1.6, 0.35, 0.05], at: [TUBE.x - 0.9, TUBE.y1 + 0.1, -0.3] },
        { kind: "box", size: [1.2, 0.5, 1.2], at: [TUBE.x - 1.7, TUBE.y1 - 0.35, 0] },
        { kind: "box", size: [4.4, 0.2, 1.4], at: [0, BOTTOM[1] - R - 0.4, 0] },
      ],
    },
    { id: "pond", kind: "fill", fluid: "water", center: [0, (WATER + BOTTOM[1] - R - 0.3) / 2, 0], size: [4.2, WATER - BOTTOM[1] + R + 0.3, 1.3], level: 1 },
    { id: "upper", ...sprocket(TOP), spin: R + 0.2 },
    { id: "lower", ...sprocket(BOTTOM), arrow: false },
    { id: "chain", kind: "chain", radius: 0.025 },
    ...Array.from({ length: DISCS }, (_, i) => ({ id: `disc${i}`, kind: "cylinder", radius: TUBE.r - 0.02, length: 0.05, arrow: false })),
  ],
  driver: { part: "upper", type: "rotation", speed: -0.6 },
  view: { direction: [0.15, 0.12, 1] },
  pose(theta) {
    const s = -theta * R; // 上輪順時針轉,左邊的鏈條往上
    const parts = { upper: { angle: theta }, lower: { angle: theta } };
    const water = [];
    for (let i = 0; i < DISCS; i++) {
      const { p, t } = chainAt(s + i * SPACING);
      parts[`disc${i}`] = { position: p, rotation: quatFromZ(t) };
      // 筒裡、碟片上方的水(到下一片碟片為止)
      if (t[1] > 0.99 && p[1] > TUBE.y0 && p[1] < TUBE.y1 - 0.1) {
        for (let k = 1; k <= 3; k++) water.push([p[0] + ((k % 2) - 0.5) * 0.12, p[1] + (k * SPACING) / 4, 0.12]);
      }
    }
    const chain = Array.from({ length: 121 }, (_, i) => chainAt((LOOP * i) / 120).p);
    return {
      parts,
      paths: { chain: { points: chain, closed: true, phase: s } },
      flows: [{ fluid: "water", points: [...water.filter((q) => q[1] < TUBE.y1 - 0.05), ...stream([[TUBE.x, TUBE.y1, 0.12], [TUBE.x - 0.3, TUBE.y1 + 0.02, 0.12], [TUBE.x - 1.6, TUBE.y1 + 0.02, 0.12]], s * 1.5, { spacing: 0.15 })] }],
      readouts: [],
    };
  },
};
