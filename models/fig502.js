// 第 502 種:「周轉輪系」。任何齒輪系,只要其中齒輪的軸繞一個共同中心公轉,就可以叫這個名字。這種輪系一端的輪(若不是兩端)
// 總是與旋轉框架同心。C 是框架,即承載輪系的臂。與框架同心的中央輪 A 咬小齒輪 F,F 的軸上固定著輪 E,E 咬輪 B。
// 若 A 固定不動、對框架 C 施加運動,輪系就繞固定輪公轉,框架相對固定輪的運動經輪系傳給 B,使 B 繞自身的軸轉。
// 也可以讓第一個輪與框架以不同速度轉,結果相同,只是 B 的轉速不同。若 E 不咬 B 而改咬與框架同心的輪 D,
// 就得到兩端的輪都與框架同心的周轉輪系:可以把運動給臂與一個端輪,產生另一個端輪的合成轉動。
// 主動件是框架 C;狀態按鈕選擇末輪是 B(在臂端)或 D(與框架同心),以及 A 是否也在轉。
// 推斷:齒數 A 24、F 18、E 24、B 18、D 18(依原圖比例);「A 也轉」時 A 以臂轉速的一半反向轉。
import { meshAngle } from "./gears.js";
import { lastWheel, trainValue } from "./epicyclic.js";
import { shape, thickLine, circle } from "./shapes.js";

const M = 0.05;
export const TEETH = { A: 24, F: 18, E: 24, B: 18, D: 18 };
const r = (n) => (n * M) / 2;
const O = [0, -1.2, 0]; // 框架的支點(A、D 的中心)
const P_AT = r(TEETH.A) + r(TEETH.F); // F、E 的軸離支點
const B_AT = P_AT + r(TEETH.E) + r(TEETH.B); // B 的軸離支點
const A = { center: O, teeth: TEETH.A, radius: r(TEETH.A) };
const D = { center: O, teeth: TEETH.D, radius: r(TEETH.D) };
/** A → B、A → D 的輪系值(以臂為參考) */
export const E_AB = trainValue([[TEETH.A, TEETH.F, -1], [TEETH.E, TEETH.B, -1]]);
export const E_AD = trainValue([[TEETH.A, TEETH.F, -1], [TEETH.E, TEETH.D, -1]]);

const STATES = {
  bFixedA: { last: "B", aRate: 0 },
  bTurningA: { last: "B", aRate: -0.5 },
  dFixedA: { last: "D", aRate: 0 },
};

/** 框架轉 arm、狀態 → A 與末輪的轉角,以及末輪對框架的轉速比 */
export function train(arm, state = "bFixedA") {
  const s = STATES[state];
  const e = s.last === "B" ? E_AB : E_AD;
  const a = s.aRate * arm;
  return { A: a, last: lastWheel(a, arm, e), which: s.last, ratio: 1 + e * (s.aRate - 1) };
}

const at = (arm, d) => [O[0] + d * Math.cos(arm + Math.PI / 2), O[1] + d * Math.sin(arm + Math.PI / 2), 0];

export default {
  figure: 502,
  parts: [
    { id: "wheelA", kind: "gear", center: O, teeth: TEETH.A, radius: r(TEETH.A), width: 0.12, bore: 0.08, label: "A", labelOffset: [0.75, -0.45, 0.2] },
    { id: "wheelD", kind: "gear", center: O, teeth: TEETH.D, radius: r(TEETH.D), width: 0.12, bore: 0.08, label: "D", labelOffset: [0.15, -0.3, 0.3] },
    { id: "wheelF", kind: "gear", teeth: TEETH.F, radius: r(TEETH.F), width: 0.12, bore: 0.06, label: "F", labelOffset: [-0.35, 0.15, 0.3], arrow: false },
    { id: "wheelE", kind: "gear", teeth: TEETH.E, radius: r(TEETH.E), width: 0.12, bore: 0.06, label: "E", labelOffset: [0.75, -0.1, 0.3] }, // F 與 E 同軸,箭頭只畫在 E
    { id: "wheelB", kind: "gear", teeth: TEETH.B, radius: r(TEETH.B), width: 0.12, bore: 0.06, label: "B", labelOffset: [0.3, 0.2, 0.3] },
    { id: "frameC", kind: "plate", shape: shape(thickLine([[0, 0], [0, B_AT]], 0.14), [circle(0.05).reverse(), circle(0.05, 0, P_AT).reverse(), circle(0.05, 0, B_AT).reverse()]), thickness: 0.05, center: O, label: "C", labelOffset: [0.2, 0.25, 0.4], spin: 0.4 },
  ],
  states: {
    initial: "bFixedA",
    options: [
      { id: "bFixedA", label: "A 固定,B 在臂端" },
      { id: "bTurningA", label: "A 也轉,B 在臂端" },
      { id: "dFixedA", label: "A 固定,末輪 D 與框架同心" },
    ],
  },
  driver: { part: "frameC", type: "rotation", speed: 0.4 },
  view: { direction: [0.06, 0.06, 1] },
  pose(arm, state = "bFixedA") {
    const t = train(arm, state);
    const P = at(arm, P_AT);
    const F = { center: P, teeth: TEETH.F, radius: r(TEETH.F) };
    const E = { center: P, teeth: TEETH.E, radius: r(TEETH.E) };
    const Bc = at(arm, B_AT);
    const B = { center: Bc, teeth: TEETH.B, radius: r(TEETH.B) };
    const f = meshAngle({ ...A }, F, t.A);
    const e = f; // F 與 E 固定在同一根軸上
    const isB = t.which === "B";
    return {
      parts: {
        frameC: { position: [O[0], O[1], 0.15], angle: arm },
        wheelA: { position: [O[0], O[1], -0.15], angle: t.A },
        wheelF: { position: [P[0], P[1], -0.15], angle: f },
        wheelE: { position: [P[0], P[1], 0.02], angle: e },
        wheelB: { position: [Bc[0], Bc[1], 0.02], angle: meshAngle(E, B, e), visible: isB },
        wheelD: { position: [O[0], O[1], 0.02], angle: meshAngle(E, D, e), visible: !isB },
      },
      readouts: [{ label: `${t.which} 的轉速 / 框架`, value: t.ratio.toFixed(3) }],
    };
  },
};

