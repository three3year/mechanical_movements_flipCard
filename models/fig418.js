// 第 418 種:Buchanan & Righter 的專利滑閥機構。閥 A 接在桿 B 的下端,在閥座上水平滑動;桿 B 的上端接在一根銷上,
// 銷在垂直的溝槽裡滑動;桿上另裝一個滾子 C,在兩個懸掛的、可上下調整的弧形件 D 之間滑動。
// 這樣配置是為了不讓閥被蒸汽壓力過度壓在閥座上,減輕摩擦(閥與桿的重量、蒸汽的壓力由弧形件承擔)。
// 主動件是桿 B(隨閥的往復擺動;原圖沒畫閥桿)。
// 桿 B 的下端直接以銷鉸在閥 A 頂上的耳座(銷只水平移),上端的銷在垂直溝裡上下滑——桿 B 就是一支橢圓規;
// 滾子 C 在桿的中點,它的軌跡是以「閥銷那條水平線上、溝槽正下方那一點」為圓心、半桿長為半徑的圓弧,
// 弧形溝就照這個圓心開(中間高、兩端低,和原圖與 507movements 的動畫一樣),滾子靠在溝的下緣滾。
// 推斷:吊架(上端銷的溝槽塊、兩根側臂、開弧形溝的弧形板)是一件,由頂上的螺桿吊在閥室的頂蓋下,
// 可以上下調整;閥室外殼(剖面)往下接到閥座。
import { deg, swing } from "./kit.js";
import { shape, thickLine, arcPoints, rect, circle, stadium } from "./shapes.js";
import { signedArea } from "./contact.js";

export const SEAT_Y = -0.81; // 閥 A 的銷的高度(閥座頂在它下面 0.44)
export const ROD = 2.5; // 桿 B 兩個銷的距離
export const SWING = deg(12);
export const ROLLER_R = 0.12;
export const ARC_CENTER = [0, SEAT_Y, 0]; // 弧形溝的圓心
const R = ROD / 2; // 滾子中心走的圓弧半徑
export const SLOT = [R - ROLLER_R, R + ROLLER_R + 0.03]; // 弧形溝的下緣、上緣半徑:滾子貼著下緣滾,上緣留 0.03
export const SLOT_SPAN = deg(24); // 弧形溝從正上方往兩邊各張開的角
const BAND_SPAN = deg(30);
const HEAD_Y = SEAT_Y + (ROD * (1 + Math.cos(SWING))) / 2; // 上端的銷上下滑的中點
const COVER_Y = 2.45;

/** 桿 B 的轉角 phi(從垂直量起,逆時針為正)→ 上端的銷 T、滾子 C、閥的銷 P */
export function linkage(phi) {
  const T = [0, SEAT_Y + ROD * Math.cos(phi), 0];
  const P = [ROD * Math.sin(phi), SEAT_Y, 0];
  const C = [(T[0] + P[0]) / 2, (T[1] + P[1]) / 2, 0];
  return { T, C, P };
}

const ccw = (poly) => (signedArea(poly) > 0 ? poly : [...poly].reverse());
// 弧形板:中心線半徑 r、從正上方往兩邊各張開 span 的弧,寬 w
const arcBand = (r, span, w) => ccw(thickLine(arcPoints(r, Math.PI / 2 + span, Math.PI / 2 - span, ARC_CENTER[0], ARC_CENTER[1]), w));
// 桿 B:兩端圓頭、兩端有銷孔的長條,從上端的銷往下垂
const rodShape = (() => {
  const s = stadium(ROD, 0.16, 0.05);
  const down = (loop) => loop.map(([x, y]) => [y, -x]);
  return { outline: down(s.outline), holes: s.holes.map(down) };
})();
// 閥頂上的耳座:半圓頭、帶銷孔,根部伸進閥體
const lug = shape([...arcPoints(0.14, 0, Math.PI), [-0.14, -0.25], [0.14, -0.25]], [circle(0.065).reverse()]);
const leg = (side) => thickLine([[side * 2.1, -1.25], [side * 1.95, -1.25], [side * 1.25, COVER_Y]], 0.16);

export default {
  figure: 418,
  parts: [
    {
      id: "chest",
      kind: "group",
      pieces: [
        // 閥室外殼(剖面):兩側的壁往下接到閥座,頂蓋橫過兩壁、中央開孔讓吊架的螺桿穿過
        { kind: "plate", shape: shape(ccw(leg(-1))), thickness: 0.7 },
        { kind: "plate", shape: shape(ccw(leg(1))), thickness: 0.7 },
        { kind: "plate", shape: shape(rect(2.66, 0.7), [circle(0.07, 0, 0.12).reverse()]), thickness: 0.16, axis: [0, 1, 0], at: [0, COVER_Y, 0] }, // 沿 y 擠出:局部 y 是世界 −z,孔在螺桿那一層(z −0.12)
        // 閥座與兩個汽口
        { kind: "box", size: [4.6, 0.3, 0.9], at: [0, -1.4, 0] },
        { kind: "box", size: [0.25, 0.3, 0.92], at: [-0.55, -1.4, 0] },
        { kind: "box", size: [0.25, 0.3, 0.92], at: [0.55, -1.4, 0] },
      ],
    },
    {
      // 吊架(推斷是一件):溝槽塊在桿後面、弧形板在滾子那一層,兩根側臂跨過兩層;螺桿穿過頂蓋,螺帽坐在蓋上
      id: "hanger",
      kind: "group",
      label: "D",
      labelOffset: [0.85, 0.05, 0.3],
      pieces: [
        { kind: "plate", shape: shape(rect(1.3, 0.7, 0, HEAD_Y), [rect(0.13, 0.46, 0, HEAD_Y).reverse()]), thickness: 0.1, at: [0, 0, -0.12] }, // 上端銷的垂直溝槽
        { kind: "cylinder", radius: 0.05, length: 0.95, axis: [0, 1, 0], at: [0, HEAD_Y + 0.35 + 0.475, -0.12] }, // 螺桿
        { kind: "box", size: [0.3, 0.1, 0.12], at: [0, COVER_Y + 0.08 + 0.07, -0.12], accent: true }, // 螺帽(調高低)
        ...[-1, 1].map((side) => ({ kind: "box", size: [0.1, 1.75, 0.37], at: [side * 0.6, HEAD_Y + 0.35 - 1.75 / 2, 0.015] })), // 側臂
        { kind: "plate", shape: shape(arcBand(R, BAND_SPAN, 0.5), [[...arcBand((SLOT[0] + SLOT[1]) / 2, SLOT_SPAN, SLOT[1] - SLOT[0])].reverse()]), thickness: 0.08, at: [0, 0, 0.16] }, // 弧形板:中間開弧形溝,溝的上下緣就是兩個弧形件
      ],
    },
    {
      id: "rod",
      kind: "group",
      label: "B",
      labelOffset: [0.25, -0.75, 0.2],
      arrow: false,
      pieces: [
        { kind: "plate", shape: rodShape, thickness: 0.06, at: [0, 0, 0.05] },
        { kind: "cylinder", radius: 0.06, length: 0.4, at: [0, 0, 0] }, // 上端的銷:往後伸進溝槽塊
        { kind: "cylinder", radius: 0.06, length: 0.34, at: [0, -ROD, 0.05] }, // 下端的銷:穿過閥的兩片耳座
        { kind: "cylinder", radius: 0.04, length: 0.3, at: [0, -ROD / 2, 0.13] }, // 滾子的軸
      ],
    },
    { id: "roller", kind: "pulley", style: "disc", radius: ROLLER_R, width: 0.08, label: "C", labelOffset: [-0.3, 0.1, 0.3], arrow: false },
    {
      id: "valve",
      kind: "group",
      label: "A",
      labelOffset: [0, -0.2, 0.5],
      pieces: [
        { kind: "box", size: [0.95, 0.32, 0.8], at: [0, -0.28, 0] }, // 頂面在銷下面 0.12,讓桿 B 的圓頭轉得過去;底面坐在閥座上
        { kind: "plate", shape: lug, thickness: 0.1, at: [0, 0, -0.05] }, // 耳座(桿 B 的下端夾在兩片之間)
        { kind: "plate", shape: lug, thickness: 0.1, at: [0, 0, 0.15] },
      ],
    },
  ],
  driver: { part: "rod", type: "rotation", cycle: [-SWING, SWING], initial: SWING },
  target: "valve",
  view: { direction: [0.03, 0.05, 1] },
  pose(v) {
    const phi = swing(v, -SWING, SWING);
    const { T, C, P } = linkage(phi);
    return {
      parts: {
        rod: { position: T, angle: phi },
        // 滾子貼著弧形溝的下緣滾(不打滑):中心繞弧心轉 −phi,自轉 R/r 倍
        roller: { position: [C[0], C[1], 0.16], angle: (-R / ROLLER_R) * phi },
        valve: { position: [P[0], SEAT_Y, 0] },
      },
      readouts: [{ label: "閥 A 的位置", value: P[0].toFixed(2) }],
    };
  },
};
