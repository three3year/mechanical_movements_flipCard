// 第 95 種:直立軸頂端裝著一片斜置的圓盤;軸旋轉時,斜盤把往復直線運動傳給立在它表面上的直立桿。
// 桿端(叉頭上的滾子)始終貼著盤面:盤面在桿所在位置的高度 = 中心高度 + 距離 × tan(傾角) × cos(相位)。
// 軸轉一圈,桿上下往返一次。主動件是直立軸。
import { Y, deg } from "./kit.js";

const TILT = deg(14);
const DISC = { radius: 2.0, thickness: 0.2, height: 0.0 };
const ROD = { x: 1.45, roller: 0.13 };
const START = 0; // 原圖:盤的右端最高(朝向桿)
const GUIDE_Y = [1.25, 2.05]; // 導座的高度:桿(滾子上方 0.4–2.4)上下行程 0.7,始終穿過兩個導座
const POST_X = 2.6; // 支柱立在牆頂,在斜盤之外

/** 軸轉 theta:桿端(滾子中心)的高度 */
export function rodHeight(theta) {
  // 盤面法線繞直立軸轉 theta;盤在 x 方向的斜率 = tan(TILT)·cos(theta + START)
  const slope = Math.tan(TILT) * Math.cos(theta + START);
  return DISC.height + DISC.thickness / 2 + ROD.x * slope + ROD.roller / Math.cos(Math.atan(slope));
}
export const stroke = 2 * ROD.x * Math.tan(TILT);

export default {
  figure: 95,
  parts: [
    {
      id: "shaft",
      kind: "group",
      axis: Y,
      center: [0, DISC.height, 0],
      spin: 0.5,
      spinOffset: -1.6,
      pieces: [
        { kind: "cylinder", radius: 0.22, length: 2.6, at: [0, 0, -1.6] },
        { kind: "lathe", profile: [[0, -0.75], [0.3, -0.75], [0.32, -0.4], [0.62, -0.08], [0, -0.08]] },
        // 斜盤:法線從直立軸往 −x 傾 TILT,盤的 +x 端(朝向桿)最高(局部 z 是直立軸,局部 x 即世界 x)
        { kind: "cylinder", radius: DISC.radius, length: DISC.thickness, axis: [-Math.sin(TILT), 0, Math.cos(TILT)], mark: true },
      ],
    },
    {
      id: "rod",
      kind: "group",
      center: [ROD.x, 1, 0],
      pieces: [
        { kind: "cylinder", radius: ROD.roller, length: 0.12, axis: [0, 0, 1] }, // 滾子窄:盤面朝前後傾斜時兩端才不陷進盤面
        { kind: "box", size: [0.08, 0.3, 0.36], at: [0, 0.2, 0] },
        { kind: "box", size: [0.4, 0.08, 0.36], at: [0, 0.36, 0] },
        { kind: "cylinder", radius: 0.07, length: 2.0, axis: Y, at: [0, 1.4, 0] },
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [3.0, 3.4, 1.6], at: [3.2, -2.4, 0] },
        { kind: "box", size: [1.2, 0.55, 0.7], at: [1.05, -1.25, 0] },
        { kind: "cylinder", radius: 0.32, length: 0.6, axis: Y, at: [0, -1.25, 0] },
        // 直立桿的兩個導座(推斷,原圖只畫出桿):軸套由牆上立起的支柱伸出的臂托著
        ...GUIDE_Y.flatMap((y) => [
          { kind: "cylinder", axis: Y, radius: 0.2, inner: 0.08, length: 0.22, at: [ROD.x, y, 0] },
          { kind: "box", size: [POST_X - ROD.x - 0.1, 0.14, 0.18], at: [(ROD.x + 0.1 + POST_X) / 2, y, 0] },
        ]),
        { kind: "box", size: [0.24, GUIDE_Y[1] + 0.85, 0.24], at: [POST_X, (GUIDE_Y[1] - 0.7) / 2 + 0.07, 0] },
      ],
    },
  ],
  // 動力重演:只推直立軸;直立桿裝在導座的直線滑軌上,靠自重把滾子壓在斜盤上
  replay: {
    free: { rod: { slide: [0, 1, 0] } },
    expect: [
      { at: Math.PI, part: "rod", label: "軸轉半圈,斜盤的低處轉到桿下,桿靠自重落到最低", quote: "斜置的圓盤會將往復直線運動傳遞給置於其表面上的直立桿" },
      { at: 2 * Math.PI, part: "rod", label: "軸轉一圈,斜盤把桿推回最高處" },
    ],
  },
  driver: { part: "shaft", type: "rotation" },
  target: "rod", // 上下往復的直立桿
  view: { direction: [0.05, 0.12, 1], fov: 22 },
  pose(theta) {
    return {
      parts: { shaft: { angle: theta }, rod: { position: [ROD.x, rodHeight(theta), 0] } },
      readouts: [],
    };
  },
};

