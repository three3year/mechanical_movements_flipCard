// 第 168 種:左邊引擎主軸上的開槽曲柄,與往復動力相連的抽送桿上裝一根銷,在曲柄的溝槽中作動。
// 抽送桿的中段接在一支半徑不變的第二曲柄上;第一支曲柄轉一圈時,抽送桿末端的銷被迫走一條橢圓形的軌跡,
// 在傳遞動力最有利的位置加長主曲柄的力臂。原圖的虛線是銷與第二曲柄銷的軌跡。
import { pitman, slotted, C1, C2, R2 } from "./pitman-crank.js";
import { BEAM } from "./pitman-crank.js";
import { shape, circle, stadium } from "./shapes.js";

/** 第二曲柄轉 phi:主曲柄轉角與曲柄長(銷在溝槽中的位置) */
export const mainCrank = slotted;

const z = (p, d) => [p[0], p[1], d];

// 銷的軌跡(作圖用的虛線,以細管畫出)
const path = Array.from({ length: 120 }, (_, i) => {
  const p = pitman((i / 120) * 2 * Math.PI).p;
  return [p[0] - C1[0], p[1] - C1[1], -0.3];
});

export default {
  figure: 168,
  parts: [
    {
      id: "main",
      kind: "group",
      center: C1,
      spin: 1.0,
      pieces: [
        { kind: "plate", shape: shape(stadium(1.35, 0.5).outline.map(([x, y]) => [x - 0.1, y]), [stadium(0.75, 0.2).outline.map(([x, y]) => [x + 0.38, y]).reverse(), circle(0.1).reverse()]), thickness: 0.12 },
        { kind: "cylinder", radius: 0.28, inner: 0.1, length: 0.25 },
      ],
    },
    { id: "orbit", kind: "group", center: C1, pieces: [{ kind: "tube", points: path, radius: 0.015, closed: true }] },
    {
      id: "second",
      kind: "group",
      center: C2,
      spin: R2 + 0.2,
      pieces: [
        { kind: "plate", shape: shape(stadium(R2, 0.3).outline, [circle(0.08).reverse()]), thickness: 0.12 },
        { kind: "cylinder", radius: 0.2, inner: 0.08, length: 0.2 },
      ],
    },
    { id: "pitman", kind: "link", width: 0.45, thickness: 0.1 },
    { id: "pin", kind: "cylinder", radius: 0.08, length: 0.4 },
    { id: "rod", kind: "link", width: 0.35, thickness: 0.1 },
  ],
  driver: { part: "second", type: "rotation" },
  target: "main", // 引擎主軸的曲柄(往復動力經抽送桿傳給它)
  view: { direction: [0.06, 0.05, 1] },
  pose(phi) {
    const { r, p } = pitman(phi);
    const { angle } = slotted(phi);
    return {
      parts: {
        second: { angle: phi },
        main: { angle },
        pitman: { from: z(p, -0.15), to: z(r, -0.15) },
        pin: { position: z(p, 0.1) },
        rod: { from: z(r, -0.3), to: z(BEAM, -0.3) },
      },
      readouts: [],
    };
  },
};

