// 第 460 種:Fairbairn 的舀水斗,把水抬高一小段。舀斗經連桿接到槓桿(或單動引擎的樑)的末端;
// 把連桿的上端放進圖中不同的凹槽,可以調整抬起的距離。
// 主動件是右上的槓桿(上下擺動);狀態按鈕選連桿上端放在哪一個凹槽。
// 推斷:舀斗的一端鉸在左岸上,另一端是封閉的斗,放下時浸進渠裡舀水,抬起時水沿舀斗流向鉸點、倒到左岸上。
import { deg } from "./kit.js";
import { circleCircle } from "./linkage.js";
import { stroke } from "./pump.js";
import { stream } from "./flow.js";
import { shape, thickLine, circle } from "./shapes.js";

export const PIVOT = [-1.35, 0.45, 0]; // 舀斗的鉸點(左岸)
export const SCOOP = 2.9;
const ATTACH = 2.3; // 連桿接在舀斗上的位置
export const LEVER_PIVOT = [2.1, 1.35, 0];
export const NOTCHES = { near: 0.95, middle: 1.15, far: 1.35 }; // 凹槽離槓桿支點的距離
const PITMAN = 1.62;
export const SWING = [deg(202), deg(178)]; // 槓桿:低 → 高
export const WATER = -0.5;

const leverEnd = (psi, b) => [LEVER_PIVOT[0] + b * Math.cos(psi), LEVER_PIVOT[1] + b * Math.sin(psi), 0];
/** 槓桿轉 psi、連桿放在凹槽 b → 舀斗的角度(負的是往下傾) */
export function scoop(psi, notch = "middle") {
  const L = leverEnd(psi, NOTCHES[notch]);
  const S = circleCircle(L, PITMAN, PIVOT, ATTACH, 1).point;
  return { L, S, beta: Math.atan2(S[1] - PIVOT[1], S[0] - PIVOT[0]) };
}

const notchShape = shape(
  thickLine([[0, 0], [-1.55, 0]], 0.28),
  [circle(0.06).reverse(), ...Object.values(NOTCHES).map((b) => circle(0.06, -b, 0.05).reverse())],
);

export default {
  figure: 460,
  parts: [
    {
      id: "banks",
      kind: "group",
      pieces: [
        // 左岸、V 形的渠、右岸與槓桿的座
        { kind: "plate", shape: shape([[-3.0, 0.3], [-1.25, 0.3], [-0.2, -1.15], [0.9, -1.15], [1.6, 0.3], [3.0, 0.3], [3.0, -1.6], [-3.0, -1.6]]), thickness: 1.4 },
        { kind: "box", size: [0.3, 1.0, 0.3], at: [LEVER_PIVOT[0], LEVER_PIVOT[1] - 0.55, 0] },
        { kind: "box", size: [0.25, 0.15, 0.6], at: [PIVOT[0], PIVOT[1] - 0.12, 0] },
      ],
    },
    { id: "channel", kind: "fill", fluid: "water", center: [0.35, (WATER - 1.15) / 2, 0], size: [2.0, WATER + 1.15, 1.2], level: 1 },
    {
      id: "scoop",
      kind: "plate",
      shape: shape(thickLine([[0, 0], [SCOOP, 0]], 0.08)),
      thickness: 0.6,
      arrow: false,
      pieces: [
        { kind: "box", size: [SCOOP, 0.3, 0.05], at: [SCOOP / 2, 0.15, 0.3] },
        { kind: "box", size: [SCOOP, 0.3, 0.05], at: [SCOOP / 2, 0.15, -0.3] },
        { kind: "box", size: [0.08, 0.45, 0.6], at: [SCOOP, 0.2, 0] },
      ],
    },
    { id: "scoopWater", kind: "fill", fluid: "water", size: [0.8, 0.28, 0.55], level: 0 },
    { id: "lever", kind: "plate", shape: notchShape, thickness: 0.1, arrow: false, pieces: [{ kind: "box", size: [0.5, 0.18, 0.12], at: [0.3, 0, 0] }] },
    { id: "pitman", kind: "link", width: 0.1, thickness: 0.06 },
  ],
  states: {
    initial: "middle",
    options: [
      { id: "near", label: "近的凹槽(抬得少)" },
      { id: "middle", label: "中間的凹槽" },
      { id: "far", label: "遠的凹槽(抬得多)" },
    ],
  },
  driver: { part: "lever", grips: ["scoop"], type: "rotation", cycle: SWING },
  target: "scoop",
  view: { direction: [0.15, 0.12, 1] },
  pose(v, state = "middle") {
    const { at, forward } = stroke(v, ...SWING);
    const s = scoop(at, state);
    const rising = forward;
    const end = [PIVOT[0] + SCOOP * Math.cos(s.beta), PIVOT[1] + SCOOP * Math.sin(s.beta), 0];
    const inWater = end[1] < WATER + 0.1;
    const along = (d) => [PIVOT[0] + d * Math.cos(s.beta), PIVOT[1] + d * Math.sin(s.beta), 0.05];
    const flows = rising && !inWater ? [{ fluid: "water", points: stream([along(SCOOP - 0.3), along(0.1), [PIVOT[0] - 0.4, PIVOT[1] - 0.1, 0.05], [PIVOT[0] - 1.4, 0.35, 0.05]], v * 6, { spacing: 0.16 }) }] : [];
    return {
      parts: {
        scoop: { position: PIVOT, angle: s.beta },
        scoopWater: { position: [...along(SCOOP - 0.45).slice(0, 2), 0], angle: s.beta, level: rising || inWater ? 1 : 0 },
        lever: { position: LEVER_PIVOT, angle: at - Math.PI },
        pitman: { from: [s.L[0], s.L[1], 0.35], to: [s.S[0], s.S[1], 0.35] },
      },
      flows,
      readouts: [{ label: "舀斗", value: rising ? "抬起:水流向鉸點倒到岸上" : "放下:浸進渠裡舀水" }],
    };
  },
};

