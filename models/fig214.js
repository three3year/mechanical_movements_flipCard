// 第 214 種(條目 214–215 的第一張圖):擋止裝置的另一個變形,運作可與第 212 種比較。兩個齒數不同的齒輪互相咬合,
// 面上各固定一支指片;因為齒數不同,兩支指片每轉一圈相對錯開一點,轉了若干圈後兩支指片在咬合處相碰,輪就被擋住。
// 主動件是左輪。
// 推斷:左輪 12 齒、右輪 11 齒;指片的長度與方向照原圖;可轉的範圍是從原圖位置往兩邊轉到指片相碰為止。
import { TAU, Z, polar } from "./kit.js";
import { pedestal } from "./supports.js";
import { meshAngle } from "./gears.js";
import { shape, arcPoints } from "./shapes.js";

const C = 2.05;
const PITCH = (TAU * C) / 23;
const LEFT = { center: [-1.0, 0, 0], axis: Z, teeth: 12, radius: (12 * PITCH) / TAU };
const RIGHT = { center: [-1.0 + C, 0, 0], axis: Z, teeth: 11, radius: (11 * PITCH) / TAU };
const FINGER = { left: { length: 1.25, angle: 1.36 }, right: { length: 1.15, angle: 0.63 } };
const WIDTH = 0.22;

/** 左輪轉 theta:右輪的轉角 */
export const rightAngle = (theta) => meshAngle(LEFT, RIGHT, theta);
const R0 = rightAngle(0);

/** 兩支指片的中心線(世界座標) */
export function fingers(theta) {
  const seg = (g, f, turn) => {
    const tip = polar(f.length, f.angle + turn);
    return [g.center, [g.center[0] + tip[0], g.center[1] + tip[1], 0]];
  };
  return { left: seg(LEFT, FINGER.left, theta), right: seg(RIGHT, FINGER.right, rightAngle(theta) - R0) };
}

// 兩線段的最近距離
function segDist([a, b], [c, d]) {
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const near = (p, [s, e]) => {
    const v = [e[0] - s[0], e[1] - s[1]];
    const t = clamp(((p[0] - s[0]) * v[0] + (p[1] - s[1]) * v[1]) / (v[0] * v[0] + v[1] * v[1]));
    return Math.hypot(p[0] - s[0] - v[0] * t, p[1] - s[1] - v[1] * t);
  };
  return Math.min(near(a, [c, d]), near(b, [c, d]), near(c, [a, b]), near(d, [a, b]));
}
export const touching = (theta) => segDist(fingers(theta).left, fingers(theta).right) < WIDTH;

// 從原圖位置往兩邊找到指片相碰的轉角
const limit = (dir) => {
  let t = 0;
  while (!touching(t) && Math.abs(t) < 40 * TAU) t += dir * 0.01;
  return t - dir * 0.01;
};
export const range = [limit(-1), limit(1)];

// 指片:圓頭在軸心、尖端朝外的水滴形
const drop = (length) => shape([...arcPoints(0.17, Math.PI / 2, (3 * Math.PI) / 2), [length, 0]]);
const gearPart = (id, g, f, offset) => ({
  id,
  kind: "gear",
  center: g.center,
  teeth: g.teeth,
  radius: g.radius,
  width: 0.24,
  pieces: [
    { kind: "plate", shape: drop(f.length), thickness: 0.08, at: [0, 0, 0.18], angle: f.angle - offset, accent: true },
    { kind: "box", size: [0.2, 0.2, 0.3], at: [0, 0, 0.1] },
  ],
});

export default {
  figure: 214,
  parts: [
    gearPart("left", LEFT, FINGER.left, 0),
    gearPart("right", RIGHT, FINGER.right, R0),
    {
      id: "bearings",
      kind: "group",
      // 推斷(原圖只畫出輪轂):每個輪的固定軸往後伸進軸承座,軸承座立在同一塊底板上
      pieces: [[-1, 0], [1.05, 0]].flatMap(([x, y]) => [
        { kind: "cylinder", radius: 0.1, length: 0.63, at: [x, y, -0.215] },
        ...pedestal({ at: [x, y], z: -0.53, bore: 0.1, floor: -2.01, depth: 0.2 }),
      ]),
    },
  ],
  driver: { part: "left", type: "rotation", range },
  target: "right",
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    return { parts: { left: { angle: theta }, right: { angle: rightAngle(theta) } }, readouts: [] };
  },
};
