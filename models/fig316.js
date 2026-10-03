// 第 316 種:水銀補償擺。擺錘是一個裝水銀的玻璃瓶。溫度升高時擺桿伸長、瓶子跟著下降;同時水銀在瓶中膨脹、
// 液面升高,把重心抬回去,恰好補償擺桿的伸長;溫度降低時相反。所以擺動中心始終在同一位置,擺的有效長度不變。
// 主動件是虛擬的「溫度」(平衡型)。為了看得見,膨脹量放大了許多倍。
// 推斷:以「水銀重心到懸掛點的距離不變」代表擺動中心不變(原文的補償原理)。玻璃瓶剖開前半,看得到水銀。
import { Y, clamp } from "./kit.js";
import { shape, rect } from "./shapes.js";
import { backHalf } from "./section.js";

const ROD0 = 4.6; // 20 °C 時懸掛點到瓶底的距離
export const RANGE = [-10, 40]; // 溫度 °C
const ROD_K = 0.012; // 每度擺桿伸長(放大)
const JAR = { r: 0.82, h: 3.2, wall: 0.07 };
const LEVEL0 = 2.2; // 20 °C 時水銀柱高
const TOP = 3.4;
const FILL_H = 3.0;

/** 溫度 t → 懸掛點到瓶底的距離、水銀柱高、水銀重心離懸掛點的距離 */
export function compensation(t0) {
  const t = clamp(t0, ...RANGE);
  const rod = ROD0 + ROD_K * (t - 20);
  // 水銀重心 = 瓶底往上半個柱高;要讓它離懸掛點的距離不變,柱高就要多出兩倍的伸長量
  const level = LEVEL0 + 2 * ROD_K * (t - 20);
  return { rod, level, center: rod - level / 2 };
}

export default {
  figure: 316,
  parts: [
    { id: "support", kind: "box", center: [0, TOP + 0.2, 0], size: [0.9, 0.2, 0.4] },
    // 擺桿:長度隨溫度伸縮(沿桿方向縮放)
    { id: "rod", kind: "cylinder", axis: Y, radius: 0.05, length: ROD0 - 0.3 },
    {
      id: "jar",
      kind: "group",
      arrow: false,
      pieces: [
        // 瓶子(原點在瓶底):玻璃瓶剖開前半,看得到裡面的水銀;瓶底與上方的吊架
        { kind: "lathe", axis: Y, profile: [[0, 0], [JAR.r, 0], [JAR.r, JAR.h], [JAR.r - JAR.wall, JAR.h], [JAR.r - JAR.wall, 0.1], [0, 0.1]], ...backHalf(Y) },
        { kind: "plate", shape: shape(rect(2.0, 0.12, 0, JAR.h + 0.35)), thickness: 0.2 },
        { kind: "box", size: [0.1, 0.5, 0.1], at: [-0.95, JAR.h + 0.1, 0] },
        { kind: "box", size: [0.1, 0.5, 0.1], at: [0.95, JAR.h + 0.1, 0] },
      ],
    },
    { id: "mercury", kind: "fill", fluid: "mercury", shape: "cylinder", size: [2 * (JAR.r - JAR.wall) - 0.02, FILL_H, 0], level: LEVEL0 / FILL_H },
  ],
  driver: { type: "virtual", label: "溫度", mode: "balance", range: RANGE, initial: 20, unit: "°C" },
  target: "jar", // 當擺錘的水銀玻璃瓶(隨擺桿伸長下降,瓶裡的水銀把重心補回去)
  view: { direction: [0.05, 0.12, 1] },
  pose(t) {
    const { rod, level } = compensation(t);
    const bottom = TOP - rod;
    const rodLen = rod - 0.3; // 擺桿下端伸進水銀裡,離瓶底 0.3
    return {
      parts: {
        rod: { position: [0, TOP - rodLen / 2, 0], scale: [1, 1, rodLen / (ROD0 - 0.3)] },
        jar: { position: [0, bottom, 0] },
        mercury: { position: [0, bottom + 0.1 + FILL_H / 2, 0], level: level / FILL_H },
      },
      readouts: [],
    };
  },
};
