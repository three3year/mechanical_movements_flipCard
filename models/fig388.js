// 第 388 種:Woodworth 刨木機的進料運動:下面一個平滑的支撐滾子,上面一個帶齒的滾子,木板夾在兩者之間;
// 上滾子轉動,齒咬住木板把它往前送(原圖箭頭往右),下滾子被木板帶著轉。主動件是上面的帶齒滾子。
// 推斷:兩滾子不打滑;木板的長度。
import { shape, circle, polygon } from "./shapes.js";

const TOP = { center: [0, 0.72, 0], r: 0.62 };
const LOW = { center: [0, -1.1, 0], r: 0.95 };
const BOARD_Y = -0.05;
const BOARD_L = 4.5;
export const RANGE = [-4.5 / TOP.r, 0]; // 上滾子的轉角:把木板從左邊送到右邊

/** 上滾子轉 a(順時針為負)→ 木板前進的距離、下滾子的轉角 */
export function feed(a) {
  const travel = -a * TOP.r;
  return { travel, low: travel / LOW.r };
}

export default {
  figure: 388,
  parts: [
    {
      id: "top",
      kind: "plate",
      center: TOP.center,
      shape: shape(polygon(36, TOP.r + 0.1).map(([x, y], i) => (i % 2 ? [x * 0.86, y * 0.86] : [x, y])), [circle(0.1).reverse()]),
      thickness: 0.6,
      hub: 0.15,
      circles: [0.25],
      mark: [TOP.r * 0.55, 0],
      markSize: 0.07,
      spin: TOP.r,
    },
    { id: "low", kind: "plate", center: LOW.center, shape: shape(circle(LOW.r), [circle(0.12).reverse()]), thickness: 0.6, hub: 0.2, circles: [0.32], mark: [LOW.r * 0.6, 0], markSize: 0.08, spin: LOW.r },
    { id: "board", kind: "box", size: [BOARD_L, 0.18, 0.7] },
  ],
  driver: { part: "top", type: "rotation", range: RANGE, initial: 0 },
  view: { direction: [0.03, 0.05, 1] },
  pose(a) {
    const f = feed(a);
    const x = -BOARD_L / 2 + 0.8 + f.travel;
    return { parts: { top: { angle: a }, low: { angle: f.low }, board: { position: [x, BOARD_Y, 0] } }, readouts: [] };
  },
};
