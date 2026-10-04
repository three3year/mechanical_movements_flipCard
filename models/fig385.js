// 第 385 種:俄羅斯的關門裝置。兩根桿以肘節相連,左端的銷轉動於固定在門上的插座裡,右端的銷接在門框上;肘節的接頭吊著
// 一個重物。開門時兩根銷被拉近,重物被抬高;放手後,重物把接頭往下壓、讓肘節接近一直線,兩根銷之間被撐開,門就關上。
// 主動件是門上的銷(開門時往門框那邊移);重物與接頭隨之升降。
// 推斷:兩根桿等長;門關上時肘節接近一直線(不完全拉直)。
import { clamp } from "./kit.js";

const L = 2.2; // 每根桿長
const FRAME_X = 2.1; // 門框上的銷
const Y0 = -0.4;
export const RANGE = [FRAME_X - 2 * L * 0.97, FRAME_X - 2 * L * 0.6]; // 門上的銷的 x(關 → 開)

/** 門上的銷在 x → 肘節接頭的位置(兩銷中點的正上方) */
export function toggle(x0) {
  const x = clamp(x0, ...RANGE);
  const half = (FRAME_X - x) / 2;
  return { x, joint: [x + half, Y0 + Math.sqrt(L * L - half * half), 0] };
}

export default {
  figure: 385,
  parts: [
    { id: "frame", kind: "group", pieces: [{ kind: "box", size: [0.12, 1.2, 0.12], at: [FRAME_X, Y0 - 0.65, 0] }, { kind: "cylinder", radius: 0.12, inner: 0.05, length: 0.25, at: [FRAME_X, Y0, 0] }] },
    { id: "doorPin", kind: "group", pieces: [{ kind: "box", size: [0.12, 1.2, 0.12], at: [0, -0.65, 0] }, { kind: "cylinder", radius: 0.12, inner: 0.05, length: 0.25 }] },
    { id: "barL", kind: "link", width: 0.13, thickness: 0.08 },
    { id: "barR", kind: "link", width: 0.13, thickness: 0.08 },
    { id: "weight", kind: "lathe", axis: [0, 1, 0], profile: [[0, -0.75], [0.25, -0.7], [0.32, -0.45], [0.22, -0.2], [0.1, -0.08], [0, -0.05]], pieces: [{ kind: "box", size: [0.04, 0.35, 0.04], at: [0, 0, 0.1] }] },
  ],
  driver: { part: "doorPin", type: "translation", direction: [1, 0, 0], range: RANGE, initial: RANGE[0] + 0.6 },
  target: "weight", // 隨開門升降的重物
  view: { direction: [0.03, 0.05, 1] },
  pose(x0) {
    const t = toggle(x0);
    const pin = [t.x, Y0, 0.1];
    return {
      parts: {
        doorPin: { position: [t.x, Y0, 0] },
        barL: { from: pin, to: [t.joint[0], t.joint[1], 0.1] },
        barR: { from: [FRAME_X, Y0, 0.1], to: [t.joint[0], t.joint[1], 0.1] },
        weight: { position: [t.joint[0], t.joint[1] - 0.18, 0.12] },
      },
      readouts: [],
    };
  },
};
