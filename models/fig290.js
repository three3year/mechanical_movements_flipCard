// 第 290 種:另一種擺式擒縱。擒縱輪 D 在一個圓環形框架的中間;框架從上端 C 吊著,下端 K 接著擺,
// 環的內側左右各有一個叉瓦 B、A。框架隨擺左右擺動,兩個叉瓦輪流擋住、放開輪的齒(E、H 是其中兩個齒),
// 擺每擺一次,輪轉過半個齒。主動件是框架(擺);目標件是擒縱輪 D(擒縱讓輪系一齒一齒地放行)。
//
// 由接觸算(models/escapement.js 的 escapeByContact):輪受重錘的固定力矩往順時針轉(原圖輪上方的箭頭朝右;
// 以前的模型是逆時針,已更正),齒的直面抵在叉瓦上就停;框架往右擺時叉瓦 A 往外退,齒從 A 的內端滑脫,
// 輪加速轉到下一個齒碰上已經伸進來的 B 為止;往左擺時反過來。叉瓦隨框架繞 C 擺,擋住齒的面會跟著微微升降,
// 所以鎖住時輪也會被推回一點(這種擒縱的叉瓦面不與 C 同心)。
// 兩個叉瓦伸進輪裡的那一端,在齒背那一側順著齒背的斜度倒角(B 的上內角、A 的下內角;原圖叉瓦是方的,推斷):
// 不倒角時,框架往右擺、A 抬著齒往回推(回退)的那一刻,剛伸進來的 B 的上內角已經頂在上一齒的齒背上,
// 輪前後都被擋住,只能被 A 擠過去,一步往前跳 15°(以前把字母 E、H 這一跳說成「落下時齒走得快」,不對)。
// 倒角後 B 碰不到齒背,齒從 A 的內端滑脫後才從靜止加速轉到 B 上。
// 推斷:齒數(依原圖七齒)、齒形(原圖的鋸齒輪,直面略往前勾);擺幅;輪軸與 C 的樞軸裝在後面的夾板條上(原圖沒畫)。
// 推斷的驅動(原文只有一句,沒說輪為什麼往前轉;共用 weight-drive.js,和第 234、238 種一樣):輪軸上、輪的後面有一個鼓,
// 繩從鼓頂往右拉到夾板條托臂上的滑輪,再垂下吊著重錘;重錘的重量就是讓輪順時針轉的固定力矩,輪轉多少重錘降多少,
// 被叉瓦擋住時重錘也停、被推回時略升。框架擺四個來回(輪轉四齒)重錘捲回最高處一次(上鍊,畫面上一下子回到上面)。
import { TAU, deg, swing, Y, Z } from "./kit.js";
import { escapeByContact, placePoly, toothedWheel } from "./escapement.js";
import { weightDrive, rewound } from "./weight-drive.js";
import { shape, circle, rect } from "./shapes.js";
import { plateBar } from "./supports.js";

export const N = 7;
export const PITCH = TAU / N;
export const SWING = deg(5);
const C = [0, 2.3];
const D = [0, 0];
const R = 0.78;
const ROOT = 0.5;

// 鋸齒:直面在前(順時針轉時在前,角度小的一側),齒尖略往前勾;斜背往後降到下一齒的齒根
const WHEEL = toothedWheel({ teeth: N, profile: [[ROOT, 0.05], [R, 0], [R, 0.06], [ROOT, 1.0]], bore: 0.08 });

// 框架(相對 C):直桿往下到圓環,圓環內左右兩個叉瓦,再往下接擺桿
const RING = { y: D[1] - C[1], outer: 1.2, inner: 1.03 };
// 兩個叉瓦一起往上移 0.055:框架繞 C 擺,叉瓦在擺到兩端時一高一低,不移的話齒停在 A、B 的位置相差 0.28 / 0.72 個齒距;
// 移了之後每擺一次約放走半齒(0.44 / 0.56),再多移就卡住
const DY = 0.055;
// 叉瓦寬 0.32(從環往內伸到離輪心 0.73)、高 0.14;伸進輪的那一端在齒背那一側倒角 0.03 × 0.06(順著齒背的斜度)
const CUT = [0.03, 0.06];
const palletA = (cy) => [[0.73 + CUT[0], cy - 0.07], [1.05, cy - 0.07], [1.05, cy + 0.07], [0.73, cy + 0.07], [0.73, cy - 0.07 + CUT[1]]];
const palletB = (cy) => [[-1.05, cy - 0.07], [-0.73, cy - 0.07], [-0.73, cy + 0.07 - CUT[1]], [-0.73 - CUT[0], cy + 0.07], [-1.05, cy + 0.07]];
const PALLET_A = palletA(RING.y - 0.07 + DY); // 右:上面擋住往下走的齒,下內角倒角
const PALLET_B = palletB(RING.y + 0.07 + DY); // 左:下面擋住往上走的齒,上內角倒角

/** 框架累計擺動 v → 擺角 */
export const frameAngle = (v) => swing(v, -SWING, SWING);
export const escapement = {
  ...escapeByContact({ center: D, teeth: WHEEL.teeth, dir: -1, period: 4 * SWING, stops: (v) => [PALLET_A, PALLET_B].map((p) => placePoly(p, C, frameAngle(v))) }),
  period: 4 * SWING,
};
/** 擒縱輪轉角(順時針為負,由接觸算) */
export const wheelAngle = escapement.angle;

// 推斷的重錘驅動:鼓在輪的後面,繩從鼓頂往右拉到滑輪頂上,再垂下吊重錘(滑輪在環的右外側,框架擺到右端也碰不到)
const ROPE_R = 0.04; // 繩的半徑(畫面上的繩粗)
const DRUM_R = 0.16;
const DRUM = { center: [...D, -0.29], axis: Z, radius: DRUM_R + ROPE_R, sense: -1 }; // 輪往前(順時針)轉時繩從鼓上放出
const PULLEY_R = 0.13;
const PULLEY = { center: [1.75, D[1] + DRUM.radius - PULLEY_R - ROPE_R, DRUM.center[2]], axis: Z, radius: PULLEY_R + ROPE_R, sense: 1 };
const REWIND = 4 * 4 * SWING; // 框架擺四個來回(輪轉四齒)上鍊一次
const WEIGHT = { radius: 0.15, height: 0.4 };
const hang = weightDrive({
  drum: DRUM,
  pulleys: [PULLEY],
  eye: [PULLEY.center[0] + PULLEY.radius, -0.5, PULLEY.center[2]],
  reserve: DRUM.radius * 4 * PITCH,
  spare: TAU * DRUM.radius,
  pitch: 2 * ROPE_R,
});
const weightAt = rewound(hang, (v) => -wheelAngle(v), REWIND); // 輪往前(順時針)轉的角度
export const geometry = { DRUM, REWIND };
// 原圖的字母 E、H 標在兩個齒上:取起始姿勢時離原圖位置最近的齒,字母跟著那一齒走
const tipAt = (i, w) => [0.85 * R * Math.cos((i + 0.03) * PITCH + w), 0.85 * R * Math.sin((i + 0.03) * PITCH + w), 0];
const nearestTooth = (a) => {
  let best = 0;
  for (let i = 1; i < N; i++) {
    const d = (j) => Math.abs(Math.atan2(Math.sin((j + 0.03) * PITCH + wheelAngle(0) - a), Math.cos((j + 0.03) * PITCH + wheelAngle(0) - a)));
    if (d(i) < d(best)) best = i;
  }
  return best;
};
const TOOTH_E = nearestTooth(deg(29));
const TOOTH_H = nearestTooth(deg(-123));

const frame = [
  { kind: "plate", shape: shape(circle(RING.outer), [circle(RING.inner).reverse()]), thickness: 0.14, at: [0, RING.y, 0] },
  { kind: "plate", shape: shape(rect(0.14, 1.12, 0, -0.56)), thickness: 0.14 },
  { kind: "plate", shape: shape(rect(0.14, 1.5, 0, RING.y - RING.outer - 0.75)), thickness: 0.14 },
  { kind: "plate", shape: shape(PALLET_A), thickness: 0.22 },
  { kind: "plate", shape: shape(PALLET_B), thickness: 0.22 },
  { kind: "cylinder", radius: 0.12, inner: 0.05, length: 0.3 },
  { kind: "cylinder", radius: 0.05, length: 0.6, at: [0, 0, -0.3] }, // C 的樞軸,往後伸進夾板條
];

export default {
  figure: 290,
  parts: [
    {
      id: "wheelD",
      kind: "group",
      spin: R,
      label: "D",
      labelOffset: [0.12, -0.12, 0.3],
      pieces: [
        { kind: "plate", shape: { outline: WHEEL.outline, holes: WHEEL.holes }, thickness: 0.16 },
        { kind: "cylinder", radius: 0.16, length: 0.24 },
        { kind: "cylinder", radius: 0.05, length: 0.5, at: [0, 0, -0.25] }, // 輪軸,往後伸進夾板條
        { kind: "cylinder", radius: 0.05, length: 0.2, at: [0.3, 0, 0.06], accent: true },
        { kind: "cylinder", radius: DRUM_R, length: 0.22, at: [0, 0, -0.235] }, // 繞繩的鼓(推斷),在輪的後面、套在輪軸上
      ],
    },
    { id: "frame", kind: "group", center: [...C, 0], arrow: false, label: "C", labelOffset: [0.25, -0.3, 0.3], pieces: frame },
    {
      id: "plate",
      kind: "group",
      pieces: [
        ...plateBar({ points: [D, C], z: -0.45, width: 0.2, boss: 0.14 }),
        // 夾板條伸出的托臂與滑輪的軸(推斷)
        { kind: "box", size: [PULLEY.center[0] + 0.04, 0.1, 0.1], at: [(PULLEY.center[0] + 0.04) / 2, PULLEY.center[1], -0.45] },
        { kind: "cylinder", radius: 0.035, length: 0.26, at: [PULLEY.center[0], PULLEY.center[1], -0.36] },
      ],
    },
    { id: "pulley", kind: "pulley", style: "disc", center: PULLEY.center, axis: Z, radius: PULLEY_R, width: 0.1, arrow: false },
    { id: "rope", kind: "rope", radius: ROPE_R },
    { id: "weight", kind: "weight", axis: Y, radius: WEIGHT.radius, height: WEIGHT.height },
    { id: "labelA", kind: "group", center: [0.9, 0.14, 0], label: "A", labelOffset: [0.15, 0.1, 0.3] },
    { id: "labelB", kind: "group", center: [-0.9, -0.14, 0], label: "B", labelOffset: [-0.15, 0.1, 0.3] },
    { id: "labelK", kind: "group", center: [0, -1.55, 0], label: "K", labelOffset: [0.25, 0, 0.3] },
    { id: "labelE", kind: "group", label: "E", labelOffset: [0, 0, 0.3] },
    { id: "labelH", kind: "group", label: "H", labelOffset: [0, 0, 0.3] },
  ],
  // 動力重演:只推框架;擒縱輪受重錘的固定力矩往順時針轉(以彈簧代替;重錘、滑輪照模型的姿勢走),由叉瓦擋住、放行
  replay: {
    to: 8 * SWING,
    free: { wheelD: { pivot: [...D, 0], spring: -1, gravity: false } },
    ignore: [["wheelD", "plate"]], // 輪軸插在夾板條的孔裡(孔沒畫出來)
    expect: [
      { at: 2 * SWING, part: "wheelD", label: "框架擺過一次,輪轉過半個齒" },
      { at: 4 * SWING, part: "wheelD", label: "框架一個來回,輪轉過一個齒" },
      { part: "wheelD", label: "框架兩個來回,輪轉過兩個齒" },
    ],
  },
  driver: { part: "frame", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheelD", // 擒縱輪:擒縱讓它一齒一齒地放行
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const w = wheelAngle(v);
    const hung = weightAt(v);
    const eye = hung.eye;
    return {
      parts: {
        frame: { angle: frameAngle(v) },
        wheelD: { angle: w },
        labelE: { position: tipAt(TOOTH_E, w) },
        labelH: { position: tipAt(TOOTH_H, w) },
        pulley: { angle: hung.pulleys[0] },
        weight: { position: [eye[0], eye[1] - WEIGHT.height / 2 - WEIGHT.radius * 0.38, eye[2]] },
      },
      paths: { rope: { points: hung.rope, closed: false, phase: 0 } },
      readouts: [],
    };
  },
};
