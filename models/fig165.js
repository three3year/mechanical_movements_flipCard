// 第 165 種:直立軸上的波狀輪(凸輪):輪緣的下沿做成波浪形。搖動桿右端的滾子頂著波浪的下沿,
// 輪轉動時滾子隨波浪上下,搖動桿繞中間的樞軸擺動,左端經連桿帶動直立桿上下直線運動。主動件是直立軸。
import { Y, TAU, planeAngle } from "./kit.js";

const R = 1.55; // 波浪所在的半徑
const WAVES = 6;
const AMP = 0.16;
const RIM_Y = 0.0; // 波浪下沿的平均高度
const ROLLER = 0.3;
const FRONT = planeAngle(Y, [0, 0, 1]); // 朝向觀看者的那一點在輪的局部角
const PIVOT = [-1.3, -0.75, R]; // 搖動桿的樞軸(在輪前方)
const A = 1.3; // 樞軸到滾子
const B = 1.4; // 樞軸到左端
const ROD_X = PIVOT[0] - B;

/** 輪緣下沿在輪的局部角 phi 處的高度 */
export const wave = (phi) => RIM_Y - AMP * Math.cos(WAVES * phi);

/** 軸轉 theta:滾子中心的高度、搖動桿的轉角與直立桿的高度 */
export function rocker(theta) {
  const y = wave(FRONT - theta) - ROLLER;
  const angle = Math.asin((y - PIVOT[1]) / A);
  return { y, angle, rod: PIVOT[1] - B * Math.sin(angle) };
}

const rimEdge = Array.from({ length: 241 }, (_, i) => {
  const phi = (i / 240) * TAU;
  return [R * Math.cos(phi), R * Math.sin(phi), wave(phi)];
});

export default {
  figure: 165,
  parts: [
    {
      id: "wheel",
      kind: "group",
      axis: Y,
      spin: R + 0.1,
      spinOffset: 0.4,
      pieces: [
        { kind: "cylinder", radius: R + 0.05, length: 0.32, at: [0, 0, 0.45] },
        { kind: "cylinder", radius: R + 0.05, inner: R - 0.12, length: 0.28, at: [0, 0, 0.15] },
        { kind: "tube", points: rimEdge, radius: 0.06, closed: true },
        { kind: "cylinder", radius: 0.45, length: 1.4, at: [0, 0, 1.2] },
        { kind: "cylinder", radius: 0.2, length: 0.6, at: [0, 0, 0.9] },
      ],
    },
    {
      id: "rocker",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "box", size: [A + B, 0.14, 0.1], at: [(A - B) / 2, 0, 0] },
        { kind: "cylinder", radius: ROLLER, inner: 0.1, length: 0.25, at: [A, 0, 0] },
        { kind: "cylinder", radius: 0.16, inner: 0.07, length: 0.2 },
      ],
    },
    { id: "rod", kind: "group", pieces: [{ kind: "cylinder", axis: Y, radius: 0.06, length: 1.6, at: [0, -0.8, 0] }, { kind: "cylinder", radius: 0.16, inner: 0.07, length: 0.2 }] },
  ],
  driver: { part: "wheel", type: "rotation", speed: 0.5 },
  view: { direction: [0.08, 0.15, 1] },
  pose(theta) {
    const { angle, rod } = rocker(theta);
    return { parts: { wheel: { angle: theta }, rocker: { angle }, rod: { position: [ROD_X, rod, PIVOT[2]] } }, readouts: [] };
  },
};

