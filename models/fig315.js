// 第 315 種:錐形擺。擺由一段細圓線從上方吊著,下端連著一個擺錘;下方直立旋轉的心軸頂上有一支搖臂,
// 推著擺錘作圓周運動,擺線在旋轉時描出一個圓錐面。主動件是虛擬的「進程」:心軸已轉了幾圈。
// 推斷:擺的錐角;心軸由下方的齒輪帶動(原圖只畫出齒輪)。
import { Y, TAU, deg } from "./kit.js";

const TOP = [0, 3.0, 0];
const L = 4.4; // 懸線長
export const CONE = deg(17); // 擺線與鉛直線的夾角
const SPINDLE = [0, -1.95, 0];

/** 進程 p(心軸轉的圈數)→ 心軸角、擺錘位置 */
export function conical(p) {
  const a = TAU * p;
  const r = L * Math.sin(CONE);
  return { spindle: a, bob: [r * Math.cos(a), TOP[1] - L * Math.cos(CONE), -r * Math.sin(a)] };
}
export const geometry = { TOP, L };

export default {
  figure: 315,
  parts: [
    { id: "support", kind: "group", center: TOP, pieces: [{ kind: "box", size: [1.0, 0.18, 0.4], at: [0, 0.2, 0] }, { kind: "box", size: [0.2, 0.25, 0.2], at: [0, 0, 0] }] },
    { id: "thread", kind: "rod", radius: 0.02 },
    { id: "bob", kind: "cylinder", axis: Y, radius: 0.3, length: 0.75 },
    {
      id: "spindle",
      kind: "group",
      axis: Y,
      center: SPINDLE,
      spin: 0.7,
      spinOffset: -0.3,
      pieces: [
        { kind: "cylinder", radius: 0.07, length: 1.3, at: [0, 0, 0.1] },
        { kind: "box", size: [0.2, 0.2, 0.2], at: [0, 0, 0.75] },
        // 推擺錘的搖臂
        { kind: "box", size: [L * Math.sin(CONE) + 0.1, 0.06, 0.06], at: [(L * Math.sin(CONE)) / 2, 0, 0.75] },
        { kind: "cylinder", radius: 0.7, length: 0.12, at: [0, 0, -0.3] },
        { kind: "gear", teeth: 14, radius: 0.32, width: 0.3, at: [0, 0, -0.62] },
        { kind: "box", size: [0.35, 0.3, 0.35], at: [0, 0, -1.0] },
      ],
    },
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.25 },
  view: { direction: [0.05, 0.15, 1] },
  pose(p) {
    const { spindle, bob } = conical(p);
    // 擺錘沿懸線方向傾斜:用懸線方向當圓柱的軸
    return {
      parts: { spindle: { angle: spindle }, bob: { position: bob } },
      paths: { thread: { points: [TOP, bob], closed: false } },
      readouts: [],
    };
  },
};
