// 第 404 種:另一種弧線繪製儀。一根彈性的拱形桿,兩端的高度是中間的一半,形狀設計成彎到最大時外緣恰好是一段真的圓弧;
// 給定所求圓弧上的三個點,就用中間的螺絲把桿彎到通過這些點,每一端都透過一個小滾子被限制貼靠在下方的直桿上。
// 主動件是螺絲(下面的翼形手柄):轉動它,拱形桿中間被頂高,弧變得更彎。
// 推斷:這是一個靜止的器具,模型重現使用時的動作(調螺絲改變弧的彎度);拱形桿始終彎成一段圓弧(原文說設計成如此)。
// 2026-10-20(model-audit-fixes-4,照原圖與維護者的決定):直桿兩端各釘一根立柱(鉚釘釘在直桿的正面),滾子裝在立柱頂的
// 軸銷上、壓在拱形桿的上面;拱形桿的兩端伸出滾子外往下垂。是三點彎曲:螺絲在中間往上頂,兩個滾子在兩端往下壓。
// 螺絲頂高時桿長不變、在滾子底下滑過(滾子跟著轉):弧越彎,兩個滾子之間的桿身越長、伸出的兩端越往裡縮。
// 簡化:原文「兩端的高度是中間的一半」(變截面讓它彎成真圓弧)——路徑零件的截面是固定的,拱形桿畫成等粗的桿,
// 變截面的效果(彎成真圓弧)直接當成前提;立柱、鉚釘、軸銷是照原圖補的,尺寸推斷。
import { Y, TAU, clamp, screwAdvance } from "./kit.js";
import { shape, rect, arcPoints, circle } from "./shapes.js";

export const PITCH = 0.08;
export const RANGE = [0, 3 * TAU]; // 螺絲轉的角度(轉 3 圈,中間頂高 0.24)
export const BAR_R = 0.07; // 拱形桿的半徑(等粗,見上)
export const ROLLER_R = 0.1;
const XR = 1.5; // 立柱(滾子)離中間的距離
const YR = 0.65; // 滾子軸心的高度(直桿中心為 0)
export const ROLLERS = [[-XR, YR], [XR, YR]];
export const LENGTH = 4.3; // 拱形桿的長(不變)
const FRAME_H = 0.35; // 直桿的高
const FRAME_HALF = 1.85; // 直桿的半長
const PAD_H = 0.1; // 壓塊的高
const TOP0 = 0.62; // 最平時拱形桿中線的最高點(中間)
const Q = BAR_R + ROLLER_R; // 滾子軸心到桿中線的距離(相碰)

/**
 * 螺絲轉 a → 拱形桿(中線)的圓弧:半徑 r、圓心 center;beta 是滾子接觸點離弧頂的角、alpha 是桿端離弧頂的角(半張角);
 * slid 是弧頂到滾子接觸點的桿長(桿在滾子下滑過的量)。
 * 由接觸算:中線的最高點被壓塊頂在 top,圓弧又要和兩個滾子相碰(軸心到中線的距離 = 桿半徑 + 滾子半徑),解出半徑。
 */
export function arch(a0) {
  const a = clamp(a0, ...RANGE);
  const top = TOP0 + screwAdvance(a, PITCH);
  const D = YR - top;
  const r = (XR * XR + D * D - Q * Q) / (2 * (Q - D));
  const center = [0, top - r, 0];
  const beta = Math.atan2(XR, YR - center[1]);
  const alpha = LENGTH / (2 * r);
  return { top, r, center, beta, alpha, slid: r * beta };
}

// 立柱:從直桿的正面往上到滾子軸心,頂端是半圓
const POST_W = 0.2;
const post = () => shape([[-POST_W / 2, -FRAME_H / 2 + 0.05], [POST_W / 2, -FRAME_H / 2 + 0.05], ...arcPoints(POST_W / 2, 0, Math.PI, 0, YR)]);
const POST_Z = FRAME_H / 2 + 0.03; // 立柱板的中心高度(貼在直桿正面,厚 0.06)

export default {
  figure: 404,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 下方的直桿
        { kind: "plate", shape: shape(rect(2 * FRAME_HALF, FRAME_H, 0, 0)), thickness: FRAME_H },
        // 兩端的立柱(釘在直桿正面)、各兩顆鉚釘、頂上的滾子軸銷(從立柱穿到滾子後面)
        ...ROLLERS.flatMap(([x, y]) => [
          { kind: "plate", shape: post(), thickness: 0.06, at: [x, 0, POST_Z] },
          { kind: "cylinder", radius: 0.025, length: 0.02, at: [x, -0.08, POST_Z + 0.04] },
          { kind: "cylinder", radius: 0.025, length: 0.02, at: [x, 0.08, POST_Z + 0.04] },
          { kind: "cylinder", radius: 0.03, length: 0.42, at: [x, y, 0.03] },
        ]),
      ],
    },
    { id: "bar", kind: "rod", radius: BAR_R },
    // 立柱頂的小滾子,壓在拱形桿的上面(軸銷穿過它)
    { id: "rollerL", kind: "cylinder", radius: ROLLER_R, length: 0.24, spin: ROLLER_R, arrow: false, mark: true },
    { id: "rollerR", kind: "cylinder", radius: ROLLER_R, length: 0.24, spin: ROLLER_R, arrow: false, mark: true },
    // 螺絲頂端的壓塊,托著拱形桿的正中(拱形桿是路徑零件,不上目標色,以壓塊代表它被頂高的量;推斷)
    { id: "pad", kind: "box", size: [0.4, PAD_H, 0.3] },
    {
      id: "screw",
      kind: "group",
      axis: Y,
      spin: 0.4,
      pieces: [
        { kind: "worm", radius: 0.1, length: 0.9, pitch: PITCH, thread: 0.03, at: [0, 0, 0.45] },
        // 柄接在螺桿的下端,翼形手柄在柄的下端
        { kind: "cylinder", radius: 0.08, length: 0.35, at: [0, 0, -0.175] },
        { kind: "box", size: [0.7, 0.18, 0.12], at: [0, 0, -0.4], accent: true },
      ],
    },
  ],
  driver: { part: "screw", type: "rotation", range: RANGE, initial: RANGE[1] / 2 },
  target: "pad", // 托著拱形桿正中的壓塊:螺絲把它頂高,弧就更彎
  view: { direction: [0.03, 0.05, 1] },
  pose(a0) {
    const s = arch(a0);
    const points = Array.from({ length: 41 }, (_, i) => {
      const t = Math.PI / 2 - s.alpha + (2 * s.alpha * i) / 40;
      return [s.center[0] + s.r * Math.cos(t), s.center[1] + s.r * Math.sin(t), 0];
    });
    // 滾子跟著桿身轉:桿身往外滑過 slid,右滾子逆時針、左滾子順時針(接觸點在滾子的下方偏內側)
    const roll = s.slid / ROLLER_R;
    return {
      parts: {
        screw: { angle: clamp(a0, ...RANGE), position: [0, s.top - BAR_R - PAD_H - 0.9, 0] },
        pad: { position: [0, s.top - BAR_R - PAD_H / 2, 0] },
        rollerL: { position: [ROLLERS[0][0], ROLLERS[0][1], 0], angle: -roll },
        rollerR: { position: [ROLLERS[1][0], ROLLERS[1][1], 0], angle: roll },
      },
      paths: { bar: { points, closed: false } },
      readouts: [],
    };
  },
};
