// 第 316 種:水銀補償擺。擺錘是一個裝水銀的玻璃瓶。溫度升高時擺桿伸長、瓶子跟著下降;同時水銀在瓶中膨脹、
// 液面升高,把重心抬回去,恰好補償擺桿的伸長;溫度降低時相反。所以擺動中心始終在同一位置,擺的有效長度不變。
// 主動件是虛擬的「溫度」(平衡型)。為了看得見,膨脹量放大了許多倍。
// 照 525 px 原圖:瓶子有瓶頸與凸緣,上面套一個金屬蓋,兩側耳片各有一顆螺絲頂住凸緣,把瓶子夾在蓋上;
// 擺桿從蓋子中心穿過、伸進水銀到接近瓶底。蓋上帶球頭把手的橫頭照原圖畫在蓋板上(推斷是旋在擺桿上、
// 定住瓶子高度的螺帽;原圖它離蓋板略高,模型讓它貼著蓋板,瓶子才有東西吊著),橫頭右邊的立板用途不明,沒畫。
// 推斷:以「水銀重心到懸掛點的距離不變」代表擺動中心不變(原文的補償原理),畫面上的紅線標出它的高度;
// 懸掛座(原圖擺桿往上伸出畫面)。玻璃瓶剖開前半,看得到水銀。
import { Y, X, clamp } from "./kit.js";
import { backHalf } from "./section.js";

const ROD0 = 4.6; // 20 °C 時懸掛點到瓶底的距離
export const RANGE = [-10, 40]; // 溫度 °C
const ROD_K = 0.012; // 每度擺桿伸長(放大)
const JAR = { r: 0.82, inner: 0.75, floor: 0.1 }; // 瓶身外半徑、內半徑、瓶底厚
const FLANGE = { r: 0.66, bottom: 3.2, top: 3.34 }; // 瓶口的凸緣
const CAP = { top: FLANGE.top + 0.12, half: 0.85 }; // 蓋板(壓在凸緣頂面)
const LEVEL0 = 2.0; // 20 °C 時水銀柱高
const TOP = 3.4;
const FILL_H = 2.7;

/** 溫度 t → 懸掛點到瓶底的距離、水銀柱高、水銀重心離懸掛點的距離 */
export function compensation(t0) {
  const t = clamp(t0, ...RANGE);
  const rod = ROD0 + ROD_K * (t - 20);
  // 水銀重心 = 瓶底往上半個柱高;要讓它離懸掛點的距離不變,柱高就要多出兩倍的伸長量
  const level = LEVEL0 + 2 * ROD_K * (t - 20);
  return { rod, level, center: rod - JAR.floor - level / 2 };
}
export const geometry = { FLANGE };

const CENTER_Y = TOP - compensation(20).center; // 擺動中心的高度(不隨溫度變)

// 瓶子的剖面(原點在瓶底):瓶身、圓肩、瓶頸、瓶口的凸緣,再沿內壁回到瓶底
const GLASS = [
  [0, 0], [JAR.r, 0], [JAR.r, 2.8], [0.78, 2.95], [0.66, 3.06], [0.56, 3.12], [0.56, FLANGE.bottom], [FLANGE.r, FLANGE.bottom], [FLANGE.r, FLANGE.top],
  [0.49, FLANGE.top], [0.49, 3.05], [0.59, 2.99], [0.71, 2.9], [JAR.inner, 2.78], [JAR.inner, JAR.floor], [0, JAR.floor],
];
const SCREW = { r: 0.04, out: CAP.half + 0.06, y: (FLANGE.bottom + FLANGE.top) / 2 }; // 耳片上的螺絲:尖端頂著凸緣外緣

export default {
  figure: 316,
  parts: [
    { id: "support", kind: "box", center: [0, TOP + 0.1, 0], size: [0.9, 0.2, 0.4] }, // 推斷的懸掛座:擺桿上端吊在它的底面
    // 擺桿:長度隨溫度伸縮(沿桿方向縮放)
    { id: "rod", kind: "cylinder", axis: Y, radius: 0.05, length: ROD0 - 0.3 },
    {
      id: "jar",
      kind: "group",
      arrow: false,
      pieces: [
        // 瓶子(原點在瓶底):玻璃瓶剖開前半,看得到裡面的水銀
        { kind: "lathe", axis: Y, profile: GLASS, ...backHalf(Y) },
        // 夾在瓶口的蓋:蓋板壓在凸緣頂面,兩側的耳片垂到凸緣外,耳片上的螺絲頂住凸緣
        { kind: "box", size: [2 * CAP.half, CAP.top - FLANGE.top, 0.5], at: [0, (CAP.top + FLANGE.top) / 2, 0] },
        ...[-1, 1].flatMap((s) => [
          { kind: "box", size: [0.12, CAP.top - 3.12, 0.5], at: [s * (CAP.half - 0.06), (CAP.top + 3.12) / 2, 0] },
          { kind: "cylinder", axis: X, radius: SCREW.r, length: SCREW.out - FLANGE.r, at: [s * ((SCREW.out + FLANGE.r) / 2), SCREW.y, 0] },
          { kind: "box", size: [0.06, 0.14, 0.14], at: [s * (CAP.half + 0.03), SCREW.y, 0] }, // 螺絲頭
        ]),
        // 蓋板上的小螺絲(照原圖)與帶球頭把手的橫頭(擺桿從它中心穿過)
        { kind: "cylinder", axis: Y, radius: 0.06, length: 0.1, at: [-0.45, CAP.top + 0.05, 0] },
        { kind: "box", size: [0.5, 0.2, 0.22], at: [0, CAP.top + 0.1, 0] },
        { kind: "box", size: [0.3, 0.07, 0.07], at: [-0.4, CAP.top + 0.1, 0] },
        { kind: "sphere", radius: 0.09, at: [-0.6, CAP.top + 0.1, 0] },
      ],
    },
    { id: "mercury", kind: "fill", fluid: "mercury", shape: "cylinder", size: [2 * JAR.inner - 0.02, FILL_H, 0], level: LEVEL0 / FILL_H },
    { id: "centerMark", kind: "trace" }, // 擺動中心的高度(固定的紅線)
  ],
  powered: ["rod"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "溫度", mode: "balance", range: RANGE, initial: 20, unit: "°C" },
  target: "jar", // 當擺錘的水銀玻璃瓶(隨擺桿伸長下降,瓶裡的水銀把重心補回去)
  view: { direction: [0.05, 0.12, 1] },
  pose(t) {
    const { rod, level, center } = compensation(t);
    const bottom = TOP - rod;
    const rodLen = rod - 0.3; // 擺桿下端伸進水銀裡,離瓶底 0.3
    const grow = rod - ROD0;
    return {
      parts: {
        rod: { position: [0, TOP - rodLen / 2, 0], scale: [1, 1, rodLen / (ROD0 - 0.3)] },
        jar: { position: [0, bottom, 0] },
        mercury: { position: [0, bottom + JAR.floor + FILL_H / 2, 0], level: level / FILL_H },
      },
      paths: { centerMark: { points: [[JAR.r + 0.15, CENTER_Y, 0], [JAR.r + 0.85, CENTER_Y, 0]], closed: false } },
      readouts: [
        { label: "擺桿伸長", value: `${grow >= 0 ? "+" : "−"}${Math.abs(grow).toFixed(2)}` },
        { label: "擺動中心到懸掛點(紅線)", value: `${center.toFixed(2)}(不變)` },
      ],
    };
  },
};
