// 第 166 種:圓盤上的曲柄銷帶動連桿來回往復,但連桿接銷的孔是長形的(溝槽),讓連桿在每一程的盡頭停住一會兒:
// 曲柄銷在長孔裡空走,碰到孔的一端才拉或推連桿。曾用於製磚壓印機:連桿把模具前後拉動,在每一程的盡頭停住,
// 好放入黏土、取出磚坯。連桿右端接著在水平導軌上滑動的模具。主動件是圓盤。
// 模具的位置由「銷離模具的距離必須在長孔的兩端之間」決定,從每一圈的起點逐步推算(仍是主動量的純函式):
// 銷碰到長孔的一端才推或拉連桿(由接觸算),其餘時間模具靠導軌的摩擦停住。
// 原圖是俯視圖(圓盤水平,模具在台面上前後拉動;推斷),畫面的後方是台面。
// 推斷(原圖沒畫):台面、圓盤的軸與軸承、模具上接連桿的銷、模具兩側的導軌與墊塊。
import { TAU, deg, polar, clamp } from "./kit.js";
import { angleOf } from "./linkage.js";
import { shape, circle, stadium } from "./shapes.js";

const DISC = 2.35;
const PIN = 1.05;
const L = 3.6; // 模具到長孔近端的距離
const SLOT = 0.75; // 長孔的長度
const MOLD_Y = PIN * Math.sin(deg(160));
const STEP = deg(2);
const PER = Math.round(TAU / STEP);
const START = deg(160);
const TABLE = -0.75; // 台面(在零件的後面)
const RAIL = { from: 3.0, to: 5.6, z: 0.08, depth: 0.36 };

const pinAt = (theta) => polar(PIN, START + theta);
// 模具 x 的可行範圍:銷到模具的距離在 [L, L + SLOT] 之間
const bounds = (theta) => {
  const [px, py] = pinAt(theta);
  const dy = py - MOLD_Y;
  return [px + Math.sqrt(L * L - dy * dy), px + Math.sqrt((L + SLOT) ** 2 - dy * dy)];
};
function settle(x, k, theta) {
  const last = Math.floor(theta / STEP + 1e-9);
  for (let j = k * PER + 1; j <= last; j++) x = clamp(x, ...bounds(j * STEP));
  return clamp(x, ...bounds(theta));
}
const X0 = (() => {
  let x = (bounds(0)[0] + bounds(0)[1]) / 2;
  for (let k = 0; k < 3; k++) x = settle(x, 0, TAU - 1e-9);
  return x;
})();

/** 圓盤轉 theta:模具的位置 */
export const moldX = (theta) => settle(X0, Math.floor(theta / TAU + 1e-12), theta);
/** 銷在長孔中的位置(離模具的距離) */
export const pinDistance = (theta) => {
  const [px, py] = pinAt(theta);
  return Math.hypot(moldX(theta) - px, MOLD_Y - py);
};
export const slot = { near: L, far: L + SLOT };

// 連桿(局部 +X 由模具指向銷):從模具到長孔,長孔從 L 到 L + SLOT
const rodShape = shape(
  [...stadium(L + SLOT + 0.2, 0.62).outline.map(([x, y]) => [x * 1, y * (x > L - 0.3 ? 1 : 0.32)])],
  [stadium(SLOT, 0.42).outline.map(([x, y]) => [x + L, y]).reverse(), circle(0.1).reverse()],
);

export default {
  figure: 166,
  parts: [
    {
      id: "disc",
      kind: "group",
      spin: DISC,
      pieces: [
        { kind: "plate", shape: shape(circle(DISC), [circle(0.25).reverse()]), thickness: 0.15, circles: [DISC - 0.12, 0.5] },
        { kind: "cylinder", radius: 0.2, length: 0.5, at: [...polar(PIN, START).slice(0, 2), 0.2], accent: true },
        { kind: "cylinder", radius: 0.24, length: 0.6, at: [0, 0, -0.35] }, // 軸:往後伸進軸承座
      ],
    },
    { id: "rod", kind: "plate", shape: rodShape, thickness: 0.1, arrow: false },
    {
      id: "mold",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.7, 0.5, 0.36], at: [0, 0, -0.02] },
        { kind: "cylinder", radius: 0.09, length: 0.28, at: [-0.3, 0, 0.24] }, // 接連桿的銷
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [9.0, 5.4, 0.1], at: [1.7, 0, TABLE] },
        { kind: "cylinder", radius: 0.4, inner: 0.24, length: 0.3, at: [0, 0, TABLE + 0.2] }, // 圓盤軸的軸承
        // 模具兩側的導軌,由墊塊架在台面上
        ...[MOLD_Y + 0.31, MOLD_Y - 0.31].flatMap((y) => [
          { kind: "box", size: [RAIL.to - RAIL.from, 0.12, RAIL.depth], at: [(RAIL.from + RAIL.to) / 2, y, RAIL.z] },
          { kind: "box", size: [0.3, 0.12, RAIL.z - RAIL.depth / 2 - TABLE], at: [RAIL.from + 0.15, y, (RAIL.z - RAIL.depth / 2 + TABLE) / 2] },
          { kind: "box", size: [0.3, 0.12, RAIL.z - RAIL.depth / 2 - TABLE], at: [RAIL.to - 0.15, y, (RAIL.z - RAIL.depth / 2 + TABLE) / 2] },
        ]),
      ],
    },
  ],
  // 動力重演:只推圓盤;模具在導軌上滑動、靠摩擦定位,連桿鉸在模具的銷上,長孔套著曲柄銷——
  // 銷碰到長孔的一端才把模具拉動或推動。俯視圖:重力垂直於畫面,不算在平面內
  replay: {
    free: { mold: { slide: [1, 0, 0], hold: true, gravity: false }, rod: { on: "mold", gravity: false } },
    ignore: [["mold", "frame"]], // 模具在導軌之間滑動(貼著導軌,滑軌已由約束代表)
    expect: [
      { at: Math.PI / 2, part: "mold", label: "轉四分之一圈", quote: "其溝槽則允許桿在每次行程結束時保持靜止" },
      { at: Math.PI, part: "mold", label: "轉半圈" },
      { at: (3 * Math.PI) / 2, part: "mold", label: "轉四分之三圈" },
      { part: "mold", label: "轉一圈,模具回到原處" },
    ],
  },
  driver: { part: "disc", type: "rotation" },
  target: "mold",
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const x = moldX(theta);
    const pin = pinAt(theta);
    return {
      parts: {
        disc: { angle: theta },
        rod: { position: [x, MOLD_Y, 0.35], angle: angleOf([x, MOLD_Y, 0], pin) },
        mold: { position: [x + 0.3, MOLD_Y, 0.1] }, // 模具在桿的後面一層,銷往前伸進連桿的軸眼
      },
      readouts: [],
    };
  },
};
