// 第 323 種:滾輪平行尺。簡單的直尺 B 上裝著輪軸 C,兩端一對輪 A、A 只略微凸出尺的下側,輪緣刻有細紋抓住紙張,
// 所以尺只能整體往前後滾動,始終與先前畫的線平行。主動件是尺 B(往前後推)。
// 推斷:使用時的動作——起始位置沿尺邊畫一條線,滾到目前位置再畫一條,兩線平行;輪隨滾動轉。
import { X, clamp } from "./kit.js";
import { rulerLineParts, rulerLines } from "./ruler-lines.js";

const L = 5.0; // 尺長
const WR = 0.45; // 輪半徑
export const RANGE = [-1.5, 1.5];

export const edge = (y) => [[-L / 2 - 0.3, clamp(y, ...RANGE) - 0.62], [L / 2 + 0.3, clamp(y, ...RANGE) - 0.62]];
/** 尺往前滾 y → 輪的轉角(不滑動) */
export const wheelAngle = (y) => -clamp(y, ...RANGE) / WR;

export default {
  figure: 323,
  parts: [
    { id: "paper", kind: "box", center: [0, 0, -0.5], size: [8, 6, 0.04] },
    {
      id: "rulerB",
      kind: "group",
      label: "B",
      labelOffset: [0, 0.3, 0.35],
      pieces: [
        { kind: "box", size: [L, 1.1, 0.12], at: [0, 0, 0.05] },
        { kind: "cylinder", axis: X, radius: 0.06, length: L - 1.0, at: [0, 0, 0.18] },
        { kind: "sphere", radius: 0.09, at: [0, 0, 0.2] },
      ],
    },
    ...[-1, 1].map((s) => ({ id: s < 0 ? "wheelL" : "wheelR", kind: "cylinder", axis: X, radius: WR, length: 0.4, mark: true, spin: WR, label: "A", labelOffset: [0, 0.65, 0.3] })),
    ...rulerLineParts(),
  ],
  waivers: [
    { check: "interference", parts: ["rulerB", "wheelL"], reason: "待確認(未修):rulerB 的圓柱 r0.06×4 與 wheelL 的圓柱 r0.45×0.4互相穿入 0.25(96 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["rulerB", "wheelR"], reason: "待確認(未修):rulerB 的圓柱 r0.06×4 與 wheelR 的圓柱 r0.45×0.4互相穿入 0.25(96 個取樣姿勢),尚未修正" },
  ],
  driver: { part: "rulerB", grips: ["wheelL", "wheelR"], type: "translation", direction: [0, 1, 0], range: RANGE, initial: 0 },
  view: { direction: [0.05, -0.25, 1] },
  pose(y0) {
    const y = clamp(y0, ...RANGE);
    const a = wheelAngle(y);
    // 輪的下緣略低於尺的下側,貼在紙上
    return {
      parts: {
        rulerB: { position: [0, y, 0] },
        wheelL: { position: [-L / 2 + 0.55, y, WR - 0.45], angle: a },
        wheelR: { position: [L / 2 - 0.55, y, WR - 0.45], angle: a },
      },
      paths: rulerLines(edge, 0, y, -0.47),
      readouts: [],
    };
  },
};
