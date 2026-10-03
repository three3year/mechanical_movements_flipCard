// 第 300–301 種共用(前視與側視立面圖):同一根軸上並排兩個擒縱輪,兩輪的齒錯開半個齒距;
// 下方水平的擺軸上有一個半圓形的叉瓦,夾在兩輪之間。擺軸來回擺動時,叉瓦交替地被兩個輪之一的齒推動、擋住,
// 擒縱輪每擺一次轉過半個齒。主動件是擺軸(累計擺動)。
// 推斷:齒數與擺幅(依原圖約十二齒的鉤形齒)。
import { X, TAU, deg, swing } from "./kit.js";
import { escapeStep } from "./escapement.js";
import { ratchetShape, shape, circle, arcPoints } from "./shapes.js";

export const N = 12;
export const PITCH = TAU / N;
export const SWING = deg(18);
const C = [0, 1.0, 0];
const R = 1.75;
const GAP = 0.45; // 兩輪離中間的距離
const STAFF_Y = C[1] - R - 0.32;

/** 擺軸累計擺動 v → 擺軸角、擒縱輪轉角(逆時針為正) */
export function twin(v) {
  return { staff: swing(v, -SWING, SWING), wheel: escapeStep(v, -SWING, SWING, PITCH / 2, 0.5) };
}

const wheel = (z, offset) => [
  { kind: "plate", shape: { ...ratchetShape({ teeth: N, outer: R, inner: R - 0.45, dir: 1 }), holes: [circle(R - 0.62).reverse()] }, thickness: 0.1, at: [0, 0, z], angle: offset },
  ...[0, 1, 2].map((i) => ({ kind: "box", size: [R - 0.62, 0.1, 0.08], at: [((R - 0.62) / 2) * Math.cos((i * TAU) / 3 + 0.4), ((R - 0.62) / 2) * Math.sin((i * TAU) / 3 + 0.4), z], angle: (i * TAU) / 3 + 0.4 })),
];

export function twinWheels(figure, direction) {
  return {
    figure,
    parts: [
      {
        id: "wheels",
        kind: "group",
        center: C,
        spin: R,
        pieces: [...wheel(GAP, 0), ...wheel(-GAP, PITCH / 2), { kind: "cylinder", radius: 0.18, length: 2 * GAP + 0.3 }, { kind: "cylinder", radius: 0.08, length: 3.0 }, { kind: "box", size: [0.14, 0.14, 0.14], at: [R - 0.75, 0, GAP + 0.08], accent: true }],
      },
      {
        id: "staff",
        kind: "group",
        axis: X,
        center: [0, STAFF_Y, 0],
        arrow: false,
        pieces: [
          { kind: "cylinder", radius: 0.08, length: 4.0 },
          // 半圓形叉瓦:板面與擺軸垂直、平邊朝上,左右兩端伸到兩個輪的齒
          { kind: "plate", shape: shape([...arcPoints(GAP + 0.08, Math.PI, TAU)], [circle(0.1).reverse()]), thickness: 0.16 },
        ],
      },
    ],
    driver: { part: "staff", type: "rotation", cycle: [-SWING, SWING] },
    target: "wheels", // 雙擒縱輪
    view: { direction },
    pose(v) {
      const t = twin(v);
      return { parts: { staff: { angle: t.staff }, wheels: { angle: t.wheel } }, readouts: [] };
    },
  };
}
