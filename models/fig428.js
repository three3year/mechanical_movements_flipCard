// 第 428 種:印度橡膠旋轉式引擎。汽缸有一層印度橡膠做的撓性內襯 E,以滾子 A、A 代替活塞,滾子裝在從主軸 B 放射出去的
// 搖臂上。蒸汽在橡膠與外圍剛性汽缸之間作用,把橡膠壓向滾子,使滾子繞著汽缸轉、帶動主軸。
// 主動件是主軸 B(原圖箭頭:順時針)。
// 推斷:三個滾子把橡膠壓貼在汽缸壁上;進汽口在左、排汽口在右。從進汽口順時針到前面那個滾子之間,蒸汽把橡膠往內壓、
// 包住滾子的後側,推它前進;其餘部分的橡膠貼著汽缸壁。
import { TAU, deg } from "./kit.js";
import { stream } from "./flow.js";
import { shape, circle, thickLine } from "./shapes.js";

export const BORE = 1.8;
export const ROLLER = 0.3;
export const ARM = BORE - ROLLER; // 滾子中心離主軸
const INLET = Math.PI; // 進汽口(左)
const DEPTH = 0.55; // 橡膠被壓進去的最大深度

const polar = (r, a, z = 0) => [r * Math.cos(a), r * Math.sin(a), z];
const wrap = (a) => ((a % TAU) + TAU) % TAU;

/** 主軸轉 theta → 從進汽口順時針到第一個滾子的角度 */
export function aheadOfInlet(theta) {
  return Math.min(...[0, 1, 2].map((k) => wrap(INLET - (theta + (k * TAU) / 3))));
}

/** 橡膠內襯在角度 phi 的半徑:蒸汽區內被往內壓,其餘貼著汽缸 */
export function lining(theta, phi) {
  const span = aheadOfInlet(theta);
  const t = wrap(INLET - phi) / span; // 0 在進汽口,1 在滾子
  if (t >= 1 || span < deg(8)) return BORE;
  return BORE - DEPTH * Math.sin(Math.PI * t) ** 0.8 * Math.min(1, span / deg(60));
}

const inletPipe = [[-BORE - 0.9, 0.25, 0.2], [-BORE - 0.1, 0.25, 0.2], [-BORE + 0.05, 0.12, 0.2]];
const exhaustPipe = [[BORE - 0.05, -0.12, 0.2], [BORE + 0.1, -0.25, 0.2], [BORE + 0.9, -0.25, 0.2]];

export default {
  figure: 428,
  parts: [
    {
      id: "cylinder",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(circle(BORE + 0.2), [circle(BORE).reverse()]), thickness: 0.6 },
        { kind: "plate", shape: shape(circle(BORE + 0.2)), thickness: 0.04, at: [0, 0, -0.32] },
        { kind: "box", size: [2.6, 0.25, 0.9], at: [0, -BORE - 0.35, 0] },
        { kind: "plate", shape: shape(thickLine(inletPipe.map(([x, y]) => [x, y + 0.08]), 0.06)), thickness: 0.3 },
        { kind: "plate", shape: shape(thickLine(exhaustPipe.map(([x, y]) => [x, y - 0.08]), 0.06)), thickness: 0.3 },
      ],
    },
    { id: "lining", kind: "rod", radius: 0.045, label: "E", labelOffset: [BORE * 0.62, BORE * 0.55, 0.3] }, // 路徑零件的標籤從原點量起
    {
      id: "arms",
      kind: "group",
      label: "B",
      labelOffset: [0.05, -0.4, 0.4],
      spin: 0.5,
      pieces: [
        { kind: "cylinder", radius: 0.3, length: 0.3 },
        ...[0, 1, 2].map((k) => ({ kind: "plate", shape: shape(thickLine([[0, 0], [ARM, 0]], 0.16)), thickness: 0.1, angle: (k * TAU) / 3, at: [0, 0, -0.18] })),
        { kind: "plate", shape: shape(circle(0.12)), thickness: 0.32, mark: [0, 0.05], markSize: 0.05 },
      ],
    },
    ...[0, 1, 2].map((k) => ({ id: `roller${k + 1}`, kind: "pulley", style: "disc", radius: ROLLER - 0.04, width: 0.5, label: "A", labelOffset: [0, 0, 0.45], arrow: false })),
  ],
  driver: { part: "arms", type: "rotation", speed: -0.5, initial: deg(80) },
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const pts = Array.from({ length: 241 }, (_, i) => {
      const phi = (TAU * i) / 240;
      return polar(lining(theta, phi), phi, 0.05);
    });
    const span = aheadOfInlet(theta);
    const dots = [];
    const n = Math.max(1, Math.round(span / deg(6)));
    for (let i = 0; i < n; i++) {
      const phi = INLET - (span * (i + 0.5 + 0.3 * Math.sin(theta * 3 + i))) / n;
      const r = lining(theta, phi);
      if (BORE - r > 0.1) dots.push(polar((r + BORE) / 2, phi, 0.1));
    }
    const parts = { arms: { angle: theta } };
    for (let k = 0; k < 3; k++) {
      const a = theta + (k * TAU) / 3;
      // 滾子沿汽缸內壁滾:自轉 = 公轉 × (1 − 汽缸半徑 / 滾子半徑)
      parts[`roller${k + 1}`] = { position: polar(ARM, a), angle: theta * (1 - BORE / ROLLER) };
    }
    return {
      parts,
      paths: { lining: { points: pts, closed: true } },
      flows: [
        { fluid: "steam", points: [...dots, ...stream(inletPipe, -theta, { spacing: 0.18 })] },
        { fluid: "steam", points: stream(exhaustPipe, -theta, { spacing: 0.18 }) },
      ],
      readouts: [],
    };
  },
};

