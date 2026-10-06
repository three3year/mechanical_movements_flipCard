// 第 99 種:附著在圓盤表面的螺旋導引器,用於鑽床的進給運動。圓盤下方的滑座上有一個環,環底的銷
// 伸進螺旋凸條相鄰兩圈之間的溝裡;圓盤每轉一圈,螺旋把銷(連同滑座)沿半徑推動一個螺距。
// 主動件是圓盤(在螺旋的長度內往返)。銷由凸條兩側推著走,滑座的位置就是銷所在那道溝的半徑
// (推斷:原圖只畫出環壓在螺旋上,看不出怎麼咬住;環若只坐在凸條上面,螺旋推不動它)。
import { TAU, deg } from "./kit.js";
import { circle, shape } from "./shapes.js";
import { pedestal } from "./supports.js";

const DISC = 2.45;
const SPIRAL = { r0: 0.55, pitch: 0.36, turns: 4.6 };
const FOLLOWER = deg(-90); // 環在圓盤正下方

const PIN = 0.12; // 銷的半徑:相鄰兩圈凸條之間的溝寬 0.26
/** 圓盤轉 t:環(滑座)離圓盤中心的距離——銷在凸條相鄰兩圈的正中間 */
export const feed = (t) => SPIRAL.r0 + (SPIRAL.pitch * (FOLLOWER - t)) / TAU + SPIRAL.pitch / 2;
const tOf = (r) => FOLLOWER - ((r - SPIRAL.pitch / 2 - SPIRAL.r0) / SPIRAL.pitch) * TAU;
export const pitch = SPIRAL.pitch;
// 主動量的範圍:銷從外圈往內走,內外都留著夾住它的凸條
const RANGE = [tOf(SPIRAL.r0 + SPIRAL.pitch * (SPIRAL.turns - 0.7)), tOf(SPIRAL.r0 + SPIRAL.pitch * 1.5)];

const spiral = Array.from({ length: Math.ceil(SPIRAL.turns * 96) + 1 }, (_, i) => {
  const phi = (i / 96) * TAU;
  const r = SPIRAL.r0 + (SPIRAL.pitch * phi) / TAU;
  return [r * Math.cos(phi), r * Math.sin(phi), 0.12];
});

export default {
  figure: 99,
  parts: [
    {
      id: "disc",
      kind: "group",
      spin: DISC,
      pieces: [
        { kind: "plate", shape: shape(circle(DISC), [circle(0.32).reverse()]), thickness: 0.1 },
        { kind: "tube", points: spiral, radius: 0.05 },
        { kind: "cylinder", radius: 0.32, length: 0.4, mark: true },
        { kind: "cylinder", radius: 0.2, length: 0.6, at: [0, 0, -0.45] }, // 軸,往後伸進軸承座
      ],
    },
    {
      id: "slide",
      kind: "group",
      pieces: [
        // 環在螺旋凸條的上面一層,環底的銷伸進凸條兩圈之間的溝
        { kind: "cylinder", radius: 0.32, inner: 0.2, length: 0.25, at: [0, 0, 0.3] },
        { kind: "cylinder", radius: PIN, length: 0.3, at: [0, 0, 0.21] },
        { kind: "box", size: [0.45, 0.3, 0.2], at: [0, -0.42, 0.3] },
        { kind: "box", size: [0.1, 0.9, 0.12], at: [0, -1.0, 0.3] },
        { kind: "box", size: [0.95, 0.45, 0.3], at: [0, -1.55, 0.33] },
      ],
    },
    {
      id: "guides",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.06, 2.6, 0.1], at: [-0.51, -SPIRAL.r0 - 2.2, 0.33] }, // 導軌夾著滑座的兩側
        { kind: "box", size: [0.06, 2.6, 0.1], at: [0.51, -SPIRAL.r0 - 2.2, 0.33] },
        { kind: "box", size: [1.08, 0.12, 0.1], at: [0, -SPIRAL.r0 - 3.56, 0.33] }, // 兩根導軌的下端連在一起
        ...pedestal({ at: [0, 0], z: -0.6, bore: 0.21, floor: -SPIRAL.r0 - 3.7 }), // 圓盤軸的軸承座,在圓盤後面
      ],
    },
  ],
  // 動力重演:只推圓盤;滑座在導軌的直線滑軌上,銷由凸條兩側推著走(不靠重力)
  replay: {
    free: { slide: { slide: [0, 1, 0], gravity: false } },
    expect: [
      { at: RANGE[0] + TAU, part: "slide", label: "圓盤轉一圈,螺旋把滑座推進一個螺距", quote: "附著於圓盤表面的螺旋導引器;用於鑽床的進給運動" },
      { at: RANGE[0] + 2 * TAU, part: "slide", label: "再轉一圈,又推進一個螺距" },
    ],
  },
  driver: { part: "disc", type: "rotation", range: RANGE },
  target: "slide", // 被螺旋推動的滑座
  view: { direction: [0.06, 0.05, 1], fit: ["disc", "slide"] },
  pose(t) {
    return { parts: { disc: { angle: t }, slide: { position: [0, -feed(t), 0] } }, readouts: [] };
  },
};
