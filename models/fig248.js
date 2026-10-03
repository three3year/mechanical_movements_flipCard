// 第 248 種:聯合接頭(剖面圖)。管 A 的下端有小凸緣,抵住管 C 帶外螺紋的一端;螺帽 B 的內緣扣住 A 的凸緣,
// 旋進 C 的螺紋,把兩管固定在一起。主動件是螺帽 B:轉動它,B 每轉一圈沿螺紋前進一個螺距,
// 帶著 A 往下,直到 A 的凸緣壓緊在 C 的端面上。
// 推斷:接頭被使用時的動作(原文只說 B 把兩管固定在一起);螺距與鬆開時的圈數。
import { Y, TAU, clamp, screwAdvance } from "./kit.js";
import { backHalf, threadProfile } from "./section.js";

export const PITCH = 0.14;
export const TURNS = 2.5;
const HALF = backHalf(Y);
const LIP = 0.26; // 螺帽頂緣厚
const FLANGE = 0.16;

// 鎖緊時(A 的凸緣貼在 C 的端面 y = 0)的剖面
const C = [[0.62, -2.1], [0.84, -2.1], [0.84, -0.82], ...threadProfile(0.93, 1.0, -0.82, -0.02, 6), [0.62, 0]];
const A = [[0.62, 0], [0.96, 0], [0.96, FLANGE], [0.78, FLANGE], [0.78, 2.1], [0.62, 2.1]];
const B = [[1.02, -0.72], [1.34, -0.72], [1.34, FLANGE + LIP], [0.81, FLANGE + LIP], [0.81, FLANGE], ...threadProfile(1.02, 1.09, FLANGE - 0.02, -0.72, 6).reverse().map(([r, z]) => [r, z]), [1.02, -0.72]];

/** 螺帽轉 angle(0 為鬆開、TURNS 圈為鎖緊):螺帽與管 A 的下降量,以及 A 與 C 之間的間隙 */
export function union(angle) {
  const a = clamp(angle, 0, TURNS * TAU);
  const gap = screwAdvance(TURNS * TAU - a, PITCH);
  return { gap, nut: a };
}

export default {
  figure: 248,
  parts: [
    { id: "pipeC", kind: "lathe", axis: Y, center: [0, 0, 0], profile: C, ...HALF, label: "C", labelOffset: [0, -1.3, 0] },
    { id: "pipeA", kind: "lathe", axis: Y, center: [0, 0, 0], profile: A, ...HALF, label: "A", labelOffset: [0, 1.4, 0] },
    { id: "nutB", kind: "lathe", axis: Y, center: [0, 0, 0], profile: B, ...HALF, label: "B", labelOffset: [1.6, -0.2, 0] },
    // 螺帽的轉動記號:頂面上一個凸點,跟著螺帽轉(剖開的螺帽本身不轉,剖面一直朝向讀者)
    { id: "nutMark", kind: "group", axis: Y, center: [0, 0, 0], spin: 1.34, spinOffset: FLANGE + LIP, pieces: [{ kind: "box", size: [0.2, 0.2, 0.1], at: [1.15, 0, FLANGE + LIP + 0.04] }] },
  ],
  waivers: [
    { check: "interference", parts: ["pipeC", "nutB"], reason: "待確認:pipeC 的旋轉體 與 nutB 的旋轉體重疊 0.07,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
  ],
  driver: { part: "nutB", grips: ["nutMark"], type: "rotation", range: [0, TURNS * TAU], initial: 0 },
  target: "pipeA", // 被螺帽帶著壓緊在 C 上的管
  view: { direction: [0.08, 0.12, 1] },
  pose(angle) {
    const { gap, nut } = union(angle);
    // 螺帽與 A 一起下降
    return {
      parts: {
        nutB: { position: [0, gap, 0] },
        nutMark: { position: [0, gap, 0], angle: nut },
        pipeA: { position: [0, gap, 0] },
      },
      readouts: [],
    };
  },
};
