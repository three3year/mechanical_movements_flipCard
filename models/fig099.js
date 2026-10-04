// 第 99 種:附著在圓盤表面的螺旋導引器,用於鑽床的進給運動。圓盤下方的滑座上有一個環,套住螺旋凸條;
// 圓盤每轉一圈,螺旋把環(連同滑座)沿半徑推動一個螺距。主動件是圓盤(在螺旋的長度內往返)。
import { TAU, deg } from "./kit.js";
import { circle, shape } from "./shapes.js";

const DISC = 2.45;
const SPIRAL = { r0: 0.55, pitch: 0.36, turns: 4.6 };
const FOLLOWER = deg(-90); // 環在圓盤正下方

/** 圓盤轉 t:環(滑座)離圓盤中心的距離 */
export const feed = (t) => SPIRAL.r0 + (SPIRAL.pitch * (FOLLOWER - t)) / TAU;
const tOf = (r) => FOLLOWER - ((r - SPIRAL.r0) / SPIRAL.pitch) * TAU;
export const pitch = SPIRAL.pitch;

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
      ],
    },
    {
      id: "slide",
      kind: "group",
      pieces: [
        // 滑座整個在螺旋凸條的上面一層,環的底面坐在凸條上
        { kind: "cylinder", radius: 0.32, inner: 0.2, length: 0.25, at: [0, 0, 0.3] },
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
      ],
    },
  ],
  driver: { part: "disc", type: "rotation", range: [tOf(SPIRAL.r0 + SPIRAL.pitch * (SPIRAL.turns - 0.6)), tOf(SPIRAL.r0 + SPIRAL.pitch * 1.2)] },
  target: "slide", // 被螺旋推動的滑座
  view: { direction: [0.06, 0.05, 1], fit: ["disc", "slide"] },
  pose(t) {
    return { parts: { disc: { angle: t }, slide: { position: [0, -feed(t), 0] } }, readouts: [] };
  },
};
