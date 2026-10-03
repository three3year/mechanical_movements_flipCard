// 第 329 種:活塞桿導引裝置。活塞桿 A 接在齒輪 B 上的一個手腕(wrist)上;B 繞著曲柄銷轉,曲柄銷由牢固在軸上的板 C
// 承載。B 在一個靜止的內齒輪 D 裡面滾動,D 的直徑是 B 的兩倍,所以 B 節圓上的手腕走的是一條直線(直徑),
// 運動傳給曲柄銷,而活塞桿保持直立。主動件是虛擬的「進程」(下方汽缸的蒸汽推動);汽缸內的蒸汽以流體示意。
// 推斷:手腕在 B 的節圓上;進汽的時機;外圈的大輪是飛輪(依原圖)。
import { TAU, Z } from "./kit.js";
import { cylinderParts, cylinderPose, steamPipe } from "./vertical-engine.js";
import { shape, circle, arcPoints } from "./shapes.js";
import { meshAngle } from "./gears.js";

const C0 = [0, 0.9, 0]; // 主軸
const RB = 0.62; // 齒輪 B 的節圓半徑
const NB = 14;
const ND = 2 * NB;
const CYL = { x: 0, top: -1.3, length: 2.85, radius: 0.42 };
const PISTON_ROD = 3.6; // 手腕到活塞

const PHI0 = Math.PI / 2; // 進程 0 時曲柄朝上
const D = { center: C0, axis: Z, internal: true, teeth: ND, radius: 2 * RB };
// B 的齒相位:進程 0 時由 meshAngle 對 D 排好(齒嵌進齒槽),之後絕對自轉 = −公轉(在兩倍大的內齒輪裡滾動)。
// 不逐步呼叫 meshAngle,是因為它的「減整數個齒距」會隨公轉跳格。
const SPIN0 = meshAngle(D, { center: [C0[0] + RB * Math.cos(PHI0), C0[1] + RB * Math.sin(PHI0), 0], axis: Z, teeth: NB, radius: RB }, 0);
// 手腕在 B 上的局部角:節圓上的點走的直線方向是 (自轉相位 + 局部角)/2,要直立就得 自轉相位 + 局部角 = π
export const WRIST = Math.PI - (SPIN0 + PHI0);

/** 進程 p → 板 C(曲柄)的轉角、B 的中心與自轉角、手腕位置 */
export function hypo(p) {
  const phi = TAU * p + PHI0;
  const center = [C0[0] + RB * Math.cos(phi), C0[1] + RB * Math.sin(phi), 0];
  const spin = SPIN0 - (phi - PHI0); // 在兩倍大的內齒輪裡滾動:絕對自轉 = −公轉
  const wrist = [center[0] + RB * Math.cos(spin + WRIST), center[1] + RB * Math.sin(spin + WRIST), 0];
  const nextY = C0[1] + 2 * RB * Math.sin(phi + 1e-4);
  return { phi, center, spin, wrist, downward: nextY < wrist[1] };
}

export default {
  figure: 329,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.25, 5.4, 0.3], at: [-2.05, -1.3, -0.4] },
        { kind: "box", size: [0.25, 5.4, 0.3], at: [2.05, -1.3, -0.4] },
        { kind: "box", size: [4.4, 0.2, 0.3], at: [0, 0.9, -0.4] },
        { kind: "box", size: [4.4, 0.18, 0.8], at: [0, -4.3, 0] },
      ],
    },
    // 靜止的內齒輪 D
    { id: "ringD", kind: "gear", center: C0, internal: true, teeth: ND, radius: 2 * RB, width: 0.14, rim: 2 * RB + 0.3, arrow: false, label: "D", labelOffset: [0.9, -1.2, 0.3] },
    {
      id: "flywheel",
      kind: "group",
      center: C0,
      spin: 2.7,
      pieces: [
        { kind: "plate", shape: shape([...arcPoints(2.8, 0, TAU).slice(0, -1)], [arcPoints(2.55, 0, TAU).slice(0, -1).reverse()]), thickness: 0.2, at: [0, 0, -0.6] },
        ...[0, 1, 2].map((i) => ({ kind: "box", size: [2.6, 0.14, 0.1], at: [1.3 * Math.cos((i * TAU) / 3), 1.3 * Math.sin((i * TAU) / 3), -0.6], angle: (i * TAU) / 3 })),
        { kind: "cylinder", radius: 0.2, length: 1.0, at: [0, 0, -0.2] },
        // 板 C:從軸心到曲柄銷
        { kind: "plate", shape: shape([[0, -0.14], [RB, -0.1], [RB, 0.1], [0, 0.14]], [circle(0.06).reverse()]), thickness: 0.08, at: [0, 0, 0.22] },
        { kind: "cylinder", radius: 0.06, length: 0.35, at: [RB, 0, 0.2], accent: true },
      ],
      label: "C",
      labelOffset: [0.35, -0.25, 0.4],
    },
    { id: "gearB", kind: "gear", teeth: NB, radius: RB, width: 0.14, label: "B", labelOffset: [-0.3, 0, 0.3], pieces: [{ kind: "cylinder", radius: 0.05, length: 0.3, at: [RB * Math.cos(WRIST), RB * Math.sin(WRIST), 0.15] }] },
    { id: "rodA", kind: "box", size: [0.09, PISTON_ROD, 0.08], label: "A", labelOffset: [0.25, 1.2, 0.3] },
    { id: "pipe", ...steamPipe(CYL) },
    ...cylinderParts(CYL),
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.25 },
  target: "rodA", // 被導引得保持直立的活塞桿
  view: { direction: [0.03, 0.05, 1] },
  pose(p) {
    const h = hypo(p);
    const piston = h.wrist[1] - PISTON_ROD;
    const cyl = cylinderPose(CYL, piston, h.downward, p);
    return {
      parts: {
        flywheel: { angle: h.phi },
        gearB: { position: [h.center[0], h.center[1], 0.1], angle: h.spin },
        rodA: { position: [0, h.wrist[1] - PISTON_ROD / 2, 0.2] },
        ...cyl.parts,
      },
      flows: cyl.flows,
      readouts: [],
    };
  },
};
