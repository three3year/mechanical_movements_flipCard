// 第 48 種:離合器盒。頂部的小齒輪持續帶動下方的齒輪;齒輪連著離合器的一半,兩者在軸上鬆動旋轉。
// 要把運動傳給軸時,以槓桿把離合器的另一半(在軸上的鍵條上滑動、隨軸轉)推入嚙合,爪互相卡住。
import { X } from "./kit.js";
import { meshAngle } from "./gears.js";
import { CLUTCH_STATES, bellCrank, leverTurn } from "./clutch-parts.js";

const GEAR = { center: [1.65, 0, 0], axis: X, teeth: 40, radius: 2.0 };
const PINION = { center: [1.65, 2.62, 0], axis: X, teeth: 12, radius: 0.6 };
const JAWS = 4;
const SHIFT = 0.55;
const SLIDER_X = { engaged: 3.12, free: 3.12 + SHIFT };
const LEVER = { pivot: [4.95, -1.65], up: 1.65, out: 1.5 };

export const jaws = JAWS;

export default {
  figure: 48,
  parts: [
    { id: "pinion", kind: "gear", axis: X, center: PINION.center, teeth: PINION.teeth, radius: PINION.radius, width: 0.36, web: false },
    {
      id: "gear",
      kind: "gear",
      axis: X,
      center: GEAR.center,
      teeth: GEAR.teeth,
      radius: GEAR.radius,
      width: 0.4,
      pieces: [{ kind: "gear", crown: true, teeth: JAWS, radius: 0.72, width: 0.95, toothDepth: 0.28, faceWidth: 0.42, at: [0, 0, 0.67] }],
    },
    {
      id: "shaft",
      kind: "cylinder",
      axis: X,
      center: [3.6, 0, 0],
      radius: 0.22,
      length: 5.6,
      spin: 0.45,
      spinOffset: 2.55, // 轉向箭頭在右端露出的一段
      // 鍵條:滑動半在上面滑動,也是軸的轉動記號(從滑動半右邊露出)
      pieces: [{ kind: "box", size: [0.13, 0.13, 2.95], at: [0.24, 0, 1.175], accent: true }],
    },
    {
      id: "slider",
      kind: "group",
      axis: X,
      center: [SLIDER_X.engaged, 0, 0],
      posed: true,
      spin: 0.85,
      pieces: [
        { kind: "gear", crown: true, teeth: JAWS, radius: 0.75, width: 1.0, toothDepth: 0.28, faceWidth: 0.42, axis: [0, 0, -1], at: [0, 0, 0.45] },
        { kind: "cylinder", radius: 0.55, length: 0.45, at: [0, 0, 1.15] },
        { kind: "cylinder", radius: 0.75, length: 0.12, at: [0, 0, 1.43] },
      ],
    },
    bellCrank(LEVER),
  ],
  waivers: [
    { check: "interference", parts: ["gear", "slider"], reason: "簡化爪形:離合器的爪畫成方塊而不是扇形,接合時內緣互相重疊;爪數與錯開半個爪距的卡合關係正確" },
  ],
  driver: { part: "pinion", type: "rotation" },
  target: "shaft", // 離合器接合時才被帶動的軸
  states: CLUTCH_STATES,
  view: { direction: [0.12, 0.18, 1], fov: 14 },
  pose(angle, state = "engaged") {
    const gear = meshAngle(PINION, GEAR, angle);
    const engaged = state === "engaged";
    // 接合時滑動半與齒輪同轉,爪錯開半個爪距互相卡住
    return {
      parts: {
        pinion: { angle },
        gear: { angle: gear },
        shaft: { angle: engaged ? gear + Math.PI / JAWS : 0 },
        slider: { position: [SLIDER_X[state], 0, 0], angle: engaged ? gear + Math.PI / JAWS : 0 },
        lever: { angle: leverTurn(SLIDER_X[state] - SLIDER_X.engaged, LEVER.up) },
      },
      readouts: [],
    };
  },
};
