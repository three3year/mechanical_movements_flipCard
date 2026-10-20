// 第 430 種:上射式水車。水由左上的水槽流到輪頂,注入水斗;裝滿水的一側較重,輪子順時針轉
// (原圖箭頭),水斗轉到下方時把水倒進尾水。
// 原文只有名稱;「下降側的水斗裝水、上升側空著」是上射式水車以水重驅動的原理(推斷,依原圖畫法)。
// 主動件是虛擬的「進程」:水已帶著水車轉了幾圈。水流以沿固定路徑移動的點表示(ADR-0002)。
import { TAU, deg, polar, wrap } from "./kit.js";
import { stream, ramp } from "./flow.js";
import { shape, arcPoints } from "./shapes.js";
import { pedestal } from "./supports.js";

const R = { outer: 2.05, inner: 1.5, hub: 0.32 };
const BUCKETS = 16;
const LEAN = deg(24); // 水斗隔板外端往逆時針側傾,下降側的水斗開口朝上
const DEPTH = 0.5; // 輪寬
const FLUME = { from: [-3.4, 3.0, 0], to: [0.32, 2.24, 0] };
const FLUME_ANGLE = Math.atan2(FLUME.to[1] - FLUME.from[1], FLUME.to[0] - FLUME.from[0]);
const FLUME_FLOOR = { at: [-1.55, 2.55], thickness: 0.12 }; // 槽底板的中心與厚度
const flumeBottomAt = (x) => FLUME_FLOOR.at[1] + (x - FLUME_FLOOR.at[0]) * Math.tan(FLUME_ANGLE) - FLUME_FLOOR.thickness / 2 / Math.cos(FLUME_ANGLE);
const SLAB_TOP = -2.595; // 尾水渠底的頂面
const SPEED = TAU * 1.85; // 進程每一圈水流過的距離(與水斗的線速度相同)

// 水流路徑:沿水槽流下,在槽口落入輪頂右側的水斗
export const INFLOW = [
  [-3.3, 2.97, 0],
  [0.3, 2.25, 0],
  [0.48, 2.15, 0],
  [0.6, 1.95, 0],
];
// 傾倒的水:從右下方的水斗落到尾水,再沿尾水渠流走
export const SPILL = [
  [1.42, -1.25, 0],
  [1.6, -1.8, 0],
  [1.75, -2.35, 0],
  [3.0, -2.45, 0],
];

/** 水斗離開輪頂後轉過的角度(度)→ 存量:槽口下方裝水,右側滿載,轉到下方時倒空 */
export const bucketFill = (travelled) => ramp(travelled, 4, 30, 118, 165);

const bucketAngle = (i, wheel) => wheel + (i + 0.5) * (TAU / BUCKETS);

// 隔板:從內緣到外緣、外端往逆時針側傾
const partitions = Array.from({ length: BUCKETS }, (_, i) => {
  const a = (i * TAU) / BUCKETS;
  const p0 = polar(R.inner, a);
  const p1 = polar(R.outer - 0.02, a + LEAN);
  const mid = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, 0];
  return {
    kind: "box",
    size: [Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), 0.05, DEPTH * 0.95],
    at: mid,
    angle: Math.atan2(p1[1] - p0[1], p1[0] - p0[0]),
  };
});

// 左側與下方的石砌渠牆(弧形貼著輪)
const wall = shape([
  ...arcPoints(R.outer + 0.15, deg(150), deg(285)),
  ...arcPoints(R.outer + 0.55, deg(285), deg(150)),
]);
// 左邊的石墩:從渠牆往上到水槽底,水槽擱在它頂上(原圖水槽擱在左邊的石砌牆頂;墩頂是平的、槽底有斜度,
// 以墩的中線貼住槽底,兩側差不到 0.05、都在槽底板的厚度裡)
const PIER_X = -2.45;
const PIER_TOP = flumeBottomAt(PIER_X);
export const PIER = { kind: "box", size: [0.4, PIER_TOP + 0.15, DEPTH * 1.3], at: [PIER_X, (PIER_TOP - 0.15) / 2, 0] };

export default {
  figure: 430,
  parts: [
    {
      id: "axle",
      kind: "cylinder",
      center: [0, 0, 0],
      radius: 0.08,
      length: 1.6, // 水車的固定軸(推斷;兩端架在渠底的軸承座上)
    },
    {
      id: "wheel",
      kind: "pulley",
      style: "spoked",
      spokes: 6,
      center: [0, 0, 0],
      radius: R.inner,
      width: DEPTH,
      pieces: [
        { kind: "cylinder", radius: R.outer, inner: R.outer - 0.06, length: DEPTH * 0.3, at: [0, 0, -DEPTH * 0.35] },
        { kind: "cylinder", radius: R.outer, inner: R.inner, length: 0.04, at: [0, 0, -DEPTH / 2] },
        ...partitions,
      ],
    },
    {
      id: "works",
      kind: "group",
      pieces: [
        // 水槽:槽底與兩側
        { kind: "box", size: [3.8, FLUME_FLOOR.thickness, DEPTH * 1.1], at: [...FLUME_FLOOR.at, 0], angle: FLUME_ANGLE },
        { kind: "box", size: [3.8, 0.35, 0.06], at: [-1.55, 2.68, -DEPTH * 0.58], angle: FLUME_ANGLE },
        { kind: "plate", shape: wall, thickness: DEPTH * 1.3 },
        PIER,
        // 尾水渠底(寬到放得下兩座軸承座)
        { kind: "box", size: [4.8, 0.25, 2.2], at: [0.6, SLAB_TOP - 0.125, 0] },
        // 固定軸兩端的軸承座(推斷;原圖的軸藏在石砌的側牆裡,側牆沒畫,改立在渠底上),底板擱在渠底上
        ...pedestal({ at: [0, 0], z: 0.75, bore: 0.08, floor: SLAB_TOP + 0.18 }),
        ...pedestal({ at: [0, 0], z: -0.75, bore: 0.08, floor: SLAB_TOP + 0.18 }),
      ],
    },
    // 尾水
    { id: "tail", kind: "fill", fluid: "water", center: [2.4, -2.45, 0], size: [1.6, 0.2, DEPTH * 1.1], level: 1 },
    ...Array.from({ length: BUCKETS }, (_, i) => ({ id: `water${i}`, kind: "fill", fluid: "water", size: [0.32, 0.3, DEPTH * 0.8] })),
  ],
  powered: ["wheel"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.12 },
  target: "wheel",
  view: { direction: [0.06, 0.04, 1] },
  pose(progress) {
    const wheel = -TAU * progress; // 順時針
    const parts = { wheel: { angle: wheel } };
    for (let i = 0; i < BUCKETS; i++) {
      const a = bucketAngle(i, wheel);
      const travelled = (wrap(Math.PI / 2 - a) * 180) / Math.PI; // 離開輪頂後轉過的角度
      const at = polar(1.78, a);
      parts[`water${i}`] = { position: [at[0], at[1] - 0.02, 0], level: bucketFill(travelled) };
    }
    const travel = progress * SPEED;
    return {
      parts,
      flows: [
        { fluid: "water", points: stream(INFLOW, travel, { spacing: 0.2 }) },
        { fluid: "water", points: stream(SPILL, travel, { spacing: 0.18 }) },
      ],
      readouts: [],
    };
  },
};
