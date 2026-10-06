// 第 96 種:心形凸輪。凸輪轉動時,水平桿依輪廓做均勻的橫移:
// 節曲線(滾子中心的路徑)離軸心的距離與轉角成正比,去程、回程各半圈。
// 水平桿在右方的導座裡滑動,套在桿上的壓縮彈簧把滾子壓在凸輪上(推斷:原文沒說桿怎麼貼著凸輪,
// 原圖也只畫到桿;水平的桿沒有重力可靠,回程得有彈簧)。桿與彈簧在凸輪上方一層,滾子的軸往下伸到凸輪那一層。
import { TAU, signedAngle } from "./kit.js";
import { outlineForRoller } from "./cams.js";
import { pedestal, squareGuide } from "./supports.js";

const NEAR = 0.6; // 桿端滾子離軸心最近(原圖位置:心形的凹口)
const FAR = 2.12; // 最遠
const ROLLER = 0.12;
const FRONT = 0.05;
const BAR_Z = 0.3; // 桿身在凸輪上方的高度(桿的局部座標)
const COLLAR = 0.45; // 彈簧座(套在桿上的環)離滾子的距離
const SEAT = 0.1; // 彈簧座的厚度
const BAR = { width: 0.22, thickness: 0.16 }; // 桿身的截面
const GUIDE_LENGTH = 0.3; // 導套沿桿長的長度(squareGuide 的預設)
const WIRE = 0.03; // 彈簧線徑:彈簧兩端各離開彈簧座、導套一個線徑,不壓進去
const GUIDE_X = 3.2; // 導座:桿在 0.6–2.12 之間往復,桿身(滾子右方 0.05–3.05)始終穿過這裡

/** 節曲線:凸輪局部角 φ 處,滾子中心離軸心的距離 */
export const pitchAt = (phi) => NEAR + ((FAR - NEAR) * Math.abs(signedAngle(phi))) / Math.PI;
const OUTLINE = outlineForRoller(pitchAt, ROLLER);

export const ROLLER_RADIUS = ROLLER;
export const CAM_OUTLINE = OUTLINE;

export default {
  figure: 96,
  parts: [
    {
      id: "cam",
      kind: "plate",
      shape: { outline: OUTLINE, holes: [] },
      thickness: 0.22,
      hub: 0.45,
      mark: [-1.3, 0],
      markSize: 0.09,
      spin: 2.1,
      pieces: [{ kind: "cylinder", radius: 0.2, length: 1.0, at: [0, 0, -0.2] }], // 軸,往後伸進軸承座
    },
    {
      id: "rod",
      kind: "group",
      center: [NEAR, 0, FRONT],
      pieces: [
        { kind: "box", size: [3.0, BAR.width, BAR.thickness], at: [1.5 + 0.05, 0, BAR_Z] },
        { kind: "cylinder", radius: ROLLER, length: 0.3, at: [0, 0, 0] }, // 滾子在凸輪那一層
        { kind: "cylinder", radius: 0.05, length: 0.25, at: [0, 0, 0.2] }, // 滾子的軸,往上接到桿身
        { kind: "box", size: [0.25, BAR.width, BAR.thickness], at: [0.1, 0, BAR_Z] },
        { kind: "box", size: [SEAT, 0.4, 0.4], at: [COLLAR, 0, BAR_Z] }, // 彈簧座
      ],
    },
    { id: "spring", kind: "spring", radius: 0.2, coils: 8, wire: WIRE },
    {
      id: "guide",
      kind: "group",
      pieces: [
        // 方形的導套(四片板圍住桿身)與托著它的柱子
        ...squareGuide({ at: [GUIDE_X, 0, FRONT + BAR_Z], width: BAR.width, thickness: BAR.thickness }),
        { kind: "box", size: [0.3, 2.0, 0.2], at: [GUIDE_X, -1.19, FRONT + BAR_Z] },
        { kind: "box", size: [1.0, 0.16, 0.6], at: [GUIDE_X, -2.2, FRONT + BAR_Z] },
        ...pedestal({ at: [0, 0], z: -0.55, bore: 0.21, floor: -2.3 }), // 凸輪軸的軸承座,在凸輪後面
      ],
    },
  ],
  // 動力重演:只推凸輪;桿在導座的直線滑軌上,彈簧把滾子壓向凸輪
  replay: {
    free: { rod: { slide: [1, 0, 0], spring: -1, gravity: false } },
    ignore: [["rod", "spring"]],
    expect: [
      { at: Math.PI / 2, part: "rod", label: "凸輪轉四分之一圈,桿被推出全程的一半", quote: "將均勻的橫移運動賦予水平桿" },
      { at: Math.PI, part: "rod", label: "凸輪轉半圈,桿被推到最遠" },
      { at: 2 * Math.PI, part: "rod", label: "凸輪轉一圈,彈簧把桿壓回最近處" },
    ],
  },
  driver: { part: "cam", type: "rotation" },
  target: "rod", // 均勻橫移的水平桿
  view: { direction: [0.1, 0.08, 1] },
  pose(angle) {
    // 桿在 +X 方向的徑向直線上;凸輪轉 angle 時,接觸點在凸輪局部角 −angle
    const x = pitchAt(-angle);
    return {
      parts: {
        cam: { angle },
        rod: { position: [x, 0, FRONT] },
        spring: { from: [x + COLLAR + SEAT / 2 + WIRE, 0, FRONT + BAR_Z], to: [GUIDE_X - GUIDE_LENGTH / 2 - WIRE, 0, FRONT + BAR_Z] },
      },
      readouts: [],
    };
  },
};
