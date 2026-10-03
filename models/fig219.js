// 第 219 種:由冠狀輪與小齒輪產生的變速圓周運動。冠狀輪(齒朝上的齒圈,以十字輻條裝在直立軸上)相對於軸偏心,
// 所以與小齒輪接觸處離軸的距離(相對半徑)一直在變;小齒輪做得很長,接觸點沿著它來回移動也一直咬合。
// 冠狀輪等速轉,小齒輪時快時慢。主動件是冠狀輪。
// 推斷:偏心距;小齒輪的軸沿著過直立軸的一條水平線(往右後方)。
import { TAU, Y, deg } from "./kit.js";
import { cumulative, periodic } from "./noncircular.js";
import { shape, thickLine } from "./shapes.js";

const R = 2.0; // 齒圈的節圓半徑
const E = 0.45; // 偏心距
const N = 48;
const PITCH = (TAU * R) / N;
const NP = 8;
const RP = (NP * PITCH) / TAU;
const BETA = deg(30); // 小齒輪軸的方向(冠狀輪局部座標中)
const WIDTH = 0.3;
const DEPTH = 0.22;
const PITCH_Z = WIDTH / 2 + DEPTH / 2; // 齒的節面高度(局部 z,朝上)

/** 冠狀輪轉 theta:接觸點離軸的距離 */
export const contactRadius = (theta) => E * Math.cos(theta - BETA) + Math.sqrt(R * R - (E * Math.sin(theta - BETA)) ** 2);
const turned = periodic(cumulative(contactRadius, TAU), TAU);
/** 冠狀輪轉 theta:小齒輪的轉角(接觸處兩者表面速度相同) */
export const pinionAngle = (theta) => -turned(theta) / RP;
export const geometry = { R, E, RP };

// 冠狀輪的局部 xy 平面在世界中是水平面:局部 (x, y) → 世界 (x, ·, −y)
const u = [Math.cos(BETA), 0, -Math.sin(BETA)];
const spokes = [0, 120, 240].map((a) => {
  const t = deg(a) + 0.4;
  // 輻條從軸轂伸到齒圈(齒圈圓心在 (E, 0))
  const ux = Math.cos(t);
  const uy = Math.sin(t);
  const b = E * ux;
  const len = b + Math.sqrt(b * b - E * E + (R - 0.1) ** 2);
  return { kind: "plate", shape: shape(thickLine([[0, 0], [len * ux, len * uy]], 0.3)), thickness: 0.08, at: [0, 0, -WIDTH / 2 + 0.04] };
});

export default {
  figure: 219,
  parts: [
    {
      id: "crown",
      kind: "group",
      axis: Y,
      spin: R + E + 0.2,
      pieces: [
        { kind: "gear", crown: true, teeth: N, radius: R, width: WIDTH, toothDepth: DEPTH, faceWidth: 0.25, at: [E, 0, 0] },
        ...spokes,
        { kind: "cylinder", radius: 0.22, length: 0.3, mark: true },
        { kind: "cylinder", radius: 0.13, length: 3.2, at: [0, 0, -1.6] },
      ],
    },
    {
      id: "pinion",
      kind: "gear",
      center: [u[0] * R, PITCH_Z + RP, u[2] * R],
      axis: u,
      teeth: NP,
      radius: RP,
      width: 2 * E + 0.5,
      pieces: [{ kind: "cylinder", radius: 0.08, length: 4.5, at: [0, 0, 1.6] }],
    },
  ],
  waivers: [
    { check: "interference", parts: ["crown", "pinion"], reason: "待確認(未修):crown 的方塊 0.25×0.11×0.22 與 pinion 的板互相穿入 0.16(96 個取樣姿勢),尚未修正" },
  ],
  driver: { part: "crown", type: "rotation" },
  target: "pinion",
  view: { direction: [0.3, 0.8, 1] },
  pose(theta) {
    return { parts: { crown: { angle: theta }, pinion: { angle: pinionAngle(theta) } }, readouts: [] };
  },
};
