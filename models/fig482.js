// 第 482 種:氣體調節器(Powers 的專利),使建築物或公寓裡所有燃燒器的氣體供應保持均等,不受主管壓力變化、
// 或開關任意數量燃燒器的影響。調節閥 D(另以側視圖示出)在入口管 E 上方,經槓桿 d 接到一個倒置的杯子 H;杯子的下緣與閥的下緣
// 都浸在裝水銀的溝槽裡。杯子 H 周圍不會漏氣,但閥上有缺口 h,讓氣體從水銀面上方通過。氣體壓力增加時,作用在杯子 H 的內面
// (面積比閥大),杯子被抬起,使閥沒入水銀,縮小缺口 h 的開口,減少通過的氣量;壓力降低時相反。通往燃燒器的出口在 F。
// 主動件是虛擬的「主管壓力」。
// 推斷:槓桿 d 繞中間的支點轉,杯子升高時閥下降;缺口的開口與閥露出水銀面的高度成正比,通過的氣量 = 壓力 × 開口,
// 調節後大致不變;剖面圖。
import { clamp } from "./kit.js";
import { stream } from "./flow.js";
import { shape, rect, thickLine, circle } from "./shapes.js";

const MERCURY = -0.55; // 水銀面
const CUP = { x: -0.55, w: 1.5, h: 1.0 };
const VALVE = { x: 0.95, w: 0.5, h: 0.75 };
const PIVOT = [0.35, 1.05, 0]; // 槓桿 d 的支點;兩臂端正好在杯子與閥的上方
const ARM_CUP = 0.9;
const ARM_VALVE = 0.6;
const HANG_H = PIVOT[1] - (MERCURY - 0.35 + CUP.h); // 吊杯子的桿長(槓桿水平時杯緣在水銀面下 0.35)
const HANG_D = PIVOT[1] - (MERCURY - 0.15 + VALVE.h); // 吊閥的桿長
export const NOTCH = 0.3; // 缺口 h 的高度
export const RANGE = [0.6, 1.6];

/** 主管壓力 p → 杯子抬起量、閥下降量、缺口的開口(0–1)、通過的氣量 */
export function regulate(p0) {
  const p = clamp(p0, ...RANGE);
  const lift = 0.35 * (p - 0.6); // 壓力越大杯子越高
  const drop = (lift * ARM_VALVE) / ARM_CUP;
  const opening = clamp((NOTCH - drop * 0.77) / NOTCH, 0, 1); // 開口隨壓力減小,使「壓力 × 開口」在常用範圍內大致不變
  return { lift, drop, opening, flow: p * opening };
}

export default {
  figure: 482,
  parts: [
    {
      id: "casing",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(thickLine([[-1.75, -1.0], [-1.75, 1.2], [-1.2, 1.55], [1.65, 1.55], [2.05, 1.2], [2.05, -1.0], [-1.75, -1.0]], 0.08)), thickness: 0.9 },
        // 水銀溝槽的內壁、入口管 E(底下)、出口 F(左)
        { kind: "plate", shape: shape(thickLine([[-1.45, -1.0], [-1.45, MERCURY + 0.15]], 0.06)), thickness: 0.8 },
        { kind: "plate", shape: shape(rect(0.3, 0.9, VALVE.x, -1.0)), thickness: 0.3 },
        { kind: "plate", shape: shape(thickLine([[-1.75, 0.0], [-2.3, 0.0]], 0.25)), thickness: 0.3 },
        { kind: "box", size: [0.06, 0.5, 0.06], at: [PIVOT[0], PIVOT[1] + 0.25, 0.24] }, // 吊架在槓桿的背面
        { kind: "cylinder", radius: 0.022, length: 0.14, at: [PIVOT[0], PIVOT[1], 0.29] }, // 槓桿 d 的樞軸銷:從吊架穿過槓桿
      ],
    },
    { id: "labelE", kind: "group", pieces: [], label: "E", labelOffset: [VALVE.x + 0.35, -1.25, 0.5] },
    { id: "labelF", kind: "group", pieces: [], label: "F", labelOffset: [-2.1, 0.25, 0.5] },
    { id: "mercury", kind: "fill", fluid: "mercury", center: [0.15, (MERCURY - 0.95) / 2, 0], size: [3.6, MERCURY + 0.95, 0.8], level: 1 },
    { id: "cup", kind: "plate", shape: shape(thickLine([[-CUP.w / 2, 0], [-CUP.w / 2, CUP.h], [CUP.w / 2, CUP.h], [CUP.w / 2, 0]], 0.06)), thickness: 0.7, arrow: false, label: "H", labelOffset: [0.4, CUP.h - 0.2, 0.5] },
    { id: "valve", kind: "plate", shape: shape(thickLine([[-VALVE.w / 2, 0], [-VALVE.w / 2, VALVE.h], [VALVE.w / 2, VALVE.h], [VALVE.w / 2, 0]], 0.05), [circle(0.07, 0, 0.12).reverse()]), thickness: 0.4, arrow: false, label: "D", labelOffset: [0.4, VALVE.h, 0.4] },
    { id: "lever", kind: "plate", shape: shape(thickLine([[-ARM_CUP, 0], [ARM_VALVE, 0]], 0.06), [circle(0.026).reverse()]), thickness: 0.06, arrow: false, label: "d", labelOffset: [0.15, 0.15, 0.3] },
    { id: "rodH", kind: "link", width: 0.04, thickness: 0.03 },
    { id: "rodD", kind: "link", width: 0.04, thickness: 0.03 },
  ],
  powered: ["cup"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "主管壓力", mode: "balance", range: RANGE, initial: 1.0 },
  target: "valve", // 節流的調節閥 D
  view: { direction: [0.06, 0.08, 1] },
  pose(p) {
    const r = regulate(p);
    // 槓桿 d 轉 tilt:杯子那端升高 lift、閥那端降低 drop;杯子與閥各以一根垂直的桿吊在兩端
    const tilt = Math.asin(r.lift / ARM_CUP);
    const leverEnd = (d) => [PIVOT[0] + d * Math.cos(-tilt), PIVOT[1] + d * Math.sin(-tilt), 0.3];
    const cupTop = leverEnd(-ARM_CUP).map((c, k) => c - (k === 1 ? HANG_H : 0));
    const valveTop = leverEnd(ARM_VALVE).map((c, k) => c - (k === 1 ? HANG_D : 0));
    const cupBottom = cupTop[1] - CUP.h;
    const valveBottom = valveTop[1] - VALVE.h;
    const travel = p * 10;
    const gas = r.opening > 0.02 ? stream([[VALVE.x, -1.3, 0.3], [VALVE.x, valveBottom + 0.3, 0.3], [VALVE.x - 0.4, MERCURY + 0.15, 0.3], [-1.3, MERCURY + 0.25, 0.3], [-1.6, 0.0, 0.3], [-2.3, 0.0, 0.3]], travel, { spacing: 0.25 / Math.max(0.3, r.opening) }) : [];
    return {
      parts: {
        cup: { position: [cupTop[0], cupBottom, 0] },
        valve: { position: [valveTop[0], valveBottom, 0.16] },
        lever: { position: [PIVOT[0], PIVOT[1], 0.3], angle: -tilt },
        rodH: { from: leverEnd(-ARM_CUP), to: cupTop },
        rodD: { from: leverEnd(ARM_VALVE), to: valveTop },
      },
      flows: [{ fluid: "air", points: gas }],
      readouts: [
        { label: "缺口 h 的開口", value: `${Math.round(r.opening * 100)}%` },
        { label: "送到燃燒器的氣量", value: r.flow.toFixed(2) },
      ],
    };
  },
  waivers: [
    { check: "interference", parts: ["casing", "valve"], reason: "簡化畫法:閥瓣坐在外殼的閥座上,重疊 0.16" },
    { check: "interference", parts: ["lever", "rodH"], reason: "接合處的簡化畫法:吊杯子的桿頂鉸在槓桿 d 的端頭,桿端伸進槓桿 0.03(槓桿傾斜時)" },
  ],
};
