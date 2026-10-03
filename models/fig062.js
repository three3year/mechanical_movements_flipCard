// 第 62 種:傳遞兩種速度,其中一種是差動的變速運動。與第 61 種類似,但第三個斜齒輪連在第四個皮帶輪上
// (在其他皮帶輪的右側),由上方軸上的小皮帶輪以另一條皮帶帶動。左皮帶在承載行星斜齒輪的皮帶輪上時,
// 若右邊的皮帶輪與軸同向轉(開口皮帶),軸的轉速 = 雙倍速度 − 第三個斜齒輪的轉速;
// 把右皮帶交叉、使該輪反向轉,就改為加上。
import { X } from "./kit.js";
import { pulleyOnX, belt, driven, travel } from "./belt-shift.js";
import { bevelDifferential } from "./bevel-differential.js";

const TOP_Y = 3.3;
const DRUM = { x: -0.95, radius: 1.0 };
const SMALL = { x: 1.0, radius: 0.55 };
const R = 1.05;
const PX = { carrier: -0.95, fourth: 1.0 };
const DIFF = bevelDifferential({ x0: 0.05 });

/** 右皮帶開口或交叉時:行星架、第三個斜齒輪(第四輪)與軸的轉角(都繞 +x) */
export function speeds(angle, state) {
  const carrier = driven(angle, DRUM.radius, R);
  const sun2 = driven(angle, SMALL.radius, R, state === "crossed");
  return { carrier, sun2, shaft: DIFF.shaftFrom(carrier, sun2) };
}

const cage = [
  { kind: "cylinder", radius: R, length: 0.5, at: [0, 0, 0] },
  { kind: "cylinder", radius: R, inner: R - 0.1, length: 0.12, at: [0, 0, 1.3] },
  ...[0, 1, 2, 3, 4, 5].map((k) => ({ kind: "box", size: [0.1, 0.1, 1.05], at: [(R - 0.05) * Math.cos((k * Math.PI) / 3), (R - 0.05) * Math.sin((k * Math.PI) / 3), 0.78], accent: k === 0 })),
  { kind: "box", size: [0.12, R * 2 - 0.2, 0.12], at: [0, 0, 1.0] },
];

export default {
  figure: 62,
  parts: [
    pulleyOnX("top", DRUM.x, TOP_Y, DRUM.radius, 1.7, {
      pieces: [
        { kind: "cylinder", radius: SMALL.radius, length: 1.1, at: [0, 0, SMALL.x - DRUM.x] },
        { kind: "cylinder", radius: 0.1, length: 5.0, at: [0, 0, 1.0] },
      ],
    }),
    { id: "carrier", kind: "group", axis: X, center: [PX.carrier, 0, 0], spin: R, pieces: cage },
    { ...pulleyOnX("fourth", PX.fourth, 0, R, 0.5), pieces: [{ kind: "cylinder", radius: 0.2, length: 0.75, at: [0, 0, -0.55] }] },
    ...DIFF.parts,
    { id: "shaft", kind: "cylinder", axis: X, radius: 0.1, length: 4.6, center: [0, 0, 0], arrow: false },
    { id: "beltLeft", kind: "belt" },
    { id: "beltRight", kind: "belt" },
  ],
  driver: { part: "top", type: "rotation" },
  target: "shaft", // 得到差動變速的軸
  states: {
    options: [
      { id: "open", label: "右皮帶開口(同向,相減)" },
      { id: "crossed", label: "右皮帶交叉(反向,相加)" },
    ],
    initial: "open",
  },
  view: { direction: [0.08, 0.12, 1], fov: 18 },
  pose(angle, state = "open") {
    const s = speeds(angle, state);
    const left = belt(PX.carrier, TOP_Y, DRUM.radius, 0, R);
    const right = belt(PX.fourth, TOP_Y, SMALL.radius, 0, R, state === "crossed");
    return {
      parts: {
        top: { angle },
        carrier: { angle: s.carrier },
        fourth: { angle: s.sun2 },
        shaft: { angle: s.shaft },
        ...DIFF.poses(s.shaft, s.carrier, s.sun2),
      },
      paths: {
        beltLeft: { points: left.points, closed: true, phase: travel(angle, DRUM.radius) },
        beltRight: { points: right.points, closed: true, phase: travel(angle, SMALL.radius) },
      },
      readouts: [],
    };
  },
};
