// 第 397 種:把連續的圓周運動變成間歇的直線往復運動(用在多種縫紉機上推動梭子,也用在三轉式圓筒印刷機上)。
// 一根擺桿的下端以樞軸接在底座上,中段是一道彎曲的長槽,曲柄銷在槽裡走:銷走過槽的彎曲部分時擺桿停住,
// 走過其餘部分時擺桿擺動;擺桿上端經連桿推拉上方的滑桿,滑桿因此一陣一陣地往復。主動件是曲柄。
// 推斷:槽的形狀(以「擺桿角隨曲柄角變化、中間有停頓」反推);各桿長依原圖。
import { TAU, deg, smooth } from "./kit.js";
import { shape, thickLine, circle } from "./shapes.js";

const PIVOT = [0, -2.2, 0]; // 擺桿下端的樞軸
const CRANK = { center: [0.05, -0.45, 0], r: 0.35 };
const ARM = 3.6; // 擺桿長
export const SWING = deg(16);
const ROD = 1.6;
const BAR_Y = 1.75;

/** 曲柄轉 theta → 擺桿角:曲柄轉過一圈的兩段各 90° 時擺桿停住(間歇) */
export function lever(theta) {
  const f = (((theta / TAU) % 1) + 1) % 1;
  // 0–0.25 擺到右、0.25–0.5 停、0.5–0.75 擺回左、0.75–1 停
  if (f < 0.25) return -SWING + 2 * SWING * smooth(f / 0.25);
  if (f < 0.5) return SWING;
  if (f < 0.75) return SWING - 2 * SWING * smooth((f - 0.5) / 0.25);
  return -SWING;
}

/** 擺桿角 a → 上端位置、滑桿的位移 */
export function slide(a) {
  const top = [PIVOT[0] + ARM * Math.sin(a), PIVOT[1] + ARM * Math.cos(a), 0];
  const x = top[0] - Math.sqrt(ROD * ROD - (BAR_Y - top[1]) ** 2);
  return { top, x };
}

export default {
  figure: 397,
  parts: [
    { id: "frame", kind: "group", pieces: [{ kind: "box", size: [1.2, 0.15, 0.6], at: [0, -2.4, 0] }, { kind: "box", size: [3.6, 0.12, 0.6], at: [-0.6, BAR_Y + 0.3, -0.3] }, { kind: "cylinder", radius: 0.1, length: 0.4, at: PIVOT }] },
    {
      id: "crank",
      kind: "group",
      center: CRANK.center,
      spin: CRANK.r + 0.2,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0, 0], [CRANK.r, 0]], 0.22), [circle(0.06).reverse()]), thickness: 0.1, at: [0, 0, 0.25] },
        { kind: "cylinder", radius: 0.2, length: 0.4, at: [0, 0, 0.15] },
        { kind: "cylinder", radius: 0.07, length: 0.4, at: [CRANK.r, 0, 0.15], accent: true },
      ],
    },
    {
      id: "lever",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        // 有彎曲長槽的擺桿(以兩條邊框表示槽)
        { kind: "plate", shape: shape(thickLine([[0, 0], [-0.15, 0.9], [-0.45, 1.7], [-0.15, 2.6], [0, ARM]], 0.12)), thickness: 0.1 },
        { kind: "plate", shape: shape(thickLine([[0.3, 0.9], [0.05, 1.7], [0.3, 2.6]], 0.12)), thickness: 0.1 },
      ],
    },
    { id: "rod", kind: "link", width: 0.12, thickness: 0.06 },
    { id: "bar", kind: "box", size: [3.0, 0.14, 0.14] },
  ],
  driver: { part: "crank", type: "rotation" },
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const a = lever(theta);
    const s = slide(a);
    return {
      parts: {
        crank: { angle: theta },
        lever: { angle: -a },
        rod: { from: [s.top[0], s.top[1], 0.15], to: [s.x, BAR_Y, 0.15] },
        bar: { position: [s.x - 1.5, BAR_Y, 0.15] },
      },
      readouts: [],
    };
  },
};
