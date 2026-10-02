// 第 119 種:桿上承載一個長圓形的無端齒條(齒在外緣一圈);小齒輪均勻旋轉,交替地作用在齒條的上方與下方,
// 使桿往復直線運動。小齒輪的軸在固定的直立開槽桿內上下移動、由它引導:在上方時把齒條往左推,
// 繞過右端時小齒輪沿槽往下移,到下方後把齒條往右推,再繞過左端回到上方。
// 小齒輪純滾動地繞著齒條的節曲線走,所以它的中心以等速沿「節曲線往外平移一個節圓半徑」的長圓走。主動件是小齒輪(順時針)。
import { TAU } from "./kit.js";
import { arcPoints, shape, circle } from "./shapes.js";
import { toothedLoop, resample } from "./noncircular.js";

const RP = 0.42;
const NP = 10;
const PITCH = (TAU * RP) / NP;
const A = 6 * PITCH; // 直線段的半長(2a = 12 個齒距)
const RE = (8 * PITCH) / Math.PI; // 端頭半圓的節圓半徑(半圓 = 8 個齒距)
const RHO = RE + RP;
const PATH = 4 * A + 2 * Math.PI * RHO; // 小齒輪中心走一圈的長度

/** 小齒輪中心相對齒條中心的位置:從上方正中央出發,順時針繞長圓走 s */
function relative(s) {
  let t = ((s % PATH) + PATH) % PATH;
  if (t < A) return [t, RHO];
  t -= A;
  if (t < Math.PI * RHO) {
    const a = Math.PI / 2 - t / RHO;
    return [A + RHO * Math.cos(a), RHO * Math.sin(a)];
  }
  t -= Math.PI * RHO;
  if (t < 2 * A) return [A - t, -RHO];
  t -= 2 * A;
  if (t < Math.PI * RHO) {
    const a = -Math.PI / 2 - t / RHO;
    return [-A + RHO * Math.cos(a), RHO * Math.sin(a)];
  }
  t -= Math.PI * RHO;
  return [-A + t, RHO];
}

/** 小齒輪轉 alpha(順時針為正):桿(齒條)的位置與小齒輪的高度 */
export function endless(alpha) {
  const [qx, qy] = relative(RP * alpha);
  return { x: -qx, y: qy };
}
export const halfLength = A;

// 齒條的節曲線(逆時針,從左下開始),齒依弧長排列;上方正中央(弧長 3a + πRe)是齒槽
const pitchLoop = resample(
  [
    ...arcPoints(RE, -Math.PI / 2, Math.PI / 2, A, 0).slice(0, -1),
    ...arcPoints(RE, Math.PI / 2, (3 * Math.PI) / 2, -A, 0).slice(0, -1),
  ].map(([x, y]) => [x, y]),
  0.02,
);
// resample 從右端弧的起點(右下)開始;換成從左下開始的弧長:左下 → 右下是 2a
const START = 3 * A + Math.PI * RE + PITCH / 2 - 2 * A;
const M = PITCH / Math.PI;
const teeth = toothedLoop(pitchLoop, { pitch: PITCH, addendum: M, dedendum: 1.2 * M, start: START, into: 1 });

export default {
  figure: 119,
  parts: [
    { id: "pinion", kind: "gear", teeth: NP, radius: RP, width: 0.28, bore: 0.08, web: false },
    {
      id: "rack",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(teeth, [circle(0.08, -A - 0.25, 0.18).reverse(), circle(0.08, -A - 0.25, -0.18).reverse(), circle(0.08, A + 0.25, 0.18).reverse(), circle(0.08, A + 0.25, -0.18).reverse()]), thickness: 0.22 },
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.16, length: 1.4, at: [-A - RE - 0.7, 0, 0] },
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.16, length: 1.4, at: [A + RE + 0.7, 0, 0] },
      ],
    },
    {
      id: "guide",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.08, 2 * RHO + 1.2, 0.08], at: [-0.12, 0, 0.3] },
        { kind: "box", size: [0.08, 2 * RHO + 1.2, 0.08], at: [0.12, 0, 0.3] },
        { kind: "box", size: [5.2, 0.32, 0.4], at: [0, RHO + 0.85, 0] },
        { kind: "box", size: [5.2, 0.22, 0.4], at: [0, -RHO - 0.75, 0] },
      ],
    },
  ],
  driver: { part: "pinion", type: "rotation", speed: -1.4 },
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    // 主動量 v 是小齒輪的轉角(逆時針為正);順時針轉 alpha = −v
    const { x, y } = endless(-v);
    return {
      parts: { pinion: { position: [0, y, 0.12], angle: -Math.PI / 2 + v }, rack: { position: [x, 0, 0] } },
      readouts: [],
    };
  },
};
