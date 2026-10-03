// 第 136 種:凸輪輪(圖為側視圖),輪緣側面做成齒狀(或任何需要的輪廓)。右側的桿由彈簧持續壓在齒的邊緣上;
// 輪轉動時,桿便做交替方向的直線運動,運動的特性取決於齒形。主動件是凸輪輪(軸水平)。
// 桿對著輪緣靠近觀看者的那一點(齒在那裡經過)。
import { X, TAU } from "./kit.js";

const R = 2.0;
const TEETH = 10;
const DEPTH = 0.42; // 齒高
const FACE = 0.2; // 輪緣側面(齒根)離輪中面的距離
const ROD_Y = 0; // 桿與軸同高
const CONTACT = Math.PI; // 接觸點在輪的局部角 180°(軸沿 x 時,局部 −X 朝向觀看者 +z)
const ROD_Z = R - 0.22;

// 齒的輪廓:鋸齒(慢升、急降)
export const toothHeight = (phi) => {
  const u = ((((phi * TEETH) / TAU) % 1) + 1) % 1;
  return DEPTH * (u < 0.8 ? u / 0.8 : (1 - u) / 0.2);
};

/** 輪轉 theta:桿端的位置(沿 x) */
export const rodX = (theta) => FACE + toothHeight(CONTACT - theta);

const edge = (r) =>
  Array.from({ length: TEETH * 20 }, (_, i) => {
    const phi = (i / (TEETH * 20)) * TAU;
    return [r * Math.cos(phi), r * Math.sin(phi), FACE + toothHeight(phi)];
  });

export default {
  figure: 136,
  parts: [
    {
      id: "wheel",
      kind: "group",
      axis: X,
      spin: R,
      spinOffset: -0.3,
      pieces: [
        { kind: "cylinder", radius: R, length: 2 * FACE },
        { kind: "tube", points: edge(R - 0.02), radius: 0.05, closed: true },
        { kind: "tube", points: edge(R - 0.45), radius: 0.04, closed: true },
        { kind: "cylinder", radius: 0.42, length: 0.35, at: [0, 0, -0.35] },
        { kind: "cylinder", radius: 0.3, length: 1.6, at: [0, 0, -1.0] },
      ],
    },
    {
      id: "rod",
      kind: "group",
      pieces: [
        { kind: "cylinder", axis: X, radius: 0.1, length: 3.0, at: [1.5, 0, 0] },
        { kind: "cylinder", axis: X, radius: 0.14, length: 0.12, at: [1.2, 0, 0] },
      ],
    },
    { id: "spring", kind: "spring", radius: 0.2, coils: 7, wire: 0.035 },
    {
      id: "post",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.2, 2.6, 0.5], at: [2.45, -0.3, ROD_Z] },
        { kind: "box", size: [3.6, 0.12, 1.2], at: [1.2, -R - 0.05, ROD_Z] },
      ],
    },
  ],
  driver: { part: "wheel", type: "rotation", speed: 0.5 },
  target: "rod",
  view: { direction: [0.02, 0.02, 1], fov: 14 },
  pose(theta) {
    const x = rodX(theta);
    const z = ROD_Z;
    return {
      parts: {
        wheel: { angle: theta },
        rod: { position: [x, ROD_Y, z] },
        spring: { from: [x + 1.26, ROD_Y, z], to: [2.35, ROD_Y, z] },
      },
      readouts: [],
    };
  },
};
