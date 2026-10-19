// 第 335 種:固定式樑式引擎常用的平行運動(瓦特的平行運動)。樑繞右邊的大樞軸擺動;樑中段與樑端各垂下一根吊桿,
// 兩吊桿下端以平行桿相連(平行四邊形),內側吊桿的下端 Q 再由半徑桿拉向固定樞軸。
// 樑擺動時,外側吊桿的下端(活塞桿頭 P)走的是近似直線,活塞桿直上直下。主動件是樑。
// 固定樞軸照原圖(2026-10-14 決定):原圖的虛線弧是 Q 繞著固定樞軸擺的軌跡,三點定圓的圓心正好在 P 的中間位置、
// 半徑等於 P–Q,所以固定樞軸在樑端正下方、P 的中間位置,半徑桿就是 P–Q 那一段(行程中間時和平行桿重疊);
// 原圖左邊從左端的銷伸到 P 的橫桿,是從牆上伸出、托住這個樞軸的固定臂。這是瓦特平行運動的教科書比例:
// 中段吊點在樑長一半、半徑桿等於半樑長。原圖的中段吊點約在 0.66 樑長,這裡改成 0.5(偏離插圖:固定樞軸照原圖放在
// P 的中間位置時,0.66 配不出直線,P 會橫移 0.085、約行程的 7%;原文 > 實物可行 > 插圖外形)。
// 推斷:牆柱、地基與樑的軸承座(原圖沒畫);吊桿長照舊。
// 原圖在行程中間把固定臂、半徑桿與平行桿畫成「一根長桿、上面有左端、P、Q 三個銷」。模型的半徑桿放在樑的後面
// (z < 0)、做得細一點,平行桿放在吊桿前面、做得寬一點,各接點用一根貫穿的銷把吊桿、平行桿、半徑桿、活塞桿串起來;
// 行程中間 P 的銷和固定樞軸重合:固定臂與半徑桿在樑後面,活塞桿、吊桿與平行桿在前面,兩邊的銷錯開深度。
import { deg, clamp } from "./kit.js";
import { circleCircle } from "./linkage.js";
import { shape, circle } from "./shapes.js";
import { pedestal } from "./supports.js";

const O1 = [2.6, 0.6, 0]; // 樑的樞軸
const A_END = 2.6; // 樞軸到樑端吊點
const A_MID = A_END / 2; // 樞軸到樑中段吊點(樑長一半)
const HANG = 0.95; // 吊桿長
const RADIUS = A_END - A_MID; // 半徑桿長 = P–Q(半樑長)
const O2 = [O1[0] - A_END, O1[1] - HANG, 0]; // 半徑桿的固定樞軸:樑端正下方、P 的中間位置
const WALL_X = O2[0] - 1.5; // 牆柱(原圖固定臂左端的銷,在 P 左邊約 1.5)
const FLOOR = -2.6; // 地基頂面(活塞桿下端最低到 −2.48)
export const RANGE = [deg(-14), deg(14)];
const PISTON_ROD = 1.5; // 原圖活塞桿頭以下露出約 1.5

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
const Z_ARM = -0.34; // 固定臂在半徑桿後面

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
        // 半徑桿的固定樞軸:牆柱伸出的固定臂(原圖左邊那根橫桿),端頭的銷穿過半徑桿(只到 z −0.1,
        // 行程中間 P 的銷從 z 0 起,兩者錯開)
        { kind: "box", size: [0.3, O2[1] + 0.06 - FLOOR, 0.3], at: [WALL_X, (O2[1] + 0.06 + FLOOR) / 2, Z_ARM] },
        { kind: "box", size: [O2[0] + 0.1 - WALL_X, 0.12, 0.1], at: [(O2[0] + 0.1 + WALL_X) / 2, O2[1], Z_ARM] },
        { kind: "cylinder", radius: 0.08, length: 0.32, at: [O2[0], O2[1], -0.26] },
        // 樑的大樞軸:軸承座從地基立起、環套住穿過樑轂的軸
        ...pedestal({ at: [O1[0], O1[1]], z: -0.35, bore: 0.12, floor: FLOOR }),
        { kind: "cylinder", radius: 0.12, length: 0.7, at: [O1[0], O1[1], -0.15] },
        // 地基:牆柱與軸承座都站在上面(在活塞桿後面)
        { kind: "box", size: [O1[0] - WALL_X + 1.2, 0.18, 0.6], at: [(O1[0] + WALL_X) / 2, FLOOR - 0.09, -0.35] },
      ],
    },
    {
      id: "beam",
      kind: "plate",
      center: O1,
      shape: { ...shape([[0.6, -0.4], [0.6, 0.4], [-A_END, 0.12], [-A_END - 0.15, 0], [-A_END, -0.12]]), holes: [circle(0.12).reverse()] },
      thickness: 0.12,
      arrow: false,
      pieces: [{ kind: "cylinder", radius: 0.45, inner: 0.12, length: 0.2 }],
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
