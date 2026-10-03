// 第 335 種:固定式樑式引擎常用的平行運動(瓦特的平行運動)。樑繞右邊的大樞軸擺動;樑中段與樑端各垂下一根吊桿,
// 兩吊桿下端以平行桿相連(平行四邊形),內側吊桿的下端再由半徑桿拉向左邊的固定樞軸。
// 樑擺動時,外側吊桿的下端(活塞桿頭)走的是近似直線,活塞桿直上直下。主動件是樑。
// 推斷:各桿長(半徑桿長依「活塞桿頭走得最直」選定);原圖的虛線弧是樑端與半徑桿端走過的弧。
import { deg, clamp } from "./kit.js";
import { circleCircle } from "./linkage.js";
import { shape, circle } from "./shapes.js";

const O1 = [2.6, 0.6, 0]; // 樑的樞軸
const A_MID = 1.4; // 樞軸到樑中段吊點
const A_END = 2.6; // 樞軸到樑端吊點
const HANG = 0.95; // 吊桿長
const RADIUS = 1.65; // 半徑桿長
const O2 = [O1[0] - A_MID - RADIUS, O1[1] - HANG, 0]; // 半徑桿的固定樞軸
export const RANGE = [deg(-14), deg(14)];
const PISTON_ROD = 2.4;

/** 樑轉 psi → 樑中段 M、樑端 B、內側吊桿下端 Q、活塞桿頭 P */
export function parallel(psi0) {
  const psi = clamp(psi0, ...RANGE);
  const dir = Math.PI + psi;
  const M = [O1[0] + A_MID * Math.cos(dir), O1[1] + A_MID * Math.sin(dir), 0];
  const B = [O1[0] + A_END * Math.cos(dir), O1[1] + A_END * Math.sin(dir), 0];
  const Q = circleCircle(M, HANG, O2, RADIUS, 1).point;
  const P = [B[0] + Q[0] - M[0], B[1] + Q[1] - M[1], 0];
  return { psi, M, B, Q, P };
}

export default {
  figure: 335,
  parts: [
    { id: "pivots", kind: "group", pieces: [{ kind: "cylinder", radius: 0.1, length: 0.4, at: O2 }, { kind: "box", size: [0.4, 0.4, 0.3], at: [O2[0] - 0.25, O2[1], -0.2] }] },
    {
      id: "beam",
      kind: "plate",
      center: O1,
      shape: { ...shape([[0.6, -0.4], [0.6, 0.4], [-A_END, 0.12], [-A_END - 0.15, 0], [-A_END, -0.12]]), holes: [circle(0.2).reverse()] },
      thickness: 0.12,
      arrow: false,
      pieces: [{ kind: "cylinder", radius: 0.45, inner: 0.2, length: 0.2 }],
    },
    { id: "hangEnd", kind: "link", width: 0.1, thickness: 0.06 },
    { id: "hangMid", kind: "link", width: 0.1, thickness: 0.06 },
    { id: "parallelBar", kind: "link", width: 0.1, thickness: 0.06 },
    { id: "radiusBar", kind: "link", width: 0.1, thickness: 0.06 },
    { id: "pistonRod", kind: "box", size: [0.08, PISTON_ROD, 0.08] },
  ],
  driver: { part: "beam", type: "rotation", range: RANGE, initial: 0 },
  view: { direction: [0.03, 0.05, 1] },
  pose(psi0) {
    const { psi, M, B, Q, P } = parallel(psi0);
    const z = (q, dz) => [q[0], q[1], dz];
    return {
      parts: {
        beam: { angle: psi },
        hangEnd: { from: z(B, 0.18), to: z(P, 0.18) },
        hangMid: { from: z(M, 0.18), to: z(Q, 0.18) },
        parallelBar: { from: z(P, 0.25), to: z(Q, 0.25) },
        radiusBar: { from: z(O2, 0.3), to: z(Q, 0.3) },
        pistonRod: { position: [P[0], P[1] - PISTON_ROD / 2, 0.1] },
      },
      readouts: [],
    };
  },
};
