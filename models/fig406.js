// 第 406 種:已知底邊、高度、焦點與準線,以機械方法畫拋物線。把直尺放好,讓它的邊與準線重合;曲尺(丁字尺)靠著準線滑動,
// 尺葉與拋物線的軸平行;繩子一端套在焦點的銷上,另一端繫在尺葉的末端,繩長等於尺葉長;鉛筆把繩繃緊、貼著尺葉,
// 曲尺沿準線滑動時鉛筆畫出拋物線(鉛筆到焦點與到準線的距離始終相等)。主動件是曲尺;軌跡由 pose 回傳。
import { clamp } from "./kit.js";
import { shape, rect, circle } from "./shapes.js";

export const DIRECTRIX = 2.0; // 準線(直尺下緣)的高度
export const FOCUS = [0, 0.6, 0];
const BLADE = 4.2; // 尺葉長(從準線往下)
export const RANGE = [-2.4, 2.4]; // 曲尺沿準線的位置 x

/** 曲尺在 x → 鉛筆在尺葉上的位置:到焦點的距離 = 到準線的距離 */
export function pencil(x0) {
  const x = clamp(x0, ...RANGE);
  const y = (DIRECTRIX * DIRECTRIX - FOCUS[1] * FOCUS[1] - (x - FOCUS[0]) ** 2) / (2 * (DIRECTRIX - FOCUS[1]));
  return [x, y, 0];
}

export default {
  figure: 406,
  parts: [
    { id: "paper", kind: "box", center: [0, -0.3, -0.12], size: [6.4, 5.4, 0.04] },
    { id: "straightedge", kind: "plate", shape: shape(rect(6.0, 0.45, 0, DIRECTRIX + 0.225)), thickness: 0.1 },
    { id: "pin", kind: "group", pieces: [{ kind: "cylinder", radius: 0.07, length: 0.4, at: [FOCUS[0], FOCUS[1], 0.1] }] },
    {
      id: "square",
      kind: "group",
      arrow: false,
      pieces: [
        // 曲尺:靠在直尺下緣的橫頭與往下的尺葉(尺葉的左緣是鉛筆貼的邊)
        { kind: "plate", shape: shape(rect(0.9, 0.25, -0.15, DIRECTRIX - 0.125)), thickness: 0.08, at: [0, 0, 0.05] },
        { kind: "plate", shape: shape(rect(0.3, BLADE, 0.15, DIRECTRIX - BLADE / 2)), thickness: 0.08, at: [0, 0, 0.05] },
      ],
    },
    { id: "string", kind: "rope", radius: 0.02 },
    { id: "pencil", kind: "lathe", profile: [[0, -0.1], [0.05, 0], [0.06, 0.4], [0, 0.4]] },
    { id: "trace", kind: "trace" },
  ],
  driver: { part: "square", type: "translation", direction: [1, 0, 0], range: RANGE, initial: 0 },
  target: "pencil", // 畫出拋物線的鉛筆
  view: { direction: [0.03, 0.05, 1] },
  pose(x0) {
    const x = clamp(x0, ...RANGE);
    const P = pencil(x);
    const end = [x, DIRECTRIX - BLADE, 0.12];
    const n = Math.max(2, Math.round(Math.abs(x) / 0.05));
    const points = Array.from({ length: n + 1 }, (_, i) => {
      const q = pencil((x * i) / n);
      return [q[0], q[1], 0.01];
    });
    return {
      parts: { square: { position: [x, 0, 0] }, pencil: { position: [P[0], P[1], 0.1] } },
      paths: { string: { points: [[FOCUS[0], FOCUS[1], 0.12], [P[0], P[1], 0.12], end], closed: false, phase: 0 }, trace: { points, closed: false } }, // 繩端繫在焦點的銷上
      readouts: [],
    };
  },
};
