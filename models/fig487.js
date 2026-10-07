// 第 487 種:普通的明輪,推進船隻;輪轉動時槳板把水往後推,船因而前進。
// 主動件是明輪(由引擎轉動,讀者直接抓輪轉)。
// 推斷:八根輻條、輪緣外的徑向槳板;輪的下部浸在水裡;船往左走,所以下方的槳板把水往右推(輪逆時針轉)。
import { TAU, polar } from "./kit.js";
import { stream } from "./flow.js";
import { shape, circle } from "./shapes.js";

export const R = { rim: 1.35, paddle: 1.9 };
const PADDLES = 8;
export const WATER = -1.2;

export default {
  figure: 487,
  parts: [
    // 船側與軸承(推斷;原圖只畫出輪)
    { id: "hull", kind: "group", pieces: [{ kind: "box", size: [5.0, 2.2, 0.1], at: [0, -0.2, -1.0] }, { kind: "cylinder", radius: 0.16, inner: 0.095, length: 0.2, at: [0, 0, -0.85] }] },
    {
      id: "wheel",
      kind: "group",
      spin: R.paddle + 0.15,
      pieces: [
        { kind: "plate", shape: shape(circle(R.rim + 0.07), [circle(R.rim - 0.07).reverse()]), thickness: 0.12 },
        { kind: "plate", shape: shape(circle(R.rim * 0.62 + 0.05), [circle(R.rim * 0.62 - 0.05).reverse()]), thickness: 0.1 },
        { kind: "plate", shape: shape(circle(0.3), [circle(0.1).reverse()]), thickness: 0.3 },
        ...Array.from({ length: PADDLES }, (_, i) => ({ kind: "box", size: [R.rim, 0.07, 0.07], at: polar(R.rim / 2, (i * TAU) / PADDLES), angle: (i * TAU) / PADDLES, ...(i === 0 ? { accent: true } : {}) })),
        { kind: "cylinder", radius: 0.09, length: 1.0, at: [0, 0, -0.4] }, // 輪軸:往後伸進船側的軸承
      ],
    },
    // 槳板(徑向,伸出輪緣;固定在輪上、跟著輪轉):獨立成一個零件當目標件
    {
      id: "floats",
      kind: "group",
      arrow: false,
      pieces: Array.from({ length: PADDLES }, (_, i) => ({ kind: "box", size: [R.paddle - R.rim + 0.2, 0.06, 0.8], at: polar((R.paddle + R.rim) / 2 - 0.1, (i * TAU) / PADDLES), angle: (i * TAU) / PADDLES })),
    },
    { id: "river", kind: "fill", fluid: "water", center: [0, (WATER - 2.2) / 2, 0], size: [5.5, WATER + 2.2, 1.2], level: 1 },
  ],
  driver: { part: "wheel", type: "rotation", speed: 0.5 },
  target: "floats", // 明輪就是主動件;標把水往後推、讓船前進的槳板
  view: { direction: [0.1, 0.06, 1] },
  pose(theta) {
    // 下方的槳板往右推水:水往右流,船往左
    const wash = [-1.6, -1.9].flatMap((y) => stream([[-2.6, y, 0.65], [2.6, y, 0.65]], theta * R.paddle, { spacing: 0.4 }));
    return {
      parts: { wheel: { angle: theta }, floats: { angle: theta } },
      flows: [{ fluid: "water", points: wash }],
      readouts: [{ label: "船", value: "往左前進(槳板把水往右後推)" }],
    };
  },
};
