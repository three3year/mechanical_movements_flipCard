// 第 298 種:老式的錶用擒縱。照 525 px 原圖讀成惠更斯 1675 年的「pirouette」(2026-10-12 決定,推翻舊的讀法):
// 上方水平的擺輪 C 裝在直立的軸上,軸的上端(緊接在擺輪下方)是一個小齒輪;水平的立軸(verge)右端裝著冠狀齒輪,
// 輪面上朝右的齒咬著這個小齒輪,所以擺輪擺的角度是立軸的 冠狀齒輪齒數 / 小齒輪齒數 倍——pirouette 用這組齒輪讓擺輪擺得比立軸大。
// 立軸往左伸,左段的兩個叉瓦擋左下的擒縱輪(目標件,照原圖箭頭逆時針轉):輪的齒推開一個叉瓦、從它的尖端滑過,
// 立軸(與擺輪)跟著轉,另一個叉瓦落進對邊的齒間擋住齒;擺輪擺回來時再換過來。擺輪每擺一次,擒縱輪轉過半個齒。
// 主動件是擺輪(累計擺動)。
//
// 偏離插圖(實物可行 > 插圖外形):原圖的擒縱輪是正對讀者的鋸齒輪,水平立軸從它的頂上掠過——那裡的齒沿立軸的方向走,
// 叉瓦繞立軸轉推不動它,也擋不住它。這裡把擒縱輪做成齒朝上的冠狀輪(輪軸直立)、立軸跨過它的齒尖(同第 234、299 種),
// 兩個叉瓦在輪的左、右兩端擋齒,所以兩個叉瓦相隔一個輪徑(原圖的兩個鉤形片靠在一起、都在輪頂)。
//
// 由接觸算(models/escapement.js 的 crownByContact):擒縱輪受重錘的固定力矩轉動,叉瓦只在輪的左、右兩端碰到齒,
// 在那兩個切面上算齒與叉瓦的接觸——齒被擋住就停、被叉瓦推就退,放開後加速轉到另一個叉瓦上。
// 推斷:擒縱輪的齒數(奇數,左右兩端的齒才錯開半個齒距)、立軸的擺幅、叉瓦的長短與夾角;兩個齒輪的齒數(原圖約 8 與 24);
// 擒縱輪的輪輻開成四個透孔(照原圖);機架:底板、立軸兩處的軸承架、擺輪軸下端的軸承與上端的軸承橋、擒縱輪軸的軸承(原圖都沒畫)。
// 推斷的驅動(原文只有一句,沒說輪為什麼往前轉;共用 weight-drive.js,同第 234、238 種):擒縱輪軸下段的鼓繞著繩,
// 繩往左經滑輪垂下吊著重錘,重錘的重量就是讓輪往前轉的固定力矩;輪轉多少,重錘降多少,被叉瓦擋住時重錘也停。
// 錶實際是用發條,這裡用重錘只是示意「輪受固定的力矩」。重錘每降一段(擺輪擺八個來回)捲回最高處一次(上鍊)。
import { X, Y, Z, TAU, swing } from "./kit.js";
import { crownByContact, placePoly, sawCrown } from "./escapement.js";
import { meshAngle } from "./gears.js";
import { weightDrive, rewound } from "./weight-drive.js";
import { shape, circle, thickLine } from "./shapes.js";

// ── 擒縱輪(冠狀輪,齒朝上)與叉瓦 ─────────────────────────
export const N = 15;
export const PITCH = TAU / N;
const TEETH_R = 1.0; // 齒所在的半徑
const WHEEL_R = TEETH_R + 0.04; // 輪緣外半徑
const TOOTH = 0.3; // 齒高
const RIM = 0.2; // 輪緣高
const GAP = 0.17; // 立軸在齒尖上方
const BASE = -(TOOTH + GAP); // 齒根的高度(世界 y;立軸在 y = 0)
const WHEEL = [-1.75, BASE - RIM / 2, 0]; // 擒縱輪中心:在立軸左段的下方
const FLAG = { length: 0.3, width: 0.06, spread: (48 * Math.PI) / 180 }; // 叉瓦:離軸的長度、厚度、偏離正下方的角度(兩個相隔 96°)
export const VERGE_SWING = 0.6; // 立軸的擺幅(±)

// ── pirouette 的一對齒輪:擺輪軸上的小齒輪、立軸右端的冠狀齒輪 ─────────────────────────
export const CONTRATE = { teeth: 24, radius: 0.7, width: 0.08, depth: 0.14, face: 0.18 };
export const PINION = { teeth: 8, radius: (0.7 * 8) / 24 }; // 和冠狀齒輪同一個齒距
/** 擺輪的擺幅(±):立軸擺幅 × 冠狀齒輪齒數 / 小齒輪齒數 */
export const SWING = (VERGE_SWING * CONTRATE.teeth) / PINION.teeth;
const STAFF_X = CONTRATE.width / 2 + CONTRATE.depth / 2 + PINION.radius; // 擺輪軸:小齒輪的節圓伸到冠狀齒輪齒深的一半
const PINION_Y = CONTRATE.radius - CONTRATE.face / 2; // 小齒輪在冠狀齒輪齒面寬的中央
const BALANCE = { y: 1.45, radius: 2.2 };
const STAFF = { bottom: -1.2, top: 2.0 };
const PINION_GEAR = { center: [STAFF_X, PINION_Y, 0], axis: Y, teeth: PINION.teeth, radius: PINION.radius };
const CONTRATE_GEAR = { center: [0, 0, 0], axis: X, teeth: CONTRATE.teeth, radius: CONTRATE.radius };
const MESH = [STAFF_X - PINION.radius, PINION_Y, 0]; // 接觸點:小齒輪的左緣,在冠狀齒輪的頂上
const PHASE = meshAngle(PINION_GEAR, CONTRATE_GEAR, 0, MESH); // 擺輪在 0 時立軸的轉角(齒的相位)

/** 擺輪累計擺動 v → 擺輪角 */
export const balanceAngle = (v) => swing(v, -SWING, SWING);
/** 擺輪角 → 立軸轉角(繞 +x;經小齒輪與冠狀齒輪) */
const vergeTurn = (b) => meshAngle(PINION_GEAR, CONTRATE_GEAR, b, MESH);
/** 叉瓦的擺角:立軸自居中位置轉過的角度 */
const palletAngle = (v) => vergeTurn(balanceAngle(v)) - PHASE;

// 叉瓦在切面上的外形:切面的座標 x = 世界 −z(右端的齒在那裡走的方向)、y = 世界 y;立軸繞 +x 轉 = 切面上逆時針
const flag = (a) => thickLine([[0, 0], [FLAG.length * Math.cos(a), FLAG.length * Math.sin(a)]], FLAG.width);
const RIGHT = flag(-Math.PI / 2 + FLAG.spread); // 右叉瓦(輪的右端)
const LEFT = flag(-Math.PI / 2 - FLAG.spread); // 左叉瓦(輪的左端)

export const escapement = {
  ...crownByContact({
    radius: TEETH_R,
    teeth: N,
    height: TOOTH,
    base: BASE,
    front0: 0, // 輪的局部角 0 對著右端(世界 +x)
    front: (v) => [placePoly(RIGHT, [0, 0], palletAngle(v))],
    back: (v) => [placePoly(LEFT, [0, 0], palletAngle(v))],
    period: 4 * SWING,
  }),
  period: 4 * SWING,
};

/** 擺輪累計擺動 v → 擺輪角、立軸轉角、擒縱輪轉角(由接觸算) */
export function pirouette(v) {
  const balance = balanceAngle(v);
  return { balance, verge: vergeTurn(balance), wheel: escapement.angle(v) };
}

// ── 推斷的重錘驅動 ─────────────────────────
const ROPE_R = 0.035;
const DRUM_R = 0.16;
const DRUM = { center: [WHEEL[0], -1.4, 0], axis: Y, radius: DRUM_R + ROPE_R, sense: 1 }; // 輪往前轉(繞 +y)時繩從鼓的背面往左放出
const PULLEY_R = 0.13;
const PULLEY = { center: [-3.45, DRUM.center[1] - PULLEY_R - ROPE_R, -DRUM.radius], axis: Z, radius: PULLEY_R + ROPE_R, sense: -1 };
const REWIND = 8 * 4 * SWING; // 擺輪擺八個來回上鍊一次
const WEIGHT = { radius: 0.15, height: 0.4 };
const hang = weightDrive({
  drum: DRUM,
  pulleys: [PULLEY],
  eye: [PULLEY.center[0] - PULLEY.radius, -1.75, PULLEY.center[2]],
  reserve: DRUM.radius * 8 * PITCH,
  spare: 2 * Math.PI * DRUM.radius,
  pitch: 2.1 * ROPE_R,
});
const weightAt = rewound(hang, escapement.angle, REWIND);

export const geometry = { TEETH_R, DRUM, REWIND };

// 擒縱輪的盤面:四個透孔(照原圖)
const lens = (a) => {
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const t = -1 + i / 6;
    const s = i <= 6 ? 1 : -1;
    const u = i <= 6 ? t : 2 - (i - 6) / 6 - 1;
    const x = 0.26 * (s > 0 ? t : -u);
    const y = s * 0.13 * (1 - (x / 0.26) ** 2);
    pts.push([x, y]);
  }
  const c = 0.56;
  return pts.slice(0, -1).map(([x, y]) => [c * Math.cos(a) - x * Math.sin(a) + y * Math.cos(a), c * Math.sin(a) + x * Math.cos(a) + y * Math.sin(a)]);
};
const ARBOR_R = 0.06;
const FLOOR = -2.24; // 底板頂面

// 軸承:環(axis 方向)
const bearing = (axis, at, radius, inner, length) => ({ kind: "cylinder", axis, radius, inner, length, at });
// 從底板立到 top 的立柱
const post = (x, z, top, w = 0.12) => ({ kind: "box", size: [w, top - FLOOR, w], at: [x, (top + FLOOR) / 2, z] });

export default {
  figure: 298,
  parts: [
    {
      id: "balance",
      kind: "group",
      axis: Y,
      center: [STAFF_X, 0, 0],
      spin: BALANCE.radius,
      spinOffset: BALANCE.y,
      label: "C",
      labelOffset: [0.9, BALANCE.y + 0.15, -0.6],
      pieces: [
        { kind: "cylinder", radius: BALANCE.radius, inner: BALANCE.radius - 0.12, length: 0.1, at: [0, 0, BALANCE.y] },
        ...[0, 1, 2].map((i) => ({ kind: "box", size: [BALANCE.radius - 0.08, 0.08, 0.05], at: [((BALANCE.radius - 0.08) / 2) * Math.cos((i * TAU) / 3), ((BALANCE.radius - 0.08) / 2) * Math.sin((i * TAU) / 3), BALANCE.y], angle: (i * TAU) / 3, accent: i === 0 })),
        { kind: "cylinder", radius: 0.13, length: 0.12, at: [0, 0, BALANCE.y] },
        { kind: "cylinder", radius: 0.04, length: STAFF.top - STAFF.bottom, at: [0, 0, (STAFF.top + STAFF.bottom) / 2] },
        // 小齒輪:緊接在擺輪下方,原圖畫成有直槽的圓柱
        { kind: "gear", teeth: PINION.teeth, radius: PINION.radius, width: 0.14, at: [0, 0, PINION_Y] },
      ],
    },
    {
      id: "verge",
      kind: "group",
      axis: X,
      center: [0, 0, 0],
      arrow: false,
      pieces: [
        { kind: "cylinder", radius: 0.04, length: 3.15, at: [0, 0, -3.15 / 2] },
        // 冠狀齒輪:齒在右面,朝擺輪軸
        { kind: "gear", crown: true, teeth: CONTRATE.teeth, radius: CONTRATE.radius, width: CONTRATE.width, toothDepth: CONTRATE.depth, faceWidth: CONTRATE.face },
        // 兩個叉瓦:在擒縱輪右、左兩端的正上方(局部 z = 世界 x);外形照接觸計算,轉到齒的相位
        { kind: "plate", shape: shape(placePoly(RIGHT, [0, 0], -PHASE)), thickness: 0.12, at: [0, 0, WHEEL[0] + TEETH_R] },
        { kind: "plate", shape: shape(placePoly(LEFT, [0, 0], -PHASE)), thickness: 0.12, at: [0, 0, WHEEL[0] - TEETH_R] },
      ],
    },
    {
      id: "wheel",
      kind: "group",
      axis: Y,
      center: WHEEL,
      spin: WHEEL_R,
      spinOffset: -RIM / 2,
      pieces: [
        { kind: "cylinder", radius: WHEEL_R, inner: WHEEL_R - 0.12, length: RIM },
        { kind: "plate", shape: shape(circle(WHEEL_R - 0.06), [0, 1, 2, 3].map((k) => lens(Math.PI / 4 + (k * Math.PI) / 2).reverse())), thickness: 0.05, at: [0, 0, -RIM / 2 + 0.025] },
        ...sawCrown({ teeth: N, radius: TEETH_R, height: TOOTH, base: RIM / 2, thick: 0.06 }),
        // 輪轂與輪軸:軸固定在輪轂裡,往下穿過鼓、伸進底板上的軸承
        { kind: "cylinder", radius: 0.14, length: 0.16, at: [0, 0, -RIM / 2 - 0.03] },
        { kind: "cylinder", radius: ARBOR_R, length: WHEEL[1] - FLOOR, at: [0, 0, -(WHEEL[1] - FLOOR) / 2] },
        { kind: "cylinder", radius: DRUM_R, length: 0.3, at: [0, 0, DRUM.center[1] + 0.06 - WHEEL[1]] }, // 繞繩的鼓(推斷)
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [4.1, 0.12, 2.0], at: [-1.25, FLOOR - 0.06, -0.4] }, // 底板
        // 擒縱輪軸的軸承
        bearing(Y, [WHEEL[0], FLOOR + 0.25, 0], 0.13, ARBOR_R, 0.5),
        // 立軸左端與冠狀齒輪左邊的軸承架
        ...[-3.05, -0.4].flatMap((x) => [bearing(X, [x, 0, 0], 0.11, 0.04, 0.12), post(x, 0, -0.07)]),
        // 擺輪軸下端的軸承
        bearing(Y, [STAFF_X, STAFF.bottom + 0.05, 0], 0.1, 0.04, 0.12),
        post(STAFF_X, 0, STAFF.bottom - 0.01),
        // 擺輪軸上端的軸承橋:從擺輪外側後方立起,跨到軸頂
        post(-2.1, -1.2, STAFF.top + 0.03),
        { kind: "box", size: [STAFF_X + 2.1 + 0.12, 0.1, 0.12], at: [(STAFF_X - 2.1) / 2, STAFF.top - 0.02, -1.2] },
        { kind: "box", size: [0.12, 0.1, 1.2], at: [STAFF_X, STAFF.top - 0.02, -0.6] },
        bearing(Y, [STAFF_X, STAFF.top - 0.02, 0], 0.1, 0.04, 0.1),
        // 左邊軸承架伸出的托臂與滑輪的軸(推斷)
        { kind: "box", size: [0.46, 0.1, 0.1], at: [-3.05 - 0.2, PULLEY.center[1], 0] },
        { kind: "cylinder", radius: 0.035, length: 0.05 - PULLEY.center[2] + 0.1, at: [PULLEY.center[0], PULLEY.center[1], (0.05 + PULLEY.center[2] - 0.1) / 2] },
      ],
    },
    { id: "pulley", kind: "pulley", style: "disc", center: PULLEY.center, axis: Z, radius: PULLEY_R, width: 0.08, arrow: false },
    { id: "rope", kind: "rope", radius: ROPE_R },
    { id: "weight", kind: "weight", axis: Y, radius: WEIGHT.radius, height: WEIGHT.height },
  ],
  // 動力重演:只推擺輪(立軸照模型經齒輪帶動);擒縱輪受重錘的固定力矩(以彈簧代替;重錘、滑輪照模型的姿勢走),
  // 由左右兩個叉瓦輪流擋住、放行
  replay: {
    to: 8 * SWING,
    free: { wheel: { pivot: WHEEL, spring: 1, gravity: false } },
    ignore: [["balance", "verge"], ["wheel", "frame"]], // 小齒輪與冠狀齒輪的咬合不做動力重演;擒縱輪軸插在軸承裡
    expect: [
      { at: 2 * SWING, part: "wheel", label: "擺輪擺過一次,擒縱輪轉過半個齒" },
      { at: 4 * SWING, part: "wheel", label: "擺輪一個來回,擒縱輪轉過一個齒" },
      { part: "wheel", label: "擺輪兩個來回,擒縱輪轉過兩個齒" },
    ],
  },
  driver: { part: "balance", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheel", // 擒縱輪:擒縱讓它一齒一齒地放行
  view: { direction: [0.55, 0.4, 1] },
  pose(v) {
    const r = pirouette(v);
    const w = weightAt(v);
    const eye = w.eye;
    return {
      parts: {
        balance: { angle: r.balance },
        verge: { angle: r.verge },
        wheel: { angle: r.wheel },
        pulley: { angle: w.pulleys[0] },
        weight: { position: [eye[0], eye[1] - WEIGHT.height / 2 - WEIGHT.radius * 0.38, eye[2]] },
      },
      paths: { rope: { points: w.rope, closed: false, phase: 0 } },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["balance", "verge"], reason: "簡化齒形:冠狀齒輪的齒畫成方塊,與小齒輪的梯形齒在齒側互相擦到 0.04;嚙合關係(齒數比、轉向)不受影響" },
  ],
};
