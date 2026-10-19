// 第 302 種:擺輪式擒縱。D 是擒縱輪(冠狀輪,從側面看是一條上緣帶齒的輪緣),下方是它軸上的小齒輪;
// C 是擺輪:一根兩端裝球的擺桿,和叉瓦 A、B 一起裝在水平的立軸上,立軸跨在冠狀輪上方。
// 冠狀輪的齒推開一個叉瓦、從它的尖端滑過,立軸跟著轉,另一個叉瓦伸進對面的齒間擋住齒(並把輪推回一點);擺輪擺回來時再換過來。
// 冠狀輪每擺一次轉過半個齒(原圖前緣的箭頭朝右)。主動件是擺輪;目標件是冠狀輪 D(擒縱讓它一齒一齒地放行)。
//
// 由接觸算(models/escapement.js 的 crownByContact,與第 299 種相同的作法):冠狀輪受重錘經輪系傳來的固定力矩轉動,
// 叉瓦只在輪的前、後兩端碰到齒,在那兩個切面上算齒與叉瓦的接觸。
// 比例照 525 px 原圖(輪緣寬 328 px,R = 164 px):叉瓦長約輪半徑的 0.26、立軸在齒尖上方約 0.2 倍半徑、兩叉瓦張開約 65°
// (A 朝右下、B 朝左下,B 是虛線:在輪的後面);擺幅 ±45°。
// 原圖擺桿從 C 往右下的那一段在輪緣處斷開、到輪緣下方才再出現——擺桿在輪緣後面;直桿不可能穿過輪的盤面,
// 所以擺輪裝在立軸的後端、整個冠狀輪的後面。擺桿居中時照原圖離鉛直約 18°(下端朝右下)。
// 推斷:齒數與擺幅;立軸與冠狀輪軸的軸承(原圖沒畫):立軸的前軸承在叉瓦 A 的後面(輪緣裡面的上方)、後軸承在叉瓦 B 與
// 擺輪之間,兩個都從上方的橫樑吊下來,橫樑往左接到立柱,立柱站在底座上——叉瓦 A、立軸端面(C)與小齒輪前面都沒有機架。
// 立軸前端的套環(主動件的抓取處)也在叉瓦 A 的後面。冠狀輪軸往下穿過小齒輪,下端插在底座上的軸承裡。
// 推斷的輪系與驅動(原文只說是擺輪式擒縱,沒說輪為什麼往前轉;原圖冠狀輪軸下端的小齒輪是接輪系的地方;共用 weight-drive.js):
// 小齒輪由左邊一個 30 齒的輪(立在底座上的直立軸)帶動,這根軸上、輪的上方有一個鼓,繩從鼓的前面往左拉到立柱上的
// 滑輪,再垂下吊著重錘;重錘的重量經輪與小齒輪成為讓冠狀輪往前轉的固定力矩,冠狀輪被叉瓦擋住時重錘也停。
// 擺輪擺十二個來回重錘捲回最高處一次(上鍊,畫面上一下子回到上面)。錶用的擒縱實物多半是發條,重錘只是示意。
import { Y, Z, TAU, deg, swing } from "./kit.js";
import { crownByContact, placePoly, sawCrown } from "./escapement.js";
import { meshAngle } from "./gears.js";
import { weightDrive, rewound } from "./weight-drive.js";
import { shape, thickLine, circle } from "./shapes.js";

export const N = 15;
export const PITCH = TAU / N;
export const SWING = deg(45);
const R = 1.9;
const RIM = 0.4;
const TOOTH = 0.35;
const TIPS = RIM / 2 + TOOTH; // 齒尖的高度
const STAFF_Y = TIPS + 0.38; // 立軸(C):在齒尖上方約 0.2 倍輪半徑
const ARM = 2.3;
const TILT = deg(-72); // 擺桿(下端)在立軸上的方向:離鉛直約 18°
const FLAG = { length: 0.5, width: 0.1 }; // 叉瓦:約輪半徑的 0.26
const flagLine = (a) => thickLine([[0, 0], [FLAG.length * Math.cos(a), FLAG.length * Math.sin(a)]], FLAG.width);
const FRONT = flagLine(deg(-57.5)); // 叉瓦 A(前),兩叉瓦張開 65°
const BACK = flagLine(deg(-122.5)); // 叉瓦 B(後)
const STAFF_R = 0.05;
const AXLE_R = 0.07; // 冠狀輪的軸
const BEARING = { front: R - 0.45, back: -(R + 0.2) }; // 立軸的兩個軸承(z)
const BALANCE_Z = -(R + 0.45); // 擺輪那一層
const TOP = STAFF_Y + 0.9; // 吊著軸承的橫樑
const POST = [-2.75, -0.12]; // 左邊的立柱(x、z)
const FLOOR = -2.75; // 底座頂面

/** 擺輪累計擺動 v → 擺角(不含擺桿的傾斜) */
export const balanceSwing = (v) => swing(v, -SWING, SWING);
export const escapement = {
  ...crownByContact({
    radius: R - 0.03,
    teeth: N,
    height: TOOTH,
    base: RIM / 2,
    front: (v) => [placePoly(FRONT, [0, STAFF_Y], balanceSwing(v))],
    back: (v) => [placePoly(BACK, [0, STAFF_Y], balanceSwing(v))],
    period: 4 * SWING,
  }),
  period: 4 * SWING,
};

/** 擺輪累計擺動 v → 擺輪角(含擺桿的傾斜)、冠狀輪轉角(由接觸算) */
export function balance(v) {
  return { angle: balanceSwing(v) + TILT, crown: escapement.angle(v) };
}

const flag = (line) => shape(placePoly(line, [0, 0], -TILT));

// 推斷的輪系:冠狀輪軸下端的 10 齒小齒輪,由左邊 30 齒的輪帶動(同一模數,兩輪在同一高度咬合)
const PINION = { center: [0, -2.35, 0], axis: Y, teeth: 10, radius: 0.32 };
const TRAIN = { center: [-(0.32 + 0.96), -2.35, 0], axis: Y, teeth: 30, radius: 0.96 };
/** 輪系的輪(由小齒輪的轉角算) */
const trainAngle = (v) => meshAngle(PINION, TRAIN, escapement.angle(v));
// 推斷的重錘驅動:鼓在輪的直立軸上、輪的上方;繩從鼓的前面(+z)往左拉到立柱上的滑輪頂上,再垂下吊重錘
const ROPE_R = 0.045;
const DRUM_R = 0.2;
const DRUM = { center: [TRAIN.center[0], -1.95, 0], axis: Y, radius: DRUM_R + ROPE_R, sense: -1 }; // 輪往前轉(繞 −y)時繩從鼓上放出
const PULLEY_R = 0.15;
const PULLEY = { center: [POST[0], DRUM.center[1] - PULLEY_R - ROPE_R, DRUM.radius], axis: Z, radius: PULLEY_R + ROPE_R, sense: -1 };
const REWIND = 12 * 4 * SWING; // 擺輪擺十二個來回上鍊一次
const WEIGHT = { radius: 0.17, height: 0.45 };
const hang = weightDrive({
  drum: DRUM,
  pulleys: [PULLEY],
  eye: [PULLEY.center[0] - PULLEY.radius, PULLEY.center[1] - 0.35, PULLEY.center[2]],
  reserve: DRUM.radius * 12 * PITCH * (PINION.teeth / TRAIN.teeth),
  spare: TAU * DRUM.radius,
  pitch: 2.1 * ROPE_R,
});
const weightAt = rewound(hang, (v) => -trainAngle(v), REWIND);
export const geometry = { R, STAFF_Y, TIPS, PINION, TRAIN, DRUM, REWIND };

const hanger = (z) => [
  { kind: "cylinder", radius: 0.14, inner: STAFF_R, length: 0.14, at: [0, STAFF_Y, z] },
  { kind: "box", size: [0.14, TOP - STAFF_Y, 0.14], at: [0, (TOP + STAFF_Y) / 2, z] }, // 從軸承往上接到橫樑
];
const crownAxle = -RIM / 2 + 0.08 - (FLOOR + 0.02); // 冠狀輪的軸:從輪盤往下穿過小齒輪,下端插在底座上的軸承裡

export default {
  figure: 302,
  parts: [
    {
      id: "crownD",
      kind: "group",
      axis: Y,
      spin: R,
      spinOffset: -RIM / 2,
      label: "D",
      labelOffset: [-1.2, 0.3, 1.0],
      pieces: [
        { kind: "cylinder", radius: R, inner: R - 0.1, length: RIM },
        { kind: "plate", shape: shape(circle(R - 0.05), [circle(AXLE_R).reverse()]), thickness: 0.08, at: [0, 0, -RIM / 2 + 0.04] },
        ...sawCrown({ teeth: N, radius: R - 0.03, height: TOOTH, base: RIM / 2, thick: 0.08 }),
        { kind: "cylinder", radius: AXLE_R, length: crownAxle, at: [0, 0, -RIM / 2 + 0.08 - crownAxle / 2] },
        { kind: "gear", teeth: PINION.teeth, radius: PINION.radius, width: 0.4, at: [0, 0, PINION.center[1]] },
      ],
    },
    {
      id: "balanceC",
      kind: "group",
      center: [0, STAFF_Y, 0],
      label: "C",
      labelOffset: [0.25, 0.3, R + 0.3],
      spin: 0.3,
      pieces: [
        // 立軸:前端和叉瓦 A 的正面齊平,往後穿過兩個軸承到擺輪
        { kind: "cylinder", radius: STAFF_R, length: R + 0.03 - BALANCE_Z + 0.08, at: [0, 0, (R + 0.03 + BALANCE_Z - 0.08) / 2] },
        { kind: "cylinder", radius: 0.12, inner: STAFF_R, length: 0.12, at: [0, 0, R - 0.2] }, // 套環(固定在立軸上,在叉瓦 A 後面)
        // 叉瓦 A(前)、B(後)
        { kind: "plate", shape: flag(FRONT), thickness: 0.12, at: [0, 0, R - 0.03] },
        { kind: "plate", shape: flag(BACK), thickness: 0.12, at: [0, 0, -R + 0.03] },
        // 擺輪:轂、擺桿與兩個球(在冠狀輪後面)
        { kind: "cylinder", radius: 0.14, length: 0.14, at: [0, 0, BALANCE_Z] },
        { kind: "plate", shape: shape(thickLine([[-ARM, 0], [ARM, 0]], 0.1)), thickness: 0.08, at: [0, 0, BALANCE_Z] },
        { kind: "sphere", radius: 0.42, at: [ARM, 0, BALANCE_Z] },
        { kind: "sphere", radius: 0.42, at: [-ARM, 0, BALANCE_Z], accent: true },
      ],
    },
    {
      id: "train",
      kind: "gear",
      center: TRAIN.center,
      axis: Y,
      teeth: TRAIN.teeth,
      radius: TRAIN.radius,
      width: 0.2,
      arrow: false,
      pieces: [
        // 直立軸:下端插在底座上的軸承裡,往上穿過輪到鼓
        { kind: "cylinder", radius: 0.07, length: DRUM.center[1] + 0.15 - (FLOOR + 0.02), at: [0, 0, (DRUM.center[1] + 0.15 + FLOOR + 0.02) / 2 - TRAIN.center[1]] },
        { kind: "cylinder", radius: DRUM_R, length: 0.26, at: [0, 0, DRUM.center[1] - TRAIN.center[1]] }, // 繞繩的鼓(推斷)
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 立軸的兩個軸承從上方的橫樑吊下來;橫樑往左接到立柱,立柱站在底座上(原圖沒畫)
        ...hanger(BEARING.front),
        ...hanger(BEARING.back),
        { kind: "box", size: [0.2, 0.16, BEARING.front - BEARING.back + 0.16], at: [0, TOP, (BEARING.front + BEARING.back) / 2] },
        { kind: "box", size: [-POST[0] + 0.08, 0.16, 0.16], at: [(POST[0] - 0.08) / 2, TOP, POST[1]] },
        { kind: "box", size: [0.16, TOP - FLOOR + 0.08, 0.16], at: [POST[0], (TOP + FLOOR + 0.08) / 2, POST[1]] },
        // 底座、立柱的腳(往後讓開吊著的重錘)、冠狀輪軸與輪系直立軸的下軸承
        { kind: "box", size: [3.1, 0.16, 1.2], at: [-1.0, FLOOR - 0.08, 0] },
        { kind: "box", size: [0.4, 0.16, 0.5], at: [POST[0], FLOOR - 0.08, POST[1] - 0.17] },
        { kind: "cylinder", axis: Y, radius: 0.16, inner: AXLE_R, length: 0.14, at: [0, FLOOR + 0.07, 0] },
        { kind: "cylinder", axis: Y, radius: 0.16, inner: 0.07, length: 0.14, at: [TRAIN.center[0], FLOOR + 0.07, 0] },
        // 立柱伸出的滑輪軸(推斷)
        { kind: "cylinder", radius: 0.04, length: PULLEY.center[2] - POST[1], at: [PULLEY.center[0], PULLEY.center[1], (PULLEY.center[2] + POST[1]) / 2] },
      ],
    },
    { id: "pulley", kind: "pulley", style: "disc", center: PULLEY.center, axis: Z, radius: PULLEY_R, width: 0.1, arrow: false },
    { id: "rope", kind: "rope", radius: ROPE_R },
    { id: "weight", kind: "weight", axis: Y, radius: WEIGHT.radius, height: WEIGHT.height },
    { id: "labelA", kind: "group", center: [0.45, STAFF_Y - 0.45, R], label: "A", labelOffset: [0.2, 0, 0.3] },
    { id: "labelB", kind: "group", center: [-0.45, STAFF_Y - 0.45, -R], label: "B", labelOffset: [-0.2, 0, 0.3] },
  ],
  // 動力重演:只推擺輪;冠狀輪受重錘經輪系傳來的固定力矩(以彈簧代替;輪系、重錘、滑輪照模型的姿勢走)轉動,由前後兩個叉瓦輪流擋住、放行
  replay: {
    to: 8 * SWING,
    free: { crownD: { pivot: [0, 0, 0], spring: 1, gravity: false } },
    ignore: [["crownD", "frame"], ["crownD", "train"], ["train", "frame"]], // 冠狀輪軸與輪系的軸插在軸承裡(孔沒畫出來);小齒輪與輪的咬合不做動力重演
    expect: [
      { at: 2 * SWING, part: "crownD", label: "擺輪擺過一次,冠狀輪轉過半個齒" },
      { at: 4 * SWING, part: "crownD", label: "擺輪一個來回,冠狀輪轉過一個齒" },
      { part: "crownD", label: "擺輪兩個來回,冠狀輪轉過兩個齒" },
    ],
  },
  driver: { part: "balanceC", type: "rotation", cycle: [-SWING, SWING] },
  target: "crownD", // 冠狀輪(擒縱輪):擒縱讓它一齒一齒地放行
  view: { direction: [0.08, 0.15, 1] },
  pose(v) {
    const b = balance(v);
    const w = weightAt(v);
    return {
      parts: {
        balanceC: { angle: b.angle },
        crownD: { angle: b.crown },
        train: { angle: trainAngle(v) },
        pulley: { angle: w.pulleys[0] },
        weight: { position: [w.eye[0], w.eye[1] - WEIGHT.height / 2 - WEIGHT.radius * 0.38, w.eye[2]] },
      },
      paths: { rope: { points: w.rope, closed: false, phase: 0 } },
      readouts: [],
    };
  },
};
