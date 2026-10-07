// 第 158 種:踏板的往復曲線運動使圓盤轉動(也可用曲柄取代圓盤)。踏板的右端樞接在支座上,
// 中段經一根短連桿接到圓盤上的曲柄銷。原文的輸入是踏板,主動件是踏板、目標件是圓盤:讀者抓的是踏板,
// 踏板每踩下或抬起一次,圓盤轉半圈;死點靠圓盤的慣性轉過去。主動量取圓盤的相位(driver.cycle 的一程是半圈),
// 播放時圓盤等速轉、踏板跟著上下,經過死點時不會跳。
import { deg, polar, add, dist, wrap } from "./kit.js";
import { circleCircle, angleOf } from "./linkage.js";
import { shape, circle } from "./shapes.js";

const DISC = { center: [0, 1.3, 0], radius: 1.4, pin: 1.0 };
const PIVOT = [2.0, -0.9, 0.3];
const TREADLE = 4.3;
const AT = 2.85; // 連桿接在踏板上離樞軸的距離
const START = deg(205); // 原圖:曲柄銷在左下方
const J0 = add(PIVOT, polar(AT, Math.PI));
const ROD = dist(add(DISC.center, polar(DISC.pin, START)), J0);

/** 圓盤轉 theta:曲柄銷、踏板上的接點與踏板的轉角(從樞軸指向左端) */
export function treadle(theta) {
  const pin = add(DISC.center, polar(DISC.pin, START + theta));
  const j = circleCircle(PIVOT, AT, pin, ROD, 1).point;
  return { pin, j, angle: wrap(angleOf(PIVOT, j)) }; // 踏板朝左,轉角在 π 附近(取 0–2π 才連續)
}

const z = (p, d) => [p[0], p[1], d];

/** 主動量 v:圓盤的轉角(起點是原圖的位置,曲柄銷在左下方) */
export const discAngle = (v) => v;

export default {
  figure: 158,
  parts: [
    {
      id: "disc",
      kind: "group",
      center: DISC.center,
      spin: DISC.radius,
      pieces: [
        { kind: "plate", shape: shape(circle(DISC.radius), [circle(0.12).reverse()]), thickness: 0.15, circles: [0.28] },
        { kind: "cylinder", radius: 0.15, length: 0.5, at: [...polar(DISC.pin, START).slice(0, 2), 0.25], accent: true },
      ],
    },
    {
      id: "treadle",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [{ kind: "box", size: [TREADLE, 0.16, 0.2], at: [TREADLE / 2, 0, 0] }, { kind: "cylinder", radius: 0.14, length: 0.3 }],
    },
    { id: "rod", kind: "link", width: 0.14, thickness: 0.08 },
    {
      id: "stand",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape([[-0.85, -2.46], [0.85, -2.46], [0.4, -0.85], [0.35, 1.3], [0, 1.6], [-0.35, 1.3], [-0.4, -0.85]]), thickness: 0.3, at: [0, 0, -0.35] },
        { kind: "plate", shape: shape([[1.7, -2.46], [2.4, -2.46], [2.35, -0.75], [2.0, -0.55], [1.7, -0.75]]), thickness: 0.3, at: [0, 0, 0.1] },
        { kind: "box", size: [5.8, 0.08, 1.4], at: [0.4, -2.5, 0] }, // 地板在踏板踩到底的下方
        { kind: "cylinder", radius: 0.1, length: 0.6, at: [DISC.center[0], DISC.center[1], -0.1] }, // 圓盤的軸,固定在支架上(原圖只畫出軸孔)
      ],
    },
  ],
  driver: { part: "treadle", type: "rotation", cycle: [0, Math.PI] },
  target: "disc", // 踏板踩動的目的:讓圓盤轉
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const theta = discAngle(v);
    const { pin, j, angle } = treadle(theta);
    return {
      parts: { disc: { angle: theta }, treadle: { angle }, rod: { from: z(pin, 0.4), to: z(j, 0.4) } },
      readouts: [],
    };
  },
};
