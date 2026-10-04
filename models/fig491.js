// 第 491 種:絞盤。繞在絞盤鼓上的纜繩,靠插在絞盤頭孔裡的推桿使絞盤繞軸轉動而被收進。絞盤由裝在它下部的棘爪防止倒轉,
// 棘爪作用在底座上的圓形棘輪裡。
// 主動件是絞盤(推桿)。
// 推斷:鼓身中間細兩端粗;纜繩從鼓的一側切線離開,絞盤轉一圈收進鼓周長的繩;棘爪鉸在鼓的下緣,爪尖在棘齒上滑過、
// 每過一齒落下一次(倒轉時被齒擋住)。
import { TAU, Y, Z, quatAxisAngle, quatMul } from "./kit.js";
import { shape, polygon } from "./shapes.js";

export const DRUM_R = 0.55;
export const TEETH = 16;
const BASE_Y = -1.3;
const RATCHET_R = 0.95;
const PAWL_AT = 0.8; // 棘爪鉸點離軸

/** 絞盤轉 theta(從上往下看逆時針為正)→ 收進的纜繩長、棘爪抬起的角度 */
export function capstan(theta) {
  const tooth = TAU / TEETH;
  const phase = (((theta % tooth) + tooth) % tooth) / tooth; // 在一齒裡走了多少
  return { hauled: DRUM_R * theta, lift: 0.4 * phase };
}

// 鼓的剖面:上下粗、中間細的腰身;絞盤頭(插推桿的那一段)另成一段,兩段是同一個剛體
const drumProfile = [[0, -1.05], [0.75, -1.05], [0.75, -0.85], [0.62, -0.7], [DRUM_R, -0.2], [DRUM_R, 0.25], [0.68, 0.6], [0.68, 0.75], [0, 0.75]];
const headProfile = [[0, 0.75], [0.85, 0.75], [0.85, 1.05], [0, 1.05]];

// 底座上的棘輪(鋸齒)
const ratchet = Array.from({ length: TEETH * 2 }, (_, i) => {
  const a = (Math.floor(i / 2) * TAU) / TEETH + (i % 2 ? (TAU / TEETH) * 0.85 : 0);
  const r = i % 2 ? RATCHET_R + 0.15 : RATCHET_R;
  return [r * Math.cos(a), r * Math.sin(a)];
});

export default {
  figure: 491,
  parts: [
    {
      id: "base",
      kind: "group",
      pieces: [
        { kind: "box", size: [4.0, 0.15, 3.0], at: [0, BASE_Y - 0.08, 0] },
        // 平放的棘輪(板件繞 x 轉 −90°,鋸齒排在水平面上)
        { kind: "plate", shape: shape(ratchet, [polygon(24, 0.8).reverse()]), thickness: 0.15, rotation: [-Math.SQRT1_2, 0, 0, Math.SQRT1_2], at: [0, BASE_Y + 0.07, 0] },
      ],
    },
    {
      id: "capstan",
      kind: "group",
      axis: Y,
      spin: 1.0,
      pieces: [
        { kind: "lathe", profile: headProfile },
        // 推桿(插在頭部的孔裡)
        { kind: "box", size: [4.2, 0.1, 0.1], at: [0, 0, 0.95] },
        { kind: "box", size: [4.2, 0.1, 0.1], at: [0, 0, 0.95], angle: Math.PI / 2 },
      ],
    },
    // 絞盤鼓(纜繩繞在上面被收進;與絞盤頭是同一個剛體,獨立成一個零件當目標件)
    {
      id: "drum",
      kind: "group",
      axis: Y,
      arrow: false,
      pieces: [
        { kind: "lathe", profile: drumProfile },
        // 棘爪的鉸座
        { kind: "box", size: [0.15, 0.15, 0.2], at: [PAWL_AT, 0, -0.9] },
      ],
    },
    // 棘爪:局部 x 沿切線往後、y 往上
    { id: "pawl", kind: "plate", shape: shape([[0, -0.06], [0.42, -0.04], [0.45, 0.04], [0, 0.06]]), thickness: 0.1, arrow: false },
    { id: "rope", kind: "rope", radius: 0.04 },
  ],
  driver: { part: "capstan", type: "rotation", speed: 0.4 },
  target: "drum", // 纜繩是路徑零件(不上目標色);標把纜繩捲進來的絞盤鼓
  view: { direction: [0.25, 0.3, 1] },
  pose(theta) {
    const c = capstan(theta);
    const pivot = [PAWL_AT * Math.cos(theta), BASE_Y + 0.35, -PAWL_AT * Math.sin(theta)];
    // 繩:從右邊拉來,在鼓上繞一圈半;繩的記號隨收進的長度移動
    const wraps = Array.from({ length: 25 }, (_, i) => {
      const a = -Math.PI / 2 - (i / 24) * TAU * 1.5;
      return [DRUM_R * Math.cos(a), -0.05 + (i / 24) * 0.35, -DRUM_R * Math.sin(a)];
    });
    return {
      parts: {
        capstan: { angle: theta },
        drum: { angle: theta },
        // 棘爪隨絞盤轉,爪尖朝下往後,在棘齒上抬起又落下
        pawl: { position: pivot, rotation: quatMul(quatAxisAngle(Y, theta - Math.PI / 2), quatAxisAngle(Z, -0.5 + c.lift)) },
      },
      paths: { rope: { points: [[3.0, -0.05, DRUM_R], [0, -0.05, DRUM_R], ...wraps], closed: false, phase: c.hauled } }, // 繩往鼓走
      readouts: [{ label: "收進的纜繩", value: c.hauled.toFixed(2) }],
    };
  },
  waivers: [
    { check: "interference", parts: ["drum", "pawl"], reason: "止回爪靠在絞盤底部凸塊上的位置依時序演出;爪尖伸進凸塊 0.09" },
    { check: "interference", parts: ["base", "pawl"], reason: "簡化畫法:止回爪落下時爪尾碰到底座 0.03(96 個取樣中 2 個)" },
  ],
};
