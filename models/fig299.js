// 第 299 種:老式的時鐘擒縱(立軸擒縱,verge)。冠狀輪的齒朝上立在輪緣;水平的立軸跨過冠狀輪上方,
// 軸上兩個叉瓦彼此張開一個大角度,一個在輪的前側、一個在後側。冠狀輪的齒推開一個叉瓦、從它的尖端滑過,
// 立軸跟著轉,另一個叉瓦落進後側的齒間、擋住對面的齒(並把輪推回一點);立軸擺回來時再換過來。
// 冠狀輪每擺一次轉過半個齒。主動件是立軸(由擺或擺輪帶動);目標件是冠狀輪(擒縱讓它一齒一齒地放行)。
//
// 由接觸算(models/escapement.js 的 crownByContact):冠狀輪受重錘的固定力矩轉動,叉瓦只在輪的前、後兩端碰到齒,
// 在那兩個切面上算齒與叉瓦的接觸——齒被擋住就停、被叉瓦推就退(立軸擒縱是回退式),放開後加速轉到對面的叉瓦上。
// 比例照 525 px 原圖:叉瓦長約輪半徑的 0.55、齒高約輪半徑的一半、兩叉瓦張開約 130°(原圖從立軸的端面看,
// 一個朝右、一個朝左下);齒那麼高、叉瓦那麼長時,齒距要夠寬叉瓦才伸得進齒間(15、13 齒找不到可行的配法),
// 所以齒數取 9(齒距 40°)、擺幅加大到 ±40°、立軸離齒尖 0.45(實物的立軸擒縱本來就擺得大)。
// 原圖的齒距(2026-10-13 在 525 px 原圖上量):輪緣從側面看左右邊緣在 x 18、511 px(中心 264.5、半徑 246.5),
// 前側兩個齒尖在 x 192、426,換算方位角 −17.1°、40.9°,相隔 58°;兩個齒根(陡面的下端)在 x 107、332,
// −39.7°、15.9°,相隔 56°——原圖約 6–7 齒一圈,比 9 齒(40°)稀。改不改齒數待維護者決定
// (.scratch/model-audit/16-escapement-2.md「需要你決定的」)。
// 推斷:齒數(奇數,前後兩側的齒才錯開半個齒距)、擺幅、立軸的高度;冠狀輪的軸與機架(原圖沒畫):
// 立軸兩端的軸承從上方的橫樑吊下來,橫樑接到冠狀輪右邊的立柱——前軸承下面不再有立柱擋在叉瓦前面。
// 推斷的擺(原圖沒畫;原文只說是老式時鐘的擒縱,主動件立軸由擺帶動):立軸穿過後軸承再往後伸一段,軸端的轂上
// 吊著擺桿,擺桿往下伸過底座的高度(在底座後面),下端是擺錘——擺錘若在冠狀輪正下方,正面看會被輪與鼓蓋住;擺和立軸是同一件(主動件),擺多少立軸就擺多少。
// 擺在後叉瓦與後軸承的後面,從正面看不擋住叉瓦與齒。
// 推斷的驅動(原文只說是老式時鐘的擒縱,沒說輪為什麼往前轉;共用 weight-drive.js):冠狀輪軸上、輪的下方有一個鼓,
// 繩從鼓的前面往右拉到立柱上的滑輪,再垂下吊著重錘;重錘的重量就是讓輪往前轉的固定力矩,輪轉多少重錘降多少,
// 被叉瓦擋住時重錘也停。重錘每降一段(立軸擺四個來回)捲回最高處一次(上鍊,畫面上一下子回到上面)。
import { Y, Z, TAU, deg, swing } from "./kit.js";
import { crownByContact, placePoly, sawCrown } from "./escapement.js";
import { shape, thickLine, circle } from "./shapes.js";
import { weightDrive, rewound } from "./weight-drive.js";

export const N = 9;
export const PITCH = TAU / N;
export const SWING = deg(40);
const R = 2.1;
const TOOTH = 1.05; // 齒高:約輪半徑的一半
const RIM = 0.9; // 輪緣高
const C = [0, -0.6, 0]; // 冠狀輪中心
const BASE = C[1] + RIM / 2; // 齒底的高度(世界 y)
const STAFF = [0, BASE + TOOTH + 0.45]; // 立軸(世界 x、y;軸沿 z):在齒尖上方
const FLAG = { length: 1.2, width: 0.12 }; // 叉瓦:約輪半徑的 0.55
const AXLE_R = 0.12; // 冠狀輪的軸
const STAFF_R = 0.05; // 立軸
const BEARING_Z = R + 0.6; // 立軸兩端的軸承
const TOP = STAFF[1] + 0.9; // 吊著軸承的橫樑
const POST = [2.75, -0.12]; // 右邊的立柱(x、z)
const FLOOR = C[1] - 1.5; // 底座頂面
const PENDULUM = { z: -(BEARING_Z + 0.3), bob: 0.4 }; // 擺(推斷):在後軸承之外
const ROD = STAFF[1] - FLOOR + 1.4; // 擺桿長(立軸到擺錘中心):擺錘中心在底座頂面下方 1.4(正面看在底座下方看得到)

// 叉瓦(相對立軸,在 x–y 平面):居中時前叉瓦朝右下、後叉瓦朝左下,各在水平下方 25°,彼此張開 130°
const flag = (a) => thickLine([[0, 0], [FLAG.length * Math.cos(a), FLAG.length * Math.sin(a)]], FLAG.width);
const FRONT = flag(deg(-25));
const BACK = flag(deg(-155));

/** 立軸累計擺動 v → 擺角 */
export const vergeAngle = (v) => swing(v, -SWING, SWING);
export const escapement = {
  ...crownByContact({
    radius: R - 0.04,
    teeth: N,
    height: TOOTH,
    base: BASE,
    front: (v) => [placePoly(FRONT, STAFF, vergeAngle(v))],
    back: (v) => [placePoly(BACK, STAFF, vergeAngle(v))],
    period: 4 * SWING,
  }),
  period: 4 * SWING,
};
/** 立軸累計擺動 v → 冠狀輪轉角(由接觸算) */
export const wheelAngle = escapement.angle;

// 推斷的重錘驅動:鼓在冠狀輪軸上、輪的下方;繩從鼓的前面(+z)往右拉到立柱上的滑輪頂上,再垂下吊重錘
const ROPE_R = 0.045; // 繩的半徑(畫面上的繩粗)
const DRUM_R = 0.2;
const DRUM = { center: [0, C[1] - RIM / 2 - 0.3, 0], axis: Y, radius: DRUM_R + ROPE_R, sense: 1 }; // 輪往前轉(繞 +y)時繩從鼓上放出
const PULLEY_R = 0.15;
const PULLEY = { center: [POST[0], DRUM.center[1] - PULLEY_R - ROPE_R, DRUM.radius], axis: Z, radius: PULLEY_R + ROPE_R, sense: 1 };
const REWIND = 4 * 4 * SWING; // 立軸擺四個來回上鍊一次
const WEIGHT = { radius: 0.17, height: 0.45 };
const hang = weightDrive({
  drum: DRUM,
  pulleys: [PULLEY],
  eye: [PULLEY.center[0] + PULLEY.radius, PULLEY.center[1] - 0.35, PULLEY.center[2]],
  reserve: DRUM.radius * 4 * PITCH,
  spare: 2 * Math.PI * DRUM.radius,
  pitch: 2.1 * ROPE_R,
});
const weightAt = rewound(hang, wheelAngle, REWIND);
export const geometry = { DRUM, REWIND, C, RIM };

const axleLength = C[1] - RIM / 2 - FLOOR; // 冠狀輪的軸:從輪盤往下到底座
const bearing = (z) => [
  { kind: "cylinder", radius: 0.16, inner: STAFF_R, length: 0.16, at: [STAFF[0], STAFF[1], z] },
  { kind: "box", size: [0.16, TOP - STAFF[1], 0.16], at: [STAFF[0], (TOP + STAFF[1]) / 2, z] }, // 從軸承往上接到橫樑
];

export default {
  figure: 299,
  parts: [
    {
      id: "crown",
      kind: "group",
      axis: Y,
      center: C,
      spin: R,
      spinOffset: -RIM / 2,
      pieces: [
        { kind: "cylinder", radius: R, inner: R - 0.12, length: RIM },
        { kind: "plate", shape: shape(circle(R - 0.06), [circle(AXLE_R).reverse()]), thickness: 0.1, at: [0, 0, -RIM / 2 + 0.05] },
        { kind: "cylinder", radius: AXLE_R, length: axleLength, at: [0, 0, -RIM / 2 - axleLength / 2] }, // 冠狀輪的軸,穿過輪盤的孔、往下伸進軸承
        ...sawCrown({ teeth: N, radius: R - 0.04, height: TOOTH, base: RIM / 2, thick: 0.1 }),
        { kind: "cylinder", radius: DRUM_R, length: 0.3, at: [0, 0, DRUM.center[1] - C[1]] }, // 繞繩的鼓(推斷)
      ],
    },
    {
      id: "verge",
      kind: "group",
      center: [...STAFF, 0],
      arrow: false,
      pieces: [
        { kind: "cylinder", radius: STAFF_R, length: 2 * BEARING_Z + 0.3 }, // 立軸,兩端穿過軸承
        { kind: "cylinder", radius: 0.12, inner: STAFF_R, length: 0.14, at: [0, 0, R + 0.3] }, // 套環(固定在立軸上,主動件的抓取處)
        // 推斷的擺:立軸穿過後軸承再往後伸到擺的轂,擺桿從轂往下,下端是擺錘
        { kind: "cylinder", radius: STAFF_R, length: -(BEARING_Z + 0.15) - PENDULUM.z + 0.1, at: [0, 0, (-(BEARING_Z + 0.15) + PENDULUM.z - 0.1) / 2] },
        { kind: "cylinder", radius: 0.13, length: 0.12, at: [0, 0, PENDULUM.z] },
        { kind: "box", size: [0.08, ROD, 0.06], at: [0, -ROD / 2, PENDULUM.z] },
        { kind: "cylinder", radius: PENDULUM.bob, length: 0.12, at: [0, -ROD, PENDULUM.z] },
        { kind: "plate", shape: shape(FRONT), thickness: 0.14, at: [0, 0, R - 0.04] }, // 前叉瓦
        { kind: "plate", shape: shape(BACK), thickness: 0.14, at: [0, 0, -R + 0.04] }, // 後叉瓦
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 立軸兩端的軸承從上方的橫樑吊下來;橫樑往右接到立柱,立柱站在底座上(原圖沒畫)
        ...bearing(BEARING_Z),
        ...bearing(-BEARING_Z),
        { kind: "box", size: [0.2, 0.16, 2 * BEARING_Z + 0.16], at: [STAFF[0], TOP, 0] },
        { kind: "box", size: [POST[0] + 0.08, 0.16, 0.16], at: [(POST[0] + 0.08) / 2, TOP, POST[1]] },
        { kind: "box", size: [0.16, TOP - FLOOR + 0.08, 0.16], at: [POST[0], (TOP + FLOOR + 0.08) / 2, POST[1]] },
        // 底座、立柱的腳(往後讓開吊著的重錘)、冠狀輪軸下端的軸承
        { kind: "box", size: [3.1, 0.16, 1.2], at: [1.0, FLOOR - 0.08, 0] },
        { kind: "box", size: [0.4, 0.16, 0.5], at: [POST[0], FLOOR - 0.08, POST[1] - 0.17] },
        { kind: "cylinder", axis: Y, radius: 0.2, inner: AXLE_R, length: 0.16, at: [0, FLOOR + 0.08, 0] },
        // 立柱伸出的滑輪軸(推斷)
        { kind: "cylinder", radius: 0.04, length: PULLEY.center[2] - POST[1], at: [PULLEY.center[0], PULLEY.center[1], (PULLEY.center[2] + POST[1]) / 2] },
      ],
    },
    { id: "pulley", kind: "pulley", style: "disc", center: PULLEY.center, axis: Z, radius: PULLEY_R, width: 0.1, arrow: false },
    { id: "rope", kind: "rope", radius: ROPE_R },
    { id: "weight", kind: "weight", axis: Y, radius: WEIGHT.radius, height: WEIGHT.height },
  ],
  // 動力重演:只推立軸;冠狀輪受重錘的固定力矩轉動(以彈簧代替;重錘、滑輪照模型的姿勢走),由前後兩個叉瓦輪流擋住、推回、放行
  replay: {
    to: 8 * SWING,
    free: { crown: { pivot: C, spring: 1, gravity: false } },
    ignore: [["crown", "frame"]], // 冠狀輪的軸插在軸承裡(孔沒畫出來)
    expect: [
      { at: 2 * SWING, part: "crown", label: "立軸擺過一次,冠狀輪轉過半個齒" },
      { at: 4 * SWING, part: "crown", label: "立軸一個來回,冠狀輪轉過一個齒" },
      { part: "crown", label: "立軸兩個來回,冠狀輪轉過兩個齒" },
    ],
  },
  driver: { part: "verge", type: "rotation", cycle: [-SWING, SWING] },
  target: "crown", // 冠狀輪(擒縱輪):擒縱讓它一齒一齒地放行
  view: { direction: [0.08, 0.18, 1] },
  pose(v) {
    const w = weightAt(v);
    const eye = w.eye;
    return {
      parts: {
        verge: { angle: vergeAngle(v) },
        crown: { angle: wheelAngle(v) },
        pulley: { angle: w.pulleys[0] },
        weight: { position: [eye[0], eye[1] - WEIGHT.height / 2 - WEIGHT.radius * 0.38, eye[2]] },
      },
      paths: { rope: { points: w.rope, closed: false, phase: 0 } },
      readouts: [],
    };
  },
};
