// 第 333 種:只在特殊情況下使用的一種平行運動。左上的長樑以左下的地面樞軸撐著(經一根斜撐),樑的中段
// 是一個大接頭;右下的半徑桿也從地面樞軸伸上來;兩者之間的短連桿上有一點走近似直線(瓦特直線連桿)。
// 主動件是長樑。
// 推斷:原文沒有說明;依原圖的桿件配置,以瓦特直線連桿解釋它的作用;直線的方向是傾斜的(沿原圖的斜線)。
import { deg, clamp, rot2 } from "./kit.js";
import { wattLinkage } from "./parallel-motion.js";
import { shape, thickLine } from "./shapes.js";

const TILT = deg(-12); // 整個機構轉這麼多(原圖中直線是斜的)
const BASE = [0.4, -0.2, 0];
export const watt = wattLinkage({ line: 0, y1: 0.9, y2: -0.9, a: 2.8, b: 2.4, beamSide: -1 });
export const RANGE = [deg(-12), deg(12)];

const place = (p) => {
  const [x, y] = rot2([p[0], p[1]], TILT);
  return [BASE[0] + x, BASE[1] + y, 0];
};

/** 樑轉 psi → 世界座標中的 B、R、P 與兩個地面樞軸 */
export function linkage(psi0) {
  const { B, R, P } = watt(clamp(psi0, ...RANGE));
  return { B: place(B), R: place(R), P: place(P), O1: place(watt.O1), O2: place(watt.O2) };
}

const ground = (p) => [
  { kind: "box", size: [0.7, 0.12, 0.4], at: [p[0], p[1] - 0.22, 0] },
  ...[0, 1, 2, 3].map((i) => ({ kind: "box", size: [0.04, 0.16, 0.3], at: [p[0] - 0.25 + i * 0.17, p[1] - 0.34, 0], angle: deg(30) })),
  { kind: "cylinder", radius: 0.1, length: 0.4, at: p },
];
const O1 = place(watt.O1);
const O2 = place(watt.O2);

export default {
  figure: 333,
  parts: [
    { id: "ground", kind: "group", pieces: [...ground(O1), ...ground(O2)] },
    // 長樑:從左下的樞軸斜上,經過接頭 B,一直到左上方(原圖的長桿)
    { id: "beam", kind: "plate", center: O1, shape: shape(thickLine([[-0.2, 0], [4.0, 0]], 0.16)), thickness: 0.1, arrow: false },
    { id: "radiusBar", kind: "link", width: 0.14, thickness: 0.08 },
    { id: "coupler", kind: "link", width: 0.14, thickness: 0.08 },
    { id: "joint", kind: "cylinder", radius: 0.32, inner: 0.12, length: 0.25 },
    { id: "pointP", kind: "sphere", radius: 0.1 },
  ],
  driver: { part: "beam", type: "rotation", range: RANGE, initial: 0 },
  target: "pointP", // 走近似直線的點
  view: { direction: [0.03, 0.05, 1] },
  pose(psi0) {
    const psi = clamp(psi0, ...RANGE);
    const { B, R, P } = linkage(psi);
    const z = (q, dz) => [q[0], q[1], dz];
    return {
      parts: {
        beam: { angle: Math.atan2(B[1] - O1[1], B[0] - O1[0]) },
        radiusBar: { from: z(O2, 0.12), to: z(R, 0.12) },
        coupler: { from: z(B, 0.2), to: z(R, 0.2) },
        joint: { position: z(B, 0.15) },
        pointP: { position: z(P, 0.3) },
      },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["ground", "beam"], reason: "樑擺到極限位置時,端頭碰到地面上的支座,重疊 0.08(96 個取樣中 28 個);擺幅是示意的大小" },
  ],
};
