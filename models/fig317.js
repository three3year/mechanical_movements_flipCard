// 第 317 種:複合桿補償擺。C 是一根由黃銅與鐵(或鋼)焊在一起、黃銅朝下的複合桿,橫架在擺錘 M 的頂上,兩端各掛一個重物 W。
// 黃銅膨脹得比鐵多,變暖時複合桿向上彎曲,帶著兩個 W 一起升高,把整體重心抬回去,
// 恰好抵消擺桿受熱伸長使擺動中心下降的量。主動件是虛擬的「溫度」(平衡型)。膨脹量放大了許多倍。
// 照 525 px 原圖:擺桿從上方穿過 C 中央的凸台與 M,下端是螺紋,螺帽托住 M(調快慢的螺帽);凸台固定在擺桿上,
// 把 C 壓在 M 的頂面。C 穿過兩個 W、桿端露在 W 外(W 上的虛線是藏在裡面的固定螺絲,沒畫)。
// 複合桿畫成兩層:上層鐵(一般的顏色),下層黃銅(黃銅色),兩層一起彎。
// 推斷:以「擺錘 M 與兩個 W 的總重心到懸掛點的距離不變」代表擺動中心不變,畫面上的紅線標出它的高度;
// M 與 W 的重量比;懸掛座(原圖擺桿往上伸出畫面)。
import { Y, X, clamp } from "./kit.js";
import { shape, rect } from "./shapes.js";

const TOP = 3.4;
const NUT = 2.3; // 螺帽底面到複合桿中點的距離(M 高 1.96、C 的下層、螺帽 0.25;寬照原圖約 M 的 0.3 倍)
const ROD0 = 3.6 + NUT; // 20 °C 時懸掛點到螺帽底面(擺桿下端)的距離
export const RANGE = [-10, 40];
const ROD_K = 0.012;
const ROD_R = 0.1; // 擺桿
const BAR_R = 0.045; // 複合桿每一層的半徑(上層鐵、下層黃銅)
const XW = 1.7; // W 在複合桿上的位置
const W_HALF = 0.225; // W 沿複合桿的半長
const XE = XW + W_HALF + 0.15; // 複合桿的端點,露在 W 外
const MASS = { M: 1, W: 0.5 }; // 擺錘與每個 W 的相對重量
const M_DROP = 1.25; // 擺錘重心在複合桿下方的距離

/** 溫度 t → 擺桿長(到螺帽)、W 隨複合桿上彎的量、總重心到懸掛點的距離 */
export function compound(t0) {
  const t = clamp(t0, ...RANGE);
  const rod = ROD0 + ROD_K * (t - 20);
  const mid = rod - NUT; // 懸掛點到複合桿中點
  // 總重心 = (M·(mid + M_DROP) + 2W·(mid − rise)) / (M + 2W) 要不變 → rise 依伸長量算
  const total = MASS.M + 2 * MASS.W;
  const rise = 0.35 + (total / (2 * MASS.W)) * (rod - ROD0);
  const center = (MASS.M * (mid + M_DROP) + 2 * MASS.W * (mid - rise)) / total;
  return { rod, rise, center };
}
export const geometry = { XW, W_HALF, MASS, M_DROP };

const CENTER_Y = TOP - compound(20).center; // 擺動中心的高度(不隨溫度變)

// 複合桿兩層的交界線(相對桿的中點):在 W 處上彎 rise(拋物線)。中央有孔讓擺桿穿過,所以每一層分成左右兩段,
// 都從擺桿的表面(孔壁)往外;取樣點含兩個 W 的中心
const HALF_XS = [ROD_R, ...Array.from({ length: 8 }, (_, i) => ROD_R + ((i + 1) / 8) * (XW - ROD_R)), XE];
const slope = (rise, x) => (2 * rise * x) / XW ** 2;
/** 交界線往上(s = 1,鐵)或往下(s = −1,黃銅)偏一層半徑,就是那一層的中心線;side:左(−1)或右(1)半段,由中央往外 */
const layer = (rise, s, side) => HALF_XS.map((u) => {
  const x = side * u;
  const k = slope(rise, x);
  const n = Math.hypot(1, k);
  return [x - (s * BAR_R * k) / n, rise * (x / XW) ** 2 + (s * BAR_R) / n];
});

// W:C 從中間的方孔穿過(孔的高、寬剛好容得下兩層)
const weight = (label) => ({
  id: `weight${label}`,
  kind: "group",
  label: "W",
  labelOffset: [0, -0.4, 0.3],
  pieces: [{ kind: "plate", axis: X, shape: shape(rect(0.4, 0.35), [rect(2 * BAR_R, 4 * BAR_R).reverse()]), thickness: 2 * W_HALF }],
});

export default {
  figure: 317,
  parts: [
    { id: "support", kind: "box", center: [0, TOP + 0.1, 0], size: [0.9, 0.2, 0.4] }, // 推斷的懸掛座:擺桿上端吊在它的底面
    // 擺桿:從懸掛座穿過凸台、C 與 M 到螺帽底;長度隨溫度伸縮(沿桿方向縮放)
    { id: "rod", kind: "cylinder", axis: Y, radius: ROD_R, length: ROD0 },
    {
      id: "bob",
      kind: "group",
      label: "M",
      labelOffset: [0, -1.2, 0.6],
      pieces: [{ kind: "lathe", axis: Y, profile: [[0, -2.05], [1.05, -2.05], [1.05, -0.79], [0.85, -0.29], [0.3, -2 * BAR_R], [0, -2 * BAR_R]] }],
    },
    // 擺桿下端的螺帽(托住 M)與露在螺帽下的螺紋
    {
      id: "nut",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.62, 0.25, 0.62], at: [0, -2.05 - 0.125, 0] },
        { kind: "cylinder", axis: Y, radius: 0.06, length: 0.42, at: [0, -NUT - 0.21, 0] },
        ...[0, 1, 2, 3, 4].map((i) => ({ kind: "cylinder", axis: Y, radius: 0.09, length: 0.03, at: [0, -NUT - 0.06 - 0.07 * i, 0] })),
      ],
    },
    // C 中央的凸台:固定在擺桿上,壓著 C 的上緣
    { id: "hubC", kind: "group", pieces: [{ kind: "lathe", axis: Y, profile: [[0, 2 * BAR_R], [0.26, 2 * BAR_R], [0.2, 0.13], [0.15, 0.2], [0.13, 0.3], [0.13, 0.42], [0, 0.42]] }] },
    // 複合桿 C:上層鐵、下層黃銅,各分左右兩段(中央是擺桿穿過的孔)
    { id: "steelL", kind: "rod", radius: BAR_R, label: "C", center: [0, TOP - 3.6, 0], labelOffset: [-0.5, 0.35, 0.3] },
    { id: "steelR", kind: "rod", radius: BAR_R },
    { id: "brassL", kind: "rod", radius: BAR_R, metal: "brass" },
    { id: "brassR", kind: "rod", radius: BAR_R, metal: "brass" },
    weight("L"),
    weight("R"),
    { id: "centerMark", kind: "trace" }, // 擺動中心的高度(固定的紅線)
  ],
  powered: ["rod"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "溫度", mode: "balance", range: RANGE, initial: 20, unit: "°C" },
  targets: ["weightL", "weightR"], // 被複合桿抬高、把重心補回去的兩個重物 W
  view: { direction: [0.05, 0.12, 1] },
  pose(t) {
    const { rod, rise, center } = compound(t);
    const mid = TOP - rod + NUT;
    const at = (pts) => pts.map(([x, y]) => [x, mid + y, 0]);
    const tilt = Math.atan(slope(rise, XW));
    const grow = rod - ROD0;
    return {
      parts: {
        rod: { position: [0, TOP - rod / 2, 0], scale: [1, 1, rod / ROD0] },
        bob: { position: [0, mid, 0] },
        nut: { position: [0, mid, 0] },
        hubC: { position: [0, mid, 0] },
        weightL: { position: [-XW, mid + rise, 0], angle: -tilt },
        weightR: { position: [XW, mid + rise, 0], angle: tilt },
      },
      paths: {
        steelL: { points: at(layer(rise, 1, -1)), closed: false },
        steelR: { points: at(layer(rise, 1, 1)), closed: false },
        brassL: { points: at(layer(rise, -1, -1)), closed: false },
        brassR: { points: at(layer(rise, -1, 1)), closed: false },
        centerMark: { points: [[1.2, CENTER_Y, 0], [1.95, CENTER_Y, 0]], closed: false },
      },
      readouts: [
        { label: "擺桿伸長", value: `${grow >= 0 ? "+" : "−"}${Math.abs(grow).toFixed(2)}` },
        { label: "擺動中心到懸掛點(紅線)", value: `${center.toFixed(2)}(不變)` },
      ],
    };
  },
};
