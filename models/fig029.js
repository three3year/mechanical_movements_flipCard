// 第 29 種:碟形輪的輪面上有一圈螺旋螺紋,帶動軸與它平行於輪面、成直角的正齒輪:
// 碟形輪每轉一圈,螺紋與正齒輪接觸處沿半徑移動一個齒距,正齒輪轉過一齒。
import { TAU, Y } from "./kit.js";

const DISC = { radius: 2.4, thickness: 0.25 };
const GEAR = { teeth: 24, radius: 0.95 };
const PITCH = (TAU * GEAR.radius) / GEAR.teeth; // 螺紋的徑向節距 = 正齒輪的齒距
const SPIRAL = { start: 1.58, sweep: TAU * 1.1 }; // 螺紋略多於一圈,兩端重疊處接續
const RIDGE = 0.07;
const GEAR_X = 1.65;
const GEAR_Z = DISC.thickness / 2 + RIDGE * 2 + GEAR.radius;

const spiralPoints = Array.from({ length: 121 }, (_, i) => {
  const a = (SPIRAL.sweep * i) / 120;
  const r = SPIRAL.start + (PITCH * a) / TAU;
  return [r * Math.cos(a), r * Math.sin(a), DISC.thickness / 2 + RIDGE];
});

/** 碟形輪轉 angle 時,正齒輪的轉角(碟形輪轉一圈,正齒輪轉一齒) */
export const gearAngle = (angle) => angle / GEAR.teeth;
export const TEETH = GEAR.teeth;

export default {
  figure: 29,
  parts: [
    {
      id: "disc",
      kind: "cylinder",
      radius: DISC.radius,
      length: DISC.thickness,
      spin: DISC.radius,
      pieces: [
        { kind: "tube", points: spiralPoints, radius: RIDGE },
        { kind: "cylinder", radius: 0.35, length: 0.4 },
        { kind: "cylinder", radius: 0.2, length: 1.2, at: [0, 0, -0.5] },
        { kind: "sphere", radius: 0.1, at: [-1.9, 0.6, DISC.thickness / 2], accent: true },
      ],
    },
    {
      id: "gear",
      kind: "gear",
      axis: Y,
      center: [GEAR_X, 0, GEAR_Z],
      teeth: GEAR.teeth,
      radius: GEAR.radius,
      width: 0.26,
      web: false,
      pieces: [{ kind: "cylinder", radius: 0.07, length: 3.3 }],
    },
  ],
  driver: { part: "disc", type: "rotation" },
  view: { direction: [0.08, 0.08, 1] },
  pose(angle) {
    return { parts: { disc: { angle }, gear: { angle: gearAngle(angle) } }, readouts: [] };
  },
};
