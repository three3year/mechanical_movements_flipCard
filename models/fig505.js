// 第 505 種:另一種簡單的周轉輪系。臂 D 帶著小齒輪 B,B 同時咬正齒輪 A 與環形齒輪(內齒輪)C,A、C 都與臂的軸同心。
// A、C 任一個可以固定不動,臂與小齒輪的公轉就使另一個輪轉動。
// 主動件是臂 D;狀態按鈕選擇固定 C 或固定 A。
// 推斷:齒數 A 16、B 10、C 36(依原圖比例,且 A + 2B = C)。
// 軸與機架(推斷;原圖只畫出輪與臂):臂固定在中心軸上,中心軸往後穿過 A 的套筒,轉在支座頂的軸承裡;A 的套筒套在中心軸上,
// C 的背面有三根輪輻接到輪轂,輪轂套在 A 的套筒上。固定哪個輪就用夾塊把它鎖在機架上(換接法是操作的人做的,所以用狀態按鈕):
// 固定 C 時,底板上的夾塊夾住 C 的輪緣;固定 A 時,支座頂的夾環鎖住 A 的套筒後端。
// 目標件只標被帶動的那個輪:繪圖層的目標件不隨狀態換,所以 A、C 各畫兩份(形狀相同),被帶動的那份塗目標件色,
// 固定的那份塗本色,每個狀態只顯示其中一份。
// 齒相位在「臂的座標系」裡算(臂轉 0 時 B 的位置,接觸點固定),再加上臂的轉角:若直接用公轉中的接觸點算
// gears.meshAngle,它對齊齒相位的整數取整會在某個臂角突然換一齒,輪會跳一兩個齒距。
import { polar } from "./kit.js";
import { meshAngle } from "./gears.js";
import { lastWheel, trainValue } from "./epicyclic.js";
import { shape, thickLine, circle, hubArms } from "./shapes.js";

const M = 0.1;
export const TEETH = { A: 16, B: 10, C: 36 };
const A = { center: [0, 0, 0], teeth: TEETH.A, radius: (TEETH.A * M) / 2 };
const C = { center: [0, 0, 0], teeth: TEETH.C, radius: (TEETH.C * M) / 2, internal: true };
const ORBIT = A.radius + (TEETH.B * M) / 2;
const B0 = { center: [ORBIT, 0, 0], teeth: TEETH.B, radius: (TEETH.B * M) / 2 }; // 臂轉 0 時的 B
const RIM = C.radius + 0.25;
/** 在臂上看:a 相對臂轉 angleA 時,與它咬合的 b 相對臂的轉角(a、b 用臂轉 0 時的位置) */
const meshOnArm = (a, b, angleA, arm) => arm + meshAngle(a, b, angleA - arm);
/** A → C 的輪系值(以臂為參考):A 外嚙合 B,B 內嚙合 C */
export const E_AC = trainValue([[TEETH.A, TEETH.B, -1], [TEETH.B, TEETH.C, 1]]);

/** 臂轉 arm、固定哪個輪 → A、C 的轉角(Willis 公式) */
export function wheels(arm, fixed = "C") {
  if (fixed === "C") return { A: arm + (0 - arm) / E_AC, C: 0 }; // C 固定:由 C − arm = e(A − arm) 解出 A
  return { A: 0, C: lastWheel(0, arm, E_AC) };
}

// 深度(z):臂 0.17..0.23 在最前面;A、B、C 的齒 −0.125..0.125;C 的輪輻 −0.205..−0.125;
// 中心軸 r 0.06 → A 的套筒(孔 0.06、外徑 0.11)到 −1.08 → C 的輪轂(孔 0.11、外徑 0.18)到 −0.6;支座的軸承在 −1.15
const SHAFT_R = 0.06;
const A_SLEEVE = 0.11;
const C_HUB = 0.18;
const BEARING_Z = -1.15;
const SLEEVE_END = -(BEARING_Z + 0.07); // A 的套筒後端頂著軸承的前面(z −1.08)
const FLOOR = -RIM - 0.45;
const wheelA = (id, extra) => ({
  id,
  kind: "group",
  label: "A",
  labelOffset: [-0.25, -0.45, 0.3],
  spin: A.radius + 0.18,
  pieces: [
    { kind: "gear", teeth: A.teeth, radius: A.radius, width: 0.25, bore: SHAFT_R, hub: false },
    { kind: "cylinder", radius: A_SLEEVE, inner: SHAFT_R, length: SLEEVE_END - 0.1, at: [0, 0, -(SLEEVE_END + 0.1) / 2] }, // −1.08..−0.1
  ],
  ...extra,
});
const wheelC = (id, extra) => ({
  id,
  kind: "group",
  label: "C",
  labelOffset: [-1.3, -1.6, 0.3],
  spin: RIM + 0.05,
  pieces: [
    { kind: "gear", internal: true, teeth: C.teeth, radius: C.radius, rim: RIM, width: 0.25 },
    // 背面的輪輻:輪轂伸出三根臂,臂端接到齒圈的背面
    { kind: "plate", shape: shape(hubArms(C_HUB + 0.04, 0.22, [0, 1, 2].map((i) => ({ angle: Math.PI / 2 + (i * 2 * Math.PI) / 3, length: RIM - 0.05 }))), [circle(A_SLEEVE).reverse()]), thickness: 0.08, at: [0, 0, -0.165] },
    { kind: "cylinder", radius: C_HUB, inner: A_SLEEVE, length: 0.4, at: [0, 0, -0.4] },
  ],
  ...extra,
});

export default {
  figure: 505,
  parts: [
    // 機架(推斷):底板、立柱與中心軸的軸承
    {
      id: "stand",
      kind: "group",
      pieces: [
        { kind: "box", size: [3.0, 0.15, 1.3], at: [0, FLOOR - 0.075, -0.65] },
        { kind: "box", size: [0.16, -0.13 - FLOOR, 0.14], at: [0, (-0.13 + FLOOR) / 2, BEARING_Z] },
        { kind: "cylinder", radius: 0.14, inner: SHAFT_R, length: 0.14, at: [0, 0, BEARING_Z] },
      ],
    },
    // 固定 C 時夾住輪緣的夾塊(推斷):從底板立起,頂著 C 的輪緣最低處
    { id: "clampC", kind: "box", size: [0.3, -RIM - FLOOR, 0.2], center: [0, (-RIM + FLOOR) / 2, 0] },
    // 固定 A 時鎖住 A 套筒後端的夾環(推斷):套在套筒上,背面頂著軸承
    { id: "clampA", kind: "cylinder", radius: 0.2, inner: A_SLEEVE, length: 0.12, center: [0, 0, -SLEEVE_END + 0.06] },
    wheelA("wheelA"),
    wheelA("wheelAFixed"),
    wheelC("wheelC"),
    wheelC("wheelCFixed"),
    { id: "pinionB", kind: "gear", center: [ORBIT, 0, 0], teeth: TEETH.B, radius: (TEETH.B * M) / 2, width: 0.25, bore: 0.06, hub: false, label: "B", labelOffset: [0, 0.25, 0.3] },
    // 臂 D:固定在中心軸上(軸往後到支座的軸承),B 的軸銷立在臂上(到 C 的輪輻前面為止)
    {
      id: "armD",
      kind: "plate",
      shape: shape(thickLine([[-0.25, 0], [C.radius + 0.6, 0]], 0.14)),
      thickness: 0.06,
      label: "D",
      labelOffset: [C.radius + 0.55, 0.25, 0.3],
      spin: 0.6,
      mark: [C.radius + 0.4, 0],
      pieces: [
        { kind: "cylinder", radius: SHAFT_R, length: 0.2 - (BEARING_Z - 0.07), role: "shaft", at: [0, 0, (BEARING_Z - 0.07 - 0.2) / 2] }, // 世界 z −1.22..0.2
        { kind: "cylinder", radius: 0.06, length: 0.32, at: [ORBIT, 0, -0.16] }, // 世界 z −0.12..0.2
      ],
    },
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
    const a = state === "C" ? meshOnArm(B0, A, b, arm) : 0;
    const c = state === "A" ? meshOnArm(B0, C, b, arm) : 0;
    return {
      parts: {
        armD: { position: [0, 0, 0.2], angle: arm },
        pinionB: { position: polar(ORBIT, arm), angle: b },
        wheelA: { angle: a, visible: state === "C" },
        wheelAFixed: { angle: a, visible: state === "A" },
        wheelC: { angle: c, visible: state === "A" },
        wheelCFixed: { angle: c, visible: state === "C" },
        clampC: { visible: state === "C" },
        clampA: { visible: state === "A" },
      },
      readouts: [{ label: state === "C" ? "A 的轉速 / 臂" : "C 的轉速 / 臂", value: (state === "C" ? 1 - 1 / E_AC : 1 - E_AC).toFixed(3) }],
    };
  },
};
