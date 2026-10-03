// 第 205 種:由「兩齒小齒輪」驅動的輪。這個小齒輪其實是兩個凸輪(前後各一),分別與輪兩面上兩組獨立的齒咬合:
// 前面一組長齒、後面一組短齒,兩組交錯排列。兩個凸輪方向相差半圈,小齒輪每轉半圈就由其中一個凸輪推動輪走一格
// (從一組的齒到另一組的下一齒),輪因此幾乎連續地轉。主動件是小齒輪。
// 推斷:輪的轉速取平均(每轉小齒輪一圈,輪走兩格);齒數與凸輪形狀依原圖。
import { TAU, polar } from "./kit.js";
import { shape, circle, polarOutline } from "./shapes.js";

const N = 12; // 每一組的齒數
const STEP = TAU / (2 * N); // 一格(前後兩組交錯)
const RIM = 1.95;
const PINION = [0, -2.8, 0];

/** 小齒輪轉 alpha(逆時針):輪轉的角度(順時針為負)——每轉半圈走一格 */
export const wheelAngle = (alpha) => -(alpha / Math.PI) * STEP;
export const geometry = { N, STEP };

const teeth = (front) =>
  Array.from({ length: N }, (_, i) => {
    const a = Math.PI / 2 + (front ? STEP : 0) + i * 2 * STEP;
    const [l, w, r] = front ? [0.62, 0.2, RIM + 0.22] : [0.3, 0.2, RIM + 0.08];
    return { kind: "box", size: [l, w, 0.16], at: [...polar(r, a).slice(0, 2), front ? 0.2 : -0.2], angle: a, accent: front && i === 0 };
  });
// 凸輪:一端尖、一端圓的蛋形(往 +y 伸出)
const cam = shape(polarOutline((a) => 0.32 + 0.5 * Math.max(0, Math.sin(a)) ** 2), [circle(0.1).reverse()]);

export default {
  figure: 205,
  parts: [
    {
      id: "wheel",
      kind: "group",
      spin: RIM + 0.5,
      pieces: [
        { kind: "plate", shape: shape(circle(RIM), [circle(0.25).reverse()]), thickness: 0.2 },
        { kind: "cylinder", radius: 0.48, inner: 0.25, length: 0.35 },
        ...teeth(true),
        ...teeth(false),
      ],
    },
    {
      id: "pinion",
      kind: "group",
      center: PINION,
      spin: 0.85,
      pieces: [
        { kind: "plate", shape: cam, thickness: 0.16, at: [0, 0, 0.2] },
        { kind: "plate", shape: cam, thickness: 0.16, at: [0, 0, -0.2], angle: Math.PI },
        { kind: "cylinder", radius: 0.18, inner: 0.08, length: 0.65, mark: true },
      ],
    },
  ],
  driver: { part: "pinion", type: "rotation", speed: 2 },
  target: "wheel",
  view: { direction: [0.15, 0.1, 1] },
  pose(alpha) {
    return { parts: { pinion: { angle: alpha }, wheel: { angle: wheelAngle(alpha) } }, readouts: [] };
  },
};
