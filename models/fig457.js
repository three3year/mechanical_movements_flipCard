// 第 457 種:從不深的水井汲水的常見方式(桔槔)。配重約等於所要抬起重量的一半,所以空桶時要把水桶往下拉,
// 盛滿水時則由配重幫忙抬起。
// 主動件是長竿(繞叉形柱頂擺動)。
// 推斷:竿的長端掛水桶、短端綁配重;水桶放到井裡就裝滿;拉力以「水桶重 − 配重在竿端的等效重」的正負表示。
import { deg } from "./kit.js";
import { stroke } from "./pump.js";
import { shape, thickLine } from "./shapes.js";

export const PIVOT = [2.0, 0.6, 0];
export const LONG = 3.9; // 支點到掛桶端
export const SHORT = 1.0; // 支點到配重端
const ROPE = 2.0;
export const SWING = [deg(32), deg(-12)]; // 長端仰角:高 → 低(把空桶放進井裡)
const GROUND = -1.5;
export const WELL_WATER = -2.3;
/** 水重 1、桶重 0.2、配重的等效重(換算到桶端)約為水重的一半 */
export const LOADS = { water: 1, bucket: 0.2, counter: 0.6 };

/** 主動量 v → 長端仰角、是否往下放、水桶位置與裝水 */
export function sweep(v) {
  const { at, forward } = stroke(v, ...SWING);
  const end = [PIVOT[0] - LONG * Math.cos(at), PIVOT[1] + LONG * Math.sin(at), 0];
  const bucket = [end[0], end[1] - ROPE, 0];
  const full = !forward; // 往下放時是空桶,拉上來時裝滿
  return { angle: at, down: forward, end, bucket, full };
}
/** 拉著水桶需要的力(正:要往下拉;負:配重幫忙往上抬) */
export const pull = (full) => LOADS.counter - LOADS.bucket - (full ? LOADS.water : 0);

export default {
  figure: 457,
  parts: [
    {
      id: "ground",
      kind: "group",
      pieces: [
        { kind: "box", size: [6.5, 0.2, 2.0], at: [0.3, GROUND - 0.1, 0] },
        // 叉形柱
        { kind: "plate", shape: shape(thickLine([[PIVOT[0] + 0.05, GROUND], [PIVOT[0], PIVOT[1] - 0.1], [PIVOT[0] - 0.12, PIVOT[1] + 0.25]], 0.16)), thickness: 0.18 },
        { kind: "plate", shape: shape(thickLine([[PIVOT[0], PIVOT[1] - 0.1], [PIVOT[0] + 0.15, PIVOT[1] + 0.25]], 0.12)), thickness: 0.18 },
        // 井口(井欄)與井壁
        { kind: "cylinder", radius: 0.65, inner: 0.55, length: 0.2, axis: [0, 1, 0], at: [PIVOT[0] - LONG * Math.cos((SWING[0] + SWING[1]) / 2), GROUND + 0.05, 0] },
      ],
    },
    { id: "well", kind: "fill", fluid: "water", shape: "cylinder", center: [PIVOT[0] - LONG * Math.cos((SWING[0] + SWING[1]) / 2), WELL_WATER - 0.2, 0], size: [1.1, 0.4, 0], level: 1 },
    {
      id: "pole",
      kind: "plate",
      shape: shape(thickLine([[-LONG, 0], [SHORT, 0]], 0.09)),
      thickness: 0.09,
      arrow: false,
      pieces: [{ kind: "box", size: [0.45, 0.35, 0.35], at: [SHORT - 0.1, -0.1, 0] }],
    },
    { id: "rope", kind: "rope", radius: 0.015 },
    { id: "bucket", kind: "lathe", axis: [0, 1, 0], profile: [[0.22, -0.25], [0.27, 0.25], [0.24, 0.25], [0.19, -0.21], [0, -0.21], [0, -0.25]], pieces: [{ kind: "box", size: [0.56, 0.03, 0.03], at: [0, 0.32, 0] }] },
    { id: "water", kind: "fill", fluid: "water", shape: "cylinder", size: [0.42, 0.4, 0], level: 0 },
  ],
  driver: { part: "pole", grips: ["bucket"], type: "rotation", cycle: SWING },
  target: "bucket",
  view: { direction: [0.15, 0.1, 1] },
  pose(v) {
    const s = sweep(v);
    const f = pull(s.full);
    // 長端的竿與局部 −x 對齊:轉角 = −仰角
    return {
      parts: {
        pole: { position: PIVOT, angle: -s.angle },
        bucket: { position: s.bucket },
        water: { position: s.bucket, level: s.full ? 0.9 : 0 },
      },
      paths: { rope: { points: [s.end, [s.bucket[0], s.bucket[1] + 0.32, 0]], closed: false, phase: 0 } },
      readouts: [
        { label: "水桶", value: s.down ? "空桶,往下拉進井裡" : "裝滿,由配重幫忙抬起" },
        { label: "手要", value: f > 0 ? `往下拉 ${f.toFixed(1)}` : `往上提 ${(-f).toFixed(1)}(配重分擔一半)` },
      ],
    };
  },
};
