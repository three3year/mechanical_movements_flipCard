// 第 281 種:圓盤正面刻有一道心形的凹槽,右側槓桿(經一個銷架)上的銷伸進槽裡;圓盤轉動時,槽推著銷,
// 槓桿繞上端的樞軸來回振動。主動件是圓盤。
// 推斷:槽的形狀照心形凸輪的作法:槓桿以等角速度擺過去、再擺回來(圓盤每轉一圈一個來回);
// 槽是銷在圓盤上走過的軌跡(由槓桿的運動反推),所以銷始終在槽裡。
import { TAU, deg, rot2, sub } from "./kit.js";
import { shape, circle, offsetLoop, thickLine } from "./shapes.js";

const DISC = { center: [-0.45, 0.05, 0], radius: 1.75 };
const PIVOT = [1.25, 2.15, 0]; // 槓桿上端的樞軸
const ARM = 2.15; // 樞軸到銷的距離
const MID = deg(-118); // 槓桿擺動的中間角度
const SWING = deg(12); // 擺幅(單邊)
const LEVER = 4.4;
const BAR = deg(36); // 槓桿本身相對「樞軸→銷」方向的角度:槓桿從右上往下到右下

/** 圓盤轉 theta:槓桿角度(等速往返,心形凸輪) */
export function lever(theta) {
  const f = ((theta / TAU) % 1 + 1) % 1;
  const tri = f < 0.5 ? 4 * f - 1 : 3 - 4 * f; // −1 → 1 → −1
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

export default {
  figure: 281,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [4.6, 0.25, 0.9], at: [0, -2.45, 0] },
        { kind: "plate", shape: shape(thickLine([[-1.8, -2.3], [DISC.center[0], DISC.center[1]], [0.9, -2.3]], 0.22)), thickness: 0.2, at: [0, 0, -0.45] },
        { kind: "plate", shape: shape(thickLine([[1.6, -2.3], [PIVOT[0], PIVOT[1]]], 0.2)), thickness: 0.2, at: [0, 0, 0.35] },
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
        { kind: "plate", shape: shape(thickLine([[0, 0], [LEVER * Math.cos(BAR), LEVER * Math.sin(BAR)]], 0.2), [circle(0.06).reverse()]), thickness: 0.12, at: [0, 0, 0.25] },
        // 從槓桿伸到圓盤前面的銷架(原圖虛線)與銷
        { kind: "plate", shape: shape(thickLine([[1.9 * Math.cos(BAR), 1.9 * Math.sin(BAR)], [ARM, 0]], 0.12)), thickness: 0.08, at: [0, 0, 0.15] },
        { kind: "cylinder", radius: 0.08, length: 0.35, at: [ARM, 0, 0.05], accent: true },
      ],
    },
  ],
  driver: { part: "disc", type: "rotation" },
  target: "lever", // 來回振動的槓桿
  view: { direction: [0.04, 0.05, 1] },
  pose(theta) {
    return { parts: { disc: { angle: theta }, lever: { angle: lever(theta) } }, readouts: [] };
  },
};
