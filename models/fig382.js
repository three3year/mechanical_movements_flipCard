// 第 382 種:鏡子等物品用的可調整支架:玻璃可以抬高或降低、向左或向右轉,也可以改變傾斜角度。支柱插在立柱的插座裡,
// 以固定螺絲鎖住(抬高、降低、左右轉);玻璃以鉸鏈接在支柱頂上,鉸鏈處也有固定螺絲(改變傾角)。相機架也用同樣的裝置。
// 主動件是玻璃(改變傾角);狀態按鈕切換支柱的高低與左右轉向。
// 推斷:三種調整的範圍;狀態的組合。
import { Y, deg, quatMul, quatAxisAngle, clamp } from "./kit.js";
import { shape, rect } from "./shapes.js";

export const RANGE = [deg(-30), deg(30)];
export const SETTINGS = { low: { lift: 0, turn: 0 }, high: { lift: 0.7, turn: 0 }, turned: { lift: 0.7, turn: deg(35) } };
const HINGE0 = 0.55; // 鉸鏈離立柱頂的高度(支柱降到最低時)

export default {
  figure: 382,
  parts: [
    {
      id: "base",
      kind: "group",
      pieces: [
        { kind: "lathe", axis: Y, profile: [[0, -2.4], [1.25, -2.4], [1.1, -2.2], [0.35, -2.0], [0.2, -1.4], [0.32, -0.9], [0.2, -0.45], [0.14, -0.1], [0, -0.1]] },
        // 插座的固定螺絲
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.05, length: 0.4, at: [0.25, -0.35, 0] },
      ],
    },
    {
      id: "stem",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "cylinder", axis: Y, radius: 0.07, length: 1.54, at: [0, -0.33, 0] },
        { kind: "box", size: [0.4, 0.14, 0.14], at: [0, 0.5, 0] },
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.06, length: 0.55, at: [0, HINGE0, 0] },
      ],
    },
    {
      id: "mirror",
      kind: "group",
      arrow: false,
      pieces: [
        // 鏡框以一段托架架在立柱的前面(立柱在鏡子背後;鏡子前後傾時下緣不會掃到立柱與底座)
        { kind: "plate", shape: shape(rect(2.4, 3.0), [rect(1.9, 2.5).reverse()]), thickness: 0.12, at: [0, 0.6, 1.0] }, // 鏡框離鉸鏈夠遠:往後仰到底時下緣不碰立柱與底座
        { kind: "plate", shape: shape(rect(1.9, 2.5)), thickness: 0.03, at: [0, 0.6, 0.99] },
        { kind: "box", size: [0.16, 0.1, 0.85], at: [0, 0, 0.525] },
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.09, length: 0.25, at: [0, 0, 0] },
      ],
    },
  ],
  driver: { part: "mirror", type: "rotation", range: RANGE, initial: deg(-10) },
  target: "stem", // 支柱:升降、左右轉,帶著玻璃到要的位置
  states: {
    initial: "high",
    options: [
      { id: "low", label: "降低" },
      { id: "high", label: "抬高" },
      { id: "turned", label: "抬高並右轉" },
    ],
  },
  view: { direction: [0.35, 0.2, 1] },
  pose(tilt0, state = "high") {
    const tilt = clamp(tilt0, ...RANGE);
    const { lift, turn } = SETTINGS[state];
    const turnQ = quatAxisAngle(Y, turn);
    return {
      parts: {
        stem: { position: [0, lift, 0], rotation: turnQ },
        mirror: { position: [0, lift + HINGE0, 0], rotation: quatMul(turnQ, quatAxisAngle([1, 0, 0], tilt)) },
      },
      readouts: [],
    };
  },
};
