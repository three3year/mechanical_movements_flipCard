// 第 248 種:聯合接頭(剖面圖)。管 A 的下端有小凸緣,抵住管 C 帶外螺紋的一端;螺帽 B 的內緣扣住 A 的凸緣,
// 旋進 C 的螺紋,把兩管固定在一起。主動件是螺帽 B:轉動它,B 每轉一圈沿螺紋前進一個螺距,
// 帶著 A 往下,直到 A 的凸緣壓緊在 C 的端面上。螺紋是右旋(管接頭的慣例):從上往下看順時針轉是旋緊。
// 推斷:接頭被使用時的動作(原文只說 B 把兩管固定在一起);螺距與鬆開時的圈數;右旋。
import { Y, TAU, clamp, screwAdvance, partPoint } from "./kit.js";
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

/**
 * 螺帽旋緊 angle(0 為鬆開、TURNS 圈為鎖緊):A 與 C 之間的間隙(螺帽與管 A 的高度),
 * 以及螺帽繞 +Y 的轉角 nut(旋緊是從上往下看順時針,所以為負;右旋螺紋繞 +Y 轉 θ 沿 +Y 前進 pitch·θ/2π)
 */
export function union(angle) {
  const a = clamp(angle, 0, TURNS * TAU);
  const nut = -a;
  const gap = screwAdvance(nut + TURNS * TAU, PITCH);
  return { gap, nut };
}

// 螺帽頂面的轉動記號:三個凸點等距排在半徑 MARK_R 的圓上。螺帽只畫後半,記號轉到剖掉的前半時
// (凸點有一角越過剖切面)就不畫,三個裡任何時刻至少有一個整個在後半。
// 起始時兩個記號分在後半的左右兩側(管 A 擋不住的地方)
const MARKS = 3;
const MARK_PHASE = 0.5;
const MARK_R = 1.15;
const MARK = { kind: "box", size: [0.2, 0.2, 0.1], at: [MARK_R, 0, FLANGE + LIP + 0.04] };
const markId = (k) => (k ? `nutMark${k + 1}` : "nutMark");
const markAngle = (k, nut) => nut + MARK_PHASE + (k * TAU) / MARKS;
const inBack = (angle) =>
  [-1, 1].every((dx) => [-1, 1].every((dy) => partPoint([0, 0, 0], Y, angle, [MARK.at[0] + (dx * MARK.size[0]) / 2, (dy * MARK.size[1]) / 2, MARK.at[2]])[2] < 0));

export default {
  figure: 248,
  parts: [
    { id: "pipeC", kind: "lathe", axis: Y, center: [0, 0, 0], profile: C, ...HALF, label: "C", labelOffset: [0, -1.3, 0] },
    { id: "pipeA", kind: "lathe", axis: Y, center: [0, 0, 0], profile: A, ...HALF, label: "A", labelOffset: [0, 1.4, 0] },
    { id: "nutB", kind: "lathe", axis: Y, center: [0, 0, 0], profile: B, ...HALF, label: "B", labelOffset: [1.6, -0.2, 0] },
    // 螺帽的轉動記號:頂面上的凸點,跟著螺帽轉(剖開的螺帽本身不轉,剖面一直朝向讀者)。
    // 三個記號都帶轉向箭頭,箭頭只隨看得到的記號出現;兩個同時看得到時兩支箭頭畫在同一處
    ...Array.from({ length: MARKS }, (_, k) => ({ id: markId(k), kind: "group", axis: Y, center: [0, 0, 0], spin: 1.34, spinOffset: FLANGE + LIP, pieces: [MARK] })),
  ],
  driver: { part: "nutB", grips: Array.from({ length: MARKS }, (_, k) => markId(k)), type: "rotation", range: [0, TURNS * TAU], initial: 0 },
  target: "pipeA", // 被螺帽帶著壓緊在 C 上的管
  view: { direction: [0.08, 0.12, 1] },
  pose(angle) {
    const { gap, nut } = union(angle);
    // 螺帽與 A 一起下降
    const parts = { nutB: { position: [0, gap, 0] }, pipeA: { position: [0, gap, 0] } };
    for (let k = 0; k < MARKS; k++) {
      const a = markAngle(k, nut);
      parts[markId(k)] = { position: [0, gap, 0], angle: a, visible: inBack(a) };
    }
    return { parts, readouts: [] };
  },
  waivers: [
    { check: "interference", parts: ["pipeC", "nutB"], reason: "管端與螺帽的螺紋在剖面上畫成互相咬合的鋸齒輪廓,咬合處重疊 0.07" },
  ],
};
