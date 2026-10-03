// 第 139 種:矩形框架(下有輪子,只能左右移動)裡承載一個長圓形的內齒條;齒條可在框架內上下滑動一段距離,
// 所以固定位置的小齒輪能咬齒條的上側或下側。小齒輪連續旋轉:咬上側時框架往一邊走,繞過端頭時齒條在框架內
// 上下換邊,咬下側時框架往另一邊走——矩形框架因此往復直線運動。主動件是小齒輪。
// 小齒輪相對齒條的運動:它的中心沿「齒條節曲線往內收一個節圓半徑」的長圓走,純滾動(同第 119 種,內咬合)。
import { TAU } from "./kit.js";
import { arcPoints, shape, rect } from "./shapes.js";
import { toothedLoop, resample, cumulative, periodic, inverseOf } from "./noncircular.js";

const RP = 0.42;
const NP = 10;
const PITCH = (TAU * RP) / NP;
const RE = (7 * PITCH) / Math.PI; // 端頭半圓(節曲線)半徑:半圓 = 7 齒距
const A = 5 * PITCH; // 直線段的半長
const RHO = RE - RP; // 小齒輪中心在端頭走的半徑
const L = 4 * A + 2 * Math.PI * RE; // 節曲線一圈的長度

// 節曲線上順時針走 s(從上側正中央出發):小齒輪中心相對齒條的位置與接觸方向
function track(s) {
  let t = ((s % L) + L) % L;
  if (t < A) return { c: [t, RHO], dir: Math.PI / 2 };
  t -= A;
  if (t < Math.PI * RE) {
    const phi = Math.PI / 2 - t / RE;
    return { c: [A + RHO * Math.cos(phi), RHO * Math.sin(phi)], dir: phi };
  }
  t -= Math.PI * RE;
  if (t < 2 * A) return { c: [A - t, -RHO], dir: -Math.PI / 2 };
  t -= 2 * A;
  if (t < Math.PI * RE) {
    const phi = -Math.PI / 2 - t / RE;
    return { c: [-A + RHO * Math.cos(phi), RHO * Math.sin(phi)], dir: phi };
  }
  t -= Math.PI * RE;
  return { c: [-A + t, RHO], dir: Math.PI / 2 };
}

// 小齒輪的轉角 α(s) = 接觸方向 + s / RP(逆時針);α 隨 s 單調增加,反過來由 α 求 s
const dirUnwrapped = (s) => {
  const k = Math.floor(s / L);
  const t = s - k * L;
  let d = track(t).dir;
  // 沿途接觸方向一直順時針轉:把它接成連續的值
  if (t >= A + Math.PI * RE + 2 * A) d -= TAU;
  return d - k * TAU;
};
const table = cumulative((s) => {
  const h = 1e-4;
  return (dirUnwrapped(s + h) - dirUnwrapped(s - h)) / (2 * h) + 1 / RP;
}, L, 4096);
const ALPHA_PER_LOOP = table.ys[table.ys.length - 1];
const sOf = periodic(inverseOf(table), ALPHA_PER_LOOP);

/** 小齒輪轉 alpha(相對起始位置):框架的水平位置與齒條在框架內的高度 */
export function rackPosition(alpha) {
  const { c } = track(sOf(alpha));
  return { x: -c[0], y: -c[1] };
}
export const alphaPerLoop = ALPHA_PER_LOOP;
export const halfStraight = A;

// 齒條的節曲線(逆時針,從上側正中央往左),內齒;上側正中央是齒槽
const pitchLoop = resample(
  [
    [0, RE],
    ...arcPoints(RE, Math.PI / 2, (3 * Math.PI) / 2, -A, 0),
    ...arcPoints(RE, -Math.PI / 2, Math.PI / 2, A, 0),
  ],
  0.02,
);
const M = PITCH / Math.PI;
const inner = toothedLoop(pitchLoop, { pitch: PITCH, addendum: M, dedendum: 1.2 * M, start: PITCH / 2, into: -1 });
const outerLoop = [...arcPoints(RE + 0.35, Math.PI / 2, (3 * Math.PI) / 2, -A, 0), ...arcPoints(RE + 0.35, -Math.PI / 2, Math.PI / 2, A, 0)];

const FRAME = { w: 2 * (A + RE) + 1.2, h: 2 * RE + 1.9 };
const WHEEL = 0.38;

export default {
  figure: 139,
  parts: [
    { id: "pinion", kind: "gear", teeth: NP, radius: RP, width: 0.3, bore: 0.08, web: false },
    {
      id: "rack",
      kind: "group",
      pieces: [{ kind: "plate", shape: shape(outerLoop, [inner.reverse()]), thickness: 0.22 }],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(rect(FRAME.w, FRAME.h), [rect(FRAME.w - 0.7, FRAME.h - 0.4, 0, 0.05).reverse()]), thickness: 0.2, at: [0, 0, -0.25] },
        { kind: "box", size: [0.9, 0.3, 0.2], at: [-FRAME.w / 2 - 0.45, 0.2, -0.25] },
        { kind: "box", size: [0.9, 0.3, 0.2], at: [FRAME.w / 2 + 0.45, 0.2, -0.25] },
      ],
    },
    { id: "wheelL", kind: "pulley", style: "disc", radius: WHEEL, width: 0.2, arrow: false },
    { id: "wheelR", kind: "pulley", style: "disc", radius: WHEEL, width: 0.2, arrow: false },
    { id: "rail", kind: "box", center: [0, -FRAME.h / 2 - 2 * WHEEL - 0.05, -0.25], size: [FRAME.w + 5, 0.1, 0.6] },
  ],
  driver: { part: "pinion", type: "rotation", speed: 1.3 },
  target: "frame",
  view: { direction: [0.06, 0.05, 1], fit: ["frame", "rack", "pinion"] },
  pose(alpha) {
    const { x, y } = rackPosition(alpha);
    const wy = -FRAME.h / 2 - WHEEL;
    return {
      parts: {
        pinion: { angle: Math.PI / 2 + alpha },
        rack: { position: [x, y, 0] },
        frame: { position: [x, 0, 0] },
        wheelL: { position: [x - FRAME.w / 2 + 0.7, wy, -0.25], angle: -x / WHEEL },
        wheelR: { position: [x + FRAME.w / 2 - 0.7, wy, -0.25], angle: -x / WHEEL },
      },
      readouts: [],
    };
  },
};
