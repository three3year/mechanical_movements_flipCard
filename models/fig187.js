// 第 187 種(條目 187–188 的第一張圖):第 186 種的變形。偏心桿末端的鉤口搭在搖臂(上方軸往下的臂)的銷上;
// 桿端上以銷裝著一支直的手柄,手柄往右伸到桿尾的上方(兩者並排,像一把鉗子)。
// 推斷:原文只說是第 186 種的變形。這裡取與第 186 種相同的作法——把手柄往上扳,手柄左端的趾頭往下頂在
// 搖臂的凸耳上,桿端因此被抬起,銷從鉤口中脫出。主動件是手柄。
import { deg } from "./kit.js";
import { gab, rodAngle, onRod, leverLift, ECC } from "./gab.js";
import { shape, circle, thickLine } from "./shapes.js";

const G = gab();
const PIVOT = [0.1, 0.52]; // 手柄在桿上的樞軸(以銷為原點)
const TOE = [-0.65, 0.0]; // 手柄左端的趾頭(相對樞軸)
const MAX = deg(55);
const SHAFT = [0, 1.57, 0];

/** 手柄往上扳 phi(逆時針):桿端抬起的量 */
export function unhook(phi) {
  const lift = leverLift(TOE, phi);
  return { lift, released: G.released(lift) };
}
export const max = MAX;

const HANDLE = shape(
  [[-0.68, -0.12], [0.55, -0.12], [0.9, -0.2], [1.25, -0.1], [2.25, -0.1], [2.38, 0.02], [2.25, 0.15], [1.25, 0.15], [0.9, 0.22], [0.55, 0.28], [-0.55, 0.28], [-0.68, 0.15]],
  [circle(0.07).reverse()],
);

export default {
  figure: 187,
  parts: [
    {
      id: "rocker",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape([[-0.25, SHAFT[1]], [-0.22, 0.0], [0.22, 0.0], [0.25, SHAFT[1]]]), thickness: 0.2, at: [0, 0, -0.35] },
        { kind: "cylinder", radius: 0.45, inner: 0.3, length: 0.3, at: [SHAFT[0], SHAFT[1], -0.35] },
        { kind: "cylinder", radius: 0.3, length: 0.5, at: [SHAFT[0], SHAFT[1], -0.35], accent: true },
        { kind: "cylinder", radius: G.pin, length: 0.7 },
        // 搖臂上的凸耳:手柄的趾頭頂在它上面
        { kind: "plate", shape: shape(thickLine([[0, 0.38], [PIVOT[0] + TOE[0], PIVOT[1] + TOE[1] - 0.1]], 0.12)), thickness: 0.15, at: [0, 0, -0.2] },
        { kind: "cylinder", radius: 0.08, length: 0.55, at: [PIVOT[0] + TOE[0], PIVOT[1] + TOE[1] - 0.08, 0.05] },
      ],
    },
    { id: "rod", kind: "group", center: ECC, arrow: false, pieces: [{ kind: "plate", shape: G.rod({ left: -3.65, right: 2.4 }), thickness: 0.25, at: [-ECC[0], 0, 0] }] },
    { id: "handle", kind: "group", arrow: false, pieces: [{ kind: "plate", shape: HANDLE, thickness: 0.15 }, { kind: "cylinder", radius: 0.07, length: 0.3 }] },
  ],
  driver: { part: "handle", type: "rotation", range: [0, MAX] },
  target: "rod",
  view: { direction: [0.06, 0.05, 1] },
  pose(phi) {
    const { lift, released } = unhook(phi);
    const a = rodAngle(lift);
    return {
      parts: { rod: { angle: a }, handle: { position: onRod(PIVOT, lift, 0.25), angle: a + phi } },
      readouts: [{ label: "銷", value: released ? "已脫出鉤口" : "在鉤口中" }],
    };
  },
};
