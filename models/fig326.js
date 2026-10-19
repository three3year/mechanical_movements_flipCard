// 第 326 種:引導引擎活塞桿作平行(直線)運動的簡易方式。活塞桿頂端的滑塊 A 在框架立柱上的直溝槽裡上下滑動
// (溝槽的兩面削平),連桿從滑塊接到頂上飛輪軸的曲柄。
// 和第 327 種一樣由下方汽缸的蒸汽推動:主動件是虛擬的「進程」、目標件是飛輪;汽缸內的蒸汽以填色與流動的點表示。
// 推斷:汽缸、進汽管與進汽的時機(原圖只畫到立柱下的台座,活塞桿往下伸出畫面;507movements 的動畫同樣讓活塞桿
// 穿過台座往下伸出畫面)。偏離插圖:台座架在兩條腿上,汽缸放在台座底下、腿之間,座落到最底下的底板。
// 結構:立柱分三層——後壁、中間一層、前壁。前壁開直溝槽,滑塊 A 前面那塊在溝槽裡、兩側貼著削平的溝面;
// 中間一層從溝槽往上挖空到立柱頂面(連桿、曲柄在裡面擺動),往下開一道讓活塞桿穿過的孔。
// 原圖連桿上段畫成虛線:連桿走在立柱的厚度裡,從立柱頂面進去、被前壁擋住,到溝槽才露出來;
// 曲柄也在這一層,曲柄銷轉到下方時伸進立柱頭的空腔。連桿下端夾在滑塊的前後兩塊之間,以銷接上。
// 飛輪軸從曲柄往後穿過後壁頂上的軸承座(原圖立柱頂的方塊)到後方的飛輪。
// 推斷:曲柄半徑、連桿長(依原圖)。
import { TAU, deg } from "./kit.js";
import { crankSlider, cylinderParts, cylinderPose, steamPipe } from "./vertical-engine.js";
import { shape, rect, arcPoints } from "./shapes.js";

const CRANK = [0, 2.3, 0];
const R = 0.45;
const ROD = 2.6;
const PISTON_ROD = 3.7; // 滑塊中心到活塞中心
const PLINTH = { y0: -2.85, y1: -2.6, half: 1.45, z: 0.35 }; // 立柱底下的台座(原圖)
const BED = -4.85; // 底板頂面
// 汽缸頂比台座底低 0.55:進汽管的直管頂端(高出汽缸 0.5)停在台座下面,不必穿過台座
const CYL = { x: 0, top: PLINTH.y0 - 0.55, length: 1.2, radius: 0.42, seat: BED };
// 立柱各層的深度:後壁、中間一層、前壁
const BACK = [-0.25, -0.12];
const FRONT = [0.12, 0.25];
const SLOT = { w: 0.32, h: 2.9, y: -0.45 }; // 前壁的直溝槽

/** 進程 p → 飛輪角、曲柄銷、滑塊 A 的高度、活塞高度、活塞是否往下走 */
export function engine(p) {
  const theta = -TAU * p;
  const { pin, y } = crankSlider(CRANK, R, ROD, theta);
  const next = crankSlider(CRANK, R, ROD, theta - 1e-4).y;
  return { theta, pin, y, piston: y - PISTON_ROD, downward: next < y };
}

// 框架立柱:上窄下寬
const OUTLINE = [[-1.25, -2.6], [1.25, -2.6], [1.25, -2.3], [0.95, -2.2], [0.55, 1.6], [0.75, 1.95], [-0.75, 1.95], [-0.55, 1.6], [-0.95, -2.2], [-1.25, -2.3]];
// 中間一層的右半:左邊界是空腔——下段讓活塞桿穿過(半寬 0.1),滑塊的高度內半寬 0.18,
// 往上張開到立柱頂面半寬 0.52(連桿全程擺動的範圍加 0.03 的間隙)
const MID_RIGHT = [[0.1, -2.6], [1.25, -2.6], [1.25, -2.3], [0.95, -2.2], [0.55, 1.6], [0.75, 1.95], [0.52, 1.95], [0.18, -0.2], [0.18, -1.1], [0.1, -1.1]];
const mirror = (pts) => pts.map(([x, y]) => [-x, y]).reverse();
const layer = ([z0, z1], s) => ({ kind: "plate", shape: s, thickness: z1 - z0, at: [0, 0, (z0 + z1) / 2] });

// 滑塊 A:前面那塊在前壁的溝槽裡,後面一塊在中間一層,兩塊之間夾著連桿下端;底下一塊把前後接起來,活塞桿從它往下
const SLIDER_W = 0.3;
const SLIDER_H = 0.5;
const SLIDER_FRONT = [0.04, 0.33]; // 前面凸出前壁 0.08(原圖 A 凸在溝槽外)
const SLIDER_BACK = [-0.1, -0.04];
const box = ([z0, z1], w, h, y = 0) => ({ kind: "box", size: [w, h, z1 - z0], at: [0, y, (z0 + z1) / 2] });

export default {
  figure: 326,
  parts: [
    {
      id: "column",
      kind: "group",
      pieces: [
        layer(BACK, shape(OUTLINE)),
        layer([BACK[1], FRONT[0]], shape(MID_RIGHT)),
        layer([BACK[1], FRONT[0]], shape(mirror(MID_RIGHT))),
        layer(FRONT, shape(OUTLINE, [rect(SLOT.w, SLOT.h, 0, SLOT.y).reverse()])),
        // 後壁頂上的軸承座:飛輪軸穿過軸承環
        { kind: "cylinder", radius: 0.3, inner: 0.16, length: BACK[1] - BACK[0], at: [0, CRANK[1], (BACK[0] + BACK[1]) / 2] },
        { kind: "box", size: [0.8, 0.12, BACK[1] - BACK[0]], at: [0, 2.01, (BACK[0] + BACK[1]) / 2] },
        // 台座(原圖):中間留一個讓活塞桿穿過的方孔
        ...[-1, 1].map((s) => ({ kind: "box", size: [PLINTH.half - 0.06, PLINTH.y1 - PLINTH.y0, 2 * PLINTH.z], at: [(s * (PLINTH.half + 0.06)) / 2, (PLINTH.y0 + PLINTH.y1) / 2, 0] })),
        ...[-1, 1].map((s) => ({ kind: "box", size: [0.12, PLINTH.y1 - PLINTH.y0, PLINTH.z - 0.06], at: [0, (PLINTH.y0 + PLINTH.y1) / 2, (s * (PLINTH.z + 0.06)) / 2] })),
        // 台座的兩條腿與底板(推斷)
        ...[-1, 1].map((s) => ({ kind: "box", size: [0.24, PLINTH.y0 - BED, 2 * PLINTH.z], at: [s * 1.35, (PLINTH.y0 + BED) / 2, 0] })),
        { kind: "box", size: [3.2, 0.18, 1.2], at: [0, BED - 0.09, -0.2] },
      ],
    },
    { id: "pipe", ...steamPipe(CYL) },
    ...cylinderParts(CYL),
    {
      id: "flywheel",
      kind: "group",
      center: CRANK,
      spin: 3.0,
      pieces: [
        { kind: "plate", shape: shape([...arcPoints(3.25, 0, TAU).slice(0, -1)], [arcPoints(3.0, 0, TAU).slice(0, -1).reverse()]), thickness: 0.2, at: [0, 0, -0.45] },
        ...[0, 1, 2, 3].map((i) => ({ kind: "box", size: [6.0, 0.14, 0.1], at: [0, 0, -0.45], angle: deg(30) + (i * Math.PI) / 4 })),
        // 飛輪軸:從飛輪往前穿過軸承到曲柄
        { kind: "cylinder", radius: 0.15, length: 0.48, at: [0, 0, -0.31] },
        // 曲柄與曲柄銷(在立柱中間那一層)
        { kind: "plate", shape: shape([[0, -0.15], [R, -0.1], [R, 0.1], [0, 0.15]]), thickness: 0.06, at: [0, 0, -0.07] },
        { kind: "cylinder", radius: 0.07, length: 0.18, at: [R, 0, -0.01], accent: true },
      ],
    },
    { id: "rod", kind: "link", width: 0.14, thickness: 0.06 },
    {
      id: "sliderA",
      kind: "group",
      label: "A",
      labelOffset: [-0.45, 0, 0.3],
      pieces: [
        box(SLIDER_FRONT, SLIDER_W, SLIDER_H),
        box(SLIDER_BACK, SLIDER_W, SLIDER_H),
        box([SLIDER_BACK[0], SLIDER_FRONT[0]], SLIDER_W, 0.12, -SLIDER_H / 2 + 0.06),
        // 連桿下端的銷,前端露在滑塊正面(原圖 A 上的圓)
        { kind: "cylinder", radius: 0.05, length: 0.46, at: [0, 0, 0.13], accent: true },
        // 活塞桿
        { kind: "box", size: [0.08, PISTON_ROD, 0.08], at: [0, -PISTON_ROD / 2, 0] },
      ],
    },
  ],
  powered: ["piston"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.25 },
  target: "flywheel", // 輸出的飛輪
  view: { direction: [0.03, 0.05, 1] },
  pose(p) {
    const e = engine(p);
    const cyl = cylinderPose(CYL, e.piston, e.downward, p);
    return {
      parts: { flywheel: { angle: e.theta }, rod: { from: [e.pin[0], e.pin[1], 0], to: [0, e.y, 0] }, sliderA: { position: [0, e.y, 0] }, ...cyl.parts },
      flows: cyl.flows,
      readouts: [],
    };
  },
};
