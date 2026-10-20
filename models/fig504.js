// 第 504 種:「弗格森的機械悖論」,展示周轉輪系的一項奇特性質。輪 A 固定在一根不動的凸柱上,臂 C、D 繞凸柱轉;
// 臂上有兩根銷 M、N,M 上鬆套著一個厚輪 B,與 A 嚙合;N 上鬆套著三個輪 E、F、G,都與 B 嚙合。臂轉動時,運動傳給
// 共軸(銷 N)的 E、F、G,它們與中介輪 B 及 A 構成三個不同的周轉輪系。設 A 20 齒、F 20 齒、E 21 齒、G 19 齒,
// 轉動臂時,F 看起來不繞自己的軸轉(圓周上任一點始終指向同一方向),E 朝一個方向慢慢轉,G 朝另一個方向慢慢轉。
// 主動件是臂 C、D。畫面是俯視圖(舊決定,不放大取景)。
// 推斷:三個輪的節圓一樣大(齒數不同、齒的大小略有差別),都咬得住 B。
// 指標(推斷,維護者 2026-10-20 決定 (a) 鐘錶指針式;原圖是側視,看不出指標怎麼裝):G、F 的轂各帶一根套管往上穿過
// 上面的輪(G 的在最裡面、F 的套在外面),三根指標都裝在 E 的頂面以上、高過 B 的頂面,從下到上依序是 E(長 0.9)、
// F(0.75)、G(0.6),越上面越短,俯視時三根都看得到;最長的 0.9 也短於 N 到 M 的距離 1.08 減去 B 的輪轂,碰不到 B 與銷 M。
// 銷 N 加長到 G 的套管頂,G 的指標蓋住它。
// 臂兩頭照原圖伸出輪外(C 端伸出 A 的齒頂、D 端伸出 E、F、G 的齒頂 0.45),讀者抓得到;凸柱下面補柱座與底板(推斷,原圖有柱座),
// 臂在 A 與柱座之間轉。
import { TAU, polar, Z } from "./kit.js";
import { lastWheel, trainValue } from "./epicyclic.js";
import { meshAngle } from "./gears.js";
import { shape, thickLine, circle, hubArms } from "./shapes.js";

export const TEETH = { A: 20, B: 16, E: 21, F: 20, G: 19 };
const RA = 0.6;
const RB = 0.48;
const RN = 0.6; // E、F、G 的節圓
const M_AT = RA + RB;
const N_AT = M_AT + RB + RN;
/** A → X(經 B)的輪系值:兩次外嚙合 → A/X */
export const trainTo = (x) => trainValue([[TEETH.A, TEETH.B, -1], [TEETH.B, TEETH[x], -1]]);

// 齒的相位(臂在 0 時由 meshAngle 排好,齒嵌進齒槽;之後各輪相對滾動的量由周轉輪系公式算,相位不變)
const A_GEAR = { center: [0, 0, 0], axis: Z, teeth: TEETH.A, radius: RA };
const B_GEAR = { center: [M_AT, 0, 0], axis: Z, teeth: TEETH.B, radius: RB };
const B0 = meshAngle(A_GEAR, B_GEAR, 0);
const PHASE = Object.fromEntries(["E", "F", "G"].map((x) => [x, meshAngle(B_GEAR, { center: [N_AT, 0, 0], axis: Z, teeth: TEETH[x], radius: RN }, B0)]));

/** 臂轉 arm → E、F、G 的絕對轉角(A 固定;不含齒的相位) */
export function paradox(arm) {
  return Object.fromEntries(["E", "F", "G"].map((x) => [x, lastWheel(0, arm, trainTo(x))]));
}

const ARM_Z = -0.24; // 臂的中心(厚 0.06:−0.27..−0.21,在所有輪的下面)
const OUTER = RN + 0.06; // E、F、G 的齒頂圓(模數 0.06)
// 輪(不畫自帶的輪轂,套管與指標另外畫)、套管(有孔的圓柱)與指標(輪轂上伸出一根臂的板,中間開孔讓裡面的套管穿過)
const wheel = (teeth, z, bore) => ({ kind: "gear", teeth, radius: RN, width: 0.1, bore, hub: false, at: [0, 0, z] });
const tube = (radius, inner, z0, z1) => ({ kind: "cylinder", radius, inner, length: z1 - z0, at: [0, 0, (z0 + z1) / 2] });
const pointer = (len, boss, hole, z) => ({ kind: "plate", role: "pointer", shape: shape(hubArms(boss, 0.06, [{ angle: 0, length: len }]), hole ? [circle(hole).reverse()] : []), thickness: 0.03, at: [0, 0, z], accent: true });
// 由下到上:E 的指標 0.24..0.27、F 的 0.30..0.33、G 的 0.36..0.39(B 的頂面 0.2)
export const POINTER_LENGTH = { E: 0.9, F: 0.75, G: 0.6 };

export default {
  figure: 504,
  parts: [
    // 凸柱與 A;柱座與底板(推斷)在臂的下面
    {
      id: "post",
      kind: "group",
      label: "A",
      labelOffset: [-0.2, -0.75, 0.4],
      pieces: [
        { kind: "gear", teeth: TEETH.A, radius: RA, width: 0.1, bore: 0.1 },
        { kind: "cylinder", radius: 0.1, length: 0.65, at: [0, 0, -0.225] },
        { kind: "cylinder", radius: 0.25, length: 0.32, at: [0, 0, -0.44] },
        { kind: "box", size: [1.0, 1.0, 0.06], at: [0, 0, -0.63] },
      ],
    },
    // 臂 C、D:C 端伸到凸柱的另一邊、D 端伸出輪外;銷 M 到 B 的頂面,銷 N 到 G 的套管頂
    {
      id: "arm",
      kind: "plate",
      shape: shape(thickLine([[-1.0, 0], [N_AT + OUTER + 0.45, 0]], 0.22), [circle(0.1).reverse()]),
      thickness: 0.06,
      center: [0, 0, ARM_Z],
      spin: 0.62,
      mark: [-0.85, 0],
      pieces: [
        { kind: "cylinder", radius: 0.05, length: 0.5, at: [M_AT, 0, 0.2] },
        { kind: "cylinder", radius: 0.05, length: 0.63, at: [N_AT, 0, 0.36 - 0.315 - ARM_Z] },
      ],
    },
    { id: "labelC", kind: "group", pieces: [], label: "C", labelOffset: [0, 0, 0.3] },
    { id: "labelD", kind: "group", pieces: [], label: "D", labelOffset: [0, 0, 0.3] },
    { id: "wheelB", kind: "gear", teeth: TEETH.B, radius: RB, width: 0.4, bore: 0.05, label: "B", labelOffset: [0, 0.65, 0.4] },
    // E:輪、輪轂(套在 F 的套管上)與最下面的指標
    { id: "wheelE", kind: "group", label: "E", labelOffset: [0.85, 0.3, 0.3], spin: 0.75, pieces: [wheel(TEETH.E, 0.15, 0.1), tube(0.15, 0.1, 0.08, 0.24), pointer(POINTER_LENGTH.E, 0.15, 0.1, 0.255)] },
    // F:輪與往上穿過 E 的套管(套在 G 的套管上),套管頂上是中間的指標
    { id: "wheelF", kind: "group", label: "F", labelOffset: [0.85, 0.0, 0.3], spin: 0.7, pieces: [wheel(TEETH.F, 0, 0.075), tube(0.1, 0.075, -0.07, 0.3), pointer(POINTER_LENGTH.F, 0.11, 0.075, 0.315)] },
    // G:輪與往上穿過 F、E 的套管(套在銷 N 上),套管頂上是最上面的指標
    { id: "wheelG", kind: "group", label: "G", labelOffset: [0.85, -0.3, 0.3], spin: 0.65, pieces: [wheel(TEETH.G, -0.15, 0.05), tube(0.075, 0.05, -0.2, 0.36), pointer(POINTER_LENGTH.G, 0.09, 0, 0.375)] },
    { id: "labelN", kind: "group", pieces: [], label: "N", labelOffset: [0, 0, 0.5] },
    { id: "labelM", kind: "group", pieces: [], label: "M", labelOffset: [0, 0, 0.5] },
  ],
  driver: { part: "arm", type: "rotation", speed: 0.3 },
  target: "wheelE", // 展示悖論的三個輪疊在銷 N 上,取最上面看得到的 E 代表
  view: { direction: [0.08, 0.1, 1] },
  pose(arm) {
    const p = paradox(arm);
    const N = polar(N_AT, arm);
    const Mp = polar(M_AT, arm);
    // B 的絕對轉角:A 固定,A → B 一次外嚙合
    const b = B0 + lastWheel(0, arm, -TEETH.A / TEETH.B);
    return {
      parts: {
        arm: { angle: arm },
        labelC: { position: polar(-0.85, arm, ARM_Z) },
        labelD: { position: polar(N_AT + OUTER + 0.3, arm, ARM_Z) },
        labelN: { position: N },
        labelM: { position: Mp },
        wheelB: { position: Mp, angle: b },
        wheelE: { position: N, angle: PHASE.E + p.E },
        wheelF: { position: N, angle: PHASE.F + p.F },
        wheelG: { position: N, angle: PHASE.G + p.G },
      },
      readouts: [
        { label: "臂轉一圈:E", value: `${(trainToTurns("E")).toFixed(4)} 圈(與臂同向)` },
        { label: "F", value: `${trainToTurns("F").toFixed(4)} 圈(不轉)` },
        { label: "G", value: `${trainToTurns("G").toFixed(4)} 圈(與臂反向)` },
      ],
    };
  },
};

/** 臂轉一圈時 X 的絕對轉數 */
export const trainToTurns = (x) => lastWheel(0, TAU, trainTo(x)) / TAU;
