// 第 130 種:裁切鐵板等用的剪具。上夾爪連著一支長臂,繞中間的樞軸轉;長臂的重量使夾爪張開,
// 長臂左端靠在偏心的凸輪上——凸輪轉到高處把長臂頂起,右邊的上夾爪就往下閉合。主動件是凸輪(偏心輪)。
// 長臂的轉角由「長臂下緣靠在凸輪上」的條件以二分法求出。
import { deg, polar } from "./kit.js";
import { solve } from "./linkage.js";
import { shape, circle } from "./shapes.js";

const PIVOT = [1.15, 0.85, 0.2];
const CAM = { pin: [-2.15, -0.38, 0], radius: 0.62, offset: 0.4 };
const UNDER = 0.22; // 長臂下緣在樞軸下方的距離(長臂水平時)

// 凸輪中心
const camCenter = (theta) => {
  const p = polar(CAM.offset, theta + deg(110));
  return [CAM.pin[0] + p[0], CAM.pin[1] + p[1]];
};

// 長臂轉 psi 時,凸輪中心到長臂下緣直線的帶符號距離(凸輪在下方為負)
function gap(psi, c) {
  const n = [-Math.sin(psi), Math.cos(psi)]; // 下緣直線的上法線
  const p = [PIVOT[0] + UNDER * Math.sin(psi), PIVOT[1] - UNDER * Math.cos(psi)];
  return (c[0] - p[0]) * n[0] + (c[1] - p[1]) * n[1];
}

/** 凸輪轉 theta:長臂(上夾爪)的轉角;左端被頂起時轉角為負(順時針),夾爪閉合 */
export function shears(theta) {
  const c = camCenter(theta);
  // 長臂靠在凸輪上:凸輪中心在下緣直線下方恰好一個半徑
  return solve((psi) => gap(psi, c), -CAM.radius, deg(-25), deg(15));
}

const upper = shape([
  [-3.3, 0.05],
  [-1.0, 0.25],
  [-0.15, 0.32],
  [0.15, 0.75],
  [0.75, 0.95],
  [2.15, 0.85],
  [2.2, 0.75],
  [0.95, 0.42],
  [0.55, 0.12],
  [-0.15, -0.22],
  [-1.0, -0.2],
  [-3.25, -0.18],
]);
const lower = shape([
  [-0.05, -0.05],
  [0.75, -0.05],
  [2.2, 0.05],
  [2.15, -0.28],
  [0.7, -0.38],
  [0.25, -0.65],
  [0.4, -1.15],
  [-0.15, -1.15],
  [-0.4, -0.65],
]);

export default {
  figure: 130,
  parts: [
    {
      id: "cam",
      kind: "group",
      center: CAM.pin,
      spin: CAM.radius + CAM.offset,
      pieces: [
        { kind: "plate", shape: shape(circle(CAM.radius, ...polar(CAM.offset, deg(110)).slice(0, 2)), [circle(0.1).reverse()]), thickness: 0.3, mark: [0, -0.35], markSize: 0.07 },
        { kind: "cylinder", radius: 0.16, length: 0.5 },
      ],
    },
    {
      id: "arm",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [{ kind: "plate", shape: shape(upper.outline, [circle(0.11).reverse()]), thickness: 0.2 }],
    },
    {
      id: "base",
      kind: "group",
      pieces: [
        { kind: "plate", shape: lower, thickness: 0.2, at: [PIVOT[0], PIVOT[1], 0.2] },
        { kind: "cylinder", radius: 0.09, length: 0.5, at: [PIVOT[0], PIVOT[1], 0.25] },
        { kind: "box", size: [3.9, 0.95, 0.9], at: [1.95, -0.9, 0] },
      ],
    },
  ],
  driver: { part: "cam", type: "rotation" },
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    return { parts: { cam: { angle: theta }, arm: { angle: shears(theta) } }, readouts: [] };
  },
};
