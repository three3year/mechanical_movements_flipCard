// 第 167 種:鼓輪表面切有一條無端的螺旋溝:半條溝的螺距朝一個方向、另半條朝相反方向。往復直線運動的桿上有一根凸柱
// 在溝裡,把桿的往復轉換為鼓輪的旋轉(曾作為蒸汽引擎中曲柄的替代)。桿每往返一次,鼓輪轉一圈。
// 原文的輸入是往復的桿:主動件是桿、目標件是鼓輪。主動量取鼓輪的相位(driver.cycle 的一程是半圈),
// 播放時鼓輪等速轉、桿跟著上下;溝的轉折點(死點)靠鼓輪的慣性轉過去。
// 推斷(原圖沒畫):鼓輪軸上下的軸承、桿的兩個導套,都由後面的機架板伸臂托著;桿加長到導套在凸柱的行程之外。
import { Y } from "./kit.js";
import { grooveRidges, roundedTriangle } from "./groove-drum.js";

const R = 0.85;
const LENGTH = 3.2;
const STROKE = 1.15; // 半行程
const STUD = 0; // 凸柱在鼓輪的局部角(朝右,桿在右邊)

/** 溝在鼓輪局部角 φ 處的軸向位置 */
const groove = (phi) => roundedTriangle(phi, STROKE); // 轉折處是圓滑的(尖角的溝,凸柱過不去)

/** 鼓輪轉 theta:桿的高度 */
export const rodY = (theta) => groove(STUD - theta);
export const stroke = 2 * STROKE;

/** 主動量 v:鼓輪的轉角(起點時凸柱在溝的最低點) */
export const drumAngle = (v) => v;

const ROD = { x: R + 0.42, length: 6.0 };
const GUIDES = [-1.65, 1.65]; // 桿的導套:在凸柱的行程(±1.35)之外
const BEARINGS = [-1.85, 1.85];
const BACK = -1.2; // 機架板

const ridges = grooveRidges(groove, { radius: R + 0.03, width: 0.36 }); // 溝兩側的凸條:沿軸量的溝寬要容得下凸柱(溝斜 44°,凸條的截面沿軸看會變寬),凸條也比凸柱的端面高

export default {
  figure: 167,
  parts: [
    {
      id: "drum",
      kind: "group",
      axis: Y,
      spin: R,
      spinOffset: LENGTH / 2 + 0.3,
      pieces: [
        { kind: "cylinder", radius: R, length: LENGTH, mark: true },
        ...ridges.map((points) => ({ kind: "tube", points, radius: 0.06, closed: true })),
        { kind: "cylinder", radius: 0.16, length: LENGTH + 0.8 },
      ],
    },
    {
      id: "rod",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.14, ROD.length, 0.18], at: [ROD.x, 0, 0] },
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.055, length: 0.42, at: [R + 0.21, 0, 0] }, // 凸柱比溝窄,端面貼著鼓面
        { kind: "box", size: [0.18, 0.4, 0.3], at: [R + 0.32, 0, 0] },
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [3.0, 4.6, 0.12], at: [0.3, 0, BACK] },
        ...BEARINGS.flatMap((y) => [
          { kind: "cylinder", axis: Y, radius: 0.3, inner: 0.17, length: 0.16, at: [0, y, 0] },
          { kind: "box", size: [0.2, 0.12, -BACK - 0.25], at: [0, y, (BACK - 0.25) / 2] },
        ]),
        ...GUIDES.flatMap((y) => [
          { kind: "box", size: [0.1, 0.12, 0.42], at: [ROD.x - 0.13, y, 0] },
          { kind: "box", size: [0.1, 0.12, 0.42], at: [ROD.x + 0.13, y, 0] },
          { kind: "box", size: [0.36, 0.12, 0.1], at: [ROD.x, y, -0.16] },
          { kind: "box", size: [0.36, 0.12, 0.1], at: [ROD.x, y, 0.16] },
          { kind: "box", size: [0.12, 0.12, -BACK - 0.2], at: [ROD.x, y, (BACK - 0.2) / 2] },
        ]),
      ],
    },
  ],
  // 動力重演:只推桿;鼓輪裝在軸承上自由轉動,由凸柱沿溝推著轉。
  // 溝的轉折點是死點(凸柱的推力沿著軸,推不動鼓輪),實物靠飛輪的慣性轉過去;重演從剛離開下死點走到接近上死點
  replay: {
    from: 0.15 * Math.PI,
    to: 0.85 * Math.PI,
    free: { drum: { pivot: [0, 0, 0], gravity: false } },
    ignore: [["drum", "frame"]], // 鼓輪的軸在軸承環裡轉(環的碰撞形狀是實心的)
    expect: [
      { at: 0.5 * Math.PI, part: "drum", label: "桿走半個行程,鼓輪被凸柱沿溝推著轉", quote: "往復直線運動的桿上有一根凸柱作動於該溝槽內,藉此將往復直線運動轉換為旋轉運動" },
      { part: "drum", label: "桿接近行程的頂端,鼓輪轉近半圈" },
    ],
  },
  driver: { part: "rod", type: "translation", direction: [0, 1, 0], cycle: [0, Math.PI] },
  target: "drum",
  view: { direction: [0.3, 0.1, 1] },
  pose(v) {
    const theta = drumAngle(v);
    return { parts: { drum: { angle: theta }, rod: { position: [0, rodY(theta), 0] } }, readouts: [] };
  },
};

