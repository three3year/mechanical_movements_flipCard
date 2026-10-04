// 第 431 種:下射式水車。原文只有名稱。
// 推斷(依原圖):左邊的閘門擋住上游的水,水從閘門底下衝出,沿渠底流過,衝擊輪子下方浸在水裡的浮板,
// 輪子逆時針轉(原圖箭頭)。主動件是虛擬的「進程」:水已帶著水車轉了幾圈。水流以沿固定路徑移動的點表示。
import { TAU, polar } from "./kit.js";
import { stream } from "./flow.js";

export const R = { rim: 1.45, float: 2.05 };
const FLOATS = 16;
const DEPTH = 0.6;
export const BED = -2.2; // 渠底
export const TAIL_LEVEL = -1.72; // 下游水面
const GATE_X = -2.6;
const GATE_BOTTOM = BED + 0.42;
const SPEED = TAU * 1.9; // 每圈水流過的距離(與浮板的線速度相同)

// 水流:從閘門後面往下,從閘門底下衝出,沿渠底流過輪子下方
export const FLOW = [
  [-3.9, -0.9, 0.1],
  [GATE_X - 0.3, BED + 0.25, 0.1],
  [GATE_X + 0.3, BED + 0.22, 0.1],
  [0, BED + 0.22, 0.1],
  [3.3, BED + 0.28, 0.1],
];

export default {
  figure: 431,
  parts: [
    {
      id: "axle",
      kind: "cylinder",
      center: [0, 0, 0],
      radius: 0.08,
      length: 1.6, // 水車的固定軸(軸承座沒畫,推斷)
    },
    {
      id: "wheel",
      kind: "pulley",
      style: "spoked",
      spokes: 8,
      center: [0, 0, 0],
      radius: R.rim,
      width: DEPTH,
      pieces: Array.from({ length: FLOATS }, (_, i) => {
        const a = (i * TAU) / FLOATS;
        const mid = polar((R.rim + R.float) / 2 - 0.05, a);
        return { kind: "box", size: [R.float - R.rim + 0.1, 0.07, DEPTH * 0.9], at: mid, angle: a };
      }),
    },
    {
      id: "works",
      kind: "group",
      pieces: [
        // 渠底
        { kind: "box", size: [7.6, 0.25, DEPTH * 1.6], at: [-0.45, BED - 0.125, 0] },
        // 閘門與兩側立柱、橫樑、上面的螺桿手柄
        { kind: "box", size: [0.12, 2.3, DEPTH * 1.3], at: [GATE_X, GATE_BOTTOM + 1.15, 0] },
        { kind: "box", size: [0.14, 3.4, 0.14], at: [GATE_X - 0.15, BED + 1.7, DEPTH * 0.72] },
        { kind: "box", size: [0.14, 3.4, 0.14], at: [GATE_X + 0.15, BED + 1.7, DEPTH * 0.72] },
        { kind: "box", size: [0.5, 0.12, 0.2], at: [GATE_X, BED + 3.45, DEPTH * 0.72] },
        { kind: "cylinder", radius: 0.04, length: 1.0, axis: [0, 1, 0], at: [GATE_X, BED + 3.2, 0] },
        { kind: "box", size: [1.0, 0.07, 0.07], at: [GATE_X, BED + 3.7, 0], accent: true },
      ],
    },
    { id: "head", kind: "fill", fluid: "water", center: [-3.6, BED + 1.0, 0], size: [1.9, 2.0, DEPTH * 1.2], level: 0.62 },
    { id: "tail", kind: "fill", fluid: "water", center: [0.4, BED + 0.24, 0], size: [5.8, 0.48, DEPTH * 1.2], level: 1 },
  ],
  powered: ["wheel"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.12 },
  target: "wheel",
  view: { direction: [0.06, 0.04, 1] },
  pose(progress) {
    return {
      parts: { wheel: { angle: TAU * progress } }, // 逆時針:下方的浮板隨水往右
      flows: [{ fluid: "water", points: stream(FLOW, progress * SPEED, { spacing: 0.2 }) }],
      readouts: [],
    };
  },
};

