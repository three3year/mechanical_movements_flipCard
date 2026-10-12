// 第 300–301 種共用(前視與側視立面圖):同一根軸上並排兩個擒縱輪,兩輪的齒錯開半個齒距;
// 下方水平的擺軸上有一個半圓形的叉瓦(平邊朝上),夾在兩輪之間,兩端伸到兩個輪的齒下面。擺軸來回擺動時,
// 半圓板跟著傾斜:一端翹進一個輪的齒間、擋住那個輪的齒,另一端同時降到另一個輪的齒尖下面、放開它。
// 叉瓦交替地由兩個輪之一的齒作用,擒縱輪每擺一次轉過半個齒。
// 主動件是擺軸(累計擺動);目標件是雙擒縱輪(擒縱讓它一齒一齒地放行)。
//
// 由接觸算(models/escapement.js 的 escapeByContact,兩個輪分開算):在每個輪的平面上,半圓板的截面是一根直條,
// 上緣的高度是「輪的位置 × tan(擺軸的轉角)」;輪受重錘的固定力矩逆時針轉,齒碰上翹起的那一端就停,
// 那一端降到齒尖下面時齒滑過去,輪加速轉到另一個輪的齒碰上另一端為止。
// 推斷:齒數與擺幅(525 px 原圖數得約 18–20 個鉤形齒,取 20;每擺一次放走半個齒距 9°)、擺軸的高度(在齒尖圓的最低點);
// 擺軸與輪軸的軸承(原圖沒畫):輪軸兩端的軸承各由一支 L 形托架往左接到立柱,立柱站在底座上——
// 不從輪心往下立,前視圖(第 300 種)裡半圓叉瓦前面才沒有東西擋著。
// 推斷的驅動(原文只說叉瓦交替地由兩個輪的齒作用,沒說輪為什麼往前轉;共用 weight-drive.js):輪軸上、後輪與後軸承之間
// 有一個鼓,繩從鼓頂往左拉到左後托架上的滑輪,再垂下吊著重錘;重錘的重量就是讓輪逆時針轉的固定力矩,輪轉多少重錘降多少,
// 被叉瓦擋住時重錘也停。輪每轉一圈(擺軸擺二十個來回)重錘捲回最高處一次(上鍊,畫面上一下子回到上面)。
// 實物也可能用發條;重錘只是示意「輪受固定的力矩」。
import { X, Y, Z, TAU, deg, swing } from "./kit.js";
import { weightDrive, rewound } from "./weight-drive.js";
import { escapeByContact, toothedWheel } from "./escapement.js";
import { shape, circle, arcPoints, rect } from "./shapes.js";

export const N = 20;
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

// 推斷的重錘驅動:鼓在輪軸上(後輪與後軸承之間),繩從鼓頂往左拉到左後托架上的滑輪頂上,再垂下吊重錘
const AXLE_Z = 1.56; // 輪軸兩端的軸承
const BRACKET_X = -2.35; // 托架的立柱
const ROPE_R = 0.045; // 繩的半徑(畫面上的繩粗)
const DRUM_R = 0.2;
const DRUM = { center: [...C, -1.0], axis: Z, radius: DRUM_R + ROPE_R, sense: 1 }; // 輪往前(逆時針)轉時繩從鼓上放出
const PULLEY_R = 0.15;
const PULLEY = { center: [BRACKET_X, C[1] + DRUM.radius - PULLEY_R - ROPE_R, DRUM.center[2]], axis: Z, radius: PULLEY_R + ROPE_R, sense: -1 };
const REWIND = N * 4 * SWING; // 輪轉一圈上鍊一次
const WEIGHT = { radius: 0.17, height: 0.4 };
const FLOOR = STAFF_Y - 0.56; // 底座頂面
const hang = weightDrive({
  drum: DRUM,
  pulleys: [PULLEY],
  eye: [PULLEY.center[0] - PULLEY.radius, C[1] - 0.2, PULLEY.center[2]],
  reserve: DRUM.radius * TAU,
  spare: 0.8 * TAU * DRUM.radius,
  pitch: 2 * ROPE_R,
});
const weightAt = rewound(hang, escapement.angle, REWIND);
export const geometry = { STAFF_Y, DISC, PALLET_X, DRUM, REWIND };

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
        pieces: [...wheel(GAP, 0), ...wheel(-GAP, PITCH / 2), { kind: "cylinder", radius: 0.18, length: 2 * GAP + 0.3 }, { kind: "cylinder", radius: 0.08, length: 3.0 }, { kind: "cylinder", radius: DRUM_R, length: 0.3, at: [0, 0, DRUM.center[2]] }, // 繞繩的鼓(推斷)
          // 抓取用的方塊:貼在前輪的一根輪輻上
          { kind: "box", size: [0.14, 0.14, 0.14], at: [0.75 * Math.cos(0.4), 0.75 * Math.sin(0.4), GAP + 0.11], angle: 0.4, accent: true },
        ],
      },
      { id: "pulley", kind: "pulley", style: "disc", center: PULLEY.center, axis: Z, radius: PULLEY_R, width: 0.1, arrow: false },
      { id: "rope", kind: "rope", radius: ROPE_R },
      { id: "weight", kind: "weight", axis: Y, radius: WEIGHT.radius, height: WEIGHT.height },
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
          // 擺軸兩端的軸承立在底座上;輪軸兩端的軸承各由一支 L 形托架(往左的橫臂 + 立柱)接到底座(原圖沒畫)
          ...[-1, 1].map((s) => ({ kind: "cylinder", axis: X, radius: 0.13, inner: 0.06, length: 0.12, at: [s * 2.06, STAFF_Y, 0] })),
          ...[-1, 1].map((s) => ({ kind: "box", size: [0.14, 0.5, 0.14], at: [s * 2.06, STAFF_Y - 0.31, 0] })),
          ...[-1, 1].flatMap((s) => [
            { kind: "cylinder", radius: 0.15, inner: 0.08, length: 0.12, at: [C[0], C[1], s * AXLE_Z] },
            { kind: "box", size: [C[0] - BRACKET_X + 0.07, 0.14, 0.12], at: [(C[0] + BRACKET_X - 0.07) / 2, C[1], s * AXLE_Z] },
            { kind: "box", size: [0.14, C[1] - FLOOR + 0.07, 0.12], at: [BRACKET_X, (C[1] + FLOOR + 0.07) / 2, s * AXLE_Z] },
          ]),
          { kind: "box", size: [4.8, 0.12, 3.5], at: [-0.25, FLOOR - 0.06, 0] },
          // 托架伸出的滑輪軸(推斷)
          { kind: "cylinder", radius: 0.04, length: PULLEY.center[2] + AXLE_Z, at: [PULLEY.center[0], PULLEY.center[1], (PULLEY.center[2] - AXLE_Z) / 2] },
        ],
      },
    ],
    // 動力重演:只推擺軸;雙擒縱輪受重錘的固定力矩逆時針轉(以彈簧代替;重錘、滑輪照模型的姿勢走),由半圓叉瓦的兩端輪流擋住、放行
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
      const w = weightAt(v);
      const eye = w.eye;
      return {
        parts: {
          staff: { angle: t.staff },
          wheels: { angle: t.wheel },
          pulley: { angle: w.pulleys[0] },
          weight: { position: [eye[0], eye[1] - WEIGHT.height / 2 - WEIGHT.radius * 0.38, eye[2]] },
        },
        paths: { rope: { points: w.rope, closed: false, phase: 0 } },
        readouts: [],
      };
    },
  };
}
