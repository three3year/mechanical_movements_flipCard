// 第 382 種:鏡子等物品用的可調整支架:玻璃可以抬高或降低、向左或向右轉,也可以改變傾斜角度。支柱插在立柱的插座裡,
// 以固定螺絲鎖住(抬高、降低、左右轉);玻璃以鉸鏈接在支柱頂上,鉸鏈處也有固定螺絲(改變傾角)。相機架也用同樣的裝置。
// 主動件是玻璃(改變傾角);狀態按鈕切換支柱的高低與左右轉向。
// 照原圖(從鏡子背面畫):鉸鏈直接裝在鏡框背面中央的直條上,鏡子中心約在鉸鏈的高度。
// 偏離插圖:原圖鏡子下緣落在立柱頂的旁邊;模型把鉸鏈抬高,下緣在立柱頂上方(降低時 0.2、抬高時 0.9),因為直條
// 背面離鉸鏈軸只有 0.13,比立柱頂(半徑 0.14)還近,下緣降到立柱頂旁邊時直條背面會撞到立柱頂。
// 鉸鏈旁(背面看在左邊)有一個手轉的固定螺絲,立柱插座的固定螺絲在右邊。預設視角從鏡背斜看。
// 鏡子貼在鉸鏈上,所以只能往後仰(上緣往後、下緣往前離開支柱);往前傾一點點下緣就碰到支柱,傾角的範圍是 [−30°, 0°]
// (維護者 2026-10-14 決定 (b),取代第三輪把鏡框挑到鉸鏈前面 1.0 的托架)。
// 推斷:三種調整的範圍;狀態的組合;鉸鏈的做法(支柱頂一個鉸鏈筒,直條上兩個鉸鏈筒夾著它,鉸鏈銷穿過三個筒,
// 一端的固定螺絲把筒夾緊)。
import { Y, deg, quatMul, quatAxisAngle, clamp } from "./kit.js";
import { shape, rect } from "./shapes.js";

export const RANGE = [deg(-30), 0]; // 負的是上緣往後仰;0 是鏡子直立,再往前傾下緣就碰到支柱(測試量過)
export const SETTINGS = { low: { lift: 0, turn: 0 }, high: { lift: 0.7, turn: 0 }, turned: { lift: 0.7, turn: deg(35) } };
const HINGE0 = 1.6; // 支柱降到最低時鉸鏈的 y(離立柱頂 y −0.1 是 1.7);鏡子下緣在立柱頂上方 0.2
const ROD = { r: 0.07, bottom: -1.1 }; // 支柱:降到最低時下端在立柱裡的 y −1.1
const X = [1, 0, 0];

// 鏡子(局部原點在鉸鏈軸上;+z 是鏡面那一側,鉸鏈在鏡背)
const MIRROR = { w: 2.4, h: 3.0, glassW: 1.9, glassH: 2.5, back: 0.19 }; // back:鏡框背面離鉸鏈軸
const KNUCKLE = { r: 0.09, pin: 0.035 };

export default {
  figure: 382,
  parts: [
    {
      id: "base",
      kind: "group",
      pieces: [
        { kind: "lathe", axis: Y, profile: [[0, -2.4], [1.25, -2.4], [1.1, -2.2], [0.35, -2.0], [0.2, -1.4], [0.32, -0.9], [0.2, -0.45], [0.14, -0.1], [0, -0.1]] },
        // 插座的固定螺絲(背面看在右邊)
        { kind: "cylinder", axis: X, radius: 0.05, length: 0.4, at: [-0.25, -0.35, 0] },
      ],
    },
    {
      id: "stem",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "cylinder", role: "rod", axis: Y, radius: ROD.r, length: HINGE0 - ROD.bottom, at: [0, (HINGE0 + ROD.bottom) / 2, 0] },
        // 支柱頂的鉸鏈筒,夾在鏡背的兩個鉸鏈筒中間
        { kind: "cylinder", axis: X, radius: KNUCKLE.r, length: 0.12, at: [0, HINGE0, 0] },
        // 鉸鏈銷穿過三個筒;一端是固定螺絲,頭頂著鏡背鉸鏈筒的端面把它夾緊(背面看在左邊)
        { kind: "cylinder", role: "hingePin", axis: X, radius: KNUCKLE.pin, length: 0.36, at: [0.02, HINGE0, 0] },
        { kind: "cylinder", role: "hingeScrew", axis: X, radius: 0.08, length: 0.04, at: [0.18, HINGE0, 0] },
        { kind: "cylinder", axis: X, radius: 0.03, length: 0.1, at: [0.25, HINGE0, 0] }, // 螺絲桿伸出、末端是手轉的圓頭(原圖)
        { kind: "cylinder", axis: X, radius: 0.075, length: 0.07, at: [0.335, HINGE0, 0] },
      ],
    },
    {
      id: "mirror",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", role: "frame", shape: shape(rect(MIRROR.w, MIRROR.h), [rect(MIRROR.glassW, MIRROR.glassH).reverse()]), thickness: 0.12, at: [0, 0, MIRROR.back + 0.06] },
        { kind: "plate", role: "glass", shape: shape(rect(MIRROR.glassW, MIRROR.glassH)), thickness: 0.03, at: [0, 0, MIRROR.back + 0.015] },
        // 鏡背中央由上到下的直條,鉸鏈裝在它上面
        { kind: "box", role: "strap", size: [0.32, MIRROR.h, 0.06], at: [0, 0, MIRROR.back - 0.03] },
        // 直條上兩個耳,各帶一個鉸鏈筒(孔套著鉸鏈銷),夾著支柱頂的鉸鏈筒
        ...[1, -1].flatMap((s) => [
          { kind: "box", size: [0.08, 0.14, 0.08], at: [s * 0.12, 0, MIRROR.back - 0.1] },
          { kind: "cylinder", role: "knuckle", axis: X, radius: KNUCKLE.r, inner: KNUCKLE.pin, length: 0.1, at: [s * 0.11, 0, 0] },
        ]),
      ],
    },
  ],
  driver: { part: "mirror", type: "rotation", range: RANGE, initial: deg(-12) },
  target: "stem", // 支柱:升降、左右轉,帶著玻璃到要的位置
  states: {
    initial: "high",
    options: [
      { id: "low", label: "降低" },
      { id: "high", label: "抬高" },
      { id: "turned", label: "抬高並右轉" },
    ],
  },
  view: { direction: [0.35, 0.2, -1] }, // 從鏡背斜看(原圖從背面畫)
  pose(tilt0, state = "high") {
    const tilt = clamp(tilt0, ...RANGE);
    const { lift, turn } = SETTINGS[state];
    const turnQ = quatAxisAngle(Y, turn);
    return {
      parts: {
        stem: { position: [0, lift, 0], rotation: turnQ },
        mirror: { position: [0, lift + HINGE0, 0], rotation: quatMul(turnQ, quatAxisAngle(X, tilt)) },
      },
      readouts: [],
    };
  },
};
