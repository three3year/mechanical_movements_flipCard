// 第 157 種:第 156 種的變形,以一根連桿取代曲柄搖臂上的溝槽。圓盤的曲柄銷經連桿拉動曲柄搖臂的上臂,
// 搖臂繞樞軸擺動,右臂末端帶動往下的桿做變速的交替直線運動。主動件是圓盤。
// 右臂末端沿圓弧擺動,桿要走直線:桿的上段做成一根短連桿,下端接著在兩個導套裡上下滑動的直桿(目標件)。
// 導套、立柱與底板是推斷(原圖只畫到桿的上段)。
import { deg, polar, add, dist } from "./kit.js";
import { circleCircle, angleOf } from "./linkage.js";

const DISC = { center: [-1.6, 0, 0], radius: 1.45, pin: 0.62 };
const PIVOT = [1.55, 0.05, 0.25];
const UP = { length: 1.6, at: deg(98) }; // 上臂(原圖位置)
const RIGHT = { length: 1.55, at: deg(4) }; // 右臂
const START = deg(155);
const PIN0 = add(DISC.center, polar(DISC.pin, START));
const ROD = dist(PIN0, add(PIVOT, polar(UP.length, UP.at)));

const LINK = 1.6; // 往下的短連桿
const SLIDE = { x: 2.35, length: 2.55, guides: [-2.85, -3.4] }; // 直桿(上端接短連桿)與兩個導套的高度
const FLOOR = -5.4;

/** 圓盤轉 theta:曲柄銷、上臂端點、搖臂轉角(相對原圖位置)、右臂末端與直桿上端的高度 */
export function bellCrank(theta) {
  const pin = add(DISC.center, polar(DISC.pin, START + theta));
  const top = circleCircle(PIVOT, UP.length, pin, ROD, -1).point;
  const turn = angleOf(PIVOT, top) - UP.at;
  const end = add(PIVOT, polar(RIGHT.length, RIGHT.at + turn));
  const slide = end[1] - Math.sqrt(LINK * LINK - (end[0] - SLIDE.x) ** 2);
  return { pin, top, turn, end, slide };
}
export const guides = SLIDE.guides;
export const slideLength = SLIDE.length;

const z = (p, d) => [p[0], p[1], d];

export default {
  figure: 157,
  parts: [
    {
      id: "disc",
      kind: "group",
      center: DISC.center,
      spin: DISC.radius,
      pieces: [
        { kind: "plate", shape: { outline: Array.from({ length: 64 }, (_, i) => [DISC.radius * Math.cos((i / 64) * 2 * Math.PI), DISC.radius * Math.sin((i / 64) * 2 * Math.PI)]), holes: [] }, thickness: 0.1, at: [0, 0, -0.2], circles: [0.2] },
        { kind: "cylinder", radius: 0.1, length: 0.55, at: [...polar(DISC.pin, START).slice(0, 2), 0.2], accent: true }, // 曲柄銷:穿過連桿的軸眼
      ],
    },
    {
      id: "crank",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "box", size: [UP.length, 0.26, 0.1], at: [(UP.length / 2) * Math.cos(UP.at), (UP.length / 2) * Math.sin(UP.at), 0], angle: UP.at },
        { kind: "box", size: [RIGHT.length, 0.26, 0.1], at: [(RIGHT.length / 2) * Math.cos(RIGHT.at), (RIGHT.length / 2) * Math.sin(RIGHT.at), 0], angle: RIGHT.at },
        { kind: "cylinder", radius: 0.3, inner: 0.15, length: 0.2 },
        { kind: "cylinder", radius: 0.1, length: 0.4, at: [...polar(UP.length, UP.at).slice(0, 2), 0.1] }, // 上臂端的銷:穿過連桿的軸眼
        { kind: "cylinder", radius: 0.22, inner: 0.1, length: 0.18, at: [...polar(RIGHT.length, RIGHT.at).slice(0, 2), 0] },
      ],
    },
    { id: "link", kind: "link", width: 0.2, thickness: 0.08 },
    // 圓盤的軸與搖臂的樞軸銷(原圖沒畫出支撐,推斷)
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: 0.1, length: 0.5, at: [DISC.center[0], DISC.center[1], -0.3] },
        { kind: "cylinder", radius: 0.14, length: 0.5, at: [PIVOT[0], PIVOT[1], 0.2] },
        { kind: "box", size: [3.6, 0.3, 0.1], at: [0, 0.02, -0.5] },
        { kind: "box", size: [0.3, 0.02 - FLOOR, 0.1], at: [0, (0.02 + FLOOR) / 2, -0.5] }, // 橫樑下的立柱
        // 直桿的兩個導套,由右邊的立柱伸臂托著
        ...SLIDE.guides.flatMap((y) => [
          { kind: "cylinder", axis: [0, 1, 0], radius: 0.22, inner: 0.12, length: 0.2, at: [SLIDE.x, y, 0.4] },
          { kind: "box", size: [0.5, 0.12, 0.12], at: [SLIDE.x + 0.45, y, 0.4] },
        ]),
        { kind: "box", size: [0.2, SLIDE.guides[0] + 0.3 - FLOOR, 0.2], at: [SLIDE.x + 0.78, (SLIDE.guides[0] + 0.3 + FLOOR) / 2, 0.4] },
        { kind: "box", size: [5.4, 0.12, 1.6], at: [0.6, FLOOR - 0.06, -0.1] },
      ],
    },
    { id: "rod", kind: "link", width: 0.18, thickness: 0.1 },
    {
      id: "slide",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.16, SLIDE.length, 0.1], at: [0, -SLIDE.length / 2, 0] },
        { kind: "cylinder", radius: 0.07, length: 0.3, at: [0, 0, 0.1] }, // 接短連桿的銷
      ],
    },
  ],
  driver: { part: "disc", type: "rotation" },
  target: "slide",
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const { pin, top, turn, end, slide } = bellCrank(theta);
    return {
      parts: {
        disc: { angle: theta },
        crank: { angle: turn },
        link: { from: z(pin, 0.4), to: z(top, 0.4) },
        rod: { from: [end[0], end[1], 0.4], to: [SLIDE.x, slide, 0.4] },
        slide: { position: [SLIDE.x, slide, 0.4] },
      },
      readouts: [],
    };
  },
};
