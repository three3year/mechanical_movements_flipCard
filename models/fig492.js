// 第 492 種:小艇脫鉤器(Brown & Level 的專利)。直立的支柱固定在小艇上,鉸在支柱上端的舌片插在一根槓桿上的環孔裡,
// 槓桿以支柱中點處的支點作動。小艇兩端各裝一套。滑車組的鉤子鉤住舌片,要脫離小艇之前都很牢固;需要脫離時,
// 拉動接在各槓桿下端的繩子,使槓桿上端的環孔從舌片上滑脫,舌片隨即被放開,從滑車的鉤子裡滑出,小艇便脫離。
// 主動件是虛擬的「拉繩」。
// 推斷:舌片斜向左上;拉繩使槓桿逆時針轉,環孔沿舌片滑向尖端而脫出;舌片隨即往下翻、離開鉤子,小艇往下掉;
// 各階段所佔的拉繩進度。
import { deg, clamp, smooth } from "./kit.js";
import { shape, thickLine, circle } from "./shapes.js";

const TOP = [0, 1.0, 0]; // 舌片的鉸點(支柱上端)
const FULCRUM = [0, 0.1, 0]; // 槓桿的支點(支柱中點)
const TONGUE = 0.75;
const TONGUE_AT = deg(115); // 舌片的方向(左上)
const UPPER = 1.12; // 支點到環孔
const LOWER = 0.95; // 支點到拉繩端
export const SLIP = 0.55; // 拉到這裡環孔滑脫
export const DROP = 0.8; // 小艇掉下的距離

/** 拉繩 u → 槓桿轉角、舌片轉角、小艇下降量、階段 */
export function release(u0) {
  const u = clamp(u0, 0, 1);
  const lever = deg(28) * smooth(clamp(u / SLIP, 0, 1));
  const open = smooth(clamp((u - SLIP) / 0.15, 0, 1));
  const tongue = TONGUE_AT + deg(70) * open;
  const fall = DROP * smooth(clamp((u - SLIP - 0.12) / 0.3, 0, 1));
  return { lever, tongue, fall, held: u < SLIP, free: fall > 0.01 };
}

export default {
  figure: 492,
  parts: [
    // 支柱與小艇(一起往下掉)
    { id: "post", kind: "group", arrow: false, pieces: [
      { kind: "plate", shape: shape(thickLine([[0, -1.7], [0, TOP[1]]], 0.14), [circle(0.04, 0, TOP[1]).reverse(), circle(0.04, 0, FULCRUM[1]).reverse()]), thickness: 0.12 },
      { kind: "box", size: [0.3, 0.12, 0.3], at: [0, -1.0, 0] },
      { kind: "box", size: [2.6, 0.2, 1.0], at: [0.4, -1.8, 0] },
    ] },
    { id: "tongue", kind: "plate", shape: shape(thickLine([[0, 0], [TONGUE, 0]], 0.12)), thickness: 0.1, arrow: false },
    { id: "lever", kind: "plate", shape: shape(thickLine([[0, UPPER], [0.05, 0.3], [0.35, -0.4], [0.5, -LOWER]], 0.08), [circle(0.09, 0, UPPER).reverse()]), thickness: 0.08, arrow: false },
    // 滑車組的鉤子(固定在上方,三爪)
    { id: "hook", kind: "group", pieces: [
      { kind: "plate", shape: shape(thickLine([[-0.45, 1.75], [-0.45, 1.45], [-0.3, 1.32], [-0.15, 1.42]], 0.06)), thickness: 0.08 },
      { kind: "plate", shape: shape(thickLine([[-0.6, 2.3], [-0.45, 1.75]], 0.06)), thickness: 0.08 },
      { kind: "plate", shape: shape(thickLine([[-0.3, 2.3], [-0.45, 1.75]], 0.06)), thickness: 0.08 },
    ] },
    { id: "rope", kind: "rope", radius: 0.02 },
  ],
  driver: { type: "virtual", label: "拉繩", mode: "balance", range: [0, 1], initial: 0, format: (u) => Math.round(u * 100) + "%" },
  view: { direction: [0.08, 0.06, 1] },
  pose(u) {
    const r = release(u);
    const dy = -r.fall;
    const top = [TOP[0], TOP[1] + dy, 0.1];
    const fulcrum = [FULCRUM[0], FULCRUM[1] + dy, 0.15];
    // 槓桿下端(局部 (0.5, −LOWER))轉 lever 後的位置
    const low = [fulcrum[0] + 0.5 * Math.cos(r.lever) + LOWER * Math.sin(r.lever), fulcrum[1] + 0.5 * Math.sin(r.lever) - LOWER * Math.cos(r.lever), 0.15];
    return {
      parts: {
        post: { position: [0, dy, 0] },
        tongue: { position: top, angle: r.tongue },
        lever: { position: fulcrum, angle: r.lever },
      },
      paths: { rope: { points: [low, [low[0] + 1.0, low[1] - 0.3, 0.15], [2.2, -0.9 + dy * 0, 0.15]], closed: false } },
      readouts: [{ label: "小艇", value: r.held ? "鉤住(環孔扣著舌片)" : r.free ? "脫離" : "環孔滑脫,舌片翻開" }],
    };
  },
};
