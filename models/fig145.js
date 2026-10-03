// 第 145 種:樑的往復曲線運動,使曲柄與飛輪連續旋轉。樑的右端是樞軸,左端以一根直立連桿往下接到一根水平槓桿;
// 槓桿的右端裝在小支架上,左端附近再以連桿接到飛輪的曲柄銷。樑上下擺動,槓桿隨之擺動,經連桿使曲柄轉動。
// 為了讓模型通過死點,主動件取飛輪(曲柄),由它反推槓桿與樑的位置(兩者的運動關係相同)。
import { polar, dist } from "./kit.js";
import { circleCircle, angleOf } from "./linkage.js";
import { shape, circle } from "./shapes.js";

const WHEEL = { center: [0, 0, 0], radius: 1.55, crank: 0.6 };
const B = [3.35, 0, 0]; // 槓桿在支架上的樞軸
const J0 = [1.7, 0, 0]; // 槓桿上接連桿與直立桿的點
const PB = [4.3, 3.0, 0]; // 樑的樞軸
const E0 = [1.7, 2.95, 0]; // 樑的左端
const PIN0 = Math.PI; // 原圖:曲柄銷在飛輪中心的左邊
const LB = dist(B, J0);
const LC = dist(J0, polar(WHEEL.crank, PIN0));
const LV = dist(E0, J0);
const LBEAM = dist(PB, E0);

/** 飛輪轉 theta:曲柄銷、槓桿上的接點、樑的左端 */
export function beamEngine(theta) {
  const pin = polar(WHEEL.crank, PIN0 + theta);
  const j = circleCircle(B, LB, pin, LC, -1).point;
  const e = circleCircle(PB, LBEAM, j, LV, -1).point;
  return { pin, j, e };
}

const z = (p, d) => [p[0], p[1], d];

export default {
  figure: 145,
  parts: [
    {
      id: "wheel",
      kind: "pulley",
      style: "spoked",
      radius: WHEEL.radius,
      width: 0.3,
      pieces: [{ kind: "cylinder", radius: 0.12, length: 0.5, at: [...polar(WHEEL.crank, PIN0).slice(0, 2), 0.3], accent: true }],
    },
    {
      id: "beam",
      kind: "group",
      center: PB,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape([[0.3, -0.3], [-LBEAM, -0.12], [-LBEAM, 0.18], [0.3, 0.3]], [circle(0.16).reverse(), circle(0.07, -LBEAM, 0).reverse()]), thickness: 0.2 },
      ],
    },
    { id: "lever", kind: "link", width: 0.12, thickness: 0.08 },
    { id: "rod", kind: "link", width: 0.1, thickness: 0.06 },
    { id: "vertical", kind: "link", width: 0.08, thickness: 0.06 },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape([[-0.35, -0.95], [0.35, -0.95], [0.15, -0.1], [-0.15, -0.1]]), thickness: 0.3, at: [B[0], B[1], -0.1] },
        { kind: "box", size: [6.5, 0.08, 1.2], at: [1.6, -1.0, 0] },
      ],
    },
  ],
  driver: { part: "wheel", type: "rotation" },
  target: "beam", // 原文是樑帶動飛輪;模型以飛輪為主動件,目標件標運動鏈另一端的樑
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const { pin, j, e } = beamEngine(theta);
    return {
      parts: {
        wheel: { angle: theta },
        beam: { angle: angleOf(PB, e) - angleOf(PB, E0) },
        lever: { from: z(B, 0.35), to: z(j, 0.35) },
        rod: { from: z(j, 0.45), to: z(pin, 0.45) },
        vertical: { from: z(e, 0.45), to: z(j, 0.45) },
      },
      readouts: [],
    };
  },
};
