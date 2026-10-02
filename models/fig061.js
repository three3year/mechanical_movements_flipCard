// 第 61 種:傳遞兩種速度的差動機構。下方軸上:左邊是鬆動輪(原圖皮帶在此);中間的皮帶輪固定在軸上,
// 輪轂上固定一個小斜齒輪;右邊的皮帶輪鬆套在軸上,橫向帶著另一個斜齒輪(行星);
// 第三個斜齒輪鬆套在軸上,以末端加重的摩擦帶(制動器)固定住。
// 皮帶在中間輪時是單純的運動;在右邊輪時,行星架轉一圈軸轉兩圈——雙倍的速度。
import { X } from "./kit.js";
import { pulleyOnX, belt, driven, travel } from "./belt-shift.js";
import { bevelDifferential } from "./bevel-differential.js";

const DRUM = { y: 3.3, radius: 1.0, x: 0.2 };
const R = 1.05;
const PX = { loose: -1.0, middle: -0.4, right: 0.55 };
const DIFF = bevelDifferential({ x0: 0.55 });

/** 皮帶在 state 輪上時:軸、行星架(右輪)的轉角;第三個斜齒輪被摩擦帶固定為 0 */
export function speeds(angle, state) {
  const belted = driven(angle, DRUM.radius, R);
  if (state === "loose") return { shaft: 0, carrier: 0, loose: belted };
  if (state === "middle") return { shaft: belted, carrier: belted / 2, loose: 0 };
  return { shaft: DIFF.shaftFrom(belted, 0), carrier: belted, loose: 0 };
}

// 右輪做成鏤空的籠形,看得到裡面的斜齒輪
const cage = {
  kind: "group",
  pieces: [
    { kind: "cylinder", radius: R, inner: R - 0.1, length: 0.12, at: [0, 0, -0.42] },
    { kind: "cylinder", radius: R, inner: R - 0.1, length: 0.12, at: [0, 0, 0.42] },
    ...[0, 1, 2, 3, 4, 5].map((k) => ({ kind: "box", size: [0.1, 0.1, 0.96], at: [(R - 0.05) * Math.cos((k * Math.PI) / 3), (R - 0.05) * Math.sin((k * Math.PI) / 3), 0], accent: k === 0 })),
    { kind: "box", size: [0.12, R * 2 - 0.2, 0.12], at: [0, 0, 0] },
  ],
};

export default {
  figure: 61,
  parts: [
    pulleyOnX("drum", DRUM.x, DRUM.y, DRUM.radius, 2.2, { pieces: [{ kind: "cylinder", radius: 0.09, length: 3.4 }] }),
    pulleyOnX("loose", PX.loose, 0, R, 0.55),
    pulleyOnX("middle", PX.middle, 0, R, 0.55),
    { id: "right", kind: "group", axis: X, center: [PX.right, 0, 0], spin: R, pieces: cage.pieces },
    ...DIFF.parts,
    { id: "shaft", kind: "cylinder", axis: X, radius: 0.1, length: 3.8, center: [0.1, 0, 0], arrow: false },
    {
      id: "brake",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: 0.3, length: 0.25, axis: X, at: [1.35, 0, 0] },
        { kind: "box", size: [0.06, 1.0, 0.24], at: [1.35, -0.75, 0.3] },
        { kind: "box", size: [0.06, 1.0, 0.24], at: [1.35, -0.75, -0.3] },
        { kind: "box", size: [0.3, 0.35, 0.7], at: [1.35, -1.35, 0] },
      ],
    },
    { id: "belt", kind: "belt" },
  ],
  driver: { part: "drum", type: "rotation" },
  states: {
    options: [
      { id: "loose", label: "鬆動輪(停)" },
      { id: "middle", label: "中間輪(單純)" },
      { id: "right", label: "右側輪(雙倍)" },
    ],
    initial: "loose",
  },
  view: { direction: [0.08, 0.12, 1], fov: 18 },
  pose(angle, state = "loose") {
    const s = speeds(angle, state);
    const path = belt(PX[state], DRUM.y, DRUM.radius, 0, R);
    return {
      parts: {
        drum: { angle },
        loose: { angle: s.loose },
        middle: { angle: s.shaft },
        right: { angle: s.carrier },
        shaft: { angle: s.shaft },
        ...DIFF.poses(s.shaft, s.carrier, 0),
      },
      paths: { belt: { points: path.points, closed: true, phase: travel(angle, DRUM.radius) } },
      readouts: [],
    };
  },
};
