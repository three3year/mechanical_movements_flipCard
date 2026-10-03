// 第 54 種:曼格輪或稱星形輪,產生交替方向的旋轉運動。輪緣是兩圈輪框之間的一圈徑向齒條(銷),
// 小齒輪 A 的軸沿半徑方向,齒從側面嵌進齒條之間,像冠狀齒輪那樣帶動輪轉。
// 齒條在左側(原圖 A 的位置)留一個開口:A 轉向不變,咬著齒條前面帶輪轉將近一圈;開口轉到 A 處時,
// A 沿軸向穿過開口到齒條後面(原圖左側的方框軸承讓它能前後移),改咬後面,輪就反過來轉——
// 與第 371 種同一個原理,只是齒條換成徑向的銷。下方的 B 是被輪帶動的從動小齒輪,看得出輸出軸交替轉向;
// 開口轉到 B 下方的那一段 B 沒有齒條可咬、停住(開口寬 4 個齒距 = B 的 4 齒,過了開口齒相位剛好接得上)。
// 推斷:開口的寬度、A 穿過開口時輪停住(像曼格輪的小齒輪繞著末端那根銷轉過去)。
import { X, Y, TAU, smooth, wrap } from "./kit.js";
import { meshAngle } from "./gears.js";

const FULL = 48; // 整圈的齒條位置數(含開口處缺的)
const MISSING = [0, 1, 2, 3]; // 開口:缺這幾根齒條(局部角 0 附近)
const PITCH = TAU / FULL;
const R = 1.95; // 齒條所在的節圓半徑
const PINION = { teeth: 8, radius: (8 * R * PITCH) / TAU }; // 齒距與齒條一致
const SIDE = 0.34; // 小齒輪中心在輪面前後的距離
const WHEEL = { center: [0, 0, 0], teeth: FULL, radius: R };
const aAt = (z) => ({ center: [-R, 0, z], axis: X, teeth: PINION.teeth, radius: PINION.radius });
const B = { center: [0, -R, SIDE], axis: Y, teeth: PINION.teeth, radius: PINION.radius };
const CONTACT_A = [-R, 0, 0];
const CONTACT_B = [0, -R, 0];

// 齒條排的兩端(局部角):開口兩側的齒條再往內一根,小齒輪中心走到這裡就到頭了
const END_LO = (MISSING[MISSING.length - 1] + 2) * PITCH;
const END_HI = (FULL + MISSING[0] - 2) * PITCH;
const GAP_CENTER = ((MISSING[0] + MISSING[MISSING.length - 1]) / 2) * PITCH;

// A 在前面 / 後面時,輪的轉角是 A 轉角的線性函數(含讓齒嵌進齒條之間的相位)
const front = (theta) => meshAngle(aAt(SIDE), WHEEL, theta, CONTACT_A);
const back = (theta) => meshAngle(aAt(-SIDE), WHEEL, theta, CONTACT_A);
const slopeF = front(1) - front(0);
const slopeB = back(1) - back(0);
// 小齒輪在左側(世界角 π);輪轉角 phi 時它對著局部角 π − phi。往前走的一程從哪一端開始由轉向決定
const phiOf = (local) => Math.PI - local;
const startIdeal = slopeF < 0 ? phiOf(END_LO) : phiOf(END_HI);
// 起點取讓齒相位正確的值(差整數個齒距不影響咬合);終點取開口兩側對稱的位置
const PHI_START = front(0) + PITCH * Math.round((startIdeal - front(0)) / PITCH);
const startLocal = wrap(Math.PI - PHI_START);
const endLocal = wrap(2 * GAP_CENTER - startLocal);
export const TRAVEL = PITCH * Math.round(Math.abs(endLocal - startLocal) / PITCH); // 輪單向轉的角度(整數個齒距)
const L = TRAVEL / Math.abs(slopeF); // 單程 A 要轉的角度
const PHI_END = PHI_START + slopeF * L;

// 換面時輪停住、A 繼續轉:A 要再轉多少,另一面的齒才對得上齒條(最少轉半圈,讓穿過開口的過程看得到)
function dwell(target, mesh, slope, theta) {
  const unit = PITCH / Math.abs(slope); // A 轉這麼多,齒相位就重複一次
  const need = (target - mesh(theta)) / slope;
  let d = need - unit * Math.floor(need / unit);
  while (d < Math.PI) d += unit;
  return d;
}
const DWELL1 = dwell(PHI_END, back, slopeB, L);
const DWELL2 = dwell(PHI_START, front, slopeF, 2 * L + DWELL1);
export const PERIOD = 2 * L + DWELL1 + DWELL2;

// B 在世界角 −π/2;輪轉角 phi 時 B 對著局部角 −π/2 − phi。開口(含兩側半個齒距)在局部角 [o0, o1]:
// 輪轉到這一段時 B 沒被帶動。B 的有效轉角 = phi 扣掉從一程的起點算起、輪在開口裡走過的量(來回對稱,週期相接)
const OPEN = [MISSING[0] * PITCH - PITCH / 2, MISSING[MISSING.length - 1] * PITCH + PITCH / 2];
// 輪轉角落在哪些區間時,B 正對著開口:phi ∈ [−π/2 − o1, −π/2 − o0] + 2πk
const BLOCKED = [-1, 0, 1, 2].map((k) => [-Math.PI / 2 - OPEN[1] + k * TAU, -Math.PI / 2 - OPEN[0] + k * TAU]);
export function wheelForB(phi) {
  const lo = Math.min(PHI_START, phi);
  const hi = Math.max(PHI_START, phi);
  let skipped = 0;
  for (const [a, b] of BLOCKED) skipped += Math.max(0, Math.min(hi, b) - Math.max(lo, a));
  return phi - Math.sign(phi - PHI_START) * skipped;
}

/** A 轉 theta 時:輪的轉角、A 在輪面前後的位置(z)、是否在往前的那一程 */
export function mangle(theta) {
  const u = theta - PERIOD * Math.floor(theta / PERIOD);
  if (u < L) return { wheel: PHI_START + slopeF * u, z: SIDE, forward: true };
  if (u < L + DWELL1) return { wheel: PHI_END, z: SIDE * (1 - 2 * smooth((u - L) / DWELL1)), forward: true };
  if (u < 2 * L + DWELL1) return { wheel: PHI_END + slopeB * (u - L - DWELL1), z: -SIDE, forward: false };
  return { wheel: PHI_START, z: -SIDE * (1 - 2 * smooth((u - 2 * L - DWELL1) / DWELL2)), forward: false };
}

const rungs = [];
for (let j = 0; j < FULL; j++) {
  if (MISSING.includes(j)) continue;
  const a = j * PITCH;
  rungs.push({ kind: "box", size: [0.42, 0.07, 0.16], at: [R * Math.cos(a), R * Math.sin(a), 0], angle: a, accent: j === MISSING.length });
}

export default {
  figure: 54,
  parts: [
    {
      id: "wheel",
      kind: "group",
      spin: 2.3,
      pieces: [
        ...rungs,
        { kind: "cylinder", radius: R + 0.27, inner: R + 0.19, length: 0.22 },
        { kind: "cylinder", radius: R - 0.19, inner: R - 0.27, length: 0.22 },
        ...[0, 1, 2, 3].map((k) => ({ kind: "box", size: [R - 0.6, 0.12, 0.12], at: [((R - 0.6) / 2 + 0.38) * Math.cos((k * TAU) / 4), ((R - 0.6) / 2 + 0.38) * Math.sin((k * TAU) / 4), 0], angle: (k * TAU) / 4 })),
        { kind: "cylinder", radius: 0.45, length: 0.3 },
        { kind: "cylinder", radius: 0.22, length: 0.7 },
      ],
    },
    {
      id: "pinionA",
      kind: "gear",
      axis: X,
      center: aAt(SIDE).center,
      posed: true,
      teeth: PINION.teeth,
      radius: PINION.radius,
      width: 0.36,
      web: false,
      pieces: [{ kind: "cylinder", radius: 0.08, length: 1.3, at: [0, 0, -0.75] }],
      label: "A",
      labelOffset: [-0.75, 0.15, 0],
    },
    // A 的方框軸承:軸在裡面可以前後滑;B 的軸承固定
    { id: "bearing", kind: "box", size: [0.36, 0.5, 1.1], center: [-R - 1.0, 0, 0] },
    { id: "bearingB", kind: "box", size: [0.5, 0.36, 0.4], center: [0, -R - 0.9, SIDE] },
    {
      id: "pinionB",
      kind: "gear",
      axis: Y,
      center: B.center,
      teeth: PINION.teeth,
      radius: PINION.radius,
      width: 0.36,
      web: false,
      pieces: [{ kind: "cylinder", radius: 0.08, length: 1.1, at: [0, 0, -0.65] }],
      label: "B",
      labelOffset: [0.4, -0.75, 0],
    },
  ],
  driver: { part: "pinionA", type: "rotation", initial: L / 2, speed: 4 },
  target: "pinionB",
  view: { direction: [0.15, 0.1, 1] },
  pose(theta) {
    const m = mangle(theta);
    return {
      parts: {
        pinionA: { position: [-R, 0, m.z], angle: theta },
        wheel: { angle: m.wheel },
        pinionB: { angle: meshAngle(WHEEL, B, wheelForB(m.wheel), CONTACT_B) },
      },
      readouts: [],
    };
  },
};
