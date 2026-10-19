// 第 338 種:平行運動的另一種變形:半徑桿放在樑的上方。樑繞左邊的樞軸擺動,樑端接一根短連桿往上,
// 短連桿上端由半徑桿拉向左上方的固定樞軸(兩臂伸向同一側);短連桿往下延長的一點走近似直線,活塞桿接在那裡。
// 主動件是樑。
// 偏離插圖(維護者 2026-10-14 決定的折衷):原圖的半徑桿樞軸在樑中段上方(樑樞軸右 0.54 倍樑長、上 0.2 倍),
// 半徑桿約樑長一半;照原圖的比例,直線點在 16° 擺幅下偏離鉛直線約行程的 3.4%。這裡樞軸往樑樞軸方向挪一半
// (右 1.2、上 1.2,樑長 3.7),半徑桿約樑長的 0.71,短連桿上段 1.0,擺幅 16°,偏離約 0.5%。
// 推斷:直線點在短連桿延長線上的位置(取擺動中最直的一點);兩個固定樞軸的支座與底板。
// 深度由後往前:樑與活塞桿 → 短連桿 → 半徑桿。樑端 B 是圓眼,一根銷穿過樑與短連桿;活塞桿頂掛在短連桿下端 P 的銷上。
import { deg, clamp } from "./kit.js";
import { sameSideLinkage } from "./parallel-motion.js";
import { shape, circle, arcPoints } from "./shapes.js";
import { pedestal } from "./supports.js";

export const RANGE = [deg(-22), deg(-6)];
export const BEAM = 3.7;
const O1 = [-2.0, 0.9, 0];
const O2 = [O1[0] + 1.2, O1[1] + 1.2, 0];
const C = 1.0; // 短連桿上段(B 到 R)
export const watt = sameSideLinkage({ O1, O2, a: BEAM, c: C, up: [0, 1], range: RANGE });
const PISTON_ROD = 2.0;
const FLOOR = -3.4;
const Z = { beam: 0, rod: 0.03, short: 0.1, radius: 0.17 };
const T = 0.06;
const BEAM_T = 0.12;
const EYE = 0.15; // 樑端圓眼的半徑
const PIN = 0.05;
/** 從 lo 面到 hi 面的銷,掛在 z 層的短連桿上:相對 z 與長度 */
const through = (lo, hi) => ({ at: (lo + hi) / 2 - Z.short, length: hi - lo });
const PIN_B = through(Z.beam - BEAM_T / 2, Z.short + T / 2);
const PIN_P = through(Z.rod - 0.04, Z.short + T / 2);

export default {
  figure: 338,
  parts: [
    {
      // 兩個固定樞軸的銷與支座(原圖沒畫支座,推斷)
      id: "pivot",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: 0.1, length: Z.radius + T / 2 + 0.01 + 0.85, at: [O2[0], O2[1], (Z.radius + T / 2 + 0.01 - 0.85) / 2] },
        { kind: "cylinder", radius: 0.2, length: 0.7, at: [O1[0], O1[1], -0.1] },
        ...pedestal({ at: [O1[0], O1[1]], z: -0.4, bore: 0.2, floor: FLOOR }),
        ...pedestal({ at: [O2[0], O2[1]], z: -0.75, bore: 0.1, floor: FLOOR }),
        // 兩個支座站在同一塊底板上
        { kind: "box", size: [O2[0] - O1[0] + 1.6, 0.15, 0.95], at: [(O1[0] + O2[0]) / 2, FLOOR - 0.18 - 0.075, -0.575] },
      ],
    },
    {
      id: "beam",
      kind: "plate",
      center: O1,
      // 樑從樞軸的轂往右漸細,樑端 B 是圓眼
      shape: { ...shape([[-0.5, -0.35], ...arcPoints(EYE, -Math.PI / 2, Math.PI / 2, BEAM, 0), [-0.5, 0.35]]), holes: [circle(0.22).reverse(), circle(PIN, BEAM, 0).reverse()] },
      thickness: BEAM_T,
      arrow: false,
      pieces: [{ kind: "cylinder", radius: 0.42, inner: 0.22, length: 0.2 }],
    },
    { id: "radiusBar", kind: "link", width: 0.1, thickness: T },
    // 短連桿從 R 經過樑端 B 延伸到 P:B 與 P 各一根銷
    {
      id: "short",
      kind: "link",
      width: 0.12,
      thickness: T,
      pieces: [
        { kind: "cylinder", radius: PIN, length: PIN_B.length, at: [C, 0, PIN_B.at] },
        { kind: "cylinder", radius: 0.04, length: PIN_P.length, at: [C * (1 + watt.t), 0, PIN_P.at] },
      ],
    },
    { id: "pistonRod", kind: "box", size: [0.08, PISTON_ROD, 0.08] },
  ],
  driver: { part: "beam", type: "rotation", range: RANGE, initial: RANGE[0] },
  target: "pistonRod", // 直上直下的活塞桿
  view: { direction: [0.03, 0.05, 1] },
  pose(psi0) {
    const psi = clamp(psi0, ...RANGE);
    const { R, P } = watt(psi);
    return {
      parts: {
        beam: { angle: psi },
        radiusBar: { from: [O2[0], O2[1], Z.radius], to: [R[0], R[1], Z.radius] },
        short: { from: [R[0], R[1], Z.short], to: [P[0], P[1], Z.short] }, // 短連桿從 R 經過樑端 B 延伸到 P
        pistonRod: { position: [P[0], P[1] - PISTON_ROD / 2, Z.rod] },
      },
      readouts: [],
    };
  },
};
