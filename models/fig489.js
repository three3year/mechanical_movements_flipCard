// 第 489 種:垂直槳板明輪。槳板 a、a 以樞軸接在臂 b、b 上,離軸心相等。樞軸上接著曲柄 c、c,曲柄的末端以樞軸接在環 d 的臂上,
// 環 d 鬆鬆地套在一個不動的偏心輪 e 上。臂與槳板隨軸轉動時,環 d 也繞偏心輪轉,環經曲柄使槳板始終保持直立,
// 所以槳板以邊緣入水、出水,不受阻力也不把水抬起,在水裡時則處在最有效的推進位置。
// 主動件是軸(臂 b 隨之轉)。
// 推斷:四根臂;曲柄 c 與偏心輪的偏心距等長、方向相同,所以臂端、曲柄端、軸心、偏心輪中心構成平行四邊形,槳板始終直立。
import { TAU, deg, polar } from "./kit.js";
import { stream } from "./flow.js";
import { shape, circle, thickLine } from "./shapes.js";

export const ARM = 1.45;
const ARMS = 4;
export const ECC = [0.32, 0.32, 0]; // 偏心輪 e 的中心(相對軸心);曲柄 c 也是這個向量
const PADDLE = 0.95;
export const WATER = -0.9;

/** 軸轉 theta → 第 i 根臂的樞軸、曲柄端(在環 d 上) */
export function joints(theta) {
  return Array.from({ length: ARMS }, (_, i) => {
    const a = theta + deg(45) + (i * TAU) / ARMS;
    const pivot = polar(ARM, a);
    return { pivot, crank: [pivot[0] + ECC[0], pivot[1] + ECC[1], 0], a };
  });
}

export default {
  figure: 489,
  parts: [
    {
      id: "eccentric",
      kind: "group",
      label: "e",
      labelOffset: [ECC[0] + 0.3, ECC[1] - 0.3, 0.4],
      pieces: [
        { kind: "plate", shape: shape(circle(0.62, ECC[0], ECC[1]), [circle(0.16).reverse()]), thickness: 0.2, at: [0, 0, -0.2] },
        // 偏心輪固定在船側上(推斷):往後的撐塊、船側的板與軸的軸承
        { kind: "box", size: [0.2, 0.2, 0.5], at: [ECC[0] + 0.35, ECC[1] + 0.25, -0.55] },
        { kind: "box", size: [4.0, 3.2, 0.08], at: [0, 0.2, -0.84] },
        { kind: "cylinder", radius: 0.13, inner: 0.08, length: 0.1, at: [0, 0, -0.75] },
      ],
    },
    {
      id: "arms",
      kind: "group",
      label: "b",
      labelOffset: [-0.75, -0.95, 0.4],
      spin: 0.45,
      pieces: [
        { kind: "plate", shape: shape(circle(0.22), [circle(0.08).reverse()]), thickness: 0.3 },
        ...Array.from({ length: ARMS }, (_, i) => ({ kind: "plate", shape: shape(thickLine([[0, 0], polar(ARM, deg(45) + (i * TAU) / ARMS).slice(0, 2)], 0.12)), thickness: 0.08, at: [0, 0, 0.12], ...(i === 0 ? { accent: true } : {}) })),
        { kind: "cylinder", radius: 0.075, length: 1.0, at: [0, 0, -0.3] }, // 軸:穿過不動的偏心輪,往後伸進船側的軸承
      ],
    },
    { id: "ring", kind: "plate", shape: shape(circle(0.72), [circle(0.64).reverse()]), thickness: 0.08, label: "d", labelOffset: [0.1, 0.85, 0.4], arrow: false, pieces: Array.from({ length: ARMS }, (_, i) => ({ kind: "plate", shape: shape(thickLine([polar(0.68, deg(45) + (i * TAU) / ARMS).slice(0, 2), polar(ARM, deg(45) + (i * TAU) / ARMS).slice(0, 2)], 0.08)), thickness: 0.05 })) },
    ...Array.from({ length: ARMS }, (_, i) => ({ id: `paddle${i}`, kind: "box", size: [0.12, PADDLE, 0.8], label: "a", labelOffset: [0, PADDLE / 2 + 0.15, 0.4], arrow: false, pieces: [{ kind: "box", size: [ECC[0] * 1.4, 0.06, 0.06], at: [ECC[0] / 2, ECC[1] / 2, 0.45], angle: Math.atan2(ECC[1], ECC[0]) }] })),
    { id: "river", kind: "fill", fluid: "water", center: [0, (WATER - 2.4) / 2, 0], size: [5.0, WATER + 2.4, 1.2], level: 1 },
  ],
  driver: { part: "arms", type: "rotation", speed: 0.5 },
  target: "paddle0", // 保持直立的槳板(四片取一片代表)
  view: { direction: [0.06, 0.06, 1] },
  pose(theta) {
    const js = joints(theta);
    const parts = { arms: { angle: theta }, ring: { position: ECC, angle: theta } };
    js.forEach((j, i) => {
      parts[`paddle${i}`] = { position: [j.pivot[0], j.pivot[1], 0.3] }; // 槳板不轉(始終直立)
    });
    const wash = [-1.5, -1.9].flatMap((y) => stream([[-2.4, y, 0.7], [2.4, y, 0.7]], theta * ARM, { spacing: 0.4 }));
    return {
      parts,
      flows: [{ fluid: "water", points: wash }],
      readouts: [{ label: "槳板", value: "始終直立" }],
    };
  },
  waivers: [
    { check: "interference", parts: ["ring", "paddle3"], reason: "槳板的拉桿接在偏心環上:槳板轉過偏心環的位置時與環重疊 0.14(約三分之一的取樣)" },
    { check: "interference", parts: ["arms", "paddle3"], reason: "接合處的簡化畫法:槳板鉸接在輪臂的端頭,槳板與輪臂重疊 0.12" },
    { check: "interference", parts: ["ring", "paddle2"], reason: "槳板的拉桿接在偏心環上:槳板轉過偏心環的位置時與環重疊 0.14(約三分之一的取樣)" },
    { check: "interference", parts: ["arms", "paddle2"], reason: "接合處的簡化畫法:槳板鉸接在輪臂的端頭,槳板與輪臂重疊 0.12" },
    { check: "interference", parts: ["ring", "paddle1"], reason: "槳板的拉桿接在偏心環上:槳板轉過偏心環的位置時與環重疊 0.14(約三分之一的取樣)" },
    { check: "interference", parts: ["arms", "paddle1"], reason: "接合處的簡化畫法:槳板鉸接在輪臂的端頭,槳板與輪臂重疊 0.12" },
    { check: "interference", parts: ["ring", "paddle0"], reason: "槳板的拉桿接在偏心環上:槳板轉過偏心環的位置時與環重疊 0.14(約三分之一的取樣)" },
    { check: "interference", parts: ["arms", "paddle0"], reason: "接合處的簡化畫法:槳板鉸接在輪臂的端頭,槳板與輪臂重疊 0.12" },
    { check: "interference", parts: ["arms", "ring"], reason: "簡化畫法:偏心環貼著輪臂的輪轂,重疊 0.03" },
    { check: "interference", parts: ["eccentric", "arms"], reason: "簡化畫法:偏心輪與輪臂前後貼合,重疊 0.05" },
  ],
};
