// 第 319 種:補償擺輪。t、a、t' 是擺輪的主臂(中間 a 是軸),兩端有調節用的計時螺絲;t 與 t' 各接一段複合弧桿,
// 外側黃銅、內側鋼,弧桿上載著配重 b、b'。溫度升高時,黃銅膨脹得多,弧桿向內彎,配重往內移,
// 減少擺輪的轉動慣量,補償擺輪本身的膨脹(與游絲變軟);溫度降低時相反。
// 主動件是虛擬的「溫度」(平衡型)。彎曲量放大了許多倍。
// 弧桿畫成焊在一起的兩層:外層黃銅(黃銅色)、內層鋼(一般的顏色),兩層一起彎。
// 照 525 px 原圖:配重套在弧桿上——弧桿從配重靠內側約三分之一處穿過、從另一面伸出一段,配重外側的螺絲頂著弧桿
// 把它鎖住(原圖弧桿與配重旁的虛線是變形後的位置,不是零件)。配重的孔是直的,弧桿在配重裡微微彎,孔比弧桿大一點點。
// 讀數:轉動慣量(相對 20 °C),由配重與弧桿各點離中心的距離算。
// 推斷:弧桿彎曲的形狀(以弧桿自由端往內偏移表示);配重沿弧桿的位置;配重、弧桿與主臂的重量比。
import { deg, clamp, Y, X } from "./kit.js";
import { shape, circle, rect } from "./shapes.js";

export const RANGE = [-10, 40];
const R = 1.75; // 弧桿(兩層的交界)半徑
const ARM = R; // 主臂半長
const SPAN = deg(150); // 弧桿從主臂端點往下繞過的角度
const BEND_K = 0.006; // 每度自由端往內偏移的量(放大)
const LAYER = 0.035; // 每一層的半徑(外層黃銅、內層鋼)
const RIM_HEATS = "複合弧桿受熱彎曲是原理(黃銅膨脹得比鋼多),彎曲量放大了許多倍:弧桿張的角度不變、自由端往內彎,每一層的長度跟著變"; // 伸縮的宣告
const N = 48; // 弧桿沿長度的取樣段數
const ARM_HALF = 0.14; // 主臂的半寬
// 弧桿從主臂端點的裡面開始(接在臂上),第一段就穿出臂的側面;之後每 1/N 取一點
const F0 = Math.asin((ARM_HALF - 0.04) / R) / SPAN;
const FS = [F0, ...Array.from({ length: N - 1 }, (_, i) => (i + 2) / N)];
const FW = 34 / N; // 配重在弧桿上的位置(從臂端量起的比例,剛好是一個取樣點)
const WEIGHT = { size: 0.42, depth: 0.3 }; // 配重:徑向與沿弧桿的邊長、厚
const OFFSET = WEIGHT.size / 2 - WEIGHT.size / 3; // 弧桿離配重中心往內的距離(穿在靠內側三分之一處)
const SAG = (WEIGHT.size / 2) ** 2 / (2 * R); // 弧桿在配重裡偏離直孔的量(弓高)
const HOLE = { x: -OFFSET - SAG / 2, r: 2 * LAYER + SAG / 2 + 0.003 }; // 配重的直孔:中心偏在弓高的一半,容得下彎著的弧桿
const MASS = { weight: 1, rim: 0.6, arm: 0.8 }; // 每個配重、每段弧桿、主臂的相對重量

/** 溫度 t、s = +1 上方臂端起的弧(右側)、−1 下方臂端起的弧(左側)→ 弧桿上比例 f 處兩層交界的點、切線、往外的法線 */
function rimAt(t0, s, f) {
  const t = clamp(t0, ...RANGE);
  const bend = BEND_K * (t - 20); // 正值:往內
  const a = (s > 0 ? deg(90) : deg(-90)) - SPAN * f; // 從臂端往順時針繞
  const r = R - bend * f * f * 3; // 越靠自由端彎得越多
  const dr = -6 * bend * f; // dr/df
  const radial = [Math.cos(a), Math.sin(a)];
  const across = [Math.sin(a), -Math.cos(a)]; // 往順時針(f 增加)的方向
  const d = [dr * radial[0] + r * SPAN * across[0], dr * radial[1] + r * SPAN * across[1]];
  const l = Math.hypot(...d);
  const tangent = [d[0] / l, d[1] / l];
  const normal = [-tangent[1], tangent[0]]; // 順時針走時左手邊就是外側
  return { point: [r * radial[0], r * radial[1]], tangent, normal };
}

/** 溫度 t → 弧桿兩層的中心線、配重的位置與方向;s 同上 */
export function rim(t, s) {
  const samples = FS.map((f) => rimAt(t, s, f));
  const layer = (side) => samples.map(({ point, normal }) => [point[0] + side * LAYER * normal[0], point[1] + side * LAYER * normal[1], 0]);
  const w = rimAt(t, s, FW);
  const weight = [w.point[0] + OFFSET * w.normal[0], w.point[1] + OFFSET * w.normal[1]];
  return {
    pts: samples.map(({ point }) => point),
    brass: layer(1),
    steel: layer(-1),
    weight,
    weightAngle: Math.atan2(w.normal[1], w.normal[0]), // 配重的局部 x 朝外
    weightRadius: Math.hypot(...weight),
  };
}

/** 溫度 t → 轉動慣量(相對 20 °C 的變化比例):兩個配重(當成質點)、兩段弧桿(沿長度均分)、主臂(不變) */
function inertia(t) {
  const arm = (MASS.arm * (2 * ARM + 0.2) ** 2) / 12;
  return [1, -1].reduce((sum, s) => {
    const { pts, weightRadius } = rim(t, s);
    const rimI = pts.reduce((acc, [x, y]) => acc + (MASS.rim / pts.length) * (x * x + y * y), 0);
    return sum + MASS.weight * weightRadius ** 2 + rimI;
  }, arm);
}
const I20 = inertia(20);

// 配重:沿弧桿走向(局部 y)開直孔的方塊,外側一顆鎖緊螺絲沿局部 x 伸進來頂著弧桿
const weight = (id, label, labelOffset) => ({
  id,
  kind: "group",
  label,
  labelOffset,
  pieces: [
    { kind: "plate", axis: Y, shape: shape(rect(WEIGHT.size, WEIGHT.depth), [circle(HOLE.r, HOLE.x, 0).reverse()]), thickness: WEIGHT.size },
    { kind: "cylinder", axis: X, radius: 0.025, length: WEIGHT.size / 2 + 0.03 - (2 * LAYER - OFFSET), at: [(WEIGHT.size / 2 + 0.03 + 2 * LAYER - OFFSET) / 2, 0, 0] }, // 螺絲桿:尖端頂著黃銅層的外緣
    { kind: "cylinder", axis: X, radius: 0.06, length: 0.05, at: [WEIGHT.size / 2 + 0.025, 0, 0] }, // 螺絲頭
  ],
});

const signed = (x) => (Math.abs(x) < 0.05 ? (0).toFixed(1) : `${x > 0 ? "+" : "−"}${Math.abs(x).toFixed(1)}`);

export default {
  figure: 319,
  parts: [
    {
      id: "arm",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(rect(2 * ARM_HALF, 2 * ARM + 0.2), [circle(0.12).reverse()]), thickness: 0.14 },
        { kind: "plate", shape: shape(circle(0.3), [circle(0.12).reverse()]), thickness: 0.2 },
        { kind: "cylinder", radius: 0.12, length: 0.7 }, // 擺輪軸 a(推斷:原圖只畫出軸孔)
        // 兩端的計時螺絲
        { kind: "cylinder", axis: [0, 1, 0], radius: 0.06, length: 0.35, at: [0, ARM + 0.25, 0] },
        { kind: "cylinder", axis: [0, 1, 0], radius: 0.06, length: 0.35, at: [0, -ARM - 0.25, 0] },
      ],
      label: "a",
      labelOffset: [0.4, 0, 0.3],
    },
    { id: "labelT", kind: "group", center: [0, ARM + 0.2, 0], label: "t", labelOffset: [-0.3, 0.1, 0.3] },
    { id: "labelT2", kind: "group", center: [0, -ARM - 0.2, 0], label: "t'", labelOffset: [0.3, -0.1, 0.3] },
    // 兩段複合弧桿:外層黃銅、內層鋼
    { id: "brassR", kind: "rod", radius: LAYER, stretch: RIM_HEATS, metal: "brass" },
    { id: "steelR", kind: "rod", radius: LAYER, stretch: RIM_HEATS },
    { id: "brassL", kind: "rod", radius: LAYER, stretch: RIM_HEATS, metal: "brass" },
    { id: "steelL", kind: "rod", radius: LAYER, stretch: RIM_HEATS },
    weight("weightB", "b", [0.45, 0, 0.3]),
    weight("weightB2", "b'", [-0.45, 0, 0.3]),
  ],
  powered: ["brassR", "steelR", "brassL", "steelL"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "溫度", mode: "balance", range: RANGE, initial: 20, unit: "°C" },
  targets: ["weightB", "weightB2"], // 隨弧桿彎曲往內、往外移的兩個配重 b、b'
  view: { direction: [0.03, 0.04, 1] },
  pose(t) {
    const r = rim(t, 1);
    const l = rim(t, -1);
    return {
      parts: {
        weightB: { position: [...r.weight, 0], angle: r.weightAngle },
        weightB2: { position: [...l.weight, 0], angle: l.weightAngle },
      },
      paths: {
        brassR: { points: r.brass, closed: false },
        steelR: { points: r.steel, closed: false },
        brassL: { points: l.brass, closed: false },
        steelL: { points: l.steel, closed: false },
      },
      readouts: [{ label: "轉動慣量(相對 20 °C)", value: `${signed(100 * (inertia(t) / I20 - 1))}%` }],
    };
  },
};
