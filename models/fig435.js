// 第 435 種:華倫中央排水式渦輪機的平面圖。導葉 a 在外側,輪 b 在導葉內側旋轉,水從中央排出。
// 主動件是虛擬的「進程」:水已帶著輪轉了幾圈。
// 推斷:水從外圍經導葉轉向後往內衝進輪上的水斗,推輪逆時針轉(原圖輪內側的箭頭),從中央流出;導葉與水斗的數目依原圖。
import { TAU, deg, polar } from "./kit.js";
import { stream } from "./flow.js";
import { blades, bladePath } from "./turbine.js";
import { shape, circle, rect } from "./shapes.js";

export const GUIDE = { count: 24, r0: 2.0, r1: 1.52, sweep: deg(28) };
export const WHEEL = { count: 22, r0: 1.45, r1: 0.95, sweep: deg(-32) };
const SPEED = TAU * 1.1;

// 水:從外圍沿導葉往內(逆時針轉向),穿過水斗,從中央排出
const paths = [0, 6, 12, 18].map((k) => {
  const a = (k * TAU) / GUIDE.count + deg(4);
  const outer = bladePath(GUIDE.r0 + 0.25, GUIDE.r1, a, GUIDE.sweep, 0.25);
  const end = outer[outer.length - 1];
  const at = Math.atan2(end[1], end[0]);
  return [...outer, polar(1.2, at + deg(18), 0.25), polar(0.75, at + deg(30), 0.25), polar(0.3, at + deg(36), 0.25)];
});

export default {
  figure: 435,
  parts: [
    {
      id: "guides",
      kind: "group",
      label: "a",
      labelOffset: [1.75, -0.65, 0.4],
      pieces: [
        { kind: "plate", shape: shape(circle(2.08), [circle(2.02).reverse()]), thickness: 0.36 },
        { kind: "plate", shape: shape(circle(2.08), [circle(1.5).reverse()]), thickness: 0.04, at: [0, 0, -0.2] },
        ...blades({ ...GUIDE, thickness: 0.34 }),
      ],
    },
    {
      id: "wheel",
      kind: "group",
      label: "b",
      labelOffset: [0.15, -1.25, 0.4],
      spin: 1.6,
      pieces: [
        { kind: "plate", shape: shape(circle(1.47), [circle(1.42).reverse()]), thickness: 0.06, at: [0, 0, 0.18] },
        { kind: "plate", shape: shape(circle(0.97), [circle(0.92).reverse()]), thickness: 0.36 },
        ...blades({ ...WHEEL, thickness: 0.34 }),
        // 中央的十字輻與軸轂
        { kind: "plate", shape: shape(rect(1.9, 0.12)), thickness: 0.08, at: [0, 0, -0.1] },
        { kind: "plate", shape: shape(rect(0.12, 1.9)), thickness: 0.08, at: [0, 0, -0.1] },
        { kind: "plate", shape: shape(circle(0.2), [circle(0.08).reverse()]), thickness: 0.3, mark: [0.12, 0], markSize: 0.05 },
      ],
    },
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.12 },
  target: "wheel",
  view: { direction: [0.03, 0.05, 1] },
  pose(progress) {
    const travel = progress * SPEED;
    return {
      parts: { wheel: { angle: TAU * progress } },
      flows: [{ fluid: "water", points: paths.flatMap((p) => stream(p, travel, { spacing: 0.18 })) }],
      readouts: [],
    };
  },
};
