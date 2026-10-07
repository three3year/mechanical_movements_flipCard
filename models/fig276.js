// 第 276 種:等徑凸輪。三瓣的凸輪橫跨中心量的每個方向直徑都相等,夾在桿上相對的兩個滾子之間,
// 兩個滾子始終同時貼著凸輪;凸輪連續旋轉,桿就往復直線運動。主動件是凸輪。
// 推斷:滾子由一個框架連在一起(原圖只畫出左右兩段桿與滾子);滾子裝在桿端叉口的兩片夾板之間;
// 凸輪軸的軸承座、桿兩端的導套(原圖沒畫)。
import { outlineForRoller } from "./cams.js";
import { shape, circle, rect } from "./shapes.js";
import { pedestal, pedestalX } from "./supports.js";

const A = 1.25; // 滾子中心到凸輪中心的平均距離
const B = 0.3; // 三瓣的起伏
const ROLLER = 0.2;
/** 滾子中心走的節曲線:r(φ) + r(φ + π) = 2A,所以兩滾子的距離一直不變 */
export const pitch = (phi) => A + B * Math.cos(3 * phi);
const OUTLINE = outlineForRoller(pitch, ROLLER);

/** 凸輪轉 theta:右、左滾子中心離凸輪軸的距離與桿的位置 */
export function follower(theta) {
  const right = pitch(-theta);
  const left = pitch(Math.PI - theta);
  return { right, left, x: (right - left) / 2 };
}
export const SPAN = 2 * A;

// 桿端的叉口(s = +1 右、−1 左;局部座標原點在滾子中心):前後兩片夾板夾住滾子的軸,外側接到桿
const fork = (s) => [
  ...[-0.15, 0.15].map((z) => ({ kind: "plate", shape: shape(rect(0.47, 0.3, s * 0.115, 0)), thickness: 0.08, at: [s * A, 0, z] })),
  { kind: "box", size: [0.2, 0.3, 0.38], at: [s * (A + 0.45), 0, 0] },
  { kind: "cylinder", radius: 0.05, length: 0.38, at: [s * A, 0, 0] }, // 滾子的軸
];

const roller = (id) => ({ id, kind: "plate", shape: shape(circle(ROLLER - 0.01), [circle(0.05).reverse()]), thickness: 0.2, mark: [ROLLER * 0.55, 0], markSize: 0.045, arrow: false });

export default {
  figure: 276,
  parts: [
    {
      id: "stand",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: 0.12, length: 0.8, at: [0, 0, -0.35] }, // 凸輪軸
        ...pedestal({ at: [0, 0], z: -0.65, bore: 0.12, floor: -2.4 }),
        // 桿兩端的導套
        ...pedestalX({ x: -2.6, y: 0, z: 0, bore: 0.2, floor: -2.4 }),
        ...pedestalX({ x: 2.6, y: 0, z: 0, bore: 0.2, floor: -2.4 }),
      ],
    },
    { id: "cam", kind: "plate", shape: shape(OUTLINE, [circle(0.12).reverse()]), thickness: 0.2, hub: 0.3, circles: [0.24], mark: [A - 0.1, 0], markSize: 0.08, spin: A + B },
    {
      id: "rod",
      kind: "group",
      pieces: [
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.2, length: 1.6, at: [-A - 1.35, 0, 0] },
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.2, length: 1.6, at: [A + 1.35, 0, 0] },
        ...fork(-1),
        ...fork(1),
        // 把兩個滾子座連在一起的框架(在凸輪後方)
        { kind: "box", size: [2 * A + 0.7, 0.16, 0.12], at: [0, -1.85, -0.3] },
        { kind: "box", size: [0.16, 1.85, 0.12], at: [-A - 0.27, -0.95, -0.3] },
        { kind: "box", size: [0.16, 1.85, 0.12], at: [A + 0.27, -0.95, -0.3] },
      ],
    },
    roller("rollerR"),
    roller("rollerL"),
  ],
  driver: { part: "cam", type: "rotation" },
  target: "rod", // 往復的桿
  view: { direction: [0.04, 0.05, 1] },
  pose(theta) {
    const { right, left, x } = follower(theta);
    // 滾子在凸輪上滾動:轉角 ≈ 接觸處走過的弧長 / 滾子半徑(以節曲線近似)
    const spin = (-theta * A) / ROLLER;
    return {
      parts: {
        cam: { angle: theta },
        rod: { position: [x, 0, 0] },
        rollerR: { position: [right, 0, 0], angle: spin },
        rollerL: { position: [-left, 0, 0], angle: spin },
      },
      readouts: [],
    };
  },
};
