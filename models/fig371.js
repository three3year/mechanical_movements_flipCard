// 第 371 種:曼格輪運動的變形。大輪的輪緣兩面都有齒(冠狀齒),輪緣在左下留一個開口;小齒輪的軸從左邊伸進來,
// 小齒輪均勻地轉,先咬著輪緣一面的齒帶輪往一個方向轉將近一圈;小齒輪走到輪緣的端點時,繞過端點、從開口穿到輪緣的
// 另一面,改咬另一面的齒,輪就反過來轉。主動件是小齒輪。
// 齒排:兩面的冠狀齒在輪緣的兩個端點各以一圈半圓的齒接起來(照曼格輪的做法),整排齒是一條封閉的節線
// (前面一條、端點半圈、後面一條、另一端半圈),齒距處處相同。小齒輪的節圓沿這條節線滾動(滾動不滑):
// 在一面上時軸心離輪緣中面 RHO,沿輪緣走;到端點時繞著端點的半圈齒轉半圈,軸心沿半圓從一面經開口走到另一面,
// 輪在這時先往前送一點再退回來,平順地換向。小齒輪咬在輪面靠近自己的那一側,接觸點上兩者同向同速。
// 小齒輪的軸穿過緊貼小齒輪左邊的軸承座,座上開了前後方向的長槽,軸在槽裡前後滑;咬著一面時,齒的推力把小齒輪推離
// 輪面,軸靠在槽的一端,槽端就把小齒輪擋在咬合的位置;換面時端點的齒推著小齒輪繞過去(原圖緊貼小齒輪的方框)。
// 軸再往左伸出圖外接動力(原圖畫斷裂線;軸沿長槽前後移,圖外以滑鍵接上,推斷)。
// 推斷:齒數、齒距、開口的寬度、端點齒的做法;大輪套在固定的軸上,軸插在輪後面的軸承座上;
// 軸承座的立柱與兩者共用的底板(原圖沒畫)。
import { X, TAU, deg, cross, quatFromBasis, planeBasis } from "./kit.js";
import { pedestal } from "./supports.js";

export const R = 1.7; // 冠狀齒所在的半徑(輪緣中線)
const N = 60; // 每一面的齒數
const GAP = deg(31); // 兩個端點(端點齒的中心)之間的開口
export const ENDS = [GAP / 2, TAU - GAP / 2]; // 兩個端點在輪上的角度
const L = R * (TAU - GAP); // 一面的節線長
const P = L / N; // 齒距
export const H = (3 * P) / Math.PI; // 節線離輪緣中面的距離;端點的半圈齒節圓半徑(半圈正好三個齒距)
const NP = 8;
export const RP = (NP * P) / TAU; // 小齒輪節圓半徑
export const M = (2 * RP) / NP; // 模數(齒頂高)
export const RHO = H + RP; // 小齒輪軸心離輪緣中面(在端點時離端點中心)
export const RIM = 0.06; // 輪緣的半厚
const TOOTH_W = 0.42 * P; // 齒在節線上的寬
const TOOTH_H = H + M - RIM; // 齒從輪緣面伸出的高度
const TOOTH_MID = (RIM + H + M) / 2;
// 一圈的四段(以小齒輪轉角計):前面、端點 B 的半圈、後面、端點 A 的半圈
const T_FACE = L / RP;
const T_END = (Math.PI * RHO) / RP;
export const PERIOD = 2 * T_FACE + 2 * T_END;
export const TRAVEL = (L + 2 * RHO) / R; // 輪單向轉的角度
const START = (R * (deg(315) - GAP / 2)) / RP; // 主動量 0:照原圖,開口在 7 點半(小齒輪在前面,離端點約 30°)

/** 小齒輪轉 theta → 輪的轉角、小齒輪軸心的 z、在輪上的弧長位置 s(從輪的局部 0° 量起) */
export function mangle(theta) {
  const u = (((theta + START) % PERIOD) + PERIOD) % PERIOD;
  const [sA, sB] = ENDS.map((a) => a * R);
  let s;
  let z;
  if (u < T_FACE) [s, z] = [sA + RP * u, RHO];
  else if (u < T_FACE + T_END) {
    const psi = ((u - T_FACE) * RP) / RHO;
    [s, z] = [sB + RHO * Math.sin(psi), RHO * Math.cos(psi)];
  } else if (u < 2 * T_FACE + T_END) [s, z] = [sB - RP * (u - T_FACE - T_END), -RHO];
  else {
    const psi = ((u - 2 * T_FACE - T_END) * RP) / RHO;
    [s, z] = [sA - RHO * Math.sin(psi), -RHO * Math.cos(psi)];
  }
  // 小齒輪在世界的 180°(左邊):輪轉到讓輪上 s 處對著小齒輪
  return { wheel: Math.PI - s / R, z, s };
}

// 齒(方塊):沿輪的半徑長 0.36、沿節線寬 TOOTH_W、高 TOOTH_H
const toothSize = [0.36, TOOTH_H, TOOTH_W];
const tooth = (a, d, center, accent = false) => {
  const r = [Math.cos(a), Math.sin(a), 0];
  return { kind: "box", size: toothSize, at: center, rotation: quatFromBasis(r, d, cross(r, d)), accent };
};
const teeth = [];
// 兩面的冠狀齒
for (let k = 0; k < N; k++) {
  const a = ENDS[0] + ((k + 0.5) * P) / R;
  for (const side of [1, -1]) teeth.push(tooth(a, [0, 0, side], [R * Math.cos(a), R * Math.sin(a), side * TOOTH_MID], k === 0 && side > 0));
}
// 端點的半圈齒:繞端點中心(輪緣中面上),從一面轉到另一面,朝開口那一側(半圈三個齒距,齒在 30°、90°、150°)
const ends = [];
ENDS.forEach((a, i) => {
  const out = i === 0 ? -1 : 1; // 朝開口的方向(沿輪的轉角)
  const c = [R * Math.cos(a), R * Math.sin(a), 0];
  ends.push({ kind: "cylinder", axis: [Math.cos(a), Math.sin(a), 0], radius: RIM, length: 0.44, at: c }); // 輪緣端點的圓頭
  for (const psi of [deg(30), deg(90), deg(150)]) {
    // 小齒輪咬到這個齒時,軸心在端點外 RHO·sin ψ 處:齒的長邊順著那裡的半徑(和小齒輪的軸平行),不照端點的半徑
    const b = a + (out * RHO * Math.sin(psi)) / R;
    const t = [-Math.sin(b) * out, Math.cos(b) * out, 0];
    const d = [t[0] * Math.sin(psi), t[1] * Math.sin(psi), Math.cos(psi)];
    teeth.push(tooth(b, d, [c[0] + d[0] * TOOTH_MID, c[1] + d[1] * TOOTH_MID, d[2] * TOOTH_MID]));
  }
});
// 輪緣:開口處斷開的環(開口在輪的局部 0°)
const arc = (r, a0, a1, n = 60) => Array.from({ length: n + 1 }, (_, i) => [r * Math.cos(a0 + ((a1 - a0) * i) / n), r * Math.sin(a0 + ((a1 - a0) * i) / n)]);
const rim = { outline: [...arc(R + 0.22, ENDS[0], ENDS[1]), ...arc(R - 0.22, ENDS[1], ENDS[0])], holes: [] };

// 小齒輪的齒相:小齒輪軸心走到兩齒之間(前面,s = 端點 + 整數個齒距)時,有一個齒正朝 −z(對著齒間)
const [U, V] = planeBasis(X);
const DOWN = Math.atan2(-(V[2] ?? 0), -(U[2] ?? 0)); // −z 在小齒輪平面上的角度
const PHASE = DOWN - (0 - START); // 前面的起點(u = 0,s = 端點 A)時轉角是 −START

// 軸承座:緊貼小齒輪左邊、開了前後長槽的框;軸在槽裡前後滑,槽的兩端在 z = ±(RHO + 軸半徑)
const SHAFT_R = 0.06;
const BX = -R - 0.4; // 軸承座的 x
const SLOT = { y: SHAFT_R + 0.005, z: RHO + SHAFT_R };
const WALL = 0.2;
const FLOOR = -R - 0.7;
const bearing = [
  { kind: "box", role: "bearing", size: [0.3, WALL, 2 * (SLOT.z + 0.1)], at: [BX, SLOT.y + WALL / 2, 0] },
  { kind: "box", role: "bearing", size: [0.3, WALL, 2 * (SLOT.z + 0.1)], at: [BX, -SLOT.y - WALL / 2, 0] },
  { kind: "box", role: "bearing", size: [0.3, 2 * SLOT.y, 0.1], at: [BX, 0, SLOT.z + 0.05] },
  { kind: "box", role: "bearing", size: [0.3, 2 * SLOT.y, 0.1], at: [BX, 0, -SLOT.z - 0.05] },
];
const POST_TOP = -SLOT.y - WALL;

export default {
  figure: 371,
  parts: [
    {
      id: "wheel",
      kind: "group",
      spin: R + 0.25,
      pieces: [
        { kind: "plate", shape: rim, thickness: 2 * RIM },
        { kind: "plate", shape: { outline: arc(0.45, 0, TAU).slice(0, -1), holes: [arc(0.3, TAU, 0).slice(0, -1)] }, thickness: 0.3 },
        ...[0, 1, 2, 3].map((i) => {
          const a = deg(45) + (i * TAU) / 4;
          return { kind: "box", size: [R - 0.65, 0.16, 0.1], at: [((R + 0.45) / 2 - 0.1) * Math.cos(a), ((R + 0.45) / 2 - 0.1) * Math.sin(a), 0], angle: a };
        }),
        ...ends,
        ...teeth,
      ],
    },
    { id: "pinion", kind: "gear", axis: X, teeth: NP, radius: RP, width: 0.3, pieces: [{ kind: "cylinder", radius: SHAFT_R, length: 1.6, at: [0, 0, -0.9] }] },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: 0.28, length: 1.0, at: [0, 0, -0.3] }, // 大輪的固定軸(輪轂套在上面轉)
        ...pedestal({ at: [0, 0], z: -0.75, bore: 0.28, floor: FLOOR }),
        ...bearing,
        { kind: "box", size: [0.3, POST_TOP - FLOOR, 0.3], at: [BX, (POST_TOP + FLOOR) / 2, 0] }, // 撐著軸承座的立柱
        { kind: "box", size: [3.0, 0.18, 1.4], at: [BX + 1.35, FLOOR - 0.09, -0.35] }, // 兩者共用的底板
      ],
    },
  ],
  driver: { part: "pinion", type: "rotation" },
  target: "wheel", // 交替換向的大輪
  view: { direction: [0.12, 0.08, 1] },
  pose(theta) {
    const m = mangle(theta);
    return { parts: { pinion: { position: [-R, 0, m.z], angle: theta + PHASE }, wheel: { angle: m.wheel } }, readouts: [] };
  },
  waivers: [],
};
