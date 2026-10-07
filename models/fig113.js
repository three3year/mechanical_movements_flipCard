// 第 113 種:齒條與小齒輪,把圓周運動轉換為直線運動(或反之)。齒條固定在上方的平板下面,
// 平板兩端擱在滾輪上(照原圖,滾輪在齒條兩端外側、平板下面);轉動小齒輪,齒條連同平板直線移動,
// 移動量等於節圓上轉過的弧長,滾輪被平板帶著轉。小齒輪與滾輪的軸都裝在後面的軸承座上(軸承座是推斷)。
import { rackOffset, circularPitch } from "./gears.js";
import { pedestal } from "./supports.js";

export const PINION = { center: [0, 0, 0], teeth: 14, radius: 0.7 };
const PITCH = circularPitch(PINION);
const RACK = { origin: [0, PINION.radius, 0], dir: [1, 0, 0], pitch: PITCH };
const TEETH = 13;
const PLATE_Y = PINION.radius + 0.57; // 平板的中心高度(厚 0.14)
const ROLLER = { x: 3.1, r: 0.3 }; // 滾輪在齒條兩端外側:齒條走到盡頭也碰不到
const RANGE = 1.0; // 小齒輪轉角的範圍:平板走到盡頭時兩端仍擱在滾輪上
const FLOOR = -1.25;

/** 小齒輪轉 angle:齒條的位移 */
export const rackX = (angle) => rackOffset(PINION, RACK, angle);
export const pitch = PITCH;
export const roller = ROLLER;

export default {
  figure: 113,
  parts: [
    { id: "pinion", kind: "gear", center: PINION.center, teeth: PINION.teeth, radius: PINION.radius, width: 0.3, bore: 0.12, pieces: [{ kind: "cylinder", radius: 0.12, length: 1.0, at: [0, 0, -0.35] }] },
    {
      id: "rack",
      kind: "group",
      pieces: [
        { kind: "rack", teeth: TEETH, pitch: PITCH, depth: 0.35, width: 0.3, at: [0, PINION.radius, 0], angle: Math.PI },
        { kind: "box", size: [7.9, 0.14, 0.5], at: [0, PLATE_Y, 0] },
      ],
    },
    // 滾輪:平板擱在上面,被平板帶著轉(兩個同向,只留一個箭頭)
    ...[["rollerL", -1], ["rollerR", 1]].map(([id, side]) => ({
      id,
      kind: "cylinder",
      center: [side * ROLLER.x, PLATE_Y - 0.07 - ROLLER.r, 0],
      radius: ROLLER.r,
      length: 0.4,
      mark: true,
      arrow: side < 0,
      pieces: [{ kind: "cylinder", radius: 0.08, length: 1.0, at: [0, 0, -0.35] }],
    })),
    {
      id: "frame",
      kind: "group",
      pieces: [
        ...pedestal({ at: [0, 0], z: -0.65, bore: 0.12, floor: FLOOR }),
        ...[-1, 1].flatMap((side) => pedestal({ at: [side * ROLLER.x, PLATE_Y - 0.07 - ROLLER.r], z: -0.65, bore: 0.08, floor: FLOOR })),
      ],
    },
  ],
  driver: { part: "pinion", type: "rotation", range: [-RANGE, RANGE] },
  target: "rack", // 直線移動的齒條
  view: { direction: [0.06, 0.06, 1] },
  pose(angle) {
    const x = rackX(angle);
    const roll = -x / ROLLER.r; // 平板往右,滾輪頂端跟著往右:順時針
    return { parts: { pinion: { angle }, rack: { position: [x, 0, 0] }, rollerL: { angle: roll }, rollerR: { angle: roll } }, readouts: [] };
  },
};

