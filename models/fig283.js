// 第 283 種:科學實驗用小型氣泵的操作方式。手柄裝在小齒輪的軸上,來回扳動手柄,小齒輪帶動齒條上下移動,
// 齒條上下移動即帶動泵的活塞。主動件是手柄。
// 原圖小齒輪兩側各有一支齒條,各自往下穿過台板接到下方的一個泵缸(雙缸泵):手柄往一邊扳時右齒條上升、
// 左齒條下降,扳回時反過來,兩缸輪流抽氣。原文只提右側的齒條,左側的照原圖補上。
// 推斷:齒條下端以活塞桿穿過台板的孔接到缸內的活塞;小齒輪軸後面的軸承座;手柄可扳的角度。
import { deg, clamp } from "./kit.js";
import { rackOffset, circularPitch } from "./gears.js";
import { shape, thickLine } from "./shapes.js";
import { pedestal } from "./supports.js";

const PINION = { center: [0, 0.9, 0.25], teeth: 16, radius: 0.55 };
const RACK = { origin: [PINION.radius + PINION.center[0], 0.9, 0.25], dir: [0, 1, 0], pitch: circularPitch(PINION) };
export const RANGE = [deg(-55), deg(55)];
const TEETH = 15;
const HALF = (TEETH * RACK.pitch) / 2; // 齒條半長
const BACK = 0.17; // 齒條本體中線離節線(往齒的背面)
const ROD = 2.0; // 齒條下端到活塞的活塞桿長
const ROD_X = PINION.radius + BACK; // 活塞桿離小齒輪中心的水平距離
const PLATE_Y = -1.95; // 台板中心高度
const BARREL = { top: PLATE_Y - 0.11, length: 1.45, radius: 0.34 };

/** 手柄轉 a:右齒條的位移(往上為正);左齒條反向移動同樣的量 */
export const rack = (a) => rackOffset(PINION, RACK, clamp(a, ...RANGE));

const column = (x) => [
  { kind: "cylinder", axis: [0, 1, 0], radius: 0.24, length: 2.5, at: [x, -0.6, 0] },
  { kind: "box", size: [0.75, 0.55, 0.75], at: [x, 0.95, 0] },
  { kind: "cylinder", axis: [0, 1, 0], radius: 0.16, length: 0.35, at: [x, 1.4, 0] },
];
// 台板:中間留兩個方孔讓活塞桿穿過
const plate = () => {
  const gap = 0.12;
  const xs = [-2.2, -ROD_X - gap, -ROD_X + gap, ROD_X - gap, ROD_X + gap, 2.2];
  const pieces = [];
  for (let i = 0; i < xs.length; i += 2) pieces.push({ kind: "box", size: [xs[i + 1] - xs[i], 0.22, 1.2], at: [(xs[i] + xs[i + 1]) / 2, PLATE_Y, 0] });
  const zr = RACK.origin[2]; // 活塞桿所在的 z
  for (const x of [-ROD_X, ROD_X]) {
    pieces.push({ kind: "box", size: [2 * gap, 0.22, 0.6 - zr - gap], at: [x, PLATE_Y, (0.6 + zr + gap) / 2] });
    pieces.push({ kind: "box", size: [2 * gap, 0.22, zr - gap + 0.6], at: [x, PLATE_Y, (zr - gap - 0.6) / 2] });
  }
  return pieces;
};
// 泵缸(台板下方,上端開口接活塞桿)
const barrel = (x) => [
  { kind: "cylinder", axis: [0, 1, 0], radius: BARREL.radius, inner: BARREL.radius - 0.05, length: BARREL.length, at: [x, BARREL.top - BARREL.length / 2, RACK.origin[2]] },
  { kind: "cylinder", axis: [0, 1, 0], radius: BARREL.radius, length: 0.08, at: [x, BARREL.top - BARREL.length - 0.04, RACK.origin[2]] },
];
// 齒條(局部:沿 x,齒朝 +y)往下接活塞桿與活塞;down 是「往下」在齒條局部 x 上的方向
const rackPart = (id, down) => ({
  id,
  kind: "rack",
  teeth: TEETH,
  pitch: RACK.pitch,
  width: 0.22,
  depth: 0.18,
  pieces: [
    { kind: "cylinder", axis: [1, 0, 0], radius: 0.07, length: ROD, at: [down * (HALF + ROD / 2), -BACK, 0] },
    { kind: "cylinder", axis: [1, 0, 0], radius: BARREL.radius - 0.06, length: 0.16, at: [down * (HALF + ROD), -BACK, 0] }, // 活塞
  ],
});

export default {
  figure: 283,
  parts: [
    {
      id: "stand",
      kind: "group",
      pieces: [
        ...column(-1.55),
        ...column(1.55),
        ...plate(),
        ...barrel(-ROD_X),
        ...barrel(ROD_X),
        // 台板的腳與地板
        ...[-1.9, 1.9].map((x) => ({ kind: "box", size: [0.3, 1.6, 0.6], at: [x, PLATE_Y - 0.91, 0] })),
        { kind: "box", size: [4.6, 0.2, 1.3], at: [0, PLATE_Y - 1.81, 0] },
        // 小齒輪軸的軸承座(在齒輪後面)
        ...pedestal({ at: PINION.center, z: -0.35, bore: 0.08, floor: PLATE_Y + 0.11 }),
      ],
    },
    {
      id: "pinion",
      kind: "gear",
      center: PINION.center,
      teeth: PINION.teeth,
      radius: PINION.radius,
      width: 0.22,
      bore: 0.08,
      pieces: [
        { kind: "cylinder", radius: 0.08, length: 0.75, at: [0, 0, -0.42] }, // 軸,往後穿過軸承座
        // 手柄:從小齒輪往左上彎出去
        { kind: "plate", shape: shape(thickLine([[0, 0], [-0.7, 0.45], [-1.3, 0.55], [-1.55, 0.35]], 0.13)), thickness: 0.12, at: [0, 0, 0.17] },
      ],
    },
    rackPart("rack", -1),
    rackPart("rackL", 1),
  ],
  driver: { part: "pinion", type: "rotation", range: RANGE, initial: 0 },
  targets: ["rack", "rackL"], // 帶動活塞的兩支齒條
  view: { direction: [0.04, 0.06, 1] },
  pose(a) {
    const s = rack(a);
    const [x0, y0, z] = RACK.origin;
    // 右齒條齒朝 −x(轉 90°);左齒條是右齒條繞小齒輪中心轉半圈的樣子(齒朝 +x,反向移動)
    return {
      parts: {
        pinion: { angle: clamp(a, ...RANGE) },
        rack: { position: [x0, y0 + s, z], angle: Math.PI / 2 },
        rackL: { position: [2 * PINION.center[0] - x0, 2 * PINION.center[1] - y0 - s, z], angle: -Math.PI / 2 },
      },
      readouts: [],
    };
  },
};
