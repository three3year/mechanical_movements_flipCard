// 第 136 種:凸輪輪(圖為側視圖),輪緣側面做成齒狀(或任何需要的輪廓)。右側的桿由彈簧持續壓在齒的邊緣上;
// 輪轉動時,桿便做交替方向的直線運動,運動的特性取決於齒形。主動件是凸輪輪(軸水平)。
// 桿對著輪緣靠近觀看者的那一點(齒在那裡經過)。
// 桿端的位置由齒的輪廓決定(動力重演:桿是沿軸向的自由滑塊,被彈簧壓在齒上)。
// 輪軸的左端架在軸承座上;桿穿過右邊立柱上的軸套(軸承座是推斷,原圖的軸伸出畫面外)。
import { X, TAU, quatFromBasis } from "./kit.js";
import { shape } from "./shapes.js";
import { pedestalX } from "./supports.js";

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

// 每顆齒是一塊實心的鋸齒:沿輪緣的切線方向排出齒形(高度朝輪軸方向),徑向厚 0.42,中心在桿對著的半徑上
const BAND = { r: ROD_Z, width: 0.42 };
const TOOTH = (() => {
  const L = (BAND.r * TAU) / TEETH;
  const pts = Array.from({ length: 21 }, (_, i) => {
    const u = i / 20;
    return [(u - 0.5) * L, toothHeight((u * TAU) / TEETH)];
  });
  return shape([...pts, [L / 2, -0.03], [-L / 2, -0.03]]);
})();
const teeth = Array.from({ length: TEETH }, (_, k) => {
  const phi = ((k + 0.5) * TAU) / TEETH; // 這顆齒中間的角度
  const tangent = [-Math.sin(phi), Math.cos(phi), 0];
  const radial = [Math.cos(phi), Math.sin(phi), 0];
  return { kind: "plate", shape: TOOTH, thickness: BAND.width, at: [BAND.r * radial[0], BAND.r * radial[1], FACE], rotation: quatFromBasis(tangent, [0, 0, 1], radial) };
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
        ...teeth,
        { kind: "cylinder", radius: 0.42, length: 0.35, at: [0, 0, -0.35] },
        { kind: "cylinder", radius: 0.3, length: 1.6, at: [0, 0, -1.0] },
      ],
    },
    {
      id: "rod",
      kind: "group",
      pieces: [
        { kind: "cylinder", axis: X, radius: 0.1, length: 2.7, at: [1.65, 0, 0] },
        { kind: "lathe", axis: X, profile: [[0, 0], [0.1, 0.3], [0, 0.3]] }, // 桿端削尖(比齒的陡面還尖),只有尖端碰到齒面
        { kind: "cylinder", axis: X, radius: 0.14, length: 0.12, at: [1.2, 0, 0] },
      ],
    },
    { id: "spring", kind: "spring", radius: 0.2, coils: 7, wire: 0.035 },
    {
      id: "post",
      kind: "group",
      pieces: [
        // 立柱(在桿的下方)與套著桿的軸套;彈簧的右端頂在軸套上
        { kind: "box", size: [0.2, R - 0.21, 0.5], at: [2.45, (-R - 0.21) / 2, ROD_Z] },
        { kind: "box", size: [0.2, 0.55, 0.5], at: [2.45, 0.215 + 0.275, ROD_Z] },
        { kind: "cylinder", axis: X, radius: 0.21, inner: 0.11, length: 0.2, at: [2.45, ROD_Y, ROD_Z] },
        { kind: "box", size: [3.6, 0.12, 1.2], at: [1.2, -R - 0.05, ROD_Z] },
        ...pedestalX({ x: -1.45, y: 0, z: 0, bore: 0.3, floor: -R - 0.11 }),
      ],
    },
  ],
  driver: { part: "wheel", type: "rotation", speed: 0.5 },
  target: "rod",
  replay: {
    free: { rod: { slide: [1, 0, 0], spring: -1, gravity: false } },
    expect: [
      { at: TAU / 20, part: "rod", label: "齒的斜面把桿推出去", quote: "右側的桿被設計成持續按壓於齒或輪緣邊緣上" },
      { at: TAU / 10, part: "rod", label: "過了齒尖,彈簧把桿壓回下一個齒根" },
      { at: TAU / 4, part: "rod", label: "轉過兩齒半,桿照齒形一進一退" },
    ],
  },
  view: { direction: [0.02, 0.02, 1], fov: 14 },
  pose(theta) {
    const x = rodX(theta);
    const z = ROD_Z;
    return {
      parts: {
        wheel: { angle: theta },
        rod: { position: [x, ROD_Y, z] },
        spring: { from: [x + 1.26, ROD_Y, z], to: [2.31, ROD_Y, z] },
      },
      readouts: [],
    };
  },
};
