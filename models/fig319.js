// 第 319 種:補償擺輪。t、a、t' 是擺輪的主臂(中間 a 是軸),兩端有調節用的計時螺絲;t 與 t' 各接一段複合弧桿,
// 外側黃銅、內側鋼,弧桿上載著配重 b、b'。溫度升高時,黃銅膨脹得多,弧桿向內彎,配重往內移,
// 減少擺輪的轉動慣量,補償擺輪本身的膨脹(與游絲變軟);溫度降低時相反。
// 主動件是虛擬的「溫度」(平衡型)。彎曲量放大了許多倍。
// 推斷:弧桿彎曲的形狀(以弧桿自由端往內偏移表示);配重沿弧桿的位置。
import { deg, clamp } from "./kit.js";
import { shape, circle, rect } from "./shapes.js";

export const RANGE = [-10, 40];
const R = 1.75; // 弧桿半徑
const ARM = R; // 主臂半長
const SPAN = deg(150); // 弧桿從主臂端點往下繞過的角度
const BEND_K = 0.006; // 每度自由端往內偏移的量(放大)
const ROD = 0.07; // 弧桿的半粗
const WEIGHT = 0.42; // 配重的邊長

/** 溫度 t → 弧桿上各點(相對擺輪中心)、配重的位置;s = +1 上方臂端起的弧(右側)、−1 下方臂端起的弧(左側) */
export function rim(t0, s) {
  const t = clamp(t0, ...RANGE);
  const bend = BEND_K * (t - 20); // 正值:往內
  const start = s > 0 ? deg(90) : deg(-90);
  const pts = Array.from({ length: 25 }, (_, i) => {
    const f = i / 24;
    const a = start - SPAN * f; // 從臂端往順時針繞
    const r = R - bend * f * f * 3; // 越靠自由端彎得越多
    return [r * Math.cos(a), r * Math.sin(a)];
  });
  const k = 17; // 配重所在的點:配重裝在弧桿外側,內面貼著弧桿
  const rk = Math.hypot(...pts[k]);
  const out = (rk + ROD + WEIGHT / 2) / rk;
  return { pts, weight: [pts[k][0] * out, pts[k][1] * out], weightRadius: rk };
}

export default {
  figure: 319,
  parts: [
    {
      id: "arm",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(rect(0.28, 2 * ARM + 0.2), [circle(0.12).reverse()]), thickness: 0.14 },
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
    { id: "rimR", kind: "rod", radius: ROD },
    { id: "rimL", kind: "rod", radius: ROD },
    { id: "weightB", kind: "box", size: [WEIGHT, WEIGHT, 0.3], label: "b", labelOffset: [0.45, 0, 0.3] },
    { id: "weightB2", kind: "box", size: [WEIGHT, WEIGHT, 0.3], label: "b'", labelOffset: [-0.45, 0, 0.3] },
  ],
  powered: ["rimR", "rimL"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "溫度", mode: "balance", range: RANGE, initial: 20, unit: "°C" },
  targets: ["weightB", "weightB2"], // 隨弧桿彎曲往內、往外移的兩個配重 b、b'
  view: { direction: [0.03, 0.04, 1] },
  pose(t) {
    const r = rim(t, 1);
    const l = rim(t, -1);
    const z = (p) => [p[0], p[1], 0];
    const ang = (p) => Math.atan2(p[1], p[0]);
    return {
      parts: { weightB: { position: z(r.weight), angle: ang(r.weight) }, weightB2: { position: z(l.weight), angle: ang(l.weight) } },
      paths: { rimR: { points: r.pts.map(z), closed: false }, rimL: { points: l.pts.map(z), closed: false } },
      readouts: [],
    };
  },
};
