// 第 392 種:跳鋸(線鋸)。鋸條的下端接在曲柄(下方的輪)上的連桿,由曲柄帶著上下;上端接在一根彈簧(上方的彈性橫桿)上,
// 彈簧讓鋸條始終繃緊,不必用鋸框。鋸條穿過工作台中間的孔上下鋸。主動件是下方的曲柄輪。
// 推斷:上端的彈簧畫成一根吊在頂部橫桿下的螺旋彈簧,鋸條往下時被拉長;各部尺寸依原圖。
import { crankPin } from "./linkage.js";
import { shape, circle, rect } from "./shapes.js";

const CRANK = { center: [0, -2.2, 0], r: 0.45 };
const ROD = 1.5;
const BLADE = 2.6;
const HANG = 3.75; // 彈簧上端(頂部橫桿)的高度

/** 曲柄轉 theta → 曲柄銷、鋸條下端與上端的高度 */
export function gigSaw(theta) {
  const pin = crankPin(CRANK.center, CRANK.r, theta);
  const low = pin[1] + Math.sqrt(ROD * ROD - pin[0] ** 2);
  return { pin, low, top: low + BLADE };
}

export default {
  figure: 392,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 工作台、上方的導架(兩根立柱)、下方的支架
        { kind: "plate", shape: shape(rect(4.4, 0.3, 0, 0.25), [rect(0.25, 0.32, 0, 0.25).reverse()]), thickness: 0.8 },
        { kind: "box", size: [0.12, 2.6, 0.12], at: [-0.35, 1.7, 0] },
        { kind: "box", size: [0.12, 2.6, 0.12], at: [0.35, 1.7, 0] },
        { kind: "box", size: [0.12, 1.6, 0.12], at: [-0.35, -0.7, 0] },
        { kind: "box", size: [0.12, 1.6, 0.12], at: [0.35, -0.7, 0] },
        { kind: "box", size: [2.6, 0.18, 0.3], at: [1.0, HANG + 0.1, 0] },
      ],
    },
    {
      id: "crank",
      kind: "group",
      center: CRANK.center,
      spin: 0.85,
      pieces: [
        { kind: "plate", shape: shape(circle(0.85), [circle(0.7).reverse()]), thickness: 0.12 },
        ...[0, 1, 2].map((i) => ({ kind: "box", size: [1.5, 0.08, 0.08], angle: (i * Math.PI) / 3 })),
        { kind: "cylinder", radius: 0.06, length: 0.3, at: [CRANK.r, 0, 0.12], accent: true },
      ],
    },
    { id: "rod", kind: "link", width: 0.12, thickness: 0.06 },
    { id: "blade", kind: "group", arrow: false, pieces: [{ kind: "box", size: [0.08, BLADE, 0.02], at: [0, BLADE / 2, 0] }, ...Array.from({ length: 16 }, (_, i) => ({ kind: "box", size: [0.05, 0.05, 0.02], at: [-0.05, 0.1 + i * 0.16, 0], angle: 0.8 }))] },
    { id: "spring", kind: "spring", coils: 9, radius: 0.1, wire: 0.02 },
  ],
  driver: { part: "crank", type: "rotation" },
  view: { direction: [0.08, 0.05, 1] },
  pose(theta) {
    const g = gigSaw(theta);
    return {
      parts: {
        crank: { angle: theta },
        rod: { from: [g.pin[0], g.pin[1], 0.15], to: [0, g.low, 0.15] },
        blade: { position: [0, g.low, 0.05] },
        spring: { from: [0, HANG, 0.05], to: [0, g.top, 0.05] },
      },
      readouts: [],
    };
  },
};
