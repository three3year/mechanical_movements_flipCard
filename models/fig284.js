// 第 284 種:鋸機平台的進料裝置。圖底的曲柄旋轉,經連桿把往復運動傳給曲柄搖臂槓桿(bell-crank)的水平臂,
// 槓桿的支點在左上角的 a;槓桿垂直臂上連著卡榫,卡榫推棘輪,棘輪軸上的小齒輪作動於平台側邊的齒條,平台就一步一步前進。
// 進料速度可以用曲柄搖臂槓桿上的螺絲調節:連桿接在水平臂上離支點越遠,槓桿擺得越少,進料越慢。
// 主動件是曲柄;狀態按鈕切換連桿接在水平臂上的兩個位置(進料慢 / 快)。
// 推斷:各桿長與棘輪齒數(依原圖);卡榫靠自重貼在棘輪齒上。
import { TAU, deg } from "./kit.js";
import { crankPin, circleCircle, angleOf } from "./linkage.js";
import { rackOffset, circularPitch } from "./gears.js";
import { ratchetShape, shape, circle, thickLine, rect } from "./shapes.js";

const A = [-1.55, 1.85, 0]; // 支點 a
const CRANK = { center: [2.15, -2.05, 0.3], r: 0.45 };
const ARM_V = 0.95; // 垂直臂長
const WHEEL = { center: [-1.55, -0.75, 0], teeth: 40, outer: 1.22, inner: 1.07, dir: 1 };
const TIP = (WHEEL.outer + WHEEL.inner) / 2; // 卡榫尖所在的半徑
const CATCH = 1.25; // 卡榫長
const PINION = { center: [WHEEL.center[0], WHEEL.center[1], -0.35], teeth: 12, radius: 0.42 };
const RACK = { origin: [WHEEL.center[0], WHEEL.center[1] + PINION.radius, -0.35], dir: [1, 0, 0], pitch: circularPitch(PINION) };
const ATTACH = { slow: 3.75, fast: 2.75 }; // 連桿接在水平臂上離支點的距離

function setup(h) {
  const H0 = [A[0] + h, A[1], 0];
  const rod = Math.hypot(H0[0] - CRANK.center[0], H0[1] - CRANK.center[1]);
  const arm = (theta) => {
    const pin = crankPin(CRANK.center, CRANK.r, theta);
    const H = circleCircle(A, h, pin, rod, 1).point;
    const beta = angleOf(A, H); // 水平臂的角度
    const V = [A[0] + ARM_V * Math.cos(beta - Math.PI / 2), A[1] + ARM_V * Math.sin(beta - Math.PI / 2), 0];
    const tip = circleCircle(V, CATCH, WHEEL.center, TIP, 1).point;
    return { pin, H, beta, V, tip, psi: angleOf(WHEEL.center, tip) };
  };
  // 卡榫尖在棘輪上的角度一圈內的最低與最高點:由低到高那一段推著棘輪走(推程)
  const N = 720;
  let lo = { psi: Infinity }, hi = { psi: -Infinity };
  for (let i = 0; i < N; i++) {
    const theta = (i / N) * TAU;
    const { psi } = arm(theta);
    if (psi < lo.psi) lo = { psi, theta };
    if (psi > hi.psi) hi = { psi, theta };
  }
  const rise = (((hi.theta - lo.theta) % TAU) + TAU) % TAU;
  return { arm, lo, hi, rise, step: hi.psi - lo.psi };
}
const SETUPS = { slow: setup(ATTACH.slow), fast: setup(ATTACH.fast) };

/** 曲柄轉 theta(狀態 state):槓桿姿勢、棘輪的累計轉角、平台的位移 */
export function feed(theta, state = "slow") {
  const S = SETUPS[state];
  const a = S.arm(theta);
  const t = theta - S.lo.theta;
  const k = Math.floor(t / TAU);
  const local = t - k * TAU;
  const pushing = local <= S.rise;
  const wheel = k * S.step + (pushing ? a.psi - S.lo.psi : S.step);
  return { ...a, wheel, step: S.step, carriage: rackOffset(PINION, RACK, wheel), pushing };
}

const spokes = Array.from({ length: 4 }, (_, i) => ({ kind: "box", size: [2 * WHEEL.inner - 0.2, 0.12, 0.1], angle: (i * Math.PI) / 4 }));

export default {
  figure: 284,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.3, 5.0, 0.3], at: [-2.65, -0.2, -0.6] },
        { kind: "box", size: [0.5, 0.9, 0.3], at: [A[0], A[1] - 0.1, -0.3] },
        { kind: "box", size: [4.9, 0.12, 0.6], at: [-0.1, -2.6, -0.4] },
        { kind: "box", size: [0.25, 0.4, 0.25], at: [CRANK.center[0], CRANK.center[1] - 0.3, 0] },
      ],
    },
    { id: "crank", kind: "group", center: CRANK.center, spin: CRANK.r + 0.15, pieces: [{ kind: "plate", shape: shape(thickLine([[0, 0], [CRANK.r, 0]], 0.18), [circle(0.05).reverse()]), thickness: 0.1 }, { kind: "cylinder", radius: 0.06, length: 0.3, at: [CRANK.r, 0, 0.1] }, { kind: "cylinder", radius: 0.1, length: 0.3, at: [0, 0, -0.25] }] }, // 曲柄軸只往後伸(連桿從曲柄前面掃過軸心)
    { id: "rod", kind: "link", width: 0.09, thickness: 0.06 },
    {
      id: "bellCrank",
      kind: "group",
      center: A,
      arrow: false,
      label: "a",
      labelOffset: [-0.35, 0.25, 0.3],
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0, 0], [ATTACH.slow + 0.15, 0]], 0.13), [circle(0.05).reverse()]), thickness: 0.1, at: [0, 0, 0.1] },
        { kind: "plate", shape: shape(thickLine([[0, 0], [0, -ARM_V]], 0.16)), thickness: 0.1, at: [0, 0, 0.1] },
        // 調節進料的螺絲座(水平臂上的兩個接點)
        { kind: "box", size: [0.14, 0.24, 0.16], at: [ATTACH.fast, 0, 0.1] },
        { kind: "box", size: [0.14, 0.24, 0.16], at: [ATTACH.slow, 0, 0.1] },
        { kind: "cylinder", radius: 0.11, length: 0.4 },
      ],
    },
    { id: "catch", kind: "link", width: 0.11, thickness: 0.08 },
    {
      id: "ratchet",
      kind: "plate",
      center: WHEEL.center,
      shape: ratchetShape({ ...WHEEL, bore: 0.12 }),
      thickness: 0.16,
      circles: [WHEEL.inner - 0.12],
      spin: WHEEL.outer,
      mark: [WHEEL.inner - 0.06, 0],
      markSize: 0.07,
      pieces: [...spokes, { kind: "cylinder", radius: 0.22, length: 0.8, at: [0, 0, -0.2] }],
    },
    { id: "pinion", kind: "gear", center: PINION.center, teeth: PINION.teeth, radius: PINION.radius, width: 0.2, arrow: false },
    {
      id: "carriage",
      kind: "rack",
      teeth: 25,
      pitch: RACK.pitch,
      width: 0.2,
      depth: 0.2,
      arrow: false,
      pieces: [{ kind: "plate", shape: shape(rect(25 * RACK.pitch, 0.35, 0, -0.55)), thickness: 0.2 }],
    },
  ],
  driver: { part: "crank", type: "rotation" },
  target: "carriage", // 一步一步前進的平台
  states: {
    initial: "slow",
    options: [
      { id: "slow", label: "進料慢" },
      { id: "fast", label: "進料快" },
    ],
  },
  view: { direction: [0.04, 0.05, 1] },
  pose(theta, state = "slow") {
    const f = feed(theta, state);
    const z = 0.25;
    return {
      parts: {
        crank: { angle: theta },
        rod: { from: [f.pin[0], f.pin[1], z], to: [f.H[0], f.H[1], z] },
        bellCrank: { angle: f.beta },
        catch: { from: [f.V[0], f.V[1], 0.16], to: [f.tip[0], f.tip[1], 0.16] }, // 卡榫貼著棘輪的前面
        ratchet: { angle: f.wheel },
        pinion: { angle: f.wheel },
        // 齒條齒朝下,咬在小齒輪頂上:齒條零件轉 180°
        carriage: { position: [RACK.origin[0] + f.carriage, RACK.origin[1], -0.35], angle: Math.PI },
      },
      readouts: [],
    };
  },
};
