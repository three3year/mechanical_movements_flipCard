// 第 436 種:容瓦爾渦輪機。「導水槽」排在一個鼓輪的外側,以共同中心放射排列,固定在筒身(外殼)b 裡;
// 輪 c 的做法幾乎相同,但水斗比導水槽多,而且略呈切線方向而非放射方向排列,常用的曲線是擺線或拋物線。
// 主動件是虛擬的「進程」:水已帶著輪轉了幾圈。
// 推斷(依原圖):水從右上的水管進到筒身,往下穿過固定的導水槽 a,再穿過下面的輪 c,從底部流出;
// 輪裝在直立軸的下端,軸穿過筒蓋伸到上面,下端立在底部橫樑的軸承上。外殼畫成剖面。
import { TAU, Y, quatAxisAngle, quatMul, deg } from "./kit.js";
import { stream } from "./flow.js";
import { backHalf } from "./section.js";

const R = { case: 1.5, drum: 0.5 };
export const GUIDE = { y: -0.55, count: 14, tilt: deg(40) };
export const WHEEL = { y: -1.2, count: 20, tilt: deg(-45) };
const TOP = 1.9;
const BOTTOM = -1.6;
const SPEED = TAU * 1.2;

// 一圈斜置的葉片(局部 x 沿半徑,繞自己的半徑方向斜置)
const ring = ({ count, tilt }, r0, r1, height) =>
  Array.from({ length: count }, (_, i) => {
    const a = (i * TAU) / count;
    const mid = (r0 + r1) / 2;
    return {
      kind: "box",
      size: [r1 - r0, height, 0.04],
      at: [mid * Math.cos(a), 0, -mid * Math.sin(a)],
      rotation: quatMul(quatAxisAngle(Y, a), quatAxisAngle([1, 0, 0], tilt)),
    };
  });

const INLET = [[3.0, 1.75, 0.3], [1.6, 1.1, 0.3], [0.9, 0.5, 0.4]];
const DOWN = [-0.9, 0.95].map((x) => [[x, 0.4, 0.4], [x, GUIDE.y, 0.4], [x * 0.95, WHEEL.y, 0.4], [x * 0.9, BOTTOM - 0.7, 0.4]]);

export default {
  figure: 436,
  parts: [
    {
      id: "casing",
      kind: "lathe",
      axis: Y,
      label: "b",
      labelOffset: [-1.2, 0.9, 0.4],
      profile: [[R.case, BOTTOM + 0.6], [R.case + 0.1, BOTTOM + 0.6], [R.case + 0.1, TOP], [0.18, TOP], [0.18, TOP - 0.1], [R.case, TOP - 0.1]],
      ...backHalf(Y),
    },
    {
      id: "works",
      kind: "group",
      pieces: [
        // 右上的進水管
        { kind: "box", size: [1.8, 0.7, 0.9], at: [2.3, 1.45, 0], angle: deg(-32) },
        // 固定的導水槽(鼓輪外側一圈)
        { kind: "cylinder", radius: R.drum, length: 0.4, axis: Y, at: [0, GUIDE.y, 0] },
        ...ring(GUIDE, R.drum, R.case, 0.4).map((p) => ({ ...p, at: [p.at[0], GUIDE.y, p.at[2]] })),
        // 底部的橫樑與軸承
        { kind: "box", size: [3.2, 0.14, 0.4], at: [0, BOTTOM - 0.35, 0] },
        { kind: "box", size: [0.14, 0.5, 0.4], at: [-1.45, BOTTOM - 0.15, 0] },
        { kind: "box", size: [0.14, 0.5, 0.4], at: [1.45, BOTTOM - 0.15, 0] },
        { kind: "cylinder", radius: 0.12, length: 0.15, axis: Y, at: [0, BOTTOM - 0.22, 0] },
      ],
    },
    { id: "labelA", kind: "group", label: "a", labelOffset: [-1.05, GUIDE.y + 0.35, 0.5], pieces: [] },
    { id: "water", kind: "fill", fluid: "water", shape: "cylinder", center: [0, (GUIDE.y + 1.25) / 2 + 0.15, 0], size: [2 * R.case - 0.06, 1.25 - GUIDE.y - 0.3, 0], level: 1 },
    {
      id: "wheel",
      kind: "group",
      axis: Y,
      center: [0, WHEEL.y, 0],
      label: "c",
      labelOffset: [0.05, -0.55, 0.6],
      spin: R.case + 0.1,
      pieces: [
        // 局部 z 是直立方向
        { kind: "cylinder", radius: 0.08, length: TOP - WHEEL.y + 0.6, at: [0, 0, (TOP - WHEEL.y + 0.6) / 2 - 0.15] },
        { kind: "cylinder", radius: R.drum, length: 0.4 },
        { kind: "cylinder", radius: 0.22, length: 0.14, at: [0, 0, TOP - WHEEL.y + 0.25], accent: true },
      ],
    },
    {
      id: "buckets",
      kind: "group",
      center: [0, WHEEL.y, 0],
      arrow: false,
      pieces: ring(WHEEL, R.drum, R.case - 0.04, 0.4),
    },
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.15 },
  target: "wheel",
  view: { direction: [0.25, 0.35, 1] },
  pose(progress) {
    const a = TAU * progress;
    const travel = progress * SPEED;
    return {
      parts: { wheel: { angle: a }, buckets: { rotation: quatAxisAngle(Y, a) } },
      flows: [{ fluid: "water", points: [...stream(INLET, travel, { spacing: 0.2 }), ...DOWN.flatMap((p) => stream(p, travel, { spacing: 0.2 }))] }],
      readouts: [],
    };
  },
};
