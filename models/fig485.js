// 第 485 種:普通的風車,說明風直接作用在傾斜的帆面上產生圓周運動的原理。
// 主動件是虛擬的「進程」:風已帶著風車轉了幾圈。風以流體示意(空氣)吹向帆面。
// 推斷:四片帆裝在略為仰起的軸上,每片帆繞自己的長邊斜一個角度(風推斜面而轉);塔身與頂蓋依原圖;
// 原圖頂蓋後面的曲線(拉繩)不畫出。
import { TAU, Y, deg, quatAxisAngle, quatMul, quatFromZ, norm } from "./kit.js";
import { stream } from "./flow.js";
import { shape, rect } from "./shapes.js";

export const AXIS = norm([-0.8, 0.15, 0.58]); // 風車軸(從頂蓋指向帆,朝左前方)
export const HUB = [-0.45, 2.55, 0.35];
const SAIL = { from: 0.35, to: 2.0, w: 0.75 };
export const PITCH = deg(18); // 帆面相對旋轉平面的斜角
const SPEED = TAU * 0.6;

// 一片帆:格子框(局部:x 沿帆長,y 沿帆寬,繞 x 斜 PITCH)
const lattice = [
  { kind: "plate", shape: shape(rect(SAIL.to - SAIL.from, SAIL.w, (SAIL.from + SAIL.to) / 2, SAIL.w / 2), [rect(SAIL.to - SAIL.from - 0.1, SAIL.w - 0.1, (SAIL.from + SAIL.to) / 2, SAIL.w / 2).reverse()]), thickness: 0.03 },
  ...[1, 2, 3, 4].map((k) => ({ kind: "box", size: [0.02, SAIL.w, 0.025], at: [SAIL.from + ((SAIL.to - SAIL.from) * k) / 5, SAIL.w / 2, 0] })),
  ...[1, 2].map((k) => ({ kind: "box", size: [SAIL.to - SAIL.from, 0.02, 0.025], at: [(SAIL.from + SAIL.to) / 2, (SAIL.w * k) / 3, 0] })),
  { kind: "box", size: [SAIL.to, 0.06, 0.06], at: [SAIL.to / 2, 0, 0] },
];

export default {
  figure: 485,
  parts: [
    {
      id: "tower",
      kind: "group",
      pieces: [
        { kind: "lathe", axis: Y, profile: [[0, -2.0], [0.95, -2.0], [0.62, 1.9], [0, 1.9]], at: [0.3, 0, 0] },
        { kind: "lathe", axis: Y, profile: [[0, 0], [0.7, 0], [0.6, 0.45], [0.3, 0.75], [0, 0.82]], at: [0.3, 1.9, 0] },
        { kind: "box", size: [0.3, 0.55, 0.05], at: [0.3, -1.65, 0.93] },
        { kind: "box", size: [0.15, 0.3, 0.05], at: [0.1, 0.0, 0.8] },
        { kind: "box", size: [0.15, 0.3, 0.05], at: [0.5, 0.0, 0.8] },
        { kind: "box", size: [5.5, 0.1, 3.0], at: [0, -2.05, 0] },
      ],
    },
    {
      id: "sails",
      kind: "group",
      spin: SAIL.to + 0.2,
      pieces: [
        { kind: "cylinder", radius: 0.12, length: 0.9, at: [0, 0, -0.35] },
        ...[0, 1, 2, 3].flatMap((k) => lattice.map((p) => ({ ...p, rotation: quatMul(quatAxisAngle([0, 0, 1], (k * TAU) / 4), quatAxisAngle([1, 0, 0], PITCH)), at: rotZ(p.at ?? [0, 0, 0], (k * TAU) / 4, PITCH) }))),
      ],
    },
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.15 },
  view: { direction: [0.1, 0.12, 1] },
  pose(progress) {
    const travel = progress * SPEED;
    // 風從左前方吹向帆(沿 −AXIS)
    const wind = [-1, 0, 1].flatMap((a) => [-1, 1].flatMap((b) => {
      const start = [HUB[0] + AXIS[0] * 3 + a * 0.9, HUB[1] + AXIS[1] * 3 + b * 0.8, HUB[2] + AXIS[2] * 3];
      return stream([start, [start[0] - AXIS[0] * 2.6, start[1] - AXIS[1] * 2.6, start[2] - AXIS[2] * 2.6]], travel, { spacing: 0.45 });
    }));
    return {
      parts: { sails: { position: HUB, rotation: quatMul(quatFromZ(AXIS), quatAxisAngle([0, 0, 1], TAU * progress)) } },
      flows: [{ fluid: "air", points: wind }],
      readouts: [],
    };
  },
};

/** 把帆上的一點(局部)先繞 x 斜 pitch,再繞 z 轉到第 k 片的位置 */
function rotZ([x, y, z], a, pitch) {
  const y1 = y * Math.cos(pitch) - z * Math.sin(pitch);
  const z1 = y * Math.sin(pitch) + z * Math.cos(pitch);
  return [x * Math.cos(a) - y1 * Math.sin(a), x * Math.sin(a) + y1 * Math.cos(a), z1];
}
