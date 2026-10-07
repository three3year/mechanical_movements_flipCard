// 第 300–301 種共用(前視與側視立面圖):同一根軸上並排兩個擒縱輪,兩輪的齒錯開半個齒距;
// 下方水平的擺軸上有一個半圓形的叉瓦(平邊朝上),夾在兩輪之間,兩端伸到兩個輪的齒下面。擺軸來回擺動時,
// 半圓板跟著傾斜:一端翹進一個輪的齒間、擋住那個輪的齒,另一端同時降到另一個輪的齒尖下面、放開它。
// 叉瓦交替地由兩個輪之一的齒作用,擒縱輪每擺一次轉過半個齒。
// 主動件是擺軸(累計擺動);目標件是雙擒縱輪(擒縱讓它一齒一齒地放行)。
//
// 由接觸算(models/escapement.js 的 escapeByContact,兩個輪分開算):在每個輪的平面上,半圓板的截面是一根直條,
// 上緣的高度是「輪的位置 × tan(擺軸的轉角)」;輪受重錘的固定力矩逆時針轉,齒碰上翹起的那一端就停,
// 那一端降到齒尖下面時齒滑過去,輪加速轉到另一個輪的齒碰上另一端為止。
// 推斷:齒數與擺幅(依原圖約十二齒的鉤形齒)、擺軸的高度(在齒尖圓的最低點);擺軸與輪軸的軸承(原圖沒畫)。
import { X, TAU, deg, swing } from "./kit.js";
import { escapeByContact, toothedWheel } from "./escapement.js";
import { shape, circle, arcPoints, rect } from "./shapes.js";

export const N = 12;
export const PITCH = TAU / N;
export const SWING = deg(18);
const C = [0, 1.0];
const R = 1.75;
const ROOT = R - 0.45;
const GAP = 0.45; // 兩輪離中間的距離
const DISC = GAP + 0.08; // 半圓板的半徑
const STAFF_Y = C[1] - R; // 擺軸:在齒尖圓的最低點高度(擺軸在兩輪之間,不碰齒)
const PALLET_X = 0.08; // 半圓板的厚度(沿擺軸)的一半

// 鉤形齒(逆時針轉,前面往前勾);兩輪錯開半個齒距
const WHEEL = toothedWheel({ teeth: N, profile: [[ROOT, 0], [R, 0.62], [R, 0.7], [ROOT, 0.55]] });
const rot = (poly, a) => poly.map(([x, y]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]);
const teeth = [...WHEEL.teeth, ...WHEEL.teeth.map((t) => rot(t, PITCH / 2))];
const layers = teeth.map((_, i) => (i < N ? "front" : "back"));

/** 擺軸累計擺動 v → 擺軸角 */
export const staffAngle = (v) => swing(v, -SWING, SWING);
// 在 z = ±GAP 那個輪的平面上,半圓板的截面(直條;上緣高 z·tanθ)
const section = (z, theta) => rect(2 * PALLET_X, 0.3, 0, STAFF_Y + z * Math.tan(theta) - 0.15);
export const escapement = {
  ...escapeByContact({
    center: C,
    teeth,
    layers,
    dir: 1,
    period: 4 * SWING,
    pitch: PITCH,
    stops: (v) => [
      { poly: section(GAP, staffAngle(v)), layer: "front" },
      { poly: section(-GAP, staffAngle(v)), layer: "back" },
    ],
  }),
  period: 4 * SWING,
};

/** 擺軸累計擺動 v → 擺軸角、擒縱輪轉角(逆時針為正,由接觸算) */
export function twin(v) {
  return { staff: staffAngle(v), wheel: escapement.angle(v) };
}

const wheel = (z, offset) => [
  { kind: "plate", shape: { outline: rot(WHEEL.outline, offset), holes: [circle(ROOT - 0.17).reverse()] }, thickness: 0.1, at: [0, 0, z] },
  ...[0, 1, 2].map((i) => ({ kind: "box", size: [ROOT - 0.17, 0.1, 0.08], at: [((ROOT - 0.17) / 2) * Math.cos((i * TAU) / 3 + 0.4), ((ROOT - 0.17) / 2) * Math.sin((i * TAU) / 3 + 0.4), z], angle: (i * TAU) / 3 + 0.4 })),
];

export function twinWheels(figure, direction) {
  return {
    figure,
    parts: [
      {
        id: "wheels",
        kind: "group",
        center: [...C, 0],
        spin: R,
        pieces: [...wheel(GAP, 0), ...wheel(-GAP, PITCH / 2), { kind: "cylinder", radius: 0.18, length: 2 * GAP + 0.3 }, { kind: "cylinder", radius: 0.08, length: 3.0 }, { kind: "box", size: [0.14, 0.14, 0.14], at: [R - 0.75, 0, GAP + 0.08], accent: true }],
      },
      {
        id: "staff",
        kind: "group",
        axis: X,
        center: [0, STAFF_Y, 0],
        arrow: false,
        pieces: [
          { kind: "cylinder", radius: 0.06, length: 4.0 },
          // 半圓形叉瓦:板面與擺軸垂直、平邊朝上,左右兩端伸到兩個輪的齒下面
          { kind: "plate", shape: shape([...arcPoints(DISC, Math.PI, TAU)]), thickness: 2 * PALLET_X },
        ],
      },
      {
        id: "frame",
        kind: "group",
        pieces: [
          // 擺軸兩端與輪軸兩端的軸承(原圖沒畫)
          ...[-1, 1].map((s) => ({ kind: "cylinder", axis: X, radius: 0.13, inner: 0.06, length: 0.12, at: [s * 2.06, STAFF_Y, 0] })),
          ...[-1, 1].map((s) => ({ kind: "cylinder", radius: 0.15, inner: 0.08, length: 0.12, at: [C[0], C[1], s * 1.56] })),
          ...[-1, 1].map((s) => ({ kind: "box", size: [0.14, C[1] - STAFF_Y + 0.5, 0.12], at: [C[0], (C[1] + STAFF_Y - 0.5) / 2 - 0.15, s * 1.56] })),
          ...[-1, 1].map((s) => ({ kind: "box", size: [0.14, 0.5, 0.14], at: [s * 2.06, STAFF_Y - 0.31, 0] })),
          { kind: "box", size: [4.3, 0.12, 3.3], at: [0, STAFF_Y - 0.62, 0] },
        ],
      },
    ],
    // 動力重演:只推擺軸;雙擒縱輪受固定的力矩(重錘)逆時針轉,由半圓叉瓦的兩端輪流擋住、放行
    replay: {
      to: 8 * SWING,
      free: { wheels: { pivot: [...C, 0], spring: 1, gravity: false } },
      ignore: [["wheels", "frame"]], // 輪軸插在軸承裡(孔沒畫出來)
      expect: [
        { at: 2 * SWING, part: "wheels", label: "擺軸擺過一次,輪轉過半個齒", quote: "擒縱叉瓦交替地由兩個擒縱輪之一的齒作用" },
        { at: 4 * SWING, part: "wheels", label: "擺軸一個來回,輪轉過一個齒" },
        { part: "wheels", label: "擺軸兩個來回,輪轉過兩個齒" },
      ],
    },
    driver: { part: "staff", type: "rotation", cycle: [-SWING, SWING] },
    target: "wheels", // 雙擒縱輪:擒縱讓它一齒一齒地放行
    view: { direction },
    pose(v) {
      const t = twin(v);
      return { parts: { staff: { angle: t.staff }, wheels: { angle: t.wheel } }, readouts: [] };
    },
  };
}
