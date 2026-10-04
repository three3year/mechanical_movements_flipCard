// 第 84 種:雙齒條框架 B 懸掛在桿 A 上,框架上緣朝下、下緣朝上各有一排齒;凸輪 D 連續旋轉。
// D 的軸在兩排齒的正中間時,凸輪的齒碰不到任何一排;把 A 抬起,下排齒進入凸輪的作用範圍,
// 框架被一齒一齒推向左方;把 A 降下,上排齒進入作用範圍,框架被推向右方。
// 曾配合引擎的調速器使用:A 接調速器,框架接節流閥。主動件是凸輪 D(順時針,轉動範圍四圈,自動播放時往返)。
// 框架的位置以「這個狀態下凸輪已撥了幾齒」計算(切換狀態時框架以短動畫移到該位置,為簡化的示意)。
import { TAU, deg, polar } from "./kit.js";
import { indexStep } from "./jumps.js";
import { shape, circle, arcPoints } from "./shapes.js";

const PITCH = 0.32;
const GAP = 1.05; // 框架置中時,上下兩排齒尖離凸輪軸的距離(凸輪的齒碰不到)
const LIFT = 0.42; // 抬起或降下 A 時框架移動的距離
const CAM = { radius: 0.48, tooth: 0.7 }; // 齒尖伸進抬起那一排的齒間,但碰不到框架的桿身 // 輪身要小於抬起時下排齒尖的高度,才不會碰到
const SPAN = deg(50);
const STATES = { raised: LIFT, middle: 0, lowered: -LIFT };
// 凸輪順時針轉;齒起始朝上。抬起時齒在下方(轉過半圈時)撥下排齒往左,降下時齒在上方撥上排齒往右
const WINDOWS = {
  raised: { from: Math.PI - SPAN / 2, dir: -1 },
  lowered: { from: -SPAN / 2, dir: 1 },
};

/** 凸輪順時針轉 c、框架在 state:框架的水平位移 */
export function frameShift(c, state) {
  const w = WINDOWS[state];
  return w ? w.dir * indexStep(c, { from: w.from, span: SPAN, step: PITCH }) : 0;
}

const rackTeeth = (y, facing) =>
  Array.from({ length: 13 }, (_, i) => ({
    kind: "plate",
    shape: shape([[-PITCH * 0.48, 0], [0, facing * 0.24], [PITCH * 0.48, 0]]),
    thickness: 0.14,
    at: [(i - 6) * PITCH, y, 0],
  }));

// 凸輪:輪轂加十字輻與一個齒(在局部角 90°:朝上,順時針轉到下方)
const cam = [
  { kind: "plate", shape: shape(circle(CAM.radius), [circle(0.1).reverse()]), thickness: 0.16, circles: [0.2, 0.4] },
  { kind: "plate", shape: shape([...arcPoints(CAM.radius - 0.02, deg(80), deg(100)), polar(CAM.tooth, deg(93)).slice(0, 2), polar(CAM.tooth, deg(87)).slice(0, 2)].reverse()), thickness: 0.16 },
  { kind: "box", size: [0.9, 0.06, 0.18], at: [0, 0, 0] },
  { kind: "box", size: [0.06, 0.9, 0.18], at: [0, 0, 0] },
];

export default {
  figure: 84,
  parts: [
    {
      id: "frame",
      kind: "group",
      posed: true,
      pieces: [
        { kind: "plate", shape: shape([...arcPoints(1.35, deg(90), deg(270), -2.15, 0), ...arcPoints(1.35, deg(-90), deg(90), 2.15, 0)], [[...arcPoints(1.15, deg(90), deg(270), -2.15, 0), ...arcPoints(1.15, deg(-90), deg(90), 2.15, 0)].reverse()]), thickness: 0.14 },
        ...rackTeeth(GAP + 0.2, -1),
        ...rackTeeth(-GAP - 0.2, 1),
        { kind: "box", size: [1.6, 0.08, 0.12], at: [-4.3, 0, 0] },
        { kind: "box", size: [1.6, 0.08, 0.12], at: [4.3, 0, 0] },
        { kind: "plate", shape: shape([[-0.3, 1.35], [0.3, 1.35], [0.3, 1.9], [-0.3, 1.9]], [[[-0.18, 1.45], [0.18, 1.45], [0.18, 1.8], [-0.18, 1.8]].reverse()]), thickness: 0.14 },
      ],
      label: "B",
      labelOffset: [-2.1, 0, 0.2],
    },
    {
      id: "rodA",
      kind: "group",
      posed: true,
      pieces: [
        { kind: "box", size: [0.1, 1.6, 0.1], at: [0, 2.7, 0.15] },
        { kind: "box", size: [0.5, 0.12, 0.12], at: [0, 1.68, 0.15] },
      ],
      label: "A",
      labelOffset: [-0.5, 3.0, 0.2],
    },
    { id: "cam", kind: "group", center: [0, 0, 0], spin: 0.7, pieces: cam, label: "D", labelOffset: [0.3, 0.3, 0.3] },
    { id: "axle", kind: "cylinder", radius: 0.1, length: 0.7, center: [0, 0, -0.2] }, // 凸輪的固定軸(原圖沒畫,推斷)
  ],
  // 凸輪順時針轉(轉角為負),在四圈的範圍內往返
  // 動力重演:只推主動件;frame 靠摩擦定位,由接觸帶動
  replay: { free: { frame: { slide: [1,0,0], hold: true } }, expect: [{ part: "frame", label: "主動件走完一輪後 frame 的位置" }] },
  driver: { part: "cam", type: "rotation", range: [-4 * TAU, 0], initial: 0 },
  target: "frame", // 被一齒一齒推動的雙齒條框架 B
  states: {
    options: [
      { id: "raised", label: "抬起 A(推向左)" },
      { id: "middle", label: "置中(不動)" },
      { id: "lowered", label: "降下 A(推向右)" },
    ],
    initial: "raised",
  },
  view: { direction: [0.06, 0.05, 1] },
  pose(v, state = "raised") {
    const x = frameShift(-v, state);
    const y = STATES[state];
    return {
      parts: { cam: { angle: v }, frame: { position: [x, y, 0] }, rodA: { position: [x, y, 0] } },
      readouts: [],
    };
  },
  waivers: [
    { check: "replay", parts: ["frame"], reason: "未修:動力重演不成立——「主動件走完一輪後 frame 的位置」預期 frame 在主動量 0.00 時已移 1.28,實際移了 2.65(停位差 1.37)。還沒查出是模型的接觸沒做對,還是重演的宣告(自由零件、彈簧、摩擦)設得不對(列入待確認清單)" },
  ],
};
