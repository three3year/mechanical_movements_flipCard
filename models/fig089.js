// 第 89 種:曲柄軸上的偏心輪,把旋轉變成往復直線運動,傳給蒸汽引擎的閥門(有時也用於抽水)。
// 偏心輪(圓盤)套在軸上、圓心偏離軸心;外面套著上下兩半以螺栓合起的偏心環(皮帶),環上伸出的桿
// 經凸緣接頭連到閥桿。偏心輪轉一圈,桿往返一次,行程是偏心距的兩倍。主動件是曲柄軸。
// 桿的另一端接閥桿,閥桿在固定的導座裡直線往復(推斷,原圖畫到接頭為止),所以環與桿跟著一起擺動。
import { X, polar } from "./kit.js";
import { sliderOnLine, angleOf } from "./linkage.js";
import { shape, circle, rect } from "./shapes.js";
import { pedestal, squareGuide } from "./supports.js";

const E = 0.62; // 偏心距
const DISC = 1.12; // 偏心輪半徑
const ROD = 3.6; // 偏心輪圓心到閥桿導軌端的距離
const SHAFT = [0, 0, 0];
const START = Math.PI; // 原圖:軸在偏心輪的左側,即偏心輪圓心在軸的右邊
const GUIDE_X = 4.8; // 閥桿導座:桿端在 2.93–4.22 之間往復,閥桿(桿端右方 0.2–2.2)始終穿過這裡

/** 軸轉 theta:偏心輪圓心、桿端(導軌上)位置、環的轉角 */
export function eccentric(theta) {
  const c = polar(E, theta + START - Math.PI);
  const end = sliderOnLine(c, ROD, [0, 0, 0], [1, 0, 0], 1).point;
  return { c, end, x: end[0], strap: angleOf(c, end) };
}
export const throwRadius = E;

const strapShape = shape(
  [
    ...circle(DISC + 0.32).map(([x, y]) => [x, y]),
  ],
  [circle(DISC + 0.03).reverse()],
);

export default {
  figure: 89,
  parts: [
    {
      id: "shaft",
      kind: "group",
      center: SHAFT,
      spin: DISC + 0.1,
      pieces: [
        { kind: "plate", shape: shape(circle(DISC, E, 0), [circle(0.3).reverse()]), thickness: 0.3, mark: [E + 0.6, 0], markSize: 0.09 },
        { kind: "cylinder", radius: 0.32, length: 1.4, at: [0, 0, -0.25] }, // 曲柄軸,往後伸進軸承座
      ],
    },
    {
      id: "strap",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: strapShape, thickness: 0.26 },
        { kind: "plate", shape: { outline: rect(0.9, 0.36, 0, DISC + 0.45), holes: [] }, thickness: 0.3 },
        { kind: "plate", shape: { outline: rect(0.9, 0.36, 0, -DISC - 0.45), holes: [] }, thickness: 0.3 },
        ...[1, -1].flatMap((s) => [
          { kind: "cylinder", radius: 0.08, length: 0.35, axis: [0, 1, 0], at: [-0.55, s * (DISC + 0.45), 0] },
          { kind: "cylinder", radius: 0.08, length: 0.35, axis: [0, 1, 0], at: [0.55, s * (DISC + 0.45), 0] },
        ]),
        { kind: "box", size: [0.9, 0.26, 0.2], at: [DISC + 0.65, 0, 0] },
        { kind: "plate", shape: { outline: rect(0.2, 1.1, DISC + 1.2, 0), holes: [] }, thickness: 0.3 },
      ],
    },
    { id: "rod", kind: "link", width: 0.3, thickness: 0.18, pins: false },
    { id: "stem", kind: "group", pieces: [{ kind: "cylinder", axis: X, radius: 0.12, length: 2.0, at: [1.2, 0, 0] }, { kind: "cylinder", radius: 0.2, inner: 0.1, length: 0.3 }] },
    {
      // 閥桿的導座(推斷,原圖畫到接頭為止):軸套立在底座上,閥桿在套裡往復
      id: "guide",
      kind: "group",
      pieces: [
        { kind: "cylinder", axis: X, radius: 0.26, inner: 0.13, length: 0.36, at: [GUIDE_X, 0, 0] },
        { kind: "box", size: [0.3, 1.3, 0.22], at: [GUIDE_X, -0.91, 0] },
        { kind: "box", size: [1.0, 0.16, 0.6], at: [GUIDE_X, -1.6, 0] },
        // 曲柄軸的軸承座(推斷),在偏心環後面
        ...pedestal({ at: [0, 0], z: -0.7, bore: 0.33, floor: -2.2 }),
      ],
    },
  ],
  driver: { part: "shaft", type: "rotation" },
  target: "stem", // 往復直線運動的閥桿
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const { c, end, strap } = eccentric(theta);
    const flange = [c[0] + (DISC + 1.25) * Math.cos(strap), c[1] + (DISC + 1.25) * Math.sin(strap), 0];
    return {
      parts: {
        shaft: { angle: theta },
        strap: { position: c, angle: strap },
        rod: { from: flange, to: end },
        stem: { position: end },
      },
      readouts: [],
    };
  },
};
