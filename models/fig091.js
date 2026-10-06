// 第 91 種:三角形偏心輪(勒洛三角形,以三個頂點為圓心、邊長為半徑畫弧),軸在其中一個頂點。
// 方框的上下兩條內邊夾著它:輪的寬度處處相等,所以永遠同時碰到上下邊;
// 輪轉動時方框做間歇性的上下往復——有一段時間停住不動,曾用於法國蒸汽引擎的閥門運動。
// 方框的高度 = 輪在上方的支撐函數(輪上離軸最遠、朝上的那一點),主動件是軸。
import { deg, rot2 } from "./kit.js";
import { arcPoints, shape, circle } from "./shapes.js";

const S = 1.6; // 邊長 = 寬度
// 三個頂點:軸在頂點 0(原點);另兩個頂點在上方
const V = [
  [0, 0],
  [S * Math.cos(deg(60)), S * Math.sin(deg(60))],
  [S * Math.cos(deg(120)), S * Math.sin(deg(120))],
];
const START = 0;
const ROD = 2.6; // 方框上下兩根桿的長度
// 導座的高度:方框從起點(最高)往下走 S 再回來,上下兩根桿始終穿過導座,方框的外緣碰不到導座
const GUIDE_Y = [S + 0.35 + 0.5, -0.35 - 0.5 - S];

// 勒洛三角形:每條邊是以對面頂點為圓心、半徑 S 的弧
const reuleaux = [
  ...arcPoints(S, deg(60), deg(120), V[0][0], V[0][1]),
  ...arcPoints(S, deg(180), deg(240), V[1][0], V[1][1]),
  ...arcPoints(S, deg(300), deg(360), V[2][0], V[2][1]),
];

/** 軸轉 theta:方框下內邊的高度(輪最低點)與上內邊的高度(輪最高點);兩者相差恆為 S */
export function frame(theta) {
  let top = -Infinity;
  let bottom = Infinity;
  for (const p of reuleaux) {
    const y = rot2(p, theta + START)[1];
    top = Math.max(top, y);
    bottom = Math.min(bottom, y);
  }
  return { top, bottom };
}
export const width = S;

export default {
  figure: 91,
  parts: [
    {
      id: "cam",
      kind: "group",
      spin: S,
      pieces: [
        { kind: "plate", shape: shape(reuleaux, [circle(0.15).reverse()]), thickness: 0.3, mark: [0, 1.0], markSize: 0.09 },
        { kind: "plate", shape: shape(circle(0.28), [circle(0.15).reverse()]), thickness: 0.2, at: [0, 0, 0.25] }, // 輪轂在方框前面(軸在輪的頂角,輪轂會超出輪廓)
        { kind: "cylinder", radius: 0.15, length: 0.75, at: [0, 0, 0.55] }, // 軸往前伸進前方的軸承(往後會擋到方框的內邊)
      ],
    },
    {
      id: "frame",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape([[-1.95, -0.35], [1.95, -0.35], [2.05, S + 0.35], [-2.05, S + 0.35]], [[[-1.66, -0.05], [1.66, -0.05], [1.7, S + 0.05], [-1.7, S + 0.05]].reverse()]), thickness: 0.22, at: [0, 0, -0.05] },
        { kind: "box", size: [2.4, 0.05, 0.3], at: [0, -0.025, 0] },
        { kind: "box", size: [2.4, 0.05, 0.3], at: [0, S + 0.025, 0] },
        { kind: "cylinder", radius: 0.18, length: ROD, axis: [0, 1, 0], at: [0, S + 0.35 + ROD / 2, -0.05] },
        { kind: "cylinder", radius: 0.18, length: ROD, axis: [0, 1, 0], at: [0, -0.35 - ROD / 2, -0.05] },
      ],
    },
    {
      // 上下兩根桿的固定導座(推斷,原圖沒畫):軸套由一根立在旁邊的柱子托著
      id: "guides",
      kind: "group",
      pieces: [
        ...GUIDE_Y.flatMap((y) => [
          { kind: "cylinder", axis: [0, 1, 0], radius: 0.32, inner: 0.19, length: 0.3, at: [0, y, -0.05] },
          { kind: "box", size: [2.6, 0.2, 0.2], at: [1.6, y, -0.05] },
        ]),
        { kind: "box", size: [0.3, GUIDE_Y[0] - GUIDE_Y[1] + 0.2, 0.3], at: [2.9, (GUIDE_Y[0] + GUIDE_Y[1]) / 2, -0.05] },
        // 輪軸的軸承在方框前面:軸在輪的頂角,方框的下內邊會碰到輪的頂角,軸不能往後穿過方框
        { kind: "cylinder", radius: 0.3, inner: 0.16, length: 0.2, at: [0, 0, 0.75] },
        { kind: "box", size: [2.6, 0.2, 0.2], at: [1.6, 0, 0.75] },
        { kind: "box", size: [0.3, 0.2, 0.75], at: [2.9, 0, 0.475] },
      ],
    },
  ],
  // 動力重演:只推輪;方框在導座的直線滑軌上,上下兩條內邊同時夾著輪(寬度處處相等)
  replay: {
    free: { frame: { slide: [0, 1, 0] } },
    expect: [
      { at: Math.PI / 3, part: "frame", label: "輪轉 60°,方框被推下一段", quote: "可產生間歇性的往復直線運動" },
      { at: Math.PI, part: "frame", label: "輪轉半圈,方框在最低處" },
      { at: (4 * Math.PI) / 3, part: "frame", label: "輪轉 240°,方框往回走" },
      { at: 2 * Math.PI, part: "frame", label: "輪轉一圈,方框回到最高處" },
    ],
  },
  driver: { part: "cam", type: "rotation", speed: 0.6 },
  target: "frame", // 間歇上下往復的方框
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const { bottom } = frame(theta);
    return { parts: { cam: { angle: theta }, frame: { position: [0, bottom, 0] } }, readouts: [] };
  },
};

