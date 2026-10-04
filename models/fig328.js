// 第 328 種:卡特萊特博士(1787 年)的平行運動。兩個直徑與齒數相同的齒輪 C、C 互相咬合,各帶一個半徑相等的曲柄 A、A,
// 兩曲柄方向相反;兩根連桿從曲柄銷接到活塞桿上十字頭的兩端,齒輪轉動時兩連桿的傾斜角始終相等,
// 活塞桿 B 因此被迫沿直線運動。主動件是虛擬的「進程」(下方汽缸的蒸汽推動);汽缸內的蒸汽以流體示意。
// 推斷:進汽的時機;後方的大輪是飛輪(依原圖)。
import { TAU, deg } from "./kit.js";
import { meshAngle } from "./gears.js";
import { cylinderParts, cylinderPose, steamPipe } from "./vertical-engine.js";
import { shape, circle, arcPoints } from "./shapes.js";

const M = 0.11;
const G = { teeth: 16, radius: (16 * M) / 2 }; // 0.88
export const GL = { ...G, center: [-G.radius, 2.0, 0] };
export const GR = { ...G, center: [G.radius, 2.0, 0] };
const R = 0.55; // 曲柄半徑
const ROD = 2.4;
const HALF = 0.55; // 十字頭半長
const PISTON_ROD = 2.0;
const CYL = { x: 0, top: -1.6, length: 1.6, radius: 0.42 };

/** 進程 p → 兩齒輪角、兩曲柄銷、十字頭高度、活塞高度 */
export function cartwright(p) {
  const a = -TAU * p + deg(-60);
  const b = meshAngle(GL, GR, a);
  // 右曲柄是左曲柄的鏡像(方向相反)
  const pinL = [GL.center[0] + R * Math.cos(a), GL.center[1] + R * Math.sin(a), 0];
  const pinR = [-pinL[0], pinL[1], 0];
  const head = pinL[1] - Math.sqrt(ROD * ROD - (pinL[0] + HALF) ** 2);
  const prev = (() => {
    const a2 = a + 1e-4;
    const pl = [GL.center[0] + R * Math.cos(a2), GL.center[1] + R * Math.sin(a2)];
    return pl[1] - Math.sqrt(ROD * ROD - (pl[0] + HALF) ** 2);
  })();
  return { a, b, pinL, pinR, head, piston: head - PISTON_ROD, downward: head < prev };
}

const crank = (angle) => [{ kind: "plate", shape: shape([[0, -0.13], [R, -0.09], [R, 0.09], [0, 0.13]], [circle(0.05).reverse()]), thickness: 0.08, at: [0, 0, 0.2], angle }];
// 右曲柄在右齒輪上的方向:讓它始終是左曲柄的鏡像(兩齒輪反向轉,這個差是常數)
const MIRROR = Math.PI - 0 - meshAngle(GL, GR, 0);

export default {
  figure: 328,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [4.6, 0.32, 0.3], at: [0, 1.3, -0.2] },
        { kind: "box", size: [2.6, 0.18, 0.8], at: [0, -3.45, 0] },
        { kind: "plate", shape: shape([...arcPoints(3.2, 0, TAU).slice(0, -1)], [arcPoints(2.95, 0, TAU).slice(0, -1).reverse()]), thickness: 0.15, at: [GR.center[0] - 0.2, GR.center[1] - 1.3, -0.7] },
      ],
    },
    { id: "pipe", ...steamPipe(CYL) },
    ...cylinderParts(CYL),
    { id: "gearL", kind: "gear", center: GL.center, teeth: G.teeth, radius: G.radius, width: 0.16, pieces: crank(0), label: "C", labelOffset: [-0.6, 0.6, 0.3] },
    { id: "gearR", kind: "gear", center: GR.center, teeth: G.teeth, radius: G.radius, width: 0.16, pieces: crank(MIRROR), label: "C", labelOffset: [0.6, 0.6, 0.3] },
    { id: "rodL", kind: "link", width: 0.12, thickness: 0.06 },
    { id: "rodR", kind: "link", width: 0.12, thickness: 0.06 },
    { id: "crosshead", kind: "group", label: "B", labelOffset: [0.3, -0.6, 0.3], pieces: [{ kind: "box", size: [2 * HALF + 0.2, 0.14, 0.12], at: [0, 0, 0.3] }, { kind: "box", size: [0.08, PISTON_ROD, 0.08], at: [0, -PISTON_ROD / 2, 0] }] },
    { id: "labelA1", kind: "group", center: GL.center, label: "A", labelOffset: [0.25, -0.5, 0.4] },
    { id: "labelA2", kind: "group", center: GR.center, label: "A", labelOffset: [-0.25, -0.5, 0.4] },
  ],
  powered: ["piston"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.25 },
  targets: ["gearL", "gearR"], // 輸出的曲柄齒輪
  view: { direction: [0.03, 0.05, 1] },
  pose(p) {
    const c = cartwright(p);
    const cyl = cylinderPose(CYL, c.piston, c.downward, p);
    return {
      parts: {
        gearL: { angle: c.a },
        // 右齒輪:咬合角;它的曲柄畫成左曲柄的鏡像方向
        gearR: { angle: c.b },
        rodL: { from: [c.pinL[0], c.pinL[1], 0.32], to: [-HALF, c.head, 0.32] },
        rodR: { from: [c.pinR[0], c.pinR[1], 0.32], to: [HALF, c.head, 0.32] },
        crosshead: { position: [0, c.head, 0] },
        ...cyl.parts,
      },
      flows: cyl.flows,
      readouts: [],
    };
  },
};
