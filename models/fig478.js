// 第 478 種:另一種蒸汽疏水器(Ray 的專利)。閥門 a 隨廢水管的縱向伸縮開閉:廢水管 A 的末端在附屬的空心球 C 的中央,
// 管子有一段牢牢固定在支座 B 上。閥門是一根在球上的填料函裡作動的柱塞,對著管端,由加重的肘節槓桿 D 推向管端,
// 推進的程度受擋止螺絲 b 與擋止 c 限制。管裡充滿水時,管長縮短,閥門保持打開;充滿蒸汽時,管子膨脹使閥門關閉。
// 螺絲 b 用來調整閥門的作動。
// 主動件是虛擬的「管內溫度」(從水到蒸汽)。
// 推斷:管子的伸長與溫度成正比(放大顯示);柱塞被槓桿推到擋止為止;管端碰到柱塞時把它頂回、封住。
import { deg, clamp } from "./kit.js";
import { stream } from "./flow.js";
import { shape, circle, thickLine } from "./shapes.js";

const FIXED = -2.4; // 管子固定在支座 B 處
export const END0 = 0.75; // 冷(水)時的管端
export const GROW = 0.35; // 冷到熱的伸長(放大)
export const STOP = 0.95; // 擋止讓柱塞最多推到這裡
const SPHERE = { center: [0.85, 0, 0], r: 0.75 };
const PIPE_R = 0.12;

/** 管內溫度 t(0 水、1 蒸汽)→ 管端、柱塞位置、閥門是否打開 */
export function trap(t0) {
  const t = clamp(t0, 0, 1);
  const end = END0 + GROW * t;
  const plunger = Math.max(STOP, end);
  return { end, plunger, open: end < STOP - 1e-9, gap: Math.max(0, STOP - end) };
}

export default {
  figure: 478,
  parts: [
    {
      id: "base",
      kind: "group",
      pieces: [
        { kind: "box", size: [4.6, 0.12, 0.8], at: [-0.1, -0.55, 0] },
        { kind: "box", size: [0.5, 0.45, 0.6], at: [FIXED, -0.3, 0] },
        // 空心球 C(剖開前半)、下面的出口、右邊的填料函與擋止 c、擋止螺絲 b
        { kind: "plate", shape: shape(circle(SPHERE.r + 0.07, SPHERE.center[0], 0), [circle(SPHERE.r, SPHERE.center[0], 0).reverse()]), thickness: 0.3 },
        { kind: "plate", shape: shape(thickLine([[SPHERE.center[0] - 0.15, -SPHERE.r], [SPHERE.center[0] - 0.15, -1.1]], 0.06)), thickness: 0.3 },
        { kind: "plate", shape: shape(thickLine([[SPHERE.center[0] + 0.15, -SPHERE.r], [SPHERE.center[0] + 0.15, -1.1]], 0.06)), thickness: 0.3 },
        { kind: "box", size: [0.35, 0.3, 0.3], at: [SPHERE.center[0] + SPHERE.r + 0.12, 0, 0] },
        { kind: "box", size: [0.1, 0.4, 0.2], at: [2.3, -0.3, 0] },
        { kind: "box", size: [0.06, 0.35, 0.06], at: [2.55, -0.32, 0] },
      ],
    },
    { id: "labelB", kind: "group", pieces: [], label: "B", labelOffset: [FIXED, 0.15, 0.5] },
    { id: "labelC", kind: "group", pieces: [], label: "C", labelOffset: [SPHERE.center[0], SPHERE.r + 0.2, 0.4] },
    { id: "labelb", kind: "group", pieces: [], label: "b", labelOffset: [2.7, -0.15, 0.4] },
    { id: "labelc", kind: "group", pieces: [], label: "c", labelOffset: [2.3, 0.05, 0.4] },
    { id: "pipe", kind: "rod", radius: PIPE_R, label: "A", labelOffset: [-1.2, 0.3, 0.3] }, // 路徑零件的標籤從原點量起
    { id: "plunger", kind: "cylinder", axis: [1, 0, 0], radius: 0.1, length: 1.2, arrow: false, label: "a", labelOffset: [-0.35, 0.25, 0.3] },
    { id: "lever", kind: "plate", shape: shape(thickLine([[0, 0], [0.2, 0.55]], 0.08)), thickness: 0.08, arrow: false, label: "D", labelOffset: [0.4, 0.75, 0.3], pieces: [{ kind: "sphere", radius: 0.3, at: [0.5, 0.75, 0] }] },
  ],
  driver: { type: "virtual", label: "管內溫度", mode: "balance", range: [0, 1], initial: 0.2, format: (t) => (t < 0.5 ? "水" : "蒸汽") },
  view: { direction: [0.08, 0.1, 1] },
  pose(t) {
    const s = trap(t);
    const flows = s.open ? [{ fluid: "water", points: stream([[FIXED + 0.3, 0, 0.3], [s.end, 0, 0.3], [SPHERE.center[0], -0.3, 0.3], [SPHERE.center[0], -1.2, 0.3]], t * 30, { spacing: 0.18 }) }] : [];
    return {
      parts: {
        plunger: { position: [s.plunger + 0.6, 0, 0] },
        lever: { position: [s.plunger + 1.2, 0, 0.2], angle: deg(-20) * clamp((s.plunger - STOP) / GROW, 0, 1) },
      },
      paths: { pipe: { points: [[FIXED - 0.3, 0, 0], [s.end, 0, 0]], closed: false } }, // 管子從固定處伸到管端(隨溫度伸縮)
      flows,
      readouts: [{ label: "閥門 a", value: s.open ? `打開(間隙 ${s.gap.toFixed(2)}),水排出` : "管子膨脹頂住柱塞,關閉" }],
    };
  },
};
