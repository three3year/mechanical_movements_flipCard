// 第 502 種:「周轉輪系」。任何齒輪系,只要其中齒輪的軸繞一個共同中心公轉,就可以叫這個名字。這種輪系一端的輪(若不是兩端)
// 總是與旋轉框架同心。C 是框架,即承載輪系的臂。與框架同心的中央輪 A 咬小齒輪 F,F 的軸上固定著輪 E,E 咬輪 B。
// 若 A 固定不動、對框架 C 施加運動,輪系就繞固定輪公轉,框架相對固定輪的運動經輪系傳給 B,使 B 繞自身的軸轉。
// 也可以讓第一個輪與框架以不同速度轉,結果相同,只是 B 的轉速不同。若 E 不咬 B 而改咬與框架同心的輪 D,
// 就得到兩端的輪都與框架同心的周轉輪系:可以把運動給臂與一個端輪,產生另一個端輪的合成轉動;
// 也可以把運動給兩端的輪 A、D,合成運動就傳給臂。
// 狀態按鈕選擇接法(五種):A 固定 / A 也轉,末輪 B;A 固定 / A 也轉,末輪 D;A、D 兩端輸入、臂得到合成運動。
// 推斷:齒數 A 24、F 18、E 22、B 18、D 20(依原圖比例;A + F = E + D,D 才與框架同心;D 與 B 齒數不同,
// 兩種輪系的讀數才分得開)。
// 支座與傳動(推斷;原圖只畫出輪與臂):框架 C 固定在中心軸上,軸往後穿過 D、A 的套筒(D 的在裡面),轉在支座頂的軸承裡;
// F、E 是同一個零件(中間有轂),與 B 的軸銷都立在框架板上。運動由後面一根副軸輸入(主動件:副軸後端的手柄,推斷):
// 副軸上三個齒輪可以沿軸滑進或滑出(換接法是操作的人做的,所以用狀態按鈕):K1 咬中心軸後端的 S(帶動框架,1 : 1 反向)、
// K2 咬 A 套筒後端的 T(帶動 A,框架的一半、同向)、K3 咬 D 套筒後端的 U(帶動 D,與手柄 1 : 1 反向)。A 固定時 K2 滑出、
// 夾塊把 A 的套筒鎖在底板上;「A、D 兩端輸入」時 K1 滑出,框架只由輪系帶動。
// 原文「以不同的速度旋轉」沒有給比例,A 以框架一半的轉速同向轉是推斷。
// 目標件依接法換人:末輪 B、D 是結果時塗目標件色;「A、D 兩端輸入」時 D 是輸入、臂(框架)是結果。繪圖層的目標件不隨狀態換,
// 所以 D 與框架各畫兩份(形狀相同),每個狀態只顯示其中一份。
// 各輪的齒相位在「框架的座標系」裡算(框架轉 0 時的幾何,接觸點固定),再加上框架的轉角:
// 若直接用公轉中的接觸點算 gears.meshAngle,它對齊齒相位的整數取整會在某個框架角突然換一齒,輪會跳一個齒距。
import { meshAngle } from "./gears.js";
import { lastWheel, trainValue } from "./epicyclic.js";
import { shape, thickLine } from "./shapes.js";

const M = 0.05;
export const TEETH = { A: 24, F: 18, E: 22, B: 18, D: 20 };
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
// A、框架都在 0 時,E 咬 D 的齒相位差:D = 臂 + E_AD(A − 臂) + D_PHASE
const D_PHASE = meshOnArm(E0, D, meshOnArm(A, F0, 0, 0), 0);

// 副軸(推斷):S(18,中心軸)咬 K1(18);T(24,A 的套筒)咬 K2(12);U(18,D 的套筒)咬 K3(18)。中心距都是 0.9
const Q = [O[0] + 0.9 * Math.cos(-0.35), O[1] + 0.9 * Math.sin(-0.35), 0];
const Z_S = -0.85;
const Z_T = -0.4;
const Z_U = -0.62;
const S = { center: [O[0], O[1], Z_S], teeth: 18, radius: r(18) };
const T = { center: [O[0], O[1], Z_T], teeth: 24, radius: r(24) };
const U = { center: [O[0], O[1], Z_U], teeth: 18, radius: r(18) };
const K1 = { center: [Q[0], Q[1], Z_S], teeth: 18, radius: r(18) };
const K2 = { center: [Q[0], Q[1], Z_T], teeth: 12, radius: r(12) };
const K3 = { center: [Q[0], Q[1], Z_U], teeth: 18, radius: r(18) };
// 套在副軸上的齒輪轉角就是手柄的轉角 k;被咬的 S、T、U 的齒相位做在各自的零件上:手柄在 0 時剛好嵌進齒槽
const S_PHASE = meshAngle(K1, S, 0); // 框架 = −k
const T_PHASE = meshAngle(K2, T, 0); // A = −k/2
const U_PHASE = meshAngle(K3, U, 0); // D = −k
const FLOOR = O[1] - 1.55;
// 中心軸 0.06 ⊂ D 的套筒(孔 0.06、外徑 0.09)⊂ A 的套筒(孔 0.09、外徑 0.13)
const SHAFT_R = 0.06;
const D_SLEEVE = 0.09;
const A_SLEEVE = 0.13;

// 每種接法:末輪、副軸咬上的齒輪(帶動 S → 框架、T → A、U → D)
const STATES = {
  bFixedA: { last: "B", k1: true, k2: false, k3: false },
  bTurningA: { last: "B", k1: true, k2: true, k3: false },
  dFixedA: { last: "D", k1: true, k2: false, k3: false },
  dTurningA: { last: "D", k1: true, k2: true, k3: false },
  adToArm: { last: "arm", k1: false, k2: true, k3: true },
};

/** 手柄轉 k、接法 → 框架、A、D(或 B)的轉角;which 是得到合成運動的那一個 */
export function train(k, state = "bFixedA") {
  const s = STATES[state];
  const a = s.k2 ? -k / 2 : 0;
  if (s.last === "arm") {
    const d = -k; // K3 咬 U:1 : 1 反向
    return { arm: (d - E_AD * a - D_PHASE) / (1 - E_AD), A: a, last: d, which: "arm" };
  }
  const arm = -k; // K1 咬 S:1 : 1 反向
  const e = s.last === "B" ? E_AB : E_AD;
  return { arm, A: a, last: lastWheel(a, arm, e), which: s.last };
}

const at = (arm, d) => [O[0] + d * Math.cos(arm + Math.PI / 2), O[1] + d * Math.sin(arm + Math.PI / 2), 0];

// 框架 C:板、中心軸(往後穿過 D、A 的套筒到支座的軸承)、後端的小齒輪 S,F/E 與 B 的軸銷(都接進板裡)
const frame = (id, extra) => ({
  id,
  kind: "plate",
  shape: shape(thickLine([[0, 0], [0, B_AT]], 0.14)),
  thickness: 0.05,
  center: O,
  label: "C",
  labelOffset: [0.2, 0.25, 0.4],
  spin: 0.4,
  mark: [0, B_AT * 0.55],
  pieces: [
    { kind: "cylinder", radius: SHAFT_R, length: 1.21, at: [0, 0, -0.58] },
    { kind: "gear", teeth: S.teeth, radius: S.radius, width: 0.1, bore: SHAFT_R, at: [0, 0, Z_S - 0.15], angle: S_PHASE },
    { kind: "cylinder", radius: 0.05, length: 0.4, at: [0, P_AT, -0.2] }, // F/E 的軸銷:板背面(−0.025)往後到 F 的背面以後
    { kind: "cylinder", radius: 0.05, length: 0.21, at: [0, B_AT, -0.105] },
  ],
  ...extra,
});
// D 與它的套筒、套筒後端的齒輪 U(套筒從 D 的背面往後穿過 A 的孔與套筒)
const wheelD = (id) => ({
  id,
  kind: "group",
  center: O,
  label: "D",
  labelOffset: [0.15, -0.3, 0.3],
  spin: r(TEETH.D) + 0.12,
  pieces: [
    { kind: "gear", teeth: TEETH.D, radius: r(TEETH.D), width: 0.12, bore: SHAFT_R },
    { kind: "cylinder", radius: D_SLEEVE, inner: SHAFT_R, length: 0.63, at: [0, 0, -0.375] }, // 局部 −0.69..−0.06
    { kind: "gear", teeth: U.teeth, radius: U.radius, width: 0.1, bore: D_SLEEVE, at: [0, 0, Z_U - 0.02], angle: U_PHASE },
  ],
});

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
        { kind: "cylinder", radius: 0.13, inner: SHAFT_R, length: 0.1, at: [O[0], O[1], -0.98] },
      ],
    },
    // A 固定時把它的套筒鎖在底板上的夾塊(推斷;在 A 與 T 之間)
    { id: "clamp", kind: "box", size: [0.1, O[1] - A_SLEEVE - FLOOR, 0.09], center: [O[0], (O[1] - A_SLEEVE + FLOOR) / 2, -0.3] },
    // 副軸的支柱與軸承(推斷):支柱頂接到軸承環的底
    { id: "counterStand", kind: "group", pieces: [{ kind: "box", size: [0.12, Q[1] - 0.11 - FLOOR, 0.12], at: [Q[0], (Q[1] - 0.11 + FLOOR) / 2, -1.1] }, { kind: "cylinder", radius: 0.11, inner: 0.05, length: 0.1, at: [Q[0], Q[1], -1.1] }] },
    // 副軸與後端的手柄(主動件,推斷)
    {
      id: "counter",
      kind: "group",
      center: Q,
      spin: 0.95,
      spinOffset: -1.33,
      pieces: [
        { kind: "cylinder", radius: 0.05, length: 1.05, at: [0, 0, -0.825] },
        // 手柄:曲柄臂在副軸的軸承後面、伸出副軸上的齒輪外(從前面看得到),把手朝後(朝前會掃到中心軸的後端與副軸的支柱)
        { kind: "box", size: [0.98, 0.1, 0.06], at: [0.465, 0, -1.33] },
        { kind: "cylinder", radius: 0.05, length: 0.3, at: [0.9, 0, -1.51] },
      ],
    },
    { id: "gearK1", kind: "gear", center: K1.center, teeth: K1.teeth, radius: K1.radius, width: 0.1, bore: 0.05, arrow: false },
    { id: "gearK2", kind: "gear", center: K2.center, teeth: K2.teeth, radius: K2.radius, width: 0.1, bore: 0.05, arrow: false },
    { id: "gearK3", kind: "gear", center: K3.center, teeth: K3.teeth, radius: K3.radius, width: 0.1, bore: 0.05, arrow: false },
    // A 與它的套筒、套筒後端的齒輪 T
    {
      id: "wheelA",
      kind: "group",
      center: O,
      label: "A",
      labelOffset: [0.75, -0.45, 0.2],
      spin: r(TEETH.A) + 0.15,
      pieces: [
        { kind: "gear", teeth: TEETH.A, radius: r(TEETH.A), width: 0.12, bore: D_SLEEVE },
        { kind: "cylinder", radius: A_SLEEVE, inner: D_SLEEVE, length: 0.3, at: [0, 0, -0.21] },
        { kind: "gear", teeth: T.teeth, radius: T.radius, width: 0.1, bore: A_SLEEVE, at: [0, 0, Z_T + 0.15], angle: T_PHASE },
      ],
    },
    wheelD("wheelD"),
    wheelD("wheelDIn"),
    // 末輪是 B 時 D 連同套筒拿下,A 的套筒與中心軸之間換一個襯套(推斷;不轉,夾在轉動的軸與套筒之間)
    { id: "bushA", kind: "cylinder", radius: D_SLEEVE, inner: SHAFT_R, length: 0.42, center: [O[0], O[1], -0.3] },
    // F 與 E 固定在同一根軸上:同一個零件,中間一段轂,整組轉在框架的軸銷上
    {
      id: "wheelFE",
      kind: "group",
      label: "E",
      labelOffset: [0.75, -0.1, 0.3],
      spin: r(TEETH.E) + 0.12,
      pieces: [
        { kind: "gear", teeth: TEETH.F, radius: r(TEETH.F), width: 0.12, bore: 0.05, axle: false, at: [0, 0, -0.17] },
        { kind: "cylinder", radius: 0.11, inner: 0.05, length: 0.07, at: [0, 0, -0.085] },
        { kind: "gear", teeth: TEETH.E, radius: r(TEETH.E), width: 0.12, bore: 0.05, axle: false },
      ],
    },
    { id: "labelF", kind: "group", pieces: [], label: "F", labelOffset: [-0.35, 0.15, 0.3] },
    { id: "wheelB", kind: "gear", teeth: TEETH.B, radius: r(TEETH.B), width: 0.12, bore: 0.05, label: "B", labelOffset: [0.3, 0.2, 0.3] },
    frame("frameC"),
    frame("frameOut"),
  ],
  states: {
    initial: "bFixedA",
    options: [
      { id: "bFixedA", label: "A 固定,轉框架,B 在臂端" },
      { id: "bTurningA", label: "A 也轉,B 在臂端" },
      { id: "dFixedA", label: "A 固定,轉框架,末輪 D 與框架同心" },
      { id: "dTurningA", label: "給臂與 A,D 得到合成轉動" },
      { id: "adToArm", label: "給兩端 A、D,臂得到合成轉動" },
    ],
  },
  driver: { part: "counter", type: "rotation", speed: -0.4 },
  targets: ["wheelB", "wheelD", "frameOut"],
  view: { direction: [0.3, 0.12, 1] },
  pose(k, state = "bFixedA") {
    const s = STATES[state];
    const t = train(k, state);
    const arm = t.arm;
    const isB = s.last === "B";
    const P = at(arm, P_AT);
    const Bc = at(arm, B_AT);
    const e = meshOnArm(A, F0, t.A, arm); // F 與 E 同一個零件
    // D:末輪時由 E 咬著轉;兩端輸入時由 K3 帶動(輪系的關係在 train 裡已經滿足)
    const d = s.last === "D" ? meshOnArm(E0, D, e, arm) : s.last === "arm" ? t.last : 0;
    const placeFrame = { position: [O[0], O[1], 0.15], angle: arm };
    return {
      parts: {
        frameC: { ...placeFrame, visible: s.last !== "arm" },
        frameOut: { ...placeFrame, visible: s.last === "arm" },
        counter: { angle: k },
        gearK1: { angle: k, visible: s.k1 },
        gearK2: { angle: k, visible: s.k2 },
        gearK3: { angle: k, visible: s.k3 },
        wheelA: { position: [O[0], O[1], -0.15], angle: t.A },
        clamp: { visible: !s.k2 },
        bushA: { visible: isB },
        wheelFE: { position: [P[0], P[1], 0.02], angle: e },
        labelF: { position: [P[0], P[1], -0.15] },
        wheelB: { position: [Bc[0], Bc[1], 0.02], angle: meshOnArm(E0, B0, e, arm), visible: isB },
        wheelD: { position: [O[0], O[1], 0.02], angle: d, visible: s.last === "D" },
        wheelDIn: { position: [O[0], O[1], 0.02], angle: d, visible: s.last === "arm" },
      },
      readouts:
        s.last === "arm"
          ? [{ label: "臂(框架)的轉速 / 手柄", value: train(1, state).arm.toFixed(3) }]
          : [{ label: `${s.last} 的轉速 / 框架`, value: (train(1, state).last / train(1, state).arm).toFixed(3) }],
    };
  },
};
