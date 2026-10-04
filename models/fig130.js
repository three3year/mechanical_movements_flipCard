// 第 130 種:裁切鐵板等用的剪具。上夾爪連著一支長臂,繞中間的樞軸轉;長臂的重量使夾爪張開,
// 長臂左端靠在偏心的凸輪上——凸輪轉到高處把長臂頂起,右邊的上夾爪就往下閉合。主動件是凸輪(偏心輪)。
// 長臂的轉角由「長臂下緣靠在凸輪上」的條件以二分法求出。
// 結構推斷:原圖的下夾爪是從帶斜線的底座上長出來的支座,樞軸銷穿過支座與長臂;凸輪的圓心畫在底座上方、
// 與底座重疊,表示凸輪的軸是架在底座(機架)上的。這裡把下夾爪的腳伸進底座、樞軸銷穿過兩件,
// 下夾爪與長臂像剪刀一樣前後錯一層(下夾爪在後、長臂在前);底座往左延伸到凸輪下方,
// 在凸輪後方立一個軸承座、凸輪的軸加長穿進去,讓讀者看出凸輪是裝在機架上頂著長臂的。不改凸輪與長臂的幾何。
import { deg, polar } from "./kit.js";
import { solve } from "./linkage.js";
import { shape, circle, arcPoints } from "./shapes.js";

const PIVOT = [1.15, 0.85, 0.2];
const CAM = { pin: [-2.15, -0.38, 0], radius: 0.62, offset: 0.4 };
const UNDER = 0.185; // 長臂下緣在樞軸下方的距離(長臂水平時)

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
  [0.4, -1.4], // 腳伸進底座
  [-0.15, -1.4],
  [-0.4, -0.65],
]);

// 機架:底座(右段高、左段低,墊在凸輪下方)與凸輪後方的軸承座
const BASE_TOP = -0.425; // 右段頂面(下夾爪的腳插在這裡)
const SLAB_TOP = -1.475; // 左段頂面:比凸輪最低點(-1.40)低一點
const BOTTOM = -1.725;
const CAM_SEAT = shape(
  [[-0.35, SLAB_TOP - CAM.pin[1]], [0.35, SLAB_TOP - CAM.pin[1]], ...arcPoints(0.3, -0.3, Math.PI + 0.3)],
  [circle(0.17).reverse()],
);

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
        { kind: "cylinder", radius: 0.16, length: 1.0, at: [0, 0, -0.25] }, // 軸:往後穿進機架的軸承座
      ],
    },
    {
      id: "arm",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [{ kind: "plate", shape: shape(upper.outline, [circle(0.11).reverse()]), thickness: 0.2 }], // z 0.1–0.3:在下夾爪前面
    },
    {
      id: "base",
      kind: "group",
      pieces: [
        { kind: "plate", shape: lower, thickness: 0.2, at: [PIVOT[0], PIVOT[1], 0] }, // 下夾爪(z −0.1–0.1),腳插在底座裡
        { kind: "cylinder", radius: 0.09, length: 0.6, at: [PIVOT[0], PIVOT[1], 0.15] }, // 樞軸銷:穿過下夾爪與長臂
        { kind: "box", size: [3.9, BASE_TOP - BOTTOM, 0.9], at: [1.95, (BASE_TOP + BOTTOM) / 2, 0] }, // 底座右段
        { kind: "box", size: [6.6, SLAB_TOP - BOTTOM, 0.9], at: [0.65, (SLAB_TOP + BOTTOM) / 2, 0] }, // 底座左段:延伸到凸輪下方
        { kind: "plate", shape: CAM_SEAT, thickness: 0.3, at: [CAM.pin[0], CAM.pin[1], -0.45] }, // 凸輪的軸承座(在凸輪後方)
      ],
    },
  ],
  driver: { part: "cam", type: "rotation" },
  target: "arm", // 帶著上夾爪閉合的長臂
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    return { parts: { cam: { angle: theta }, arm: { angle: shears(theta) } }, readouts: [] };
  },
};
