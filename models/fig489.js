// 第 489 種:垂直槳板明輪。槳板 a、a 以樞軸接在臂 b、b 上,離軸心相等。樞軸上接著曲柄 c、c,曲柄的末端以樞軸接在環 d 的臂上,
// 環 d 鬆鬆地套在一個不動的偏心輪 e 上。臂與槳板隨軸轉動時,環 d 也繞偏心輪轉,環經曲柄使槳板始終保持直立,
// 所以槳板以邊緣入水、出水,不受阻力也不把水抬起,在水裡時則處在最有效的推進位置。
// 主動件是軸(臂 b 隨之轉)。
// 推斷:四根臂;曲柄 c 與偏心輪的偏心距等長、方向相同,所以臂端、曲柄端、軸心、偏心輪中心構成平行四邊形,槳板始終直立。
// 偏心距與曲柄照原圖水平往右(原圖四支曲柄都水平往右,507movements 的動畫也是)。
// 前後(深度,前 = +z)照原圖排:最前面是環 d 與偏心輪 e(同一層,環套在 e 外面),其後是曲柄 c,再後是槳板 a,
// 最後面是臂 b(原圖以虛線畫在環的後面)。臂端有軸承,槳板背面的樞軸穿過它;樞軸從槳板正面往前伸、固定曲柄 c,
// 曲柄末端的銷往前插進環 d 臂端的孔(原圖曲柄兩端的圓)。槳板、曲柄、環各在自己的一層,轉動時互相掃不到。
// 推斷:偏心輪 e 不動,軸的前端轉在 e 的孔裡(原圖軸的剖面在 e 裡);e 經前面的橫樑與立柱接回船側(實物明輪外側的框架,
// 原圖剖去不畫)——臂 b 在 e 的後面轉,e 不能從後面撐。
import { TAU, deg, polar } from "./kit.js";
import { stream } from "./flow.js";
import { shape, circle, thickLine, spanBox, zCylinder } from "./shapes.js";

export const ARM = 1.45;
const ARMS = 4;
export const ECC = [0.45, 0, 0]; // 偏心輪 e 的中心(相對軸心);曲柄 c 也是這個向量
const PADDLE = 0.95;
export const WATER = -0.9;
const E_R = 0.62; // 偏心輪的半徑
const FIT = 0.005; // 環 d 鬆鬆地套在偏心輪上的間隙
const SHAFT = 0.075;
const PIVOT = 0.04; // 槳板樞軸的半徑
const PIN = 0.035; // 曲柄銷的半徑
// 各層的深度範圍
const Z = { ring: [0, 0.1], crank: [-0.1, -0.04], board: [-0.92, -0.12], arm: [-1.04, -0.96], hull: [-1.34, -1.26] };
const mid = ([a, b]) => (a + b) / 2;
const armAngle = (i) => deg(45) + (i * TAU) / ARMS;

/** 軸轉 theta → 第 i 根臂的樞軸、曲柄端(在環 d 上) */
export function joints(theta) {
  return Array.from({ length: ARMS }, (_, i) => {
    const a = theta + armAngle(i);
    const pivot = polar(ARM, a);
    return { pivot, crank: [pivot[0] + ECC[0], pivot[1] + ECC[1], 0], a };
  });
}

// 槳板 a:本體是直立的板(深度 Z.board),附件的深度相對板的中心
const B = mid(Z.board);
const paddle = (i) => ({
  id: `paddle${i}`,
  kind: "box",
  size: [0.12, PADDLE, Z.board[1] - Z.board[0]],
  label: "a",
  labelOffset: [0, PADDLE / 2 + 0.15, 0.7],
  arrow: false,
  pieces: [
    { ...zCylinder(-1.08, Z.board[0], PIVOT, [0, 0], B), role: "pivot" }, // 往後穿過臂端的軸承
    zCylinder(Z.board[1], mid(Z.crank), PIVOT, [0, 0], B), // 往前接曲柄
    { kind: "plate", shape: shape(thickLine([[0, 0], [ECC[0], ECC[1]]], 0.1)), thickness: Z.crank[1] - Z.crank[0], at: [0, 0, mid(Z.crank) - B] }, // 曲柄 c
    zCylinder(Z.crank[0], Z.crank[1], 0.07, [0, 0], B),
    zCylinder(Z.crank[0], Z.crank[1], 0.06, [ECC[0], ECC[1]], B),
    { ...zCylinder(mid(Z.crank), Z.ring[1], PIN, [ECC[0], ECC[1]], B), role: "crankPin" }, // 往前插進環 d 臂端的孔
  ],
});

export default {
  figure: 489,
  parts: [
    {
      id: "eccentric",
      kind: "group",
      label: "e",
      labelOffset: [ECC[0] + 0.25, ECC[1] - 0.3, 0.4],
      pieces: [
        { kind: "plate", role: "eccentric", shape: shape(circle(E_R, ECC[0], ECC[1]), [circle(SHAFT).reverse()]), thickness: Z.ring[1] - Z.ring[0], at: [0, 0, mid(Z.ring)] },
        // 推斷:e 前面的凸台、橫樑與立柱(明輪外側的框架),接回船側的板;船側的板與軸承
        zCylinder(Z.ring[1], 0.16, 0.25, [ECC[0], ECC[1]]),
        spanBox(ECC[0], 2.7, -0.1, 0.1, 0.16, 0.26),
        spanBox(2.5, 2.7, -0.1, 0.1, Z.hull[1], 0.26),
        spanBox(-2.8, 2.8, -1.4, 1.8, Z.hull[0], Z.hull[1]),
        { ...zCylinder(Z.hull[1], -1.14, 0.13), inner: SHAFT },
      ],
    },
    {
      id: "arms",
      kind: "group",
      label: "b",
      labelOffset: [-0.75, -0.95, 0.4],
      spin: 0.45,
      spinOffset: 0.35, // 轉向箭頭畫在偏心輪前面(臂在最後面,會被 e 擋住)
      pieces: [
        zCylinder(-1.1, -0.9, 0.22),
        ...Array.from({ length: ARMS }, (_, i) => ({ kind: "plate", role: "arm", shape: shape(thickLine([[0, 0], polar(ARM - 0.06, armAngle(i)).slice(0, 2)], 0.12)), thickness: Z.arm[1] - Z.arm[0], at: [0, 0, mid(Z.arm)], ...(i === 0 ? { accent: true } : {}) })),
        ...Array.from({ length: ARMS }, (_, i) => ({ ...zCylinder(-1.05, -0.95, 0.09, polar(ARM, armAngle(i))), inner: PIVOT, role: "bearing" })), // 臂端的軸承
        zCylinder(Z.hull[1], Z.ring[1], SHAFT), // 軸:後端轉在船側的軸承裡,前端轉在不動的偏心輪 e 的孔裡
      ],
    },
    // 環 d:套在偏心輪 e 外面,四支臂伸到曲柄銷,臂端有孔
    {
      id: "ring",
      kind: "plate",
      shape: shape(circle(0.75), [circle(E_R + FIT).reverse()]),
      thickness: Z.ring[1] - Z.ring[0],
      label: "d",
      labelOffset: [0.1, 0.9, 0.4],
      arrow: false,
      pieces: [
        ...Array.from({ length: ARMS }, (_, i) => ({ kind: "plate", shape: shape(thickLine([polar(0.72, armAngle(i)).slice(0, 2), polar(ARM - 0.06, armAngle(i)).slice(0, 2)], 0.14)), thickness: Z.ring[1] - Z.ring[0] })),
        ...Array.from({ length: ARMS }, (_, i) => ({ kind: "cylinder", role: "eye", radius: 0.075, inner: PIN + 0.005, length: Z.ring[1] - Z.ring[0], at: polar(ARM, armAngle(i)) })),
      ],
    },
    ...Array.from({ length: ARMS }, (_, i) => paddle(i)),
    { id: "river", kind: "fill", fluid: "water", center: [0, (WATER - 2.4) / 2, B], size: [5.0, WATER + 2.4, Z.board[1] - Z.board[0] + 0.1], level: 1 },
  ],
  driver: { part: "arms", type: "rotation", speed: 0.5 },
  target: "paddle0", // 保持直立的槳板(四片取一片代表)
  view: { direction: [0.06, 0.06, 1] },
  pose(theta) {
    const js = joints(theta);
    const parts = { arms: { angle: theta }, ring: { position: [ECC[0], ECC[1], mid(Z.ring)], angle: theta } };
    js.forEach((j, i) => {
      parts[`paddle${i}`] = { position: [j.pivot[0], j.pivot[1], B] }; // 槳板不轉(始終直立)
    });
    const wash = [-1.5, -1.9].flatMap((y) => stream([[-2.4, y, B], [2.4, y, B]], theta * ARM, { spacing: 0.4 }));
    return {
      parts,
      flows: [{ fluid: "water", points: wash }],
      readouts: [{ label: "槳板", value: "始終直立" }],
    };
  },
};
