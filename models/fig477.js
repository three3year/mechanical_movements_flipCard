// 第 477 種:蒸汽疏水器(Heard & Wiggin 的專利),封住蒸汽,但讓蒸汽盤管與散熱器裡的水排出。它是一個盒子,在 A 接盤管
// 或廢水管的末端,在 B 有出口,裝著一個中空的閥門 D,閥底是撓性隔膜。閥裡裝滿液體並封住,隔膜支在出口管上方的橋架上。
// 盒裡有蒸汽時,蒸汽把閥裡的液體加熱,隔膜膨脹,把閥門頂到出口 a、a 處;冷凝水積多了,閥的溫度降低,
// 閥裡的液體收縮,隔膜讓閥門落下,水便排出。
// 主動件是虛擬的「進程」:蒸汽進來 → 閥門頂上封住 → 冷凝水積多、閥冷卻 → 閥門落下排水 → 再來蒸汽。
// 推斷:出口 a、a 在閥門上方一圈,閥門落下時水經 a、a 流到下面的出口 B;閥門的升降與盒內溫度成正比;剖面圖。
import { Y, smooth, clamp } from "./kit.js";
import { stream } from "./flow.js";
import { backHalf } from "./section.js";

const BOX = { r: 1.2, y0: -0.9, y1: 0.6 };
export const CLOSED = 0.05; // 閥門升起時頂到 a、a
export const OPEN = -0.25;

/** 進程 v → 盒內溫度(0 冷、1 蒸汽)、閥門高度、盒裡的冷凝水、是否在排水 */
export function trap(v) {
  const u = v - Math.floor(v);
  let temp;
  let water;
  if (u < 0.3) {
    temp = smooth(u / 0.3);
    water = 0.15;
  } else if (u < 0.65) {
    temp = 1 - 0.7 * smooth((u - 0.3) / 0.35);
    water = 0.15 + 0.6 * ((u - 0.3) / 0.35);
  } else if (u < 0.85) {
    temp = 0.3 - 0.3 * smooth((u - 0.65) / 0.2);
    water = 0.75 - 0.6 * smooth((u - 0.65) / 0.2);
  } else {
    temp = 0;
    water = 0.15;
  }
  const valve = OPEN + (CLOSED - OPEN) * clamp((temp - 0.35) / 0.5, 0, 1);
  return { temp, valve, water, draining: valve < CLOSED - 0.05 && u > 0.6 };
}

export default {
  figure: 477,
  parts: [
    {
      id: "body",
      kind: "group",
      pieces: [
        // 盒子(剖面)、上面的進口 A、下面的出口 B 與橋架、閥座 a、a
        { kind: "lathe", axis: Y, profile: [[0.32, BOX.y1 - BOX.y0], [BOX.r + 0.08, BOX.y1 - BOX.y0], [BOX.r + 0.08, 0], [0.3, 0], [0.3, 0.08], [BOX.r, 0.08], [BOX.r, BOX.y1 - BOX.y0 - 0.08], [0.32, BOX.y1 - BOX.y0 - 0.08]], at: [0, BOX.y0, 0], ...backHalf(Y) },
        { kind: "lathe", axis: Y, profile: [[0.22, BOX.y1], [0.3, BOX.y1], [0.3, 2.0], [0.22, 2.0]], ...backHalf(Y) },
        { kind: "lathe", axis: Y, profile: [[0.22, -2.0], [0.3, -2.0], [0.3, BOX.y0 + 0.4], [0.5, BOX.y0 + 0.55], [0.42, BOX.y0 + 0.58], [0.22, BOX.y0 + 0.45]], ...backHalf(Y) },
        { kind: "lathe", axis: Y, profile: [[0.55, 0.22], [0.8, 0.22], [0.8, 0.3], [0.55, 0.3]], ...backHalf(Y) },
      ],
    },
    { id: "labelA", kind: "group", pieces: [], label: "A", labelOffset: [0.5, 1.7, 0.4] },
    { id: "labelB", kind: "group", pieces: [], label: "B", labelOffset: [0.5, -1.8, 0.4] },
    { id: "labela", kind: "group", pieces: [], label: "a", labelOffset: [-0.95, 0.25, 0.5] },
    { id: "condensate", kind: "fill", fluid: "water", shape: "cylinder", center: [0, (BOX.y0 + BOX.y1) / 2, 0], size: [2 * BOX.r - 0.04, BOX.y1 - BOX.y0 - 0.16, 0], level: 0.2 },
    // 中空的閥門 D:上面是蓋,底下是撓性隔膜(畫成鼓起的碟)
    { id: "valve", kind: "lathe", axis: Y, profile: [[0, 0.12], [0.62, 0.12], [0.66, 0.0], [0.6, -0.12], [0.3, -0.2], [0, -0.22]], label: "D", labelOffset: [0, 0, 0.8], arrow: false },
  ],
  powered: ["valve"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], speed: 0.1 },
  target: "valve",
  view: { direction: [0.08, 0.12, 1] },
  pose(v) {
    const t = trap(v);
    const travel = v * 12;
    const flows = [];
    if (t.temp > 0.2) flows.push({ fluid: "steam", points: stream([[0, 1.9, 0.3], [0, BOX.y1, 0.3], [0.6, BOX.y1 - 0.2, 0.3]], travel, { spacing: 0.2 }) });
    if (t.draining) flows.push({ fluid: "water", points: stream([[-0.9, BOX.y0 + 0.2, 0.3], [-0.65, 0.2, 0.3], [-0.3, 0.1, 0.3], [-0.1, BOX.y0 + 0.45, 0.3], [0, -1.9, 0.3]], travel, { spacing: 0.16 }) });
    return {
      parts: {
        valve: { position: [0, t.valve, 0] },
        condensate: { level: t.water },
      },
      flows,
      readouts: [
        { label: "盒內", value: t.temp > 0.6 ? "蒸汽(閥內液體受熱,閥門頂上封住)" : t.temp > 0.25 ? "冷凝水積多,閥冷卻中" : "冷卻:閥門落下,排水" },
      ],
    };
  },
  waivers: [
    { check: "interference", parts: ["body", "valve"], reason: "簡化畫法:閥瓣坐在閥座上,重疊 0.03" },
  ],
};
