// 第 292 種:凸柱式擒縱(大型時鐘)。大輪的輪緣上交替地在前面與後面立著凸柱;錨形件繞 F 擺動,
// 一個叉瓦 B 在輪的前方作動、另一個(A)在後方作動,凸柱交替地抵在前、後叉瓦上。
// 叉瓦的鎖面是以 F 為圓心的圓弧,所以凸柱抵住叉瓦時輪完全靜止(靜擊式)。輪依原圖箭頭順時針轉,
// 擺每擺一次放走一根凸柱。主動件是錨形件(擺);目標件是大輪(擒縱讓它一根凸柱一根凸柱地放行)。
//
// 由接觸算(models/escapement.js 的 escapeByContact,前後兩層分開算):輪受重錘的固定力矩往順時針轉,
// 凸柱被同一層的叉瓦擋住就停,滑過叉瓦尖端的斜面時推動錨形件,脫開後加速落到另一層的叉瓦上。
// 叉瓦的位置依作圖法:F 在凸柱圓的切線上,凸柱經過叉瓦時是背著 F 走的;前叉瓦 B 從輪外往內伸、
// 後叉瓦 A 從輪緣內側往外伸,錨形件往一邊擺時 B 退出、A 伸進凸柱的路徑。
// 照原圖(525 px 原圖):右臂從 H 在輪外伸到折角 B,再折回、在輪的前面越過輪緣接到前叉瓦 B;左臂 G 在輪的後面越過
// 輪緣(原圖左臂的線碰到輪緣就斷、到輪緣內側才又出現),往下接輪緣內側的後叉瓦 A(R)。叉瓦加厚到碰著各自的臂,
// 錨形件是一件。
// 推斷:凸柱的數目與間距、擺幅、叉瓦的寬度;輪軸與錨形件的軸裝在後面的夾板條上(原圖沒畫)。
// 推斷的擺(原圖沒畫;原文只說是大型時鐘的擒縱):錨形件的軸往後穿過夾板條,擺桿與擺錘固定在軸的後端、往下垂,
// 和錨形件一起擺(也是主動件的抓取處)。
// 推斷的驅動(原文沒說輪為什麼往前轉;共用 weight-drive.js,和第 234、238 種一樣):大輪的軸往後穿過夾板條,
// 軸上的鼓繞著繩,繩從鼓的右側垂下吊著重錘,重錘的重量就是讓輪順時針轉的固定力矩;輪轉多少,重錘降多少,
// 凸柱被叉瓦擋住時重錘也停。重錘每降一段(擺來回十二次)捲回最高處一次(上鍊,畫面上一下子回到上面)。
import { TAU, deg, swing, Y, Z } from "./kit.js";
import { weightDrive, rewound } from "./weight-drive.js";
import { anchorPallet, escapeByContact, placePoly } from "./escapement.js";
import { shape, circle, thickLine } from "./shapes.js";
import { circlePolygon } from "./contact.js";
import { plateBar } from "./supports.js";

const WHEEL = { center: [-2.6, -3.6], radius: 3.9 };
const RS = WHEEL.radius - 0.2; // 凸柱圓
const STUD = 0.07;
export const STUDS = 60; // 一圈的凸柱數(前、後交替)
export const STEP = TAU / STUDS;
export const SWING = deg(5);
export const LIFT = deg(2);
const AT = deg(16); // 叉瓦在輪上的方位
const TANGENT = [Math.sin(AT), -Math.cos(AT)]; // 順時針轉時凸柱的走向
const P0 = [WHEEL.center[0] + RS * Math.cos(AT), WHEEL.center[1] + RS * Math.sin(AT)];
const F = [P0[0] - 4.0 * TANGENT[0], P0[1] - 4.0 * TANGENT[1]];

const pallet = (outside) => anchorPallet({ P: F, O: WHEEL.center, R: RS, at: AT, dir: -1, width: 0.22, lift: LIFT, lock: deg(2.4), back: 0.2, outside });
const B = pallet(false); // 前叉瓦 B:從輪外往內伸
const A = pallet(true); // 後叉瓦 A:從輪緣內側往外伸
/** 凸柱圓的半徑(檢查用:前叉瓦在它外面、後叉瓦在它裡面) */
export const STUD_RADIUS = RS;

// 凸柱:偶數根在前面、奇數根在後面
const studs = Array.from({ length: STUDS }, (_, i) => circlePolygon([RS * Math.cos(i * STEP), RS * Math.sin(i * STEP)], STUD, 12));
const layers = studs.map((_, i) => (i % 2 === 0 ? "front" : "back"));

/** 錨形件累計擺動 v → 擺角 */
export const anchorAngle = (v) => swing(v, -SWING, SWING);
export const escapement = {
  ...escapeByContact({
    center: WHEEL.center,
    teeth: studs,
    layers,
    dir: -1,
    period: 4 * SWING,
    pitch: 2 * STEP,
    stops: (v) => [
      { poly: placePoly(B.poly, F, anchorAngle(v)), layer: "front" },
      { poly: placePoly(A.poly, F, anchorAngle(v)), layer: "back" },
    ],
  }),
  period: 4 * SWING,
};
/** 大輪轉角(順時針為負,由接觸算) */
export const wheelAngle = escapement.angle;

// 錨形件(相對 F):右臂(H → 折角 B)在前面接叉瓦 B,左臂 G 在後面接叉瓦 A
const end = (p) => {
  const a = p.psi - p.s * 0.12;
  return [p.L * Math.cos(a), p.L * Math.sin(a)];
};
const arm = (to, bend) => shape(thickLine([[0, 0], ...(bend ? [bend] : []), to], 0.14), [circle(0.06).reverse()]);

// 推斷的擺:擺桿與擺錘在夾板條後面,固定在錨形件軸的後端
const PENDULUM = { length: 6, z: -1.35, bob: 0.55 };
// 推斷的重錘驅動:鼓在大輪軸上、夾板條後面;繩從鼓的右側垂下吊重錘
const ROPE_R = 0.05;
const DRUM_R = 0.28;
const DRUM_Z = -1.7;
const DRUM = { center: [...WHEEL.center, DRUM_Z], axis: Z, radius: DRUM_R + ROPE_R, sense: -1 }; // 輪往前(順時針,繞 −z)轉時繩從鼓上放出
const REWIND = 12 * 4 * SWING; // 擺來回十二次(放走二十四根凸柱)上鍊一次
const WEIGHT = { radius: 0.32, height: 0.8 };
const hang = weightDrive({
  drum: DRUM,
  eye: [WHEEL.center[0] + DRUM.radius, -4.6, DRUM_Z],
  reserve: DRUM.radius * 12 * 2 * STEP,
  spare: 2 * Math.PI * DRUM.radius,
  pitch: 2.1 * ROPE_R,
});
const weightAt = rewound(hang, (v) => -wheelAngle(v), REWIND);
/** 重錘驅動的鼓與上鍊間隔(檢查用) */
export const WEIGHT_DRIVE = { drum: DRUM, every: REWIND };

export default {
  figure: 292,
  parts: [
    {
      id: "wheel",
      kind: "group",
      center: [...WHEEL.center, 0],
      spin: WHEEL.radius,
      pieces: [
        { kind: "plate", shape: shape(circle(WHEEL.radius), [circle(WHEEL.radius - 0.45).reverse()]), thickness: 0.18, circles: [WHEEL.radius - 0.08] },
        ...studs.map((s, i) => ({ kind: "cylinder", radius: STUD, length: 0.22, at: [RS * Math.cos(i * STEP), RS * Math.sin(i * STEP), i % 2 === 0 ? 0.2 : -0.2], accent: i === 0 })),
        ...Array.from({ length: 6 }, (_, i) => ({ kind: "box", size: [2 * WHEEL.radius - 0.6, 0.18, 0.12], angle: (i * Math.PI) / 6 })),
        { kind: "cylinder", radius: 0.3, length: 0.3 },
        { kind: "cylinder", radius: 0.1, length: 1.9, at: [0, 0, -0.95] }, // 輪軸,往後穿過夾板條到鼓
        { kind: "cylinder", radius: DRUM_R, length: 0.34, at: [0, 0, DRUM_Z] }, // 繞繩的鼓(推斷)
      ],
    },
    {
      id: "anchor",
      kind: "group",
      center: [...F, 0],
      arrow: false,
      label: "F",
      labelOffset: [0, 0.35, 0.4],
      pieces: [
        { kind: "plate", shape: arm(end(B), [1.3, -2.0]), thickness: 0.1, at: [0, 0, 0.4] }, // 右臂 H → 折角 B → 前叉瓦(在輪的前面)
        { kind: "plate", shape: shape(B.poly), thickness: 0.25, at: [0, 0, 0.225] }, // 前叉瓦 B,往前加厚到碰著右臂
        { kind: "plate", shape: arm(end(A), [-0.35, -2.0]), thickness: 0.1, at: [0, 0, -0.42] }, // 左臂 G → 後叉瓦(在輪的後面)
        { kind: "plate", shape: shape(A.poly), thickness: 0.27, at: [0, 0, -0.235] }, // 後叉瓦 A,往後加厚到碰著左臂
        { kind: "cylinder", radius: 0.32, inner: 0.1, length: 0.9 },
        { kind: "cylinder", radius: 0.1, length: 1.05, at: [0, 0, -0.925] }, // 錨形件的軸,往後穿過夾板條到擺
      ],
    },
    {
      id: "pendulum",
      kind: "group",
      center: [...F, 0],
      arrow: false,
      pieces: [
        { kind: "cylinder", radius: 0.22, length: 0.12, at: [0, 0, PENDULUM.z] }, // 轂,固定在錨形件的軸上
        { kind: "box", size: [0.12, PENDULUM.length, 0.06], at: [0, -PENDULUM.length / 2, PENDULUM.z] }, // 擺桿
        { kind: "cylinder", radius: PENDULUM.bob, length: 0.14, at: [0, -PENDULUM.length, PENDULUM.z] }, // 擺錘
      ],
    },
    { id: "frame", kind: "group", pieces: plateBar({ points: [WHEEL.center, F], z: -1.1, width: 0.36, boss: 0.3 }) },
    { id: "rope", kind: "rope", radius: ROPE_R },
    { id: "weight", kind: "weight", axis: Y, radius: WEIGHT.radius, height: WEIGHT.height },
    { id: "labelA", kind: "group", center: [...F, 0], label: "A", labelOffset: [end(A)[0] - 0.3, end(A)[1] - 0.3, 0.5] },
    { id: "labelB", kind: "group", center: [...F, 0], label: "B", labelOffset: [1.3 + 0.3, -2.0, 0.5] },
  ],
  // 動力重演:只推錨形件;大輪受固定的力矩(重錘;重錘與繩照模型的姿勢走)往順時針轉,前後凸柱交替地被叉瓦擋住、放行
  replay: {
    to: 8 * SWING,
    free: { wheel: { pivot: [...WHEEL.center, 0], spring: -1, gravity: false } },
    ignore: [["wheel", "frame"]], // 輪軸插在夾板條的孔裡(孔沒畫出來)
    expect: [
      { at: 2 * SWING, part: "wheel", label: "擺擺過一次,放走一根凸柱" },
      { at: 4 * SWING, part: "wheel", label: "擺一個來回,前後各放走一根" },
      { part: "wheel", label: "擺兩個來回,放走四根凸柱", quote: "凸柱以相同方式配置,交替地抵在前方與後方的叉瓦上" },
    ],
  },
  driver: { part: "anchor", type: "rotation", cycle: [-SWING, SWING], grips: ["pendulum"] },
  target: "wheel", // 大輪:擒縱讓它一根凸柱一根凸柱地放行
  view: { direction: [0.25, 0.12, 1], fit: ["anchor", "pendulum", "weight"] },
  pose(v) {
    const w = weightAt(v);
    return {
      parts: {
        anchor: { angle: anchorAngle(v) },
        pendulum: { angle: anchorAngle(v) },
        wheel: { angle: wheelAngle(v) },
        weight: { position: [w.eye[0], w.eye[1] - WEIGHT.height / 2 - WEIGHT.radius * 0.38, w.eye[2]] },
      },
      paths: { rope: { points: w.rope, closed: false, phase: 0 } },
      readouts: [],
    };
  },
};
