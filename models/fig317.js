// 第 317 種:複合桿補償擺。C 是一根由黃銅與鐵(或鋼)焊在一起的複合桿,橫架在擺錘 M 的頂上,兩端各掛一個重物 W。
// 黃銅膨脹得比鐵多,變暖時複合桿向上彎曲,帶著兩個 W 一起升高,把整體重心抬回去,
// 恰好抵消擺桿受熱伸長使擺動中心下降的量。主動件是虛擬的「溫度」(平衡型)。膨脹量放大了許多倍。
// 推斷:以「擺錘 M 與兩個 W 的總重心到懸掛點的距離不變」代表擺動中心不變;M 與 W 的重量比。
import { Y, clamp } from "./kit.js";

const TOP = 3.4;
const ROD0 = 3.6; // 20 °C 時懸掛點到複合桿中點的距離
export const RANGE = [-10, 40];
const ROD_K = 0.012;
const HALF = 1.6; // 複合桿半長
const MASS = { M: 1, W: 0.5 }; // 擺錘與每個 W 的相對重量
const M_DROP = 1.25; // 擺錘重心在複合桿下方的距離

/** 溫度 t → 擺桿長、複合桿兩端上彎的量、總重心到懸掛點的距離 */
export function compound(t0) {
  const t = clamp(t0, ...RANGE);
  const rod = ROD0 + ROD_K * (t - 20);
  // 總重心 = (M·(rod + M_DROP) + 2W·(rod − rise)) / (M + 2W) 要不變 → rise 依伸長量算
  const total = MASS.M + 2 * MASS.W;
  const rise = 0.35 + (total / (2 * MASS.W)) * (rod - ROD0);
  const center = (MASS.M * (rod + M_DROP) + 2 * MASS.W * (rod - rise)) / total;
  return { rod, rise, center };
}

/** 複合桿的中心線(相對桿的中點):兩端上彎 rise(拋物線) */
const barLine = (rise) => Array.from({ length: 13 }, (_, i) => {
  const x = -HALF + (i / 12) * 2 * HALF;
  return [x, rise * (x / HALF) ** 2];
});

export default {
  figure: 317,
  parts: [
    { id: "support", kind: "box", center: [0, TOP + 0.2, 0], size: [0.9, 0.2, 0.4] },
    { id: "rod", kind: "cylinder", axis: Y, radius: 0.1, length: ROD0 },
    {
      id: "bob",
      kind: "group",
      label: "M",
      labelOffset: [0, -1.2, 0.6],
      pieces: [
        { kind: "lathe", axis: Y, profile: [[0, -2.05], [1.05, -2.05], [1.05, -0.75], [0.85, -0.25], [0.3, -0.05], [0, -0.05]] },
        { kind: "cylinder", axis: Y, radius: 0.08, length: 0.4, at: [0, -2.25, 0] },
      ],
    },
    { id: "barC", kind: "rod", radius: 0.07, label: "C", center: [0, TOP - ROD0, 0], labelOffset: [0, 0.35, 0.3] },
    { id: "weightL", kind: "box", size: [0.45, 0.35, 0.4], label: "W", labelOffset: [0, -0.4, 0.3] },
    { id: "weightR", kind: "box", size: [0.45, 0.35, 0.4], label: "W", labelOffset: [0, -0.4, 0.3] },
  ],
  driver: { type: "virtual", label: "溫度", mode: "balance", range: RANGE, initial: 20, unit: "°C" },
  targets: ["weightL", "weightR"], // 被複合桿抬高、把重心補回去的兩個重物 W
  view: { direction: [0.05, 0.12, 1] },
  pose(t) {
    const { rod, rise } = compound(t);
    const mid = TOP - rod;
    const line = barLine(rise).map(([x, y]) => [x, mid + y, 0.0]);
    return {
      parts: {
        rod: { position: [0, TOP - rod / 2, 0], scale: [1, 1, rod / ROD0] },
        bob: { position: [0, mid, 0] },
        weightL: { position: [-HALF - 0.1, mid + rise, 0] },
        weightR: { position: [HALF + 0.1, mid + rise, 0] },
      },
      paths: { barC: { points: line, closed: false } },
      readouts: [],
    };
  },
};
