// 第 484 種:繞在圓筒上的螺旋葉片,把風或水流的運動轉換為旋轉運動。
// 主動件是虛擬的「進程」:風已帶著圓筒轉了幾圈。風以流體示意(空氣)沿軸的方向吹過。
// 推斷:葉片繞圓筒一圈,圓筒的軸架在兩邊的軸承上;風沿軸從左吹到右,推著斜的葉片使圓筒轉。
// 葉片是連續的螺旋面(原圖:板面斜著繞在圓筒上),以一塊塊沿螺旋排列、順著螺旋面斜放的薄板拼成:每塊的板面含半徑方向與
// 中間半徑處的螺旋切線,所以板面的法向有沿軸的分量,沿軸吹的風推在板面上;相鄰兩塊在接縫處相接。
import { TAU, X, cross, norm, add, scale, quatFromBasis } from "./kit.js";
import { stream } from "./flow.js";

export const LENGTH = 2.6;
export const DRUM = 0.45;
export const VANE = 1.15;
const SLATS = 72;
const SPEED = TAU * 0.5;
const LEAD = (LENGTH - 0.2) / TAU; // 螺旋每轉一弧度沿軸前進的距離(繞一圈走完 LENGTH − 0.2)

// 葉片的一塊(局部 z 沿軸):原點在軸上,板面的局部 x 沿半徑、y 沿中間半徑處的螺旋切線;外形是內窄外寬的梯形,
// 寬度照各半徑處螺旋線的長度(兩邊各多 2% 疊進相鄰的一塊)
const STEP = TAU / SLATS;
const half = (r) => 0.51 * STEP * Math.hypot(r, LEAD);
const MID = (DRUM + VANE) / 2;
const slats = Array.from({ length: SLATS }, (_, i) => {
  const a = (i + 0.5) * STEP;
  const radial = [Math.cos(a), Math.sin(a), 0];
  const tangent = norm(add(scale([-Math.sin(a), Math.cos(a), 0], MID), [0, 0, LEAD]));
  return {
    kind: "plate",
    role: "vane",
    shape: { outline: [[DRUM - 0.02, -half(DRUM)], [VANE, -half(VANE)], [VANE, half(VANE)], [DRUM - 0.02, half(DRUM)]], holes: [] },
    thickness: 0.04,
    at: [0, 0, -LENGTH / 2 + 0.1 + LEAD * a],
    rotation: quatFromBasis(radial, tangent, cross(radial, tangent)),
    ...(i === 0 ? { accent: true } : {}), // 第一塊塗記號色
  };
});

export default {
  figure: 484,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [4.4, 0.15, 1.4], at: [0, -1.45, 0] },
        { kind: "box", size: [0.3, 1.5, 0.5], at: [-LENGTH / 2 - 0.45, -0.7, 0] },
        { kind: "box", size: [0.3, 1.5, 0.5], at: [LENGTH / 2 + 0.45, -0.7, 0] },
      ],
    },
    {
      id: "drum",
      kind: "group",
      axis: X,
      spin: VANE + 0.15,
      pieces: [
        { kind: "cylinder", radius: DRUM, length: LENGTH },
        { kind: "cylinder", radius: 0.07, length: LENGTH + 1.1 },
        ...slats,
      ],
    },
  ],
  powered: ["drum"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.12 },
  target: "drum",
  view: { direction: [0.15, 0.25, 1] },
  pose(progress) {
    const travel = progress * SPEED;
    const wind = [-0.75, 0, 0.75].flatMap((y) => [-0.6, 0.6].flatMap((z) => stream([[-2.4, y, z], [2.4, y, z]], travel * 1.5, { spacing: 0.5 })));
    return {
      parts: { drum: { angle: -TAU * progress } },
      flows: [{ fluid: "air", points: wind }],
      readouts: [],
    };
  },
};
