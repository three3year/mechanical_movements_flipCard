// 第 196 種:小齒輪 B 繞固定的軸旋轉,給承載輪 A 的搖臂不規則的振動運動。輪 A 是一個長形、不規則的齒輪,
// 裝在搖臂的末端(搖臂繞右邊台座上的樞軸擺動),靠自重壓在 B 上保持咬合;A 轉動時與 B 接觸處的半徑一直在變,
// 搖臂就跟著不規則地上下擺動。主動件是小齒輪 B。
// 推斷:輪 A 的節曲線(一個大圓頭加一個往右伸的凸瓣,依原圖輪廓)與齒數。
import { TAU, deg } from "./kit.js";
import { swingMesh } from "./swing-mesh.js";
import { noncircularOutline, samplePitch, arcAt } from "./noncircular.js";
import { shape, circle, rect } from "./shapes.js";

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
/** 輪 A 的節曲線:基本半徑 0.78,往右上的凸瓣,左側略鼓 */
const r = (phi) => 0.78 + 0.95 * Math.exp(-((wrap(phi - deg(12)) / 0.62) ** 2)) + 0.12 * Math.exp(-((wrap(phi - Math.PI) / 0.9) ** 2));
const NB = 9;
const TEETH = Math.round(samplePitch(r).length / 0.29);
const PITCH = samplePitch(r).length / TEETH;
const RB = (NB * PITCH) / TAU;
const PIVOT = [3.25, 1.15, 0];
const A0 = [0, r(-Math.PI / 2) + RB, 0]; // 原圖:A 在 B 的正上方,以最下方(局部角 −90°)與 B 接觸
const ARM = Math.hypot(A0[0] - PIVOT[0], A0[1] - PIVOT[1]);
const mesh = swingMesh({ r, fixed: [0, 0, 0], rp: RB, pivot: PIVOT, arm: ARM, side: 1, moving: "gear" });
const START = mesh.state((3 * Math.PI) / 2);

/** B 轉 angle(逆時針為正):輪 A 的軸心、A 的轉角、搖臂的轉角 */
export function swing(angle) {
  const s = mesh.byPinion(START.pinion + angle);
  return { center: s.center, a: s.gear, arm: s.arm, pinion: s.pinion - START.pinion };
}
export const radii = { r, RB };

const outline = noncircularOutline(r, { teeth: TEETH, addendum: PITCH / Math.PI, dedendum: (1.2 * PITCH) / Math.PI, start: arcAt(r, (3 * Math.PI) / 2) });

export default {
  figure: 196,
  parts: [
    { id: "wheelA", kind: "plate", shape: { outline, holes: [circle(0.1).reverse()] }, thickness: 0.22, hub: 0.18, mark: [-0.5, 0], markSize: 0.08, spin: 1.2, label: "A", labelOffset: [-0.3, 0, 0.4] },
    { id: "pinionB", kind: "gear", teeth: NB, radius: RB, width: 0.25, label: "B", labelOffset: [0.25, 0, 0.4], pieces: [{ kind: "cylinder", radius: 0.08, length: 0.7 }] },
    { id: "arm", kind: "link", width: 0.26, thickness: 0.1 },
    {
      id: "stand",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(rect(2.35, 1.0, 3.52, -0.35)), thickness: 0.6, at: [0, 0, -0.1] },
        { kind: "plate", shape: shape([[2.8, 0.15], [3.8, 0.15], [3.55, 0.45], [3.45, 1.0], [3.05, 1.0], [2.95, 0.45]]), thickness: 0.3, at: [0, 0, 0.1] },
        { kind: "cylinder", radius: 0.2, inner: 0.08, length: 0.4, at: [PIVOT[0], PIVOT[1], 0.25] },
      ],
    },
  ],
  driver: { part: "pinionB", type: "rotation" },
  view: { direction: [0.06, 0.05, 1] },
  pose(angle) {
    const { center, a, pinion } = swing(angle);
    return {
      parts: {
        wheelA: { position: center, angle: a },
        pinionB: { angle: Math.PI / 2 + Math.PI / NB + pinion },
        arm: { from: [center[0], center[1], 0.3], to: [PIVOT[0], PIVOT[1], 0.3] },
      },
      readouts: [],
    };
  },
};
