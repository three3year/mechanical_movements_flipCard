// 第 101 種:懸掛在頂部的振動開槽桿,槽裡套著水平桿上的銷;開槽桿來回擺動時,水平桿在兩個導座之間直線往復。
// 銷落在開槽桿的直線與水平桿的交點:水平位移 = 懸掛點到水平桿的距離 × tan(擺角)。主動件是開槽桿。
import { deg } from "./kit.js";
import { shape, circle, stadium } from "./shapes.js";

const PIVOT = [-0.85, 1.65, 0.25];
const BAR_Y = 0;
const DROP = PIVOT[1] - BAR_Y;
const REST = deg(25); // 原圖:桿往右下斜(從直下方逆時針量起)
const RANGE = [deg(-10), deg(38)];

/** 開槽桿擺到 psi(從直下方量起,逆時針為正):銷(水平桿)的水平位置 */
export const pinX = (psi) => PIVOT[0] + DROP * Math.tan(psi);

// 開槽桿的局部座標:原點在懸掛點,桿沿局部 −y 往下;繪圖層的轉角 = psi
const along = (pts, dy) => pts.map(([x, y]) => [y, -x + dy]);

export default {
  figure: 101,
  parts: [
    {
      id: "lever",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        // 桿身分兩段:懸掛點到槽的上端、槽的下端往下
        { kind: "plate", shape: shape(along(stadium(DROP - 0.65, 0.26).outline, 0), [circle(0.09).reverse()]), thickness: 0.1 },
        { kind: "plate", shape: shape(along(stadium(1.6, 0.2).outline, -DROP - 0.6)), thickness: 0.1 },
        {
          kind: "plate",
          shape: shape(along(stadium(1.5, 0.58).outline, -DROP + 0.75), [along(stadium(1.2, 0.24).outline, -DROP + 0.6).reverse()]),
          thickness: 0.12,
        },
        { kind: "cylinder", radius: 0.2, inner: 0.1, length: 0.2 },
      ],
    },
    {
      id: "bar",
      kind: "group",
      pieces: [
        { kind: "box", size: [6.0, 0.36, 0.16], at: [0, 0, 0] },
        { kind: "cylinder", radius: 0.08, length: 0.5, at: [0, 0, 0.2], accent: true },
      ],
    },
    {
      id: "fixed",
      kind: "group",
      pieces: [
        { kind: "box", size: [3.8, 0.12, 0.6], at: [-0.4, PIVOT[1] + 0.25, 0] },
        { kind: "box", size: [0.4, 0.25, 0.2], at: [PIVOT[0], PIVOT[1] + 0.12, 0.2] },
        ...[-2.6, 1.4].map((x) => ({
          kind: "plate",
          shape: shape([[-0.25, -0.62], [0.25, -0.62], [0.25, 0.62], [-0.25, 0.62]], [circle(0.07, 0, 0.38).reverse(), circle(0.07, 0, -0.38).reverse()]),
          thickness: 0.12,
          at: [x, BAR_Y, 0.25],
        })),
      ],
    },
  ],
  driver: { part: "lever", type: "rotation", range: RANGE, initial: REST },
  view: { direction: [0.06, 0.05, 1], fit: ["lever", "fixed"] },
  pose(psi) {
    // 水平桿的中心比銷偏左,讓銷大致落在桿的中段
    return { parts: { lever: { angle: psi }, bar: { position: [pinX(psi), BAR_Y, 0] } }, readouts: [] };
  },
};
