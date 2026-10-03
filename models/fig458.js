// 第 458 種:常見的汲水用滑輪與水桶:把空桶往下拉,抬起盛滿水的水桶。
// 主動件是左邊的水桶(拉它往下)。
// 推斷:一條繩子繞過井頂屋簷下的滑輪,兩端各掛一個水桶;往下走的是空桶,在井底裝滿;往上走的是滿桶,到頂上倒空後
// 輪到它往下;井壁畫成剖面。
import { stroke } from "./pump.js";
import { shape, thickLine } from "./shapes.js";

const PULLEY = { center: [0, 2.4, 0], radius: 0.42 };
export const TOP = 1.2; // 水桶在上面的高度
export const BOTTOM = -1.9; // 水桶在井底(水裡)的高度
const GROUND = -0.2;

/** 主動量 v → 左、右水桶高度與誰裝滿 */
export function buckets(v) {
  const { at, forward } = stroke(v, TOP, BOTTOM);
  // forward:左桶往下(空),右桶往上(滿)
  return { left: at, right: TOP + BOTTOM - at, leftFull: !forward, rightFull: forward };
}

const bucketPart = (id) => ({ id, kind: "lathe", axis: [0, 1, 0], profile: [[0.2, -0.25], [0.25, 0.25], [0.22, 0.25], [0.17, -0.21], [0, -0.21], [0, -0.25]], arrow: false, pieces: [{ kind: "box", size: [0.52, 0.03, 0.03], at: [0, 0.32, 0] }] });

export default {
  figure: 458,
  parts: [
    {
      id: "house",
      kind: "group",
      pieces: [
        // 井口兩側的地、井壁(剖面)
        { kind: "box", size: [1.6, 2.4, 1.6], at: [-1.6, GROUND - 1.2, 0] },
        { kind: "box", size: [1.6, 2.4, 1.6], at: [1.6, GROUND - 1.2, 0] },
        // 立柱與屋頂
        { kind: "box", size: [0.14, 3.0, 0.14], at: [-1.0, GROUND + 1.5, 0] },
        { kind: "box", size: [0.14, 3.0, 0.14], at: [1.0, GROUND + 1.5, 0] },
        { kind: "plate", shape: shape(thickLine([[-1.35, 2.55], [0, 3.25], [1.35, 2.55]], 0.1)), thickness: 1.2 },
        { kind: "box", size: [2.2, 0.1, 0.1], at: [0, 2.85, 0] },
        { kind: "box", size: [0.06, 0.5, 0.06], at: [0, 2.85 - 0.2, 0] },
        // 左邊柱上的水桶架
        { kind: "box", size: [0.6, 0.08, 0.5], at: [-1.3, 1.0, 0] },
      ],
    },
    { id: "well", kind: "fill", fluid: "water", center: [0, -2.15, 0], size: [1.55, 0.5, 1.4], level: 1 },
    { id: "pulley", kind: "pulley", style: "spoked", center: PULLEY.center, radius: PULLEY.radius, width: 0.12 },
    { id: "rope", kind: "rope", radius: 0.015 },
    bucketPart("bucketL"),
    bucketPart("bucketR"),
    { id: "waterL", kind: "fill", fluid: "water", shape: "cylinder", size: [0.38, 0.4, 0], level: 0 },
    { id: "waterR", kind: "fill", fluid: "water", shape: "cylinder", size: [0.38, 0.4, 0], level: 0 },
  ],
  waivers: [
    { check: "unsupported", parts: ["pulley"], reason: "待確認(未修):pulley 在動,但離帶動(或支撐)它的零件還有 0.55 的空隙,少了相連的軸、銷或連桿,尚未補上" },
    { check: "unsupported", parts: ["bucketL"], reason: "待確認(未修):bucketL 在動,但離帶動(或支撐)它的零件還有 0.12 的空隙,少了相連的軸、銷或連桿,尚未補上" },
    { check: "unsupported", parts: ["bucketR"], reason: "待確認(未修):bucketR 在動,但離帶動(或支撐)它的零件還有 0.12 的空隙,少了相連的軸、銷或連桿,尚未補上" },
    { check: "unsupported", parts: ["rope"], reason: "待確認(未修):rope 在動,但離帶動(或支撐)它的零件還有 0.22 的空隙,少了相連的軸、銷或連桿,尚未補上" },
    { check: "interference", parts: ["house", "pulley"], reason: "待確認:house 的方塊 0.06×0.5×0.06 與 pulley 的方塊 0.314×0.05×0.054重疊 0.05,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
  ],
  driver: { part: "bucketL", type: "translation", direction: [0, -1, 0], cycle: [TOP, BOTTOM] },
  target: "bucketR", // 被抬起的滿桶
  view: { direction: [0.1, 0.06, 1] },
  pose(v) {
    const b = buckets(v);
    const r = PULLEY.radius;
    const [cx, cy] = PULLEY.center;
    const arc = Array.from({ length: 13 }, (_, i) => {
      const a = Math.PI - (Math.PI * i) / 12;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a), 0];
    });
    return {
      parts: {
        pulley: { angle: (b.left - TOP) / r },
        bucketL: { position: [-r, b.left, 0] },
        bucketR: { position: [r, b.right, 0] },
        waterL: { position: [-r, b.left, 0], level: b.leftFull ? 0.9 : 0 },
        waterR: { position: [r, b.right, 0], level: b.rightFull ? 0.9 : 0 },
      },
      paths: { rope: { points: [[-r, b.left + 0.32, 0], ...arc, [r, b.right + 0.32, 0]], closed: false, phase: 0 } }, // 路徑從繩端(左桶)起算
      readouts: [{ label: "水桶", value: b.rightFull ? "拉空桶(左)往下,滿桶(右)上來" : "拉空桶(右)往下,滿桶(左)上來" }],
    };
  },
};
