// 第 368 種:在圓筒上畫螺旋線。轉動斜齒輪,經上方水平軸上的正齒輪把旋轉傳給直立的圓筒;同一個正齒輪也與一根
// 直立的齒條咬合,齒條帶著畫線的標記點從圓筒的一端移到另一端。圓筒轉、標記點同時等速上下移,在筒面畫出螺旋線。
// 主動件是斜齒輪(以曲柄轉動)。螺旋線由 pose 回傳(畫到目前為止的部分),隨圓筒一起轉。
// 推斷:圓筒與正齒輪同速(1 : 1)、標記點每轉移動的距離(螺距);各部配置依原圖。
import { Y, TAU, clamp } from "./kit.js";

const CYL = { center: [-0.4, -1.4, 0], r: 0.9, h: 2.4 };
const GEAR_R = 0.55;
export const PITCH = 0.55; // 圓筒每轉一圈,標記點移動的距離(= 正齒輪節圓周長 × 齒條傳動的比例)
export const RANGE = [-((CYL.h - 0.3) / PITCH) * TAU, 0]; // 正齒輪順時針轉(負角),左側的齒條往上
const POINT_X = CYL.center[0] + CYL.r; // 標記點貼在圓筒右側

/** 主動量 a(正齒輪轉角,順時針為負)→ 標記點的高度 */
export const marker = (a) => CYL.center[1] - CYL.h / 2 + 0.15 - (PITCH * clamp(a, ...RANGE)) / TAU;

export default {
  figure: 368,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [4.8, 0.12, 0.6], at: [0.2, 0.15, -0.3] },
        { kind: "box", size: [0.15, 3.0, 0.15], at: [1.15, -1.2, -0.4] },
        { kind: "box", size: [3.2, 0.12, 1.4], at: [-0.2, -2.75, 0] },
      ],
    },
    {
      id: "cylinder",
      kind: "group",
      axis: Y,
      center: CYL.center,
      spin: CYL.r,
      spinOffset: -CYL.h / 2 + 0.1,
      pieces: [
        { kind: "cylinder", radius: CYL.r, length: CYL.h, mark: true },
        { kind: "cylinder", radius: 0.08, length: CYL.h + 3.2, at: [0, 0, 1.6] },
      ],
    },
    // 上方的齒輪組:斜齒輪(曲柄)、水平軸上的正齒輪
    {
      id: "gears",
      kind: "group",
      center: [-0.4, 1.2, 0],
      axis: Y,
      spin: GEAR_R + 0.1,
      pieces: [
        { kind: "gear", teeth: 20, radius: GEAR_R + 0.25, cone: Math.PI / 4, width: 0.2, at: [0, 0, -0.3] },
        { kind: "cylinder", radius: 0.06, length: 0.9, at: [0, 0, 0.1] },
      ],
    },
    {
      id: "spur",
      kind: "gear",
      center: [POINT_X + 0.6, 1.2, 0],
      teeth: 18,
      radius: GEAR_R,
      width: 0.3,
      pieces: [{ kind: "cylinder", radius: 0.06, length: 1.2, at: [0, 0, 0.3] }, { kind: "box", size: [0.1, 0.55, 0.1], at: [0, -0.3, 0.85] }, { kind: "cylinder", radius: 0.06, length: 0.3, at: [0, -0.55, 1.0], accent: true }],
    },
    // 直立的齒條,下端帶著標記點
    {
      id: "rack",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "rack", teeth: 18, pitch: (TAU * GEAR_R) / 18, width: 0.2, depth: 0.12, angle: -Math.PI / 2, at: [0, 0, 0] },
        { kind: "box", size: [0.5, 0.08, 0.08], at: [-0.25, -1.6, 0] },
        { kind: "lathe", axis: [-1, 0, 0], profile: [[0, 0], [0.06, 0.08], [0.06, 0.3], [0, 0.3]], at: [-0.42, -1.6, 0] },
      ],
    },
    { id: "helix", kind: "trace" },
  ],
  driver: { part: "spur", type: "rotation", range: RANGE, initial: 0, speed: -1.2 },
  view: { direction: [0.25, 0.15, 1] },
  pose(a0) {
    const a = clamp(a0, ...RANGE);
    const y = marker(a);
    // 已畫的螺旋線:在轉角 a' 時畫在圓筒正右方的點,現在隨圓筒轉了 a − a'
    const n = Math.max(2, Math.round((Math.abs(a) / TAU) * 48));
    const points = Array.from({ length: n + 1 }, (_, i) => {
      const ai = (a * i) / n;
      const turn = -(a - ai); // 圓筒順時針(從上看)轉
      return [CYL.center[0] + (CYL.r + 0.02) * Math.cos(turn), marker(ai), (CYL.r + 0.02) * Math.sin(turn) * -1];
    });
    return {
      parts: {
        spur: { angle: a },
        gears: { angle: -a },
        cylinder: { angle: -a },
        rack: { position: [POINT_X + 0.6 - GEAR_R + 0.0, y + 1.6, 0.0] },
      },
      paths: { helix: { points, closed: false } },
      readouts: [],
    };
  },
};
