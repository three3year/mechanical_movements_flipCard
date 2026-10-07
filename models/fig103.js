// 第 103 種:螺桿旋轉,使滑塊做直線運動。螺桿一端支在 L 形機架的立柱上(只能轉、不能移動),
// 滑塊的螺帽套在螺桿上、底部在機床的導軌上滑動(不能轉)。螺桿每轉一圈,滑塊移動一個螺距。
// 螺桿的軸頸穿出立柱,外側有一個軸環(照原圖)貼著立柱:滑塊往立柱推時,螺桿受的反力往右,由軸環擋住。
import { X, TAU, screwAdvance } from "./kit.js";
import { shape } from "./shapes.js";

const PITCH = 0.42;
const SCREW_Y = 1.2;
const START = 2.3; // 滑塊起始位置
const TURNS = 3; // 滑塊走到機架立柱前就停

/** 螺桿轉 angle(繞 +x):滑塊的位置(螺帽相對螺桿後退) */
export const sliderX = (angle) => START - screwAdvance(angle, PITCH);
export const pitch = PITCH;

export default {
  figure: 103,
  parts: [
    {
      id: "screw",
      kind: "worm",
      axis: X,
      center: [2.6, SCREW_Y, 0],
      radius: 0.3,
      length: 4.4,
      pitch: PITCH,
      thread: 0.08,
      pieces: [{ kind: "cylinder", radius: 0.14, length: 6.0, at: [0, 0, -0.7] }, { kind: "cylinder", radius: 0.22, length: 0.3, at: [0, 0, -3.35] }],
    },
    {
      id: "slider",
      kind: "plate",
      center: [START, 0, 0],
      shape: shape([[-0.75, 0.3], [0.75, 0.3], [0.75, 0.62], [0.2, 0.62], [0.2, 1.65], [-0.2, 1.65], [-0.2, 0.62], [-0.75, 0.62]]),
      thickness: 0.6,
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape([[-0.6, -0.5], [5.2, -0.5], [5.2, -0.18], [0.0, -0.18], [0.0, 1.75], [-0.6, 1.75]]), thickness: 0.8 },
        { kind: "box", size: [5.0, 0.42, 0.8], at: [2.65, 0.06, 0] },
      ],
    },
  ],
  driver: { part: "screw", type: "rotation", range: [0, TURNS * TAU] },
  target: "slider", // 直線移動的滑塊
  view: { direction: [0.08, 0.15, 1] },
  pose(angle) {
    return { parts: { screw: { angle }, slider: { position: [sliderX(angle), 0, 0] } }, readouts: [] };
  },
};
