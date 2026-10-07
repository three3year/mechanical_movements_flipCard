// 第 383 種:整理布料與經紗的機械的主要元件:上下兩個滾筒,布(或紗)從一個繞到另一個上;中間是一個圓筒,表面可以是
// 光滑的,也可以裝刷子、起毛草等,看要做的工作而定(上漿機、起毛機、大多數整理織物的機械都用到)。
// 主動件是下面的滾筒(把布捲上來);上面的滾筒放出布;中間的圓筒裝著刷子,轉得比布快(推斷)。
// 推斷:中間圓筒的轉向與轉速;滾筒上的布捲厚度不隨捲收改變(示意)。三根軸都往後伸進機架上的橫樑(原圖機架有橫樑,
// 軸承沒畫清楚)。
import { Z, TAU, routeRope } from "./kit.js";
import { shape, circle, thickLine } from "./shapes.js";

const TOP = { center: [0, 2.1, 0], r: 0.7 };
const MID = { center: [0, 0, 0], r: 1.0 };
const LOW = { center: [0, -2.1, 0], r: 0.7 };
export const BRUSH = 3; // 中間圓筒的表面速度是布速的幾倍

/** 下滾筒轉 a(順時針為負,把布捲上)→ 布走過的長度、上滾筒與中間圓筒的轉角 */
export function cloth(a) {
  const travel = -a * LOW.r;
  return { travel, top: -travel / TOP.r, mid: (BRUSH * travel) / MID.r };
}

// 布的路徑:從上滾筒的右側放出,繞過中間圓筒的右側,捲到下滾筒的右側
const route = routeRope([
  { circle: { center: TOP.center, axis: Z, radius: TOP.r + 0.05, sense: -1 } },
  { circle: { center: MID.center, axis: Z, radius: MID.r + 0.08, sense: -1 } },
  { circle: { center: LOW.center, axis: Z, radius: LOW.r + 0.05, sense: -1 } },
]);

const brushes = Array.from({ length: 10 }, (_, i) => ({ kind: "box", size: [0.28, 0.18, 0.5], at: [(MID.r - 0.12) * Math.cos((i * TAU) / 10), (MID.r - 0.12) * Math.sin((i * TAU) / 10), 0], angle: (i * TAU) / 10, accent: i === 0 }));
const axle = { kind: "cylinder", radius: 0.1, length: 0.55, at: [0, 0, -0.35] }; // 往後伸進機架橫樑的軸

export default {
  figure: 383,
  parts: [
    {
      id: "frame",
      kind: "plate",
      center: [0, 0, -0.4],
      shape: shape(thickLine([[-1.45, -3.1], [-1.45, 2.1], [-0.9, 3.0], [0.9, 3.0], [1.45, 2.1], [1.45, -3.1]], 0.3)),
      thickness: 0.2,
      // 三根橫樑,各在一根軸的高度,軸往後伸進去
      pieces: [TOP, MID, LOW].map((c) => ({ kind: "box", size: [2.9, 0.26, 0.2], at: [0, c.center[1], -0.1] })),
    },
    { id: "topRoller", kind: "group", center: TOP.center, spin: TOP.r, pieces: [{ kind: "cylinder", radius: TOP.r, length: 0.5, mark: true }, axle] },
    { id: "lowRoller", kind: "group", center: LOW.center, spin: LOW.r, pieces: [{ kind: "cylinder", radius: LOW.r, length: 0.5, mark: true }, axle] },
    {
      id: "cylinder",
      kind: "group",
      spin: MID.r,
      pieces: [
        { kind: "plate", shape: shape(circle(MID.r - 0.25), [circle(0.12).reverse()]), thickness: 0.4 },
        { kind: "cylinder", radius: 0.3, length: 0.5 },
        axle,
        ...Array.from({ length: 4 }, (_, i) => ({ kind: "box", size: [2 * MID.r - 0.6, 0.08, 0.3], angle: (i * Math.PI) / 4 })),
        ...brushes,
      ],
    },
    { id: "cloth", kind: "belt" },
  ],
  driver: { part: "lowRoller", type: "rotation", speed: -0.8 },
  target: "cylinder", // 整理布料的中間圓筒
  view: { direction: [0.06, 0.05, 1] },
  pose(a) {
    const c = cloth(a);
    return {
      parts: { lowRoller: { angle: a }, topRoller: { angle: c.top }, cylinder: { angle: c.mid } },
      paths: { cloth: { points: route.points, closed: false, phase: c.travel } },
      readouts: [],
    };
  },
};
