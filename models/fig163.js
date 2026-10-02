// 第 163 種:另一種水車調速器。調速器經曲柄槓桿撥動一條皮帶:心軸下端有三個皮帶輪,中間的鬆套在心軸上,
// 上下兩個固定在心軸上。速度正常時皮帶在鬆動輪上(原圖),不傳動;速度增加時套筒升高,曲柄槓桿把皮帶撥到下輪,
// 經齒輪把閘門抬起、減少水量;速度降低時把皮帶撥到上輪,產生相反的作用。
// 主動件是虛擬的「進程」;速度是狀態(過慢、正常、過快)。皮帶往右繞到閘門的齒輪(在畫面外,只畫出一段)。
import { Y, TAU, deg, routeBelt } from "./kit.js";
import { flyBall } from "./governor.js";
import { shape } from "./shapes.js";

const GOV = flyBall({ top: 3.0, arm: 1.95, at: 1.0, link: 1.2, ball: 0.42, range: [deg(16), deg(46)] });
const ALPHA = { slow: deg(20), normal: deg(31), fast: deg(42) };
const PULLEYS = { upper: -1.65, middle: -2.0, lower: -2.35 };
const BELT_ON = { slow: "upper", normal: "middle", fast: "lower" };
const R = 0.7;
const FAR = { x: 3.4, r: 0.4 };
const CRANK = { pivot: [1.2, -0.1, 0.3], arm: 1.05 };

/** 進程 p 與速度狀態:心軸轉角、皮帶的行進量(只在固定輪上才被帶動)與皮帶所在的高度 */
export function regulator(p, state) {
  const spindle = TAU * p;
  const on = BELT_ON[state];
  const driving = on !== "middle";
  return { spindle, travel: driving ? spindle * R : 0, y: PULLEYS[on], direction: on === "lower" ? 1 : on === "upper" ? -1 : 0 };
}

// 皮帶:從心軸上的輪繞到右邊遠處閘門齒輪軸上的輪(在水平面內,軸都直立)
const beltAt = (y) =>
  routeBelt([
    { center: [0, y, 0], axis: Y, radius: R, sense: 1 },
    { center: [FAR.x, y, 0], axis: Y, radius: FAR.r, sense: 1 },
  ]);

const pulley = (id, y, extra = {}) => ({ id, kind: "cylinder", axis: Y, center: [0, y, 0], radius: R, length: 0.3, mark: true, spin: R, ...extra });

export default {
  figure: 163,
  parts: [
    {
      id: "spindle",
      kind: "group",
      axis: Y,
      spin: 0.25,
      spinOffset: 1.0,
      pieces: [{ kind: "cylinder", radius: 0.07, length: 6.0, at: [0, 0, 0.2] }, { kind: "sphere", radius: 0.12, at: [0, 0, 3.3] }],
    },
    ...GOV.parts(),
    pulley("upperPulley", PULLEYS.upper),
    pulley("middlePulley", PULLEYS.middle),
    pulley("lowerPulley", PULLEYS.lower),
    {
      id: "crank",
      kind: "group",
      center: CRANK.pivot,
      arrow: false,
      posed: true,
      pieces: [
        { kind: "box", size: [CRANK.arm, 0.14, 0.1], at: [-CRANK.arm / 2, 0, 0] },
        { kind: "box", size: [1.6, 0.14, 0.1], at: [0.8, 0, 0] },
        { kind: "cylinder", radius: 0.18, inner: 0.08, length: 0.2 },
      ],
    },
    { id: "shifter", kind: "group", posed: true, pieces: [{ kind: "box", size: [0.1, 1.9, 0.1], at: [2.8, -0.95, 0.3] }, { kind: "box", size: [0.35, 0.3, 0.6], at: [2.8, -2.0, 0] }] },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape([[-1.6, -0.55], [1.6, -0.55], [1.6, -3.1], [1.4, -3.1], [1.4, -0.75], [-1.4, -0.75], [-1.4, -3.1], [-1.6, -3.1]]), thickness: 0.2, at: [0, 0, -0.6] },
        { kind: "box", size: [0.5, 0.35, 0.4], at: [CRANK.pivot[0], -0.4, 0] },
      ],
    },
    { id: "belt", kind: "belt" },
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.25 },
  states: {
    options: [
      { id: "slow", label: "過慢(皮帶在上輪)" },
      { id: "normal", label: "正常(皮帶在鬆動輪)" },
      { id: "fast", label: "過快(皮帶在下輪)" },
    ],
    initial: "normal",
  },
  view: { direction: [0.2, 0.2, 1], fit: ["spindle", "frame", "crank", "middlePulley", "ballL", "ballR"] },
  pose(p, state = "normal") {
    const { spindle, travel, y } = regulator(p, state);
    const shift = y - PULLEYS.middle; // 皮帶從中間被撥上或撥下
    return {
      parts: {
        spindle: { angle: spindle },
        ...GOV.pose(ALPHA[state]),
        upperPulley: { angle: spindle },
        lowerPulley: { angle: spindle },
        middlePulley: { angle: 0 },
        crank: { angle: -Math.asin(shift / 1.6) },
        shifter: { position: [0, shift, 0] },
      },
      paths: { belt: { points: beltAt(y).points, closed: true, phase: travel } },
      readouts: [],
    };
  },
};

