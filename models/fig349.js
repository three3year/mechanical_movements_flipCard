// 第 349 種:另一種形式的平行尺。上下兩根尺之間有兩組臂,每組兩根臂在中點以鉸接相連(像「>」),
// 兩個鉸點再由一根中介桿相連;這樣尺的兩端與兩側都保持平行。
// 兩組下臂與中介桿、下尺構成平行四邊形,兩組上臂與中介桿、上尺也是,所以中介桿與上尺都只平移、不轉;
// 上尺的位置有兩個自由度(斜著拉開時兩尺仍平行),這裡演出正對著拉開(原圖與 507movements 的動畫都是這樣)。
// 主動件是上面的尺(拉開或合攏),下尺壓在紙上。
// 照 525 px 原圖:兩根尺的內緣左段較寬,有一道 45° 的斜階;中介桿夾在兩尺之間、和尺同一層,左端削尖、斜度和斜階相同,
// 合到最小開度時兩尺的寬段合攏,中介桿填滿窄段之間的空隙、尖端靠進斜階。臂在尺與中介桿前面兩層(上臂貼著尺面,下臂在上臂前面)。
// 推斷:使用時的動作——上尺在起始位置沿上緣畫一條線,拉開後再畫一條,兩線平行。
import { clamp } from "./kit.js";
import { shape } from "./shapes.js";
import { rulerLineParts, rulerLines } from "./ruler-lines.js";

const LINK = 1.25; // 每根臂長
const XS = [-1.15, 1.05]; // 兩組臂在尺上的樞軸 x
const W = 5.6; // 尺長
const T = 0.1; // 尺與中介桿的厚度
const OUTER = 0.35; // 樞軸線到尺外緣
const P = 0.3; // 樞軸線到尺內緣(窄段)
const STEP = 0.25; // 內緣寬段多出的寬度(斜階的深度,45°)
const CLEAR = 0.01; // 合攏時兩尺寬段之間、中介桿與窄段之間的間隙
const BOTTOM = -1.4; // 下尺樞軸線
const BAR = 2 * STEP - CLEAR; // 中介桿的寬:合攏時填滿窄段之間的空隙
const TIP = -2.7; // 中介桿尖端(相對左鉸點左邊 1.55,原圖)
const BAR_END = 1.4;
export const RANGE = [2 * P + 2 * STEP + CLEAR, 2.3]; // 上下樞軸線的距離:最小時兩尺的寬段合攏

/** 距離 h → 鉸點(中介桿)的 x 偏移 */
export function hinge(h0) {
  const h = clamp(h0, ...RANGE);
  return { h, dx: Math.sqrt(LINK * LINK - (h / 2) ** 2) };
}
export const edge = (h) => {
  const y = BOTTOM + clamp(h, ...RANGE) + OUTER + 0.06; // 上尺的上緣
  return [[-W / 2 - 0.3, y], [W / 2 + 0.3, y]];
};

// 斜階的位置:合到最小開度時,中介桿尖端的斜面離斜階約 CLEAR
const XS_STEP = hinge(RANGE[0]).dx + TIP - CLEAR;
// 下尺(局部 y 以樞軸線為 0):外緣在下,內緣左段寬、右段窄
const lowOutline = [[-W / 2, -OUTER], [W / 2, -OUTER], [W / 2, P], [XS_STEP + STEP, P], [XS_STEP, P + STEP], [-W / 2, P + STEP]];
// 上尺:下尺上下翻過來
const topOutline = [[-W / 2, -P - STEP], [XS_STEP, -P - STEP], [XS_STEP + STEP, -P], [W / 2, -P], [W / 2, OUTER], [-W / 2, OUTER]];

// 層:尺與中介桿 z −T/2…T/2(底面貼紙);上臂貼著尺面,下臂在上臂前面
const LINK_T = 0.05;
const Z_UP = T / 2 + LINK_T / 2;
const Z_DOWN = Z_UP + LINK_T;
const TOP_OF = (z) => z + LINK_T / 2 + 0.02; // 銷伸出臂面一點
/** 沿 z 從 z0 到 z1 的銷(或凸台) */
const span = (x, z0, z1, radius = 0.05) => ({ kind: "cylinder", radius, length: z1 - z0, at: [x, 0, (z0 + z1) / 2] });

export default {
  figure: 349,
  parts: [
    { id: "paper", kind: "box", center: [0, 0, -T / 2 - 0.02], size: [8, 5.6, 0.04] },
    // 下尺:臂端的銷立在尺上,穿過下臂;下臂比尺面高一個臂厚,由凸台墊著(推斷)
    {
      id: "rulerLow",
      kind: "group",
      center: [0, BOTTOM, 0],
      pieces: [
        { kind: "plate", shape: shape(lowOutline), thickness: T },
        ...XS.flatMap((x) => [span(x, -T / 2, TOP_OF(Z_DOWN)), span(x, T / 2, Z_DOWN - LINK_T / 2, 0.07)]),
      ],
    },
    // 上尺:臂端的銷立在尺上,穿過上臂
    { id: "rulerTop", kind: "plate", shape: shape(topOutline), thickness: T, pieces: XS.map((x) => span(x, -T / 2, TOP_OF(Z_UP))) },
    // 中介桿:左端削尖(原圖);兩個鉸點的銷立在它上面,穿過上下兩根臂
    {
      id: "midBar",
      kind: "plate",
      shape: shape([[TIP, 0], [TIP + BAR / 2, -BAR / 2], [BAR_END, -BAR / 2], [BAR_END, BAR / 2], [TIP + BAR / 2, BAR / 2]]),
      thickness: T,
      pieces: XS.map((x) => span(x, -T / 2, TOP_OF(Z_DOWN))),
    },
    ...XS.flatMap((_, i) => [
      { id: `up${i}`, kind: "link", width: 0.14, thickness: LINK_T, pins: false },
      { id: `down${i}`, kind: "link", width: 0.14, thickness: LINK_T, pins: false },
    ]),
    ...rulerLineParts(),
  ],
  driver: { part: "rulerTop", type: "translation", direction: [0, 1, 0], range: RANGE, initial: 1.6 },
  target: "midBar", // 連著兩個鉸點、讓尺的兩端都保持平行的中介桿
  view: { direction: [0.03, 0.06, 1] },
  pose(h0) {
    const { h, dx } = hinge(h0);
    const mid = BOTTOM + h / 2;
    const parts = {
      rulerTop: { position: [0, BOTTOM + h, 0] },
      midBar: { position: [dx, mid, 0] },
    };
    XS.forEach((x, i) => {
      parts[`up${i}`] = { from: [x, BOTTOM + h, Z_UP], to: [x + dx, mid, Z_UP] };
      parts[`down${i}`] = { from: [x + dx, mid, Z_DOWN], to: [x, BOTTOM, Z_DOWN] };
    });
    return { parts, paths: rulerLines(edge, 1.6, h, -T / 2 + 0.002), readouts: [] };
  },
};
