// 第 185 種:機車頭的連桿運動閥門齒輪。曲柄軸(右)上兩個偏心輪,一個前進用、一個後退用;偏心桿往左鉸接在
// 曲面開槽連桿的上下兩端。連桿由左上的手柄經槓桿抬起或降下;槽裡的滑塊高度不動,經搖桿接到閥桿。
// 滑塊在一端時,那個偏心輪的全部行程都傳給閥門(全程進汽);在中間時連桿繞滑塊擺動,閥門靜止;
// 在中間與一端之間(原圖)只得到部分行程,蒸氣口只部分開啟、提早關閉,蒸汽以膨脹方式作動。
// 主動件是曲柄軸;手柄的位置是狀態。偏心桿與連桿的幾何以近似計算(見 link-motion.js)。
// 偏心桿的右端是套在偏心輪外面的偏心環(原圖:兩個偏心輪外各有一圈,兩根桿從環上伸出),不是接在偏心輪的中心,
// 所以曲柄軸可以整根穿過兩個偏心輪(同第 171 種)。
import { deg, polar, add } from "./kit.js";
import { linkMotion, eccentricStrap } from "./link-motion.js";
import { circleCircle } from "./linkage.js";
import { shape, circle, arcPoints } from "./shapes.js";

const SHAFT = [3.0, -0.6, 0];
const ECC = 0.32;
const DISC_R = 0.52; // 偏心輪半徑
const DISC_Z = [0.425, 0.69]; // 前進、後退偏心輪(與各自的偏心環、偏心桿)的深度;連桿(0.49–0.63)在兩者之間
const HALF = 0.85; // 連桿兩端離中心
const ROD = 3.3;
const LEADS = [deg(110), deg(-110)]; // 前進與後退偏心輪(相對曲柄,局部座標)
const motion = linkMotion({ shaft: SHAFT, dir: [-1, 0, 0], ecc: ECC, rod: ROD, half: HALF, leads: LEADS });
const LIFT = { forward: -HALF * 0.8, cutoff: -HALF * 0.45, mid: 0, backward: HALF * 0.8 }; // 全程時滑塊離連桿端頭留一點距離(不碰偏心桿的端頭)
const ROCKER = { pivot: [-0.85, 0.45, 0.13], down: 0.95, up: 0.9 };
const BLOCK_ROD = 0.85;
const HANDLE = { pivot: [-1.7, 1.15, 0], length: 2.0, arm: 1.2 };
// 吊桿長度固定:手柄短臂的端點在以樞軸為圓心的圓上、與連桿上端相距 HANGER。
// 連桿的升降是近似算的(見 link-motion.js),它上端的高度隨偏心桿略有起伏;差額由手柄的微小擺動吸收
// (實物的手柄卡在扇形板的缺口裡不動,起伏由連桿自己的擺動吸收)
const HANGER = 2.9;
const handleEnd = (p) => circleCircle(HANDLE.pivot, HANDLE.arm, p, HANGER, 1).point;

/** 軸轉 theta、手柄在 state:閥的位移(沿 x)與各零件的位置 */
export const gear = (theta, state) => motion(theta, LIFT[state]);
export const states = Object.keys(LIFT);

// 曲面開槽連桿(在局部座標:沿 y 長 2·HALF,弧形)
// 連桿畫成直的(原圖略彎):滑塊的位置是在連桿兩端之間直線內插的,槽是直的才對得上
const linkShape = shape(
  [[-0.18, -1.05], [0.18, -1.05], [0.18, 1.05], [-0.18, 1.05]],
  [[[-0.07, -0.98], [0.07, -0.98], [0.07, 0.98], [-0.07, 0.98]].reverse()],
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
        { kind: "cylinder", radius: 0.16, length: 1.3, at: [0, 0, 0.2], mark: true }, // 曲柄軸整根穿過兩個偏心輪
        ...LEADS.map((lead, i) => ({ kind: "plate", shape: shape(circle(DISC_R, ...polar(ECC, lead + Math.PI).slice(0, 2)), [circle(0.17).reverse()]), thickness: 0.18, at: [0, 0, DISC_Z[i]] })),
      ],
    },
    eccentricStrap({ id: "rodForward", disc: DISC_R, rod: ROD, pinZ: 0.42 - DISC_Z[0], pin: 0.12 }), // 銷往前頂到連桿的背面
    eccentricStrap({ id: "rodBackward", disc: DISC_R, rod: ROD, pinZ: 0.7 - DISC_Z[1], pin: 0.12 }), // 銷往後頂到連桿的正面
    { id: "link", kind: "plate", shape: linkShape, thickness: 0.14, posed: true, arrow: false },
    { id: "block", kind: "cylinder", radius: 0.06, length: 0.5 }, // 滑塊畫成一根在連桿槽裡滑的銷,往後伸到滑塊桿那一層
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
    // 手柄與吊桿:手柄繞樞軸轉,經吊桿把連桿抬起或降下
    {
      id: "handle",
      kind: "group",
      center: HANDLE.pivot,
      arrow: false,
      posed: true,
      pieces: [
        { kind: "box", size: [HANDLE.length, 0.12, 0.08], at: [-HANDLE.length / 2, 0, 0] },
        // 短臂在最前面一層(經一根軸接到後面的手柄):吊桿掛在它的前面,不掃過搖桿、閥桿與連桿
        { kind: "box", size: [HANDLE.arm, 0.12, 0.08], at: [HANDLE.arm / 2, 0, 0.76] },
        { kind: "cylinder", radius: 0.06, length: 0.78, at: [0, 0, 0.41] },
        { kind: "cylinder", radius: 0.2, inner: 0.08, length: 0.15 },
      ],
    },
    { id: "hanger", kind: "link", width: 0.1, thickness: 0.06 },
    { id: "hangerPin", kind: "cylinder", radius: 0.018, length: 0.31 }, // 連桿上端的細銷往前伸到吊桿那一層(推斷)
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
    // 吊桿掛在連桿上的點:連桿板靠前進偏心桿那一端、槽旁邊的邊條上(銷固定在連桿上,不擋住槽裡的滑塊)
    const hung = [1, -1].map((s) => [mid[0] + s * (HALF - 0.12) * Math.cos(g.linkAngle) - 0.125 * Math.sin(g.linkAngle), mid[1] + s * (HALF - 0.12) * Math.sin(g.linkAngle) + 0.125 * Math.cos(g.linkAngle)]).sort((p, q) => Math.hypot(p[0] - aF[0], p[1] - aF[1]) - Math.hypot(q[0] - aF[0], q[1] - aF[1]))[0];
    const top = handleEnd(hung);
    // 滑塊經一根短連桿接到搖桿的下臂:下臂端點在以樞軸為圓心的圓上,與滑塊相距 BLOCK_ROD
    const lower = circleCircle(ROCKER.pivot, ROCKER.down, g.block, BLOCK_ROD, 1).point;
    const swing = Math.atan2(lower[1] - ROCKER.pivot[1], lower[0] - ROCKER.pivot[0]) + Math.PI / 2;
    const upper = add(ROCKER.pivot, polar(ROCKER.up, Math.PI / 2 + swing));
    return {
      parts: {
        shaft: { angle: theta },
        // 由後往前:搖臂、滑塊桿與閥桿、前進偏心桿、連桿、後退偏心桿
        rodForward: { from: z(eF, DISC_Z[0]), to: z(aF, DISC_Z[0]) },
        rodBackward: { from: z(eB, DISC_Z[1]), to: z(aB, DISC_Z[1]) },
        link: { position: z(mid, 0.56), angle: g.linkAngle - Math.PI / 2 },
        block: { position: z(g.block, 0.42) },
        rocker: { angle: swing },
        blockRod: { from: z(g.block, 0.2), to: z(lower, 0.2) },
        valveRod: { position: z(upper, 0.23) },
        handle: { angle: Math.atan2(top[1] - HANDLE.pivot[1], top[0] - HANDLE.pivot[0]) },
        hanger: { from: z(top, 0.84), to: z(hung, 0.84) },
        hangerPin: { position: z(hung, 0.715) },
      },
      readouts: [],
    };
  },
};
