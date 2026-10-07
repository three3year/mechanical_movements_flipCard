// 第 128 種:帶三個推板的軸連續旋轉(依原圖箭頭順時針),使長方形框架往復直線運動。
// 框架內上方右側垂下一塊凸塊、下方左側立起一塊凸塊:推板經過上方時把上凸塊往右推,經過下方時把下凸塊往左推;
// 兩次推動之間框架停住。框架的位置由「推板球頭不能穿過凸塊」的兩個限制決定:從一個週期的起點逐步推算
// (每個週期的起點狀態相同,所以仍是主動量的純函式)。主動件是三推板軸。
// 框架兩端的耳伸成短桿,穿在固定的導套裡;推板軸往後伸進軸承座(導套、軸承座是推斷,原圖只畫到兩端的耳)。
import { TAU, deg, polar, clamp } from "./kit.js";
import { shape, arcPoints } from "./shapes.js";
import { pedestal, squareGuide } from "./supports.js";

const ARM = 1.0;
const BALL = 0.24;
const FACE = { top: 0.8, bottom: -0.8 }; // 上凸塊的左面、下凸塊的右面(框架局部 x)
const TIP = { top: 0.6, bottom: -0.6 }; // 凸塊伸到的高度
const PERIOD = TAU / 3;
const STEP = deg(0.5);
const ROD = { from: 2.0, length: 1.4 }; // 框架兩端的短桿
const GUIDE_X = ROD.from + ROD.length / 2;
const FLOOR = -2.2;

const balls = (theta) => [0, 1, 2].map((k) => polar(ARM, deg(90) - theta + (k * TAU) / 3));

// 框架位置的下限(被上方的球往右推)與上限(被下方的球往左推)
function bounds(theta) {
  let lo = -Infinity;
  let hi = Infinity;
  for (const [x, y] of balls(theta)) {
    if (y + BALL > TIP.top) lo = Math.max(lo, x + BALL - FACE.top);
    if (y - BALL < TIP.bottom) hi = Math.min(hi, x - BALL - FACE.bottom);
  }
  return [lo, hi];
}

// 從第 k 個週期的起點推算到 theta;取樣點固定在 STEP 的整數倍上,每個週期的推算完全相同
const PER = 240; // 每個週期的步數(PERIOD = 240 × STEP)
function settle(x, k, theta) {
  const last = Math.floor(theta / STEP + 1e-9);
  for (let j = k * PER + 1; j <= last; j++) x = clamp(x, ...bounds(j * STEP));
  return clamp(x, ...bounds(theta));
}

// 每個週期起點的框架位置(從 0 推算幾個週期後收斂)
const X0 = (() => {
  let x = 0;
  for (let k = 0; k < 3; k++) x = settle(x, 0, PERIOD - 1e-9);
  return x;
})();

/** 軸順時針轉過 theta:框架的水平位置 */
export function frameX(theta) {
  return settle(X0, Math.floor(theta / PERIOD + 1e-12), theta);
}
export { bounds };

const roundedBox = (w, h, r) => [
  ...arcPoints(r, -Math.PI / 2, 0, w / 2 - r, -h / 2 + r),
  ...arcPoints(r, 0, Math.PI / 2, w / 2 - r, h / 2 - r),
  ...arcPoints(r, Math.PI / 2, Math.PI, -w / 2 + r, h / 2 - r),
  ...arcPoints(r, Math.PI, (3 * Math.PI) / 2, -w / 2 + r, -h / 2 + r),
];

export default {
  figure: 128,
  parts: [
    {
      id: "shaft",
      kind: "group",
      center: [0, 0, 0.1],
      spin: ARM + BALL,
      pieces: [
        { kind: "cylinder", radius: 0.32, inner: 0.15, length: 0.3 },
        { kind: "cylinder", radius: 0.15, length: 1.0, at: [0, 0, -0.3] }, // 軸:往後伸進軸承座
        ...[0, 1, 2].flatMap((k) => {
          const a = deg(90) + (k * TAU) / 3;
          return [
            { kind: "box", size: [ARM - 0.2, 0.12, 0.12], at: [((ARM + 0.2) / 2) * Math.cos(a), ((ARM + 0.2) / 2) * Math.sin(a), 0], angle: a },
            { kind: "cylinder", radius: BALL, length: 0.25, at: [ARM * Math.cos(a), ARM * Math.sin(a), 0], accent: k === 0 },
          ];
        }),
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(roundedBox(4.3, 3.12, 0.5), [roundedBox(3.7, 2.52, 0.35).reverse()]), thickness: 0.3 },
        { kind: "plate", shape: shape([[FACE.top, 1.27], [FACE.top + 0.5, 1.27], [FACE.top + 0.42, TIP.top + 0.15], [FACE.top + 0.2, TIP.top], [FACE.top, TIP.top + 0.1]]), thickness: 0.3 },
        { kind: "plate", shape: shape([[FACE.bottom - 0.5, -1.27], [FACE.bottom, -1.27], [FACE.bottom, TIP.bottom - 0.1], [FACE.bottom - 0.2, TIP.bottom], [FACE.bottom - 0.42, TIP.bottom - 0.15]]), thickness: 0.3 },
        { kind: "box", size: [ROD.length, 0.24, 0.3], at: [-GUIDE_X, 0, 0] },
        { kind: "box", size: [ROD.length, 0.24, 0.3], at: [GUIDE_X, 0, 0] },
      ],
    },
    {
      id: "support",
      kind: "group",
      pieces: [
        ...pedestal({ at: [0, 0], z: -0.6, bore: 0.15, floor: FLOOR }),
        ...[-1, 1].flatMap((side) => [
          ...squareGuide({ at: [side * GUIDE_X, 0, 0], width: 0.24, thickness: 0.3 }),
          { kind: "box", size: [0.2, -0.2 - FLOOR, 0.2], at: [side * GUIDE_X, (-0.2 + FLOOR) / 2, 0] },
          { kind: "box", size: [0.8, 0.18, 0.6], at: [side * GUIDE_X, FLOOR - 0.09, 0] },
        ]),
      ],
    },
  ],
  driver: { part: "shaft", type: "rotation", speed: -0.8 },
  target: "frame", // 往復直線運動的框架
  // 動力重演:只轉推板軸;框架靠摩擦定位,只被推板的球頭推動
  replay: {
    free: { frame: { slide: [1, 0, 0], hold: true } },
    expect: [
      { at: -TAU / 6, part: "frame", label: "上方的推板把框架推到右端", quote: "承載三個推板的軸之連續旋轉運動,會產生矩形框架的往復直線運動" },
      { at: -TAU / 3, part: "frame", label: "下方的推板把框架推回左端" },
      { part: "frame", label: "轉完一圈(往復三次),框架回到起點" },
    ],
  },
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    return { parts: { shaft: { angle: v }, frame: { position: [frameX(-v), 0, 0] } }, readouts: [] };
  },
};

