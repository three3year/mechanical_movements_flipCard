// 第 358 種:托架的橫移運動,由鏈索輪(fusee)依皮帶作用處的直徑變化而改變快慢。左邊的曲柄轉動鏈索輪,
// 皮帶(繩)捲在鏈索輪的螺旋槽裡,另一端拉著右邊在軌道上的托架;皮帶捲在大直徑處時托架走得快,
// 捲到小直徑處時走得慢。主動件是曲柄。
// 推斷:皮帶從鏈索輪的大端開始捲、往小端走;托架被拉向鏈索輪(橫移)。
import { X, TAU, clamp } from "./kit.js";

const AXIS_Y = 0.0;
const FUSEE = { from: -1.6, to: 0.5, big: 0.95, small: 0.35 };
export const TURNS = 1.25;
export const RANGE = [0, TURNS * TAU];
const PITCH = (FUSEE.to - FUSEE.from - 0.2) / TURNS;
const CARRIAGE0 = 6.2; // 托架起始位置

/** 鏈索輪在 x 處的半徑(直線錐) */
export const radiusAt = (x) => FUSEE.big + ((FUSEE.small - FUSEE.big) * (x - FUSEE.from)) / (FUSEE.to - FUSEE.from);

/** 曲柄轉 theta → 皮帶在鏈索輪上的位置與半徑、托架走過的距離(= 捲進的皮帶長) */
export function fusee(theta0) {
  const theta = clamp(theta0, ...RANGE);
  const x = FUSEE.from + 0.1 + (PITCH * theta) / TAU;
  // 捲進的長度 = ∫ r dθ,r 隨 θ 線性變化
  const r0 = radiusAt(FUSEE.from + 0.1);
  const r = radiusAt(x);
  return { theta, x, r, wound: ((r0 + r) / 2) * theta };
}

const spiral = Array.from({ length: Math.round(TURNS * 48) + 1 }, (_, i) => {
  const th = (i / 48) * TAU;
  const x = FUSEE.from + 0.1 + (PITCH * th) / TAU;
  const r = radiusAt(x) + 0.02;
  return [x, r * Math.sin(th), r * Math.cos(th)];
});

export default {
  figure: 358,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 兩條導軌在均力圓錐輪的後面;右邊的軸承座在軸的後面(托架從它前方通過)
        { kind: "box", size: [9.5, 0.12, 0.3], at: [2.6, 1.35, -1.1] },
        { kind: "box", size: [9.5, 0.12, 0.3], at: [2.6, -0.75, -1.1] },
        { kind: "box", size: [0.25, 1.4, 0.4], at: [-2.2, -0.55, 0] },
        { kind: "box", size: [0.25, 0.9, 1.0], at: [0.85, -0.3, -0.6] },
      ],
    },
    {
      id: "fusee",
      kind: "group",
      axis: X,
      center: [0, AXIS_Y, 0],
      spin: FUSEE.big,
      spinOffset: FUSEE.from - 0.05,
      pieces: [
        { kind: "lathe", profile: [[0, FUSEE.from], [FUSEE.big, FUSEE.from], [FUSEE.small, FUSEE.to], [0, FUSEE.to]], mark: true },
        { kind: "tube", points: spiral.map(([x, y, z]) => [y, z, x]), radius: 0.025 },
        { kind: "cylinder", radius: 0.08, length: 3.6, at: [0, 0, -1.0] },
        // 曲柄
        { kind: "box", size: [0.12, 0.7, 0.12], at: [0, -0.35, -2.75] },
        { kind: "cylinder", radius: 0.07, length: 0.45, at: [0, -0.7, -2.95], accent: true },
      ],
    },
    {
      id: "carriage",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.12, 2.3, 0.12], at: [-0.35, 0.3, 0] },
        { kind: "box", size: [0.12, 2.3, 0.12], at: [0.35, 0.3, 0] },
        { kind: "cylinder", radius: 0.32, length: 0.2, at: [0, 1.35, 0] },
        { kind: "cylinder", radius: 0.32, length: 0.2, at: [0, -0.75, 0] },
      ],
    },
    { id: "belt", kind: "rope" },
  ],
  driver: { part: "fusee", type: "rotation", range: RANGE, initial: 0 },
  target: "carriage", // 被拉著橫移的托架
  view: { direction: [0.08, 0.25, 1] },
  pose(theta0) {
    const f = fusee(theta0);
    const cx = CARRIAGE0 - f.wound;
    return {
      parts: { fusee: { angle: f.theta }, carriage: { position: [cx, 0, 0] } },
      // 皮帶:從鏈索輪頂上的捲入點斜拉到托架上的扣點
      paths: { belt: { points: [[f.x, AXIS_Y + f.r, 0], [cx - 0.35, 0.3, 0]], closed: false, phase: f.wound } },
      readouts: [],
    };
  },
};
