// 第 499 種:無液壓力計,以法國發明者之名稱為「布爾登壓力計」。B 是兩端封閉的彎管,在長度中點 C 處固定,兩端可自由移動。
// 引進管內的蒸汽或其他流體的壓力,依其強度使管子或多或少地伸直。管子的兩端接到一個齒形扇形段上,
// 扇形段與指針心軸上的小齒輪嚙合,在錶盤上指示壓力。
// 主動件是虛擬的「壓力」。
// 推斷:彎管的中點夾在錶殼頂的夾塊 C 裡(原圖 C 是錶殼頂的夾塊),兩半各沿錶殼內側彎下來;伸直以「彎曲半徑隨壓力變大、
// 管長不變」表示,壓力 10 時半徑只大 3%(管端往外移約 0.1,整根管留在錶殼裡)。
// 扇形段照原圖是 Y 形:樞軸在中間,有齒的一段朝上對著小齒輪;左拉桿接在樞軸左上方的銷、右拉桿接在樞軸下方的尾端
// ——兩端往外拉時,兩根拉桿給扇形段的扭矩同向(逆時針)。拉桿是剛性的:扇形段轉角由左拉桿的長度解出(兩圓交點),
// 右拉桿接在尾端的位置是讓它在整個壓力範圍裡兩端距離幾乎不變的那一點(變化 < 0.001,彎管的端點可以些微撓曲吸收)。
// 扇形段與小齒輪各套在一根插在背板上的樞銷 / 軸承上(推斷);錶盤是一條以小齒輪為圓心的弧形板,兩端接在錶殼內壁上,
// 刻度刻在錶盤上、照機構標定(每單位壓力指針實際轉到的角度)。
// 引進流體到 C 的通路原圖沒畫,模型也不畫。
import { deg, clamp } from "./kit.js";
import { meshAngle } from "./gears.js";
import { circleCircle, angleOf } from "./linkage.js";
import { shape, circle, arcPoints, stadium } from "./shapes.js";

export const R0 = 1.25; // 沒有壓力時的彎曲半徑
const SPAN = deg(150); // 每一半從 C 量起轉過的角度
export const RANGE = [0, 10];
const K = 0.003; // 每單位壓力半徑變大的比例
export const TUBE_R = 0.07; // 彎管的半徑
export const CASE_IN = 1.6; // 錶殼內壁
export const C = [0, R0, 0]; // 彎管的中點(夾塊 C)

/** 壓力 p → 彎曲半徑、右半管端的位置(左半對稱) */
export function tubeEnd(p0) {
  const p = clamp(p0, ...RANGE);
  const r = R0 * (1 + K * p);
  const span = (R0 * SPAN) / r; // 管長不變
  const center = [0, C[1] - r, 0];
  return { r, span, center, end: [center[0] + r * Math.sin(span), center[1] + r * Math.cos(span), 0] };
}

const END0 = tubeEnd(0).end;
const ARM = 0.22; // 左銷在樞軸上方的高度
export const PIVOT = [0, END0[1] - ARM, 0]; // 扇形段的樞軸
const PIN_L0 = [-0.04, END0[1]]; // 左銷(壓力 0 時,世界座標):左拉桿水平
const ROD_L = Math.hypot(PIN_L0[0] + END0[0], PIN_L0[1] - END0[1]);
const PIN_L = [PIN_L0[0] - PIVOT[0], PIN_L0[1] - PIVOT[1]]; // 扇形段局部
const PIN_R = [0.07, -0.144]; // 右銷:樞軸下方的尾端(扇形段局部)
const SECTOR = { center: PIVOT, teeth: 33, radius: 0.4 };
const PINION_R = (SECTOR.radius * 8) / 33;
const PINION = { center: [0, PIVOT[1] + SECTOR.radius + PINION_R, 0], teeth: 8, radius: PINION_R };
const SECTOR_SPAN = [deg(42), deg(108)]; // 有齒的一段(咬合點在局部 90° − 轉角,轉角 0…29°,兩邊各留一齒多)
const Z = { gear: -0.09, rod: 0, dial: 0.12, pointer: 0.17, back: -0.15 }; // 各層(背板正面在 −0.15)
const DIAL = { inner: 1.45, outer: 1.75, from: deg(20), to: deg(160) }; // 錶盤:以小齒輪為圓心的弧形板
const POINTER = { zero: deg(150), length: 1.6 };

const world = (local, angle) => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [PIVOT[0] + local[0] * c - local[1] * s, PIVOT[1] + local[0] * s + local[1] * c, 0];
};

/** 壓力 p → 管端、扇形段轉角(左拉桿長度不變解出)、兩根銷的位置、小齒輪轉角 */
export function bourdon(p) {
  const t = tubeEnd(p);
  const endL = [-t.end[0], t.end[1], 0];
  const endR = [t.end[0], t.end[1], 0];
  const pin = circleCircle(endL, ROD_L, PIVOT, Math.hypot(...PIN_L), 1).point;
  const sector = angleOf(PIVOT, pin) - Math.atan2(PIN_L[1], PIN_L[0]);
  return { ...t, endL, endR, sector, pinL: world(PIN_L, sector), pinR: world(PIN_R, sector), pinion: meshAngle(SECTOR, PINION, sector) };
}
const REST = bourdon(0);
/** 壓力 p 時指針的方向 */
export const pointerAngle = (p) => POINTER.zero + (bourdon(p).pinion - REST.pinion);

/** 一半彎管的折線(右半 s = 1,左半 s = −1) */
const half = (b, s) => Array.from({ length: 25 }, (_, i) => {
  const a = (b.span * i) / 24;
  return [s * b.r * Math.sin(a), b.center[1] + b.r * Math.cos(a), Z.rod];
});

const at = (xy, z) => [xy[0], xy[1], z];
const dialOutline = [...arcPoints(DIAL.outer, DIAL.from, DIAL.to, PINION.center[0], PINION.center[1]), ...arcPoints(DIAL.inner, DIAL.to, DIAL.from, PINION.center[0], PINION.center[1])];
const ticks = Array.from({ length: 11 }, (_, i) => {
  const a = pointerAngle(i);
  return { kind: "box", size: [0.15, 0.025, 0.015], at: [PINION.center[0] + 1.53 * Math.cos(a), PINION.center[1] + 1.53 * Math.sin(a), Z.dial + 0.015 + 0.0075], angle: a };
});
const PIN_LEN = Z.rod + 0.03 - (Z.gear + 0.03); // 拉桿銷:從扇形段正面伸到拉桿那一層

export default {
  figure: 499,
  parts: [
    {
      id: "case",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(circle(1.75), [circle(CASE_IN).reverse()]), thickness: 0.4, at: [0, 0, 0.05] },
        { kind: "plate", shape: shape(circle(1.75)), thickness: 0.04, at: [0, 0, Z.back - 0.02] }, // 背板(兼機芯板)
        { kind: "cylinder", radius: 0.1, length: 1.2, axis: [0, 1, 0], at: [0, -2.3, 0] }, // 下面的接管
        // 夾塊 C(推斷):套住彎管中點的夾套(孔 = 管徑)與把它接到錶殼頂的塊
        { kind: "cylinder", radius: 0.13, inner: TUBE_R, length: 0.24, axis: [1, 0, 0], at: C },
        { kind: "box", size: [0.2, CASE_IN + 0.02 - (C[1] + 0.12), 0.2], at: [0, (CASE_IN + 0.02 + C[1] + 0.12) / 2, 0] },
        // 錶盤(推斷:原圖的弧形錶盤)與刻在上面的刻度
        { kind: "plate", shape: shape(dialOutline), thickness: 0.03, at: [0, 0, Z.dial] },
        ...ticks,
        // 扇形段的樞銷、小齒輪心軸的軸承,插在背板上(推斷)
        { kind: "cylinder", radius: 0.03, length: 0.11, at: at(PIVOT, Z.back + 0.055) },
        { kind: "cylinder", radius: 0.05, inner: 0.025, length: 0.025, at: at(PINION.center, Z.back + 0.0125) },
      ],
    },
    { id: "labelC", kind: "group", pieces: [], label: "C", labelOffset: [0, CASE_IN + 0.1, 0.3] },
    { id: "tubeL", kind: "rod", radius: TUBE_R, label: "B", labelOffset: [-1.45, 0.1, 0.3] },
    { id: "tubeR", kind: "rod", radius: TUBE_R },
    { id: "rodL", kind: "rod", radius: 0.025 },
    { id: "rodR", kind: "rod", radius: 0.025 },
    {
      id: "sector",
      kind: "gear",
      center: at(PIVOT, Z.gear),
      teeth: SECTOR.teeth,
      radius: SECTOR.radius,
      width: 0.06,
      arrow: false,
      span: SECTOR_SPAN, // 繪圖:扇形齒輪
      // 掃描工具(不認得 span)用:與 sectorShape 同一段齒
      mask: (i) => i >= Math.ceil(SECTOR_SPAN[0] / ((2 * Math.PI) / SECTOR.teeth) + 0.5 - 1e-9) && i <= Math.floor(SECTOR_SPAN[1] / ((2 * Math.PI) / SECTOR.teeth) - 0.5 + 1e-9),
      pieces: [
        { kind: "cylinder", radius: 0.07, inner: 0.03, length: 0.06 }, // 套在樞銷上的轂
        { kind: "plate", shape: stadium(Math.hypot(...PIN_R), 0.1), thickness: 0.06, angle: Math.atan2(PIN_R[1], PIN_R[0]) }, // 樞軸下方的尾端
        // 接拉桿的兩根銷
        ...[PIN_L, PIN_R].map((q) => ({ kind: "cylinder", radius: 0.025, length: PIN_LEN, at: [q[0], q[1], PIN_LEN / 2 + 0.03] })),
      ],
    },
    {
      id: "pointer",
      kind: "plate",
      center: at(PINION.center, Z.pointer),
      shape: shape([[-0.12, -0.03], [POINTER.length, 0], [-0.12, 0.03]]),
      thickness: 0.03,
      accent: true,
      spin: 0.3,
      pieces: [
        { kind: "gear", teeth: PINION.teeth, radius: PINION.radius, width: 0.06, at: [0, 0, Z.gear - Z.pointer] },
        { kind: "cylinder", radius: 0.025, length: Z.pointer - Z.back, at: [0, 0, -(Z.pointer - Z.back) / 2] }, // 心軸:從背板的軸承到指針
      ],
    },
  ],
  powered: ["tubeL", "tubeR"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "壓力", mode: "balance", range: RANGE, initial: 4 },
  target: "pointer", // 在錶盤上指示壓力的指針
  view: { direction: [0.03, 0.05, 1] },
  pose(p) {
    const b = bourdon(p);
    return {
      parts: {
        sector: { angle: b.sector },
        // 指針:壓力為零時指向左上的零點,隨小齒輪順時針轉
        pointer: { angle: pointerAngle(p) },
      },
      paths: {
        tubeL: { points: half(b, -1), closed: false },
        tubeR: { points: half(b, 1), closed: false },
        rodL: { points: [b.endL, b.pinL], closed: false },
        rodR: { points: [b.endR, b.pinR], closed: false },
      },
      readouts: [{ label: "壓力", value: clamp(p, ...RANGE).toFixed(1) }],
    };
  },
};
