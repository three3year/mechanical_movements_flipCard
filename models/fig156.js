// 第 156 種:旋轉圓盤上的曲柄銷在曲柄搖臂(肘節槓桿)長臂的溝槽內作動;搖臂繞下方的樞軸擺動,
// 短臂的末端接著往下的桿,把圓周運動轉換為變速的交替直線運動。主動件是圓盤。
// 短臂的末端沿圓弧擺動,桿要走直線:桿的上段做成一根短連桿,下端接著在兩個導套裡上下滑動的直桿(目標件)。
// 圓盤的軸與軸承座、搖臂的樞軸銷與支座、導套與立柱都是推斷(原圖只畫到桿的上段)。
import { deg, polar, add } from "./kit.js";
import { angleOf } from "./linkage.js";
import { shape, circle, stadium } from "./shapes.js";
import { pedestal } from "./supports.js";

const DISC = { center: [0, 0.6, 0], radius: 1.45, pin: 1.0 };
const PIVOT = [0.75, -1.35, 0.3];
const SHORT = { length: 1.95, at: deg(-90) }; // 短臂相對長臂(局部 +X 沿溝槽)的角度
const START = deg(140); // 原圖:曲柄銷在左上方

const LINK = 1.6; // 短連桿
const SLIDE = { x: 2.9, length: 2.95, guides: [-3.4, -4.0] }; // 直桿(上端接短連桿)與兩個導套的高度
const FLOOR = -6.4;

/** 圓盤轉 theta:搖臂的方向角、短臂末端(接桿處)與直桿上端的高度 */
export function bellCrank(theta) {
  const pin = add(DISC.center, polar(DISC.pin, START + theta));
  const arm = angleOf(PIVOT, pin);
  const end = add(PIVOT, polar(SHORT.length, arm + SHORT.at));
  const slide = end[1] - Math.sqrt(LINK * LINK - (end[0] - SLIDE.x) ** 2);
  return { arm, end, pin, slide };
}
export const guides = SLIDE.guides;
export const slideLength = SLIDE.length;

export default {
  figure: 156,
  parts: [
    {
      id: "disc",
      kind: "group",
      center: DISC.center,
      spin: DISC.radius,
      pieces: [
        { kind: "plate", shape: shape(circle(DISC.radius), [circle(0.1).reverse()]), thickness: 0.1, at: [0, 0, -0.2] },
        { kind: "cylinder", radius: 0.14, length: 0.55, at: [...polar(DISC.pin, START).slice(0, 2), 0.05], accent: true }, // 銷比溝槽窄
        { kind: "cylinder", radius: 0.16, length: 0.3, at: [0, 0, -0.1] },
        { kind: "cylinder", radius: 0.09, length: 0.55, at: [0, 0, -0.45] }, // 軸:往後伸進軸承座
      ],
    },
    {
      id: "crank",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(stadium(3.3, 0.6).outline.map(([x, y]) => [x, y]), [stadium(2.4, 0.3).outline.map(([x, y]) => [x + 0.7, y]).reverse(), circle(0.18).reverse()]), thickness: 0.12 },
        { kind: "plate", shape: shape(stadium(SHORT.length, 0.36).outline, [circle(0.12, SHORT.length, 0).reverse()]), thickness: 0.12, angle: SHORT.at },
        { kind: "cylinder", radius: 0.11, length: 0.3, at: [...polar(SHORT.length, SHORT.at).slice(0, 2), 0.12] }, // 短臂末端的銷:往前穿過短連桿
        { kind: "cylinder", radius: 0.38, inner: 0.18, length: 0.2 },
      ],
    },
    { id: "rod", kind: "link", width: 0.2, thickness: 0.1 },
    {
      id: "slide",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.18, SLIDE.length, 0.12], at: [0, -SLIDE.length / 2, 0] },
        { kind: "cylinder", radius: 0.08, length: 0.3, at: [0, 0, 0.1] }, // 接短連桿的銷
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        ...pedestal({ at: [DISC.center[0], DISC.center[1]], z: -0.6, bore: 0.09, floor: FLOOR }),
        // 搖臂的樞軸銷:從後面的支座伸出,穿過搖臂的軸眼
        { kind: "cylinder", radius: 0.17, length: 1.0, at: [PIVOT[0], PIVOT[1], -0.15] },
        { kind: "box", size: [0.4, PIVOT[1] - FLOOR, 0.3], at: [PIVOT[0], (PIVOT[1] + FLOOR) / 2, -0.6] },
        // 直桿的兩個導套,由右邊的立柱伸臂托著
        ...SLIDE.guides.flatMap((y) => [
          { kind: "cylinder", axis: [0, 1, 0], radius: 0.24, inner: 0.13, length: 0.2, at: [SLIDE.x, y, 0.45] },
          { kind: "box", size: [0.55, 0.12, 0.12], at: [SLIDE.x + 0.5, y, 0.45] },
        ]),
        { kind: "box", size: [0.2, SLIDE.guides[0] + 0.3 - FLOOR, 0.2], at: [SLIDE.x + 0.85, (SLIDE.guides[0] + 0.3 + FLOOR) / 2, 0.45] },
        { kind: "box", size: [5.2, 0.12, 1.6], at: [1.3, FLOOR - 0.06, -0.1] },
      ],
    },
  ],
  driver: { part: "disc", type: "rotation" },
  target: "slide",
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const { arm, end, slide } = bellCrank(theta);
    return {
      parts: {
        disc: { angle: theta },
        crank: { angle: arm },
        rod: { from: [end[0], end[1], 0.45], to: [SLIDE.x, slide, 0.45] },
        slide: { position: [SLIDE.x, slide, 0.45] },
      },
      readouts: [],
    };
  },
};
