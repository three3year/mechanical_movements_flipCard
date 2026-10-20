// 第 462 種:鏈式泵,以連續的圓周運動抬水。無端鏈條帶著木製或金屬的碟片,碟片與一根不漏水的泵缸配合,形成一連串裝滿水的水斗。
// 動力加在上方的輪上。
// 主動件是上方的輪(左邊的鏈條往上走)。
// 推斷:泵缸套在鏈條左邊的一段上,下端浸在水裡,上端通到左上的水槽;碟片在筒裡時,碟片之間裝滿水,到筒頂就把水倒進水槽;
// 泵缸畫成剖面。
// 燈籠輪照實物排:八根臂(四根橫檔穿過中心,和原圖一樣八個臂),碟片的間距正好是一個臂距、鏈長是碟片間距的整數倍,
// 每片碟片落在兩根臂的正中(碟片進出輪子時從橫放轉成徑向,離兩邊的臂都還有 5° 以上)。鏈條繞在八個臂端上
// (臂端到鏈的內側 0.005;輪轉時臂端帶著鏈走,鏈再帶著套在它上面的碟片),碟片是套在鏈上的環(中孔讓鏈穿過,
// 孔和鏈之間 0.01)。橫檔在鏈條後面一層、前面齊鏈的背面,輪緣與軸轂更後一層。
// 偏離插圖:原圖的臂伸出輪緣外;模型的臂只到鏈條內側(半徑 0.42),否則上輪的臂掃到泵缸的上口(泵缸上口離輪心 0.45)。
import { TAU, polar, quatFromZ } from "./kit.js";
import { stream } from "./flow.js";
import { backHalf } from "./section.js";
import { shape, circle } from "./shapes.js";

export const R = 0.45; // 鏈條繞輪的半徑
export const ARMS = 8; // 燈籠輪的臂數(四根橫檔穿過中心)
export const SPACING = (TAU * R) / ARMS; // 碟片間距 = 臂距(在鏈條半徑上的弧長)
export const DISCS = 30; // 碟片數(偶數:上下兩輪的臂才同相,碟片在兩個輪上都落在臂與臂之間)
export const LOOP = DISCS * SPACING;
const RUN = (LOOP - TAU * R) / 2; // 兩輪的中心距
export const TOP = [0.5, 2.0, 0];
export const BOTTOM = [0.5, TOP[1] - RUN, 0];
export const TUBE = { x: TOP[0] - R, y0: -1.25, y1: 1.6, r: 0.18 };
export const WATER = -0.9; // 水面
export const DISC_R = TUBE.r - 0.02;
export const DISC_T = 0.05; // 碟片厚
export const CHAIN_W = 0.05; // 鏈節的寬
export const BAR_LEN = 2 * (R - CHAIN_W / 2 - 0.005); // 橫檔(穿過中心的一根)的長:臂端離鏈條的內側 0.005
export const BAR_W = 0.05;
export const SLOT = TAU / ARMS; // 相鄰兩臂的夾角
const FLOOR = BOTTOM[1] - R - 0.3; // 池底

/** 鏈條上弧長 s 處的位置與切線(從左下開始往上走) */
export function chainAt(s0) {
  const s = ((s0 % LOOP) + LOOP) % LOOP;
  if (s < RUN) return { p: [TOP[0] - R, BOTTOM[1] + s, 0], t: [0, 1, 0] };
  if (s < RUN + Math.PI * R) {
    const a = Math.PI - (s - RUN) / R;
    return { p: polar(R, a).map((c, i) => c + TOP[i]), t: [Math.sin(a), -Math.cos(a), 0] };
  }
  if (s < 2 * RUN + Math.PI * R) return { p: [TOP[0] + R, TOP[1] - (s - RUN - Math.PI * R), 0], t: [0, -1, 0] };
  const a = -(s - 2 * RUN - Math.PI * R) / R;
  return { p: polar(R, a).map((c, i) => c + BOTTOM[i]), t: [Math.sin(a), -Math.cos(a), 0] };
}

// 燈籠輪:輪緣(後層)、四根穿過中心的橫檔(中層,伸到碟片那一層)、軸轂與軸(軸往後伸進支架的軸承);第一根橫檔塗記號色
const sprocket = (center) => ({
  kind: "group",
  pieces: [
    { kind: "plate", shape: shape(circle(R + 0.04), [circle(R - 0.04).reverse()]), thickness: 0.06, at: [0, 0, -0.22] },
    ...Array.from({ length: ARMS / 2 }, (_, i) => ({ kind: "box", size: [BAR_LEN, BAR_W, 0.19], at: [0, 0, -0.125], angle: (i * TAU) / ARMS, ...(i === 0 ? { accent: true } : {}) })),
    { kind: "cylinder", radius: 0.12, length: 0.3, at: [0, 0, -0.11] },
    { kind: "cylinder", radius: 0.06, length: 0.5, at: [0, 0, -0.3] },
  ],
  center,
});

export default {
  figure: 462,
  parts: [
    {
      id: "works",
      kind: "group",
      pieces: [
        { kind: "lathe", axis: [0, 1, 0], profile: [[TUBE.r, 0], [TUBE.r + 0.06, 0], [TUBE.r + 0.06, TUBE.y1 - TUBE.y0], [TUBE.r, TUBE.y1 - TUBE.y0]], at: [TUBE.x, TUBE.y0, 0], ...backHalf([0, 1, 0]) },
        // 左岸:整塊地從池底一直到水槽底下,右面靠著泵缸(原圖的岸一直延伸到水面下)
        { kind: "box", size: [2.2 - (TUBE.r + 0.04) + TUBE.x, TUBE.y1 - 0.09 - FLOOR, 1.2], at: [(-2.2 + TUBE.x - TUBE.r - 0.04) / 2, (TUBE.y1 - 0.09 + FLOOR) / 2, 0] },
        { kind: "box", size: [4.4, 0.2, 1.4], at: [0, FLOOR - 0.1, 0] },
        // 兩個燈籠輪的支架(推斷;原圖沒畫):一根立柱從池底立起,上下各一個軸承托著輪軸
        { kind: "box", size: [0.14, TOP[1] - FLOOR + R + 0.15, 0.12], at: [TOP[0] + R + 0.45, (TOP[1] + R + 0.15 + FLOOR) / 2, -0.42] },
        ...[TOP, BOTTOM].flatMap((c) => [
          { kind: "box", size: [R + 0.45, 0.1, 0.12], at: [c[0] + (R + 0.45) / 2, c[1], -0.42] },
          { kind: "cylinder", radius: 0.11, inner: 0.065, length: 0.14, at: [c[0], c[1], -0.42] },
        ]),
      ],
    },
    // 左上的水槽(接住碟片抬上來的水),擱在岸上:獨立成一個零件當目標件
    {
      id: "trough",
      kind: "group",
      pieces: [
        { kind: "box", size: [1.6, 0.08, 0.6], at: [TUBE.x - 0.9 - 0.2, TUBE.y1 - 0.05, 0] },
        { kind: "box", size: [1.6, 0.35, 0.05], at: [TUBE.x - 0.9 - 0.2, TUBE.y1 + 0.1, -0.3] },
      ],
    },
    { id: "pond", kind: "fill", fluid: "water", center: [0, (WATER + FLOOR) / 2, 0], size: [4.2, WATER - FLOOR, 1.3], level: 1 },
    { id: "upper", ...sprocket(TOP), spin: R + 0.2 },
    { id: "lower", ...sprocket(BOTTOM), arrow: false }, // 上下兩輪同向轉,箭頭只畫在上輪
    { id: "chain", kind: "chain", width: CHAIN_W, pitch: 0.12 },
    ...Array.from({ length: DISCS }, (_, i) => ({ id: `disc${i}`, kind: "cylinder", radius: DISC_R, inner: CHAIN_W / 2 + 0.01, length: DISC_T, arrow: false })),
  ],
  driver: { part: "upper", type: "rotation", speed: -0.6 },
  target: "trough", // 鏈條是路徑零件(不上目標色);標接住碟片抬上來的水的水槽
  view: { direction: [0.15, 0.12, 1] },
  pose(theta) {
    const s = -theta * R; // 上輪順時針轉,左邊的鏈條往上
    const parts = { upper: { angle: theta }, lower: { angle: theta } };
    const water = [];
    for (let i = 0; i < DISCS; i++) {
      // 碟片錯開半個間距:在兩個輪上都落在兩根臂的正中
      const { p, t } = chainAt(s + (i + 0.5) * SPACING);
      parts[`disc${i}`] = { position: p, rotation: quatFromZ(t) };
      // 筒裡、碟片上方的水(到下一片碟片為止)
      if (t[1] > 0.99 && p[1] > TUBE.y0 && p[1] < TUBE.y1 - 0.1) {
        for (let k = 1; k <= 3; k++) water.push([p[0] + ((k % 2) - 0.5) * 0.12, p[1] + (k * SPACING) / 4, 0.12]);
      }
    }
    const chain = Array.from({ length: 121 }, (_, i) => chainAt((LOOP * i) / 120).p);
    return {
      parts,
      paths: { chain: { points: chain, closed: true, phase: s } },
      flows: [{ fluid: "water", points: [...water.filter((q) => q[1] < TUBE.y1 - 0.05), ...stream([[TUBE.x, TUBE.y1, 0.12], [TUBE.x - 0.3, TUBE.y1 + 0.02, 0.12], [TUBE.x - 1.6, TUBE.y1 + 0.02, 0.12]], s * 1.5, { spacing: 0.15 })] }],
      readouts: [],
    };
  },
};
