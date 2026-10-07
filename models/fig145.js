// 第 145 種:樑的往復曲線運動,使曲柄與飛輪連續旋轉。樑的右端是樞軸,左端以一根直立連桿往下接到一根水平槓桿;
// 槓桿的右端裝在小支架上,左端附近再以連桿接到飛輪的曲柄銷。樑上下擺動,槓桿隨之擺動,經連桿使曲柄轉動。
// 主動件是樑(原文:樑的往復曲線運動帶動曲柄與飛輪),目標件是飛輪。主動量是樑的累計擺動量:
// 樑每往下(或往上)擺一程,飛輪轉半圈;樑擺到兩端時曲柄在死點,由飛輪的慣性帶過去,所以飛輪一直朝同一方向轉。
// 飛輪的軸往後伸進軸承座(推斷)。
import { polar, dist, swingPhase, TAU } from "./kit.js";
import { circleCircle, angleOf } from "./linkage.js";
import { shape, circle } from "./shapes.js";
import { pedestal } from "./supports.js";

const WHEEL = { center: [0, 0, 0], radius: 1.55, crank: 0.6 };
const B = [3.35, 0, 0]; // 槓桿在支架上的樞軸
const J0 = [1.7, 0, 0]; // 槓桿上接連桿與直立桿的點
const PB = [4.3, 3.0, 0]; // 樑的樞軸
const E0 = [1.7, 2.95, 0]; // 樑的左端
const PIN0 = Math.PI; // 原圖:曲柄銷在飛輪中心的左邊
const LB = dist(B, J0);
const LC = dist(J0, polar(WHEEL.crank, PIN0));
const LV = dist(E0, J0);
const LBEAM = dist(PB, E0);

/** 飛輪轉 theta:曲柄銷、槓桿上的接點、樑的左端 */
export function beamEngine(theta) {
  const pin = polar(WHEEL.crank, PIN0 + theta);
  const j = circleCircle(B, LB, pin, LC, -1).point;
  const e = circleCircle(PB, LBEAM, j, LV, -1).point;
  return { pin, j, e };
}

const z = (p, d) => [p[0], p[1], d];
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
/** 飛輪轉 theta 時樑的轉角(0 = 原圖位置,往下擺為負) */
const beamAt = (theta) => wrap(angleOf(PB, beamEngine(theta).e) - angleOf(PB, E0));
// 樑的下死點:曲柄轉到這裡時樑擺到最低(上死點就是原圖位置,飛輪轉角 0)
const LOW = (() => {
  let best = [0, 0];
  for (let i = 0; i <= 3600; i++) {
    const t = (i / 3600) * TAU;
    if (beamAt(t) < best[0]) best = [beamAt(t), t];
  }
  let [lo, hi] = [best[1] - TAU / 3600, best[1] + TAU / 3600];
  for (let k = 0; k < 40; k++) {
    const [a, b] = [lo + (hi - lo) / 3, hi - (hi - lo) / 3];
    if (beamAt(a) < beamAt(b)) hi = b;
    else lo = a;
  }
  return { theta: (lo + hi) / 2, beam: beamAt((lo + hi) / 2) };
})();
// 在樑單調變化的一段 [a, b] 裡找樑轉角為 target 的飛輪轉角
function crankFor(target, a, b) {
  const rising = beamAt(b) > beamAt(a);
  for (let k = 0; k < 50; k++) {
    const mid = (a + b) / 2;
    if (beamAt(mid) < target === rising) a = mid;
    else b = mid;
  }
  return (a + b) / 2;
}
/** 主動量 v(樑的累計擺動量):樑的轉角與飛輪的轉角。先往下擺(飛輪轉前半圈),再往上擺(後半圈) */
export function beamDrive(v) {
  const { at, cycle, forward } = swingPhase(v, 0, LOW.beam);
  const theta = forward ? crankFor(at, 0, LOW.theta) : crankFor(at, LOW.theta, TAU);
  return { beam: at, wheel: cycle * TAU + theta };
}
export const beamSwing = -LOW.beam;

export default {
  figure: 145,
  parts: [
    {
      id: "wheel",
      kind: "pulley",
      style: "spoked",
      radius: WHEEL.radius,
      width: 0.3,
      pieces: [
        { kind: "cylinder", radius: 0.12, length: 0.5, at: [...polar(WHEEL.crank, PIN0).slice(0, 2), 0.3], accent: true },
        { kind: "cylinder", radius: 0.12, length: 0.7, at: [0, 0, -0.25] }, // 軸:往後伸進軸承座
      ],
    },
    {
      id: "beam",
      kind: "group",
      center: [PB[0], PB[1], 0.35], // 樑與連桿同一層(直立桿掛在樑端的孔上)
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape([[0.3, -0.3], [-LBEAM, -0.12], [-LBEAM, 0.18], [0.3, 0.3]], [circle(0.16).reverse(), circle(0.07, -LBEAM, 0).reverse()]), thickness: 0.2 },
      ],
    },
    { id: "lever", kind: "link", width: 0.12, thickness: 0.08 },
    { id: "rod", kind: "link", width: 0.1, thickness: 0.06 },
    { id: "vertical", kind: "link", width: 0.08, thickness: 0.06 },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape([[-0.35, -1.71], [0.35, -1.71], [0.15, -0.1], [-0.15, -0.1]]), thickness: 0.3, at: [B[0], B[1], -0.1] },
        { kind: "box", size: [6.5, 0.08, 1.2], at: [1.6, -1.75, 0] }, // 底板在飛輪的下方
        // 樑的立柱與樞軸銷(原圖沒畫出支撐,推斷)
        { kind: "box", size: [0.3, 4.9, 0.3], at: [PB[0], 0.7, 0.1] },
        { kind: "cylinder", radius: 0.15, length: 0.5, at: [PB[0], PB[1], 0.3] },
        ...pedestal({ at: [0, 0], z: -0.45, bore: 0.12, floor: -1.71 }),
      ],
    },
  ],
  driver: { part: "beam", type: "rotation", cycle: [0, LOW.beam] },
  target: "wheel", // 被樑帶著連續旋轉的飛輪
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const { beam, wheel: theta } = beamDrive(v);
    const { pin, j, e } = beamEngine(theta);
    return {
      parts: {
        wheel: { angle: theta },
        beam: { angle: beam },
        lever: { from: z(B, 0.35), to: z(j, 0.35) },
        rod: { from: z(j, 0.45), to: z(pin, 0.45) },
        vertical: { from: z(e, 0.49), to: z(j, 0.49) },
      },
      readouts: [],
    };
  },
};
