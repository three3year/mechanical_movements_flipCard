// 第 461 種:擺動式水槽,靠擺動把水抬高。底端是舀斗,頂端是開口的管;中間每個轉角處有一個箱子(裝著瓣閥),
// 各與兩段管子相連。
// 主動件是整個擺(繞頂上的支點來回擺)。
// 推斷:管子左右交錯往上,每段只微微上斜;擺往一邊擺到夠斜時,往那一邊上斜的管子變成往下斜,水就從下一層的箱子
// 流進上一層的箱子(瓣閥擋住回流);擺回來時換另一組管子,水又上一層。舀斗在最低處浸水。
import { deg } from "./kit.js";
import { stroke } from "./pump.js";
import { stream } from "./flow.js";
import { shape, thickLine, circle } from "./shapes.js";

export const PIVOT = [0, 3.6, 0];
const LEVELS = 6; // 箱子的層數
const RISE = 0.42; // 每段管子上升的高度
const HALF = 0.75; // 箱子離中線
const BOTTOM = -0.1 - PIVOT[1]; // 最低的箱子(相對支點)
export const SLOPE = Math.atan2(RISE, 2 * HALF); // 每段管子的斜度
export const SWING = [deg(-24), deg(24)];

// 擺上的箱子(局部座標,支點在原點):左右交錯
export const BOXES = Array.from({ length: LEVELS }, (_, k) => [k % 2 === 0 ? -HALF : HALF, BOTTOM + k * RISE]);
const local = (p, a) => [PIVOT[0] + p[0] * Math.cos(a) - p[1] * Math.sin(a), PIVOT[1] + p[0] * Math.sin(a) + p[1] * Math.cos(a), 0.1];

/** 擺角 a → 哪幾段管子正在往上送水(第 k 段:從箱子 k 到 k+1) */
export function active(a) {
  return BOXES.slice(0, -1).map((p, k) => {
    const q = BOXES[k + 1];
    // 管子在世界中的斜度:從 k 到 k+1 往下斜才流得過去
    const dy = (q[0] - p[0]) * Math.sin(a) + (q[1] - p[1]) * Math.cos(a);
    return dy < 0;
  });
}

export default {
  figure: 461,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [2.6, 0.12, 0.5], at: [0, PIVOT[1] + 0.3, 0] },
        { kind: "box", size: [0.12, 0.4, 0.12], at: [0, PIVOT[1] + 0.12, 0] },
        { kind: "cylinder", radius: 0.035, length: 0.3, at: [0, PIVOT[1], -0.1] }, // 擺的樞軸銷:從吊座穿過吊桿頂的眼(推斷)
        { kind: "box", size: [6.0, 0.2, 1.4], at: [0, -1.25, 0] },
      ],
    },
    { id: "pond", kind: "fill", fluid: "water", center: [0, -0.65, 0], size: [5.8, 1.0, 1.3], level: 1 },
    {
      id: "pendulum",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        // 中間的吊桿
        { kind: "box", size: [0.08, -BOTTOM + 0.6 - 0.1, 0.08], at: [0, (BOTTOM - 0.6 - 0.1) / 2, -0.15] },
        { kind: "plate", shape: shape(circle(0.1), [circle(0.04).reverse()]), thickness: 0.08, at: [0, 0, -0.15] }, // 吊桿頂的眼
        // 交錯的管子與轉角的箱子
        ...BOXES.slice(0, -1).map((p, k) => ({ kind: "plate", shape: shape(thickLine([p, BOXES[k + 1]], 0.08)), thickness: 0.08 })),
        ...BOXES.map(([x, y]) => ({ kind: "box", size: [0.26, 0.22, 0.26], at: [x, y, 0] })),
        // 底端的舀斗與頂端開口的管
        { kind: "plate", shape: shape(thickLine([BOXES[0], [BOXES[0][0] - 0.25, BOXES[0][1] - 0.45], [BOXES[0][0] + 0.15, BOXES[0][1] - 0.55]], 0.09)), thickness: 0.26 },
      ],
    },
    // 頂端開口的管(水從這裡流出):固定在擺上、跟著擺,獨立成一個零件當目標件
    {
      id: "spout",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [{ kind: "plate", shape: shape(thickLine([BOXES[LEVELS - 1], [-BOXES[LEVELS - 1][0] * 1.5, BOXES[LEVELS - 1][1] + RISE]], 0.08)), thickness: 0.08 }],
    },
  ],
  driver: { part: "pendulum", type: "rotation", cycle: SWING },
  target: "spout", // 整個擺就是主動件;標頂端的出水管——水一層層被送到這裡流出
  view: { direction: [0.1, 0.08, 1] },
  pose(v) {
    const { at } = stroke(v, ...SWING);
    const act = active(at);
    const dots = [];
    act.forEach((on, k) => {
      if (on) dots.push(...stream([local(BOXES[k], at), local(BOXES[k + 1], at)], v * 6, { spacing: 0.18 }));
    });
    // 頂端的管:擺到夠斜時水從開口流出
    const top = BOXES[LEVELS - 1];
    const spout = [-top[0] * 1.5, top[1] + RISE];
    const outflowing = (spout[0] - top[0]) * Math.sin(at) + (spout[1] - top[1]) * Math.cos(at) < 0;
    if (outflowing) dots.push(...stream([local(top, at), local(spout, at), [local(spout, at)[0] - Math.sign(spout[0]) * -0.2, local(spout, at)[1] - 0.8, 0.1]], v * 6, { spacing: 0.15 }));
    return {
      parts: { pendulum: { angle: at }, spout: { angle: at } },
      flows: [{ fluid: "water", points: dots }],
      readouts: [{ label: "送水的管段", value: act.map((on, k) => (on ? k + 1 : null)).filter(Boolean).join("、") || "無(換邊中)" }],
    };
  },
};
