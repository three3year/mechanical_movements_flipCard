// 第 198 種:第 197 種的變形。小齒輪雖然旋轉,但不像第 197 種那樣升降。齒條是一圈長圓形、齒朝內的齒環,
// 裝在一塊承載板上;承載板以兩根桿與主框架鉸接,所以小齒輪走到齒條末端時,會憑自身的運動把齒條抬起(或壓下),
// 接著沿另一側繼續走,主框架就往回走。主框架由上下四個滾子引導,只能左右移動。主動件是小齒輪。
// 推斷:小齒輪軸固定;兩根鉸接桿近似平行,承載板相對主框架只上下移動(桿長的微小變化忽略,標為可伸縮);
// 中間的直條連接兩根桿的中點。
import { TAU } from "./kit.js";
import { manglePath, arcLength } from "./mangle-path.js";
import { shape, rect, offsetLoop } from "./shapes.js";
import { toothedLoop, resample } from "./noncircular.js";

const HALF = 1.75; // 齒環直段的半長
const H = 0.5; // 齒環節線的半高(兩端半圓的半徑)
const SEGMENTS = [
  { line: [-HALF, -H], to: [HALF, -H] }, // 下排(小齒輪在其上方)
  { arc: [HALF, 0], r: H, from: -Math.PI / 2, to: Math.PI / 2 },
  { line: [HALF, H], to: [-HALF, H] }, // 上排(小齒輪在其下方)
  { arc: [-HALF, 0], r: H, from: Math.PI / 2, to: (3 * Math.PI) / 2 },
];
const NT = Math.round(arcLength(SEGMENTS) / 0.3);
const PITCH = arcLength(SEGMENTS) / NT;
const NP = 8;
const RP = (NP * PITCH) / TAU;
const path = manglePath(SEGMENTS, RP, "slide");
const PINION = [-1.1, H - RP]; // 小齒輪軸固定的位置(原圖:靠上排)

/** 小齒輪轉 alpha:主框架的位移、承載板(齒條)相對主框架的升降 */
export function rack(alpha) {
  const { q, pinion } = path.at(alpha * path.sense);
  return { frame: PINION[0] - q[0], lift: PINION[1] - q[1], pinion };
}
export const period = path.period;
export const radii = { H, RP };
const START = path.driveWhere(([x, y]) => y > 0 && x <= PINION[0]);

const pitchLoop = resample(path.pitch.slice(0, -1), 0.02);
const M = PITCH / Math.PI;
const teeth = toothedLoop(pitchLoop, { pitch: PITCH, addendum: M, dedendum: 1.2 * M, start: 0, into: -1 });
const ringOutline = offsetLoop(pitchLoop, 0.28);
// 鉸接桿:主框架上的樞軸與承載板上的樞軸(各自的局部座標)
const RODS = [
  { frame: [-2.65, 1.17], carrier: [2.2, 0.77] },
  { frame: [-2.6, -1.08], carrier: [2.2, -0.98] },
];
const ROLLERS = [[-2.05, 1.72, 1], [0.95, 1.72, 1], [-2.05, -1.68, -1], [1.1, -1.68, -1]];
const ROLLER = 0.35;

export default {
  figure: 198,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(rect(6.1, 2.7, -0.05, 0.02)), thickness: 0.12, at: [0, 0, -0.35] },
        ...RODS.map((r) => ({ kind: "cylinder", radius: 0.1, inner: 0.04, length: 0.35, at: [...r.frame, 0.05] })),
      ],
    },
    {
      id: "carrier",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape([[-2.5, -1.25], [2.45, -1.25], [2.5, 0.95], [-2.45, 0.95]], [[...ringOutline].reverse()]), thickness: 0.1, at: [0, 0, -0.22] },
        { kind: "plate", shape: shape(ringOutline, [[...teeth].reverse()]), thickness: 0.22, at: [0, 0, -0.1], engrave: [path.centers.slice(0, -1)] },
        ...RODS.map((r) => ({ kind: "cylinder", radius: 0.1, inner: 0.04, length: 0.35, at: [...r.carrier, 0.05] })),
      ],
    },
    { id: "rodTop", kind: "link", width: 0.1, thickness: 0.06, stretch: true },
    { id: "rodBottom", kind: "link", width: 0.1, thickness: 0.06, stretch: true },
    { id: "bar", kind: "link", width: 0.22, thickness: 0.06, stretch: true },
    { id: "pinion", kind: "gear", center: [...PINION, 0], teeth: NP, radius: RP, width: 0.22, web: false, pieces: [{ kind: "cylinder", radius: 0.07, length: 0.8 }] },
    ...ROLLERS.map(([x, y], i) => ({ id: `roller${i}`, kind: "group", center: [x, y, -0.35], spin: ROLLER, pieces: [{ kind: "cylinder", radius: ROLLER, inner: 0.06, length: 0.2, mark: true }], arrow: i === 0 || i === 2 })),
  ],
  driver: { part: "pinion", type: "rotation", initial: START * path.sense, speed: 2.5 },
  target: "frame",
  view: { direction: [0.06, 0.05, 1] },
  pose(alpha) {
    const { frame, lift, pinion } = rack(alpha);
    const onFrame = ([x, y], z) => [x + frame, y, z];
    const onCarrier = ([x, y], z) => [x + frame, y + lift, z];
    const ends = RODS.map((r) => [onFrame(r.frame, 0.25), onCarrier(r.carrier, 0.25)]);
    const mid = ([a, b]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0.32];
    const parts = {
      frame: { position: [frame, 0, 0] },
      carrier: { position: [frame, lift, 0] },
      rodTop: { from: ends[0][0], to: ends[0][1] },
      rodBottom: { from: ends[1][0], to: ends[1][1] },
      bar: { from: mid(ends[0]), to: mid(ends[1]) },
      pinion: { angle: path.phase(NP) + pinion },
    };
    ROLLERS.forEach(([, , side], i) => (parts[`roller${i}`] = { angle: (side * frame) / ROLLER }));
    return { parts, readouts: [] };
  },
};
