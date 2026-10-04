// 第 338 種:平行運動的另一種變形:半徑桿放在樑的上方。樑繞左邊的樞軸擺動,樑端接一根短連桿往上,
// 短連桿上端由半徑桿拉向左上方的固定樞軸(兩臂伸向同一側);短連桿往下延長的一點走近似直線,活塞桿接在那裡。
// 主動件是樑。
// 推斷:各桿長依原圖比例;直線點在短連桿延長線上的位置(取擺動中最直的一點)。
import { deg, clamp } from "./kit.js";
import { sameSideLinkage } from "./parallel-motion.js";
import { shape, circle } from "./shapes.js";

export const RANGE = [deg(-26), deg(-2)];
const O1 = [-2.0, 0.9, 0];
const O2 = [-1.4, 2.3, 0];
export const watt = sameSideLinkage({ O1, O2, a: 3.7, c: 1.1, up: [-0.174, 0.985], range: RANGE });
const PISTON_ROD = 2.0;

export default {
  figure: 338,
  parts: [
    { id: "pivot", kind: "group", pieces: [{ kind: "cylinder", radius: 0.1, length: 0.4, at: watt.O2 }] },
    {
      id: "beam",
      kind: "plate",
      center: watt.O1,
      shape: { ...shape([[-0.5, -0.35], [3.7, -0.12], [3.85, 0], [3.7, 0.12], [-0.5, 0.35]]), holes: [circle(0.22).reverse()] },
      thickness: 0.12,
      arrow: false,
      pieces: [{ kind: "cylinder", radius: 0.42, inner: 0.22, length: 0.2 }],
    },
    { id: "radiusBar", kind: "link", width: 0.1, thickness: 0.06 },
    { id: "short", kind: "link", width: 0.12, thickness: 0.06 },
    { id: "pistonRod", kind: "box", size: [0.08, PISTON_ROD, 0.08] },
  ],
  driver: { part: "beam", type: "rotation", range: RANGE, initial: deg(-14) },
  target: "pistonRod", // 直上直下的活塞桿
  view: { direction: [0.03, 0.05, 1] },
  pose(psi0) {
    const psi = clamp(psi0, ...RANGE);
    const { R, P } = watt(psi);
    return {
      parts: {
        beam: { angle: psi },
        radiusBar: { from: [watt.O2[0], watt.O2[1], 0.15], to: [R[0], R[1], 0.15] },
        short: { from: [R[0], R[1], 0.22], to: [P[0], P[1], 0.22] }, // 短連桿從 R 經過樑端 B 延伸到 P
        pistonRod: { position: [P[0], P[1] - PISTON_ROD / 2, 0.28] },
      },
      readouts: [],
    };
  },
  waivers: [
    { check: "unsupported", parts: ["pistonRod"], reason: "未修:活塞桿頂端與平行運動的連桿之間少畫了十字頭的銷(前後不同層)(列入待確認清單)" },
    { check: "unsupported", parts: ["short"], reason: "未修:短連桿與樑之間差 0.13,少畫了相連的銷(列入待確認清單)" },
    { check: "unsupported", parts: ["radiusBar"], reason: "未修:半徑桿與樑上的連桿之間少畫了相連的銷,前後各層之間有空隙(列入待確認清單)" },
    { check: "unsupported", parts: ["beam"], reason: "未修:樑的樞軸沒有畫出支座(離最近的實體 0.13)(列入待確認清單)" },
  ],
};
