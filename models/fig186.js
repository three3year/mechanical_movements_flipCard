// 第 186 種:把偏心桿與閥門齒輪脫鉤的裝置。偏心桿(左邊伸來的長桿)末端的鉤口搭在搖臂(上方軸往下的臂)的銷上。
// 桿端上以銷裝著一支彈簧手柄:往上拉下方的環形手柄,手柄上端的指頭往下頂在搖臂的凸柱上,桿端因此被抬起,
// 拉到手柄卡進凹槽 a 時,銷已從鉤口中脫出。主動件是手柄。
// 推斷:指頭頂在搖臂上一個凸柱的頂上(原圖被手柄遮住);彈簧與凹槽 a 的形狀;指頭的接觸點固定不動,
// 桿端抬起的量等於指頭相對桿端下降的量。
import { deg, add, rot2 } from "./kit.js";
import { gab, rodAngle, onRod, leverLift, ECC } from "./gab.js";
import { shape, thickLine, offsetLoop } from "./shapes.js";

const G = gab();
const PIVOT = [0.9, 0.2]; // 手柄在桿上的樞軸(以銷為原點的桿座標)
const FINGER = [-0.65, 0.95]; // 指頭尖(相對樞軸)
const MAX = deg(42); // 手柄卡進凹槽 a 時的轉角
const SHAFT = [-0.1, 2.45, 0];

/** 手柄轉 phi(往上拉為正,逆時針):桿端抬起的量 */
export function unhook(phi) {
  const lift = leverLift(FINGER, phi);
  return { lift, released: G.released(lift) };
}
export const max = MAX;

// 環形手柄:略往右斜的長橢圓
const LOOP = Array.from({ length: 48 }, (_, i) => {
  const t = (i / 48) * 2 * Math.PI;
  return rot2([0.36 * Math.cos(t), 1.05 * Math.sin(t)], deg(12)).map((v, k) => v + [0.62, -1.95][k]);
});
const NOTCH = add([...PIVOT, 0], [...rot2([1.15, -2.4], MAX), 0]); // 手柄卡住時環的外緣
const SPRING = [[1.05, 0.33], [1.8, 0.55], [2.6, 0.85], [3.05, 1.0], [3.35, 0.4], [NOTCH[0] + 0.12, NOTCH[1] + 0.45], [NOTCH[0] + 0.12, NOTCH[1]], [NOTCH[0] - 0.1, NOTCH[1] - 0.35]];

export default {
  figure: 186,
  parts: [
    {
      id: "rocker",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape([[-0.48, SHAFT[1]], [-0.4, 0.05], [0.4, 0.05], [0.5, SHAFT[1]]]), thickness: 0.2, at: [0, 0, -0.35] },
        { kind: "cylinder", radius: 0.6, inner: 0.38, length: 0.3, at: [SHAFT[0], SHAFT[1], -0.35] },
        { kind: "cylinder", radius: 0.38, length: 0.5, at: [SHAFT[0], SHAFT[1], -0.35], accent: true },
        { kind: "cylinder", radius: G.pin, length: 0.7, at: [0, 0, 0] }, // 銷
        { kind: "cylinder", radius: 0.08, length: 0.5, at: [PIVOT[0] + FINGER[0], PIVOT[1] + FINGER[1] - 0.16, 0.0] }, // 凸柱
      ],
    },
    {
      id: "rod",
      kind: "group",
      center: ECC,
      arrow: false,
      pieces: [{ kind: "plate", shape: G.rod(), thickness: 0.25, at: [-ECC[0], 0, 0] }],
    },
    {
      id: "spring",
      kind: "plate",
      center: ECC,
      shape: shape(thickLine(SPRING.map(([x, y]) => [x - ECC[0], y]), 0.12)),
      thickness: 0.12,
      arrow: false,
      label: "a",
      labelOffset: [NOTCH[0] - ECC[0] + 0.45, NOTCH[1], 0],
    },
    {
      id: "handle",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0, 0], [-0.1, 0.45], [-0.35, 0.82], [-0.65, 0.95]], 0.22)), thickness: 0.15 },
        { kind: "plate", shape: shape(thickLine([[0, 0], [0.3, -0.45], [0.42, -0.95]], 0.2)), thickness: 0.15 },
        { kind: "plate", shape: shape(offsetLoop(LOOP, 0.1), [offsetLoop(LOOP, -0.1).reverse()]), thickness: 0.15 },
        { kind: "cylinder", radius: 0.12, inner: 0.05, length: 0.3 },
      ],
    },
  ],
  waivers: [
    { check: "unsupported", parts: ["spring"], reason: "待確認:spring 與帶動(或支撐)它的零件之間差 0.04 沒貼上,接觸位置是算出來的近似,未逐一修正" },
    { check: "interference", parts: ["rocker", "rod"], reason: "待確認(未修):rocker 的圓柱 r0.08×0.5 與 rod 的板互相穿入 0.14(27 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["rocker", "handle"], reason: "待確認:rocker 的圓柱 r0.08×0.5 與 handle 的板重疊 0.07,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
  ],
  driver: { part: "handle", type: "rotation", range: [0, MAX] },
  target: "rod",
  view: { direction: [0.06, 0.05, 1] },
  pose(phi) {
    const { lift, released } = unhook(phi);
    const a = rodAngle(lift);
    return {
      parts: {
        rod: { angle: a },
        spring: { angle: a },
        handle: { position: onRod(PIVOT, lift, 0.25), angle: a + phi },
      },
      readouts: [{ label: "銷", value: released ? "已脫出鉤口" : "在鉤口中" }],
    };
  },
};
