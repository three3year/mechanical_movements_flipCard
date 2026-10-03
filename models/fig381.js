// 第 381 種:Bowery 式木工夾具(下為平面圖,上為橫截面)。長方形床台的一端有兩個楔形夾頰,兩者相鄰的側面彼此成角度,
// 而且從上緣往內收成燕尾形,用來容納兩個楔塊;把楔塊順著夾頰往裡推,兩個楔塊的內側就夾緊要刨的木料。
// 主動件是楔塊(兩個一起往夾頰的尖端推)。
// 推斷:楔塊的角度與行程;木料的寬度;上方另畫一個固定的橫截面,表示燕尾形的槽。
import { deg, clamp } from "./kit.js";
import { shape, rect } from "./shapes.js";

const HALF = deg(14); // 夾頰側面與中線的夾角
const T = Math.tan(HALF);
const APEX_X = -2.7; // 夾頰側面延長後交會的點
const BOARD = 0.34; // 木料半寬
const WEDGE_W = 0.5; // 楔塊(粗的右端)的寬度
const WEDGE_L = 1.6;
const X0 = 1.2; // 楔塊右端的起始位置
export const RANGE = [0, X0 - APEX_X - (BOARD + WEDGE_W) / T]; // 楔塊被推進的距離:推到夾緊木料為止

/** 楔塊推進 d → 楔塊內側(夾木料的面)離中線的距離 */
export function clampGap(d0) {
  const d = clamp(d0, ...RANGE);
  // 楔塊外側貼著夾頰(離中線 = (x − APEX_X)·tan),薄的一端朝夾頰的尖端;楔塊右端從 X0 推進 d
  const xr = X0 - d;
  return { d, inner: (xr - APEX_X) * T - WEDGE_W, xr };
}

const BED = { x0: -3.3, x1: 3.5, y: 0.95 };
// 兩個夾頰:從床台左端到 x = 0.6,內側面是斜線
const jaw = (s) => shape(s > 0
  ? [[BED.x0, s * BED.y], [0.6, s * BED.y], [0.6, s * (0.6 - APEX_X) * T], [APEX_X + 0.25, s * 0.25 * T]]
  : [[BED.x0, s * BED.y], [APEX_X + 0.25, s * 0.25 * T], [0.6, s * (0.6 - APEX_X) * T], [0.6, s * BED.y]]);

export default {
  figure: 381,
  parts: [
    {
      id: "bed",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(rect(BED.x1 - BED.x0, 2 * BED.y + 0.3, (BED.x0 + BED.x1) / 2, 0)), thickness: 0.1, at: [0, 0, -0.1] },
        { kind: "plate", shape: jaw(1), thickness: 0.25, at: [0, 0, 0.05] },
        { kind: "plate", shape: jaw(-1), thickness: 0.25, at: [0, 0, 0.05] },
        // 上方的橫截面:床台、兩個燕尾形的夾頰與夾在中間的木料(固定的示意)
        { kind: "plate", shape: shape([[-1.0, 2.0], [1.0, 2.0], [1.0, 2.45], [0.55, 2.45], [0.45, 2.25], [-0.45, 2.25], [-0.55, 2.45], [-1.0, 2.45]]), thickness: 0.1 },
        { kind: "plate", shape: shape(rect(0.4, 1.0, 0, 2.75)), thickness: 0.1 },
      ],
    },
    { id: "board", kind: "plate", shape: shape(rect(5.0, 2 * BOARD, 0.6, 0)), thickness: 0.2, center: [0, 0, 0.1] },
    // 楔塊(局部:右端內側在原點,往左伸 WEDGE_L;外側斜面與夾頰平行)
    { id: "wedgeUp", kind: "plate", shape: shape([[-WEDGE_L, 0], [0, 0], [0, WEDGE_W], [-WEDGE_L, WEDGE_W - WEDGE_L * T]]), thickness: 0.22, arrow: false },
    { id: "wedgeDown", kind: "plate", shape: shape([[-WEDGE_L, 0], [-WEDGE_L, -(WEDGE_W - WEDGE_L * T)], [0, -WEDGE_W], [0, 0]]), thickness: 0.22, arrow: false },
  ],
  driver: { part: "wedgeUp", grips: ["wedgeDown"], type: "translation", direction: [-1, 0, 0], range: RANGE, initial: 0.2 },
  view: { direction: [0.02, 0.04, 1] },
  pose(d0) {
    const c = clampGap(d0);
    const yUp = c.inner; // 楔塊內側離中線的距離
    return {
      parts: {
        wedgeUp: { position: [c.xr, yUp, 0.15] },
        wedgeDown: { position: [c.xr, -yUp, 0.15] },
      },
      readouts: [],
    };
  },
};
