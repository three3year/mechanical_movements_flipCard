// 第 335 種:固定式樑式引擎常用的平行運動(瓦特的平行運動)。樑繞右邊的大樞軸擺動;樑中段與樑端各垂下一根吊桿,
// 兩吊桿下端以平行桿相連(平行四邊形),內側吊桿的下端再由半徑桿拉向左邊的固定樞軸。
// 樑擺動時,外側吊桿的下端(活塞桿頭)走的是近似直線,活塞桿直上直下。主動件是樑。
// 推斷:各桿長(半徑桿長依「活塞桿頭走得最直」選定);原圖的虛線弧是樑端與半徑桿端走過的弧。
// 結構(原圖):左邊固定樞軸到 Q 的半徑桿,在中間位置時剛好與平行桿 P–Q 成一直線,原圖就畫成「一根長桿、
// 上面有 P、Q 兩個銷」——兩段連桿(樞軸–P、P–Q)帶著直立的活塞桿。模型原本把半徑桿與平行桿畫在幾乎同一層、
// 同樣粗細,P–Q 一段兩桿相疊,看起來只剩一根從樞軸到 Q 的桿。現在半徑桿放在樑的後面(z < 0)、做得細一點,
// 平行桿放在吊桿前面、做得寬一點,各接點用一根貫穿的銷把吊桿、平行桿、半徑桿、活塞桿串起來;
// 樑的樞軸與半徑桿的樞軸各有機架。桿長與接點位置都沒動。
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

// 各層的 z:半徑桿在樑後面,吊桿、平行桿、活塞桿在樑前面
const Z_RADIUS = -0.22;
const Z_HANG = 0.18;
const Z_PARALLEL = 0.28;
const Z_PISTON = 0.1;

// 貫穿接點的銷:從 z0 到 z1
const pin = (id, z0, z1) => ({ id, kind: "cylinder", radius: 0.04, length: z1 - z0, __mid: (z0 + z1) / 2 });
const PINS = [pin("pinB", -0.12, 0.32), pin("pinM", -0.12, 0.32), pin("pinP", 0.0, 0.42), pin("pinQ", -0.32, 0.42)];

export default {
  figure: 335,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 半徑桿的固定樞軸:牆上的托架與銷(桿在樑後面那一層)
        { kind: "box", size: [0.4, 0.4, 0.3], at: [O2[0] - 0.25, O2[1], -0.2] },
        { kind: "cylinder", radius: 0.08, length: 0.36, at: [O2[0], O2[1], -0.2] },
        // 樑的大樞軸:後面的立柱與穿過樑轂的軸
        { kind: "box", size: [0.5, 1.4, 0.3], at: [O1[0], O1[1] - 0.9, -0.3] },
        { kind: "cylinder", radius: 0.12, length: 0.7, at: [O1[0], O1[1], -0.15] },
      ],
    },
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
    { id: "parallelBar", kind: "link", width: 0.14, thickness: 0.06 },
    { id: "radiusBar", kind: "link", width: 0.08, thickness: 0.06 },
    { id: "pistonRod", kind: "box", size: [0.08, PISTON_ROD, 0.08] },
    ...PINS.map(({ __mid, ...p }) => p),
  ],
  driver: { part: "beam", type: "rotation", range: RANGE, initial: 0 },
  target: "pistonRod", // 直上直下的活塞桿
  view: { direction: [0.18, 0.12, 1] },
  pose(psi0) {
    const { psi, M, B, Q, P } = parallel(psi0);
    const z = (q, dz) => [q[0], q[1], dz];
    const [pB, pM, pP, pQ] = PINS;
    return {
      parts: {
        beam: { angle: psi },
        hangEnd: { from: z(B, Z_HANG), to: z(P, Z_HANG) },
        hangMid: { from: z(M, Z_HANG), to: z(Q, Z_HANG) },
        parallelBar: { from: z(P, Z_PARALLEL), to: z(Q, Z_PARALLEL) },
        radiusBar: { from: z(O2, Z_RADIUS), to: z(Q, Z_RADIUS) },
        pistonRod: { position: [P[0], P[1] - PISTON_ROD / 2, Z_PISTON] },
        pinB: { position: z(B, pB.__mid) },
        pinM: { position: z(M, pM.__mid) },
        pinP: { position: z(P, pP.__mid) },
        pinQ: { position: z(Q, pQ.__mid) },
      },
      readouts: [],
    };
  },
};
