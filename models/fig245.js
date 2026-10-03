// 第 245 種:刺刀式接頭。管 A 插在承插座 B 裡,A 上的凸銷卡在 B 的 L 形槽的橫槽末端;
// 轉動 A,凸銷沿橫槽走到直槽底下,就能把 A 往上抽出。主動件是 A:先轉、再抽(一個主動量)。
// 推斷:接頭被使用時的動作(原文只說轉動後脫出、抽出);槽的尺寸。
import { Y, deg, planeAngle, clamp } from "./kit.js";
import { arcPoints } from "./shapes.js";

const R = { tube: 0.62, tubeIn: 0.5, socket: 0.86, socketIn: 0.66 };
const PIN = 0.12; // 凸銷半徑
const SOCKET_H = 1.7;
const SLOT = { width: 0.32, turn: deg(52), depth: 0.95 }; // 槽寬、橫槽轉過的角度、直槽深(從承插座頂往下)
const FRONT = planeAngle(Y, [0, 0, 1]); // 局部角:朝向讀者的方向
const VERTICAL = FRONT - SLOT.turn / 2; // 直槽的位置
const LOCKED = FRONT + SLOT.turn / 2; // 橫槽末端(凸銷鎖住的位置)
export const LIFT = 2.2; // 抽出的距離
const TUBE_H = 3.0;

/** 主動量 v:0–1 轉動(凸銷沿橫槽走到直槽底下),1–2 往上抽出 → A 的轉角與上升量 */
export function bayonet(v) {
  const turn = clamp(v, 0, 1);
  const pull = clamp(v - 1, 0, 1);
  return { angle: -turn * SLOT.turn, lift: pull * LIFT, pinAngle: LOCKED - turn * SLOT.turn };
}
export const geometry = { VERTICAL, LOCKED, SOCKET_H, SLOT };

// 環形扇形板(繞局部 Z 的一段環壁),沿 Y 立起後就是承插座壁的一截
const wall = (a0, a1) => ({ outline: [...arcPoints(R.socket, a0, a1), ...arcPoints(R.socketIn, a1, a0)], holes: [] });
const half = SLOT.width / 2 / R.socket; // 槽寬的半角
const band = (y0, y1, gaps) => {
  // 一圈壁扣掉 gaps([from, to] 角度區間,遞增排列)
  const pieces = [];
  let at = gaps[gaps.length - 1][1] - 2 * Math.PI;
  for (const [g0, g1] of gaps) {
    pieces.push({ kind: "plate", shape: wall(at, g0), thickness: y1 - y0, at: [0, 0, (y0 + y1) / 2] });
    at = g1;
  }
  return pieces;
};
const bottom = -SOCKET_H / 2;
const slotLow = SOCKET_H / 2 - SLOT.depth;
const slotHigh = slotLow + SLOT.width;
const SOCKET_Y = -0.6;
const TUBE_Y = SOCKET_Y + slotLow + SLOT.width / 2 + TUBE_H / 2 - 0.3; // 凸銷在橫槽正中

export default {
  figure: 245,
  parts: [
    {
      id: "socketB",
      kind: "group",
      axis: Y,
      center: [0, SOCKET_Y, 0],
      label: "B",
      labelOffset: [0.4, -0.45, 1.0],
      pieces: [
        { kind: "cylinder", radius: R.socket, inner: R.socketIn, length: slotLow - bottom, at: [0, 0, (bottom + slotLow) / 2] },
        { kind: "plate", shape: { outline: arcPoints(R.socketIn, 0, 2 * Math.PI).slice(0, -1), holes: [] }, thickness: 0.1, at: [0, 0, bottom + 0.05] },
        ...band(slotLow, slotHigh, [[VERTICAL - half, LOCKED + half]]),
        ...band(slotHigh, SOCKET_H / 2, [[VERTICAL - half, VERTICAL + half]]),
      ],
    },
    {
      id: "tubeA",
      kind: "cylinder",
      axis: Y,
      center: [0, TUBE_Y, 0],
      radius: R.tube,
      inner: R.tubeIn,
      length: TUBE_H,
      label: "A",
      labelOffset: [0, 0.6, 0.7],
      pieces: [{ kind: "cylinder", radius: PIN, length: 0.36, axis: [Math.cos(LOCKED), Math.sin(LOCKED), 0], at: [(R.tube + 0.14) * Math.cos(LOCKED), (R.tube + 0.14) * Math.sin(LOCKED), -TUBE_H / 2 + 0.3], accent: true }],
    },
  ],
  driver: { part: "tubeA", type: "translation", direction: [0, 1, 0], range: [0, 2], initial: 0 },
  view: { direction: [0.02, 0.18, 1] },
  pose(v) {
    const { angle, lift } = bayonet(v);
    return { parts: { tubeA: { angle, position: [0, TUBE_Y + lift, 0] } }, readouts: [] };
  },
};
