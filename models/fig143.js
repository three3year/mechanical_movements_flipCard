// 第 143 種:圓周運動轉換為交替直線運動。左邊的皮帶輪帶動蝸桿軸;蝸桿在軸上滑動(軸上切槽、蝸桿輪轂裡有鍵,
// 所以隨軸轉)。蝸桿由一個小橫移框架承載,框架在固定框架的水平桿上滑動,也承載著蝸桿所咬的齒輪。
// 連桿一端接在右邊的固定框架上,另一端接在齒輪的手腕(曲柄銷)上:蝸桿使齒輪轉動,連桿便強迫橫移框架
// 來回移動。主動件是蝸桿軸(皮帶輪)。
import { X, TAU, polar } from "./kit.js";

const WORM = { radius: 0.3, pitch: 0.24 };
const WHEEL = { teeth: 24, radius: (24 * 0.24) / TAU };
const SHAFT_Y = 1.55;
const WHEEL_Y = SHAFT_Y - WORM.radius - WHEEL.radius + 0.04;
const WRIST = 0.55; // 手腕離齒輪中心的距離
const FIX = [3.4, WHEEL_Y + 0.15, 0]; // 連桿在固定框架上的一端
const ROD = 3.0;

/** 蝸桿軸轉 theta:齒輪轉角(每轉一圈轉一齒)、橫移框架的位置 */
export function traverse(theta) {
  const wheel = Math.PI + theta / WHEEL.teeth;
  const w = polar(WRIST, wheel);
  const dy = FIX[1] - (WHEEL_Y + w[1]);
  const x = FIX[0] - w[0] - Math.sqrt(ROD * ROD - dy * dy);
  return { wheel, x, wrist: [x + w[0], WHEEL_Y + w[1], 0] };
}

export default {
  figure: 143,
  parts: [
    {
      id: "shaft",
      kind: "group",
      axis: X,
      center: [0, SHAFT_Y, 0],
      spin: 0.6,
      spinOffset: 3.4,
      pieces: [
        { kind: "cylinder", radius: 0.07, length: 7.8, at: [0, 0, 0.6] },
        { kind: "pulley", style: "disc", radius: 0.6, width: 0.22, at: [0, 0, -3.3] },
      ],
    },
    { id: "worm", kind: "worm", axis: X, radius: WORM.radius, length: 0.75, pitch: WORM.pitch, thread: 0.09 },
    { id: "wheel", kind: "gear", teeth: WHEEL.teeth, radius: WHEEL.radius, width: 0.22, bore: 0.12, pieces: [{ kind: "cylinder", radius: 0.08, length: 0.5, at: [WRIST, 0, 0.2], accent: true }] },
    {
      id: "carriage",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.2, 0.62, 0.4], at: [-0.5, SHAFT_Y - 0.05, -0.2] },
        { kind: "box", size: [0.2, 0.62, 0.4], at: [0.5, SHAFT_Y - 0.05, -0.2] },
        { kind: "box", size: [1.6, 0.4, 0.2], at: [0, WHEEL_Y + 0.1, -0.3] },
      ],
    },
    { id: "rod", kind: "link", width: 0.1, thickness: 0.06 },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.4, 2.2, 0.6], at: [-2.7, 0.75, 0] },
        { kind: "box", size: [0.4, 2.2, 0.6], at: [3.4, 0.75, 0] },
        { kind: "cylinder", axis: X, radius: 0.06, length: 6.1, at: [0.35, WHEEL_Y + 0.25, -0.3] },
        { kind: "cylinder", axis: X, radius: 0.06, length: 6.1, at: [0.35, WHEEL_Y - 0.1, -0.3] },
        { kind: "box", size: [7.6, 0.08, 1.2], at: [0.2, -0.38, 0] },
      ],
    },
  ],
  waivers: [
    { check: "unsupported", parts: ["shaft"], reason: "待確認(未修):shaft 在動,但離帶動(或支撐)它的零件還有 0.22 的空隙,少了相連的軸、銷或連桿,尚未補上" },
    { check: "unsupported", parts: ["worm"], reason: "待確認(未修):worm 在動,但離帶動(或支撐)它的零件還有 1 以上 的空隙,少了相連的軸、銷或連桿,尚未補上" },
    { check: "unsupported", parts: ["wheel"], reason: "待確認(未修):wheel 在動,但離帶動(或支撐)它的零件還有 1 以上 的空隙,少了相連的軸、銷或連桿,尚未補上" },
    { check: "unsupported", parts: ["carriage"], reason: "待確認(未修):carriage 在動,但離帶動(或支撐)它的零件還有 1 以上 的空隙,少了相連的軸、銷或連桿,尚未補上" },
    { check: "unsupported", parts: ["rod"], reason: "待確認(未修):rod 在動,但離帶動(或支撐)它的零件還有 1 以上 的空隙,少了相連的軸、銷或連桿,尚未補上" },
    { check: "interference", parts: ["worm", "wheel"], reason: "待確認:worm 的Tube 與 wheel 的板重疊 0.09,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["worm", "carriage"], reason: "待確認:worm 的Tube 與 carriage 的方塊 0.2×0.62×0.4重疊 0.06,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["wheel", "carriage"], reason: "待確認:wheel 的板 與 carriage 的方塊 0.2×0.62×0.4重疊 0.08,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["wheel", "frame"], reason: "待確認(未修):wheel 的板 與 frame 的方塊 7.6×0.08×1.2互相穿入 0.14(96 個取樣姿勢),尚未修正" },
  ],
  driver: { part: "shaft", type: "rotation", speed: 6 },
  target: "carriage",
  view: { direction: [0.06, 0.07, 1] },
  pose(theta) {
    const { wheel, x, wrist } = traverse(theta);
    return {
      parts: {
        shaft: { angle: theta },
        worm: { position: [x, SHAFT_Y, 0], angle: theta },
        wheel: { position: [x, WHEEL_Y, 0], angle: wheel },
        carriage: { position: [x, 0, 0] },
        rod: { from: [wrist[0], wrist[1], 0.3], to: [FIX[0], FIX[1], 0.3] },
      },
      readouts: [],
    };
  },
};
