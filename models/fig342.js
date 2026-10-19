// 第 342 種:以大氣壓力運作的舊式單動式樑式抽水引擎(紐科門式)。活塞桿與樑端的扇形段(弓頭)之間以鏈條相連,
// 汽缸頂部開放。極低壓的蒸汽從活塞下方進入,樑另一端抽水桿的重量幫忙把活塞抬起;接著噴水把蒸汽冷凝,活塞下方
// 成為真空,大氣壓力把活塞推下,把抽水桿拉起。主動件是虛擬的「進程」;蒸汽與噴水以流體示意。
// 鏈條上端固定在弓頭頂端,沿弓頭繞到最左的切點再鉛直垂下,下端接活塞桿頂的接頭(原圖的方塊);鏈條長度不變,
// 樑抬到頂時垂下段仍有一段,活塞桿頂始終在弓頭下方。活塞桿在鏈條的直線上、走汽缸中心線。
// 推斷:一輪中抬起與推下所佔的時間;樑右半(原圖右邊切掉):右端同樣是弓頭,鏈條吊著往下的抽水桿,
// 抽水桿下端的桶在泵筒裡上下(弓頭半徑比左邊小,抽水行程較短);樑的軸承座立在樑台上,樑台架在右邊的牆
// (原圖右邊兩條直線)與左端的立柱上,牆、立柱、汽缸的台座與泵筒都站在地面上。
import { Y, deg, smooth, clamp } from "./kit.js";
import { stream } from "./flow.js";
import { backHalf } from "./section.js";
import { shape, thickLine, arcPoints, circle } from "./shapes.js";
import { pedestal } from "./supports.js";

const PIVOT = [2.4, 1.25, 0]; // 樑的樞軸(在畫面右邊)
const ARCH = 3.2; // 左弓頭半徑
const LINE = ARCH + 0.12; // 鏈條中心線離樞軸的距離(貼在弓頭外緣上)
const PUMP_ARCH = 2.2; // 右弓頭半徑(推斷)
const PUMP_LINE = PUMP_ARCH + 0.12;
const SWING = deg(13);
const CYL = { x: PIVOT[0] - LINE, top: -1.35, length: 1.8, radius: 0.55 };
const HANG = 1.3; // 樑水平時左邊鏈條垂下的長度
const PUMP_HANG = 1.0; // 樑水平時右邊鏈條垂下的長度
const BLOCK = 0.2; // 鏈條下端的接頭
const ROD = 1.95; // 接頭到活塞
const PUMP_ROD = 2.4; // 接頭到抽水桿下端的桶
const ANCHOR = deg(160); // 左邊鏈條上端固定在弓頭上的角度(弓頭頂端)
const PUMP_ANCHOR = deg(20); // 右邊鏈條上端
const FLOOR = -3.47; // 地面(汽缸台座的底)
const TIMBER = [0.525, 0.875]; // 樑台的上下緣
const POST_X = -2.45; // 樑台左端的立柱
const WALL_X = 2.5; // 右邊的牆(樞軸下方)
const PUMP_X = PIVOT[0] + PUMP_LINE;
const BARREL = { top: -1.5, radius: 0.3, inner: 0.2 };

/** 進程 p → 樑角(正值為左端往下)、活塞桿頂(左鏈條下端)高度、活塞高度、抽水桿頂(右鏈條下端)高度、目前的階段 */
export function atmospheric(p) {
  const f = ((p % 1) + 1) % 1;
  // 0–0.55:蒸汽進入、配重把活塞抬起;0.55–0.65:噴水冷凝;0.65–1:大氣壓力把活塞推下
  let lift;
  if (f < 0.55) lift = smooth(f / 0.55);
  else if (f < 0.65) lift = 1;
  else lift = 1 - smooth((f - 0.65) / 0.35);
  const psi = SWING - 2 * SWING * lift; // 正值:弓頭(左端)往下
  // 鏈條長度不變:弓頭轉 psi,繞在弓頭上的長度少 LINE·psi,垂下的就多這麼多
  const top = PIVOT[1] - (HANG + LINE * psi);
  const pumpTop = PIVOT[1] - (PUMP_HANG - PUMP_LINE * psi);
  const phase = f < 0.55 ? "steam" : f < 0.65 ? "condense" : "down";
  return { psi, top, piston: top - BLOCK - ROD, pumpTop, phase };
}
export const geometry = { ARCH, PUMP_ARCH };

// 樑:從樞軸往兩邊伸到弓頭,弓頭是以樞軸為圓心的一段弧(鏈條貼在上面);樑身與斜撐都伸進弓頭的內緣
const archPlate = (r, a0, a1) => ({ kind: "plate", shape: shape([...arcPoints(r + 0.1, a0, a1), ...arcPoints(r - 0.25, a1, a0)]), thickness: 0.22 });
const beam = [
  { kind: "plate", shape: shape(thickLine([[PUMP_ARCH - 0.15, 0.1], [0, 0], [-ARCH + 0.2, 0.1]], 0.55), [circle(0.18).reverse()]), thickness: 0.18 },
  archPlate(ARCH, deg(160), deg(196)),
  { kind: "plate", shape: shape(thickLine([[-ARCH + 0.2, 0.15], [-1.3, 1.25], [0.2, 0.3]], 0.12)), thickness: 0.1 },
  archPlate(PUMP_ARCH, deg(-16), deg(20)),
  { kind: "plate", shape: shape(thickLine([[-0.2, 0.3], [1.0, 1.0], [PUMP_ARCH - 0.15, 0.15]], 0.12)), thickness: 0.1 },
  { kind: "cylinder", radius: 0.3, length: 0.5 },
  { kind: "cylinder", radius: 0.12, length: 0.85, at: [0, 0, -0.175] }, // 樑的軸,往後穿過軸承座的環
];

/** 鏈條:上端固定在弓頭(半徑 r 的中心線上、角度 anchor),沿弓頭繞到切點(角度 tangent),再鉛直垂下到 bottom */
function chainPath(r, anchor, tangent, bottom) {
  const wrapped = Array.from({ length: 9 }, (_, i) => {
    const t = anchor + ((tangent - anchor) * i) / 8;
    return [PIVOT[0] + r * Math.cos(t), PIVOT[1] + r * Math.sin(t), 0];
  });
  return [...wrapped, [PIVOT[0] + r * Math.cos(tangent), bottom, 0]];
}

export default {
  figure: 342,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [WALL_X + 0.5 - (POST_X - 0.15), TIMBER[1] - TIMBER[0], 0.6], at: [(WALL_X + 0.5 + POST_X - 0.15) / 2, (TIMBER[0] + TIMBER[1]) / 2, -0.6] }, // 樑台
        { kind: "box", size: [1.0, TIMBER[0] - FLOOR, 0.6], at: [WALL_X, (TIMBER[0] + FLOOR) / 2, -0.6] }, // 牆
        { kind: "box", size: [0.3, TIMBER[0] - FLOOR, 0.6], at: [POST_X, (TIMBER[0] + FLOOR) / 2, -0.6] }, // 樑台左端的立柱
        ...pedestal({ at: [PIVOT[0], PIVOT[1]], z: -0.45, bore: 0.12, floor: TIMBER[1] }), // 樑的軸承座,立在樑台上
        { kind: "box", size: [1.8, 0.2, 1.2], at: [CYL.x, CYL.top - CYL.length - 0.12 - 0.1, 0] }, // 汽缸的台座
        { kind: "cylinder", axis: Y, radius: BARREL.radius, inner: BARREL.inner, length: BARREL.top - FLOOR, at: [PUMP_X, (BARREL.top + FLOOR) / 2, 0] }, // 泵筒
        { kind: "box", size: [PUMP_X + 0.5 - (POST_X - 0.15), 0.18, 1.6], at: [(PUMP_X + 0.5 + POST_X - 0.15) / 2, FLOOR - 0.09, -0.2] }, // 地面
      ],
    },
    {
      id: "cylinder",
      kind: "lathe",
      axis: Y,
      center: [CYL.x, CYL.top - CYL.length, 0],
      profile: [[CYL.radius, CYL.length], [CYL.radius + 0.12, CYL.length], [CYL.radius + 0.12, -0.12], [0, -0.12], [0, 0], [CYL.radius, 0]],
      ...backHalf(Y),
    },
    { id: "steam", kind: "fill", fluid: "steam", shape: "cylinder", size: [2 * CYL.radius - 0.04, CYL.length, 0], level: 0 },
    { id: "piston", kind: "cylinder", axis: Y, radius: CYL.radius - 0.02, length: 0.2 },
    { id: "pistonRod", kind: "box", size: [0.1, ROD, 0.1], pieces: [{ kind: "box", size: [0.22, BLOCK, 0.22], at: [0, ROD / 2 + BLOCK / 2, 0] }] },
    { id: "beam", kind: "group", center: PIVOT, arrow: false, pieces: beam },
    { id: "chain", kind: "chain", style: "plate", pitch: 0.24, width: 0.16, offset: 0.06 },
    { id: "pumpChain", kind: "chain", style: "plate", pitch: 0.24, width: 0.16, offset: 0.06 },
    {
      id: "pumpRod",
      kind: "box",
      size: [0.12, PUMP_ROD, 0.12],
      pieces: [
        { kind: "box", size: [0.22, BLOCK, 0.22], at: [0, PUMP_ROD / 2 + BLOCK / 2, 0] },
        { kind: "cylinder", axis: Y, radius: BARREL.inner - 0.01, length: 0.15, at: [0, -PUMP_ROD / 2, 0] }, // 桶
      ],
    },
  ],
  powered: ["piston"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], speed: 0.15 },
  target: "pumpRod", // 被拉起的抽水桿
  view: { direction: [0.03, 0.05, 1] },
  pose(p) {
    const a = atmospheric(p);
    const bottom = CYL.top - CYL.length;
    const x = CYL.x;
    const flows = [];
    if (a.phase === "steam") flows.push({ fluid: "steam", points: stream([[x + 1.5, bottom - 0.6, 0.2], [x + 1.5, bottom + 0.15, 0.2], [x, bottom + 0.15, 0.2]], p * 10, { spacing: 0.2 }) });
    if (a.phase === "condense") flows.push({ fluid: "water", points: stream([[x - 1.4, bottom + 0.3, 0.2], [x - 0.6, bottom + 0.3, 0.2], [x, bottom + 0.6, 0.2]], p * 30, { spacing: 0.12 }) });
    return {
      parts: {
        beam: { angle: a.psi },
        piston: { position: [x, a.piston, 0] },
        pistonRod: { position: [x, a.top - BLOCK - ROD / 2, 0] },
        pumpRod: { position: [PUMP_X, a.pumpTop - BLOCK - PUMP_ROD / 2, 0] },
        steam: { position: [x, bottom + CYL.length / 2, 0], level: a.phase === "down" ? 0 : clamp((a.piston - 0.1 - bottom) / CYL.length, 0, 1) },
      },
      paths: {
        chain: { points: chainPath(LINE, ANCHOR + a.psi, Math.PI, a.top), closed: false, phase: 0 },
        pumpChain: { points: chainPath(PUMP_LINE, PUMP_ANCHOR + a.psi, 0, a.pumpTop), closed: false, phase: 0 },
      },
      flows,
      readouts: [],
    };
  },
};
