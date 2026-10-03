// 第 434 種:福內隆渦輪水車的平面圖。中央有許多固定的彎曲導水槽(導葉)A,把水導向外側旋轉輪 B 的水斗,水從圓周排出。
// 主動件是虛擬的「進程」:水已帶著輪轉了幾圈。原圖箭頭:順時針。
// 推斷:導葉與水斗的數目、彎曲程度依原圖;水從中央往外,沿導葉轉向後衝進水斗,推著輪順時針轉,從外圈甩出。
import { TAU, deg, polar } from "./kit.js";
import { stream } from "./flow.js";
import { blades, bladePath } from "./turbine.js";
import { shape, circle } from "./shapes.js";

export const GUIDE = { count: 12, r0: 0.3, r1: 1.12, sweep: deg(-55) };
export const WHEEL = { count: 18, r0: 1.22, r1: 1.95, sweep: deg(40) };
const SPEED = TAU * 1.2;

// 水:沿導葉往外(順時針轉向),再穿過水斗從外圈排出
const paths = [0, 3, 6, 9].map((k) => {
  const a = (k * TAU) / GUIDE.count + deg(8);
  const inner = bladePath(GUIDE.r0 + 0.05, GUIDE.r1, a, GUIDE.sweep, 0.25);
  const end = inner[inner.length - 1];
  const out = Math.atan2(end[1], end[0]);
  return [...inner, polar(1.6, out - deg(16), 0.25), polar(2.25, out - deg(40), 0.25)];
});

export default {
  figure: 434,
  parts: [
    {
      id: "guides",
      kind: "group",
      label: "A",
      labelOffset: [0.05, 0.25, 0.4],
      pieces: [
        { kind: "plate", shape: shape(circle(1.15), [circle(0.18).reverse()]), thickness: 0.04, at: [0, 0, -0.2] },
        ...blades({ ...GUIDE, thickness: 0.36 }),
        { kind: "plate", shape: shape(circle(0.2), [circle(0.12).reverse()]), thickness: 0.4 },
      ],
    },
    {
      id: "wheel",
      kind: "group",
      label: "B",
      labelOffset: [-1.45, -1.55, 0.4],
      spin: 2.15,
      pieces: [
        { kind: "plate", shape: shape(circle(1.97), [circle(1.92).reverse()]), thickness: 0.06, at: [0, 0, 0.18] },
        { kind: "plate", shape: shape(circle(1.24), [circle(1.19).reverse()]), thickness: 0.06, at: [0, 0, 0.18], mark: [0, 1.21], markSize: 0.06 },
        { kind: "plate", shape: shape(circle(1.97), [circle(1.19).reverse()]), thickness: 0.04, at: [0, 0, -0.18] },
        ...blades({ ...WHEEL, thickness: 0.36 }),
      ],
    },
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.12 },
  target: "wheel",
  view: { direction: [0.03, 0.05, 1] },
  pose(progress) {
    const travel = progress * SPEED;
    return {
      parts: { wheel: { angle: -TAU * progress } },
      flows: [{ fluid: "water", points: paths.flatMap((p) => stream(p, travel, { spacing: 0.18 })) }],
      readouts: [],
    };
  },
};
