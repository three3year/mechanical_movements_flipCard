// 第 27 種:多重齒輪傳動。較小的三角形輪轉動時,裝在它三個角上的摩擦滾子在大輪的徑向溝槽內滑動,
// 帶動大輪轉動。三角形輪的軸偏離大輪軸心,偏移量等於滾子離三角形輪軸的距離,
// 所以滾子走的圓通過大輪軸心:從大輪軸心看,每個滾子的方向都以三角形輪一半的速度轉(圓周角定理),
// 三個滾子永遠落在相鄰的三道溝槽裡,沿溝槽進出。大輪因此以三角形輪一半的轉速同向轉動。
import { TAU, deg, polar } from "./kit.js";
import { circle, arcPoints, polarOutline, shape } from "./shapes.js";

const R = { rim: 3.1, rimInner: 2.78, block: 2.7 };
const GROOVES = 6;
const HALF_GROOVE = 0.21;
const E = 1.49; // 三角形輪軸離大輪軸心的距離 = 滾子離三角形輪軸的距離
const BETA = deg(-80); // 三角形輪軸在大輪軸心的下方
const C = polar(E, BETA);
const Z = { back: -0.35, blocks: -0.08, rollers: -0.06, spider: 0.32 };

/** 三角形輪轉 phi 時大輪的轉角:滾子 0 的方向(從大輪軸心看)落在溝槽 0 上 */
export const wheelAngle = (phi) => (phi + BETA) / 2;
/** 三角形輪轉 phi 時第 k 個滾子的位置 */
export const roller = (phi, k) => {
  const p = polar(E, phi + (k * TAU) / 3);
  return [C[0] + p[0], C[1] + p[1], 0];
};
export const GROOVE_COUNT = GROOVES;

// 相鄰兩道溝槽之間的扇形凸塊(溝槽在局部角 j·60°,寬 2·HALF_GROOVE)
function block(j) {
  const g1 = (j * TAU) / GROOVES;
  const g2 = g1 + TAU / GROOVES;
  const apex = HALF_GROOVE / Math.sin(TAU / GROOVES / 2);
  const mid = (g1 + g2) / 2;
  const a1 = g1 + Math.asin(HALF_GROOVE / R.block);
  const a2 = g2 - Math.asin(HALF_GROOVE / R.block);
  return shape([[apex * Math.cos(mid), apex * Math.sin(mid)], ...arcPoints(R.block, a1, a2)]);
}

const spider = polarOutline((a) => 1.0 + 0.62 * Math.max(0, Math.cos(3 * a)) ** 1.5, 180); // 三瓣形,瓣尖蓋住滾子

export default {
  figure: 27,
  parts: [
    {
      id: "wheel",
      kind: "group",
      spin: R.rim,
      pieces: [
        { kind: "plate", shape: { outline: circle(R.rim), holes: [] }, thickness: 0.15, at: [0, 0, Z.back] },
        { kind: "cylinder", radius: R.rim, inner: R.rimInner, length: 0.55, at: [0, 0, Z.back + 0.2] },
        ...Array.from({ length: GROOVES }, (_, j) => ({ kind: "plate", shape: block(j), thickness: 0.36, at: [0, 0, Z.blocks], ...(j === 0 ? { mark: [1.9, 0.6], markSize: 0.14 } : {}) })),
        { kind: "cylinder", radius: 0.16, length: 2.2, at: [0, 0, -1.2] },
      ],
    },
    {
      id: "spider",
      kind: "group",
      center: [C[0], C[1], 0],
      spin: 1.5,
      spinOffset: Z.spider,
      pieces: [
        { kind: "plate", shape: { outline: spider, holes: [] }, thickness: 0.16, at: [0, 0, Z.spider], mark: [0.7, 0] },
        ...[0, 1, 2].flatMap((k) => {
          const p = polar(E, (k * TAU) / 3);
          return [
            { kind: "cylinder", radius: 0.17, length: 0.34, at: [p[0], p[1], Z.rollers] },
            { kind: "cylinder", radius: 0.07, length: 0.62, at: [p[0], p[1], 0.18] },
            { kind: "cylinder", radius: 0.22, length: 0.14, at: [p[0], p[1], Z.spider + 0.14] },
          ];
        }),
        { kind: "cylinder", radius: 0.16, length: 2.4, at: [0, 0, 1.4] },
      ],
    },
  ],
  driver: { part: "spider", type: "rotation" },
  target: "wheel", // 以半速被帶動的大輪
  view: { direction: [-0.32, 0.22, 1] },
  pose(phi) {
    return { parts: { spider: { angle: phi }, wheel: { angle: wheelAngle(phi) } }, readouts: [] };
  },
};
