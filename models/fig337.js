// 第 337 種:平行運動。半徑桿接在一根短擺動桿的下端,擺動桿的上端接在樑上,中點接著活塞桿。
// 樑擺動時,擺動桿中點走的是近似直線(瓦特直線連桿),活塞桿因此直上直下。主動件是樑。
// 推斷:各桿長依原圖比例(樑的樞軸在右、半徑桿的樞軸在左)。
// 深度由後往前:活塞桿 → 樑 → 擺動桿 → 半徑桿。活塞桿在擺動桿後面隔一層(行程中段它從 P 往下經過擺動桿下端 R,
// 和 R 的銷錯開);擺動桿中點 P 有一根銷往後穿過活塞桿頂的眼。
import { deg, clamp } from "./kit.js";
import { wattLinkage } from "./parallel-motion.js";
import { shape, circle } from "./shapes.js";
import { pedestal } from "./supports.js";

export const watt = wattLinkage({ line: 0, y1: 1.0, y2: 0.0, a: 3.0, b: 2.6, beamSide: 1 });
export const RANGE = [deg(-14), deg(14)];
const PISTON_ROD = 2.6;
const Z = { rod: -0.1, vibrating: 0.1, radius: 0.17 };
const T = 0.06;
const ROD_T = 0.08;
// P 點的銷:從活塞桿背面穿到擺動桿正面,掛在擺動桿上(擺動桿從 B 指向 R,P 在 B 往下 k·c 處)
const PIN_P = { from: Z.rod - ROD_T / 2, to: Z.vibrating + T / 2 };

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
        // 兩個支座站在同一塊底板上(推斷;底板在活塞桿後面,活塞桿的下端往下伸過它前面)
        { kind: "box", size: [watt.O1[0] - watt.O2[0] + 1.4, 0.15, 0.5], at: [(watt.O1[0] + watt.O2[0]) / 2, -2.4 - 0.18 - 0.075, -0.45] },
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
    {
      id: "vibrating",
      kind: "link",
      width: 0.12,
      thickness: T,
      pieces: [{ kind: "cylinder", radius: 0.04, length: PIN_P.to - PIN_P.from, at: [watt.k * watt.c, 0, (PIN_P.from + PIN_P.to) / 2 - Z.vibrating] }],
    },
    { id: "pistonRod", kind: "box", size: [0.08, PISTON_ROD, ROD_T] },
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
        radiusBar: { from: [watt.O2[0], watt.O2[1], Z.radius], to: [R[0], R[1], Z.radius] },
        vibrating: { from: [B[0], B[1], Z.vibrating], to: [R[0], R[1], Z.vibrating] },
        pistonRod: { position: [P[0], P[1] - PISTON_ROD / 2, Z.rod] },
      },
      readouts: [],
    };
  },
};
