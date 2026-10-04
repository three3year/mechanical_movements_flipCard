// 第 408 種:中心引導器(Centrolinead),在透視圖裡朝一個到不了(在圖紙外)的點畫直線。長葉片的上緣(畫線邊)與兩條腿的背面
// 在接頭處相交,兩腿與葉片的夾角在接頭處調好後鎖住(兩腿的角度可以不相等)。圖上插兩根銷,把儀器的兩腿靠著兩根銷推動,
// 葉片的畫線邊始終指向那個會聚點(銷、接頭與會聚點在同一個圓上,同弧所對的圓周角相等)。
// 主動件是儀器(靠著兩根銷滑動);沿葉片上緣畫的線由 pose 回傳。
// 推斷:會聚點放在圖紙左方的外面;圖紙上預先畫好的幾條會聚線是用同一儀器畫出來的例子。
import { clamp, deg } from "./kit.js";
import { shape, rect, circle, ring } from "./shapes.js";

export const V = [-9, 0, 0]; // 會聚點(在圖紙外)
const CENTER = [V[0] / 2, 0, 0]; // 通過接頭、兩銷與會聚點的圓
const R = -V[0] / 2;
const LEG_AT = deg(70); // 腿與「接頭 → 會聚點」方向的夾角
const LEGS = [deg(180) - LEG_AT, deg(180) + LEG_AT]; // 兩腿相對於葉片的方向
const PIN_R = 0.08;
export const PINS = LEGS.map((a) => [2 * R * Math.cos(LEG_AT) * Math.cos(a), 2 * R * Math.cos(LEG_AT) * Math.sin(a), 0]);
export const RANGE = [deg(-20), deg(20)]; // 接頭在圓上的位置(從圓心量起)

/** 接頭在圓上的位置 psi → 接頭的位置與葉片的方向 */
export function joint(psi0) {
  const psi = clamp(psi0, ...RANGE);
  const J = [CENTER[0] + R * Math.cos(psi), CENTER[1] + R * Math.sin(psi), 0];
  return { J, angle: Math.atan2(J[1] - V[1], J[0] - V[0]) };
}

const LINES = [-16, -8, 8, 16].map((d) => joint(deg(d)));
const BLADE = 6.2;

export default {
  figure: 408,
  parts: [
    { id: "paper", kind: "box", center: [1.4, 0, -0.12], size: [8.6, 6.4, 0.04] },
    {
      id: "pins",
      kind: "group",
      pieces: PINS.map((p) => ({ kind: "cylinder", radius: PIN_R, length: 0.5, at: [p[0], p[1], 0.15] })),
    },
    // 先前用同一儀器畫好的會聚線(延長都會到會聚點)
    ...LINES.map((_, k) => ({ id: `line${k + 1}`, kind: "trace" })),
    // 葉片:上緣(局部 y = 0)是畫線邊,通過接頭
    { id: "blade", kind: "plate", shape: shape(rect(BLADE, 0.3, BLADE / 2 + 0.3, -0.15)), thickness: 0.1, arrow: false },
    // 兩條腿:背面(局部 y = 0)通過接頭,靠著銷
    { id: "legA", kind: "plate", shape: shape(rect(3.9, 0.26, 2.05, -0.13)), thickness: 0.06, arrow: false },
    { id: "legB", kind: "plate", shape: shape(rect(3.9, 0.26, 2.05, 0.13)), thickness: 0.06, arrow: false },
    {
      id: "joint",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: ring(0.55, 0.3), thickness: 0.05, at: [0, 0, 0.1] },
        { kind: "cylinder", radius: 0.08, length: 0.14, at: [0, 0, 0.14], accent: true },
        { kind: "cylinder", radius: 0.07, length: 0.12, at: [0.42 * Math.cos(LEGS[0]), 0.42 * Math.sin(LEGS[0]), 0.16] },
        { kind: "cylinder", radius: 0.07, length: 0.12, at: [0.42 * Math.cos(LEGS[1]), 0.42 * Math.sin(LEGS[1]), 0.16] },
        { kind: "cylinder", radius: 0.07, length: 0.12, at: [0.75, -0.15, 0.13] },
      ],
    },
    { id: "pencilLine", kind: "trace" },
  ],
  // 讀者推的是靠著兩根銷的兩條腿(與接頭);葉片是結果——它的畫線邊始終指向會聚點
  driver: { part: "legA", grips: ["legB", "joint"], type: "rotation", range: RANGE, initial: 0 },
  target: "blade", // 畫線邊始終指向會聚點的葉片
  view: { direction: [0.03, 0.05, 1] },
  pose(psi0) {
    const { J, angle } = joint(psi0);
    const at = (z) => [J[0], J[1], z];
    const along = (d) => [J[0] + d * Math.cos(angle), J[1] + d * Math.sin(angle), 0.01];
    return {
      parts: {
        blade: { position: at(0.02), angle },
        legA: { position: at(0.06), angle: angle + LEGS[0] },
        legB: { position: at(0.06), angle: angle + LEGS[1] },
        joint: { position: at(0), angle },
      },
      paths: {
        pencilLine: { points: [along(0.6), along(BLADE + 0.3)], closed: false },
        ...Object.fromEntries(LINES.map((l, k) => [`line${k + 1}`, { points: [0.6, BLADE + 0.3].map((d) => [l.J[0] + d * Math.cos(l.angle), l.J[1] + d * Math.sin(l.angle), -0.09]), closed: false }])),
      },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["pins", "legA"], reason: "接合處的簡化畫法:腳以長孔套在銷上滑動,長孔沒有畫出來,重疊 0.08" },
    { check: "interference", parts: ["pins", "legB"], reason: "接合處的簡化畫法:腳以長孔套在銷上滑動,長孔沒有畫出來,重疊 0.08" },
  ],
};

export { LEGS };
