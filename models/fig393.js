// 第 393 種:拋光透鏡與球形物體的裝置。拋光料裝在一個杯子裡,杯子經球窩接頭接在一片彎曲的金屬片上,金屬片固定在旋轉的直立軸上,
// 直立軸與要拋光的物體同心。杯子偏心地放著,所以除了跟著軸繞物體的軸轉之外,還在萬向接頭上繞自己的軸轉,
// 杯面上的同一處不會一直碰到透鏡上的同一處。主動件是直立軸(頂上的手輪)。
// 推斷:杯子自轉的轉速(摩擦帶動,取為軸轉速的一個比例);各部尺寸依原圖。
import { Y, Z, quatMul, quatAxisAngle, quatFromZ, rotateAbout } from "./kit.js";
import { shape, thickLine } from "./shapes.js";

const R_LENS = 1.35; // 透鏡(半球)的半徑
const ECC = 0.45; // 杯子偏離軸心的距離
export const SELF = -0.6; // 杯子繞自己的軸轉的轉速(相對軸)

/** 軸轉 a → 杯子中心(在透鏡頂上、偏離軸心)、杯子的自轉角 */
export function polisher(a) {
  const tilt = Math.asin(ECC / R_LENS);
  const local = [R_LENS * Math.sin(tilt), R_LENS * Math.cos(tilt) - 0.25, 0];
  return { center: rotateAbout(local, Y, a), tilt, self: SELF * a };
}

export default {
  figure: 393,
  parts: [
    {
      id: "table",
      kind: "group",
      pieces: [
        { kind: "box", size: [4.4, 0.28, 1.6], at: [0, -0.4, 0] },
        { kind: "plate", shape: shape(thickLine([[-1.9, -0.55], [-1.9, -2.6]], 0.14)), thickness: 0.14 },
        { kind: "plate", shape: shape(thickLine([[-1.9, -2.0], [0.4, -0.55]], 0.12)), thickness: 0.12 },
        // 要拋光的物體(半球形透鏡)
        { kind: "lathe", axis: Y, profile: [[0, -0.26], [R_LENS, -0.26], ...Array.from({ length: 12 }, (_, i) => { const t = ((i + 1) / 12) * (Math.PI / 2); return [R_LENS * Math.cos(t), -0.26 + R_LENS * Math.sin(t) * 0.75]; })] },
      ],
    },
    {
      id: "spindle",
      kind: "group",
      axis: Y,
      center: [0, 2.2, 0],
      spin: 0.55,
      spinOffset: 0.6,
      pieces: [
        { kind: "cylinder", radius: 0.08, length: 1.6, at: [0, 0, -0.1] },
        { kind: "cylinder", radius: 0.55, length: 0.35, at: [0, 0, 0.75], mark: true },
        // 彎曲的金屬片:從軸往外、往下彎到杯子的球窩
        { kind: "tube", points: [[0, 0, -0.85], [0.35, 0, -1.0], [0.6, 0, -1.25], [0.5, 0, -1.35]], radius: 0.05 },
      ],
    },
    {
      id: "cup",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "lathe", profile: [[0, 0], [0.55, 0], [0.75, 0.28], [0.75, 0.38], [0, 0.38]] },
        { kind: "sphere", radius: 0.1, at: [0, 0, 0.45] },
        { kind: "box", size: [0.12, 0.12, 0.08], at: [0.6, 0, 0.3], accent: true },
      ],
    },
  ],
  driver: { part: "spindle", type: "rotation" },
  view: { direction: [0.12, 0.25, 1] },
  pose(a) {
    const p = polisher(a);
    // 杯子的軸(局部 z)沿透鏡表面的法線,隨軸轉;再繞自己的軸自轉
    const n = rotateAbout([Math.sin(p.tilt), Math.cos(p.tilt), 0], Y, a);
    const rotation = quatMul(quatFromZ([-n[0], -n[1], -n[2]]), quatAxisAngle(Z, p.self));
    return { parts: { spindle: { angle: a }, cup: { position: p.center, rotation } }, readouts: [] };
  },
};
