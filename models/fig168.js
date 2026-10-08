// 第 168 種:左邊引擎主軸上的開槽曲柄,與往復動力相連的抽送桿上裝一根銷,在曲柄的溝槽中作動。
// 抽送桿的中段接在一支半徑不變的第二曲柄上;第一支曲柄轉一圈時,抽送桿末端的銷被迫走一條橢圓形的軌跡,
// 在傳遞動力最有利的位置加長主曲柄的力臂。原圖的虛線是銷與第二曲柄銷的軌跡(預覽運動的線,不是零件,模型裡不畫)。
// 主動件是往復動力:右邊從樞軸垂下的搖桿(原圖右端往上的那一截),往復擺動,經抽送桿帶動主曲柄(目標件)。
// 由後往前:兩支曲柄(軸往後穿進軸承座)、抽送桿(左端的銷往後伸進主曲柄的溝槽)、搖桿。
// 推斷(原圖沒畫):兩支曲柄的軸與軸承座、搖桿上端的樞軸與吊架。
import { pitman, slotted, secondAngle, C1, C2, R2, BEAM, ROD_LENGTH } from "./pitman-crank.js";
import { angleOf } from "./linkage.js";
import { shape, circle, stadium } from "./shapes.js";
import { pedestal } from "./supports.js";

/** 第二曲柄轉 phi:主曲柄轉角與曲柄長(銷在溝槽中的位置) */
export const mainCrank = slotted;

const z = (p, d) => [p[0], p[1], d];
const FLOOR = -1.9;
const PITMAN_Z = 0.2;
const ROD_Z = 0.38;

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
        { kind: "cylinder", radius: 0.1, length: 0.85, at: [0, 0, -0.45] }, // 引擎主軸:往後穿進軸承座
      ],
    },
    {
      id: "second",
      kind: "group",
      center: C2,
      spin: R2 + 0.2,
      pieces: [
        { kind: "plate", shape: shape(stadium(R2, 0.3).outline, [circle(0.08).reverse()]), thickness: 0.12 },
        { kind: "cylinder", radius: 0.2, inner: 0.08, length: 0.2 },
        { kind: "cylinder", radius: 0.08, length: 0.85, at: [0, 0, -0.45] }, // 軸:往後穿進軸承座
        { kind: "cylinder", radius: 0.08, length: 0.3, at: [R2, 0, 0.15], accent: true }, // 曲柄銷:往前穿過抽送桿中段
      ],
    },
    { id: "pitman", kind: "link", width: 0.45, thickness: 0.1 },
    { id: "pin", kind: "cylinder", radius: 0.08, length: 0.3 }, // 抽送桿左端的銷,往後伸進主曲柄的溝槽
    {
      id: "rod",
      kind: "group",
      center: z(BEAM, ROD_Z),
      arrow: false,
      pieces: [
        { kind: "box", size: [ROD_LENGTH, 0.3, 0.1], at: [ROD_LENGTH / 2, 0, 0] },
        { kind: "cylinder", radius: 0.2, inner: 0.07, length: 0.14 },
        { kind: "cylinder", radius: 0.07, length: 0.3, at: [ROD_LENGTH, 0, -0.13] }, // 接抽送桿右端的銷
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        ...pedestal({ at: [C1[0], C1[1]], z: -0.75, bore: 0.1, floor: FLOOR }),
        ...pedestal({ at: [C2[0], C2[1]], z: -0.75, bore: 0.08, floor: FLOOR }),
        // 搖桿上端的樞軸:從後面的吊架伸出
        { kind: "cylinder", radius: 0.07, length: 1.3, at: [BEAM[0], BEAM[1], -0.2] },
        { kind: "box", size: [0.3, 1.0, 0.2], at: [BEAM[0], BEAM[1] + 0.4, -0.85] },
        { kind: "box", size: [2.0, 0.15, 0.6], at: [BEAM[0], BEAM[1] + 0.95, -0.6] },
        { kind: "box", size: [7.2, 0.12, 1.4], at: [1.0, FLOOR - 0.06, -0.3] },
      ],
    },
  ],
  driver: { part: "rod", type: "rotation", cycle: [0, Math.PI] },
  target: "main", // 引擎主軸的曲柄(往復動力經抽送桿傳給它)
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const phi = secondAngle(v);
    const { r, p } = pitman(phi);
    const { angle } = slotted(phi);
    return {
      parts: {
        second: { angle: phi },
        main: { angle },
        pitman: { from: z(p, PITMAN_Z), to: z(r, PITMAN_Z) },
        pin: { position: z(p, 0.1) },
        rod: { angle: angleOf(BEAM, r) },
      },
      readouts: [],
    };
  },
};
