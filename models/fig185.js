// 第 185 種:機車頭的連桿運動閥門齒輪。曲柄軸(右)上兩個偏心輪,一個前進用、一個後退用;偏心桿往左鉸接在
// 曲面開槽連桿的上下兩端。連桿由左上的手柄經槓桿抬起或降下;槽裡的滑塊高度不動,經搖桿接到閥桿。
// 滑塊在一端時,那個偏心輪的全部行程都傳給閥門(全程進汽);在中間時連桿繞滑塊擺動,閥門靜止;
// 在中間與一端之間(原圖)只得到部分行程,蒸氣口只部分開啟、提早關閉,蒸汽以膨脹方式作動。
// 主動件是曲柄軸;手柄的位置是狀態。偏心桿與連桿的幾何以近似計算(見 link-motion.js)。
import { deg, polar, add } from "./kit.js";
import { linkMotion } from "./link-motion.js";
import { circleCircle } from "./linkage.js";
import { shape, circle, arcPoints } from "./shapes.js";

const SHAFT = [3.0, -0.6, 0];
const ECC = 0.32;
const HALF = 0.85; // 連桿兩端離中心
const ROD = 3.3;
const LEADS = [deg(110), deg(-110)]; // 前進與後退偏心輪(相對曲柄,局部座標)
const motion = linkMotion({ shaft: SHAFT, dir: [-1, 0, 0], ecc: ECC, rod: ROD, half: HALF, leads: LEADS });
const LIFT = { forward: -HALF * 0.92, cutoff: -HALF * 0.45, mid: 0, backward: HALF * 0.92 };
const ROCKER = { pivot: [-0.85, 0.45, 0], down: 0.95, up: 0.9 };
const BLOCK_ROD = 0.85;
const HANDLE = { pivot: [-1.7, 1.15, 0], length: 2.0, arm: 1.2 };
// 手柄轉角:讓手柄短臂端點的高度差等於連桿被移動的量
const handleAngle = (lift) => Math.asin(Math.max(-1, Math.min(1, lift / HANDLE.arm)));

/** 軸轉 theta、手柄在 state:閥的位移(沿 x)與各零件的位置 */
export const gear = (theta, state) => motion(theta, LIFT[state]);
export const states = Object.keys(LIFT);

// 曲面開槽連桿(在局部座標:沿 y 長 2·HALF,弧形)
const linkShape = shape(
  [...arcPoints(3.4, deg(-14), deg(14), -3.4 + 0.18, 0), ...arcPoints(3.4, deg(14), deg(-14), -3.4 - 0.18, 0)].map(([x, y]) => [x, y]),
  [[...arcPoints(3.4, deg(-12), deg(12), -3.4 + 0.07, 0), ...arcPoints(3.4, deg(12), deg(-12), -3.4 - 0.07, 0)].reverse()],
);

const z = (p, d) => [p[0], p[1], d];

export default {
  figure: 185,
  parts: [
    {
      id: "shaft",
      kind: "group",
      center: SHAFT,
      spin: ECC + 0.55,
      pieces: [
        { kind: "cylinder", radius: 0.16, length: 1.4, mark: true },
        { kind: "plate", shape: shape(circle(0.52, ...polar(ECC, LEADS[0] + Math.PI).slice(0, 2)), [circle(0.17).reverse()]), thickness: 0.2, at: [0, 0, 0.3] },
        { kind: "plate", shape: shape(circle(0.52, ...polar(ECC, LEADS[1] + Math.PI).slice(0, 2)), [circle(0.17).reverse()]), thickness: 0.2, at: [0, 0, 0.55] },
      ],
    },
    { id: "rodForward", kind: "link", width: 0.16, thickness: 0.08 },
    { id: "rodBackward", kind: "link", width: 0.16, thickness: 0.08 },
    { id: "link", kind: "plate", shape: linkShape, thickness: 0.12, posed: true, arrow: false },
    { id: "block", kind: "box", size: [0.2, 0.2, 0.2] },
    {
      id: "rocker",
      kind: "group",
      center: ROCKER.pivot,
      arrow: false,
      pieces: [
        { kind: "box", size: [0.12, ROCKER.down + ROCKER.up, 0.08], at: [0, (ROCKER.up - ROCKER.down) / 2, 0] },
        { kind: "cylinder", radius: 0.14, inner: 0.06, length: 0.15 },
      ],
    },
    { id: "blockRod", kind: "link", width: 0.1, thickness: 0.06 },
    // 手柄與吊桿:手柄繞樞軸轉,經吊桿把連桿抬起或降下(吊桿長度隨連桿擺動略變,為示意)
    {
      id: "handle",
      kind: "group",
      center: HANDLE.pivot,
      arrow: false,
      posed: true,
      pieces: [
        { kind: "box", size: [HANDLE.length, 0.12, 0.08], at: [-HANDLE.length / 2, 0, 0] },
        { kind: "box", size: [HANDLE.arm, 0.12, 0.08], at: [HANDLE.arm / 2, 0, 0] },
        { kind: "cylinder", radius: 0.2, inner: 0.08, length: 0.15 },
      ],
    },
    { id: "hanger", kind: "link", width: 0.1, thickness: 0.06, stretch: true },
    { id: "valveRod", kind: "group", pieces: [{ kind: "cylinder", axis: [1, 0, 0], radius: 0.06, length: 1.6, at: [-0.8, 0, 0] }, { kind: "box", size: [0.3, 0.3, 0.3], at: [-1.6, 0, 0] }] },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [1.9, 1.9, 0.6], at: [-2.65, 0.0, -0.4] },
        { kind: "box", size: [3.0, 0.08, 0.6], at: [0.6, 0.25, -0.4] },
        { kind: "plate", shape: shape([...arcPoints(1.4, deg(100), deg(160), -2.6, 0.35), ...arcPoints(1.6, deg(160), deg(100), -2.6, 0.35)]), thickness: 0.1, at: [0, 0, -0.1] },
      ],
    },
  ],
  driver: { part: "shaft", type: "rotation" },
  target: "valveRod",
  states: {
    options: [
      { id: "forward", label: "前進(全程)" },
      { id: "cutoff", label: "前進(膨脹)" },
      { id: "mid", label: "中位(閥不動)" },
      { id: "backward", label: "後退" },
    ],
    initial: "cutoff",
  },
  view: { direction: [0.06, 0.05, 1] },
  pose(theta, state = "cutoff") {
    const g = gear(theta, state);
    const [eF, eB] = g.eccentrics;
    const [aF, aB] = g.ends;
    const mid = [(aF[0] + aB[0]) / 2, (aF[1] + aB[1]) / 2, 0];
    // 滑塊經一根短連桿接到搖桿的下臂:下臂端點在以樞軸為圓心的圓上,與滑塊相距 BLOCK_ROD
    const lower = circleCircle(ROCKER.pivot, ROCKER.down, g.block, BLOCK_ROD, 1).point;
    const swing = Math.atan2(lower[1] - ROCKER.pivot[1], lower[0] - ROCKER.pivot[0]) + Math.PI / 2;
    const upper = add(ROCKER.pivot, polar(ROCKER.up, Math.PI / 2 + swing));
    return {
      parts: {
        shaft: { angle: theta },
        rodForward: { from: z(eF, 0.3), to: z(aF, 0.3) },
        rodBackward: { from: z(eB, 0.55), to: z(aB, 0.55) },
        link: { position: z(mid, 0.4), angle: g.linkAngle - Math.PI / 2 },
        block: { position: z(g.block, 0.4) },
        rocker: { angle: swing },
        blockRod: { from: z(g.block, 0.2), to: z(lower, 0.2) },
        valveRod: { position: z(upper, 0.1) },
        handle: { angle: handleAngle(LIFT[state]) },
        hanger: { from: z(add(HANDLE.pivot, polar(HANDLE.arm, handleAngle(LIFT[state]))), 0.5), to: z(aF, 0.5) },
      },
      readouts: [],
    };
  },
};
