// 第 271 種:裝有兩根棘爪的槓桿振動時,給棘齒桿近乎連續的直線運動。槓桿在右端繞樞軸擺動,
// 兩根棘爪分別接在樞軸上方與下方,往左伸到棘齒桿的齒上:槓桿往一邊擺時上方那根把桿往右拉,
// 擺回來時換下方那根拉,所以桿一直往右走。左端的滾輪托著棘齒桿,被它帶著轉。
// 主動件是槓桿(累計行程,見 kit.swing)。
// 推斷:左端的圓輪當作托住棘齒桿的滾輪;棘爪靠自重落在齒上;桿很長,畫面只看到中段
// (每走過整數個齒的一大段就接回起點;桿畫得夠長、起點夠靠左,接回前後兩端都在畫面外,看不出跳動——
// 掃描工具仍會把接回那一格列為「移 8.8」,那不是零件在動)。
import { deg, swing } from "./kit.js";
import { doubleAction } from "./ratchets.js";
import { shape, thickLine, circle } from "./shapes.js";

const P = [2.55, 0.45, 0]; // 槓桿樞軸
const UP = 0.75; // 上方棘爪接點到樞軸
const DOWN = 0.35; // 下方棘爪接點到樞軸
const S = deg(16); // 擺幅(單邊)
const BAR_Y = -0.15; // 棘齒桿齒面高度
const PITCH = 0.22;
const WRAP = 40 * PITCH; // 走過這麼長就接回起點
// 桿的齒數、左端(局部)與位置範圍(offset 到 offset + WRAP):桿長 22,畫面(x 約 −3.2 到 3.3)永遠在桿的中段;
// offset 取整數個齒距,齒相對棘爪的相位與原來(−1.0)相同
const BAR = { teeth: 100, left: -10, offset: -1.0 - 18 * PITCH };
const ROLL = 0.32;
const PAWL = { up: 3.3, down: 1.9 }; // 兩根棘爪的長度

const attach = (which, psi) => (which === "up" ? [P[0] - UP * Math.sin(psi), P[1] + UP * Math.cos(psi), 0] : [P[0] + DOWN * Math.sin(psi), P[1] - DOWN * Math.cos(psi), 0]);

/** 主動量 v(槓桿的累計擺動)→ 槓桿角、棘齒桿的累計位移(往右為正) */
export function motion(v) {
  const x = doubleAction(v, S, -S, (psi) => attach("up", psi)[0], (psi) => attach("down", psi)[0]);
  return { x };
}
export const lever = (v) => swing(v, S, -S);
export const SWING = S;

const teeth = [];
for (let i = 0; i < BAR.teeth; i++) {
  const x0 = BAR.left + i * PITCH;
  teeth.push([x0, BAR_Y - 0.08], [x0 + PITCH * 0.85, BAR_Y + 0.1], [x0 + PITCH * 0.85, BAR_Y - 0.08]);
}
const bar = shape([[BAR.left, BAR_Y - 0.4], [BAR.left + BAR.teeth * PITCH, BAR_Y - 0.4], ...teeth.reverse()].reverse());

const pawl = (len) => shape(thickLine([[0, 0], [-len + 0.12, 0], [-len, -0.1]], 0.09), [circle(0.035).reverse()]);

export default {
  figure: 271,
  parts: [
    {
      id: "base",
      kind: "group",
      pieces: [
        { kind: "box", size: [6.0, 0.12, 0.8], at: [0.3, -1.25, 0] },
        { kind: "box", size: [0.9, 0.7, 0.6], at: [-1.3, -0.85, 0] },
        { kind: "box", size: [0.9, 0.7, 0.6], at: [1.3, -0.85, 0] },
        { kind: "box", size: [0.3, 1.9, 0.3], at: [P[0] + 0.1, -0.3, -0.2] },
      ],
    },
    { id: "bar", kind: "plate", shape: bar, thickness: 0.4, arrow: false },
    { id: "roller", kind: "pulley", style: "disc", center: [-2.9, BAR_Y - 0.4 - ROLL, 0], radius: ROLL, width: 0.3, pieces: [{ kind: "cylinder", radius: 0.06, length: 0.6 }] },
    {
      id: "lever",
      kind: "group",
      center: P,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0, -DOWN - 0.1], [0, UP + 0.1], [0.75, UP + 0.55]], 0.16), [circle(0.06).reverse()]), thickness: 0.12, at: [0, 0, 0.3] },
        { kind: "cylinder", radius: 0.1, length: 0.7 },
      ],
    },
    { id: "pawlUp", kind: "plate", shape: pawl(PAWL.up), thickness: 0.08, arrow: false },
    { id: "pawlDown", kind: "plate", shape: pawl(PAWL.down), thickness: 0.08, arrow: false },
  ],
  driver: { part: "lever", type: "rotation", cycle: [S, -S] },

  target: "bar",
  view: { direction: [0.05, 0.12, 1], fit: ["base", "lever", "roller"] },
  pose(v) {
    const psi = lever(v);
    const { x } = motion(v);
    const shown = ((x % WRAP) + WRAP) % WRAP;
    const pose = (which, len) => {
      const a = attach(which, psi);
      const dy = BAR_Y + 0.05 - a[1];
      const ang = Math.asin(Math.max(-1, Math.min(1, -dy / len)));
      return { position: [a[0], a[1], which === "up" ? 0.42 : 0.3], angle: ang };
    };
    return {
      parts: {
        lever: { angle: psi },
        bar: { position: [shown + BAR.offset, 0, 0] },
        roller: { angle: -x / ROLL },
        pawlUp: pose("up", PAWL.up),
        pawlDown: pose("down", PAWL.down),
      },
      readouts: [],
    };
  },
};
