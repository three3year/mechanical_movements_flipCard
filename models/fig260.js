// 第 260 種:差動運動機構。驅動軸 A 上有兩個小齒輪 F、B,分別帶動輪 D 與輪 E。螺桿 C 的軸固定在輪 D 上,
// 跟著 D 轉;螺帽固定在輪 E 的輪轂上,E 在較短支柱的軸承裡自由轉動、不能側移。兩輪轉速相同時螺桿不動;
// 轉速不同時,螺桿依兩者的速度差沿軸移動(每差一圈移動一個螺距)。F 做得很長,D 隨螺桿移動時仍與它咬合。
// 主動件是驅動軸 A。
// 推斷:齒數(F 8、D 32、B 12、E 28)與螺距;讓兩輪轉速不同;螺桿的尾軸穿過左支柱(原圖螺桿左端在支柱裡)。
// 驅動軸 A 照原圖往左穿出左支柱;原圖的 A 往右伸出畫面外,右端的軸承在畫面外。推斷:B 右邊補一座軸承——
// 立柱站在底板上、放在螺桿 C 的後面(螺桿從它前面經過),頂端的軸承塊往前伸到 A 的軸線上。
import { X, TAU, clamp, screwAdvance } from "./kit.js";
import { meshAngle } from "./gears.js";

const AXIS_A = 1.55; // 驅動軸高度
const AXIS_C = -0.45; // 螺桿高度
const XD = -0.6;
const XE = 1.25;
const BASE_TOP = -2.18; // 底板頂面
const XR = 2.3; // B 右邊那座軸承(推斷)的 x
const ZR = [-0.6, -0.35]; // 它的立柱的深度範圍:在螺桿 C(半徑連螺紋 0.25)的後面
export const F = { teeth: 8, radius: 0.4, center: [XD, AXIS_A, 0], axis: X };
export const D = { teeth: 32, radius: 1.6, center: [XD, AXIS_C, 0], axis: X };
export const B = { teeth: 12, radius: 0.6, center: [XE, AXIS_A, 0], axis: X };
export const E = { teeth: 28, radius: 1.4, center: [XE, AXIS_C, 0], axis: X };
export const PITCH = 0.36;
export const RANGE = [-6 * TAU, 6 * TAU];

/** 驅動軸轉 a:兩輪的轉角與螺桿(連同輪 D)沿軸的移動量 */
export function differential(a0) {
  const a = clamp(a0, ...RANGE);
  const d = meshAngle(F, D, a);
  const e = meshAngle(B, E, a);
  const d0 = meshAngle(F, D, 0);
  const e0 = meshAngle(B, E, 0);
  // 螺桿相對螺帽(輪 E)轉了 (d − e),沿軸前進一個螺距 × 圈數差
  return { a, d, e, shift: screwAdvance(d - d0 - (e - e0), PITCH) };
}

const gear = (id, g, width, label, labelOffset, extra = {}) => ({ id, kind: "gear", center: g.center, axis: X, teeth: g.teeth, radius: g.radius, width, bore: 0.1, label, labelOffset, ...extra });

export default {
  figure: 260,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.35, 4.6, 0.6], at: [-2.65, 0.1, 0] },
        { kind: "box", size: [0.3, 1.0, 0.5], at: [XE + 0.55, AXIS_C - 0.2, 0] }, // 短支柱頂的軸承(E 的輪轂在裡面轉)
        { kind: "plate", shape: { outline: [[XE + 0.4, BASE_TOP], [XE + 1.5, BASE_TOP], [XE + 0.7, -0.75], [XE + 0.4, -0.75]], holes: [] }, thickness: 0.5 }, // 短支柱的斜撐板,站在底板上
        { kind: "box", size: [5.8, 0.12, 1.2], at: [-0.05, BASE_TOP - 0.06, 0] },
        // B 右邊的軸承座(推斷):立柱站在底板上、在螺桿後面,頂端的軸承塊往前伸,A 從中穿過
        { kind: "box", size: [0.3, AXIS_A + 0.225 - BASE_TOP, ZR[1] - ZR[0]], at: [XR, (AXIS_A + 0.225 + BASE_TOP) / 2, (ZR[0] + ZR[1]) / 2] },
        { kind: "box", size: [0.3, 0.45, 0.25 - ZR[0]], at: [XR, AXIS_A, (ZR[0] + 0.25) / 2] },
      ],
    },
    gear("shaftA", F, 1.9, "A", [1.45, 0.3, 0.3], { pieces: [{ kind: "cylinder", radius: 0.09, length: 5.6, at: [0, 0, 0.25] }], center: [XD + 0.15, AXIS_A, 0] }), // A 從左支柱外伸到右邊軸承座外(x −3.0…2.6)
    gear("pinionB", B, 0.3, "B", [0.1, 0.9, 0.3]),
    { id: "labelF", kind: "group", center: F.center, label: "F", labelOffset: [-0.2, 0.75, 0.3] },
    gear("wheelD", D, 0.3, "D", [0, 0.2, 0.4]),
    gear("wheelE", E, 0.3, "E", [0, 0.2, 0.4], { pieces: [{ kind: "cylinder", radius: 0.3, length: 0.5, at: [0, 0, 0.35] }] }),
    { id: "screwC", kind: "worm", axis: X, center: [XD + 1.9, AXIS_C, 0], radius: 0.2, length: 3.8, pitch: PITCH, thread: 0.05, label: "C", labelOffset: [0, 0.4, 0.3], pieces: [{ kind: "cylinder", radius: 0.12, length: 2.9, at: [0, 0, -3.25] }] }, // 螺桿的尾軸往左穿過左支柱(可沿軸滑的軸承)
  ],
  driver: { part: "shaftA", grips: ["pinionB"], type: "rotation", range: RANGE, initial: 0 },
  target: "screwC",
  view: { direction: [0.2, 0.15, 1] },
  pose(a0) {
    const { a, d, e, shift } = differential(a0);
    return {
      parts: {
        shaftA: { angle: a },
        pinionB: { angle: a },
        wheelD: { angle: d, position: [XD + shift, AXIS_C, 0] },
        wheelE: { angle: e },
        screwC: { angle: d, position: [XD + 1.9 + shift, AXIS_C, 0] },
      },
      readouts: [],
    };
  },
};
