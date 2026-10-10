// 第 188 種(條目 187–188 的第二張圖):第 186 種的另一個變形。偏心桿上以銷裝著一支手柄,
// 左上方是大環形的握把,右邊一根彎指越過桿端隆起的頰板、從頰板後面往下壓在搖臂的銷上(原圖虛線是被頰板遮住的部分)。
// 把握把往後扳,彎指往下頂住銷,桿端被抬起,銷從鉤口脫出;扳到頭時柄上的卡榫卡進彈簧的凹槽 a,把手柄留在這個位置。
// 由接觸算:扳多少、桿端抬多高,由彎指末端的墊塊與銷的外形相碰算(gab.js 的 contactLift);扳到頭的位置由卡榫碰到
// 凹槽的頂壁決定(gab.js 的 springCatch):卡榫先頂開凹槽的下緣(彈簧被推開),越過之後彈簧彈回、卡榫落進凹槽。
// 層次(維護者 2026-10-10 決定 (a)):桿端是隆起的頰板(在手柄前面)與桿身(在手柄後面)夾著手柄,頰板以兩塊墊塊
// 接在桿身上;彎指從頰板後面下去;手柄樞軸的圓頭下半在頰板後面(原圖圓頭的下緣是虛線),樞軸的銷穿過桿身與手柄。
// 推斷:扳動方向;彈簧從左邊螺栓處的耳座往右上伸,彈簧身在偏心桿那一層(從柄的後面過去,原圖柄畫在彈簧前面),
// 前端往前彎到手柄那一層、凹槽 a 在那裡;柄上的卡榫;彎指末端的墊塊(讓轉動中一直壓在銷頂上);彈簧的彎曲以繞
// 耳座的小轉角近似;頰板的墊塊、桿身在樞軸處加高的一塊、樞軸與耳座的銷。偏離插圖:原圖的彈簧在握把下面、
// 凹槽 a 在柄的左邊,但柄往後扳時是往右離開那裡,卡不住,所以凹槽改在柄扳到頭的位置前面(原文 > 實物可行 > 插圖外形)。
// 主動件是手柄。
import { deg, rot2 } from "./kit.js";
import { gab, rodAngle, onRod, contactLift, handleAt, springCatch, ECC } from "./gab.js";
import { shape, thickLine, offsetLoop, arcPoints, circle, rect } from "./shapes.js";
import { circlePolygon } from "./contact.js";

const G = gab();
const PIVOT = [-1.3, 0.45];
const FINGER = thickLine([[0, 0], [0.35, 0.4], [0.75, 0.65], [1.1, 0.62], [1.3, 0.4], [1.32, 0.0], [1.3, -0.18]], 0.16);
// 彎指末端的墊塊(相對樞軸):原圖位置底面剛好貼著銷頂;扳動時墊塊傾斜,和銷相碰的點沿著墊塊往右移
const PB = G.pin + 1e-4 - PIVOT[1];
const PAD = [[1.18, PB + 0.04], [1.3, PB], [1.5, PB], [1.68, PB + 0.04], [1.68, PB + 0.14], [1.18, PB + 0.14]];
const STEM = [[0, 0], [-0.5, 0.35], [-0.85, 0.8], [-0.95, 1.4], [-0.85, 1.9]];
const LOOP = Array.from({ length: 56 }, (_, i) => {
  const t = (i / 56) * 2 * Math.PI;
  return rot2([1.2 * Math.cos(t), 0.48 * Math.sin(t)], deg(4)).map((v, k) => v + [-1.95, 2.05][k]);
});
const LOOP_OUT = offsetLoop(LOOP, 0.1);
const PIN = circlePolygon([0, 0], G.pin, 32); // 搖臂的銷(世界座標,固定)
const HUB = 0.2; // 手柄樞軸的圓頭
const HANDLE_Z = 0.205; // 手柄各板的中心(0.13–0.28):背面貼著桿身(0.125),前面是頰板(0.29–0.39)
const CHEEK_Z = [0.29, 0.39];

// 卡榫:柄右邊伸出的一塊,在手柄扳到 LATCH_AT 時尖端 T 在樞軸上方偏右(這裡以那個位置畫,再轉回原圖位置)
const LATCH_AT = -0.42;
const T = [PIVOT[0] + 1.4 * Math.cos(deg(85)), PIVOT[1] + 1.4 * Math.sin(deg(85))];
const TOOTH = [
  [-1.68, 1.25], // 柄上(下)
  [T[0] + 0.007, T[1] - 0.049],
  T, // 尖端
  [T[0] - 0.049, T[1] + 0.007],
  [T[0] - 0.19, T[1] - 0.134], // 上緣往左下斜,越過凹槽下緣之後彈簧才落得回來
  [-1.72, 1.62], // 柄上(上)
].map(([x, y]) => rot2([x - PIVOT[0], y - PIVOT[1]], -LATCH_AT));

// 彈簧(桿座標,不受力的形狀):耳座在左邊的桿上;前端(彈簧頭)在手柄那一層,u 沿卡榫尖在 T 的走向(往右)、
// v 往外(往上):凹槽 a 的下緣(唇)在卡榫尖後面、頂壁在前面
const UV = [Math.sin(deg(85)), -Math.cos(deg(85))];
const VV = [Math.cos(deg(85)), Math.sin(deg(85))];
const at = (u, v) => [T[0] + u * UV[0] + v * VV[0], T[1] + u * UV[1] + v * VV[1]];
const WALL = 0.07; // 頂壁
const LIP = -0.1; // 唇的前面(往回放時擋住卡榫)
const HEAD = [
  [-0.24, 0.02],
  [LIP - 0.13, 0.02], // 唇的斜面:卡榫從後面頂上來時把彈簧往外推
  [LIP - 0.015, -0.06],
  [LIP, -0.06],
  [LIP, 0.09],
  [WALL, 0.09], // 凹槽底
  [WALL, -0.22], // 頂壁
  [WALL + 0.12, -0.22],
  [WALL + 0.12, 0.19],
  [-0.24, 0.19],
].map(([u, v]) => at(u, v));
const ROOT = [-3.3, 0.5]; // 彈簧的耳座(原圖左邊的螺栓處)
const BODY = thickLine([ROOT, [-2.6, 1.3], [-1.9, 1.98], at(WALL + 0.06, 0.105)], 0.12);
const BEND = [at(WALL, 0.02), at(WALL + 0.12, 0.02), at(WALL + 0.12, 0.19), at(WALL, 0.19)]; // 往前彎到手柄那一層
const rel = (pts) => pts.map(([x, y]) => [x - ROOT[0], y - ROOT[1]]);

export const latch = springCatch({ handle: [FINGER, PAD, thickLine(STEM, 0.2), LOOP_OUT, TOOTH], pivot: PIVOT, spring: rel(HEAD), root: ROOT, out: 1, limit: 0.07, dir: -1 });
const MAX = -latch.max; // 卡榫頂到凹槽頂壁時往後扳的角度(由接觸算)

/** 手柄往後扳 phi(順時針,phi ≤ 0):桿端抬起的量(彎指末端的墊塊與銷相碰算) */
export function unhook(phi) {
  const lift = contactLift([FINGER, PAD], PIVOT, PIN, phi);
  return { lift, released: G.released(lift) };
}
export const max = MAX;
/** 檢查用:手柄扳 phi 時,彎指(含墊塊)與銷的外形(世界座標 2D) */
export const contact = (phi) => ({ handle: handleAt([FINGER, PAD], PIVOT, unhook(phi).lift, phi), stud: PIN });

// 頰板(桿座標):底邊和桿身一樣(鉤口與圓頭),上面是原圖的隆起,右端是圓的鼻
const RIGHT = 1.4;
const base = G.rod({ left: -1.95, right: RIGHT }).outline;
const CHEEK = [
  ...base.slice(0, base.findIndex(([x, y]) => x === RIGHT && y > 0)),
  ...arcPoints(0.12, -Math.PI / 2, Math.PI / 2, RIGHT, -0.03).slice(1),
  [0.8, 0.1],
  [0.55, 0.2],
  [0.4, 0.42],
  [0.25, 0.62],
  [0.05, 0.75],
  [-0.2, 0.75],
  [-0.45, 0.66],
  [-0.65, 0.5],
  [-0.85, 0.35],
  [-1.95, 0.35],
];
const TAIL = [[0.4, -0.15], [RIGHT, -0.15], ...arcPoints(0.12, -Math.PI / 2, Math.PI / 2, RIGHT, -0.03).slice(1), [0.4, 0.09]];
const SPACER_Z = [0.12, 0.295]; // 頰板與桿身之間的墊塊(手柄那一層,手柄碰不到的地方)
const onRodPiece = ([x, y], z) => [x - ECC[0], y, z];
const LUG = [...arcPoints(HUB, -0.25, Math.PI + 0.25, PIVOT[0], PIVOT[1]), [PIVOT[0] - HUB, 0.25], [PIVOT[0] + HUB, 0.25]]; // 桿身在樞軸處加高的一塊

export default {
  figure: 188,
  parts: [
    {
      id: "rocker",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape([[-0.35, 1.7], [-0.2, 0], [0.2, 0], [0.05, 1.7]]), thickness: 0.15, at: [0, 0, -0.35] },
        { kind: "cylinder", radius: 0.3, inner: 0.15, length: 0.25, at: [-0.15, 1.75, -0.35] },
        { kind: "cylinder", radius: G.pin, length: 0.8, at: [0, 0, 0.05] }, // 銷,前端伸出頰板
      ],
    },
    {
      id: "rod",
      kind: "group",
      center: ECC,
      arrow: false,
      pieces: [
        { kind: "plate", shape: G.rod({ left: -4.7, right: 0.55 }), thickness: 0.25, at: [-ECC[0], 0, 0] }, // 桿身
        { kind: "plate", shape: shape(TAIL), thickness: 0.25, at: [-ECC[0], 0, 0] }, // 桿身的尾端(和頰板的尾端一樣低)
        { kind: "plate", shape: shape(LUG), thickness: 0.25, at: [-ECC[0], 0, 0] },
        { kind: "plate", shape: shape(CHEEK), thickness: CHEEK_Z[1] - CHEEK_Z[0], at: [-ECC[0], 0, (CHEEK_Z[0] + CHEEK_Z[1]) / 2] }, // 頰板
        ...[rect(0.8, 0.23, 0.95, -0.035), rect(0.2, 0.45, -1.85, 0.075)].map((o) => ({ kind: "plate", shape: shape(o), thickness: SPACER_Z[1] - SPACER_Z[0], at: [-ECC[0], 0, (SPACER_Z[0] + SPACER_Z[1]) / 2] })), // 頰板的墊塊
        { kind: "cylinder", radius: 0.045, length: 0.405, at: onRodPiece(PIVOT, 0.0775) }, // 手柄樞軸的銷,從桿背面穿過手柄
        { kind: "cylinder", radius: 0.08, length: 0.04, at: onRodPiece(PIVOT, 0.3) }, // 銷頭
        { kind: "plate", shape: shape(rect(0.3, 0.42, ROOT[0], 0.45)), thickness: 0.06, at: [-ECC[0], 0, -0.095] }, // 彈簧的耳座(在彈簧後面)
        { kind: "cylinder", radius: 0.035, length: 0.225, at: onRodPiece(ROOT, -0.0125) }, // 耳座的螺栓
        { kind: "cylinder", radius: 0.07, length: 0.04, at: onRodPiece(ROOT, 0.08) }, // 螺栓頭
      ],
    },
    {
      id: "spring",
      kind: "group",
      arrow: false,
      label: "a",
      labelOffset: [...at(-0.02, 0.4).map((v, k) => v - ROOT[k]), 0],
      pieces: [
        { kind: "cylinder", radius: 0.09, inner: 0.04, length: 0.12 }, // 套在螺栓上的根部
        { kind: "plate", shape: shape(rel(BODY)), thickness: 0.12 }, // 彈簧身(偏心桿那一層)
        { kind: "plate", shape: shape(rel(BEND)), thickness: 0.325, at: [0, 0, 0.1025] }, // 往前彎
        { kind: "plate", shape: shape(rel(HEAD)), thickness: 0.12, at: [0, 0, HANDLE_Z] }, // 彈簧頭與凹槽 a(手柄那一層)
      ],
    },
    {
      id: "handle",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(FINGER), thickness: 0.12 },
        { kind: "plate", shape: shape(PAD), thickness: 0.12 },
        { kind: "plate", shape: shape(thickLine(STEM, 0.2)), thickness: 0.15 },
        { kind: "plate", shape: shape(LOOP_OUT, [offsetLoop(LOOP, -0.1).reverse()]), thickness: 0.15 },
        { kind: "plate", shape: shape(TOOTH), thickness: 0.15 }, // 卡榫
        { kind: "plate", shape: shape(circle(HUB), [circle(0.05).reverse()]), thickness: 0.15 }, // 樞軸的圓頭,套在銷上
      ],
    },
  ],
  driver: { part: "handle", type: "rotation", range: [-MAX, 0] },
  target: "rod",
  view: { direction: [0.06, 0.05, 1] },
  pose(phi) {
    const { lift, released } = unhook(phi);
    const a = rodAngle(lift);
    return {
      parts: {
        rod: { angle: a },
        spring: { position: onRod(ROOT, lift, 0), angle: a + latch.bend(phi) },
        handle: { position: onRod(PIVOT, lift, HANDLE_Z), angle: a + phi },
      },
      readouts: [{ label: "銷", value: released ? "已脫出鉤口" : "在鉤口中" }],
    };
  },
};
