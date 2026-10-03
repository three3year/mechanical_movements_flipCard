// 第 505 種:另一種簡單的周轉輪系。臂 D 帶著小齒輪 B,B 同時咬正齒輪 A 與環形齒輪(內齒輪)C,A、C 都與臂的軸同心。
// A、C 任一個可以固定不動,臂與小齒輪的公轉就使另一個輪轉動。
// 主動件是臂 D;狀態按鈕選擇固定 C 或固定 A。
// 推斷:齒數 A 16、B 10、C 36(依原圖比例,且 A + 2B = C)。
// 齒相位在「臂的座標系」裡算(臂轉 0 時 B 的位置,接觸點固定),再加上臂的轉角:若直接用公轉中的接觸點算
// gears.meshAngle,它對齊齒相位的整數取整會在某個臂角突然換一齒,輪會跳一兩個齒距。
import { polar } from "./kit.js";
import { meshAngle } from "./gears.js";
import { lastWheel, trainValue } from "./epicyclic.js";
import { shape, thickLine, circle } from "./shapes.js";

const M = 0.1;
export const TEETH = { A: 16, B: 10, C: 36 };
const A = { center: [0, 0, 0], teeth: TEETH.A, radius: (TEETH.A * M) / 2 };
const C = { center: [0, 0, 0], teeth: TEETH.C, radius: (TEETH.C * M) / 2, internal: true };
const ORBIT = A.radius + (TEETH.B * M) / 2;
const B0 = { center: [ORBIT, 0, 0], teeth: TEETH.B, radius: (TEETH.B * M) / 2 }; // 臂轉 0 時的 B
/** 在臂上看:a 相對臂轉 angleA 時,與它咬合的 b 相對臂的轉角(a、b 用臂轉 0 時的位置) */
const meshOnArm = (a, b, angleA, arm) => arm + meshAngle(a, b, angleA - arm);
/** A → C 的輪系值(以臂為參考):A 外嚙合 B,B 內嚙合 C */
export const E_AC = trainValue([[TEETH.A, TEETH.B, -1], [TEETH.B, TEETH.C, 1]]);

/** 臂轉 arm、固定哪個輪 → A、C 的轉角(Willis 公式) */
export function wheels(arm, fixed = "C") {
  if (fixed === "C") return { A: arm + (0 - arm) / E_AC, C: 0 }; // C 固定:由 C − arm = e(A − arm) 解出 A
  return { A: 0, C: lastWheel(0, arm, E_AC) };
}

export default {
  figure: 505,
  parts: [
    { id: "wheelA", kind: "gear", center: A.center, teeth: A.teeth, radius: A.radius, width: 0.25, bore: 0.1, label: "A", labelOffset: [-0.25, -0.45, 0.3] },
    { id: "wheelC", kind: "gear", internal: true, center: C.center, teeth: C.teeth, radius: C.radius, rim: C.radius + 0.25, width: 0.25, label: "C", labelOffset: [-1.3, -1.6, 0.3] },
    { id: "pinionB", kind: "gear", center: [ORBIT, 0, 0], teeth: TEETH.B, radius: (TEETH.B * M) / 2, width: 0.25, bore: 0.06, label: "B", labelOffset: [0, 0.25, 0.3], arrow: false },
    { id: "armD", kind: "plate", shape: shape(thickLine([[0, 0], [C.radius + 0.6, 0]], 0.14), [circle(0.06).reverse(), circle(0.05, ORBIT, 0).reverse()]), thickness: 0.06, label: "D", labelOffset: [C.radius + 0.55, 0.25, 0.3], spin: 0.6, pieces: [{ kind: "cylinder", radius: 0.06, length: 0.5, at: [ORBIT, 0, -0.1] }] },
  ],
  states: {
    initial: "C",
    options: [
      { id: "C", label: "固定 C(A 被帶動)" },
      { id: "A", label: "固定 A(C 被帶動)" },
    ],
  },
  driver: { part: "armD", type: "rotation", speed: 0.4, initial: 0.9 },
  targets: ["wheelA", "wheelC"],
  view: { direction: [0.06, 0.06, 1] },
  pose(arm, state = "C") {
    const w = wheels(arm, state);
    // 小齒輪的轉角:由固定的那個輪的齒位置決定,再帶動另一個輪
    const b = state === "C" ? meshOnArm(C, B0, w.C, arm) : meshOnArm(A, B0, w.A, arm);
    return {
      parts: {
        armD: { position: [0, 0, 0.2], angle: arm },
        pinionB: { position: polar(ORBIT, arm), angle: b },
        wheelA: { angle: state === "C" ? meshOnArm(B0, A, b, arm) : 0 },
        wheelC: { angle: state === "A" ? meshOnArm(B0, C, b, arm) : 0 },
      },
      readouts: [{ label: state === "C" ? "A 的轉速 / 臂" : "C 的轉速 / 臂", value: (state === "C" ? 1 - 1 / E_AC : 1 - E_AC).toFixed(3) }],
    };
  },
};
