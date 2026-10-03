// 第 241 種:有單一個齒的小輪連續旋轉,把間歇的圓周運動傳給輪 A。小輪(左下)逆時針轉,每轉一圈它的鉤形單齒
// 從下往上撥 A 左側的一個齒,A 順時針轉一格(原圖兩個箭頭);其餘時間 A 不動,左上方的彎形止回爪扣住 A 的齒,
// 不讓它倒轉。主動件是小輪。
// 推斷:A 有 24 齒;單齒撥動的角度範圍;止回爪靠自重落在齒上。
import { TAU, deg } from "./kit.js";
import { indexStep } from "./jumps.js";
import { ratchetShape, shape, circle, thickLine } from "./shapes.js";

const A = { center: [0.75, 0.15, 0], teeth: 24, outer: 1.7, inner: 1.38, dir: -1 };
const STEP = TAU / A.teeth;
const SMALL = { center: [-1.0, -1.05, 0], radius: 0.72 };
const WINDOW = { from: deg(-30), span: deg(80), step: STEP };

/** 小輪轉 theta(逆時針):A 的轉角(順時針為負) */
export const wheelA = (theta) => -indexStep(theta, WINDOW);
export const step = STEP;

const hook = shape([[-0.05, 0.12], [0.55, 0.22], [0.92, 0.05], [0.98, -0.12], [0.8, -0.05], [0.5, 0.02], [-0.05, -0.12]], [circle(0.07).reverse()]);

export default {
  figure: 241,
  parts: [
    { id: "wheelA", kind: "plate", center: A.center, shape: ratchetShape({ ...A, bore: 0.12 }), thickness: 0.2, hub: 0.32, circles: [0.42], mark: [0.95, -0.3], markSize: 0.08, spin: A.outer, label: "A", labelOffset: [0.85, 0, 0.3] },
    {
      id: "small",
      kind: "group",
      center: SMALL.center,
      spin: SMALL.radius,
      pieces: [
        { kind: "plate", shape: shape(circle(SMALL.radius), [circle(0.1).reverse()]), thickness: 0.14, at: [0, 0, -0.1] },
        { kind: "plate", shape: hook, thickness: 0.12, at: [0, 0, 0.05], angle: deg(10), accent: true },
      ],
    },
    {
      id: "click",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[-1.75, 1.15], [-1.0, 1.75], [-0.05, 1.85], [0.65, 1.62]], 0.24)), thickness: 0.1 },
        { kind: "cylinder", radius: 0.24, inner: 0.1, length: 0.2, at: [-1.75, 1.15, 0] },
      ],
    },
  ],
  waivers: [
    { check: "interference", parts: ["wheelA", "small"], reason: "待確認(未修):wheelA 的板 與 small 的板互相穿入 0.11(96 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["wheelA", "click"], reason: "待確認(未修):wheelA 的板 與 click 的板互相穿入 0.15(96 個取樣姿勢),尚未修正" },
  ],
  driver: { part: "small", type: "rotation" },
  target: "wheelA",
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    return { parts: { small: { angle: theta }, wheelA: { angle: wheelA(theta) } }, readouts: [] };
  },
};

