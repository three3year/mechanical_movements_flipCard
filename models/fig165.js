// 第 165 種:直立軸上的波狀輪(凸輪):輪緣的下沿做成波浪形。搖動桿右端的滾子頂著波浪的下沿,
// 輪轉動時滾子隨波浪上下,搖動桿繞中間的樞軸擺動,左端經連桿帶動直立桿上下直線運動。主動件是直立軸。
import { Y, TAU, planeAngle } from "./kit.js";

const R = 1.55; // 波浪所在的半徑
const WAVES = 6;
const AMP = 0.16;
const RIM_Y = 0.0; // 波浪下沿的平均高度
const ROLLER = 0.3;
const RIDGE = 0.06; // 輪緣下沿凸條的半徑
const SIDE = 1; // 輪的局部角往觀看者右邊增加的方向
const FRONT = planeAngle(Y, [0, 0, 1]); // 朝向觀看者的那一點在輪的局部角
const PIVOT = [-1.3, -0.75, R]; // 搖動桿的樞軸(在輪前方)
const A = 1.3; // 樞軸到滾子
const B = 1.4; // 樞軸到左端
const ROD_X = PIVOT[0] - B;

/** 輪緣下沿在輪的局部角 phi 處的高度 */
export const wave = (phi) => RIM_Y - AMP * Math.cos(WAVES * phi);

/** 軸轉 theta:滾子中心的高度、搖動桿的轉角與直立桿的高度 */
export function rocker(theta) {
  // 滾子(圓)從下方貼上輪緣的凸條:在滾子的寬度內逐點找最先碰到的那一點
  // (滾子隨搖動桿擺動,中心不在正前方,所以先估轉角、再修正兩次)
  let y = 0;
  let angle = 0;
  for (let pass = 0; pass < 3; pass++) {
    const xc = PIVOT[0] + A * Math.cos(angle);
    y = Infinity;
    for (let i = -12; i <= 12; i++) {
      const dx = (i / 12) * (ROLLER + RIDGE) * 0.98;
      y = Math.min(y, wave(FRONT - theta + SIDE * Math.asin((xc + dx) / R)) - Math.sqrt((ROLLER + RIDGE) ** 2 - dx * dx));
    }
    angle = Math.asin((y - PIVOT[1]) / A);
  }
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
        { kind: "cylinder", radius: R + 0.05, inner: R - 0.12, length: 0.28, at: [0, 0, 0.33] }, // 輪緣的實體在波浪最高處之上
        { kind: "tube", points: rimEdge, radius: RIDGE, closed: true },
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
  target: "rod",
  view: { direction: [0.08, 0.15, 1] },
  pose(theta) {
    const { angle, rod } = rocker(theta);
    return { parts: { wheel: { angle: theta }, rocker: { angle }, rod: { position: [ROD_X, rod, PIVOT[2] + 0.16] } }, readouts: [] };
  },
};

