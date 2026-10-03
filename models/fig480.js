// 第 480 種:另一種儲氣槽。容器 A 裡永久固定著一根中央管 a,這根管在槽中央的固定管 b 上滑動。
// 主動件是虛擬的「槽裡的氣量」。剖面圖。
// 推斷:中央的兩根管當作 A 升降的導引;其餘與第 479 種相同(進氣時 A 上升)。
import { Y } from "./kit.js";
import { tankParts, waterPart, bellPart, bellBottom, gasFlows, BELL, TANK } from "./gasometer.js";

const B_TOP = BELL.h + 0.6; // 固定管 b 的頂

export default {
  figure: 480,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        ...tankParts(),
        // 固定在槽中央的管 b
        { kind: "cylinder", radius: 0.09, length: B_TOP - TANK.y0, axis: Y, at: [0, (B_TOP + TANK.y0) / 2, 0] },
      ],
    },
    { id: "labelB", kind: "group", pieces: [], label: "B", labelOffset: [1.2, -1.2, 0.6] },
    { id: "labelb", kind: "group", pieces: [], label: "b", labelOffset: [-0.25, 0.4, 0.5] },
    waterPart,
    // A 與固定在它裡面的中央管 a(套在 b 外面)
    bellPart({ pieces: [{ kind: "cylinder", radius: 0.15, length: BELL.h + 0.3, at: [0, 0, (BELL.h + 0.3) / 2] }] }),
    { id: "labela", kind: "group", pieces: [], label: "a", labelOffset: [0.3, 0, 0.5] },
  ],
  driver: { type: "virtual", label: "槽裡的氣量", mode: "balance", range: [0, 1], initial: 0.5, format: (g) => Math.round(g * 100) + "%" },
  view: { direction: [0.06, 0.08, 1] },
  pose(g) {
    const bottom = bellBottom(g);
    return {
      parts: { bell: { position: [0, bottom, 0] }, labela: { position: [0, bottom + BELL.h * 0.6, 0] } },
      flows: gasFlows(g),
      readouts: [{ label: "A 的高度", value: (bottom - bellBottom(0)).toFixed(2) }],
    };
  },
};
