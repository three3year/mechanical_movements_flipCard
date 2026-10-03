// 第 188 種(條目 187–188 的第二張圖):第 186 種的另一個變形。偏心桿上以銷裝著一支手柄,
// 左上方是大環形的握把,右邊一根彎指越過去、往下壓在搖臂的銷上(虛線是被遮住的部分)。
// 把握把往後扳,彎指往下頂住銷,桿端被抬起,銷從鉤口脫出;握把下的彈簧卡進凹槽 a,把手柄留在這個位置。
// 推斷:扳動方向、彈簧與凹槽 a 的位置(依第 186 種的原文類推)。主動件是手柄。
import { deg, rot2 } from "./kit.js";
import { gab, rodAngle, onRod, leverLift, ECC } from "./gab.js";
import { shape, thickLine, offsetLoop } from "./shapes.js";

const G = gab();
const PIVOT = [-1.3, 0.45];
const FINGER = [[0, 0], [0.35, 0.4], [0.75, 0.65], [1.1, 0.62], [1.3, 0.4], [1.32, 0.0], [1.3, -0.23]];
const TIP = FINGER[FINGER.length - 1]; // 彎指尖(相對樞軸),壓在銷頂
const MAX = deg(27);
const STEM = [[0, 0], [-0.5, 0.35], [-0.85, 0.8], [-0.95, 1.4], [-0.85, 1.9]];
const LOOP = Array.from({ length: 56 }, (_, i) => {
  const t = (i / 56) * 2 * Math.PI;
  return rot2([1.2 * Math.cos(t), 0.48 * Math.sin(t)], deg(4)).map((v, k) => v + [-1.95, 2.05][k]);
});

/** 手柄往後扳 phi(順時針,phi ≤ 0):桿端抬起的量 */
export function unhook(phi) {
  const lift = leverLift(TIP, phi);
  return { lift, released: G.released(lift) };
}
export const max = MAX;

// 手柄卡住時,握把的柄經過的位置 → 凹槽 a
const LATCH = rot2(STEM[3], -MAX).map((v, k) => v + PIVOT[k]);
const SPRING = [[-2.65, 0.35], [-2.35, 0.95], [LATCH[0] - 0.45, LATCH[1] - 0.45], [LATCH[0] - 0.15, LATCH[1] + 0.05]];

export default {
  figure: 188,
  parts: [
    {
      id: "rocker",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape([[-0.35, 1.7], [-0.2, 0], [0.2, 0], [0.05, 1.7]]), thickness: 0.15, at: [0, 0, -0.35] },
        { kind: "cylinder", radius: 0.3, inner: 0.15, length: 0.25, at: [-0.15, 1.75, -0.35] },
        { kind: "cylinder", radius: G.pin, length: 0.8, at: [0, 0, 0.05] },
      ],
    },
    { id: "rod", kind: "group", center: ECC, arrow: false, pieces: [{ kind: "plate", shape: G.rod({ left: -4.7, right: 1.55 }), thickness: 0.25, at: [-ECC[0], 0, 0] }] },
    {
      id: "spring",
      kind: "plate",
      center: ECC,
      shape: shape(thickLine(SPRING.map(([x, y]) => [x - ECC[0], y]), 0.12)),
      thickness: 0.12,
      arrow: false,
      label: "a",
      labelOffset: [LATCH[0] - ECC[0] - 0.45, LATCH[1] + 0.2, 0],
    },
    {
      id: "handle",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine(FINGER, 0.16)), thickness: 0.12, at: [0, 0, 0.1] },
        { kind: "plate", shape: shape(thickLine(STEM, 0.2)), thickness: 0.15 },
        { kind: "plate", shape: shape(offsetLoop(LOOP, 0.1), [offsetLoop(LOOP, -0.1).reverse()]), thickness: 0.15 },
        { kind: "cylinder", radius: 0.12, inner: 0.05, length: 0.3 },
      ],
    },
  ],
  driver: { part: "handle", type: "rotation", range: [-MAX, 0] },
  target: "rod",
  view: { direction: [0.06, 0.05, 1] },
  pose(phi) {
    const { lift, released } = unhook(phi);
    const a = rodAngle(lift);
    return {
      parts: { rod: { angle: a }, spring: { angle: a }, handle: { position: onRod(PIVOT, lift, 0.3), angle: a + phi } },
      readouts: [{ label: "銷", value: released ? "已脫出鉤口" : "在鉤口中" }],
    };
  },
};
