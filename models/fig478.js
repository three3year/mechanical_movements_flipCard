// 第 478 種:另一種蒸汽疏水器(Ray 的專利)。閥門 a 隨廢水管的縱向伸縮開閉:廢水管 A 的末端在附屬的空心球 C 的中央,
// 管子有一段牢牢固定在支座 B 上。閥門是一根在球上的填料函裡作動的柱塞,對著管端,由加重的肘節槓桿 D 推向管端,
// 推進的程度受擋止螺絲 b 與擋止 c 限制。管裡充滿水時,管長縮短,閥門保持打開;充滿蒸汽時,管子膨脹使閥門關閉。
// 螺絲 b 用來調整閥門的作動。
// 主動件是虛擬的「管內溫度」(從水到蒸汽)。
// 推斷:管子的伸長與溫度成正比(放大顯示);管端碰到柱塞時把它頂回、封住。
// 槓桿 D 由接觸算:鉸在右上的支架上,重球在支點右邊,重量使下臂往左壓在柱塞的右端;柱塞往左最多推到
// 下臂靠上擋止 c(擋止螺絲 b 穿過 c、調整這個位置)。管子膨脹把柱塞往右頂時,下臂被柱塞推回、重球抬起。
// 管端另畫一個管口(實體),跟著管子伸縮。
import { deg, clamp } from "./kit.js";
import { stream } from "./flow.js";
import { shape, circle, thickLine } from "./shapes.js";

const FIXED = -2.4; // 管子固定在支座 B 處
export const END0 = 0.75; // 冷(水)時的管端
export const GROW = 0.35; // 冷到熱的伸長(放大)
export const STOP = 0.95; // 擋止讓柱塞最多推到這裡
const SPHERE = { center: [0.85, 0, 0], r: 0.75 };
const PIPE_R = 0.12;

const PLUNGER = 1.2; // 柱塞長
export const PIVOT = [2.6, 0.55]; // 槓桿 D 的支點
const ARM_W = 0.08; // 下臂寬
const PLUNGER_R = 0.1;
const ARM = 1.0; // 下臂長
/** 柱塞右端在 x 時,壓在它上面的下臂的轉角(逆時針為正;下臂朝下往左斜,左側面貼著柱塞右端的下緣) */
export function leverAngle(x) {
  const dx = PIVOT[0] - x;
  const dy = PIVOT[1] + PLUNGER_R;
  return Math.atan2(dy, dx) - Math.acos(ARM_W / 2 / Math.hypot(dx, dy));
}

/** 管內溫度 t(0 水、1 蒸汽)→ 管端、柱塞位置、槓桿轉角、閥門是否打開 */
export function trap(t0) {
  const t = clamp(t0, 0, 1);
  const end = END0 + GROW * t;
  const plunger = Math.max(STOP, end);
  return { end, plunger, lever: leverAngle(plunger + PLUNGER), open: end < STOP - 1e-9, gap: Math.max(0, STOP - end) };
}
// 擋止 c 與螺絲 b:柱塞在 STOP 時,螺絲頭剛好頂著下臂靠近下端的地方(在柱塞下方)
const REST = leverAngle(STOP + PLUNGER);
const STOP_Y = PIVOT[1] - ARM * Math.cos(REST) + 0.06;
const STOP_X = PIVOT[0] + ((PIVOT[1] - STOP_Y) / Math.cos(REST)) * Math.sin(REST) - ARM_W / 2 / Math.cos(REST); // 下臂左側面在這個高度的 x

export default {
  figure: 478,
  parts: [
    {
      id: "base",
      kind: "group",
      pieces: [
        { kind: "box", size: [4.6, 0.12, 0.8], at: [-0.1, -0.55, 0] },
        { kind: "box", size: [0.5, 0.45, 0.6], at: [FIXED, -0.3, 0] },
        // 空心球 C(剖開前半)、下面的出口、右邊的填料函與擋止 c、擋止螺絲 b
        { kind: "plate", shape: shape(circle(SPHERE.r + 0.07, SPHERE.center[0], 0), [circle(SPHERE.r, SPHERE.center[0], 0).reverse()]), thickness: 0.3 },
        { kind: "plate", shape: shape(thickLine([[SPHERE.center[0] - 0.15, -SPHERE.r], [SPHERE.center[0] - 0.15, -1.1]], 0.06)), thickness: 0.3 },
        { kind: "plate", shape: shape(thickLine([[SPHERE.center[0] + 0.15, -SPHERE.r], [SPHERE.center[0] + 0.15, -1.1]], 0.06)), thickness: 0.3 },
        { kind: "box", size: [0.35, 0.3, 0.3], at: [SPHERE.center[0] + SPHERE.r + 0.12, 0, 0] },
        // 擋止 c(從底座立起)與穿過它的擋止螺絲 b(螺絲頭頂著下臂)
        { kind: "box", size: [0.1, STOP_Y + 0.06 + 0.49, 0.2], at: [STOP_X - 0.23, (STOP_Y + 0.06 - 0.49) / 2, 0] },
        { kind: "cylinder", radius: 0.025, length: 0.2, axis: [1, 0, 0], at: [STOP_X - 0.13, STOP_Y, 0] },
        { kind: "cylinder", radius: 0.045, length: 0.03, axis: [1, 0, 0], at: [STOP_X - 0.015, STOP_Y, 0] },
        // 槓桿 D 的支架與樞軸銷
        { kind: "box", size: [0.12, PIVOT[1] + 0.49, 0.12], at: [PIVOT[0] + 0.12, (PIVOT[1] - 0.49) / 2, -0.12] },
        { kind: "box", size: [0.24, 0.1, 0.12], at: [PIVOT[0] + 0.06, PIVOT[1], -0.12] },
        { kind: "cylinder", radius: 0.03, length: 0.3, at: [PIVOT[0], PIVOT[1], -0.05] },
      ],
    },
    { id: "labelB", kind: "group", pieces: [], label: "B", labelOffset: [FIXED, 0.15, 0.5] },
    { id: "labelC", kind: "group", pieces: [], label: "C", labelOffset: [SPHERE.center[0], SPHERE.r + 0.2, 0.4] },
    { id: "labelb", kind: "group", pieces: [], label: "b", labelOffset: [2.7, -0.15, 0.4] },
    { id: "labelc", kind: "group", pieces: [], label: "c", labelOffset: [2.3, 0.05, 0.4] },
    { id: "pipe", kind: "rod", radius: PIPE_R, label: "A", labelOffset: [-1.2, 0.3, 0.3] }, // 路徑零件的標籤從原點量起
    { id: "plunger", kind: "cylinder", axis: [1, 0, 0], radius: 0.1, length: 1.2, arrow: false, label: "a", labelOffset: [-0.35, 0.25, 0.3] },
    // 槓桿 D:支點在局部原點,下臂往下 ARM,重球的臂往右上
    { id: "lever", kind: "plate", shape: shape(thickLine([[0, -ARM], [0, 0], [0.35, 0.3]], ARM_W), [circle(0.035, 0, 0).reverse()]), thickness: 0.08, arrow: false, label: "D", labelOffset: [0.45, 0.55, 0.3], pieces: [{ kind: "sphere", radius: 0.18, at: [0.42, 0.36, 0] }] },
    { id: "nozzle", kind: "cylinder", axis: [1, 0, 0], radius: PIPE_R + 0.03, length: 0.08, arrow: false }, // 管口(跟著管子伸縮)
  ],
  // 動力重演:柱塞在填料函裡沿 x 滑,只受管口與槓桿 D 的推;槓桿只受重力與柱塞、擋止的碰撞
  replay: {
    free: { plunger: { slide: [1, 0, 0], gravity: false }, lever: { pivot: [PIVOT[0], PIVOT[1], 0] } },
    ignore: [["base", "plunger"]], // 柱塞穿過球殼與填料函(孔沒畫出來)
    expect: [
      { at: 0.4, part: "plunger", label: "管裡是水:槓桿把柱塞推到擋止為止,閥門開著", quote: "當管內充滿水時,其長度縮短到閥門保持開啟" },
      { at: 0.4, part: "lever", label: "槓桿靠在擋止上" },
      { part: "plunger", label: "管裡是蒸汽:管子膨脹把柱塞頂回、閥門關閉", quote: "當充滿蒸汽時,管子膨脹使閥門關閉" },
      { part: "lever", label: "槓桿被柱塞推回、重球抬起" },
    ],
  },
  powered: ["pipe", "nozzle"], // 外力來源:管子受熱伸縮(管口跟著管子走)
  driver: { type: "virtual", label: "管內溫度", mode: "balance", range: [0, 1], initial: 0.2, format: (t) => (t < 0.5 ? "水" : "蒸汽") },
  target: "plunger",
  view: { direction: [0.08, 0.1, 1] },
  pose(t) {
    const s = trap(t);
    const flows = s.open ? [{ fluid: "water", points: stream([[FIXED + 0.3, 0, 0.3], [s.end, 0, 0.3], [SPHERE.center[0], -0.3, 0.3], [SPHERE.center[0], -1.2, 0.3]], t * 30, { spacing: 0.18 }) }] : [];
    return {
      parts: {
        plunger: { position: [s.plunger + PLUNGER / 2, 0, 0] },
        lever: { position: [PIVOT[0], PIVOT[1], 0], angle: s.lever },
        nozzle: { position: [s.end - 0.04, 0, 0] },
      },
      paths: { pipe: { points: [[FIXED - 0.3, 0, 0], [s.end, 0, 0]], closed: false } }, // 管子從固定處伸到管端(隨溫度伸縮)
      flows,
      readouts: [{ label: "閥門 a", value: s.open ? `打開(間隙 ${s.gap.toFixed(2)}),水排出` : "管子膨脹頂住柱塞,關閉" }],
    };
  },
};
