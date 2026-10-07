// 第 304 種:銷輪式擒縱(與第 292 種凸柱式相似)。擒縱輪的盤面上靠近邊緣立著一圈銷(左邊畫出兩種形式 A、B,
// 右側的形式較佳);右上方的錨形件繞軸擺動,伸下來的兩個叉瓦夾著銷圈,輪流擋住、放開銷,擺每擺一次輪轉過半個銷距。
// 銷損壞時可以單獨更換,不必整個輪報廢。主動件是錨形件(擺);目標件是擒縱輪(擒縱讓它一個銷一個銷地放行)。
//
// 由接觸算(models/escapement.js 的 escapeByContact、anchorPallet):輪受重錘的固定力矩順時針轉,銷被叉瓦的鎖面擋住就停
// (鎖面是以錨形件軸為圓心的弧,鎖住時輪不回退),滑過叉瓦尖端的斜面時推動錨形件,脫開後加速走半個銷距落到另一個叉瓦上。
// 兩個叉瓦沿銷圈相隔半個銷距:上面的從銷圈裡往外伸、下面的從銷圈外往裡伸,錨形件往一邊擺時一個退出、一個伸進來。
// 推斷:銷的數目、擺幅、叉瓦的寬度;銷都做成右側(較佳)的 D 形;輪軸與錨形件的軸裝在後面的夾板條上(原圖沒畫)。
import { TAU, deg, swing } from "./kit.js";
import { anchorPallet, escapeByContact, placePoly } from "./escapement.js";
import { shape, circle, thickLine, arcPoints } from "./shapes.js";
import { plateBar } from "./supports.js";

export const PINS = 30;
export const PITCH = TAU / PINS;
export const SWING = deg(5);
export const LIFT = deg(3);
const W = [-0.75, -0.55];
const R = 1.95; // 銷所在的半徑
const PIN = 0.09;
const AT = deg(-10); // 上叉瓦在銷圈上的方位
const TANGENT = [Math.sin(AT), -Math.cos(AT)]; // 順時針轉時銷的走向
const P0 = [W[0] + R * Math.cos(AT), W[1] + R * Math.sin(AT)];
const P = [P0[0] - 2.6 * TANGENT[0], P0[1] - 2.6 * TANGENT[1]]; // 錨形件軸:在銷圈的切線上

const pallet = (at, outside) => anchorPallet({ P, O: W, R, at, dir: -1, width: 0.1, lift: LIFT, lock: deg(1.2), back: 0.2, outside });
const UPPER = pallet(AT + PITCH / 2, true); // 上游半個銷距,從銷圈裡往外伸
const LOWER = pallet(AT, false); // 從銷圈外往裡伸

// D 形銷:圓的一面朝前(順時針走的方向)
const pinPoly = (i) => placePoly(arcPoints(PIN, -Math.PI / 2, Math.PI / 2), [R * Math.cos(i * PITCH), R * Math.sin(i * PITCH)], i * PITCH - Math.PI / 2);
const pins = Array.from({ length: PINS }, (_, i) => pinPoly(i));

/** 錨形件累計擺動 v → 擺角 */
export const anchorAngle = (v) => swing(v, -SWING, SWING);
export const escapement = {
  ...escapeByContact({ center: W, teeth: pins, dir: -1, period: 4 * SWING, stops: (v) => [UPPER.poly, LOWER.poly].map((p) => placePoly(p, P, anchorAngle(v))) }),
  period: 4 * SWING,
};

/** 錨形件累計擺動 v → 擺角、輪轉角(順時針為負,由接觸算) */
export function pinWheel(v) {
  return { anchor: anchorAngle(v), wheel: escapement.angle(v) };
}

const end = (p) => {
  const a = p.psi - p.s * 0.14;
  return [p.L * Math.cos(a), p.L * Math.sin(a)];
};

export default {
  figure: 304,
  parts: [
    {
      id: "wheel",
      kind: "group",
      center: [...W, 0],
      spin: R + 0.25,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(circle(R + 0.25), [circle(R - 0.3).reverse()]), thickness: 0.12, circles: [R - 0.15] },
        ...Array.from({ length: 6 }, (_, i) => ({ kind: "box", size: [2 * R - 0.6, 0.14, 0.08], angle: (i * Math.PI) / 6 })),
        { kind: "cylinder", radius: 0.35, length: 0.3 },
        { kind: "cylinder", radius: 0.08, length: 0.6, at: [0, 0, -0.35] }, // 輪軸,往後伸進夾板條
        ...pins.map((p, i) => ({ kind: "plate", shape: shape(p), thickness: 0.3, at: [0, 0, 0.2], accent: i === 0 })),
      ],
    },
    {
      id: "anchor",
      kind: "group",
      center: [...P, 0],
      arrow: false,
      pieces: [
        { kind: "cylinder", radius: 0.6, length: 0.15, at: [0, 0, 0.55] },
        { kind: "cylinder", radius: 0.18, inner: 0.08, length: 0.4, at: [0, 0, 0.35] },
        { kind: "cylinder", radius: 0.08, length: 1.0, at: [0, 0, 0.05] }, // 錨形件的軸,往後伸進夾板條
        // 兩臂往下到叉瓦(在銷的前面一層)
        { kind: "plate", shape: shape(thickLine([[0, 0], end(UPPER)], 0.2)), thickness: 0.1, at: [0, 0, 0.42] },
        { kind: "plate", shape: shape(thickLine([[0.3, 0], [0.45, -1.4], end(LOWER)], 0.16)), thickness: 0.1, at: [0, 0, 0.42] },
        { kind: "plate", shape: shape(UPPER.poly), thickness: 0.28, at: [0, 0, 0.26] },
        { kind: "plate", shape: shape(LOWER.poly), thickness: 0.28, at: [0, 0, 0.26] },
      ],
    },
    { id: "frame", kind: "group", pieces: plateBar({ points: [W, P], z: -0.55 }) },
    { id: "labelA", kind: "group", center: [W[0] - R, W[1] + 0.35, 0.3], label: "A", labelOffset: [0.3, 0, 0] },
    { id: "labelB", kind: "group", center: [W[0] - R, W[1] - 0.35, 0.3], label: "B", labelOffset: [0.3, 0, 0] },
  ],
  // 動力重演:只推錨形件;擒縱輪受固定的力矩(重錘)順時針轉,銷由兩個叉瓦輪流擋住、放行
  replay: {
    to: 8 * SWING,
    free: { wheel: { pivot: [...W, 0], spring: -1, gravity: false } },
    ignore: [["wheel", "frame"]], // 輪軸插在夾板條的孔裡(孔沒畫出來)
    expect: [
      { at: 2 * SWING, part: "wheel", label: "擺擺過一次,輪轉過半個銷距" },
      { at: 4 * SWING, part: "wheel", label: "擺一個來回,輪轉過一個銷距" },
      { part: "wheel", label: "擺兩個來回,輪轉過兩個銷距" },
    ],
  },
  driver: { part: "anchor", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheel", // 擒縱輪:擒縱讓它一個銷一個銷地放行
  view: { direction: [0.04, 0.05, 1] },
  pose(v) {
    const p = pinWheel(v);
    return { parts: { anchor: { angle: p.anchor }, wheel: { angle: p.wheel } }, readouts: [] };
  },
};
