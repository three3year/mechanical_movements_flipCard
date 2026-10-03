// 第 496 種:紡棉、羊毛等時的牽伸與加撚。前面的牽伸羅拉 B 比後面的 A 轉得快,把通過兩者之間的棉條或粗紗中的纖維拉長(牽伸)。
// 紗從前羅拉通到紡紗機(throstle),紡紗機靠繞著紗管旋轉,把紗加撚並捲在紗管上。
// 主動件是虛擬的「進程」:機器運轉。
// 推斷:牽伸比 3(B 的表面速度是 A 的三倍,所以紗變細為三分之一);錠翼(倒 U 形)繞直立的錠子快轉加撚,
// 紗管轉得稍慢一點,差的轉數就把紗捲上去;粗紗以三段由粗到細的繩表示,各段以自己的速度前進。
import { TAU, Y } from "./kit.js";
import { shape, rect } from "./shapes.js";

export const DRAFT = 3;
const R = 0.28; // 羅拉半徑
const NIP_Y = 2.2;
export const A_X = -0.75;
export const B_X = 0.35;
const SPINDLE_X = 0.65;
const FLYER_TOP = 1.2;
export const FLYER_PER_TURN = 6; // A 轉一圈,錠翼轉幾圈(示意)

/** 進程 v → 兩對羅拉的轉角、三段紗的移動量、錠翼與紗管的轉角 */
export function spin(v) {
  const a = TAU * v;
  return { a, b: DRAFT * a, feed: R * a, out: DRAFT * R * a, flyer: FLYER_PER_TURN * a * DRAFT, bobbin: FLYER_PER_TURN * a * DRAFT * 0.93 };
}

const roller = (id, x, top, label) => ({ id, kind: "pulley", style: "disc", center: [x, NIP_Y + (top ? R : -R), 0], radius: R, width: 0.9, arrow: top, ...(label ? { label, labelOffset: [0, R + 0.15, 0.5] } : {}) });

export default {
  figure: 496,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [3.2, 0.12, 0.3], at: [-0.3, NIP_Y - 2 * R - 0.2, -0.5] },
        // 錠子的軸承座與錠盤
        { kind: "box", size: [1.2, 0.1, 0.5], at: [SPINDLE_X, -1.15, 0] },
        { kind: "box", size: [1.2, 0.1, 0.5], at: [SPINDLE_X, FLYER_TOP + 0.35, -0.35] },
      ],
    },
    roller("aTop", A_X, true, "A"),
    roller("aBottom", A_X, false),
    roller("bTop", B_X, true, "B"),
    roller("bBottom", B_X, false),
    { id: "roving", kind: "rope", radius: 0.08 },
    { id: "drafted", kind: "rope", radius: 0.05 },
    { id: "yarn", kind: "rope", radius: 0.025 },
    {
      id: "flyer",
      kind: "group",
      axis: Y,
      center: [SPINDLE_X, 0, 0],
      spin: 0.55,
      pieces: [
        // 錠子(局部 z 是直立方向)、倒 U 形的錠翼、下面的錠盤
        { kind: "cylinder", radius: 0.04, length: 2.6, at: [0, 0, 0.0] },
        { kind: "plate", shape: shape(rect(0.9, 0.06, 0, 0)), thickness: 0.06, rotation: [Math.SQRT1_2, 0, 0, Math.SQRT1_2], at: [0, 0, FLYER_TOP] },
        { kind: "box", size: [0.05, 0.05, 1.4], at: [0.43, 0, FLYER_TOP - 0.7] },
        { kind: "box", size: [0.05, 0.05, 1.4], at: [-0.43, 0, FLYER_TOP - 0.7] },
        { kind: "pulley", style: "disc", radius: 0.22, width: 0.12, at: [0, 0, -1.0] },
      ],
    },
    { id: "bobbin", kind: "lathe", axis: Y, center: [SPINDLE_X, -0.25, 0], profile: [[0.06, -0.55], [0.3, -0.55], [0.3, -0.5], [0.2, -0.45], [0.2, 0.55], [0.3, 0.6], [0.3, 0.65], [0.06, 0.65]], mark: true, arrow: false },
  ],
  powered: ["flyer"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.15 },
  target: "bobbin", // 紗被加撚後捲上去的紗管
  view: { direction: [0.15, 0.15, 1] },
  pose(v) {
    const s = spin(v);
    const nip = (x) => [x, NIP_Y, 0];
    return {
      parts: {
        aTop: { angle: -s.a },
        aBottom: { angle: s.a },
        bTop: { angle: -s.b },
        bBottom: { angle: s.b },
        flyer: { angle: s.flyer },
        bobbin: { angle: s.bobbin },
      },
      paths: {
        // 三段紗各以自己的速度往前走(粗紗慢、牽伸後快)
        roving: { points: [[-2.4, NIP_Y, 0], nip(A_X)], closed: false, phase: s.feed },
        drafted: { points: [nip(A_X), nip(B_X)], closed: false, phase: s.out },
        yarn: { points: [nip(B_X), [B_X + 0.15, NIP_Y - 0.4, 0], [SPINDLE_X, FLYER_TOP + 0.1, 0], [SPINDLE_X + 0.43 * Math.cos(s.flyer), FLYER_TOP - 0.2, -0.43 * Math.sin(s.flyer)], [SPINDLE_X + 0.2 * Math.cos(s.bobbin), -0.1, -0.2 * Math.sin(s.bobbin)]], closed: false, phase: s.out },
      },
      readouts: [
        { label: "牽伸比(B / A)", value: `${DRAFT} 倍` },
        { label: "錠翼 / 紗管", value: "錠翼快轉加撚,紗管稍慢、把紗捲上" },
      ],
    };
  },
};
