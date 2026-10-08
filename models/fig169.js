// 第 169 種:第 168 種的變形,以一根短連桿把抽送桿接到主曲柄上,省去曲柄上的溝槽。
// 抽送桿的中段接在半徑不變的第二曲柄上,一端經短連桿帶動半徑固定的主曲柄(目標件)。
// 主動件是往復動力:左邊從樞軸垂下的搖桿,往復擺動(見 pitman-crank.js;搖桿上端的樞軸與吊架是推斷)。
// 原圖與第 168 種左右相反(主曲柄在右),這裡把第 168 種的幾何左右翻轉。
// 結構推斷:原圖的兩個虛線圓是兩支曲柄銷的軌跡(預覽運動的線,不是零件,模型裡不畫),圓心各有一支固定的軸;抽送桿中段套在第二曲柄的銷上,
// 左端(翻轉後在右)的銷同時接著短連桿。原本的模型只有曲柄板、沒有銷與軸,各層之間看不出相連:這裡在兩支曲柄的
// 銷位置補上穿過抽送桿/短連桿的銷,抽送桿與短連桿的共用端補一支銷,兩支曲柄的軸往後延伸進機架上的軸承座
// (兩座立在同一塊底板上)。不改曲柄半徑與連桿長。
import { pitman, linked, secondAngle, C1, C2, R2, BEAM, ROD_LENGTH } from "./pitman-crank.js";
import { angleOf } from "./linkage.js";
import { shape, circle, stadium, arcPoints } from "./shapes.js";

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

// 機架:底板與兩個軸承座(在抽送桿後方),曲柄的軸往後穿進去
const FLOOR_TOP = -1.6;
const SEAT_Z = -0.55;
const seat = (c, bore) => ({
  kind: "plate",
  shape: shape([[-0.35, FLOOR_TOP - c[1]], [0.35, FLOOR_TOP - c[1]], ...arcPoints(0.3, -0.3, Math.PI + 0.3)], [circle(bore).reverse()]),
  thickness: 0.3,
  at: [c[0], c[1], SEAT_Z],
});

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
        { kind: "cylinder", radius: 0.1, length: 1.0, at: [0, 0, -0.4] }, // 軸:往後穿進軸承座
        { kind: "cylinder", radius: 0.08, length: 0.3, at: [R1, 0, 0.1], accent: true }, // 曲柄銷:穿過短連桿
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
        { kind: "cylinder", radius: 0.08, length: 1.0, at: [0, 0, -0.4] }, // 軸:往後穿進軸承座
        { kind: "cylinder", radius: 0.09, length: 0.5, at: [R2, 0, 0.25], accent: true }, // 曲柄銷:穿過抽送桿中段
      ],
    },
    { id: "pitman", kind: "link", width: 0.45, thickness: 0.1 },
    { id: "link", kind: "link", width: 0.22, thickness: 0.08 },
    { id: "pin", kind: "cylinder", radius: 0.08, length: 0.75 }, // 抽送桿與短連桿的共用端
    {
      id: "rod",
      kind: "group",
      center: [MBEAM[0], MBEAM[1], 0.52],
      arrow: false,
      pieces: [
        { kind: "box", size: [ROD_LENGTH, 0.3, 0.1], at: [ROD_LENGTH / 2, 0, 0] },
        { kind: "cylinder", radius: 0.2, inner: 0.07, length: 0.14 },
        { kind: "cylinder", radius: 0.07, length: 0.3, at: [ROD_LENGTH, 0, -0.12] }, // 接抽送桿一端的銷
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [7.2, 0.12, 1.0], at: [-0.4, FLOOR_TOP - 0.06, -0.2] },
        seat(MC1, 0.11),
        seat(MC2, 0.09),
        // 搖桿上端的樞軸:從後面的吊架伸出
        { kind: "cylinder", radius: 0.07, length: 1.3, at: [MBEAM[0], MBEAM[1], 0.0] },
        { kind: "box", size: [0.3, 1.0, 0.2], at: [MBEAM[0], MBEAM[1] + 0.4, -0.65] },
        { kind: "box", size: [2.0, 0.15, 0.6], at: [MBEAM[0], MBEAM[1] + 0.95, -0.4] },
      ],
    },
  ],
  driver: { part: "rod", type: "rotation", cycle: [0, Math.PI] },
  target: "main", // 引擎主軸的曲柄
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const psi = fa(secondAngle(v));
    const r = fx(pitman(fa(psi)).r);
    const { p, q, angle } = mainCrank(psi);
    return {
      parts: {
        second: { angle: psi },
        main: { angle },
        // 由後往前:曲柄、短連桿、抽送桿、往上的桿(兩根軸往後穿進軸承座;主曲柄銷只伸到短連桿,抽送桿從它前方掃過)
        pitman: { from: z(p, 0.4), to: z(r, 0.4) },
        link: { from: z(p, 0.15), to: z(q, 0.15) },
        pin: { position: z(p, 0.2) },
        rod: { angle: angleOf(MBEAM, r) },
      },
      readouts: [],
    };
  },
};
