// 第 427 種:另一種旋轉式引擎。軸 B 在與汽缸偏心的固定軸承裡轉;活塞 A、A 可以在與軸同心的輪轂 C 的溝槽裡滑進滑出,
// 但始終對汽缸保持徑向,這是靠嵌在汽缸端蓋軸轂上的環(虛線)維持的。活塞穿過輪轂 C 上的滾動填料 a、a 滑動。
// 主動件是軸 B。
// 推斷:輪轂在汽缸頂端與汽缸相切,頂端兩邊是進汽與排汽口(原圖左邊的管子箭頭朝上,是排汽);
// 活塞的內端貼著環(與汽缸同心)、外端貼著汽缸內壁,所以活塞長度不變;蒸汽在進汽口與前面的活塞之間推它。
import { TAU, deg } from "./kit.js";
import { stream } from "./flow.js";
import { shape, circle, ring, rect, thickLine } from "./shapes.js";

export const BORE = 1.6; // 汽缸內半徑(圓心在原點)
export const ECC = 0.35; // 軸 B 偏離汽缸中心
export const HUB = BORE - ECC; // 輪轂半徑:在頂端碰到汽缸
export const SHAFT = [0, ECC, 0];
export const PISTON = 1.0;
export const RING = BORE - PISTON; // 引導活塞內端的環

const polar = (r, a, z = 0) => [r * Math.cos(a), r * Math.sin(a), z];
/** 軸轉 theta → 兩個填料 a 的位置與兩個活塞(沿汽缸半徑)的方向 */
export function pistons(theta) {
  return [0, 1].map((k) => {
    const a = theta + k * Math.PI;
    const packing = [SHAFT[0] + HUB * Math.cos(a), SHAFT[1] + HUB * Math.sin(a), 0];
    return { packing, angle: Math.atan2(packing[1], packing[0]) };
  });
}

const TOP = Math.PI / 2;
const inlet = [[0.42, BORE + 0.9, 0.2], [0.42, BORE + 0.1, 0.2], [0.32, BORE - 0.1, 0.2]];
const exhaust = [[-0.32, BORE - 0.1, 0.2], [-0.42, BORE + 0.1, 0.2], [-0.42, BORE + 0.9, 0.2]];

/** 輪轂與汽缸之間、從 a0 順時針到 a1 的蒸汽 */
function crescent(a0, a1, travel) {
  const dots = [];
  const n = Math.max(1, Math.round((a0 - a1) / deg(7)));
  for (let i = 0; i < n; i++) {
    const a = a0 - ((a0 - a1) * (i + 0.5 + 0.3 * Math.sin(travel * 2 + i))) / n;
    const u = [Math.cos(a), Math.sin(a)];
    const su = SHAFT[0] * u[0] + SHAFT[1] * u[1];
    const inner = su + Math.sqrt(HUB * HUB - ECC * ECC + su * su);
    const gap = BORE - inner;
    if (gap < 0.1) continue;
    for (const f of gap > 0.4 ? [0.3, 0.7] : [0.5]) dots.push(polar(inner + gap * f, a, 0.05));
  }
  return dots;
}

export default {
  figure: 427,
  parts: [
    {
      id: "cylinder",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(circle(BORE + 0.18), [circle(BORE).reverse()]), thickness: 0.6 },
        { kind: "plate", shape: shape(circle(BORE + 0.18)), thickness: 0.04, at: [0, 0, -0.32] },
        { kind: "box", size: [2.4, 0.25, 0.9], at: [0, -BORE - 0.3, 0] },
        { kind: "plate", shape: shape(thickLine(inlet.map(([x, y]) => [x + 0.08, y]), 0.06)), thickness: 0.3 },
        { kind: "plate", shape: shape(thickLine(exhaust.map(([x, y]) => [x - 0.08, y]), 0.06)), thickness: 0.3 },
        // 端蓋軸轂上的環(虛線所示),引導活塞內端
        { kind: "plate", shape: ring(RING + 0.04, RING - 0.04), thickness: 0.05, at: [0, 0, -0.26] },
      ],
    },
    {
      id: "hub",
      kind: "group",
      center: SHAFT,
      label: "C",
      labelOffset: [0.55, 0.75, 0.4],
      spin: HUB + 0.1,
      pieces: [
        { kind: "plate", shape: shape(circle(HUB), [rect(2 * HUB + 0.1, 0.2).reverse()]), thickness: 0.5, mark: [0, HUB - 0.15], markSize: 0.08 },
        { kind: "cylinder", radius: 0.16, length: 1.0, at: [0, 0, -0.2] },
      ],
    },
    { id: "shaftB", kind: "group", center: SHAFT, label: "B", labelOffset: [0.25, 0.15, 0.4], pieces: [] },
    ...[0, 1].map((k) => ({ id: `packing${k + 1}`, kind: "cylinder", radius: 0.13, length: 0.56, label: "a", labelOffset: [0.2, 0.2, 0.3], arrow: false })),
    ...[0, 1].map((k) => ({ id: `piston${k + 1}`, kind: "plate", shape: shape(rect(PISTON, 0.14, -PISTON / 2, 0)), thickness: 0.48, label: "A", labelOffset: [0, 0, 0.4], arrow: false })),
  ],
  driver: { part: "hub", type: "rotation", speed: -0.6, initial: deg(150) },
  targets: ["piston1", "piston2"], // 軸 B 就是主動件(輪轂);標受蒸汽推、在輪轂裡滑進滑出的兩個活塞 A
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const ps = pistons(theta);
    const travel = -theta;
    // 進汽口(頂端右邊)順時針到前面的那個活塞之間是蒸汽
    const ahead = Math.max(...ps.map((p) => p.angle).map((a) => (a < TOP - deg(6) ? a : a - TAU)));
    const parts = { hub: { angle: theta } };
    ps.forEach((p, k) => {
      parts[`packing${k + 1}`] = { position: [p.packing[0], p.packing[1], 0] };
      parts[`piston${k + 1}`] = { position: polar(BORE, p.angle), angle: p.angle };
    });
    return {
      parts,
      flows: [
        { fluid: "steam", points: [...crescent(TOP - deg(8), ahead + deg(5), travel), ...stream(inlet, travel, { spacing: 0.18 })] },
        { fluid: "steam", points: stream(exhaust, travel, { spacing: 0.18 }) },
      ],
      readouts: [],
    };
  },
};

