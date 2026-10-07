// 第 197 種:曼格式齒條(mangle-rack)。方形框架中間一排銷(齒條),小齒輪連續旋轉,給框架往復的運動:
// 小齒輪在銷排上方時框架往一邊走,走到盡頭繞過端點的銷到下方,框架就往回走。小齒輪軸必須能自由升降,
// 以便繞過齒條兩端的引導部(兩端的 C 形導板)。主動件是小齒輪。
// 推斷:小齒輪軸只升降、不左右移動;框架只左右平移。原文另一種用法(固定框架、小齒輪軸裝萬向接頭,
// 軸端畫出類似圖中的軌跡)以小齒輪軸心的軌跡刻線表示。
// 推斷(原圖沒畫):框架上下的導軌;小齒輪的驅動軸往前下方伸到固定的萬向接頭(見 pinion-drive.js)。
import { TAU } from "./kit.js";
import { manglePath } from "./mangle-path.js";
import { shape, rect, stadium, arcPoints } from "./shapes.js";
import { pinionDrive } from "./pinion-drive.js";

const PINS = 11;
const PITCH = 0.345;
const X0 = -((PINS - 1) * PITCH) / 2;
const X1 = -X0;
const NP = 10;
const RP = (NP * PITCH) / TAU;
const SEGMENTS = [
  { line: [X0, 0], to: [X1, 0] }, // 小齒輪在銷排上方
  { pin: [X1, 0], sweep: -Math.PI }, // 繞過右端的銷
  { line: [X1, 0], to: [X0, 0] }, // 在下方往回
  { pin: [X0, 0], sweep: -Math.PI },
];
const path = manglePath(SEGMENTS, RP, "slide");
const PX = -0.77; // 小齒輪軸的水平位置(原圖)
const FLOOR = -3.1;
const DRIVE = pinionDrive({ fixed: [PX, -2.6, 1.6], floor: FLOOR });

/** 小齒輪轉 alpha:框架的位移與小齒輪軸心的高度 */
export function rack(alpha) {
  const { q, pinion } = path.at(alpha * path.sense);
  return { frame: PX - q[0], y: q[1], pinion };
}
export const period = path.period;
export const pitch = PITCH;
export const pinionRadius = RP;
const START = path.driveWhere(([x, y]) => y > 0.5 && x >= PX);

const guide = (sign) => {
  const c = [sign * (X1 + 0.05), 0];
  const a0 = sign > 0 ? -1.4 : Math.PI - 1.4;
  const a1 = a0 + 2.8;
  return shape([...arcPoints(1.0, a0, a1, ...c), ...arcPoints(0.88, a1, a0, ...c)]);
};
const track = stadium(4.25, 0.84);

export default {
  figure: 197,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(rect(6.1, 3.05, -0.07, 0.02)), thickness: 0.15, at: [0, 0, -0.3], engrave: [path.centers.slice(0, -1).map(([x, y]) => [x, y])] },
        { kind: "plate", shape: shape(track.outline.map(([x, y]) => [x - 2.125, y]), [stadium(4.13, 0.72).outline.map(([x, y]) => [x - 2.065, y]).reverse()]), thickness: 0.12, at: [0, 0, -0.17] },
        { kind: "plate", shape: guide(1), thickness: 0.2, at: [0, 0, -0.12] },
        { kind: "plate", shape: guide(-1), thickness: 0.2, at: [0, 0, -0.12] },
        ...Array.from({ length: PINS }, (_, i) => ({ kind: "cylinder", radius: 0.065, length: 0.55, at: [X0 + i * PITCH, 0, 0.0], accent: i === 0 })),
      ],
    },
    { id: "pinion", kind: "gear", teeth: NP, radius: RP, width: 0.22, web: false, hub: false, pieces: [{ kind: "cylinder", radius: 0.07, length: 0.5, at: [0, 0, 0.1] }] }, // 軸不往後穿過機架板(小齒輪沿齒條內外移動)
    DRIVE.part,
    DRIVE.joint,
    {
      id: "guides",
      kind: "group",
      pieces: [
        // 框架上下的導軌(框架只左右平移)與托著導軌的立柱
        { kind: "box", size: [10.0, 0.12, 0.25], at: [-0.8, 1.62, -0.3] },
        { kind: "box", size: [10.0, 0.12, 0.25], at: [-0.8, -1.62, -0.3] },
        ...[-5.6, 4.0].flatMap((x) => [{ kind: "box", size: [0.2, 1.68 - FLOOR, 0.2], at: [x, (1.68 + FLOOR) / 2, -0.55] }, { kind: "box", size: [0.2, 0.2, 0.3], at: [x, 1.62, -0.4] }, { kind: "box", size: [0.2, 0.2, 0.3], at: [x, -1.62, -0.4] }]),
        { kind: "box", size: [10.0, 0.12, 1.0], at: [-0.8, FLOOR - 0.06, -0.3] },
        ...DRIVE.pieces,
      ],
    },
  ],
  driver: { part: "pinion", type: "rotation", initial: START * path.sense, speed: 2.5 },
  target: "frame",
  view: { direction: [0.06, 0.05, 1] },
  pose(alpha) {
    const { frame, y, pinion } = rack(alpha);
    return {
      parts: {
        frame: { position: [frame, 0, 0] },
        pinion: { position: [PX, y, 0.05], angle: path.phase(NP) + pinion },
        ...DRIVE.pose([PX, y, 0.4]),
      },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["frame", "pinion"], reason: "簡化齒形:小齒輪與機架上那圈齒條的梯形齒互相擦到 0.04(96 個取樣中 41 個)" },
  ],
};
