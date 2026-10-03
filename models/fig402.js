// 第 402 種:G. O. Guernsey 的專利錶用擒縱。用兩個擺輪,由同一個動力帶動、但朝相反方向擺動,用來抵消晃動的影響:會讓一個擺輪
// 變快的晃動,會讓另一個變慢。錨形件 A 固定在槓桿 B 上,槓桿末端有一段內齒扇形段與一段外齒扇形段,分別與兩個擺輪的
// 小齒輪咬合,所以兩個擺輪一正一反。錨形件 A 的叉瓦輪流放走擒縱輪的齒。主動件是槓桿 B(累計擺動)。
// 推斷:擺幅與齒數;兩段扇形的半徑。
import { TAU, deg, swing } from "./kit.js";
import { escapeStep } from "./escapement.js";
import { ratchetShape, shape, circle, thickLine, arcPoints } from "./shapes.js";

const P = [0.55, -0.35, 0]; // 槓桿 B(與錨形件 A)的樞軸
export const SWING = deg(9);
const SECTOR_R = 2.0; // 扇形段的節圓半徑
const PINION = 0.3;
const BAL1 = [-1.25, 1.0, 0]; // 外齒扇形段咬著這個擺輪的小齒輪(在扇形段外側)
const BAL2 = [0.15, 1.6, 0]; // 內齒扇形段咬著這個擺輪的小齒輪(在扇形段內側)
const WHEEL = [1.45, -1.2, 0];
export const N = 15;

/** 槓桿累計擺動 v → 槓桿角、兩個擺輪的轉角、擒縱輪的轉角 */
export function guernsey(v) {
  const b = swing(v, -SWING, SWING);
  return { lever: b, bal1: (-b * SECTOR_R) / PINION, bal2: (b * SECTOR_R) / PINION, wheel: -escapeStep(v, -SWING, SWING, TAU / N / 2, 0.5) };
}

const balance = (r) => [
  { kind: "plate", shape: shape(circle(r), [circle(r - 0.12).reverse()]), thickness: 0.08 },
  { kind: "box", size: [2 * r - 0.2, 0.06, 0.06] },
  { kind: "gear", teeth: 8, radius: PINION, width: 0.12, at: [0, 0, 0.1] },
];

export default {
  figure: 402,
  parts: [
    { id: "bal1", kind: "group", center: BAL1, spin: 1.15, pieces: balance(1.15) },
    { id: "bal2", kind: "group", center: BAL2, spin: 1.15, pieces: balance(1.15) },
    {
      id: "lever",
      kind: "group",
      center: P,
      arrow: false,
      label: "B",
      labelOffset: [-0.45, 0.85, 0.3],
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0, 0], [-0.9, 1.4], [-1.25, 1.85]], 0.14), [circle(0.06).reverse()]), thickness: 0.08, at: [0, 0, 0.15] },
        // 外齒與內齒扇形段(以帶齒的弧表示)
        { kind: "plate", shape: shape([...arcPoints(SECTOR_R + 0.1, deg(118), deg(140)), ...arcPoints(SECTOR_R - 0.05, deg(140), deg(118))]), thickness: 0.1, at: [0, 0, 0.15] },
        ...Array.from({ length: 8 }, (_, i) => { const a = deg(119 + i * 3); return { kind: "box", size: [0.12, 0.05, 0.1], at: [(SECTOR_R + 0.14) * Math.cos(a), (SECTOR_R + 0.14) * Math.sin(a), 0.15], angle: a }; }),
        // 錨形件 A
        { kind: "plate", shape: shape(thickLine([[0.55, -0.15], [0, 0], [0.25, -0.55]], 0.1)), thickness: 0.1, at: [0, 0, 0.15] },
      ],
    },
    { id: "labelA", kind: "group", center: P, label: "A", labelOffset: [0.65, -0.05, 0.3] },
    { id: "wheel", kind: "group", center: WHEEL, spin: 0.7, pieces: [{ kind: "plate", shape: { ...ratchetShape({ teeth: N, outer: 0.7, inner: 0.55, dir: -1 }), holes: [circle(0.08).reverse()] }, thickness: 0.1 }, { kind: "box", size: [0.12, 0.12, 0.12], at: [0.45, 0, 0.06], accent: true }] },
  ],
  driver: { part: "lever", type: "rotation", cycle: [-SWING, SWING] },
  targets: ["bal1", "bal2"], // 一正一反的兩個擺輪
  view: { direction: [0.03, 0.05, 1] },
  pose(v) {
    const g = guernsey(v);
    return { parts: { lever: { angle: g.lever }, bal1: { angle: g.bal1 }, bal2: { angle: g.bal2 }, wheel: { angle: g.wheel } }, readouts: [] };
  },
};
