// 第 348 種:軸轉一圈,桿往復兩次(B. F. Snyder,1836 年專利;J. S. McCurdy 用來驅動縫紉機的針,也驅動成組的鋸)。
// 中央旋轉軸上的碟片 A 有兩道在中心以直角交叉的溝槽 a、a;桿 B 上以樞軸裝著兩個滑塊 c、c,各在一道溝槽裡。
// 桿 B 只能平移(不轉),兩個滑塊在碟片上像橢圓規一樣滑動,所以碟片轉一圈,桿上每一點繞小圓轉兩圈,
// 桿的上下運動也就往復兩次。主動件是碟片 A。
// 推斷:桿 B 保持方向(只平移不轉動,桿上每一點畫小圓,上下的分量就是往復);兩滑塊的間距。
import { TAU, deg } from "./kit.js";
import { shape, circle, rect } from "./shapes.js";

const D = 0.95; // 兩滑塊的間距
const R = 2.1;
const BETA = deg(-90); // 桿 B 的方向(從上滑塊指向下滑塊):往下

/** 碟片轉 theta → 兩滑塊的位置與桿的位移(以兩滑塊中點表示) */
export function snyder(theta) {
  const alpha = BETA - Math.PI - theta; // 桿在碟片座標中的方向
  const rot = ([x, y]) => [x * Math.cos(theta) - y * Math.sin(theta), x * Math.sin(theta) + y * Math.cos(theta), 0];
  const c1 = rot([D * Math.cos(alpha), 0]); // 在溝槽 1(碟片的 x 軸)上
  const c2 = rot([0, -D * Math.sin(alpha)]); // 在溝槽 2(碟片的 y 軸)上
  const mid = [(c1[0] + c2[0]) / 2, (c1[1] + c2[1]) / 2, 0];
  return { c1, c2, mid };
}

// 溝槽:碟面上兩條凸起的邊(溝槽 1 沿碟片局部 x 偏 30°、溝槽 2 與它垂直,滑塊在兩邊之間)
// 一道溝槽:兩側的槽壁,在兩道溝交會的中心處斷開(滑塊才能從一道溝穿過另一道溝)
const WALL = R - 0.15 - 0.3;
const groove = (angle) =>
  [1, -1].flatMap((sx) => [1, -1].map((sy) => ({ kind: "plate", shape: shape(rect(WALL, 0.09, sx * (0.3 + WALL / 2), sy * 0.165)), thickness: 0.08, at: [0, 0, 0.1], angle })));

export default {
  figure: 348,
  parts: [
    {
      id: "diskA",
      kind: "group",
      spin: R,
      label: "A",
      labelOffset: [-1.1, -0.3, 0.3],
      pieces: [
        { kind: "plate", shape: shape(circle(R), [circle(0.12).reverse()]), thickness: 0.12 },
        ...groove(deg(30)),
        ...groove(deg(120)),
        { kind: "box", size: [0.2, 0.2, 0.15], at: [R - 0.2, 0, 0.08], accent: true },
      ],
    },
    { id: "labelA1", kind: "group", center: [-1.3, -0.75, 0.3], label: "a", labelOffset: [0, 0, 0] },
    { id: "labelA2", kind: "group", center: [-0.8, 1.25, 0.3], label: "a", labelOffset: [0, 0, 0] },
    { id: "barB", kind: "group", arrow: false, label: "B", labelOffset: [0.15, 2.6, 0.4], pieces: [{ kind: "box", size: [0.5, 4.2, 0.1], at: [0, 1.6, 0.25] }] },
    { id: "sliderC1", kind: "box", size: [0.3, 0.2, 0.14], label: "c", labelOffset: [0.3, 0.1, 0.3] },
    { id: "sliderC2", kind: "box", size: [0.3, 0.2, 0.14], label: "c", labelOffset: [0.3, 0.1, 0.3] },
  ],
  driver: { part: "diskA", type: "rotation" },
  target: "barB", // 每圈往復兩次的桿
  view: { direction: [0.03, 0.04, 1] },
  pose(theta) {
    const s = snyder(theta + deg(30));
    const z = (q, dz) => [q[0], q[1], dz];
    return {
      parts: {
        diskA: { angle: theta },
        sliderC1: { position: z(s.c1, 0.13), angle: theta + deg(30) },
        sliderC2: { position: z(s.c2, 0.13), angle: theta + deg(120) },
        barB: { position: [s.mid[0], s.mid[1], 0] },
      },
      readouts: [],
    };
  },
};
