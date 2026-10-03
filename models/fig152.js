// 第 152 種:橢圓規。橫移桿上的兩根凸柱分別在十字架件的橫溝與直溝內滑動;
// 轉動橫移桿時,桿端的鉛筆畫出橢圓。鉛筆離直溝凸柱 A_X、離橫溝凸柱 A_Y,
// 畫出的橢圓半軸就是這兩段距離(第一根凸柱在直溝、第二根在橫溝)。
// 軌跡由 pose 回傳:從起始轉角畫到目前轉角,往回轉時軌跡跟著縮回。
import { deg, TAU } from "./kit.js";
import { rect, circle, shape } from "./shapes.js";

const A_X = 3.04; // 鉛筆到直溝凸柱的距離 = 橢圓的橫半軸
const STUDS = 0.92; // 兩凸柱間距
const A_Y = A_X - STUDS; // 縱半軸
const START = deg(137.7); // 原圖中橫移桿朝左上
const ARM = { back: 1.14, front: 3.85, width: 0.42 };
const Z = { cross: 0, bar: 0.22, trace: 0.02 };

/** 橫移桿轉到 t 時:直溝凸柱、橫溝凸柱與鉛筆的位置 */
export function trammel(t) {
  const c = Math.cos(t);
  const s = Math.sin(t);
  return {
    vertical: [0, -STUDS * s, 0],
    horizontal: [STUDS * c, 0, 0],
    pencil: [A_X * c, A_Y * s, 0],
  };
}

export const SEMI_AXES = [A_X, A_Y];

// 十字架件:兩條臂,各有一道溝(以兩條邊框表示)
const arm = (long, w, vertical) => {
  const size = (x, y, z) => (vertical ? [y, x, z] : [x, y, z]);
  const at = (x, y, z) => (vertical ? [y, x, z] : [x, y, z]);
  return [
    { kind: "box", size: size(long, w, 0.12), at: at(0, 0, -0.06) },
    { kind: "box", size: size(long, 0.07, 0.1), at: at(0, 0.16, 0.05) },
    { kind: "box", size: size(long, 0.07, 0.1), at: at(0, -0.16, 0.05) },
  ];
};

const TRACE_STEPS = 180;

export default {
  figure: 152,
  parts: [
    { id: "cross", kind: "group", pieces: [...arm(5.0, 0.95, false), ...arm(3.6, 0.95, true)] },
    {
      id: "bar",
      kind: "plate",
      shape: shape(rect(ARM.back + ARM.front, ARM.width, (ARM.front - ARM.back) / 2, 0), [circle(0.1, A_X, 0).reverse()]),
      thickness: 0.1,
      pieces: [
        { kind: "cylinder", radius: 0.12, length: 0.46, at: [0, 0, -0.1] },
        { kind: "cylinder", radius: 0.12, length: 0.46, at: [STUDS, 0, -0.1] },
      ],
    },
    // 鉛筆:裝在橫移桿的桿端、跟著桿走(姿勢與桿相同);獨立成一個零件,好標成目標件
    { id: "pencil", kind: "group", pieces: [{ kind: "lathe", profile: [[0, -0.22], [0.06, -0.12], [0.08, 0.3], [0, 0.3]], at: [A_X, 0, 0] }] },
    { id: "ellipse", kind: "trace" },
  ],
  driver: { part: "bar", type: "rotation", initial: START },
  target: "pencil", // 畫出橢圓的鉛筆
  view: { direction: [0.06, 0.05, 1] },
  pose(t) {
    const { vertical } = trammel(t);
    // 從起始轉角畫到 t;超過一圈時只留最近的一圈(已是完整橢圓)
    const span = Math.max(-TAU, Math.min(TAU, t - START));
    const from = t - span;
    const n = Math.max(1, Math.round((Math.abs(span) / TAU) * TRACE_STEPS));
    const points = Array.from({ length: n + 1 }, (_, i) => {
      const p = trammel(from + (span * i) / n).pencil;
      return [p[0], p[1], Z.trace];
    });
    return {
      parts: { bar: { position: [vertical[0], vertical[1], Z.bar], angle: t }, pencil: { position: [vertical[0], vertical[1], Z.bar], angle: t } },
      paths: { ellipse: { points, closed: false } },
      readouts: [],
    };
  },
};
