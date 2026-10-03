// 第 223 種:得到變速圓周運動的一種配置。兩根軸各裝兩個扇形齒輪段,分在前後兩個平面:前面一對是上大下小、
// 後面一對是上小下大。上軸等速轉時,先由前面一對咬合(下軸快),接著換後面一對(下軸慢);兩軸各轉一圈回到原處。
// 相對速度依各扇形段的直徑而變。主動件是上軸。
// 推斷:兩對扇形的半徑比 1.6;扇形的角度讓上軸一圈時下軸也剛好一圈(前面一對 138°、後面一對 222°)。
import { TAU, deg } from "./kit.js";
import { sectorShape, circle } from "./shapes.js";

const C = 2.6;
const BIG = 48;
const SMALL = 30;
const K = BIG / SMALL;
const PITCH = (TAU * C) / (BIG + SMALL);
const r = (n) => (n * PITCH) / TAU;
const SPAN_A = TAU / (K + 1); // 前面一對(上大下小)在上軸上的角度
const SPAN_B = TAU - SPAN_A;
const UPPER = [0, C / 2, 0];
const LOWER = [0, -C / 2, 0];
const Z = { A: 0.14, B: -0.14 };

/** 上軸轉 t(逆時針;t = 0 時前面一對剛開始咬合):下軸的轉角與目前咬合的一對 */
export function sectors(t) {
  const k = Math.floor(t / TAU);
  const f = t - k * TAU;
  if (f < SPAN_A) return { lower: -k * TAU - K * f, pair: "A" };
  return { lower: -k * TAU - K * SPAN_A - (f - SPAN_A) / K, pair: "B" };
}
export const geometry = { K, SPAN_A, SPAN_B };

// 上軸的接觸點在局部角 −π/2 − t;下軸在 π/2 − 下軸轉角
const pieces = (sectorsDef) =>
  sectorsDef.map(({ teeth, span, z }) => ({ kind: "plate", shape: sectorShape({ teeth, radius: r(teeth), span }), thickness: 0.12, at: [0, 0, z] }));
const upperSectors = pieces([
  { teeth: BIG, span: [-Math.PI / 2 - SPAN_A, -Math.PI / 2], z: Z.A },
  { teeth: SMALL, span: [-Math.PI / 2 - TAU, -Math.PI / 2 - SPAN_A], z: Z.B },
]);
const lowerSectors = pieces([
  { teeth: SMALL, span: [Math.PI / 2, Math.PI / 2 + K * SPAN_A], z: Z.A },
  { teeth: BIG, span: [Math.PI / 2 + K * SPAN_A, Math.PI / 2 + TAU], z: Z.B },
]);
const START = deg(200); // 原圖:上軸前面的大扇形在右上方

const shaft = (id, center, list) => ({
  id,
  kind: "group",
  center,
  spin: r(BIG) + 0.2,
  pieces: [...list, { kind: "cylinder", radius: 0.32, inner: 0.15, length: 0.5, mark: true }, { kind: "plate", shape: { outline: circle(0.15), holes: [] }, thickness: 0.6 }],
});

export default {
  figure: 223,
  parts: [shaft("upper", UPPER, upperSectors), shaft("lower", LOWER, lowerSectors)],
  driver: { part: "upper", type: "rotation", initial: START },
  target: "lower",
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const { lower } = sectors(theta);
    return { parts: { upper: { angle: theta }, lower: { angle: lower } }, readouts: [] };
  },
};
