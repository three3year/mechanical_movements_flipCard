// 第 138 種:底部的凸輪轉動時,靠在它上面的直立桿(尖端朝下,穿過兩個導座)做變速的交替直線運動。
// 凸輪的輪廓不規則(三瓣、一側較尖),桿端高度 = 凸輪在正上方方向的半徑。主動件是凸輪。
// 桿端的高度由凸輪頂起(動力重演:桿是上下的自由滑塊,靠自重壓在凸輪上)。
// 兩個導座與凸輪的軸承都裝在凸輪後面的一根立柱上(立柱是推斷,原圖只畫出導座)。
import { Y } from "./kit.js";
import { knifeEdge } from "./cams.js";
import { polarOutline, shape, circle } from "./shapes.js";

const radiusAt = (a) => 0.95 + 0.4 * Math.max(0, Math.cos(a - 4.2)) ** 6 + 0.2 * Math.sin(a + 0.4) + 0.12 * Math.cos(3 * a);
const UP = Math.PI / 2;

/** 凸輪轉 theta:桿端的高度 */
export const rodY = (theta) => knifeEdge(radiusAt, theta, UP);
export { radiusAt };

export default {
  figure: 138,
  parts: [
    {
      id: "cam",
      kind: "group",
      spin: 1.6,
      pieces: [
        { kind: "plate", shape: shape(circle(1.6), [circle(0.12).reverse()]), thickness: 0.06, at: [0, 0, -0.2] },
        { kind: "plate", shape: shape(polarOutline(radiusAt, 240), [circle(0.12).reverse()]), thickness: 0.22, circles: [0.36], mark: [0.6, -0.2], markSize: 0.07 },
        { kind: "cylinder", radius: 0.12, length: 0.7, at: [0, 0, -0.25] }, // 軸:往後伸進立柱上的軸承
      ],
    },
    {
      id: "rod",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape([[-0.07, 0.15], [0, 0], [0.07, 0.15]]), thickness: 0.12 },
        { kind: "cylinder", axis: Y, radius: 0.07, length: 3.2, at: [0, 1.75, 0] },
      ],
    },
    {
      id: "guides",
      kind: "group",
      pieces: [
        ...[2.4, 3.6].flatMap((y) => [
          // 導座:圍著桿的四塊板(中間是桿穿過的方孔)
          { kind: "box", size: [0.23, 0.22, 0.24], at: [-0.195, y, 0.05] },
          { kind: "box", size: [0.23, 0.22, 0.24], at: [0.195, y, 0.05] },
          { kind: "box", size: [0.16, 0.22, 0.04], at: [0, y, 0.15] },
          { kind: "box", size: [0.16, 0.22, 0.04], at: [0, y, -0.05] },
          { kind: "cylinder", radius: 0.05, length: 0.3, at: [-0.2, y, 0.12] },
          { kind: "cylinder", radius: 0.05, length: 0.3, at: [0.2, y, 0.12] },
          { kind: "box", size: [0.3, 0.22, 0.38], at: [0, y, -0.26] }, // 連到立柱的托架
        ]),
        // 凸輪後面的立柱、凸輪軸的軸承與底座
        { kind: "box", size: [0.3, 6.0, 0.15], at: [0, 0.8, -0.52] },
        { kind: "cylinder", radius: 0.27, inner: 0.12, length: 0.15, at: [0, 0, -0.52] },
        { kind: "box", size: [1.2, 0.18, 0.7], at: [0, -2.29, -0.45] },
      ],
    },
  ],
  driver: { part: "cam", type: "rotation", speed: 0.7 },
  target: "rod",
  replay: {
    free: { rod: { slide: [0, 1, 0] } },
    expect: [
      { at: Math.PI / 2, part: "rod", label: "凸輪轉四分之一圈,桿照輪廓升降", quote: "會將變速的交替直線運動傳遞給靠在其上的桿" },
      { at: Math.PI, part: "rod", label: "凸輪轉半圈" },
      { part: "rod", label: "轉完一圈,桿回到起點" },
    ],
  },
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    return { parts: { cam: { angle: theta }, rod: { position: [0, rodY(theta), 0.05] } }, readouts: [] };
  },
};

