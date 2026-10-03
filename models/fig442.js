// 第 442 種:一種起源古老、至今仍在提洛爾的埃薩赫河上用來抽水的機器(戽水車)。水流使輪保持轉動,輪周的罐子
// 依序浸進水裡、裝滿,然後倒進水流上方的水槽。
// 主動件是虛擬的「進程」:水流已帶著輪轉了幾圈。
// 推斷:罐子固定在輪緣、口朝輪的前進方向(切線方向),所以在底部順著水流舀滿,升到頂端越過最高點後口朝下,
// 把水倒進左上方的水槽;輪逆時針轉(底部隨水流往右)。
import { TAU, deg, polar, wrap } from "./kit.js";
import { stream, ramp } from "./flow.js";

export const RIM = 2.1;
const POTS = 12;
export const RIVER = -1.45; // 水面
const SPEED = TAU * 1.5;

/** 罐子在輪上的角度 a → 存量:在底部浸水裝滿,滿著上升,過了頂端就倒進水槽 */
export function potLevel(a) {
  const from = (wrap(a + deg(120)) * 180) / Math.PI; // 從底部前方(−120°)逆時針轉過的角度
  return ramp(from, 15, 50, 205, 235);
}

export default {
  figure: 442,
  parts: [
    {
      id: "wheel",
      kind: "pulley",
      style: "spoked",
      spokes: 8,
      center: [0, 0, 0],
      radius: RIM,
      width: 0.3,
      pieces: Array.from({ length: POTS }, (_, i) => {
        const a = (i * TAU) / POTS;
        // 罐子:口朝切線(逆時針)方向
        return { kind: "lathe", profile: [[0, -0.22], [0.16, -0.2], [0.2, 0.05], [0.12, 0.2], [0.13, 0.24], [0.1, 0.24], [0.09, 0.2]], axis: [-Math.sin(a), Math.cos(a), 0], at: polar(RIM + 0.05, a, 0.32) };
      }),
    },
    {
      id: "works",
      kind: "group",
      pieces: [
        // 河岸、輪軸的架子、水槽
        { kind: "box", size: [7.0, 0.3, 1.6], at: [0, -2.75, 0] },
        { kind: "box", size: [0.25, 2.6, 0.25], at: [0, -1.35, -0.55] },
        { kind: "cylinder", radius: 0.08, length: 1.3, at: [0, 0, -0.1] },
        { kind: "box", size: [3.4, 0.14, 0.5], at: [-2.2, RIM + 0.35, 0.32] },
        { kind: "box", size: [3.4, 0.25, 0.06], at: [-2.2, RIM + 0.47, 0.6] },
        { kind: "box", size: [0.14, 2.3, 0.14], at: [-3.6, RIM - 0.85, 0.32] },
      ],
    },
    { id: "river", kind: "fill", fluid: "water", center: [0, (RIVER - 2.6) / 2, 0], size: [6.8, RIVER + 2.6, 1.4], level: 1 },
    ...Array.from({ length: POTS }, (_, i) => ({ id: `water${i}`, kind: "fill", fluid: "water", shape: "cylinder", size: [0.28, 0.32, 0] })),
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.1 },
  view: { direction: [0.3, 0.15, 1] },
  pose(progress) {
    const wheel = TAU * progress; // 逆時針
    const parts = { wheel: { angle: wheel } };
    for (let i = 0; i < POTS; i++) {
      const a = wheel + (i * TAU) / POTS;
      const at = polar(RIM + 0.05, a, 0.32);
      // 水跟著罐子傾斜(罐口朝切線方向)
      parts[`water${i}`] = { position: [at[0] - 0.04 * Math.cos(a), at[1] - 0.04 * Math.sin(a), 0.32], angle: a, level: potLevel(a) };
    }
    const travel = progress * SPEED;
    const pour = [polar(RIM + 0.2, deg(108), 0.32), [-1.0, RIM + 0.45, 0.32], [-3.7, RIM + 0.45, 0.32]];
    const riverPath = [[-3.3, RIVER - 0.3, 0.6], [3.3, RIVER - 0.3, 0.6]];
    return {
      parts,
      flows: [{ fluid: "water", points: [...stream(pour, travel, { spacing: 0.2 }), ...stream(riverPath, travel, { spacing: 0.3 })] }],
      readouts: [],
    };
  },
};

