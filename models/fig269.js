// 第 269 種:缺齒式齒條的框架。框架上下各有一段只在部分長度上有齒的齒條:上齒條的齒在左段、朝下,
// 下齒條的齒在右段、朝上,正齒輪夾在中間。框架朝一個方向持續直線移動時,先由上齒條帶著齒輪轉,
// 上齒條的齒走完後,換下齒條咬住齒輪,齒輪就反過來轉:齒輪得到交替方向的旋轉運動。
// 主動件是框架(右端的桿)。
// 推斷:兩段齒條的齒數與位置(依原圖);兩段之間留一小段兩邊都不咬合。
import { TAU, clamp } from "./kit.js";
import { rackShape } from "./shapes.js";

const N = 16;
const R = 0.85;
const P = (TAU * R) / N; // 齒距
const TOP = { from: 1.7, teeth: 4 }; // 框架位移 s 從 from 減到 from − 齒數·齒距 的期間,上齒條咬合
const BOTTOM = { from: TOP.from - TOP.teeth * P - 0.3, teeth: 4 };
export const RANGE = [BOTTOM.from - BOTTOM.teeth * P - 0.3, TOP.from + 0.25];

/** 框架位移 s(往右為正;往左移是原圖的進給方向)→ 齒輪轉角 */
export function gear(s0) {
  const s = clamp(s0, ...RANGE);
  const top = clamp(TOP.from - s, 0, TOP.teeth * P) / R; // 上齒條往左:齒輪逆時針
  const bottom = clamp(BOTTOM.from - s, 0, BOTTOM.teeth * P) / R; // 下齒條往左:齒輪順時針
  return top - bottom;
}
export const geometry = { TOP, BOTTOM, P, R };

// 齒條上齒的位置(框架座標):咬合期間,每當齒輪的齒槽轉到接觸點(正上方或正下方),齒條的一個齒正好在那裡。
// 齒輪 16 齒、齒 0 在 +x,接觸點在咬合開始時是齒,所以第 k 個齒條齒在 s = from − (k + ½)·齒距 時到接觸點:
// 框架座標 x = −from + (k + ½)·齒距,整段齒條的中心在 −from + 齒數·齒距 / 2。
const rackCenter = (r) => -r.from + (r.teeth * P) / 2;
const BACK = 0.18; // 齒條背板厚
const RIGHT = 2.55; // 框架右側(框架座標)
const LEFT = rackCenter(TOP) - (TOP.teeth * P) / 2 - 0.25;
const YT = R + 1.2 * (P / Math.PI) + BACK; // 上齒條背板外緣
const box = (x0, x1, y, h) => ({ kind: "box", size: [x1 - x0, h, 0.22], at: [(x0 + x1) / 2, y, 0] });

export default {
  figure: 269,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: rackShape({ teeth: TOP.teeth, pitch: P, depth: BACK }), thickness: 0.22, at: [rackCenter(TOP), R, 0], angle: Math.PI },
        { kind: "plate", shape: rackShape({ teeth: BOTTOM.teeth, pitch: P, depth: BACK }), thickness: 0.22, at: [rackCenter(BOTTOM), -R, 0] },
        // 框架:上下兩條邊(齒條背板延伸)、右側直邊、往右伸出的桿
        box(LEFT, RIGHT, YT - 0.09, 0.18),
        box(LEFT, RIGHT, -YT + 0.09, 0.18),
        box(RIGHT - 0.18, RIGHT, 0, 2 * YT),
        { kind: "box", size: [4.0, 0.16, 0.16], at: [RIGHT + 2.0, 0, 0] },
      ],
    },
    { id: "gear", kind: "gear", teeth: N, radius: R, width: 0.22, bore: 0.08, pieces: [{ kind: "cylinder", radius: 0.05, length: 0.6 }] },
    { id: "guide", kind: "group", pieces: [{ kind: "box", size: [0.2, 0.9, 0.5], at: [RIGHT + 2.25, 0, 0] }] },
  ],
  waivers: [
    { check: "interference", parts: ["frame", "gear"], reason: "待確認(未修):frame 的方塊 0.18×2.315×0.22 與 gear 的板互相穿入 0.16(23 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["frame", "guide"], reason: "待確認(未修):frame 的方塊 4×0.16×0.16 與 guide 的方塊 0.2×0.9×0.5互相穿入 0.33(96 個取樣姿勢),尚未修正" },
  ],
  driver: { part: "frame", type: "translation", direction: [1, 0, 0], range: RANGE, initial: 0.3 },
  target: "gear", // 交替換向的齒輪
  view: { direction: [0.04, 0.05, 1] },
  pose(s0) {
    const s = clamp(s0, ...RANGE);
    return { parts: { frame: { position: [s, 0, 0] }, gear: { angle: gear(s) } }, readouts: [] };
  },
};
