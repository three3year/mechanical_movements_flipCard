// 第 487 種:普通的明輪,推進船隻;輪轉動時槳板把水往後推,船因而前進。
// 主動件是明輪(由引擎轉動,讀者直接抓輪轉)。
// 推斷:八根輻條、徑向的槳板;輪的下部浸在水裡;船往左走,所以下方的槳板把水往右推(輪逆時針轉)。
// 照原圖(507movements 的動畫也是):只有一圈輪緣與輪轂,輻條穿出輪緣;槳板靠在輻條旁(轉向的前方,輻條在背後撐著),
// 從輪緣內側伸到外面。原圖輪緣畫在槳板上面,所以槳板在輪緣的後面(往船側那一邊)一層,釘在輪緣的背面(推斷),
// 不和輪緣、輻條互穿。
import { TAU, polar, rot2 } from "./kit.js";
import { stream } from "./flow.js";
import { shape, circle } from "./shapes.js";

export const R = { rim: 1.35, paddle: 1.9 };
const PADDLES = 8;
const RIM = 0.06; // 輪緣厚度的一半(輪緣在 z −0.06..0.06)
const FLOAT = { from: R.rim - 0.25, depth: 0.8, thick: 0.06 }; // 槳板:從輪緣內側起、沿輪軸方向的寬、板厚
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
        { kind: "plate", shape: shape(circle(R.rim + 0.07), [circle(R.rim - 0.07).reverse()]), thickness: 2 * RIM },
        { kind: "plate", shape: shape(circle(0.3), [circle(0.1).reverse()]), thickness: 0.3 },
        // 輻條:從輪轂穿出輪緣,伸到槳板的外端(原圖)
        ...Array.from({ length: PADDLES }, (_, i) => ({ kind: "box", role: "spoke", size: [R.paddle, 0.07, 0.07], at: polar(R.paddle / 2, (i * TAU) / PADDLES), angle: (i * TAU) / PADDLES, ...(i === 0 ? { accent: true } : {}) })),
        { kind: "cylinder", radius: 0.09, length: 1.0, at: [0, 0, -0.4] }, // 輪軸:往後伸進船側的軸承
      ],
    },
    // 槳板(徑向;固定在輪上、跟著輪轉):獨立成一個零件當目標件。各塊靠在輻條的前方(逆時針那一側)、釘在輪緣的背面,
    // 八塊各自固定在輪上,彼此不相連
    {
      id: "floats",
      kind: "group",
      arrow: false,
      pieces: Array.from({ length: PADDLES }, (_, i) => {
        const a = (i * TAU) / PADDLES;
        const [x, y] = rot2([(FLOAT.from + R.paddle) / 2, 0.0355 + FLOAT.thick / 2], a); // 輻條半寬 0.035,留 0.0005 的縫
        return { kind: "box", size: [R.paddle - FLOAT.from, FLOAT.thick, FLOAT.depth], at: [x, y, -RIM - FLOAT.depth / 2], angle: a };
      }),
    },
    { id: "river", kind: "fill", fluid: "water", center: [0, (WATER - 2.2) / 2, -RIM - FLOAT.depth / 2], size: [5.5, WATER + 2.2, FLOAT.depth + 0.1], level: 1 },
  ],
  driver: { part: "wheel", type: "rotation", speed: 0.5 },
  target: "floats", // 明輪就是主動件;標把水往後推、讓船前進的槳板
  view: { direction: [0.1, 0.06, 1] },
  pose(theta) {
    // 下方的槳板往右推水:水往右流,船往左
    const wash = [-1.6, -1.9].flatMap((y) => stream([[-2.6, y, -RIM - FLOAT.depth / 2], [2.6, y, -RIM - FLOAT.depth / 2]], theta * R.paddle, { spacing: 0.4 }));
    return {
      parts: { wheel: { angle: theta }, floats: { angle: theta } },
      flows: [{ fluid: "water", points: wash }],
      readouts: [{ label: "船", value: "往左前進(槳板把水往右後推)" }],
    };
  },
};
