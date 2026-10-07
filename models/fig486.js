// 第 486 種:垂直式風車的平面圖。帆以樞軸裝著,轉回迎風方向時以邊緣對著風,承受風力時則以正面對著風;風向如箭頭所示。
// 主動件是虛擬的「進程」:風已帶著風車轉了幾圈。風以流體示意(空氣)由下往上吹。
// 推斷:六根臂;每片帆鉸在臂端,順風那一側(右)帆面與風垂直、被推著走,逆風那一側(左)轉成與風平行;
// 經過上下兩端時帆轉過來;風車逆時針轉。
import { TAU, polar, smooth, clamp } from "./kit.js";
import { stream } from "./flow.js";
import { shape, rect, circle } from "./shapes.js";

export const ARM = 1.7;
const ARMS = 6;
const SAIL = 0.8;
const SPEED = TAU * 0.6;

/** 臂的角度 phi → 帆的世界角(0 是與風垂直、面向風;π/2 是邊緣對著風)與受風的程度 */
export function sail(phi) {
  // 臂端的速度方向(逆時針)是 (−sin, cos);順著風(+y)走的那一側受風
  const along = Math.cos(phi);
  const face = smooth(clamp((along + 0.25) / 0.5, 0, 1));
  return { angle: (1 - face) * (Math.PI / 2), face };
}

export default {
  figure: 486,
  parts: [
    // 底下的軸承座(推斷;平面圖看不到)
    { id: "frame", kind: "group", pieces: [{ kind: "cylinder", radius: 0.16, inner: 0.115, length: 0.16, at: [0, 0, -0.52] }, { kind: "box", size: [0.6, 0.6, 0.1], at: [0, 0, -0.65] }] },
    {
      id: "wheel",
      kind: "group",
      spin: ARM + 0.25,
      pieces: [
        { kind: "plate", shape: shape(rect(0.45, 0.45), [rect(0.15, 0.15).reverse()]), thickness: 0.2 },
        ...Array.from({ length: ARMS }, (_, i) => ({ kind: "box", size: [ARM, 0.08, 0.08], at: polar(ARM / 2, (i * TAU) / ARMS), angle: (i * TAU) / ARMS, ...(i === 0 ? { accent: true } : {}) })),
        { kind: "box", size: [0.15, 0.15, 0.6], at: [0, 0, -0.3] }, // 方軸(平面圖上看是端面),往下伸進底下的軸承
        { kind: "plate", shape: shape(circle(ARM * 0.82), [circle(ARM * 0.82 - 0.04).reverse()]), thickness: 0.03, at: [0, 0, -0.1] },
      ],
    },
    ...Array.from({ length: ARMS }, (_, i) => ({ id: `sail${i}`, kind: "box", size: [SAIL, 0.12, 0.3], arrow: false })),
  ],
  powered: ["wheel"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.12 },
  target: "wheel",
  view: { direction: [0.03, 0.05, 1] },
  pose(progress) {
    const w = TAU * progress; // 逆時針
    const parts = { wheel: { angle: w } };
    for (let i = 0; i < ARMS; i++) {
      const phi = w + (i * TAU) / ARMS;
      parts[`sail${i}`] = { position: polar(ARM, phi, 0.12), angle: sail(phi).angle };
    }
    const travel = progress * SPEED;
    const wind = [-1.6, -0.8, 0, 0.8, 1.6].flatMap((x) => stream([[x, -2.6, 0.2], [x, 2.6, 0.2]], travel * 1.4, { spacing: 0.6 }));
    return {
      parts,
      flows: [{ fluid: "air", points: wind }],
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["wheel", "sail5"], reason: "接合處的簡化畫法:帆板的軸插在輪臂的端頭,帆板與輪臂重疊 0.07" },
    { check: "interference", parts: ["wheel", "sail4"], reason: "接合處的簡化畫法:帆板的軸插在輪臂的端頭,帆板與輪臂重疊 0.07" },
    { check: "interference", parts: ["wheel", "sail3"], reason: "接合處的簡化畫法:帆板的軸插在輪臂的端頭,帆板與輪臂重疊 0.07" },
    { check: "interference", parts: ["wheel", "sail2"], reason: "接合處的簡化畫法:帆板的軸插在輪臂的端頭,帆板與輪臂重疊 0.07" },
    { check: "interference", parts: ["wheel", "sail1"], reason: "接合處的簡化畫法:帆板的軸插在輪臂的端頭,帆板與輪臂重疊 0.07" },
    { check: "interference", parts: ["wheel", "sail0"], reason: "接合處的簡化畫法:帆板的軸插在輪臂的端頭,帆板與輪臂重疊 0.07" },
  ],
};

