// 第 251 種:打樁機的釋放鉤。重物 W 由鉤 A(兩支交叉、以銷相連的鉗臂)吊著往上拉;拉到夠高時,
// 鉗臂的上端進入框架 B 的楔形槽,被槽的兩側往內壓,下端的鉤爪隨之張開,重物突然被放開,落到樁頭上。
// 主動件是吊繩:拉上去(釋放)、再放下去讓鉤爪重新抓住重物(累計行程,見 kit.swing)。
// 推斷:放下時鉤爪抓回重物的動作(原文只寫釋放);鉗臂的形狀。
// 重物靠重力落下,落下的過程演出來(jumps.falling:起步慢、越來越快、到底停住),佔吊繩再走 DROP 的行程。
// 楔形槽在吊繩行程的 SQUEEZE_AT 到 SQUEEZE_AT + SQUEEZE 之間把鉗臂壓開,槽上方是等寬的直槽,鉗臂張到底後
// 吊繩再拉 0.5 到頂、回頭放 0.5 都還被直槽撐開著:重物在這段時間裡落到樁頭,鉗臂開始合攏時凸頭早已在爪尖之下。
import { swingPhase, clamp } from "./kit.js";
import { falling } from "./jumps.js";
import { shape, thickLine, circle, rect } from "./shapes.js";

export const HEIGHT = 3.0; // 吊繩的行程
const SQUEEZE_AT = 2.0; // 鉗臂上端進入楔形槽時的吊繩行程
const SQUEEZE = 0.5; // 鉗臂上端在槽中被壓進的行程
const OPEN = 0.32; // 鉗臂張開的最大角度
const PIVOT0 = -0.4; // 吊繩在最低處時鉗臂樞銷的高度
const KNOB = 0.47; // 抓住時重物頂端(凸頭)在樞銷下方的距離
export const RELEASE = SQUEEZE_AT + 0.45; // 吊繩拉到這裡時鉤爪張得夠開(0.29),放開重物
export const DROP = 1.0; // 重物落到底所佔的吊繩行程(約 0.4 秒);鉗臂在 RELEASE + 1.05 才開始合攏

/** 主動量 v(累計行程)→ 鉗臂樞銷高度、張開角度、重物上升量 */
export function hook(v) {
  const { at, forward, cycle } = swingPhase(v, 0, HEIGHT);
  const open = OPEN * clamp((at - SQUEEZE_AT) / SQUEEZE, 0, 1);
  // 往上拉時重物跟著鉤上升,放開後加速落下;落下的時間以吊繩的累計行程量(跨過到頂回頭的那一刻)
  const since = v - (2 * cycle * HEIGHT + RELEASE); // 離這一輪放開多久(放開前為負)
  let weight = 0;
  if (since < 0) weight = forward ? at : 0;
  else if (since < DROP) weight = RELEASE * (1 - falling(since / DROP));
  return { pivot: PIVOT0 + at, open, weight, hold: forward && at < RELEASE };
}

// 鉗臂(左臂,局部座標以樞銷為原點):上端往外彎上去,下端的鉤爪往內勾住重物的凸頭;
// 上端被壓向中間時,下端往外張開
const ARM = [[-0.42, 0.95], [-0.28, 0.4], [0, 0], [-0.3, -0.35], [-0.33, -0.6], [-0.14, -0.66]];
const arm = (mirror) => shape(thickLine(ARM.map(([x, y]) => [mirror * x, y]), 0.12), [circle(0.05).reverse()]);

export default {
  figure: 251,
  parts: [
    {
      id: "frame",
      kind: "group",
      label: "B",
      labelOffset: [0.45, HEIGHT + 1.15, 0.3],
      pieces: [
        { kind: "box", size: [0.22, 7.6, 0.4], at: [-1.45, 0.5, 0] },
        { kind: "box", size: [0.22, 7.6, 0.4], at: [1.45, 0.5, 0] },
        { kind: "box", size: [3.3, 0.3, 0.4], at: [0, 4.3, 0] },
        // 楔形槽的兩側:上窄下寬;鉗臂上端(樞銷上方 0.95)在吊繩行程 SQUEEZE_AT 時進入槽底,壓到頭後上方是直槽
        { kind: "plate", shape: shape([[-1.34, 2.35], [-0.6, 2.35], [-0.16, 3.05], [-0.16, 4.15], [-1.34, 4.15]]), thickness: 0.4 },
        { kind: "plate", shape: shape([[1.34, 2.35], [0.6, 2.35], [0.16, 3.05], [0.16, 4.15], [1.34, 4.15]]), thickness: 0.4 },
        { kind: "box", size: [3.3, 0.2, 1.0], at: [0, -3.4, 0] },
      ],
    },
    { id: "armL", kind: "plate", shape: arm(1), thickness: 0.1, arrow: false, label: "A", labelOffset: [0.5, 0.2, 0.3] },
    { id: "armR", kind: "plate", shape: arm(-1), thickness: 0.1, arrow: false },
    { id: "pin", kind: "cylinder", radius: 0.09, length: 0.4 },
    {
      id: "weight",
      kind: "group",
      label: "W",
      labelOffset: [0, -1.0, 0.5],
      pieces: [
        { kind: "plate", shape: shape(rect(2.4, 2.0, 0, -1.25)), thickness: 0.8 },
        // 凸頭:上寬下窄,鉤爪勾在寬頭底下
        { kind: "plate", shape: shape([[-0.3, 0], [0.3, 0], [0.3, -0.13], [0.1, -0.13], [0.1, -0.25], [-0.1, -0.25], [-0.1, -0.13], [-0.3, -0.13]]), thickness: 0.3 },
      ],
    },
    { id: "rope", kind: "rope" },
  ],
  // 動力重演:只推主動件;weight 靠摩擦定位,由接觸帶動
  replay: { free: { weight: { slide: [0,1,0], hold: true } }, expect: [{ part: "weight", label: "主動件走完一輪後 weight 的位置" }] },
  driver: { part: "pin", grips: ["armL", "armR"], type: "translation", direction: [0, 1, 0], cycle: [0, HEIGHT] },

  target: "weight",
  view: { direction: [0.06, 0.06, 1] },
  pose(v) {
    const h = hook(v);
    const pin = [0, h.pivot, 0.2];
    const top = PIVOT0 - KNOB + h.weight; // 重物頂端的高度
    return {
      parts: {
        armL: { position: pin, angle: -h.open },
        armR: { position: [pin[0], pin[1], pin[2] + 0.1], angle: h.open }, // 兩支鉗臂前後錯開一層,交叉處互不相碰
        pin: { position: pin },
        weight: { position: [0, top, 0] },
      },
      paths: { rope: { points: [[0, 4.6, 0.2], [0, h.pivot, 0.2]], closed: false, phase: h.pivot } },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["frame", "armL"], reason: "鉗臂上端被楔形槽夾攏的過程是以槽壁的斜率算的;臂端的圓角擦到槽壁 0.04(96 個取樣中 11 個)" },
  ],
};
