// 第 460 種:Fairbairn 的舀水斗,把水抬高一小段。舀斗經連桿接到槓桿(或單動引擎的樑)的末端;
// 把連桿的上端放進圖中不同的凹槽,可以調整抬起的距離。
// 主動件是右上的槓桿(上下擺動);狀態按鈕選連桿上端放在哪一個凹槽。
// 推斷:舀斗的一端鉸在左岸上,另一端是封閉的斗,放下時浸進渠裡舀水,抬起時水沿舀斗流向鉸點、倒到左岸上。
// 凹槽照 525 px 原圖是槓桿左端下緣的一排開口缺口:連桿上端的銷掛在缺口底,靠舀斗的重量留在缺口裡。
// 偏離插圖:槓桿擺 50°(原圖只畫放下的姿勢):要讓舀斗抬到最高時末端高過鉸點、水流得到鉸點,
// 以原圖的比例(連桿接在舀斗八成處、凹槽離支點 1.2–1.8)槓桿得擺這麼多。
import { deg } from "./kit.js";
import { circleCircle } from "./linkage.js";
import { stroke } from "./pump.js";
import { stream } from "./flow.js";
import { shape, arcPoints, circle } from "./shapes.js";

export const PIVOT = [-1.35, 0.45, 0]; // 舀斗的鉸點(左岸)
export const SCOOP = 2.9;
const ATTACH = 2.3; // 連桿接在舀斗上的位置
export const LEVER_PIVOT = [2.1, 1.35, 0];
export const NOTCHES = { near: 1.2, middle: 1.5, far: 1.8 }; // 凹槽離槓桿支點的距離
export const ARM_W = 0.28; // 槓桿的寬
const NOTCH_R = 0.06; // 缺口的半徑(連桿上端的銷掛在裡面)
const ARM_END = NOTCHES.far + 0.22; // 槓桿左端
const PITMAN = 1.5;
export const SWING = [deg(190), deg(140)]; // 槓桿:低 → 高(連桿那一端的方向角)
export const WATER = -0.5;

/** 槓桿轉 psi 時,放在凹槽 b 的連桿上端:缺口底在槓桿的下緣 */
export const leverEnd = (psi, b) => {
  const a = psi - Math.PI;
  const [lx, ly] = [-b, -ARM_W / 2];
  return [LEVER_PIVOT[0] + lx * Math.cos(a) - ly * Math.sin(a), LEVER_PIVOT[1] + lx * Math.sin(a) + ly * Math.cos(a), 0];
};
/** 槓桿轉 psi、連桿放在凹槽 b → 舀斗的角度(負的是往下傾) */
export function scoop(psi, notch = "middle") {
  const L = leverEnd(psi, NOTCHES[notch]);
  const S = circleCircle(L, PITMAN, PIVOT, ATTACH, 1).point;
  return { L, S, beta: Math.atan2(S[1] - PIVOT[1], S[0] - PIVOT[0]) };
}

// 槓桿的外形(局部:支點在原點,臂往 −x):下緣從左到右,每個凹槽處往上切一個半圓缺口;右端伸過支點
const notchShape = (() => {
  const h = ARM_W / 2;
  const bottom = [[-ARM_END, -h]];
  for (const b of Object.values(NOTCHES).sort((p, q) => q - p)) bottom.push(...arcPoints(NOTCH_R, Math.PI, 0, -b, -h));
  return shape([...bottom, [0.25, -h], [0.25, h], [-ARM_END, h]], [circle(0.05).reverse()]);
})();

export default {
  figure: 460,
  parts: [
    {
      id: "banks",
      kind: "group",
      pieces: [
        // 左岸、V 形的渠、右岸與槓桿的座
        { kind: "plate", shape: shape([[-3.0, 0.3], [-1.25, 0.3], [-0.2, -1.15], [1.5, -1.15], [1.9, 0.3], [3.0, 0.3], [3.0, -1.6], [-3.0, -1.6]]), thickness: 1.4 },
        { kind: "box", size: [0.3, 1.2, 0.44], at: [LEVER_PIVOT[0], LEVER_PIVOT[1] - 0.45, 0] }, // 支柱在槓桿的背面
        { kind: "cylinder", radius: 0.05, length: 0.3, at: [LEVER_PIVOT[0], LEVER_PIVOT[1], 0.2] }, // 槓桿的樞軸銷:從支柱穿過槓桿
        // 鉸座:底塊在舀斗下方留出擺動的空隙,兩片耳板夾著舀斗,鉸銷穿過去
        { kind: "box", size: [0.25, 0.1, 0.8], at: [PIVOT[0], PIVOT[1] - 0.2, 0] },
        { kind: "box", size: [0.12, 0.3, 0.05], at: [PIVOT[0], PIVOT[1] - 0.1, 0.36] },
        { kind: "box", size: [0.12, 0.3, 0.05], at: [PIVOT[0], PIVOT[1] - 0.1, -0.36] },
        { kind: "cylinder", radius: 0.035, length: 0.78, at: PIVOT },
      ],
    },
    { id: "channel", kind: "fill", fluid: "water", center: [0.35, (WATER - 1.15) / 2, 0], size: [2.0, WATER + 1.15, 1.2], level: 1 },
    {
      id: "scoop",
      posed: true, // 姿勢由狀態決定:切換狀態時轉到新的姿勢,不接續轉角
      kind: "plate",
      shape: shape([[0, -0.04], [SCOOP, -0.04], [SCOOP, 0.04], [0, 0.04]]),
      thickness: 0.6,
      arrow: false,
      pieces: [
        { kind: "box", size: [SCOOP, 0.3, 0.05], at: [SCOOP / 2, 0.15, 0.3] },
        { kind: "box", size: [SCOOP, 0.3, 0.05], at: [SCOOP / 2, 0.15, -0.3] },
        { kind: "box", size: [0.08, 0.45, 0.6], at: [SCOOP, 0.2, 0] },
      ],
    },
    { id: "scoopWater", posed: true, kind: "fill", fluid: "water", size: [0.8, 0.28, 0.55], level: 0 },
    { id: "lever", kind: "plate", shape: notchShape, thickness: 0.1, arrow: false, pieces: [{ kind: "box", size: [0.5, 0.18, 0.12], at: [0.45, 0, 0] }] },
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
  driver: { part: "lever", type: "rotation", cycle: SWING },
  target: "scoop",
  view: { direction: [0.15, 0.12, 1] },
  pose(v, state = "middle") {
    const { at, forward } = stroke(v, ...SWING);
    const s = scoop(at, state);
    const rising = forward;
    const end = [PIVOT[0] + SCOOP * Math.cos(s.beta), PIVOT[1] + SCOOP * Math.sin(s.beta), 0];
    const inWater = end[1] < WATER + 0.1;
    const along = (d) => [PIVOT[0] + d * Math.cos(s.beta), PIVOT[1] + d * Math.sin(s.beta), 0.05];
    // 抬起後舀斗往鉸點下斜,水才沿斗流向鉸點、倒到岸上
    const pouring = rising && !inWater && s.beta > 0;
    const flows = pouring ? [{ fluid: "water", points: stream([along(SCOOP - 0.3), along(0.1), [PIVOT[0] - 0.4, PIVOT[1] - 0.1, 0.05], [PIVOT[0] - 1.4, 0.35, 0.05]], v * 6, { spacing: 0.16 }) }] : [];
    return {
      parts: {
        scoop: { position: PIVOT, angle: s.beta },
        scoopWater: { position: [...along(SCOOP - 0.45).slice(0, 2), 0], angle: s.beta, level: rising || inWater ? 1 : 0 },
        lever: { position: [LEVER_PIVOT[0], LEVER_PIVOT[1], 0.27], angle: at - Math.PI },
        pitman: { from: [s.L[0], s.L[1], 0.35], to: [s.S[0], s.S[1], 0.35] },
      },
      flows,
      readouts: [{ label: "舀斗", value: pouring ? "抬起:水流向鉸點倒到岸上" : rising ? "抬起中" : "放下:浸進渠裡舀水" }],
    };
  },
};
