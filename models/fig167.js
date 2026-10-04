// 第 167 種:鼓輪表面切有一條無端的螺旋溝:半條溝的螺距朝一個方向、另半條朝相反方向。往復直線運動的桿上有一根凸柱
// 在溝裡,把桿的往復轉換為鼓輪的旋轉(曾作為蒸汽引擎中曲柄的替代)。桿每往返一次,鼓輪轉一圈。
// 為了讓模型通過溝的轉折點(死點),主動件取鼓輪,由它決定桿的位置(兩者的運動關係相同)。
import { Y } from "./kit.js";
import { grooveRidges, triangle } from "./groove-drum.js";

const R = 0.85;
const LENGTH = 3.2;
const STROKE = 1.15; // 半行程
const STUD = 0; // 凸柱在鼓輪的局部角(朝右,桿在右邊)

/** 溝在鼓輪局部角 φ 處的軸向位置 */
const groove = (phi) => triangle(phi, STROKE);

/** 鼓輪轉 theta:桿的高度 */
export const rodY = (theta) => groove(STUD - theta);
export const stroke = 2 * STROKE;

const ridges = grooveRidges(groove, { radius: R + 0.02, width: 0.2 });

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
        ...ridges.map((points) => ({ kind: "tube", points, radius: 0.04, closed: true })),
        { kind: "cylinder", radius: 0.16, length: LENGTH + 0.8 },
      ],
    },
    {
      id: "rod",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.14, 4.4, 0.18], at: [R + 0.42, 0, 0] },
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.055, length: 0.42, at: [R + 0.21, 0, 0] }, // 凸柱比溝窄,端面貼著鼓面
        { kind: "box", size: [0.18, 0.4, 0.3], at: [R + 0.32, 0, 0] },
      ],
    },
  ],
  driver: { part: "drum", type: "rotation", speed: 0.7 },
  target: "rod",
  view: { direction: [0.3, 0.1, 1] },
  pose(theta) {
    return { parts: { drum: { angle: theta }, rod: { position: [0, rodY(theta), 0] } }, readouts: [] };
  },
};

