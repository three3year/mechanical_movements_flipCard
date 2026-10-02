// 第 54 種:曼格輪或稱星形輪,產生交替方向的旋轉運動。輪緣是兩圈輪框之間的一圈徑向齒條(銷),
// 小齒輪 A 的軸沿半徑方向,齒從側面嵌進齒條之間,像冠狀齒輪那樣帶動輪轉。
// 把 A 移到齒條的另一面,同樣的轉向就使輪反轉——輪的轉向因此可以交替(推斷:原文只有一句說明)。
// 下方的 B 是另一個同樣嵌在齒條上的小齒輪,隨輪轉動。
import { X, Y, TAU } from "./kit.js";
import { meshAngle } from "./gears.js";

const RUNGS = 36;
const R = 1.95; // 齒條(銷)所在的節圓半徑
const PINION = { teeth: 8, radius: 0.32 };
const SIDE = 0.34; // 小齒輪中心在輪面前後的距離
const WHEEL = { center: [0, 0, 0], teeth: RUNGS, radius: R };
const aAt = (z) => ({ center: [-R, 0, z], axis: X, teeth: PINION.teeth, radius: PINION.radius });
const B = { center: [0, -R, SIDE], axis: Y, teeth: PINION.teeth, radius: PINION.radius };
const Z_OF = { front: SIDE, back: -SIDE };

const rungs = Array.from({ length: RUNGS }, (_, i) => {
  const a = (i / RUNGS) * TAU;
  return { kind: "box", size: [0.42, 0.07, 0.16], at: [R * Math.cos(a), R * Math.sin(a), 0], angle: a, accent: i === 0 };
});

/** A 轉 angle 時輪的轉角(A 在 side 面) */
export function wheelAngle(angle, side) {
  const a = aAt(Z_OF[side]);
  return meshAngle(a, WHEEL, angle, [-R, 0, 0]);
}

export default {
  figure: 54,
  parts: [
    {
      id: "wheel",
      kind: "group",
      spin: 2.3,
      pieces: [
        ...rungs,
        { kind: "cylinder", radius: R + 0.27, inner: R + 0.19, length: 0.22 },
        { kind: "cylinder", radius: R - 0.19, inner: R - 0.27, length: 0.22 },
        ...[0, 1, 2, 3].map((k) => ({ kind: "box", size: [R - 0.6, 0.12, 0.12], at: [((R - 0.6) / 2 + 0.38) * Math.cos((k * TAU) / 4), ((R - 0.6) / 2 + 0.38) * Math.sin((k * TAU) / 4), 0], angle: (k * TAU) / 4 })),
        { kind: "cylinder", radius: 0.45, length: 0.3 },
        { kind: "cylinder", radius: 0.22, length: 0.7 },
      ],
    },
    {
      id: "pinionA",
      kind: "gear",
      axis: X,
      center: aAt(SIDE).center,
      posed: true,
      teeth: PINION.teeth,
      radius: PINION.radius,
      width: 0.36,
      web: false,
      pieces: [{ kind: "cylinder", radius: 0.08, length: 1.3, at: [0, 0, -0.75] }],
      label: "A",
      labelOffset: [-0.75, 0.15, 0],
    },
    {
      id: "pinionB",
      kind: "gear",
      axis: Y,
      center: B.center,
      teeth: PINION.teeth,
      radius: PINION.radius,
      width: 0.36,
      web: false,
      pieces: [{ kind: "cylinder", radius: 0.08, length: 1.1, at: [0, 0, -0.65] }],
      label: "B",
      labelOffset: [0.4, -0.75, 0],
    },
  ],
  driver: { part: "pinionA", type: "rotation" },
  states: {
    options: [
      { id: "front", label: "A 在齒條前面" },
      { id: "back", label: "A 在齒條後面" },
    ],
    initial: "front",
  },
  view: { direction: [0.15, 0.1, 1] },
  pose(angle, side = "front") {
    const wheel = wheelAngle(angle, side);
    return {
      parts: {
        pinionA: { position: aAt(Z_OF[side]).center, angle },
        wheel: { angle: wheel },
        pinionB: { angle: meshAngle(WHEEL, B, wheel, [0, -R, 0]) },
      },
      readouts: [],
    };
  },
};
