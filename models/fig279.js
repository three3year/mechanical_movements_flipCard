// 第 279 種:曲柄與開槽十字頭,曲柄手腕(曲柄銷)上套著 Clayton 的滑動軸承盒。十字頭兩端接活塞桿,
// 中間開一道直槽;軸承盒套在曲柄銷上,在槽裡上下滑動。曲柄轉動時,軸承盒把十字頭左右推動(往復直線運動)。
// 軸承盒由兩塊錐形襯裡與兩根錐形鑲條組成,上方兩根螺絲調整鑲條:收緊在手腕上,並隨磨損把盒子往外推。
// 主動件是曲柄。
// 推斷:軸承盒內部的鑲條只畫外形(原圖為剖面),螺絲不轉動;曲柄軸的軸承座、活塞桿的導套(原圖沒畫)。
import { crankPin } from "./linkage.js";
import { shape, rect, circle } from "./shapes.js";
import { pedestal, pedestalX } from "./supports.js";

const CRANK = { center: [0, -0.45, -0.35], r: 0.78 };
const BOX = { w: 0.95, h: 0.85 };
const SLOT = { w: BOX.w + 0.04, h: 2 * CRANK.r + BOX.h + 0.15 };

/** 曲柄轉 theta:曲柄銷與十字頭的水平位移 */
export function crosshead(theta) {
  const pin = crankPin(CRANK.center, CRANK.r, theta + Math.PI / 2);
  return { pin, x: pin[0] };
}

// 十字頭:左右尖的六角形板,中間的直槽
const head = shape(
  [[-1.85, 0.2], [-1.25, 1.7], [1.25, 1.7], [1.85, 0.2], [1.85, -0.6], [1.25, -2.1], [-1.25, -2.1], [-1.85, -0.6]],
  [rect(SLOT.w, SLOT.h, 0, CRANK.center[1]).reverse()],
);

export default {
  figure: 279,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        ...pedestal({ at: CRANK.center, z: -0.9, bore: 0.28, floor: -2.8 }),
        // 活塞桿的導套
        ...pedestalX({ x: -3.25, y: -0.2, z: 0, bore: 0.24, floor: -2.8 }),
        ...pedestalX({ x: 3.25, y: -0.2, z: 0, bore: 0.24, floor: -2.8 }),
      ],
    },
    {
      id: "crank",
      kind: "group",
      center: CRANK.center,
      spin: CRANK.r + 0.2,
      pieces: [
        { kind: "plate", shape: shape([[-0.3, -0.25], [0.3, -0.25], [0.2, CRANK.r], [-0.2, CRANK.r]], [circle(0.12).reverse()]), thickness: 0.12, at: [0, 0, -0.1] },
        { kind: "cylinder", radius: 0.28, length: 1.0, at: [0, 0, -0.55] }, // 曲柄軸,往後穿過軸承座
        { kind: "cylinder", radius: 0.3, length: 0.5, at: [0, CRANK.r, 0.25], accent: true },
      ],
    },
    {
      id: "crosshead",
      kind: "plate",
      shape: head,
      thickness: 0.3,
      pieces: [
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.24, length: 2.6, at: [-3.1, -0.2, 0] },
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.24, length: 2.6, at: [3.1, -0.2, 0] },
      ],
    },
    {
      id: "box",
      kind: "group",
      pieces: [
        // 兩塊錐形襯裡(左右)與上方的兩根調整螺絲
        { kind: "plate", shape: shape([[-BOX.w / 2, -BOX.h / 2], [-0.05, -BOX.h / 2], [-0.05, BOX.h / 2], [-BOX.w / 2, BOX.h / 2]]), thickness: 0.3, at: [0, 0, 0.05] },
        { kind: "plate", shape: shape([[0.05, -BOX.h / 2], [BOX.w / 2, -BOX.h / 2], [BOX.w / 2, BOX.h / 2], [0.05, BOX.h / 2]], []), thickness: 0.3, at: [0, 0, 0.05] },
        { kind: "plate", shape: shape(rect(0.16, BOX.h * 0.9, -BOX.w / 2 + 0.12, 0)), thickness: 0.34, at: [0, 0, 0.05] },
        { kind: "plate", shape: shape(rect(0.16, BOX.h * 0.9, BOX.w / 2 - 0.12, 0)), thickness: 0.34, at: [0, 0, 0.05] },
        { kind: "cylinder", axis: [0, 1, 0], radius: 0.06, length: 0.4, at: [-0.25, BOX.h / 2 + 0.15, 0.05] },
        { kind: "cylinder", axis: [0, 1, 0], radius: 0.06, length: 0.4, at: [0.25, BOX.h / 2 + 0.15, 0.05] },
        { kind: "box", size: [0.2, 0.12, 0.2], at: [-0.25, BOX.h / 2 + 0.3, 0.05] },
        { kind: "box", size: [0.2, 0.12, 0.2], at: [0.25, BOX.h / 2 + 0.3, 0.05] },
      ],
    },
  ],
  driver: { part: "crank", type: "rotation" },
  target: "crosshead", // 往復的十字頭
  view: { direction: [0.04, 0.05, 1] },
  pose(theta) {
    const { pin, x } = crosshead(theta);
    return {
      parts: {
        crank: { angle: theta },
        crosshead: { position: [x, 0, 0] },
        box: { position: [pin[0], pin[1], 0] },
      },
      readouts: [],
    };
  },
};
