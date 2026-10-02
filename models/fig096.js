// 第 96 種:心形凸輪。凸輪轉動時,水平桿依輪廓做均勻的橫移:
// 節曲線(滾子中心的路徑)離軸心的距離與轉角成正比,去程、回程各半圈。
import { TAU, signedAngle } from "./kit.js";
import { outlineForRoller } from "./cams.js";

const NEAR = 0.6; // 桿端滾子離軸心最近(原圖位置:心形的凹口)
const FAR = 2.12; // 最遠
const ROLLER = 0.12;
const FRONT = 0.05;

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
      pieces: [{ kind: "cylinder", radius: 0.2, length: 0.6 }],
    },
    {
      id: "rod",
      kind: "group",
      center: [NEAR, 0, FRONT],
      pieces: [
        { kind: "box", size: [2.3, 0.22, 0.16], at: [1.15 + 0.05, 0, 0.12] },
        { kind: "cylinder", radius: ROLLER, length: 0.36, at: [0, 0, 0.05] },
      ],
    },
  ],
  driver: { part: "cam", type: "rotation" },
  view: { direction: [0.1, 0.08, 1] },
  pose(angle) {
    // 桿在 +X 方向的徑向直線上;凸輪轉 angle 時,接觸點在凸輪局部角 −angle
    const x = pitchAt(-angle);
    return { parts: { cam: { angle }, rod: { position: [x, 0, FRONT] } }, readouts: [] };
  },
};
