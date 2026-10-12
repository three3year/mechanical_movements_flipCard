// 第 274 種:引擎調速器。心軸 C–D 頂端固定著兩支拋物線曲面臂 B;球 K 的架上裝著抗摩擦輪 L,輪 L 沿臂 B 下段的
// 拋物線曲面滾動,所以球的升降由拋物線引導。桿 F 把輪 L 與心軸上的套筒相連:球升起時套筒沿心軸往上。
// 主動件是虛擬的「轉速」(平衡型):轉得越快,球被甩得越開,沿拋物線升得越高。
// 接觸:輪 L 壓在臂 B 下段拋物線的上面(凹的一側)滾動:輪心在拋物線的法線上、離曲面一個輪半徑,所以輪始終貼著臂。
// 臂與輪在後面一層,球、球架與桿 F 在前面一層(球在臂的外側,不同層才不會和臂相碰)。
// 兩支臂的下段照原圖在輪 L 下方穿過心軸、接成一條弧,心軸上的方塊 a 壓在這條弧上,把臂的下端也固定在心軸上
// (方塊從心軸往後伸到臂那一層)。
// 套筒高度對 (轉速 / 上限)² 線性變化(反推輪 L 在拋物線上的位置),滑桿整段都看得出套筒升降(做法同第 161、170 種)。
// 推斷:輪 L 沿拋物線的位置與轉速的對應(原文只說由拋物線引導);各部尺寸依原圖;心軸下端的止推軸承、
// 中段的軸承架與底座(原圖只畫心軸);套筒上接桿 F 的耳。
// 推斷(原圖只畫調速器本身,補上是為了看得出動力從哪裡來、套筒在調什麼):心軸下端的一對傘齒輪與水平的驅動軸
// (引擎經它帶動心軸,做法同第 147、170 種);套筒下端的環槽、叉形槓桿、閥桿與蒸汽管上的節流閥(throttle.js,
// 做法照第 161 種):轉得太快時套筒升高,把閥桿往上拉、關小節流閥。
// 與第 161 種相同,心軸在模型裡不轉(主動件是轉速本身;pending.md 第 6 族記為待確認),傘齒輪也就停著。
import { X, Y, deg, clamp } from "./kit.js";
import { shape, thickLine } from "./shapes.js";
import { pedestalX } from "./supports.js";
import { throttle } from "./throttle.js";

const VERTEX = -0.25; // 拋物線頂點高度(在心軸上)
const K = 0.95; // 臂 B 下段的曲面 y = VERTEX + K·x²
const X_RANGE = [0.32, 0.95]; // 輪 L 與曲面的接觸點離心軸的距離(低速 → 高速)
const WHEEL_R = 0.14;
const ROD_F = 1.45; // 桿 F 長:套筒升到頂時仍在方塊 a 下面
const EAR = 0.3; // 套筒上的耳(桿 F 的下端)離心軸
const BALL = { r: 0.42, out: [0.42, -0.42] }; // 球心相對輪 L
const BACK = -0.25; // 臂與輪所在的那一層
const FRONT = 0.02; // 球架、桿 F 所在的那一層
const HUB_A = { size: [0.2, 0.22, 0.4], at: [0, VERTEX - 0.06, -0.11] }; // 方塊 a:包住弧,從臂那一層伸到心軸前面
const FLOOR = -3.55;
const APEX = -2.85; // 心軸下端傘齒輪對的錐頂
const BRACKET_Y = -2.0; // 心軸中段的軸承架
export const RANGE = [0, 10];

export const parabola = (x) => VERTEX + K * x * x;
const normal = (x) => {
  const n = Math.hypot(2 * K * x, 1);
  return [(-2 * K * x) / n, 1 / n];
};

// 接觸點在 contact 時:輪 L 的中心(右側)與套筒高度
function at(contact) {
  const [nx, ny] = normal(contact);
  const x = contact + WHEEL_R * nx;
  const y = parabola(contact) + WHEEL_R * ny;
  return { contact, x, y, sleeve: y - Math.sqrt(ROD_F * ROD_F - (x - EAR) ** 2) };
}
const SLEEVE = [at(X_RANGE[0]).sleeve, at(X_RANGE[1]).sleeve];

/** 轉速 s → 接觸點的 x、輪 L 的中心(右側)、套筒高度(對 (s/上限)² 線性)、輪 L 滾過的角度 */
export function governor(s) {
  const f = clamp(s / RANGE[1], 0, 1) ** 2;
  const target = SLEEVE[0] + (SLEEVE[1] - SLEEVE[0]) * f;
  let [lo, hi] = X_RANGE;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (at(mid).sleeve < target) lo = mid;
    else hi = mid;
  }
  const g = at((lo + hi) / 2);
  return { ...g, roll: -arc(X_RANGE[0], g.contact) / WHEEL_R };
}
// 曲面上兩點間的弧長(輪 L 滾過的距離)
function arc(a, b) {
  let len = 0;
  for (let i = 0; i < 40; i++) {
    const x0 = a + ((b - a) * i) / 40;
    const x1 = a + ((b - a) * (i + 1)) / 40;
    len += Math.hypot(x1 - x0, parabola(x1) - parabola(x0));
  }
  return len;
}
export const geometry = { WHEEL_R };

// 節流閥(推斷):樞軸在左邊的立柱上,叉臂跨在套筒下端的環槽兩側
const VALVE = throttle({
  pivot: [-1.9, (SLEEVE[0] + SLEEVE[1]) / 2 - 0.2],
  groove: { top: -0.15, height: 0.1, neck: 0.1, outer: 0.18 },
  range: SLEEVE,
  floor: FLOOR,
});
/** 轉速 s:節流閥的開度(1 全開、0 全關) */
export const opening = (s) => VALVE.solve(governor(s).sleeve).opening;

// 拋物線段:曲面往內偏半個板厚,板的上緣就是曲面
const paraLine = (from, to, n) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const x = from + (i / n) * (to - from);
    const [nx, ny] = normal(x);
    return [x - 0.055 * nx, parabola(x) - 0.055 * ny];
  });
// 臂 B:從頂端 C 往外、往下彎,再往內收,下段就是拋物線(輪 L 壓在它的上面)
const armB = (s) => {
  const para = paraLine(X_RANGE[0] - 0.12, X_RANGE[1] + 0.3, 12).map(([x, y]) => [s * x, y]);
  return shape(thickLine([[s * 0.15, 2.45], [s * 0.9, 2.3], [s * 1.6, 1.6], ...para.reverse()], 0.11));
};

export default {
  figure: 274,
  parts: [
    {
      id: "frame",
      kind: "group",
      label: "B",
      labelOffset: [-1.85, 1.75, 0.3],
      pieces: [
        { kind: "cylinder", axis: Y, radius: 0.07, length: 2.5 - FLOOR, at: [0, (2.5 + FLOOR) / 2, 0] },
        { kind: "plate", shape: armB(1), thickness: 0.1, at: [0, 0, BACK] },
        { kind: "plate", shape: armB(-1), thickness: 0.1, at: [0, 0, BACK] },
        { kind: "plate", shape: shape(thickLine(paraLine(-0.45, 0.45, 12), 0.11)), thickness: 0.1, at: [0, 0, BACK], role: "arc" }, // 兩支臂的下段在心軸處接成一條弧
        { kind: "box", ...HUB_A, role: "hubA" }, // 方塊 a
        { kind: "box", size: [0.5, 0.22, 0.36], at: [0, 2.45, -0.12] }, // 把兩支臂固定在心軸頂端的轂
        { kind: "cylinder", radius: 0.14, length: 0.3, at: [0.9, 2.3, BACK] },
        { kind: "cylinder", radius: 0.14, length: 0.3, at: [-0.9, 2.3, BACK] },
        { kind: "sphere", radius: 0.1, at: [0, 2.6, 0] },
        // 心軸下端 D 的止推軸承與底座、中段的軸承架(推斷)
        { kind: "cylinder", axis: Y, radius: 0.16, inner: 0.07, length: 0.3, at: [0, FLOOR + 0.15, 0] },
        { kind: "box", size: [4.8, 0.15, 1.6], at: [0, FLOOR - 0.075, -0.3] },
        { kind: "cylinder", axis: Y, radius: 0.16, inner: 0.07, length: 0.16, at: [0, BRACKET_Y, 0] },
        { kind: "box", size: [2.05, 0.12, 0.16], at: [1.2, BRACKET_Y, 0] },
        { kind: "box", size: [0.16, BRACKET_Y + 0.06 - FLOOR, 0.16], at: [2.15, (BRACKET_Y + 0.06 + FLOOR) / 2, 0] },
        // 心軸下段的傘齒輪(固定在心軸上)、驅動軸的軸承座(推斷)
        { kind: "gear", teeth: 20, radius: 0.55, cone: deg(45), width: 0.18, axis: [0, -1, 0], at: [0, APEX + 0.5, 0] },
        ...pedestalX({ x: 1.45, y: APEX, z: 0, bore: 0.07, floor: FLOOR }),
        ...VALVE.framePieces,
      ],
    },
    { id: "labelC", kind: "group", center: [0, 2.6, 0], label: "C", labelOffset: [0, 0.3, 0] },
    { id: "labelD", kind: "group", center: [0, -2.6, 0], label: "D", labelOffset: [0.3, -0.2, 0] },
    { id: "labelA", kind: "group", center: [0, HUB_A.at[1], 0.1], label: "a", labelOffset: [0, -0.05, 0.2] },
    // 引擎經這根水平軸與傘齒輪帶動心軸(推斷;零件的局部 +Z 是世界的 +X;錐頂朝 −X)
    {
      id: "driveShaft",
      kind: "group",
      axis: X,
      center: [0.5, APEX, 0],
      pieces: [
        { kind: "gear", teeth: 20, radius: 0.55, cone: deg(45), width: 0.18, axis: [0, 0, -1] },
        { kind: "cylinder", radius: 0.07, length: 1.3, at: [0, 0, 0.65] },
      ],
    },
    ...[-1, 1].flatMap((s) => [
      {
        id: s < 0 ? "wheelL" : "wheelR",
        kind: "group",
        spin: WHEEL_R,
        pieces: [
          { kind: "cylinder", radius: WHEEL_R - 0.005, length: 0.12 },
          { kind: "box", size: [0.08, 0.04, 0.13], at: [WHEEL_R * 0.55, 0, 0], accent: true }, // 轉動的記號
          { kind: "cylinder", radius: 0.04, length: FRONT - BACK + 0.06, at: [0, 0, (FRONT - BACK) / 2] }, // 輪軸:穿到前面一層接球架與桿 F
        ], label: s < 0 ? "L" : undefined, labelOffset: [-0.25, 0.25, 0.2] },
      { id: s < 0 ? "ballL" : "ballR", kind: "sphere", radius: BALL.r, label: s < 0 ? "K" : undefined, labelOffset: [-0.55, 0, 0.3] },
      { id: s < 0 ? "carrierL" : "carrierR", kind: "link", width: 0.08, thickness: 0.05 },
      { id: s < 0 ? "rodL" : "rodR", kind: "link", width: 0.07, thickness: 0.05, label: s < 0 ? "F" : undefined, labelOffset: [-0.2, -0.3, 0.2] },
    ]),
    {
      id: "sleeve",
      kind: "group",
      pieces: [
        { kind: "cylinder", axis: Y, radius: 0.18, inner: 0.07, length: 0.3 },
        ...[-1, 1].map((k) => ({ kind: "box", size: [0.2, 0.14, 0.08], at: [k * (EAR - 0.04), 0, FRONT - 0.07] })), // 桿 F 的耳
        ...VALVE.sleevePieces({ inner: 0.07 }),
      ],
    },
    ...VALVE.parts,
  ],
  powered: ["ballL", "ballR"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "轉速", mode: "balance", range: RANGE, initial: 6 },
  target: "valve", // 被調節的節流閥
  view: { direction: [0.04, 0.05, 1] },
  pose(s) {
    const { x, y, sleeve, roll } = governor(s);
    const parts = { sleeve: { position: [0, sleeve, 0] }, ...VALVE.pose(sleeve) };
    for (const k of [-1, 1]) {
      const side = k < 0 ? "L" : "R";
      const w = [k * x, y, FRONT];
      const ball = [k * (x + BALL.out[0]), y + BALL.out[1], FRONT + 0.3];
      parts[`wheel${side}`] = { position: [k * x, y, BACK], angle: k * roll }; // 往外滾:右輪順時針、左輪逆時針
      parts[`ball${side}`] = { position: ball };
      parts[`carrier${side}`] = { from: w, to: [ball[0], ball[1], FRONT] };
      parts[`rod${side}`] = { from: w, to: [k * EAR, sleeve, FRONT] };
    }
    return { parts, readouts: [{ label: "節流閥開度", value: `${Math.round(VALVE.solve(sleeve).opening * 100)}%` }] };
  },
};
