// 第 39 種:太陽與行星機構(瓦特用來代替曲柄)。行星齒輪剛性連在連桿(由橫樑帶動、幾乎直上直下)上,
// 連桿臂讓兩輪中心保持固定距離。行星齒輪繞太陽齒輪一圈,太陽齒輪(在飛輪軸上)轉兩圈。
// 主動件是連桿臂(行星繞行的角度);太陽齒輪的轉角由行星齒輪的位置與朝向依咬合關係算出。
import { TAU, deg, polar } from "./kit.js";
import { meshAngle } from "./gears.js";
import { stadium, ring } from "./shapes.js";

const N = 24;
const R = 1.15;
const D = 2 * R;
const SUN = { center: [0, 0, 0], teeth: N, radius: R };
const ROD = { length: 5.0, x: D }; // 連桿上端沿 x = D 的直線上下(由橫樑帶動,推斷)
const START = 0; // 原圖:行星在太陽的右方

function geometry(theta) {
  const p = polar(D, theta);
  const dx = ROD.x - p[0];
  const top = [ROD.x, p[1] + Math.sqrt(ROD.length ** 2 - dx * dx), 0];
  return { p, top, rod: Math.atan2(top[1] - p[1], top[0] - p[0]) };
}
// 起始位置的咬合相位;之後依周轉輪系的關係(以連臂為參考系)連續推算:
// 太陽 − 連臂 = −(N行星 ÷ N太陽)·(行星 − 連臂)
const G0 = geometry(START);
const SUN0 = meshAngle({ center: G0.p, teeth: N, radius: R }, SUN, G0.rod - Math.PI / 2);

/** 連臂轉 theta 時:行星中心、連桿上端、行星(連桿)的朝向、太陽齒輪轉角 */
export function sunAndPlanet(theta) {
  const { p, top, rod } = geometry(theta);
  const arm = theta - START;
  const planet = rod - G0.rod;
  const sun = SUN0 + arm - (planet - arm);
  return { planet: p, top, rod, sun };
}
const REST = SUN0;

export default {
  figure: 39,
  parts: [
    {
      id: "sun",
      kind: "gear",
      teeth: N,
      radius: R,
      width: 0.24,
      bore: 0.14,
      pieces: [
        { kind: "plate", shape: ring(1.78, 1.58), thickness: 0.22, at: [0, 0, -0.05] },
        ...[0, 1, 2, 3].map((k) => ({ kind: "box", size: [0.42, 0.08, 0.18], at: [...polar(1.37, (k * TAU) / 4 + deg(45)).slice(0, 2), -0.05], angle: (k * TAU) / 4 + deg(45) })),
      ],
    },
    { id: "planet", kind: "gear", teeth: N, radius: R, width: 0.24, bore: 0.14, arrow: false },
    { id: "arm", kind: "plate", center: [0, 0, 0.3], shape: stadium(D, 0.44, 0.13), thickness: 0.1, spin: D },
    { id: "rod", kind: "link", width: 0.48, thickness: 0.12, axis: [0, 0, 1] },
  ],
  driver: { part: "arm", type: "rotation", initial: START },
  target: "sun", // 飛輪軸上的太陽齒輪
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const { planet, top, rod, sun } = sunAndPlanet(theta);
    const turns = (theta - START) / TAU;
    return {
      parts: {
        arm: { angle: theta },
        planet: { position: planet, angle: rod - Math.PI / 2 },
        sun: { angle: sun },
        rod: { from: [planet[0], planet[1], 0.45], to: [top[0], top[1], 0.45] },
      },
      readouts: [
        { label: "行星繞行", value: turns.toFixed(2) + " 圈" },
        { label: "太陽齒輪", value: ((sun - REST) / TAU).toFixed(2) + " 圈" },
      ],
    };
  },
};
