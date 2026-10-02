// 第 169 種:第 168 種的變形,以一根短連桿把抽送桿接到主曲柄上,省去曲柄上的溝槽。
// 抽送桿的中段接在半徑不變的第二曲柄上,一端經短連桿帶動半徑固定的主曲柄。主動件是第二曲柄。
// 原圖與第 168 種左右相反(主曲柄在右),這裡把第 168 種的幾何左右翻轉。
import { pitman, linked, C1, C2, R2 } from "./pitman-crank.js";
import { BEAM } from "./pitman-crank.js";
import { shape, circle, stadium } from "./shapes.js";

const R1 = 0.76;
const LINK = 0.5;
// 左右翻轉:點的 x 取負,角度 a → π − a;翻轉後的轉角 ψ 對應原本的 π − ψ
const fx = (p) => [-p[0], p[1], p[2] ?? 0];
const fa = (a) => Math.PI - a;
const MC1 = fx(C1);
const MC2 = fx(C2);
const MBEAM = fx(BEAM);

/** 第二曲柄轉 psi:主曲柄的轉角、抽送桿一端與主曲柄銷(已翻轉) */
export function mainCrank(psi) {
  const { p, q, angle } = linked(fa(psi), R1, LINK);
  return { p: fx(p), q: fx(q), angle: fa(angle) };
}
export const sizes = { R1, LINK };

const z = (p, d) => [p[0], p[1], d];

export default {
  figure: 169,
  parts: [
    {
      id: "main",
      kind: "group",
      center: MC1,
      spin: R1 + 0.2,
      pieces: [
        { kind: "plate", shape: shape(stadium(R1, 0.4).outline, [circle(0.1).reverse(), circle(0.08, R1, 0).reverse()]), thickness: 0.12 },
        { kind: "cylinder", radius: 0.28, inner: 0.1, length: 0.25 },
      ],
    },
    {
      id: "second",
      kind: "group",
      center: MC2,
      spin: R2 + 0.2,
      pieces: [
        { kind: "plate", shape: shape(stadium(R2, 0.3).outline, [circle(0.08).reverse()]), thickness: 0.12 },
        { kind: "cylinder", radius: 0.2, inner: 0.08, length: 0.2 },
      ],
    },
    { id: "pitman", kind: "link", width: 0.45, thickness: 0.1 },
    { id: "link", kind: "link", width: 0.22, thickness: 0.08 },
    { id: "rod", kind: "link", width: 0.35, thickness: 0.1 },
  ],
  driver: { part: "second", type: "rotation" },
  view: { direction: [0.06, 0.05, 1] },
  pose(psi) {
    const r = fx(pitman(fa(psi)).r);
    const { p, q, angle } = mainCrank(psi);
    return {
      parts: {
        second: { angle: psi },
        main: { angle },
        pitman: { from: z(p, -0.15), to: z(r, -0.15) },
        link: { from: z(p, 0.32), to: z(q, 0.32) },
        rod: { from: z(r, -0.3), to: z(MBEAM, -0.3) },
      },
      readouts: [],
    };
  },
};
