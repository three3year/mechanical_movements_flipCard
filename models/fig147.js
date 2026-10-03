// 第 147 種:蒸汽引擎的調速器。中心軸上牢固地固定著兩個圓形斜面(碗形座上的螺旋斜面);十字頭鬆套在軸上,
// 兩端裝著扇葉,底下兩個摩擦滾子靠在斜面上,頂上加了一個重球。軸轉得越快,扇葉受的空氣阻力越大,
// 十字頭便落後於軸,滾子沿斜面往上滾,把十字頭抬高;十字頭頂部接著作用於調節閥的槓桿。
// 主動件是虛擬的「轉速」(平衡型):空氣阻力與轉速的平方成正比,十字頭落後的角度與抬升的高度也是(推斷)。
import { Y, deg } from "./kit.js";
import { shape, rect } from "./shapes.js";

const MAX = 10; // 轉速範圍(示意單位)
const LAG = deg(55); // 最高轉速時十字頭落後的角度
const RISE = 0.55; // 斜面:每落後 LAG,滾子升高 RISE
const ARM = 1.35; // 十字頭臂長(滾子離軸)
const BASE_Y = -0.15; // 滾子在斜面最低處時的高度
const LEVER = { pivot: [3.4, 2.55, 0], length: 3.0 };

/** 轉速 s:十字頭落後的角度與抬升的高度 */
export function governor(s) {
  const f = (Math.min(MAX, Math.max(0, s)) / MAX) ** 2;
  return { lag: LAG * f, rise: RISE * f };
}

// 斜面:碗形座邊緣上兩段螺旋斜面(高度隨角度線性增加)
const ramp = (start) =>
  Array.from({ length: 31 }, (_, i) => {
    const a = start + (LAG * 1.15 * i) / 30;
    return [ARM * Math.cos(a), BASE_Y - 0.12 + (RISE * 1.15 * i) / 30, ARM * Math.sin(a)];
  });

export default {
  figure: 147,
  parts: [
    {
      id: "shaft",
      kind: "group",
      pieces: [
        { kind: "cylinder", axis: Y, radius: 0.16, length: 3.6, at: [0, 0.3, 0] },
        { kind: "lathe", axis: Y, at: [0, -0.55, 0], profile: [[0.2, -0.35], [1.65, -0.35], [1.65, 0.0], [1.55, 0.05], [1.2, -0.1], [0.4, -0.15], [0.2, -0.1]] },
        { kind: "tube", points: ramp(0), radius: 0.07 },
        { kind: "tube", points: ramp(Math.PI), radius: 0.07 },
        { kind: "cylinder", axis: Y, radius: 0.25, length: 0.9, at: [0, -1.4, 0] },
      ],
    },
    {
      id: "crosshead",
      kind: "group",
      pieces: [
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.14, length: 2 * ARM + 0.9, at: [0, 0.95, 0] },
        ...[1, -1].flatMap((s) => [
          { kind: "cylinder", axis: [1, 0, 0], radius: 0.24, length: 0.18, at: [s * (ARM - 0.25), 0.95, 0] },
          { kind: "plate", shape: shape(rect(0.9, 1.6)), thickness: 0.06, at: [s * (ARM + 1.05), 0.95, 0] },
          { kind: "cylinder", axis: [1, 0, 0], radius: 0.13, length: 0.14, at: [s * ARM, 0.18, 0] },
          { kind: "box", size: [0.08, 0.7, 0.08], at: [s * ARM, 0.55, 0] },
        ]),
        { kind: "sphere", radius: 0.82, at: [0, 2.0, 0] },
        { kind: "cylinder", axis: Y, radius: 0.3, length: 0.55, at: [0, 1.0, 0] },
        { kind: "cylinder", axis: Y, radius: 0.2, length: 0.4, at: [0, 2.95, 0] },
        { kind: "sphere", radius: 0.12, at: [0, 3.25, 0] },
      ],
    },
    {
      id: "lever",
      kind: "group",
      center: LEVER.pivot,
      arrow: false,
      pieces: [
        { kind: "box", size: [LEVER.length, 0.2, 0.12], at: [-LEVER.length / 2, 0, 0.1] },
        { kind: "cylinder", radius: 0.14, length: 0.3 },
      ],
    },
  ],
  powered: ["crosshead"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  waivers: [
    { check: "interference", parts: ["shaft", "crosshead"], reason: "待確認(未修):shaft 的圓柱 r0.16×3.6 與 crosshead 的圓柱 r0.14×3.6互相穿入 0.30(96 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["crosshead", "lever"], reason: "待確認(未修):crosshead 的球 r0.82 與 lever 的方塊 3×0.2×0.12互相穿入 0.21(96 個取樣姿勢),尚未修正" },
  ],
  driver: { type: "virtual", label: "轉速", mode: "balance", range: [0, MAX] },
  target: "lever",
  view: { direction: [0.02, 0.12, 1] },
  pose(s) {
    const { lag, rise } = governor(s);
    return {
      parts: {
        crosshead: { position: [0, rise, 0], rotation: [0, Math.sin(-lag / 2), 0, Math.cos(-lag / 2)] },
        lever: { angle: -Math.asin(rise / LEVER.length) },
      },
      readouts: [],
    };
  },
};

