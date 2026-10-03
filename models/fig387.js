// 第 387 種:有潮汐漲落的碼頭用的自動調整階梯。梯子的上端以樞軸接在碼頭上,下端放在浮在水面的小船上;踏階的一邊以樞軸接在
// 梯幫上,另一邊由吊在扶手木條上的桿件撐著(平行四邊形),所以不論梯子擺到什麼角度,踏階都保持水平。
// 主動件是虛擬的「水位」(平衡型):水位越低,梯子越陡。
// 推斷:梯子的長度與水位的範圍;小船以填色的水托著。
import { clamp } from "./kit.js";
import { shape, rect } from "./shapes.js";

const PIVOT = [2.0, 1.6, 0]; // 梯幫上端的樞軸(碼頭邊)
const LEN = 4.4; // 梯幫長
const RAIL_UP = 1.0; // 扶手在梯幫正上方的距離
const STEPS = 8;
const STEP_W = 0.45;
export const RANGE = [-2.2, 1.0]; // 水位
const BOAT_DROP = 0.15; // 梯子下端在水面上方的高度

/** 水位 h → 梯幫的角度(從樞軸往下斜到小船) */
export function ladder(h0) {
  const h = clamp(h0, ...RANGE);
  const drop = PIVOT[1] - (h + BOAT_DROP);
  const angle = Math.PI + Math.asin(drop / LEN); // 從樞軸指向左下
  return { h, angle, foot: [PIVOT[0] + LEN * Math.cos(angle), PIVOT[1] + LEN * Math.sin(angle), 0] };
}

export default {
  figure: 387,
  parts: [
    {
      id: "quay",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(rect(2.4, 4.2, 3.3, -0.5)), thickness: 1.2 },
        { kind: "box", size: [0.12, 1.6, 0.12], at: [2.1, 2.4, 0.4] },
        { kind: "box", size: [0.12, 1.6, 0.12], at: [4.3, 2.4, 0.4] },
        { kind: "box", size: [2.3, 0.1, 0.1], at: [3.2, 3.15, 0.4] },
        { kind: "box", size: [2.4, 0.08, 0.08], at: [3.2, 2.4, 0.4], angle: 0.6 },
        { kind: "box", size: [2.4, 0.08, 0.08], at: [3.2, 2.4, 0.4], angle: -0.6 },
      ],
    },
    { id: "water", kind: "fill", fluid: "water", center: [-1.5, -2.6, -1.0], size: [5.8, 3.8, 0.6], level: 0.5 }, // 水在梯子後方,看得到梯子
    { id: "boat", kind: "group", arrow: false, pieces: [{ kind: "plate", shape: shape([[-0.7, 0], [0.7, 0], [0.5, -0.3], [-0.5, -0.3]]), thickness: 1.2 }] },
    { id: "stringer", kind: "group", center: PIVOT, arrow: false, pieces: [{ kind: "box", size: [LEN, 0.12, 0.1], at: [LEN / 2, 0, 0.4] }, { kind: "box", size: [LEN, 0.12, 0.1], at: [LEN / 2, 0, -0.4] }] },
    { id: "rail", kind: "group", arrow: false, pieces: [{ kind: "box", size: [LEN, 0.1, 0.08], at: [LEN / 2, 0, 0.4] }] },
    ...Array.from({ length: STEPS }, (_, i) => ({ id: `step${i}`, kind: "plate", shape: shape(rect(STEP_W, 0.06, STEP_W / 2, 0)), thickness: 0.8, arrow: false })),
    ...Array.from({ length: STEPS }, (_, i) => ({ id: `hanger${i}`, kind: "link", width: 0.04, thickness: 0.04 })),
  ],
  driver: { type: "virtual", label: "水位", mode: "balance", range: RANGE, initial: 0.5 },
  view: { direction: [0.15, 0.12, 1] },
  pose(h0) {
    const l = ladder(h0);
    const c = Math.cos(l.angle);
    const s = Math.sin(l.angle);
    const parts = {
      stringer: { angle: l.angle },
      // 扶手:與梯幫平行,樞軸在梯幫樞軸的右上方 (STEP_W, RAIL_UP)——吊桿、踏階、梯幫、扶手構成平行四邊形
      rail: { position: [PIVOT[0] + STEP_W, PIVOT[1] + RAIL_UP, 0], angle: l.angle },
      boat: { position: [l.foot[0], l.h + 0.2, 0] },
      water: { level: (l.h - (-2.6 - 1.9)) / 3.8 },
    };
    for (let i = 0; i < STEPS; i++) {
      const t = ((i + 0.5) / STEPS) * LEN;
      const at = [PIVOT[0] + t * c, PIVOT[1] + t * s, 0];
      // 踏階:一邊以樞軸接在梯幫上,保持水平,往右伸 STEP_W;另一邊由吊桿吊在扶手上
      parts[`step${i}`] = { position: at, angle: 0 };
      const edge = [at[0] + STEP_W, at[1], 0.3];
      parts[`hanger${i}`] = { from: edge, to: [edge[0], edge[1] + RAIL_UP, 0.3] };
    }
    return { parts, readouts: [] };
  },
};
