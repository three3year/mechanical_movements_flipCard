// 第 148 種:小正齒輪連續轉動,帶動大齒輪;大齒輪面上有一道環形的溝槽(兩瓣的長圓),
// 曲柄(一端樞接在右邊的支架上)另一端的銷在溝槽裡。大齒輪轉動時,溝槽把銷時而推遠、時而拉近,
// 曲柄因此做交替的圓周運動(來回擺動),大齒輪每轉一圈擺兩次。主動件是小正齒輪。
// 曲柄的擺角由「銷在溝槽中心線上」的條件以二分法求出。
import { TAU, deg } from "./kit.js";
import { meshAngle } from "./gears.js";
import { solve } from "./linkage.js";
import { shape, rect } from "./shapes.js";

const BIG = { center: [0, 0, 0], teeth: 48, radius: 2.0 };
const SMALL = { center: [-2.0 - 0.5, 0, 0], teeth: 12, radius: 0.5 };
const R_PIVOT = [2.95, 0.35, 0.35];
const ARM = 2.7;
export const grooveAt = (phi) => 1.0 + 0.32 * Math.cos(2 * phi); // 溝槽中心線(大齒輪局部極座標)

/** 小齒輪轉 a:大齒輪轉角、曲柄的擺角 */
export function crank(a) {
  const big = meshAngle(SMALL, BIG, a);
  const f = (psi) => {
    const p = [R_PIVOT[0] + ARM * Math.cos(psi), R_PIVOT[1] + ARM * Math.sin(psi)];
    return Math.hypot(p[0], p[1]) - grooveAt(Math.atan2(p[1], p[0]) - big);
  };
  // 曲柄朝左(約 180°);在合理的範圍內找 f = 0
  const psi = solve(f, 0, deg(150), deg(200));
  return { big, psi };
}

const groove = (d) =>
  Array.from({ length: 200 }, (_, i) => {
    const phi = (i / 200) * TAU;
    return [(grooveAt(phi) + d) * Math.cos(phi), (grooveAt(phi) + d) * Math.sin(phi), 0.15];
  });

export default {
  figure: 148,
  parts: [
    { id: "small", kind: "gear", center: SMALL.center, teeth: SMALL.teeth, radius: SMALL.radius, width: 0.24, bore: 0.1 },
    {
      id: "big",
      kind: "gear",
      teeth: BIG.teeth,
      radius: BIG.radius,
      width: 0.2,
      bore: 0.15,
      web: false,
      pieces: [
        { kind: "tube", points: groove(0.12), radius: 0.035, closed: true },
        { kind: "tube", points: groove(-0.12), radius: 0.035, closed: true },
        ...[0, 1, 2, 3].map((k) => ({ kind: "box", size: [3.6, 0.1, 0.08], at: [0, 0, 0.05], angle: (k * Math.PI) / 4 })),
      ],
    },
    {
      id: "crank",
      kind: "group",
      center: R_PIVOT,
      arrow: false,
      pieces: [
        { kind: "box", size: [ARM, 0.12, 0.08], at: [ARM / 2, 0, 0] },
        { kind: "cylinder", radius: 0.12, length: 0.3, at: [ARM, 0, -0.1], accent: true },
        { kind: "cylinder", radius: 0.16, inner: 0.07, length: 0.15 },
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(rect(1.1, 1.8, -2.6, 0)), thickness: 0.1, at: [0, 0, -0.3] },
        { kind: "plate", shape: shape(rect(1.1, 1.8, 2.75, 0)), thickness: 0.1, at: [0, 0, -0.3] },
        { kind: "box", size: [6.4, 0.25, 0.1], at: [0.05, 0, -0.3] },
      ],
    },
  ],
  driver: { part: "small", type: "rotation", speed: 1.6 },
  target: "crank",
  view: { direction: [0.06, 0.05, 1] },
  pose(a) {
    const { big, psi } = crank(a);
    return { parts: { small: { angle: a }, big: { angle: big }, crank: { angle: psi } }, readouts: [] };
  },
};

