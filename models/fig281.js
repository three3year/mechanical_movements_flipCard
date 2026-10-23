// 第 281 種:圓盤正面刻有一道心形的凹槽,右側槓桿上的銷伸進槽裡;圓盤轉動時,槽推著銷,
// 槓桿繞上端的樞軸來回擺動。主動件是圓盤。
// 照原圖:槓桿從右上的樞軸往右下斜、在圓盤右緣跨過盤面,跨過處有一個半圓凸起,銷就裝在凸起上伸進槽裡
// (心形槽的最外側正好碰到凸起);原圖從樞軸往左下的那根桿是槓桿的支柱——露在圓盤上方的一段是實線、
// 圓盤後面的一段是虛線(藏在後面的零件),下端落在底座上。
// 推斷:槽的形狀照心形凸輪的作法:槓桿以等角速度擺過去、再擺回來(圓盤每轉一圈一個來回);
// 槽是銷在圓盤上走過的軌跡(由槓桿的運動反推),所以銷始終在槽裡。樞軸銷從支柱頂端往前穿過槓桿的孔。
import { TAU, deg, rot2, sub } from "./kit.js";
import { shape, circle, offsetLoop, roundEnd, thickLine } from "./shapes.js";

export const DISC = { center: [-0.45, 0.05, 0], radius: 1.75 };
export const PIVOT = [0.95, 2.4, 0]; // 槓桿上端的樞軸
const ARM = 2.2; // 樞軸到銷的距離
const MID = deg(-100); // 「樞軸→銷」方向擺動的中間角度
const SWING = deg(13.5); // 擺幅(單邊):銷離盤心 0.88R(槽的最外側)到 0.36R(心形的凹口)
const LEVER = 4.5;
export const BAR = deg(4.5); // 槓桿本身相對「樞軸→銷」方向的角度:銷在槓桿靠圓盤那一側的凸起上
const BASE_TOP = -2.325; // 底座頂面

/** 圓盤轉 theta:槓桿角度(等速往返,心形凸輪);主動量 0 時照原圖,銷在槽的最外側、槓桿在最右 */
export function lever(theta) {
  const f = ((theta / TAU) % 1 + 1) % 1;
  const tri = f < 0.5 ? 1 - 4 * f : 4 * f - 3; // 1 → −1 → 1
  return MID + SWING * tri;
}
const pinAt = (theta) => {
  const a = lever(theta);
  return [PIVOT[0] + ARM * Math.cos(a), PIVOT[1] + ARM * Math.sin(a), 0];
};

// 槽:銷在圓盤座標中的軌跡(圓盤轉 theta 時,把銷的世界位置轉回 −theta)
export const GROOVE = Array.from({ length: 240 }, (_, i) => {
  const theta = (i / 240) * TAU;
  const p = sub(pinAt(theta), DISC.center);
  return rot2([p[0], p[1]], -theta);
});
export { pinAt };
const CCW = [...GROOVE].reverse(); // 槽的軌跡是順時針的;畫槽壁時轉成逆時針

// 支柱:從底座(圓盤後面)斜立到樞軸,頂端略過樞軸
const STRUT_FOOT = [-0.3, BASE_TOP];
const STRUT_DIR = (() => {
  const d = [PIVOT[0] - STRUT_FOOT[0], PIVOT[1] - STRUT_FOOT[1]];
  const n = Math.hypot(...d);
  return [d[0] / n, d[1] / n];
})();
const PIN_AT = [ARM, 0]; // 銷在槓桿局部座標(x 沿「樞軸→銷」)

export default {
  figure: 281,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [4.6, 0.25, 0.9], at: [0, -2.45, 0] },
        { kind: "plate", shape: shape(thickLine([[-1.8, -2.3], [DISC.center[0], DISC.center[1]], [0.9, -2.3]], 0.22)), thickness: 0.2, at: [0, 0, -0.45] },
        // 槓桿的支柱(原圖的虛線):在圓盤後面,從底座斜立到樞軸
        {
          kind: "plate",
          shape: shape(thickLine([STRUT_FOOT, [STRUT_FOOT[0], STRUT_FOOT[1] + 0.15], [PIVOT[0] + 0.1 * STRUT_DIR[0], PIVOT[1] + 0.1 * STRUT_DIR[1]]], 0.2)),
          thickness: 0.2,
          at: [0, 0, -0.45],
        },
        { kind: "plate", shape: shape(circle(0.15, PIVOT[0], PIVOT[1])), thickness: 0.2, at: [0, 0, -0.45] }, // 支柱頂端的圓眼
        // 樞軸銷:從支柱往前,在圓盤上緣的外側越過圓盤,穿過槓桿的孔;前端一個銷頭
        { kind: "cylinder", radius: 0.055, length: 0.86, at: [PIVOT[0], PIVOT[1], -0.07] },
        { kind: "cylinder", radius: 0.1, length: 0.06, at: [PIVOT[0], PIVOT[1], 0.35] },
      ],
    },
    {
      id: "disc",
      kind: "plate",
      center: [DISC.center[0], DISC.center[1], -0.15],
      shape: shape(circle(DISC.radius), [circle(0.1).reverse()]),
      thickness: 0.3,
      hub: 0.25,
      mark: [DISC.radius - 0.15, 0],
      markSize: 0.09,
      spin: DISC.radius,
      // 槽:盤面上凸起的兩道槽壁,銷在兩壁之間
      pieces: [
        { kind: "plate", shape: shape(offsetLoop(CCW, 0.16), [offsetLoop(CCW, 0.09).reverse()]), thickness: 0.08, at: [0, 0, 0.18] },
        { kind: "plate", shape: shape(offsetLoop(CCW, -0.09), [offsetLoop(CCW, -0.16).reverse()]), thickness: 0.08, at: [0, 0, 0.18] },
      ],
    },
    {
      id: "lever",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        // 樞軸那端畫成圓頭(半徑取半寬 0.1),樞軸孔四周留一圈肉
        { kind: "plate", shape: shape(roundEnd(thickLine([[0, 0], [LEVER * Math.cos(BAR), LEVER * Math.sin(BAR)]], 0.2), [0, 0], 0.1), [circle(0.06).reverse()]), thickness: 0.12, at: [0, 0, 0.25] },
        // 槓桿跨過盤緣處的半圓凸起(和槓桿同一層、疊在槓桿邊上),銷裝在凸起上往後伸進槽裡
        { kind: "plate", shape: shape(circle(0.15, PIN_AT[0], PIN_AT[1])), thickness: 0.12, at: [0, 0, 0.25] },
        { kind: "cylinder", radius: 0.08, length: 0.22, at: [PIN_AT[0], PIN_AT[1], 0.11], accent: true }, // 銷只伸到槽壁的高度,不陷進盤面
      ],
    },
  ],
  driver: { part: "disc", type: "rotation" },
  target: "lever", // 來回擺動的槓桿
  view: { direction: [0.04, 0.05, 1] },
  pose(theta) {
    return { parts: { disc: { angle: theta }, lever: { angle: lever(theta) } }, readouts: [] };
  },
};
