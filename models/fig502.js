// 第 502 種:「周轉輪系」。任何齒輪系,只要其中齒輪的軸繞一個共同中心公轉,就可以叫這個名字。這種輪系一端的輪(若不是兩端)
// 總是與旋轉框架同心。C 是框架,即承載輪系的臂。與框架同心的中央輪 A 咬小齒輪 F,F 的軸上固定著輪 E,E 咬輪 B。
// 若 A 固定不動、對框架 C 施加運動,輪系就繞固定輪公轉,框架相對固定輪的運動經輪系傳給 B,使 B 繞自身的軸轉。
// 也可以讓第一個輪與框架以不同速度轉,結果相同,只是 B 的轉速不同。若 E 不咬 B 而改咬與框架同心的輪 D,
// 就得到兩端的輪都與框架同心的周轉輪系:可以把運動給臂與一個端輪,產生另一個端輪的合成轉動。
// 主動件是框架 C;狀態按鈕選擇末輪是 B(在臂端)或 D(與框架同心),以及 A 是否也在轉。
// 推斷:齒數 A 24、F 18、E 24、B 18、D 18(依原圖比例)。
// 支座與傳動(推斷;原圖只畫出輪與臂):框架 C 固定在中心軸上,軸往後穿過 A 的套筒,轉在支座頂的軸承裡;
// F、E 與 B 的軸銷立在框架上。「A 也轉」時,中心軸後端的小齒輪 S 經一根副軸(K1、K2)帶動 A 套筒後端的齒輪 T,
// A 與框架同向、轉速一半(原文只說「以不同的速度旋轉」);A 固定時,副軸拿開、套筒由夾塊鎖在支座上
// (換接法是操作的人做的,所以用狀態按鈕)。
// 各輪的齒相位在「框架的座標系」裡算(框架轉 0 時的幾何,接觸點固定),再加上框架的轉角:
// 若直接用公轉中的接觸點算 gears.meshAngle,它對齊齒相位的整數取整會在某個框架角突然換一齒,輪會跳一個齒距。
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
// 框架轉 0 時 F/E 與 B 的位置:咬合用這組固定的幾何算
const F0 = { center: [O[0], O[1] + P_AT, 0], teeth: TEETH.F, radius: r(TEETH.F) };
const E0 = { center: F0.center, teeth: TEETH.E, radius: r(TEETH.E) };
const B0 = { center: [O[0], O[1] + B_AT, 0], teeth: TEETH.B, radius: r(TEETH.B) };
/** 在框架上看:a 相對框架轉 angleA 時,與它咬合的 b 相對框架的轉角(a、b 用框架轉 0 時的位置) */
const meshOnArm = (a, b, angleA, arm) => arm + meshAngle(a, b, angleA - arm);
/** A → B、A → D 的輪系值(以臂為參考) */
export const E_AB = trainValue([[TEETH.A, TEETH.F, -1], [TEETH.E, TEETH.B, -1]]);
export const E_AD = trainValue([[TEETH.A, TEETH.F, -1], [TEETH.E, TEETH.D, -1]]);

const STATES = {
  bFixedA: { last: "B", aRate: 0 },
  bTurningA: { last: "B", aRate: 0.5 },
  dFixedA: { last: "D", aRate: 0 },
};
// 「A 也轉」的副軸:S(12)咬 K1(24),同軸的 K2(18)咬 T(18):A / 框架 = (12/24)(18/18) = 1/2,兩次外嚙合同向
const Q = [O[0] + 0.9 * Math.cos(-0.35), O[1] + 0.9 * Math.sin(-0.35), 0]; // 副軸
const S0 = { center: [O[0], O[1], -0.85], teeth: 12, radius: r(12) };
const K1 = { center: [Q[0], Q[1], -0.85], teeth: 24, radius: r(24) };
const K2 = { center: [Q[0], Q[1], -0.55], teeth: 18, radius: r(18) };
const T = { center: [O[0], O[1], -0.55], teeth: 18, radius: r(18) };
const T_PHASE = meshAngle(K2, T, meshAngle(S0, K1, 0)); // T 固定在 A 的套筒上:框架與 A 都在 0 時 T 的相位
const FLOOR = O[1] - 1.55;

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
    // 支座:中心軸的軸承與立柱、底板
    {
      id: "stand",
      kind: "group",
      pieces: [
        { kind: "box", size: [3.2, 0.15, 1.0], at: [0.3, FLOOR - 0.075, -0.6] },
        { kind: "box", size: [0.14, O[1] - 0.12 - FLOOR, 0.12], at: [O[0], (O[1] - 0.12 + FLOOR) / 2, -0.98] },
        { kind: "cylinder", radius: 0.13, inner: 0.065, length: 0.1, at: [O[0], O[1], -0.98] },
      ],
    },
    // A 固定時把它的套筒鎖在底板上的夾塊
    { id: "clamp", kind: "box", size: [0.1, O[1] - 0.1 - FLOOR, 0.1], center: [O[0], (O[1] - 0.1 + FLOOR) / 2, -0.42] },
    // 副軸的支柱與軸承(「A 也轉」時才裝上)
    { id: "counterStand", kind: "group", pieces: [{ kind: "box", size: [0.12, Q[1] - 0.12 - FLOOR, 0.12], at: [Q[0], (Q[1] - 0.12 + FLOOR) / 2, -1.1] }, { kind: "cylinder", radius: 0.11, inner: 0.055, length: 0.1, at: [Q[0], Q[1], -1.1] }] },
    { id: "counter", kind: "group", center: Q, arrow: false, pieces: [{ kind: "cylinder", radius: 0.05, length: 0.7, at: [0, 0, -0.75] }, { kind: "gear", teeth: K1.teeth, radius: K1.radius, width: 0.1, at: [0, 0, -0.85] }, { kind: "gear", teeth: K2.teeth, radius: K2.radius, width: 0.1, at: [0, 0, -0.55] }] },
    // A 與它的套筒、套筒後端的齒輪 T
    {
      id: "wheelA",
      kind: "group",
      center: O,
      label: "A",
      labelOffset: [0.75, -0.45, 0.2],
      spin: r(TEETH.A) + 0.15,
      pieces: [
        { kind: "gear", teeth: TEETH.A, radius: r(TEETH.A), width: 0.12, bore: 0.08 },
        { kind: "cylinder", radius: 0.1, inner: 0.065, length: 0.45, at: [0, 0, -0.27] },
        { kind: "gear", teeth: T.teeth, radius: T.radius, width: 0.1, bore: 0.065, at: [0, 0, -0.4], angle: T_PHASE },
      ],
    },
    { id: "wheelD", kind: "gear", center: O, teeth: TEETH.D, radius: r(TEETH.D), width: 0.12, bore: 0.08, label: "D", labelOffset: [0.15, -0.3, 0.3] },
    { id: "wheelF", kind: "gear", teeth: TEETH.F, radius: r(TEETH.F), width: 0.12, bore: 0.06, label: "F", labelOffset: [-0.35, 0.15, 0.3], arrow: false },
    { id: "wheelE", kind: "gear", teeth: TEETH.E, radius: r(TEETH.E), width: 0.12, bore: 0.06, label: "E", labelOffset: [0.75, -0.1, 0.3] }, // F 與 E 同軸,箭頭只畫在 E
    { id: "wheelB", kind: "gear", teeth: TEETH.B, radius: r(TEETH.B), width: 0.12, bore: 0.06, label: "B", labelOffset: [0.3, 0.2, 0.3] },
    {
      id: "frameC",
      kind: "plate",
      shape: shape(thickLine([[0, 0], [0, B_AT]], 0.14)),
      thickness: 0.05,
      center: O,
      label: "C",
      labelOffset: [0.2, 0.25, 0.4],
      spin: 0.4,
      mark: [0, B_AT * 0.55],
      pieces: [
        // 中心軸(往後穿過 A 的套筒到支座的軸承)、後端的小齒輪 S,F/E 與 B 的軸銷
        { kind: "cylinder", radius: 0.06, length: 1.18, at: [0, 0, -0.56] },
        { kind: "gear", teeth: S0.teeth, radius: S0.radius, width: 0.1, at: [0, 0, -1.0] },
        { kind: "cylinder", radius: 0.05, length: 0.35, at: [0, P_AT, -0.225] },
        { kind: "cylinder", radius: 0.05, length: 0.21, at: [0, B_AT, -0.105] },
      ],
    },
  ],
  states: {
    initial: "bFixedA",
    options: [
      { id: "bFixedA", label: "A 固定,B 在臂端" },
      { id: "bTurningA", label: "A 也轉(經副軸),B 在臂端" },
      { id: "dFixedA", label: "A 固定,末輪 D 與框架同心" },
    ],
  },
  driver: { part: "frameC", type: "rotation", speed: 0.4 },
  targets: ["wheelB", "wheelD"],
  view: { direction: [0.06, 0.06, 1] },
  pose(arm, state = "bFixedA") {
    const t = train(arm, state);
    const turning = STATES[state].aRate !== 0;
    const P = at(arm, P_AT);
    const Bc = at(arm, B_AT);
    const f = meshOnArm(A, F0, t.A, arm);
    const e = f; // F 與 E 固定在同一根軸上
    const isB = t.which === "B";
    return {
      parts: {
        frameC: { position: [O[0], O[1], 0.15], angle: arm },
        wheelA: { position: [O[0], O[1], -0.15], angle: t.A },
        clamp: { visible: !turning },
        counterStand: { visible: turning },
        counter: { angle: meshAngle(S0, K1, arm), visible: turning },
        wheelF: { position: [P[0], P[1], -0.15], angle: f },
        wheelE: { position: [P[0], P[1], 0.02], angle: e },
        wheelB: { position: [Bc[0], Bc[1], 0.02], angle: meshOnArm(E0, B0, e, arm), visible: isB },
        wheelD: { position: [O[0], O[1], 0.02], angle: meshOnArm(E0, D, e, arm), visible: !isB },
      },
      readouts: [{ label: `${t.which} 的轉速 / 框架`, value: t.ratio.toFixed(3) }],
    };
  },
};

