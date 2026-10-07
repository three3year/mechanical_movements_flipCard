// 第 337 種:平行運動。半徑桿接在一根短振動桿的下端,振動桿的上端接在樑上,中點接著活塞桿。
// 樑擺動時,振動桿中點走的是近似直線(瓦特直線連桿),活塞桿因此直上直下。主動件是樑。
// 推斷:各桿長依原圖比例(樑的樞軸在右、半徑桿的樞軸在左)。
import { deg, clamp } from "./kit.js";
import { wattLinkage } from "./parallel-motion.js";
import { shape, circle } from "./shapes.js";
import { pedestal } from "./supports.js";

export const watt = wattLinkage({ line: 0, y1: 1.0, y2: 0.0, a: 3.0, b: 2.6, beamSide: 1 });
export const RANGE = [deg(-14), deg(14)];
const PISTON_ROD = 2.6;

export default {
  figure: 337,
  parts: [
    {
      // 兩個固定樞軸的銷與支座(原圖沒畫支座,推斷)
      id: "pivots",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: 0.12, length: 0.75, at: [watt.O2[0], watt.O2[1], -0.15] },
        { kind: "cylinder", radius: 0.19, length: 0.7, at: [watt.O1[0], watt.O1[1], -0.1] },
        ...pedestal({ at: [watt.O1[0], watt.O1[1]], z: -0.4, bore: 0.19, floor: -2.4 }),
        ...pedestal({ at: [watt.O2[0], watt.O2[1]], z: -0.4, bore: 0.12, floor: -2.4 }),
      ],
    },
    {
      id: "beam",
      kind: "plate",
      center: watt.O1,
      shape: { ...shape([[0.6, -0.35], [0.6, 0.35], [-3.0, 0.15], [-3.15, 0], [-3.0, -0.15]]), holes: [circle(0.2).reverse()] },
      thickness: 0.12,
      arrow: false,
      pieces: [{ kind: "cylinder", radius: 0.42, inner: 0.2, length: 0.2 }],
    },
    { id: "radiusBar", kind: "link", width: 0.1, thickness: 0.06 },
    { id: "vibrating", kind: "link", width: 0.12, thickness: 0.06 },
    { id: "pistonRod", kind: "box", size: [0.08, PISTON_ROD, 0.08] },
  ],
  driver: { part: "beam", type: "rotation", range: RANGE, initial: 0 },
  target: "pistonRod", // 直上直下的活塞桿
  view: { direction: [0.03, 0.05, 1] },
  pose(psi0) {
    const psi = clamp(psi0, ...RANGE);
    const { B, R, P } = watt(psi);
    return {
      parts: {
        beam: { angle: psi },
        // 由後往前:活塞桿與樑同層(掛在擺動桿的背面)、擺動桿貼著樑的前面、半徑桿再往前一層
        radiusBar: { from: [watt.O2[0], watt.O2[1], 0.17], to: [R[0], R[1], 0.17] },
        vibrating: { from: [B[0], B[1], 0.1], to: [R[0], R[1], 0.1] },
        pistonRod: { position: [P[0], P[1] - PISTON_ROD / 2, 0.03] },
      },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["vibrating", "pistonRod"], reason: "接合處的簡化畫法:擺動桿的端頭鉸接在活塞桿的頂端,軸眼與桿端重疊 0.05" },
  ],
};
