// 第 130 種:裁切鐵板等用的剪具。上夾爪連著一支長臂,繞中間的樞軸轉;長臂的重量使夾爪張開,
// 長臂左端靠在偏心的凸輪上——凸輪轉到高處把長臂頂起,右邊的上夾爪就往下閉合。主動件是凸輪(偏心輪)。
// 長臂的轉角由接觸算:長臂的外形繞樞軸靠自重往下擺,停在第一次碰到凸輪的地方(2026-10-07 複查:原本把長臂下緣
// 當成無限長的直線,凸輪頂點跑到長臂尖端外時長臂其實懸空,是演出的接觸;長臂左端也照原圖加長到蓋住凸輪)。
// 結構推斷:原圖的下夾爪是從帶斜線的底座上長出來的支座,樞軸銷穿過支座與長臂;凸輪的圓心畫在底座上方、
// 與底座重疊,表示凸輪的軸是架在底座(機架)上的。這裡把下夾爪的腳伸進底座、樞軸銷穿過兩件,
// 下夾爪與長臂像剪刀一樣前後錯一層(下夾爪在後、長臂在前);底座往左延伸到凸輪下方,
// 在凸輪後方立一個軸承座、凸輪的軸加長穿進去,讓讀者看出凸輪是裝在機架上頂著長臂的。不改凸輪與長臂的幾何。
import { deg, polar } from "./kit.js";
import { swingUntilContact, circlePolygon } from "./contact.js";
import { shape, circle, arcPoints } from "./shapes.js";

const PIVOT = [1.15, 0.85, 0.2];
const CAM = { pin: [-2.15, -0.38, 0], radius: 0.62, offset: 0.4 };

// 凸輪中心
const camCenter = (theta) => {
  const p = polar(CAM.offset, theta + deg(110));
  return [CAM.pin[0] + p[0], CAM.pin[1] + p[1]];
};

/** 凸輪轉 theta:長臂(上夾爪)的轉角;左端被頂起時轉角為負(順時針),夾爪閉合 */
export function shears(theta) {
  // 長臂靠自重逆時針擺(左端往下),停在外形第一次碰到凸輪的轉角
  return swingUntilContact({ pivot: PIVOT, outline: upper.outline, from: deg(-30), into: 1, sweep: deg(50), steps: 50 }, [circlePolygon(camCenter(theta), CAM.radius, 48)]);
}

const upper = shape([
  [-3.75, 0.04],
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
  [-3.7, -0.17],
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
  // 動力重演:只轉凸輪;長臂繞樞軸銷自由擺,靠自重壓在凸輪上(原文:夾爪透過長臂的重量張開)
  replay: {
    free: { arm: { pivot: PIVOT } },
    expect: [
      { at: Math.PI / 2, part: "arm", label: "凸輪轉到高處,把長臂頂起、夾爪閉合", quote: "並藉由凸輪的旋轉而閉合" },
      { at: Math.PI, part: "arm", label: "凸輪轉離,長臂靠自重落下、夾爪張開", quote: "夾爪透過上方夾爪長臂的重量而張開" },
      { part: "arm", label: "轉完一圈,長臂回到起點" },
    ],
  },
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    return { parts: { cam: { angle: theta }, arm: { angle: shears(theta) } }, readouts: [] };
  },
};
