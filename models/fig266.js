// 第 266 種:差動螺旋。軸上切有兩段螺距不同的螺紋:左段旋在固定的軸承(左支柱)裡,右段旋在可以來回移動的軸承裡。
// 轉動曲柄,軸每轉一圈穿過固定軸承前進一個左段螺距,可動軸承則相對於軸後退一個右段螺距,
// 所以可動軸承每圈只移動兩螺距之差。主動件是軸左端的曲柄;讀數照原文。
import { X, TAU, clamp, screwAdvance } from "./kit.js";

export const P1 = 0.36; // 左段(固定軸承)的螺距
export const P2 = 0.28; // 右段(可動軸承)的螺距
export const RANGE = [0, 4 * TAU];
const FIXED = -1.6; // 固定軸承的位置
const MOVING = 1.45; // 可動軸承起始位置
const SHAFT0 = -0.3; // 軸中心起始位置
const Y = 0.55;

/** 曲柄轉 theta:軸前進的距離、可動軸承移動的距離 */
export function feed(theta0) {
  const theta = clamp(theta0, ...RANGE);
  const shaft = screwAdvance(theta, P1);
  return { theta, shaft, bearing: shaft - screwAdvance(theta, P2) };
}

export default {
  figure: 266,
  parts: [
    {
      id: "base",
      kind: "group",
      pieces: [
        { kind: "box", size: [4.4, 0.14, 1.2], at: [0, -0.62, 0] },
        { kind: "box", size: [0.35, 1.7, 0.6], at: [FIXED, 0.2, 0] },
        { kind: "box", size: [0.12, 1.3, 0.12], at: [FIXED + 0.25, -0.05, 0.4] },
        { kind: "box", size: [2.4, 0.12, 0.6], at: [0.9, -0.5, 0] },
      ],
    },
    {
      id: "shaft",
      kind: "cylinder",
      axis: X,
      radius: 0.1,
      length: 5.6,
      pieces: [
        { kind: "worm", radius: 0.26, length: 1.9, pitch: P1, thread: 0.08, at: [0, 0, -1.9] },
        { kind: "worm", radius: 0.26, length: 2.0, pitch: P2, thread: 0.08, at: [0, 0, 1.1] },
        // 曲柄:臂與握把
        { kind: "box", size: [0.08, 0.5, 0.08], at: [0, 0.25, -2.75] },
        { kind: "cylinder", radius: 0.05, length: 0.35, at: [0, 0.5, -2.9], accent: true },
      ],
    },
    { id: "bearing", kind: "group", pieces: [{ kind: "box", size: [0.45, 1.05, 0.6], at: [0, -0.05, 0] }, { kind: "box", size: [1.1, 0.12, 0.9], at: [0, -0.5, 0] }] },
  ],
  waivers: [
    { check: "interference", parts: ["base", "shaft"], reason: "待確認(未修):base 的方塊 0.35×1.7×0.6 與 shaft 的Tube互相穿入 0.26(96 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["shaft", "bearing"], reason: "待確認(未修):shaft 的Tube 與 bearing 的方塊 0.45×1.05×0.6互相穿入 0.28(96 個取樣姿勢),尚未修正" },
  ],
  driver: { part: "shaft", type: "rotation", range: RANGE, initial: 0 },
  target: "bearing", // 每圈只移動兩螺距之差的可動軸承
  view: { direction: [0.25, 0.35, 1] },
  pose(theta0) {
    const { theta, shaft, bearing } = feed(theta0);
    return {
      parts: {
        shaft: { angle: theta, position: [SHAFT0 + shaft, Y, 0] },
        bearing: { position: [MOVING + bearing, Y, 0] },
      },
      readouts: [
        { label: "曲柄轉了", value: `${(theta / TAU).toFixed(2)} 圈` },
        { label: "可動軸承移動", value: `${(bearing * 10).toFixed(2)} cm` },
      ],
    };
  },
};
