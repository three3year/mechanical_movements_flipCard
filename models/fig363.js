// 第 363 種:蹺蹺板,有限擺動運動(交替的圓周運動)最簡單的例子之一。長板在中間的支柱上以樞軸擺動,兩端各有座位。
// 主動件是長板(在板端碰到地面為止的範圍內來回擺)。
// 照原圖:立柱高出板、頂端圓弧,板穿過立柱上的榫眼(原圖板上的兩條虛線就是穿在立柱裡的那一段),樞銷從立柱前面
// 穿過板到立柱後面。擺幅照原圖約 33°:擺到一端時板端碰到底座(地面)為止,擺動的範圍由這個接觸算。
// 偏離插圖:原圖支點比較高(板端擺到 33° 時還離地),為了讓板端在原圖的傾角碰到地面、由地面擋住,支點放低;
// 底座加長到板端底下。
// 推斷:榫眼的大小(板擺到兩端時都不碰榫眼的上下緣)、座位與靠背的形狀。
import { deg, clamp } from "./kit.js";
import { shape, thickLine } from "./shapes.js";

const PIVOT = [0, 0.35, 0];
const HALF = 3.0; // 板長的一半
const PLANK = { t: 0.12, w: 0.8 }; // 板厚、板寬(前後)
const DROP = 1.7; // 支點離地面(底座頂面)的高度
const GROUND = PIVOT[1] - DROP;
const POST = { w: 0.45, depth: 1.12 }; // 立柱的寬、前後的深
const MORTISE = 0.24; // 榫眼上下緣離支點的高度
const CHEEK = (POST.depth - PLANK.w - 0.02) / 2; // 榫眼前後兩頰的厚度(板兩側各留 0.01)

// 擺到一端時板的下角碰到地面:HALF·sin a + (t/2)·cos a = DROP
const R = Math.hypot(HALF, PLANK.t / 2);
const reach = Math.asin(DROP / R) - Math.atan2(PLANK.t / 2, HALF);
export const RANGE = [-reach, reach];

// 座位:板上一塊座板與一片靠背
const seat = (s) => [
  { kind: "box", size: [0.7, 0.1, PLANK.w], at: [s * (HALF - 0.55), PLANK.t / 2 + 0.05, 0] },
  { kind: "plate", shape: shape(thickLine([[s * (HALF - 0.15), 0.03], [s * (HALF - 0.05), 0.55]], 0.1)), thickness: PLANK.w },
];

export default {
  figure: 363,
  parts: [
    {
      id: "stand",
      kind: "group",
      pieces: [
        // 底座(地面):長到板端碰地的地方
        { kind: "box", size: [5.8, 0.15, 1.2], at: [0, GROUND - 0.075, 0] },
        // 立柱:榫眼以下的柱身、榫眼前後兩頰、榫眼以上的柱頭與圓頂
        { kind: "box", size: [POST.w, PIVOT[1] - MORTISE - GROUND, POST.depth], at: [0, (PIVOT[1] - MORTISE + GROUND) / 2, 0] },
        ...[1, -1].map((s) => ({ kind: "box", size: [POST.w, 2 * MORTISE, CHEEK], at: [0, PIVOT[1], s * (POST.depth - CHEEK) / 2] })),
        { kind: "box", size: [POST.w, 0.23, POST.depth], at: [0, PIVOT[1] + MORTISE + 0.115, 0] },
        { kind: "cylinder", radius: POST.w / 2, length: POST.depth, at: [0, PIVOT[1] + MORTISE + 0.23, 0] },
        // 兩側的斜撐
        { kind: "plate", shape: shape([[-1.3, GROUND], [-POST.w / 2, GROUND + 1.0], [-POST.w / 2, GROUND + 0.6], [-0.9, GROUND]]), thickness: 0.4 },
        { kind: "plate", shape: shape([[1.3, GROUND], [0.9, GROUND], [POST.w / 2, GROUND + 0.6], [POST.w / 2, GROUND + 1.0]]), thickness: 0.4 },
        // 樞銷:從立柱前面穿過板到立柱後面,兩端各露出一點
        { kind: "cylinder", radius: 0.07, length: POST.depth + 0.1, at: PIVOT },
      ],
    },
    {
      id: "board",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [{ kind: "box", size: [2 * HALF, PLANK.t, PLANK.w], at: [0, 0, 0] }, ...seat(1), ...seat(-1)],
    },
  ],
  driver: { part: "board", type: "rotation", range: RANGE, initial: deg(-30) },
  view: { direction: [0.08, 0.1, 1] },
  pose(a) {
    return { parts: { board: { angle: clamp(a, ...RANGE) } }, readouts: [] };
  },
};
