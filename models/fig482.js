// 第 482 種:氣體調節器(Powers 的專利),使建築物或公寓裡所有燃燒器的氣體供應保持均等,不受主管壓力變化、
// 或開關任意數量燃燒器的影響。調節閥 D(另單獨示出其外觀圖)在入口管 E 上方,經槓桿 d 接到一個倒置的杯子 H;杯子的下緣與閥的下緣
// 都浸在裝水銀的溝槽裡。杯子 H 周圍不會漏氣,但閥上有缺口 b,讓氣體從水銀面上方通過。氣體壓力增加時,作用在杯子 H 的內面
// (面積比閥大),杯子被抬起,使閥沒入水銀,縮小缺口 b 的開口,減少通過的氣量;壓力降低時相反。通往燃燒器的出口在 F。
// 主動件是虛擬的「主管壓力」。
// 照 525 px 原圖重排(2026-10-20 決定 (a)):H 是罩住閥 D 與出口室的大倒杯,杯緣浸在外殼內側的水銀溝裡;E 是從底下上來的管,
// 四周另有一圈水銀溝給閥 D;出口室是左邊的方箱(頂上開口朝 H 的內部、F 從它的左壁穿出外殼);槓桿 d 的支點在出口室與
// E 溝之間的牆頂,一端經吊桿接 H 頂下的耳、另一端經閥桿接 D 頂上的耳。氣體從 E 上來進 D 裡,經缺口 b 露出水銀面的部分
// 到 H 裡,再經出口室到 F——H 內面受的就是送往燃燒器的氣壓。
// 剖面圖:外殼、H、D 與出口室都留下背面的壁(推斷:剖掉的是前半邊),E、F 是剖開的管(pump.js 的 pipeWalls)。
// 推斷:H 頂上的吊架套在外殼頂垂下的導桿上(原圖頂上的小方塊與桿),H 只能鉛直升降;吊桿、閥桿兩端銷接、長度不變,
// H 升起的量由槓桿角與桿長算;缺口 b 的開口 = 缺口露出水銀面的高度 ÷ 缺口高(閥 D 另附的外觀圖:缺口在杯緣、圓孔在壁上);
// 通過的氣量 = 壓力 × 開口,調節後大致不變。
import { clamp } from "./kit.js";
import { stream } from "./flow.js";
import { shape, rect, thickLine, circle, spanBox } from "./shapes.js";
import { pipeWalls } from "./pump.js";

export const MERCURY = -0.15; // 水銀面(外圈溝與 E 四周的溝同高)
export const TROUGH_BOTTOM = -0.5; // 兩圈溝的底
const FLOOR = -0.9; // 外殼內底
const Z_IN = 0.28; // 出口室、E 溝與 E 管的深度(半)
export const CUP = { half: 1.62, h: 1.75, rim0: -0.45 }; // H:壁在 x = ±1.62、高 1.75,p=0.6 時杯緣在 -0.45
export const E = { x: 0.95, top: 0.15 }; // 入口管 E:在 D 裡伸到水銀面上方
export const VALVE = { half: 0.33, h: 0.65, rim0: MERCURY - 0.05 }; // D:壁在 E ± 0.33、高 0.65,p=0.6 時杯緣在水銀面下 0.05
export const NOTCH = 0.3; // 缺口 b 的高度(從杯緣往上)
const CHAMBER = { x0: -1.3, x1: 0.2, top: 0.3, open: [-0.85, -0.5] }; // 出口室:左壁、右壁(與 E 溝共用的牆)、頂、頂上的開口
const WALL = { x0: 0.2, x1: 0.32 }; // 出口室與 E 溝之間的牆(槓桿的支柱立在它頂上)
export const F_Y = -0.74; // 出口管 F 的軸線(在外圈溝底下穿過外殼壁)
const PIVOT = [0.26, 0.85, 0.35]; // 槓桿 d 的支點(牆頂的支柱上)
export const X_H = -0.45; // 導桿、吊架、吊桿與 H 頂下的耳都在這條鉛直線上
const X_D = 0.7; // 閥桿接在 D 頂上的耳(靠支點這一側,臂短:原圖的鉸點在 D 的左上角)
const ARM_H = PIVOT[0] - X_H; // 0.71
const ARM_D = X_D - PIVOT[0]; // 0.44
const ROD_H = 0.35; // 吊桿長(槓桿端到耳的銷)
const ROD_D = 0.3; // 閥桿長
const LUG_H = CUP.h - 0.1; // H 的耳的銷離杯緣(局部 y)
const LUG_D = VALVE.h + 0.1; // D 的耳的銷離杯緣(局部 y)
const LIFT = 0.25; // 壓力從 0.6 到 1.6 杯子升起的量
export const RANGE = [0.6, 1.6];
const Z_LEVER = 0.35; // 槓桿在最前面一層,吊桿、閥桿在它後面,耳再後面(銷頭穿進各自的孔)
const Z_ROD = 0.3;
const Z_LUG = 0.25;

/** 主管壓力 p → 槓桿角、兩端、H 升起量、D 下降量、兩個杯緣、缺口 b 的開口(0–1)、通過的氣量 */
export function regulate(p0) {
  const p = clamp(p0, ...RANGE);
  const tilt = Math.asin((LIFT * (p - RANGE[0])) / (RANGE[1] - RANGE[0]) / ARM_H);
  const endH = [PIVOT[0] - ARM_H * Math.cos(tilt), PIVOT[1] + ARM_H * Math.sin(tilt)];
  const endD = [PIVOT[0] + ARM_D * Math.cos(tilt), PIVOT[1] - ARM_D * Math.sin(tilt)];
  // 吊桿、閥桿長度不變:耳在固定的鉛直線上,桿略為傾斜
  const lugH = endH[1] + Math.sqrt(ROD_H ** 2 - (X_H - endH[0]) ** 2);
  const lugD = endD[1] - Math.sqrt(ROD_D ** 2 - (X_D - endD[0]) ** 2);
  const lift = lugH - (PIVOT[1] + ROD_H);
  const drop = PIVOT[1] - ROD_D - lugD;
  const cupRim = CUP.rim0 + lift;
  const valveRim = VALVE.rim0 - drop;
  const opening = clamp((valveRim + NOTCH - MERCURY) / NOTCH, 0, 1); // 缺口露出水銀面的部分
  return { tilt, endH, endD, lugH, lugD, lift, drop, cupRim, valveRim, opening, flow: p * opening };
}

const lug = (x, y0, y1, pin) => ({ kind: "plate", shape: shape(thickLine([[x, y0], [x, y1]], 0.08), [circle(0.025, x, pin).reverse()]), thickness: 0.06, at: [0, 0, Z_LUG] });
const at = (pieces, z) => pieces.map((q) => ({ ...q, at: [0, 0, z] }));

export default {
  figure: 482,
  parts: [
    {
      id: "casing",
      kind: "group",
      pieces: [
        // 外殼:底、兩側壁、圓頂、背面的壁(剖面圖留背面)
        spanBox(-1.9, E.x - 0.16, -1.0, FLOOR, -0.45, 0.45),
        spanBox(E.x + 0.16, 1.9, -1.0, FLOOR, -0.45, 0.45),
        spanBox(-1.9, -1.8, F_Y + 0.16, 1.55, -0.45, 0.45), // 左壁(F 管從底下穿出)
        spanBox(1.8, 1.9, FLOOR, 1.55, -0.45, 0.45),
        { kind: "plate", shape: shape(thickLine([[-1.85, 1.55], [-1.2, 2.0], [1.2, 2.0], [1.85, 1.55]], 0.08)), thickness: 0.9 },
        { kind: "plate", shape: shape(rect(3.8, 3.04, 0, 0.52)), thickness: 0.06, at: [0, 0, -0.42] },
        // 外圈水銀溝:溝底的台階與內側的矮牆(左邊的台階坐在 F 管的頂壁上)
        spanBox(-1.8, -1.5, F_Y + 0.16, TROUGH_BOTTOM, -0.3, 0.45),
        spanBox(-1.5, -1.44, F_Y + 0.16, -0.05, -0.3, 0.45),
        spanBox(1.5, 1.8, FLOOR, TROUGH_BOTTOM, -0.3, 0.45),
        spanBox(1.44, 1.5, FLOOR, -0.05, -0.3, 0.45), // 也是 E 溝的右牆
        // E 四周的水銀溝:溝底的台階、左牆(與出口室共用)
        spanBox(WALL.x1, E.x - 0.16, FLOOR, TROUGH_BOTTOM, -Z_IN, Z_IN),
        spanBox(E.x + 0.16, 1.44, FLOOR, TROUGH_BOTTOM, -Z_IN, Z_IN),
        spanBox(WALL.x0, WALL.x1, FLOOR, CHAMBER.top, -Z_IN, Z_IN),
        // 入口管 E(剖開的管,從底下穿進外殼、伸到水銀面上方;深度收在 D 的背板前面)
        ...at(pipeWalls([[E.x, -1.3], [E.x, E.top]], 0.26, 0.06, 0.36), 0.04),
        // 出口管 F(從出口室的左壁、外圈溝底下穿出外殼)
        ...pipeWalls([[-2.3, F_Y], [CHAMBER.x0, F_Y]], 0.26, 0.06, 0.9),
        // 槓桿 d 的支柱(牆頂)與樞軸銷(推斷)
        spanBox(PIVOT[0] - 0.03, PIVOT[0] + 0.03, CHAMBER.top, PIVOT[1], 0.14, Z_IN),
        { kind: "cylinder", radius: 0.022, length: 0.14, at: [PIVOT[0], PIVOT[1], Z_IN + 0.07] },
        // 外殼頂垂下的導桿(推斷:原圖頂上的桿),穿過 H 頂上的吊架
        { kind: "cylinder", radius: 0.035, length: 0.6, axis: [0, 1, 0], at: [X_H, 1.66, 0] },
      ],
    },
    {
      // 出口室(推斷:原圖左邊的方箱,F 在它的壁上):左壁(F 管穿過)、頂(中間開口朝 H 裡)、背板;右壁是共用的牆、底是外殼底
      id: "chamber",
      kind: "group",
      pieces: [
        spanBox(CHAMBER.x0, CHAMBER.x0 + 0.06, FLOOR, F_Y - 0.1, -Z_IN, Z_IN),
        spanBox(CHAMBER.x0, CHAMBER.x0 + 0.06, F_Y + 0.1, CHAMBER.top, -Z_IN, Z_IN),
        spanBox(CHAMBER.x0, CHAMBER.open[0], CHAMBER.top - 0.06, CHAMBER.top, -Z_IN, Z_IN),
        spanBox(CHAMBER.open[1], CHAMBER.x1, CHAMBER.top - 0.06, CHAMBER.top, -Z_IN, Z_IN),
        spanBox(CHAMBER.x0, CHAMBER.x1, FLOOR, CHAMBER.top, -Z_IN, -Z_IN + 0.06),
      ],
      label: "F",
      labelOffset: [-2.15, F_Y + 0.25, 0.5],
    },
    { id: "mercuryL", kind: "fill", fluid: "mercury", center: [-1.65, (TROUGH_BOTTOM + MERCURY) / 2, 0.05], size: [0.3, MERCURY - TROUGH_BOTTOM, 0.7], level: 1 },
    { id: "mercuryR", kind: "fill", fluid: "mercury", center: [1.65, (TROUGH_BOTTOM + MERCURY) / 2, 0.05], size: [0.3, MERCURY - TROUGH_BOTTOM, 0.7], level: 1 },
    { id: "mercuryE1", kind: "fill", fluid: "mercury", center: [(WALL.x1 + E.x - 0.16) / 2, (TROUGH_BOTTOM + MERCURY) / 2, 0], size: [E.x - 0.16 - WALL.x1, MERCURY - TROUGH_BOTTOM, 0.5], level: 1 },
    { id: "mercuryE2", kind: "fill", fluid: "mercury", center: [(E.x + 0.16 + 1.44) / 2, (TROUGH_BOTTOM + MERCURY) / 2, 0], size: [1.44 - E.x - 0.16, MERCURY - TROUGH_BOTTOM, 0.5], level: 1 },
    {
      // 倒杯 H:剖面是倒 U 形(局部原點在杯緣中央),另有背板封住、頂上的吊架(套在導桿上)、頂下的耳(吊桿的銷)
      id: "cup",
      kind: "plate",
      shape: shape(thickLine([[-CUP.half, 0], [-CUP.half, CUP.h], [CUP.half, CUP.h], [CUP.half, 0]], 0.06)),
      thickness: 0.72,
      arrow: false,
      label: "H",
      labelOffset: [0.3, CUP.h - 0.25, 0.5],
      pieces: [
        { kind: "plate", shape: shape(rect(2 * CUP.half + 0.06, CUP.h + 0.03, 0, (CUP.h + 0.03) / 2)), thickness: 0.06, at: [0, 0, -0.33] },
        { kind: "lathe", axis: [0, 1, 0], profile: [[0.05, 0], [0.12, 0], [0.12, 0.2], [0.05, 0.2]], at: [X_H, CUP.h + 0.03, 0] },
        lug(X_H, CUP.h + 0.02, CUP.h - 0.15, LUG_H),
      ],
    },
    {
      // 閥 D:封閉的杯(局部原點在杯緣中央、E 的軸線上),左壁的下端開缺口 b(剖面切過缺口),背板上有圓孔(外觀圖),頂上的耳接閥桿
      id: "valve",
      kind: "plate",
      shape: shape(thickLine([[-VALVE.half, NOTCH], [-VALVE.half, VALVE.h], [VALVE.half, VALVE.h], [VALVE.half, 0]], 0.06)),
      thickness: 0.44,
      arrow: false,
      label: "D",
      labelOffset: [0.42, VALVE.h, 0.4],
      pieces: [
        { kind: "plate", shape: shape(rect(2 * VALVE.half + 0.06, VALVE.h + 0.03, 0, (VALVE.h + 0.03) / 2), [circle(0.05, 0.08, VALVE.h - 0.2).reverse()]), thickness: 0.06, at: [0, 0, -0.19] },
        lug(X_D - E.x, VALVE.h - 0.02, VALVE.h + 0.15, LUG_D),
      ],
    },
    { id: "labelB", kind: "group", pieces: [], label: "b", labelOffset: [E.x - VALVE.half - 0.2, NOTCH - 0.35, 0.5] },
    { id: "labelE", kind: "group", pieces: [], label: "E", labelOffset: [E.x + 0.2, -1.2, 0.5] },
    {
      id: "lever",
      kind: "plate",
      shape: shape(thickLine([[-ARM_H - 0.05, 0], [ARM_D + 0.05, 0]], 0.08), [circle(0.026).reverse(), circle(0.025, -ARM_H, 0).reverse(), circle(0.025, ARM_D, 0).reverse()]),
      thickness: 0.06,
      arrow: false,
      label: "d",
      labelOffset: [-0.3, 0.15, 0.3],
    },
    { id: "rodH", kind: "link", width: 0.04, thickness: 0.03 },
    { id: "rodD", kind: "link", width: 0.04, thickness: 0.03 },
  ],
  powered: ["cup"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "主管壓力", mode: "balance", range: RANGE, initial: 1.0 },
  target: "valve", // 節流的調節閥 D
  view: { direction: [0.06, 0.08, 1] },
  pose(p) {
    const r = regulate(p);
    const travel = p * 10;
    const notchMid = (MERCURY + r.valveRim + NOTCH) / 2; // 缺口露出水銀面的那一段的中間
    const z = 0.05; // 流體示意在 E 管、D、出口室的深度裡,槓桿與桿的後面
    const gas =
      r.opening > 0.02
        ? stream(
            [
              [E.x, -1.25, z],
              [E.x, E.top + 0.08, z],
              [E.x - 0.23, E.top + 0.08, z],
              [E.x - 0.23, notchMid, z],
              [E.x - VALVE.half - 0.15, notchMid, z],
              [0.45, 0.1, z],
              [0.45, 0.5, z],
              [(CHAMBER.open[0] + CHAMBER.open[1]) / 2, 0.5, z],
              [(CHAMBER.open[0] + CHAMBER.open[1]) / 2, -0.3, z],
              [-1.0, F_Y, z],
              [-2.3, F_Y, z],
            ],
            travel,
            { spacing: 0.25 / Math.max(0.3, r.opening) },
          )
        : [];
    return {
      parts: {
        cup: { position: [0, r.cupRim, 0] },
        valve: { position: [E.x, r.valveRim, 0] },
        lever: { position: PIVOT, angle: -r.tilt },
        rodH: { from: [r.endH[0], r.endH[1], Z_ROD], to: [X_H, r.lugH, Z_ROD] },
        rodD: { from: [r.endD[0], r.endD[1], Z_ROD], to: [X_D, r.lugD, Z_ROD] },
      },
      flows: [{ fluid: "air", points: gas }],
      readouts: [
        { label: "缺口 b 露出水銀面", value: `${Math.round(r.opening * 100)}%` },
        { label: "送到燃燒器的氣量", value: r.flow.toFixed(2) },
      ],
    };
  },
  waivers: [],
};
