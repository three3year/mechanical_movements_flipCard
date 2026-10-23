// 第 303 種:靜擊式擺式擒縱。錨形件繞上方的軸 C 擺動,由擺(PEN.,下端 F)帶動;擒縱叉瓦 E 的內側面與 D 的外側面
// 都與錨形件的擺動軸同心,所以齒抵住叉瓦時輪不會回退,只有滑過衝擊面時才前進。擺每擺一次,擒縱輪轉過半個齒
// (原圖輪上方的箭頭朝右:順時針)。主動件是擺(連同錨形件);目標件是擒縱輪(擒縱讓它一齒一齒地放行)。
//
// 由接觸算(models/escapement.js 的 escapeByContact、anchorPallet,與第 289 種相同的作法):輪受重錘的固定力矩
// 順時針轉,被叉瓦擋住就停,放開後加速轉到另一個叉瓦的鎖面上。軸 C 在兩個叉瓦處齒尖圓切線的交點。
// 順時針轉時齒從左邊的 D 走向右邊的 E:D 擋住朝 C 走來的齒(鎖在外側面)、E 擋住背著 C 走的齒(鎖在內側面),與原文相符。
// 輪照 525 px 原圖:沿半徑取樣量得齒距約 14.9°,取 24 齒;齒短(齒高約齒尖半徑的 16%,原圖 14%);輪輻是十字的兩根直條,伸進輪緣。
// 兩叉瓦相隔 6.5 齒,切線作圖下 C 在輪心上方約 1.52 倍齒尖半徑(原圖約 1.58)。
// 推斷:擺幅、衝擊角、叉瓦的寬度;輪軸與軸 C 裝在後面的夾板條上(原圖沒畫)。擺桿 PEN. 在輪的前面一層(原圖也是),
// 上端接在 C 的轂上。
// 推斷的驅動(原文沒說輪為什麼往前轉;共用 weight-drive.js,和第 289 種一樣):輪軸上、輪的後面有一個鼓,
// 繩從鼓頂往右拉到夾板條托臂上的滑輪,再垂下吊著重錘;重錘的重量就是讓輪順時針轉的固定力矩,輪轉多少重錘降多少,
// 被叉瓦擋住時重錘也停。擺八個來回(輪轉八齒)重錘捲回最高處一次(上鍊,畫面上一下子回到上面)。
import { TAU, deg, swing, Y, Z } from "./kit.js";
import { weightDrive, rewound } from "./weight-drive.js";
import { anchorPallet, escapeByContact, placePoly, toothedWheel } from "./escapement.js";
import { shape, circle, arcPoints } from "./shapes.js";
import { plateBar } from "./supports.js";

export const N = 24;
export const PITCH = TAU / N;
export const SWING = deg(4);
export const LIFT = deg(2.5);
const WHEEL = [0.15, -0.2];
const RW = 1.55;
const ROOT = 1.3; // 齒高約齒尖半徑的 16%(原圖齒根約 120 px、齒尖約 140 px,14%)
const HOLE = ROOT - 0.15; // 輪緣的內緣
const SPAN = 3.25 * PITCH; // 兩叉瓦相隔 6.5 齒
const C = [WHEEL[0], WHEEL[1] + RW / Math.cos(SPAN)];

// 順時針轉:前面(角度小的一側)往前傾
const TEETH = toothedWheel({ teeth: N, profile: [[ROOT, 0.6], [RW, 0.35], [RW, 0.5], [ROOT, 0.9]] }); // 齒短而鈍(原圖的齒像斜頂的短柱)
const pallet = (at) => anchorPallet({ P: C, O: WHEEL, R: RW, at, dir: -1, width: 0.09, lift: LIFT, back: 0.13, lock: deg(1.2) });
const D = pallet(Math.PI / 2 + SPAN); // 左
const E = pallet(Math.PI / 2 - SPAN); // 右
const tail = (p) => [p.L * Math.cos(p.psi - p.s * 0.08), p.L * Math.sin(p.psi - p.s * 0.08)];

/** 擺累計擺動 v → 擺角 */
export const pendulumAngle = (v) => swing(v, -SWING, SWING);
export const escapement = {
  ...escapeByContact({ center: WHEEL, teeth: TEETH.teeth, dir: -1, period: 4 * SWING, stops: (v) => [D.poly, E.poly].map((p) => placePoly(p, C, pendulumAngle(v))) }),
  period: 4 * SWING,
};

/** 擺累計擺動 v → 擺角、擒縱輪轉角(順時針為負,由接觸算) */
export function deadbeat(v) {
  return { pendulum: pendulumAngle(v), wheel: escapement.angle(v) };
}

// 推斷的重錘驅動:鼓在輪的後面,繩從鼓頂往右拉到滑輪頂上,再垂下吊重錘(滑輪在齒尖圓外)
const ROPE_R = 0.04; // 繩的半徑(畫面上的繩粗)
const DRUM_R = 0.2;
const DRUM = { center: [...WHEEL, -0.25], axis: Z, radius: DRUM_R + ROPE_R, sense: -1 }; // 輪往前(順時針,繞 −z)轉時繩從鼓上放出
const PULLEY_R = 0.14;
const PULLEY = { center: [WHEEL[0] + 2.1, WHEEL[1] + DRUM.radius - PULLEY_R - ROPE_R, DRUM.center[2]], axis: Z, radius: PULLEY_R + ROPE_R, sense: 1 };
const REWIND = 8 * 4 * SWING; // 擺八個來回(輪轉八齒)上鍊一次
const WEIGHT = { radius: 0.15, height: 0.4 };
const hang = weightDrive({
  drum: DRUM,
  pulleys: [PULLEY],
  eye: [PULLEY.center[0] + PULLEY.radius, WHEEL[1] - 0.7, PULLEY.center[2]],
  reserve: DRUM.radius * 8 * PITCH,
  spare: TAU * DRUM.radius,
  pitch: 2 * ROPE_R,
});
const weightAt = rewound(hang, (v) => -escapement.angle(v), REWIND);
export const geometry = { DRUM, REWIND, RW, ROOT, C, WHEEL };

// 錨形件(相對 C):C 上的圓轂(半徑同轂筒 0.2)伸出兩條折臂,斜下到叉瓦 D、E。
// 折點兩側斜接,臂寬處處 0.2(thickLine 在折點取前後平均的切線、把臂收窄,C 上的軸孔就破到外形外)
const ARM_W = 0.2;
const BOSS = 0.2; // 圓轂半徑,同 C 上的轂筒
const bentArm = (end) => {
  const bend = [end[0] * 0.6, end[1] * 0.45];
  const unit = (a, b) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]); return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
  const [t1, t2] = [unit([0, 0], bend), unit(bend, end)];
  const [n1, n2] = [[-t1[1], t1[0]], [-t2[1], t2[0]]]; // 左側法線
  const k = ARM_W / 2 / (1 + n1[0] * n2[0] + n1[1] * n2[1]); // 斜接:折點偏移 h·(n1 + n2)/(1 + n1·n2)
  const miter = [(n1[0] + n2[0]) * k, (n1[1] + n2[1]) * k];
  const h = ARM_W / 2;
  return { angle: Math.atan2(t1[1], t1[0]), right: [[bend[0] - miter[0], bend[1] - miter[1]], [end[0] - h * n2[0], end[1] - h * n2[1]]], left: [[end[0] + h * n2[0], end[1] + h * n2[1]], [bend[0] + miter[0], bend[1] + miter[1]]] };
};
const anchorOutline = (() => {
  const open = Math.asin(ARM_W / 2 / BOSS); // 臂的一側在轂上張開的角
  const arms = [bentArm(tail(D)), bentArm(tail(E))].sort((a, b) => a.angle - b.angle);
  // 照 hubArms 的走法:沿臂的右側出去、繞過臂端、沿左側回到轂,再沿轂繞到下一條臂的右側根部
  return arms.flatMap((arm, i) => {
    const next = arms[(i + 1) % arms.length].angle + (i + 1 === arms.length ? TAU : 0);
    return [...arm.right, ...arm.left, ...arcPoints(BOSS, arm.angle + open, next - open)];
  });
})();
const anchor = shape(anchorOutline, [circle(0.09).reverse()]);
const ROD = 4.6; // 擺桿長(C 到 F)

export default {
  figure: 303,
  parts: [
    {
      id: "wheel",
      kind: "group",
      center: [...WHEEL, 0],
      spin: RW,
      pieces: [
        { kind: "plate", shape: shape(TEETH.outline, [circle(HOLE).reverse()]), thickness: 0.12 },
        // 十字的兩根輪輻(照原圖斜放),伸進輪緣
        ...[0, 1].map((i) => ({ kind: "box", size: [2 * (HOLE + 0.06), 0.12, 0.1], angle: deg(40) + (i * Math.PI) / 2 })),
        { kind: "cylinder", radius: 0.2, length: 0.2 },
        { kind: "cylinder", radius: 0.07, length: 0.56, at: [0, 0, -0.3] }, // 輪軸,往後伸進夾板條
        { kind: "cylinder", radius: DRUM_R, length: 0.2, at: [0, 0, DRUM.center[2]] }, // 繞繩的鼓(推斷),在輪的後面、套在輪軸上
        { kind: "box", size: [0.12, 0.12, 0.14], at: [ROOT - 0.075, 0, 0.08], accent: true }, // 標記方塊,裝在輪緣上
      ],
    },
    {
      id: "anchor",
      kind: "group",
      center: [...C, 0],
      arrow: false,
      pieces: [
        { kind: "plate", shape: anchor, thickness: 0.1, at: [0, 0, 0.18] },
        { kind: "plate", shape: shape(D.poly), thickness: 0.32, at: [0, 0, 0.07] },
        { kind: "plate", shape: shape(E.poly), thickness: 0.32, at: [0, 0, 0.07] },
        { kind: "cylinder", radius: BOSS, inner: 0.09, length: 0.14, at: [0, 0, 0.18] }, // 轂筒,和錨形件的圓轂同半徑
        { kind: "cylinder", radius: 0.09, length: 0.7, at: [0, 0, -0.17] }, // 軸 C,往後伸進夾板條
        // 擺桿 PEN.,下端 F(在輪的前面一層,上端接在 C 的轂上)
        { kind: "box", size: [0.08, ROD, 0.06], at: [0, -ROD / 2, 0.27] },
        { kind: "cylinder", radius: 0.12, length: 0.12, at: [0, -ROD, 0.27] },
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        ...plateBar({ points: [WHEEL, C], z: -0.48 }),
        // 夾板條伸出的托臂與滑輪的軸(推斷)
        { kind: "box", size: [PULLEY.center[0] - WHEEL[0] + 0.04, 0.1, 0.1], at: [(PULLEY.center[0] + WHEEL[0] + 0.04) / 2, PULLEY.center[1], -0.48] },
        { kind: "cylinder", radius: 0.035, length: 0.26, at: [PULLEY.center[0], PULLEY.center[1], -0.38] },
      ],
    },
    { id: "pulley", kind: "pulley", style: "disc", center: PULLEY.center, axis: Z, radius: PULLEY_R, width: 0.1, arrow: false },
    { id: "rope", kind: "rope", radius: ROPE_R },
    { id: "weight", kind: "weight", axis: Y, radius: WEIGHT.radius, height: WEIGHT.height },
    { id: "labelC", kind: "group", center: [...C, 0], label: "C", labelOffset: [0, 0.32, 0.3] },
    { id: "labelD", kind: "group", center: [...C, 0], label: "D", labelOffset: [tail(D)[0] - 0.3, tail(D)[1] + 0.15, 0.3] },
    { id: "labelE", kind: "group", center: [...C, 0], label: "E", labelOffset: [tail(E)[0] + 0.3, tail(E)[1] + 0.15, 0.3] },
    { id: "labelF", kind: "group", center: [C[0], C[1] - ROD, 0], label: "F", labelOffset: [0.3, 0, 0.3] },
  ],
  // 動力重演:只推擺;擒縱輪受重錘的固定力矩順時針轉(以彈簧代替;重錘、滑輪照模型的姿勢走),由叉瓦擋住、放行
  replay: {
    to: 8 * SWING,
    free: { wheel: { pivot: [...WHEEL, 0], spring: -1, gravity: false } },
    ignore: [["wheel", "frame"]], // 輪軸插在夾板條的孔裡(孔沒畫出來)
    expect: [
      { at: 2 * SWING, part: "wheel", label: "擺擺過一次,輪轉過半個齒" },
      { at: 4 * SWING, part: "wheel", label: "擺一個來回,輪轉過一個齒" },
      { part: "wheel", label: "擺兩個來回,輪轉過兩個齒", quote: "皆與擒縱叉瓦擺動所繞的軸同心,因此不會產生回退" },
    ],
  },
  driver: { part: "anchor", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheel", // 擒縱輪:擒縱讓它一齒一齒地放行
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const d = deadbeat(v);
    const hung = weightAt(v);
    const eye = hung.eye;
    return {
      parts: {
        anchor: { angle: d.pendulum },
        wheel: { angle: d.wheel },
        pulley: { angle: hung.pulleys[0] },
        weight: { position: [eye[0], eye[1] - WEIGHT.height / 2 - WEIGHT.radius * 0.38, eye[2]] },
      },
      paths: { rope: { points: hung.rope, closed: false, phase: 0 } },
      readouts: [],
    };
  },
};
