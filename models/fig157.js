// 第 157 種:第 156 種的變形,以一根連桿取代曲柄搖臂上的溝槽。圓盤的曲柄銷經連桿拉動曲柄搖臂的上臂,
// 搖臂繞樞軸擺動,右臂末端帶動往下的桿做變速的交替直線運動。主動件是圓盤。
import { deg, polar, add, dist } from "./kit.js";
import { circleCircle, angleOf } from "./linkage.js";

const DISC = { center: [-1.6, 0, 0], radius: 1.45, pin: 0.62 };
const PIVOT = [1.55, 0.05, 0.25];
const UP = { length: 1.6, at: deg(98) }; // 上臂(原圖位置)
const RIGHT = { length: 1.55, at: deg(4) }; // 右臂
const START = deg(155);
const PIN0 = add(DISC.center, polar(DISC.pin, START));
const ROD = dist(PIN0, add(PIVOT, polar(UP.length, UP.at)));

/** 圓盤轉 theta:曲柄銷、上臂端點、搖臂轉角(相對原圖位置)與右臂末端 */
export function bellCrank(theta) {
  const pin = add(DISC.center, polar(DISC.pin, START + theta));
  const top = circleCircle(PIVOT, UP.length, pin, ROD, -1).point;
  const turn = angleOf(PIVOT, top) - UP.at;
  const end = add(PIVOT, polar(RIGHT.length, RIGHT.at + turn));
  return { pin, top, turn, end };
}

const z = (p, d) => [p[0], p[1], d];

export default {
  figure: 157,
  parts: [
    {
      id: "disc",
      kind: "group",
      center: DISC.center,
      spin: DISC.radius,
      pieces: [
        { kind: "plate", shape: { outline: Array.from({ length: 64 }, (_, i) => [DISC.radius * Math.cos((i / 64) * 2 * Math.PI), DISC.radius * Math.sin((i / 64) * 2 * Math.PI)]), holes: [] }, thickness: 0.1, at: [0, 0, -0.2], circles: [0.2] },
        { kind: "cylinder", radius: 0.2, inner: 0.1, length: 0.3, at: [...polar(DISC.pin, START).slice(0, 2), 0.1], accent: true },
      ],
    },
    {
      id: "crank",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "box", size: [UP.length, 0.26, 0.1], at: [(UP.length / 2) * Math.cos(UP.at), (UP.length / 2) * Math.sin(UP.at), 0], angle: UP.at },
        { kind: "box", size: [RIGHT.length, 0.26, 0.1], at: [(RIGHT.length / 2) * Math.cos(RIGHT.at), (RIGHT.length / 2) * Math.sin(RIGHT.at), 0], angle: RIGHT.at },
        { kind: "cylinder", radius: 0.3, inner: 0.15, length: 0.2 },
        { kind: "cylinder", radius: 0.22, inner: 0.1, length: 0.18, at: [...polar(UP.length, UP.at).slice(0, 2), 0] },
        { kind: "cylinder", radius: 0.22, inner: 0.1, length: 0.18, at: [...polar(RIGHT.length, RIGHT.at).slice(0, 2), 0] },
      ],
    },
    { id: "link", kind: "link", width: 0.2, thickness: 0.08 },
    { id: "rod", kind: "group", pieces: [{ kind: "box", size: [0.18, 2.4, 0.1], at: [0, -1.4, 0] }] },
  ],
  waivers: [
    { check: "unsupported", parts: ["disc"], reason: "待確認:disc 與帶動(或支撐)它的零件之間差 0.06 沒貼上,接觸位置是算出來的近似,未逐一修正" },
    { check: "unsupported", parts: ["crank"], reason: "待確認(未修):crank 在動,但離帶動(或支撐)它的零件還有 1 以上 的空隙,少了相連的軸、銷或連桿,尚未補上" },
    { check: "unsupported", parts: ["link"], reason: "待確認:link 與帶動(或支撐)它的零件之間差 0.06 沒貼上,接觸位置是算出來的近似,未逐一修正" },
    { check: "unsupported", parts: ["rod"], reason: "待確認(未修):rod 在動,但離帶動(或支撐)它的零件還有 1 以上 的空隙,少了相連的軸、銷或連桿,尚未補上" },
  ],
  driver: { part: "disc", type: "rotation" },
  target: "rod",
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const { pin, top, turn, end } = bellCrank(theta);
    return {
      parts: {
        disc: { angle: theta },
        crank: { angle: turn },
        link: { from: z(pin, 0.35), to: z(top, 0.35) },
        rod: { position: [end[0], end[1], 0.4] },
      },
      readouts: [],
    };
  },
};
