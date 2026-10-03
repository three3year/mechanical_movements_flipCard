// 第 347 種:碟形引擎(剖面圖)。碟形活塞從側面看,就像一枚旋轉的硬幣剛落下時那樣擺盪(章動):碟片的法線
// 繞汽缸軸畫圓錐,而碟片本身不轉。碟片裝在活塞桿的球上,球在汽缸兩端的同心座裡;活塞桿穿出汽缸,左端接在
// 左側軸端的曲柄臂(飛輪)上。汽缸的兩端是圓錐形,蒸汽交替地從活塞兩側引入。
// 主動件是虛擬的「進程」(蒸汽推動);進汽以流體示意。
// 推斷:碟片的傾角、活塞桿與曲柄的尺寸;進汽的時機(哪一半邊被碟片壓下,就由另一側進汽)。
import { X, TAU, deg, quatFromZ } from "./kit.js";
import { stream } from "./flow.js";
import { backHalf } from "./section.js";
import { shape, circle, thickLine } from "./shapes.js";

const C = [0.7, 0, 0]; // 球心(汽缸中心)
const R_CYL = 1.65;
const TILT = deg(22); // 碟片法線(活塞桿)與汽缸軸的夾角
const ROD = 2.6; // 球心到活塞桿左端
const SHAFT_X = C[0] - ROD * Math.cos(TILT);
const ARM = ROD * Math.sin(TILT); // 曲柄臂長

/** 進程 p → 曲柄角、活塞桿的方向(從球心指向曲柄銷)與曲柄銷位置 */
export function disk(p) {
  const phi = deg(110) - TAU * p;
  const dir = [-Math.cos(TILT), Math.sin(TILT) * Math.cos(phi), Math.sin(TILT) * Math.sin(phi)];
  const pin = [C[0] + ROD * dir[0], C[1] + ROD * dir[1], C[2] + ROD * dir[2]];
  return { phi, dir, pin };
}
export const geometry = { C, ROD, TILT, SHAFT_X };

// 汽缸剖面:兩端圓錐形的殼(剖開前半)
const shell = [[0.35, -1.25], [R_CYL, -0.45], [R_CYL, 0.45], [0.35, 1.25], [0.35, 1.38], [R_CYL + 0.13, 0.5], [R_CYL + 0.13, -0.5], [0.35, -1.38]];

export default {
  figure: 347,
  parts: [
    { id: "cylinder", kind: "lathe", axis: X, center: C, profile: shell, ...backHalf(X), arrow: false },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.4, 4.6, 0.6], at: [SHAFT_X - 0.7, -0.2, -0.3] },
        { kind: "box", size: [1.2, 0.25, 0.6], at: [SHAFT_X - 0.2, -2.45, 0] },
      ],
    },
    {
      id: "crank",
      kind: "group",
      axis: X,
      center: [SHAFT_X, 0, 0],
      spin: ARM + 0.2,
      pieces: [
        { kind: "cylinder", radius: 0.15, length: 1.6, at: [0, 0, -0.75] },
        { kind: "plate", shape: shape(thickLine([[0, 0], [ARM, 0]], 0.3), [circle(0.08).reverse()]), thickness: 0.12 },
        { kind: "cylinder", radius: 0.08, length: 0.3, at: [ARM, 0, 0.1], accent: true },
      ],
    },
    // 碟形活塞:法線沿活塞桿;中間的球
    { id: "piston", kind: "group", arrow: false, pieces: [{ kind: "cylinder", radius: R_CYL - 0.05, length: 0.08 }, { kind: "sphere", radius: 0.38 }] },
    { id: "rod", kind: "link", width: 0.14, thickness: 0.14 },
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.25 },
  view: { direction: [0.08, 0.1, 1] },
  pose(p) {
    const d = disk(p);
    // 碟片法線指向活塞桿方向的反向(局部 Z 對齊 −dir)
    const rotation = quatFromZ([-d.dir[0], -d.dir[1], -d.dir[2]]);
    // 蒸汽從上方進汽口流進被碟片讓出的那一半邊
    const side = Math.sin(d.phi) >= 0 ? 1 : -1;
    const inlet = [[C[0] + side * 0.8, 2.3, 0.3], [C[0] + side * 0.8, R_CYL - 0.2, 0.3], [C[0] + side * 0.5, 0.6, 0.3]];
    return {
      parts: {
        crank: { angle: d.phi },
        piston: { position: C, rotation },
        rod: { from: C, to: d.pin },
      },
      flows: [{ fluid: "steam", points: stream(inlet, p * 8, { spacing: 0.2 }) }],
      readouts: [],
    };
  },
};
