// 第 303 種:靜擊式擺鐘擒縱。錨形件繞上方的軸 C 擺動,由擺(PEN.,下端 F)帶動;擒縱叉瓦 E 的內側面與 D 的外側面
// 都與錨形件的擺動軸同心,所以齒抵住叉瓦時輪不會回退,只有滑過衝擊面時才前進。擺每擺一次,擒縱輪轉過半個齒。
// 主動件是擺(連同錨形件)。
// 推斷:擺幅與齒數(依原圖約三十齒)。
import { TAU, deg, swing } from "./kit.js";
import { escapeStep, escapeWheelPieces } from "./escapement.js";
import { shape, thickLine, circle, arcPoints } from "./shapes.js";

export const N = 30;
export const PITCH = TAU / N;
export const SWING = deg(4);
const WHEEL = [0.15, -0.2, 0];
const C = [0.15, 2.35, 0];
const RW = 1.55;

/** 擺累計擺動 v → 擺角、擒縱輪轉角(順時針為負,不回退) */
export function deadbeat(v) {
  return { pendulum: swing(v, -SWING, SWING), wheel: -escapeStep(v, -SWING, SWING, PITCH / 2, 0.55) };
}

// 錨形件(相對 C):兩臂斜下,左端叉瓦 D、右端叉瓦 E,叉瓦面是以 C 為圓心的弧
const R_PAD = 1.62;
const anchor = shape(thickLine([[-1.2, -1.05], [-0.75, -0.45], [0, 0], [0.75, -0.45], [1.15, -1.05]], 0.22), [circle(0.09).reverse()]);
const arcPad = (r, a0, a1) => shape([...arcPoints(r + 0.09, a0, a1), ...arcPoints(r - 0.09, a1, a0)]);

export default {
  figure: 303,
  parts: [
    { id: "wheel", kind: "group", center: WHEEL, spin: RW, pieces: [...escapeWheelPieces({ teeth: N, outer: RW, inner: RW - 0.24, dir: -1, rim: 0.12 }), { kind: "box", size: [0.12, 0.12, 0.14], at: [RW - 0.45, 0, 0.08], accent: true }] },
    {
      id: "anchor",
      kind: "group",
      center: C,
      arrow: false,
      pieces: [
        { kind: "plate", shape: anchor, thickness: 0.12, at: [0, 0, 0.15] },
        { kind: "plate", shape: arcPad(R_PAD, deg(-143), deg(-131)), thickness: 0.16, at: [0, 0, 0.15] },
        { kind: "plate", shape: arcPad(R_PAD, deg(-49), deg(-37)), thickness: 0.16, at: [0, 0, 0.15] },
        { kind: "cylinder", radius: 0.2, inner: 0.09, length: 0.3 },
        // 擺桿 PEN.,下端 F
        { kind: "box", size: [0.08, 4.6, 0.06], at: [0, -2.3, 0.28] },
        { kind: "cylinder", radius: 0.12, length: 0.12, at: [0, -4.6, 0.28] },
      ],
    },
    { id: "labelC", kind: "group", center: C, label: "C", labelOffset: [0, 0.32, 0.3] },
    { id: "labelD", kind: "group", center: [C[0] - 1.3, C[1] - 1.05, 0], label: "D", labelOffset: [-0.3, 0.15, 0.3] },
    { id: "labelE", kind: "group", center: [C[0] + 1.2, C[1] - 1.05, 0], label: "E", labelOffset: [0.3, 0.15, 0.3] },
    { id: "labelF", kind: "group", center: [C[0], C[1] - 4.6, 0], label: "F", labelOffset: [0.3, 0, 0.3] },
  ],
  driver: { part: "anchor", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheel", // 擒縱輪
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const d = deadbeat(v);
    return { parts: { anchor: { angle: d.pendulum }, wheel: { angle: d.wheel } }, readouts: [] };
  },
  waivers: [
    { check: "unsupported", parts: ["wheel"], reason: "擒縱的接觸是瞬間的(輪齒落在掣子上、滑過衝擊面);模型依相位演出,零件的外形沒有畫到真的互相碰到(差 0.05)。要補得重排擺軸、掣子與擒縱輪的相對位置(列入待確認清單)" },
    { check: "unsupported", parts: ["anchor"], reason: "擒縱的接觸是瞬間的(輪齒落在掣子上、滑過衝擊面);模型依相位演出,零件的外形沒有畫到真的互相碰到(差 0.05)。要補得重排擺軸、掣子與擒縱輪的相對位置(列入待確認清單)" },
  ],
};
