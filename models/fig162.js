// 第 162 種:水車的調速器,原理與第 161 種相同。調速器由頂部的水平軸經斜齒輪帶動;心軸下部鬆套著兩個裝有凸柱的
// 斜齒輪,同咬左邊下方水平軸上的斜齒輪(它控制水車閘門的升降)。速度正常時兩個齒輪都靜止;
// 速度增加,球飛開、把套筒上的銷往上拉,銷碰到上齒輪的凸柱,上齒輪隨心軸轉,把下方水平軸往抬起閘門的方向轉;
// 速度太低時銷下降、帶動下齒輪,水平軸反向轉。主動件是虛擬的「進程」(水車已轉了多少);
// 速度是狀態(正常、過快、過慢),決定球的張角與哪個齒輪被帶動。
import { Y, X, TAU, deg } from "./kit.js";
import { flyBall } from "./governor.js";

const GOV = flyBall({ top: 2.9, arm: 1.95, at: 1.0, link: 1.25, ball: 0.4, range: [deg(16), deg(46)], below: true });
const ALPHA = { normal: deg(30), fast: deg(42), slow: deg(20) };
const RATIO = 1; // 下方兩斜齒輪與水平軸斜齒輪等大
const INPUT_Y = 0.25; // 心軸上固定的斜齒輪(由頂部水平軸帶動)
const UPPER_Y = -0.75; // 下部兩個鬆套的斜齒輪
const LOWER_Y = -1.75;

/** 進程 p(心軸轉的圈數)與速度狀態:心軸轉角、下方水平軸的轉角 */
export function regulator(p, state) {
  const spindle = TAU * p;
  const engaged = state === "fast" ? 1 : state === "slow" ? -1 : 0;
  return { spindle, gate: engaged * RATIO * spindle };
}

// 鬆套齒輪所在的群組以 Y 為軸(局部 Z 沿心軸),facing = −1 時錐頂朝下
const bevel = (z, facing) => ({ kind: "gear", teeth: 20, radius: 0.55, cone: deg(45), width: 0.18, axis: [0, 0, facing], at: [0, 0, z] });

export default {
  figure: 162,
  parts: [
    {
      id: "spindle",
      kind: "group",
      axis: Y,
      spin: 0.3,
      spinOffset: 1.5,
      pieces: [
        { kind: "cylinder", radius: 0.07, length: 5.6, at: [0, 0, 0.4] },
        { kind: "sphere", radius: 0.12, at: [0, 0, 3.3] },
        { kind: "gear", teeth: 20, radius: 0.55, cone: deg(45), width: 0.18, axis: [0, 0, -1], at: [0, 0, INPUT_Y] },
      ],
    },
    ...GOV.parts(),
    // 兩個鬆套的斜齒輪:上面的錐頂朝下、下面的錐頂朝上,中間夾著水平軸的斜齒輪;齒輪上的凸柱朝向套筒
    { id: "upperGear", kind: "group", center: [0, UPPER_Y, 0], axis: Y, spin: 0.55, pieces: [bevel(0, -1), { kind: "box", size: [0.1, 0.1, 0.25], at: [0.3, 0, 0.18] }] },
    { id: "lowerGear", kind: "group", center: [0, LOWER_Y, 0], axis: Y, spin: 0.55, pieces: [bevel(0, 1), { kind: "box", size: [0.1, 0.1, 0.25], at: [0.3, 0, -0.18] }] },
    {
      id: "inputShaft",
      kind: "group",
      axis: X,
      center: [-0.62, INPUT_Y - 0.62, 0],
      spin: 0.3,
      spinOffset: -1.2,
      pieces: [
        { kind: "gear", teeth: 20, radius: 0.55, cone: deg(45), width: 0.18, axis: [0, 0, 1], at: [0, 0, 0] },
        { kind: "cylinder", radius: 0.07, length: 2.0, at: [0, 0, -1.0] },
      ],
    },
    {
      id: "gateShaft",
      kind: "group",
      axis: X,
      center: [-0.62, (UPPER_Y + LOWER_Y) / 2, 0],
      spin: 0.3,
      spinOffset: -1.2,
      pieces: [
        { kind: "gear", teeth: 20, radius: 0.55, cone: deg(45), width: 0.18, axis: [0, 0, 1], at: [0, 0, 0] },
        { kind: "cylinder", radius: 0.07, length: 2.0, at: [0, 0, -1.0] },
      ],
    },
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.25 },
  target: "gateShaft",
  states: {
    options: [
      { id: "slow", label: "過慢" },
      { id: "normal", label: "正常" },
      { id: "fast", label: "過快" },
    ],
    initial: "normal",
  },
  view: { direction: [0.2, 0.08, 1] },
  pose(p, state = "normal") {
    const { spindle, gate } = regulator(p, state);
    const fast = state === "fast";
    const slow = state === "slow";
    return {
      parts: {
        spindle: { angle: spindle },
        inputShaft: { angle: -spindle },
        ...GOV.pose(ALPHA[state]),
        upperGear: { angle: fast ? spindle : 0 },
        lowerGear: { angle: slow ? -spindle : 0 },
        gateShaft: { angle: gate },
      },
      readouts: [],
    };
  },
};
