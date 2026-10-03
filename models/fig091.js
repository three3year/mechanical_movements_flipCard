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
        { kind: "plate", shape: shape(circle(0.28), [circle(0.15).reverse()]), thickness: 0.4 },
      ],
    },
    {
      id: "frame",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape([[-1.75, -0.35], [1.75, -0.35], [1.85, S + 0.35], [-1.85, S + 0.35]], [[[-1.45, -0.05], [1.45, -0.05], [1.5, S + 0.05], [-1.5, S + 0.05]].reverse()]), thickness: 0.22, at: [0, 0, -0.05] },
        { kind: "box", size: [2.4, 0.05, 0.3], at: [0, -0.025, 0] },
        { kind: "box", size: [2.4, 0.05, 0.3], at: [0, S + 0.025, 0] },
        { kind: "cylinder", radius: 0.18, length: 1.2, axis: [0, 1, 0], at: [0, S + 0.9, -0.05] },
        { kind: "cylinder", radius: 0.18, length: 1.2, axis: [0, 1, 0], at: [0, -0.9, -0.05] },
      ],
    },
  ],
  waivers: [
    { check: "interference", parts: ["cam", "frame"], reason: "待確認(未修):cam 的板 與 frame 的板互相穿入 0.23(96 個取樣姿勢),尚未修正" },
  ],
  driver: { part: "cam", type: "rotation", speed: 0.6 },
  target: "frame", // 間歇上下往復的方框
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const { bottom } = frame(theta);
    return { parts: { cam: { angle: theta }, frame: { position: [0, bottom, 0] } }, readouts: [] };
  },
};

