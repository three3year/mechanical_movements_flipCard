// 第 288 種:回退式擒縱(時鐘)。錨形件 H–L–K 由擺帶動,繞軸 a 擺動;兩端的叉瓦 H、K 之間是擒縱輪 A。
// 輪依原圖箭頭逆時針轉,齒從右邊的叉瓦 K 走向左邊的叉瓦 H。叉瓦的鎖面不與軸 a 同心:齒落到叉瓦上之後,
// 擺繼續外擺時叉瓦再伸進去,把輪往回推一點(回退);擺回來時齒滑過叉瓦尖端的斜面 c、e 與 d、b,給擺足夠的衝量。
// 擺每擺一次,輪轉過半個齒。主動件是錨形件(擺);目標件是擒縱輪 A——擒縱的目的是讓輪系一齒一齒地放行。
//
// 由接觸算:輪受重錘的固定力矩往逆時針轉,被叉瓦擋住就停、被叉瓦推就退;放開後加速轉到另一個叉瓦上
// (models/escapement.js 的 escapeByContact)。叉瓦依格拉漢式的作圖:樞軸 a 在兩個叉瓦處齒尖圓切線的交點。
// 推斷:擺幅、衝擊角、回退量、叉瓦的寬度;輪軸與錨形件的軸裝在後面的夾板條上(原圖沒畫)。
// 推斷的擺(原圖沒畫;原文「錨形件由擺的擺動所帶動,繞著軸 a 擺動」):擺桿裝在軸 a 的轂上、在錨形件前面一層往下伸過輪,
// 下端是擺錘;擺和錨形件是同一件,擺多少錨形件就擺多少。
// 推斷的驅動(原文沒說輪為什麼往前轉;共用 weight-drive.js,和第 234、238 種一樣):輪軸上、輪的後面有一個鼓,
// 繩從鼓頂往左拉到夾板條托臂上的滑輪,再垂下吊著重錘;重錘的重量就是讓輪逆時針轉的固定力矩,輪轉多少重錘降多少,
// 被叉瓦擋住時重錘也停、被推回(回退)時略升。擺八個來回(輪轉八齒)重錘捲回最高處一次(上鍊,畫面上一下子回到上面)。
// 字母:原文解說用的 H、K(叉瓦)與衝擊面兩端的 c、e(H)、d、b(K),照原圖 c、b 在叉瓦尖端(離軸 a 遠的那一端),跟著錨形件擺。
import { TAU, deg, swing, Y, Z } from "./kit.js";
import { anchorPallet, escapeByContact, placePoly, toothedWheel } from "./escapement.js";
import { weightDrive, rewound } from "./weight-drive.js";
import { shape, thickLine, circle } from "./shapes.js";
import { plateBar } from "./supports.js";

export const N = 30;
export const PITCH = TAU / N;
export const SWING = deg(5);
export const LIFT = deg(3);
const R = 2.2; // 齒尖圓
const ROOT = 1.78;
const A = [0, -1.6];
const SPAN = 3.75 * PITCH; // 叉瓦各在正上方左右 3.75 齒(兩叉瓦相隔 7.5 齒)
const AXIS = [A[0], A[1] + R / Math.cos(SPAN)];

// 齒:斜背從齒根升到齒尖,直面(逆時針那一側,轉動時在前)落回齒根
const WHEEL = toothedWheel({ teeth: N, profile: [[ROOT, 0], [R, 0.6], [R, 0.66], [ROOT, 0.74]] });
const pallet = (at) => anchorPallet({ P: AXIS, O: A, R, at, dir: 1, width: 0.17, lift: LIFT, recoil: 0.35, back: 0.14 });
const K = pallet(Math.PI / 2 - SPAN);
const H = pallet(Math.PI / 2 + SPAN);
// 叉瓦外端(繞 a)接上錨形件的臂
const tail = (p) => [p.L * Math.cos(p.psi - p.s * 0.07), p.L * Math.sin(p.psi - p.s * 0.07)];

/** 錨形件累計擺動 v → 擺角 */
export const anchorAngle = (v) => swing(v, -SWING, SWING);
export const escapement = {
  ...escapeByContact({ center: A, teeth: WHEEL.teeth, dir: 1, period: 4 * SWING, start: deg(1), stops: (v) => [K.poly, H.poly].map((p) => placePoly(p, AXIS, anchorAngle(v))) }),
  period: 4 * SWING,
};
/** 擒縱輪轉角(逆時針為正,由接觸算) */
export const wheelAngle = escapement.angle;

// 錨形件(相對軸 a):橫樑 L 與兩支往下的臂,臂在輪的前面一層,叉瓦伸到輪那一層
const arm = (p) => thickLine([[0, 0], [tail(p)[0] * 0.55, 0.15], tail(p)], 0.2);
const ROD = AXIS[1] - (A[1] - R) + 0.5; // 擺桿長(軸 a 到擺錘中心):伸過輪的下緣 0.5

// 衝擊面的兩端(錨形件局部座標):[離軸 a 遠的那一端(叉瓦尖端,原圖較低), 近的那一端];字母沿衝擊面往兩端外移,再往叉瓦的外側(遠離另一個叉瓦)移一點
const faceEnds = (p) => {
  const ends = [
    [p.lockR * Math.cos(p.psi - (p.s * LIFT) / 2), p.lockR * Math.sin(p.psi - (p.s * LIFT) / 2)],
    [p.otherR * Math.cos(p.psi + (p.s * LIFT) / 2), p.otherR * Math.sin(p.psi + (p.s * LIFT) / 2)],
  ];
  const d = (q) => Math.hypot(q[0], q[1]);
  return d(ends[0]) > d(ends[1]) ? ends : [ends[1], ends[0]];
};
const letterAt = (q, other, side) => {
  const n = Math.hypot(q[0] - other[0], q[1] - other[1]);
  return [q[0] + (0.16 * (q[0] - other[0])) / n + side * 0.12, q[1] + (0.16 * (q[1] - other[1])) / n];
};
const [H_FAR, H_NEAR] = faceEnds(H);
const [K_FAR, K_NEAR] = faceEnds(K);
const LETTERS = { labelc: letterAt(H_FAR, H_NEAR, -1), labele: letterAt(H_NEAR, H_FAR, -1), labelb: letterAt(K_FAR, K_NEAR, 1), labeld: letterAt(K_NEAR, K_FAR, 1) };

// 推斷的重錘驅動:鼓在輪的後面,繩從鼓頂往左拉到滑輪頂上,再垂下吊重錘(滑輪在輪緣外)
const ROPE_R = 0.045; // 繩的半徑(畫面上的繩粗)
const DRUM_R = 0.3;
const DRUM = { center: [...A, -0.28], axis: Z, radius: DRUM_R + ROPE_R, sense: 1 }; // 輪往前(逆時針)轉時繩從鼓上放出
const PULLEY_R = 0.15;
const PULLEY = { center: [-2.6, A[1] + DRUM.radius - PULLEY_R - ROPE_R, DRUM.center[2]], axis: Z, radius: PULLEY_R + ROPE_R, sense: -1 };
const REWIND = 8 * 4 * SWING; // 擺八個來回(輪轉八齒)上鍊一次
const WEIGHT = { radius: 0.22, height: 0.6 };
const hang = weightDrive({
  drum: DRUM,
  pulleys: [PULLEY],
  eye: [PULLEY.center[0] - PULLEY.radius, A[1] - 0.7, PULLEY.center[2]],
  reserve: DRUM.radius * 8 * PITCH,
  spare: TAU * DRUM.radius,
  pitch: 2 * ROPE_R,
});
const weightAt = rewound(hang, wheelAngle, REWIND);
export const geometry = { DRUM, REWIND };

export default {
  figure: 288,
  parts: [
    {
      id: "wheelA",
      kind: "group",
      center: [...A, 0],
      spin: R,
      spinOffset: 0.4, // 轉向箭頭放在擺桿與錨形件的臂前面
      label: "A",
      labelOffset: [0.3, -0.15, 0.3],
      pieces: [
        { kind: "plate", shape: shape(WHEEL.outline, [circle(ROOT - 0.18).reverse()]), thickness: 0.12 },
        // 輪輻伸進輪緣(輪緣的孔半徑 ROOT − 0.18)
        ...Array.from({ length: 4 }, (_, i) => ({ kind: "box", size: [2 * (ROOT - 0.13), 0.1, 0.1], angle: (i * Math.PI) / 4 + 0.3 })),
        { kind: "cylinder", radius: 0.2, length: 0.2 },
        { kind: "cylinder", radius: 0.07, length: 0.56, at: [0, 0, -0.3] }, // 輪軸,往後伸進夾板條
        { kind: "cylinder", radius: DRUM_R, length: 0.24, at: [0, 0, -0.22] }, // 繞繩的鼓(推斷),在輪的後面、套在輪軸上
        { kind: "box", size: [0.16, 0.16, 0.16], at: [ROOT - 0.09, 0, 0.1], accent: true }, // 標記方塊,裝在輪緣上
      ],
    },
    {
      id: "anchor",
      kind: "group",
      center: [...AXIS, 0],
      arrow: false,
      label: "L",
      labelOffset: [0, 0.4, 0.3],
      pieces: [
        { kind: "plate", shape: shape(arm(K)), thickness: 0.1, at: [0, 0, 0.17] },
        { kind: "plate", shape: shape(arm(H)), thickness: 0.1, at: [0, 0, 0.17] },
        { kind: "plate", shape: shape(K.poly), thickness: 0.32, at: [0, 0, 0.06] },
        { kind: "plate", shape: shape(H.poly), thickness: 0.32, at: [0, 0, 0.06] },
        { kind: "cylinder", radius: 0.18, inner: 0.07, length: 0.14, at: [0, 0, 0.17] },
        { kind: "cylinder", radius: 0.07, length: 0.7, at: [0, 0, -0.17] }, // 錨形件的軸,往後伸進夾板條
        // 推斷的擺:擺桿從軸 a 的轂往下(在錨形件與輪的前面一層),下端的擺錘在輪的下方
        { kind: "box", size: [0.08, ROD, 0.08], at: [0, -ROD / 2, 0.27] },
        { kind: "cylinder", radius: 0.38, length: 0.12, at: [0, -ROD, 0.27] },
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        ...plateBar({ points: [A, AXIS], z: -0.48 }),
        // 夾板條伸出的托臂與滑輪的軸(推斷)
        { kind: "box", size: [-PULLEY.center[0] + 0.04, 0.1, 0.1], at: [(PULLEY.center[0] - 0.04) / 2, PULLEY.center[1], -0.48] },
        { kind: "cylinder", radius: 0.04, length: 0.26, at: [PULLEY.center[0], PULLEY.center[1], -0.38] },
      ],
    },
    { id: "pulley", kind: "pulley", style: "disc", center: PULLEY.center, axis: Z, radius: PULLEY_R, width: 0.1, arrow: false },
    { id: "rope", kind: "rope", radius: ROPE_R },
    { id: "weight", kind: "weight", axis: Y, radius: WEIGHT.radius, height: WEIGHT.height },
    { id: "labelA", kind: "group", center: [...AXIS, 0], label: "a", labelOffset: [0.32, -0.22, 0.4] },
    { id: "labelH", kind: "group", center: [...AXIS, 0], label: "H", labelOffset: [tail(H)[0] - 0.35, tail(H)[1] + 0.2, 0.3] },
    { id: "labelK", kind: "group", center: [...AXIS, 0], label: "K", labelOffset: [tail(K)[0] + 0.35, tail(K)[1] + 0.2, 0.3] },
    ...Object.keys(LETTERS).map((id) => ({ id, kind: "group", center: [...AXIS, 0], label: id.slice(5), labelOffset: [0, 0, 0.3] })),
  ],
  // 動力重演:只推錨形件(連同擺);擒縱輪受重錘的固定力矩往逆時針轉(以彈簧代替;重錘、滑輪照模型的姿勢走),由叉瓦擋住、推回、放行
  replay: {
    to: 8 * SWING,
    free: { wheelA: { pivot: [...A, 0], spring: 1, gravity: false } },
    ignore: [["wheelA", "frame"]], // 輪軸插在夾板條的孔裡(孔沒畫出來)
    expect: [
      { at: 2 * SWING, part: "wheelA", label: "擺擺過一次,輪轉過半個齒", quote: "擺每次擺動,齒的末端會沿著表面 c、e 和 d、b 滑動" },
      { at: 4 * SWING, part: "wheelA", label: "擺一個來回,輪轉過一個齒" },
      { part: "wheelA", label: "擺兩個來回,輪轉過兩個齒" },
    ],
  },
  driver: { part: "anchor", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheelA", // 擒縱輪:擒縱讓它一齒一齒地放行
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const a = anchorAngle(v);
    const hung = weightAt(v);
    const eye = hung.eye;
    const letters = Object.fromEntries(Object.entries(LETTERS).map(([id, q]) => [id, { position: [...placePoly([q], AXIS, a)[0], 0] }]));
    return {
      parts: {
        anchor: { angle: a },
        wheelA: { angle: wheelAngle(v) },
        pulley: { angle: hung.pulleys[0] },
        weight: { position: [eye[0], eye[1] - WEIGHT.height / 2 - WEIGHT.radius * 0.38, eye[2]] },
        ...letters,
      },
      paths: { rope: { points: hung.rope, closed: false, phase: 0 } },
      readouts: [],
    };
  },
};
