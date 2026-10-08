// 第 130 種:裁切鐵板等用的剪具。上夾爪連著一支長臂,繞中間的樞軸轉;長臂的重量使夾爪張開,
// 長臂左端靠在偏心的凸輪上——凸輪轉到高處把長臂頂起,右邊的上夾爪就往下閉合。主動件是凸輪(偏心輪)。
// 長臂的轉角由接觸算:長臂的外形繞樞軸靠自重往下擺,停在第一次碰到凸輪的地方。
// 起始姿勢照原圖:凸輪的軸在圓的正上方(凸輪轉到最低),長臂水平擱在凸輪頂上、夾爪張開;
// 凸輪轉半圈升到最高,長臂左端被頂起 2 × 偏心量,上夾爪的刃口剛好壓到下夾爪的刃口(閉合,兩片刃像剪刀一樣前後錯層)。
// 上夾爪的刃口就是「下夾爪的刃口繞樞軸轉開 CLOSE」,偏心量則反過來由「頂到最高時長臂正好轉 CLOSE」算出,
// 所以閉合時兩條刃口重合(2026-10-08 複查:原本上夾爪的刃口斜度與凸輪的升程沒有對上,閉到底右端還張著)。
// 結構推斷:原圖的下夾爪是從帶斜線的底座上長出來的支座,樞軸銷穿過支座與長臂;凸輪的圓心畫在底座上方、
// 與底座重疊,表示凸輪的軸是架在底座(機架)上的。這裡把下夾爪的腳伸進底座、樞軸銷穿過兩件,
// 下夾爪與長臂像剪刀一樣前後錯一層(下夾爪在後、長臂在前);底座往左延伸到凸輪下方,
// 在凸輪後方立一個軸承座、凸輪的軸加長穿進去,讓讀者看出凸輪是裝在機架上頂著長臂的。
import { deg, polar, rot2 } from "./kit.js";
import { swingUntilContact, circlePolygon } from "./contact.js";
import { shape, circle, arcPoints } from "./shapes.js";

const PIVOT = [1.15, 0.85, 0.2];
const CLOSE = 0.2; // 閉合時長臂轉過的角度(順時針)
const ARM_BOTTOM = -0.44; // 長臂下緣(局部座標,原點在樞軸);水平時擱在最低的凸輪頂上
const CAM_X = -3.3; // 凸輪軸離樞軸的水平距離(局部座標)
const RADIUS = 0.62;
// 偏心量:凸輪升到最高(圓心在軸正上方)時,轉了 CLOSE 的長臂下緣正好與凸輪相切。
// 下緣這條線(y = ARM_BOTTOM)順時針轉 CLOSE 後是 x·sin(CLOSE) + y·cos(CLOSE) = ARM_BOTTOM,
// 圓心 (CAM_X, cy) 在線的下方、距離 RADIUS:CAM_X·sin(CLOSE) + cy·cos(CLOSE) − ARM_BOTTOM = −RADIUS;
// 最低時凸輪頂 = ARM_BOTTOM:軸高 = ARM_BOTTOM − RADIUS + 偏心量,最高時圓心 = 軸高 + 偏心量
const HIGH_CY = (-RADIUS + ARM_BOTTOM - CAM_X * Math.sin(CLOSE)) / Math.cos(CLOSE);
const OFFSET = (HIGH_CY - (ARM_BOTTOM - RADIUS)) / 2;
const CAM = { pin: [PIVOT[0] + CAM_X, PIVOT[1] + ARM_BOTTOM - RADIUS + OFFSET, 0], radius: RADIUS, offset: OFFSET };

// 凸輪中心:起始時在軸的正下方(原圖),轉半圈升到正上方
export const camRadius = CAM.radius;
export const camCenter = (theta) => {
  const p = polar(CAM.offset, theta - deg(90));
  return [CAM.pin[0] + p[0], CAM.pin[1] + p[1]];
};

// 下夾爪的刃口(局部座標,原點在樞軸);上夾爪的刃口是它繞樞軸轉開 CLOSE
const EDGE = [[0.7, 0.0], [2.35, 0.08]];
const UPPER_EDGE = EDGE.map((p) => rot2(p, CLOSE));

// 長臂左段做得厚一點:整件的重心要在樞軸左邊,長臂才會靠自重落回凸輪上(動力重演檢查這一點)
const upper = shape([
  [-4.0, -0.2],
  [-3.0, -0.1],
  [-1.5, 0.1],
  [-0.6, 0.3],
  [-0.2, 0.5],
  [0.2, 0.7],
  [1.2, 0.82],
  [2.0, 0.86],
  [2.3, 0.7],
  UPPER_EDGE[1], // 上夾爪的尖端
  UPPER_EDGE[0], // 刃口根部
  [0.62, -0.1],
  [0.45, ARM_BOTTOM],
  [-4.0, ARM_BOTTOM],
]);
const lower = shape([
  [-0.05, 0.0],
  ...EDGE,
  [2.3, -0.25],
  [0.75, -0.35],
  [0.25, -0.65],
  [0.4, -1.4], // 腳伸進底座
  [-0.15, -1.4],
  [-0.4, -0.65],
]);

/** 凸輪轉 theta:長臂(上夾爪)的轉角;左端被頂起時轉角為負(順時針),夾爪閉合 */
export function shears(theta) {
  // 長臂靠自重逆時針擺(左端往下),停在外形第一次碰到凸輪的轉角
  return swingUntilContact({ pivot: PIVOT, outline: upper.outline, from: deg(-30), into: 1, sweep: deg(50), steps: 50 }, [circlePolygon(camCenter(theta), CAM.radius, 48)]);
}

/** 凸輪轉 theta:上夾爪尖端的刃口離下夾爪刃口的高度(0 是閉合) */
export function jawGap(theta) {
  const tip = rot2(UPPER_EDGE[1], shears(theta));
  const [[x0, y0], [x1, y1]] = EDGE;
  return tip[1] - (y0 + ((y1 - y0) * (tip[0] - x0)) / (x1 - x0));
}

// 機架:底座(右段高、左段低,墊在凸輪下方)與凸輪後方的軸承座
const BASE_TOP = -0.425; // 右段頂面(下夾爪的腳插在這裡)
const SLAB_TOP = CAM.pin[1] - CAM.offset - CAM.radius - 0.08; // 左段頂面:比凸輪最低點低一點
const BOTTOM = SLAB_TOP - 0.25;
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
        { kind: "plate", shape: shape(circle(CAM.radius, ...polar(CAM.offset, -deg(90)).slice(0, 2)), [circle(0.1).reverse()]), thickness: 0.3, mark: [0, -0.35], markSize: 0.07 },
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
        { kind: "box", size: [7.4, SLAB_TOP - BOTTOM, 0.9], at: [0.25, (SLAB_TOP + BOTTOM) / 2, 0] }, // 底座左段:延伸到凸輪下方
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
      { at: Math.PI, part: "arm", label: "凸輪轉到最高,把長臂頂起、夾爪閉合", quote: "並藉由凸輪的旋轉而閉合" },
      { at: (3 * Math.PI) / 2, part: "arm", label: "凸輪轉離,長臂靠自重落下、夾爪張開", quote: "夾爪透過上方夾爪長臂的重量而張開" },
      { part: "arm", label: "轉完一圈,長臂回到起點(水平擱在最低的凸輪上)" },
    ],
  },
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    return { parts: { cam: { angle: theta }, arm: { angle: shears(theta) } }, readouts: [] };
  },
};
