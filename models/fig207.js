// 第 207 種:第 195 種的變形,用兩個蝸桿與兩個蝸輪:同一根軸上兩段旋向相反的蝸桿,各帶一個蝸輪。
// 兩輪因此反向轉(圖中的箭頭),相對的兩側朝同一方向走,可當作一對進料滾軸。主動件是蝸桿軸。
// 推斷:左段右旋、右段左旋;齒數。
import { TAU, X } from "./kit.js";

const N = 20;
const R = 1.1;
const PITCH = (TAU * R) / N;
const WORM = { radius: 0.2, length: 0.9 };
const XS = [-1.6, 1.6];
const HANDS = [1, -1];
const Y = R + WORM.radius - 0.04;

// 局部角 at 處螺紋的軸向位置(相對該段蝸桿中心):z = −L/2 + hand·a·節距/2π
const crest = (theta, at, hand) => -WORM.length / 2 + hand * ((at - theta) / TAU) * PITCH;

/** 軸轉 theta:左右兩個蝸輪的轉角(蝸輪在蝸桿上方,以最下方咬合) */
export function wheels(theta) {
  return HANDS.map((hand) => -Math.PI / 2 + (crest(theta, Math.PI / 2, hand) + PITCH / 2) / R);
}
export const geometry = { N, R };

export default {
  figure: 207,
  parts: [
    {
      id: "shaft",
      kind: "group",
      axis: X,
      spin: 0.3,
      pieces: [
        { kind: "cylinder", radius: 0.12, length: 6.0, mark: true },
        ...XS.map((x, i) => ({ kind: "worm", radius: WORM.radius, length: WORM.length, pitch: PITCH, thread: 0.07, hand: HANDS[i], at: [0, 0, x] })),
      ],
    },
    ...XS.map((x, i) => ({
      id: i ? "right" : "left",
      kind: "gear",
      center: [x, Y, 0],
      teeth: N,
      radius: R,
      width: 0.3,
      bore: 0.14,
      pieces: [{ kind: "cylinder", radius: 0.28, inner: 0.14, length: 0.4 }],
    })),
  ],
  driver: { part: "shaft", type: "rotation", speed: 3 },
  targets: ["left", "right"], // 一對進料滾軸
  view: { direction: [0.08, 0.06, 1] },
  pose(theta) {
    const [left, right] = wheels(theta);
    return { parts: { shaft: { angle: theta }, left: { angle: left }, right: { angle: right } }, readouts: [] };
  },
};
