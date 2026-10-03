// 第 108 種:圓筒上切有右旋與左旋兩道螺旋溝,兩溝每一圈交叉兩次(菱形的網格)。
// 把一個尖點放進溝裡,圓筒均勻旋轉時,尖點(連同它在直立導桿上滑動的滑座)就從圓筒一端均勻地橫移到另一端,
// 到了端頭轉入反向的那道溝,再均勻地回來。主動件是圓筒(底部的齒輪驅動它)。
import { Y, TAU } from "./kit.js";
import { triangle } from "./groove-drum.js";

const R = 0.8;
const L = 2.6; // 溝的行程(圓筒長)
const TURNS = 3; // 尖點從一端到另一端,圓筒要轉的圈數
const PITCH = L / TURNS;
const POINT = Math.PI; // 尖點在圓筒的左側(局部角 180°)

/** 圓筒轉 θ:尖點(滑座)的高度 */
export const slideY = (theta) => triangle(POINT - theta, L / 2, 2 * TURNS * TAU);
export const pitch = PITCH;
export const travel = L;

// 兩道螺旋溝:右旋從下到上、左旋從上到下,各繞 TURNS 圈;以凸條畫出溝的兩側
const helix = (hand, offset) =>
  Array.from({ length: TURNS * 72 + 1 }, (_, i) => {
    const phi = (i / 72) * TAU;
    const z = -L / 2 + (L * i) / (TURNS * 72);
    const a = hand * phi;
    return [(R + 0.02) * Math.cos(a), (R + 0.02) * Math.sin(a), z + offset];
  });
const ridges = [1, -1].flatMap((hand) => [0.09, -0.09].map((d) => ({ kind: "tube", points: helix(hand, d), radius: 0.035 })));

export default {
  figure: 108,
  parts: [
    {
      id: "drum",
      kind: "group",
      axis: Y,
      center: [0.6, 0, 0],
      spin: R,
      spinOffset: L / 2 + 0.3,
      pieces: [
        { kind: "cylinder", radius: R, length: L + 0.3, mark: true },
        ...ridges,
        { kind: "cylinder", radius: 0.1, length: L + 1.6 },
        { kind: "gear", teeth: 32, radius: 1.2, width: 0.14, web: false, at: [0, 0, -L / 2 - 0.35] },
      ],
    },
    {
      id: "slide",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.35, 0.3, 0.4], at: [-1.35, 0, 0] },
        { kind: "plate", shape: { outline: [[-1.18, 0.07], [0.6 - R - 0.02, 0.0], [-1.18, -0.07]], holes: [] }, thickness: 0.1 },
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "cylinder", axis: Y, radius: 0.08, length: L + 1.5, at: [-1.35, 0, 0] },
        { kind: "box", size: [2.6, 0.22, 0.5], at: [-0.2, L / 2 + 0.55, 0] },
        { kind: "box", size: [2.6, 0.22, 0.5], at: [-0.2, -L / 2 - 0.75, 0] },
      ],
    },
  ],
  driver: { part: "drum", type: "rotation", speed: 1.2 },
  target: "slide", // 均勻來回橫移的滑座
  view: { direction: [0.08, 0.1, 1] },
  pose(theta) {
    return { parts: { drum: { angle: theta }, slide: { position: [0, slideY(theta), 0] } }, readouts: [] };
  },
};
