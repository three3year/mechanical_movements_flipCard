// 第 484 種:繞在圓筒上的螺旋葉片,把風或水流的運動轉換為旋轉運動。
// 主動件是虛擬的「進程」:風已帶著圓筒轉了幾圈。風以流體示意(空氣)沿軸的方向吹過。
// 推斷:葉片繞圓筒一圈,圓筒的軸架在兩邊的軸承上;風沿軸從左吹到右,推著斜的葉片使圓筒轉。
import { TAU, X, quatAxisAngle, quatMul, quatFromZ } from "./kit.js";
import { stream } from "./flow.js";

export const LENGTH = 2.6;
const DRUM = 0.45;
const VANE = 1.15;
const SLATS = 48;
const SPEED = TAU * 0.5;

// 葉片:沿圓筒一圈的螺旋面,以一片片徑向的薄板拼成(局部 z 沿軸)
const slats = Array.from({ length: SLATS }, (_, i) => {
  const t = i / (SLATS - 1);
  const z = -LENGTH / 2 + 0.1 + (LENGTH - 0.2) * t;
  const a = TAU * t;
  const mid = (DRUM + VANE) / 2;
  return { kind: "box", size: [VANE - DRUM, 0.05, (LENGTH - 0.2) / SLATS + 0.02], at: [mid * Math.cos(a), mid * Math.sin(a), z], angle: a };
});

export default {
  figure: 484,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [4.4, 0.15, 1.4], at: [0, -1.45, 0] },
        { kind: "box", size: [0.3, 1.5, 0.5], at: [-LENGTH / 2 - 0.45, -0.7, 0] },
        { kind: "box", size: [0.3, 1.5, 0.5], at: [LENGTH / 2 + 0.45, -0.7, 0] },
      ],
    },
    {
      id: "drum",
      kind: "group",
      axis: X,
      spin: VANE + 0.15,
      pieces: [
        { kind: "cylinder", radius: DRUM, length: LENGTH },
        { kind: "cylinder", radius: 0.07, length: LENGTH + 1.1 },
        ...slats,
      ],
    },
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.12 },
  view: { direction: [0.15, 0.25, 1] },
  pose(progress) {
    const travel = progress * SPEED;
    const wind = [-0.75, 0, 0.75].flatMap((y) => [-0.6, 0.6].flatMap((z) => stream([[-2.4, y, z], [2.4, y, z]], travel * 1.5, { spacing: 0.5 })));
    return {
      parts: { drum: { rotation: quatMul(quatFromZ(X), quatAxisAngle([0, 0, 1], -TAU * progress)) } },
      flows: [{ fluid: "air", points: wind }],
      readouts: [],
    };
  },
};
