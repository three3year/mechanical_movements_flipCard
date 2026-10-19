// 第 387 種:有潮汐漲落的碼頭用的自動調整階梯。梯子的上端以樞軸接在碼頭上,下端鉸在浮在水面的小船的立柱上;踏階的一邊以樞軸
// 接在梯幫上,另一邊由吊在扶手木條上的桿件撐著(平行四邊形),所以不論梯子擺到什麼角度,踏階都保持水平。
// 主動件是虛擬的「水位」(平衡型):水位越低,梯子越陡。
//
// 照原圖(2026-10-20 改):小船上立著一根帶圓頭的立柱,梯幫與扶手的下端各以一個銷鉸在這根立柱上;岸邊那一端同樣由兩個銷
// 接在碼頭上(下銷在岸邊伸出的兩片耳板上、上銷在耳板上立的一根柱上)。兩個銷的間距都是 RAIL_UP、上下對齊,所以扶手在梯幫的
// 正上方,梯幫、扶手、兩根立柱構成平行四邊形,小船怎麼升降,扶手都和梯幫平行。踏階照原圖右端鉸在梯幫上、往左伸,
// 左端由斜吊桿吊到扶手上踏階樞軸的正上方(吊桿、踏階、梯幫、扶手又是一個平行四邊形,踏階保持水平)。
// 水位最高時梯子水平(原圖上圖),最低時斜 40°(原圖下圖約 25–30°,取大一點讓變化看得清楚)。
// 推斷:梯子的長度與水位的範圍;小船以填色的水托著;背面那根梯幫的下端由小船背面的短柱托著(原圖是側視,看不到);
// 原圖的扶手只畫一根(在前面那根梯幫的上方),吊桿也只有前面一排,模型照畫;耳板、上銷的柱是推斷。
// 吊桿的下端夾在踏階端頭的槽裡(踏階分三層,中間一層在端頭讓出吊桿的眼),銷穿過上下兩層。
import { clamp, deg } from "./kit.js";
import { shape, rect } from "./shapes.js";

const PIVOT = [2.0, 1.6, 0]; // 梯幫上端的樞軸(碼頭邊)
const LEN = 4.4; // 梯幫長(兩端樞軸的距離)
const RAIL_UP = 1.0; // 扶手在梯幫正上方的距離(兩根立柱上兩個銷的間距)
const STEPS = 8;
const STEP_W = 0.45; // 踏階從樞軸往左伸到吊桿的距離
const STEP_AT = (i) => 0.15 + i * 0.52; // 第 i 階的樞軸離梯幫上端的距離
const FOOT_PIN = 0.12; // 小船立柱上的下銷離甲板的高度
const DECK = 0.12; // 甲板在水面上方的高度
const BOAT_DROP = DECK + FOOT_PIN; // 梯幫下端的銷在水面上方的高度
const STEEPEST = deg(40);
export const RANGE = [PIVOT[1] - BOAT_DROP - LEN * Math.sin(STEEPEST), PIVOT[1] - BOAT_DROP]; // 水位:最高時梯子水平
const Z = { stringer: 0.4, rail: 0.3, hanger: 0.23, post: 0.5 }; // 前面那根梯幫、扶手、吊桿、立柱的深度
const WATER = { bottom: -2.6, top: 1.6 };

/** 水位 h → 梯幫的角度(從樞軸往下斜到小船)與下端的銷 */
export function ladder(h0) {
  const h = clamp(h0, ...RANGE);
  const drop = Math.max(0, PIVOT[1] - (h + BOAT_DROP));
  const angle = Math.PI + Math.asin(drop / LEN); // 從樞軸指向左下
  return { h, angle, foot: [PIVOT[0] + LEN * Math.cos(angle), PIVOT[1] + LEN * Math.sin(angle), 0] };
}

const pin = (x, y, z0, z1, r = 0.035) => ({ kind: "cylinder", role: "pin", radius: r, length: z1 - z0, at: [x, y, (z0 + z1) / 2] });
// 踏階:樞軸在右端(局部原點),往左伸;沿深度夾在兩根梯幫之間(|z| ≤ 0.35)。分三層:中間一層在左端讓出吊桿的眼
const tread = (z0, z1, x0) => ({ kind: "plate", shape: shape(rect(0.03 - x0, 0.06, (x0 + 0.03) / 2, 0)), thickness: z1 - z0, at: [0, 0, (z0 + z1) / 2] });
const SLOT = [Z.hanger - 0.04, Z.hanger + 0.04];

export default {
  figure: 387,
  parts: [
    {
      id: "quay",
      kind: "group",
      pieces: [
        // 岸壁在梯子上端的右邊:最上一級踏板與吊桿不伸進岸壁;梯幫的樞軸由岸邊伸出的兩片耳板托著(推斷)
        { kind: "plate", shape: shape(rect(2.4, 4.2, 3.7, -0.5)), thickness: 1.2 },
        { kind: "box", size: [0.62, 0.1, 0.08], at: [2.22, 1.55, 0.5] },
        { kind: "box", size: [0.62, 0.1, 0.08], at: [2.22, 1.55, -0.5] },
        pin(PIVOT[0], PIVOT[1], 0.4, 0.55, 0.05),
        pin(PIVOT[0], PIVOT[1], -0.55, -0.4, 0.05),
        // 扶手上端的銷:耳板上立一根帶圓頭的柱(推斷;原圖梯子上端接在岸上欄杆的立柱上),銷從柱往後伸進扶手
        { kind: "box", size: [0.12, RAIL_UP + 0.25, 0.08], at: [PIVOT[0], PIVOT[1] + (RAIL_UP + 0.25) / 2, Z.post] },
        { kind: "sphere", radius: 0.09, at: [PIVOT[0], PIVOT[1] + RAIL_UP + 0.32, Z.post] },
        pin(PIVOT[0], PIVOT[1] + RAIL_UP, Z.rail - 0.04, Z.post - 0.04),
        // 岸上的欄杆
        { kind: "box", size: [0.12, 1.6, 0.12], at: [2.5, 2.4, 0.5] },
        { kind: "box", size: [0.12, 1.6, 0.12], at: [4.7, 2.4, 0.5] },
        { kind: "box", size: [2.3, 0.1, 0.1], at: [3.6, 3.15, 0.5] },
        { kind: "box", size: [2.4, 0.08, 0.08], at: [3.6, 2.4, 0.5], angle: 0.6 },
        { kind: "box", size: [2.4, 0.08, 0.08], at: [3.6, 2.4, 0.5], angle: -0.6 },
      ],
    },
    { id: "water", kind: "fill", fluid: "water", center: [-1.5, (WATER.bottom + WATER.top) / 2, -1.0], size: [5.8, WATER.top - WATER.bottom, 0.6], level: 0.5 }, // 水在梯子後方,看得到梯子
    {
      id: "boat",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape([[-0.7, 0], [0.7, 0], [0.5, -0.3], [-0.5, -0.3]]), thickness: 1.2 },
        // 立柱(原圖:帶圓頭)與兩個銷:下銷穿過兩根梯幫的下端,上銷伸進扶手的下端
        { kind: "box", role: "post", size: [0.12, FOOT_PIN + RAIL_UP + 0.2, 0.08], at: [0, (FOOT_PIN + RAIL_UP + 0.2) / 2, Z.post] },
        { kind: "sphere", radius: 0.09, at: [0, FOOT_PIN + RAIL_UP + 0.27, Z.post] },
        { kind: "box", size: [0.12, FOOT_PIN + 0.12, 0.08], at: [0, (FOOT_PIN + 0.12) / 2, -Z.post] }, // 背面的短柱(推斷)
        pin(0, FOOT_PIN, -Z.post - 0.04, Z.post + 0.04, 0.04),
        pin(0, FOOT_PIN + RAIL_UP, Z.rail - 0.04, Z.post - 0.04),
      ],
    },
    // 兩根梯幫在下緣由一根橫撐連成一件(推斷;踏階是鉸接的,撐不住梯幫的間距),橫撐在踏階底下、不碰踏階
    {
      id: "stringer",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "box", size: [LEN + 0.16, 0.12, 0.1], at: [LEN / 2, 0, Z.stringer] },
        { kind: "box", size: [LEN + 0.16, 0.12, 0.1], at: [LEN / 2, 0, -Z.stringer] },
        { kind: "box", size: [0.1, 0.06, 2 * Z.stringer + 0.1], at: [LEN / 2, 0.09, 0] }, // 局部 +y 是世界的下方(梯幫從樞軸指向左下)
      ],
    },
    { id: "rail", kind: "group", arrow: false, pieces: [{ kind: "box", size: [LEN + 0.16, 0.1, 0.08], at: [LEN / 2, 0, Z.rail] }] },
    ...Array.from({ length: STEPS }, (_, i) => ({
      id: `step${i}`,
      kind: "group",
      arrow: false,
      pieces: [tread(-0.35, SLOT[0], -0.48), tread(SLOT[0], SLOT[1], -STEP_W + 0.06), tread(SLOT[1], 0.35, -0.48), { kind: "cylinder", radius: 0.03, length: 0.9 }],
    })),
    ...Array.from({ length: STEPS }, (_, i) => ({ id: `hanger${i}`, kind: "link", width: 0.04, thickness: 0.04 })),
  ],
  powered: ["boat"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "水位", mode: "balance", range: RANGE, initial: (RANGE[0] + RANGE[1]) / 2 },
  target: "step3", // 踏階:梯子隨水位擺到什麼角度都保持水平(取中間一階代表)
  view: { direction: [0.15, 0.12, 1] },
  pose(h0) {
    const l = ladder(h0);
    const c = Math.cos(l.angle);
    const s = Math.sin(l.angle);
    const parts = {
      stringer: { angle: l.angle },
      rail: { position: [PIVOT[0], PIVOT[1] + RAIL_UP, 0], angle: l.angle }, // 扶手:樞軸在梯幫樞軸正上方,與梯幫平行
      boat: { position: [l.foot[0], l.foot[1] - FOOT_PIN, 0] }, // 梯幫下端的銷在立柱上;小船浮在水面(甲板高出水面 DECK)
      water: { level: (l.h - WATER.bottom) / (WATER.top - WATER.bottom) },
    };
    for (let i = 0; i < STEPS; i++) {
      const t = STEP_AT(i);
      const at = [PIVOT[0] + t * c, PIVOT[1] + t * s, 0];
      // 踏階:右端以樞軸接在梯幫上,保持水平,往左伸 STEP_W;左端由斜吊桿吊在扶手上、樞軸正上方的那一點
      parts[`step${i}`] = { position: at, angle: 0 };
      parts[`hanger${i}`] = { from: [at[0] - STEP_W, at[1], Z.hanger], to: [at[0], at[1] + RAIL_UP, Z.hanger] };
    }
    return { parts, readouts: [] };
  },
};

// 測試用
export const geometry = { LEN, RAIL_UP };
