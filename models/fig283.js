// 第 283 種:科學實驗用小型氣泵的操作方式。手柄裝在小齒輪的軸上,來回扳動手柄,小齒輪帶動右側的齒條上下移動,
// 齒條上下移動即帶動泵的活塞。主動件是手柄。
// 推斷:齒條帶動活塞的連接方式(原圖沒有畫出);手柄可扳的角度。
import { deg, clamp } from "./kit.js";
import { rackOffset, circularPitch } from "./gears.js";
import { shape, thickLine } from "./shapes.js";

const PINION = { center: [0, 0.9, 0.25], teeth: 16, radius: 0.55 };
const RACK = { origin: [PINION.radius + PINION.center[0], 0.9, 0.25], dir: [0, 1, 0], pitch: circularPitch(PINION) };
export const RANGE = [deg(-55), deg(55)];

/** 手柄轉 a:齒條的位移(往上為正) */
export const rack = (a) => rackOffset(PINION, RACK, clamp(a, ...RANGE));

const column = (x) => [
  { kind: "cylinder", axis: [0, 1, 0], radius: 0.24, length: 1.9, at: [x, -0.95, 0] },
  { kind: "box", size: [0.75, 0.55, 0.75], at: [x, 0.25, 0] },
  { kind: "cylinder", axis: [0, 1, 0], radius: 0.16, length: 0.35, at: [x, 0.7, 0] },
  { kind: "cylinder", axis: [0, 1, 0], radius: 0.33, length: 0.6, at: [x, -2.25, 0.05] },
];

export default {
  figure: 283,
  parts: [
    {
      id: "stand",
      kind: "group",
      pieces: [
        ...column(-1.55),
        ...column(1.55),
        { kind: "box", size: [4.3, 0.22, 1.2], at: [0, -1.95, 0] },
        { kind: "box", size: [4.6, 0.3, 1.3], at: [0, -2.6, 0] },
        { kind: "plate", shape: shape(thickLine([[-0.9, 0.1], [-0.6, 1.3], [0, 1.45]], 0.16)), thickness: 0.15, at: [0, 0, -0.05] },
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
      // 手柄:從小齒輪往左上彎出去
      pieces: [{ kind: "plate", shape: shape(thickLine([[0, 0], [-0.7, 0.45], [-1.3, 0.55], [-1.55, 0.35]], 0.13)), thickness: 0.12, at: [0, 0, 0.17] }],
    },
    { id: "rack", kind: "rack", teeth: 15, pitch: RACK.pitch, width: 0.22, depth: 0.18 },
  ],
  driver: { part: "pinion", type: "rotation", range: RANGE, initial: 0 },
  view: { direction: [0.04, 0.06, 1] },
  pose(a) {
    const s = rack(a);
    // 齒條沿 y,齒朝 −x(朝小齒輪):把齒條零件繞 z 轉 90°
    return { parts: { pinion: { angle: clamp(a, ...RANGE) }, rack: { position: [RACK.origin[0], RACK.origin[1] + s, 0.25], angle: Math.PI / 2 } }, readouts: [] };
  },
};
