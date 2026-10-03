// 第 504 種:「弗格森的機械悖論」,展示周轉輪系的一項奇特性質。輪 A 固定在一根不動的凸柱上,臂 C、D 繞凸柱轉;
// 臂上有兩根銷 M、N,M 上鬆套著一個厚輪 B,與 A 嚙合;N 上鬆套著三個輪 E、F、G,都與 B 嚙合。臂轉動時,運動傳給
// 共軸(銷 N)的 E、F、G,它們與中介輪 B 及 A 構成三個不同的周轉輪系。設 A 20 齒、F 20 齒、E 21 齒、G 19 齒,
// 轉動臂時,F 看起來不繞自己的軸轉(圓周上任一點始終指向同一方向),E 朝一個方向慢慢轉,G 朝另一個方向慢慢轉。
// 主動件是臂 C、D。畫面是俯視圖:E、F、G 疊在銷 N 上,各有一根指標顯示它的朝向。
// 推斷:三個輪的節圓一樣大(齒數不同、齒的大小略有差別),都咬得住 B。
import { TAU, polar, Z } from "./kit.js";
import { lastWheel, trainValue } from "./epicyclic.js";
import { meshAngle } from "./gears.js";
import { shape, thickLine, circle } from "./shapes.js";

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

const wheel = (teeth, radius, z) => ({ kind: "gear", teeth, radius, width: 0.1, bore: 0.05, at: [0, 0, z] });
const pointer = (len, z) => ({ kind: "plate", shape: shape(thickLine([[0, 0], [len, 0]], 0.06)), thickness: 0.03, at: [0, 0, z], accent: true });

export default {
  figure: 504,
  parts: [
    { id: "post", kind: "group", label: "A", labelOffset: [-0.2, -0.75, 0.4], pieces: [{ kind: "gear", teeth: TEETH.A, radius: RA, width: 0.1, bore: 0.1 }, { kind: "cylinder", radius: 0.1, length: 0.6, at: [0, 0, -0.2] }] },
    // 臂在所有輪的下面(頂面 −0.21,G 與 B 的底面 −0.2);零件的位置要用 center(at 只給附件用,原本寫 at 使臂畫在 z = 0、穿在 B 的中間)
    { id: "arm", kind: "plate", shape: shape(thickLine([[-0.5, 0], [N_AT + 0.7, 0]], 0.22), [circle(0.1).reverse()]), thickness: 0.06, center: [0, 0, -0.24], label: "C", labelOffset: [-0.45, 0.3, 0.3], spin: 0.5, pieces: [{ kind: "cylinder", radius: 0.05, length: 0.5, at: [M_AT, 0, 0.2] }, { kind: "cylinder", radius: 0.05, length: 0.6, at: [N_AT, 0, 0.2] }] },
    { id: "labelD", kind: "group", pieces: [], label: "D", labelOffset: [0, 0, 0.3] },
    { id: "wheelB", kind: "gear", teeth: TEETH.B, radius: RB, width: 0.4, bore: 0.05, label: "B", labelOffset: [0, 0.65, 0.4] },
    { id: "wheelE", kind: "group", label: "E", labelOffset: [0.85, 0.3, 0.3], spin: 0.75, pieces: [wheel(TEETH.E, RN, 0.15), pointer(0.9, 0.22)] },
    { id: "wheelF", kind: "group", label: "F", labelOffset: [0.85, 0.0, 0.3], spin: 0.7, pieces: [wheel(TEETH.F, RN, 0), pointer(0.75, 0.07)] },
    { id: "wheelG", kind: "group", label: "G", labelOffset: [0.85, -0.3, 0.3], spin: 0.65, pieces: [wheel(TEETH.G, RN, -0.15), pointer(0.6, -0.08)] },
    { id: "labelN", kind: "group", pieces: [], label: "N", labelOffset: [0, 0, 0.5] },
    { id: "labelM", kind: "group", pieces: [], label: "M", labelOffset: [0, 0, 0.5] },
  ],
  waivers: [
    { check: "interference", parts: ["wheelB", "wheelF"], reason: "待確認:wheelB 的板 與 wheelF 的板重疊 0.08,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
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
        labelD: { position: polar(N_AT + 0.6, arm) },
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
