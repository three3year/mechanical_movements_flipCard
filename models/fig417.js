// 第 417 種:連續圓周運動轉換為直線往復運動。軸 A 在固定軸承 D 裡轉,一端彎曲,嵌在桿 B 上端的插座裡可以轉動;
// 桿 B 的下端嵌在滑塊 C 的插座裡。原圖虛線是軸從實線位置轉半圈後,桿 B 與滑塊的位置。
// 主動件是軸 A(右端的手柄)。
// 推斷:彎端掃出一個圓錐,插座跟著擺;桿 B 與插座成直角,下端穿進滑塊 C 的插座(可以轉、也可以進出),
// 滑塊只能沿底座直線滑動。
import { X, cross, norm, quatFromBasis } from "./kit.js";
import { shape } from "./shapes.js";

export const BEND = (25 * Math.PI) / 180; // 彎端與軸線的夾角
export const JOINT = [0.5, 2.2, 0]; // 軸彎曲處
const SOCKET_AT = 0.95; // 插座中心離彎曲處
export const SLIDE_Y = 0.42; // 滑塊插座的高度
const BASE_TOP = 0.2;

/** 軸轉 theta → 插座中心、插座軸向 u、桿 B 的方向 d、滑塊 C 的位置 */
export function solve(theta) {
  // 彎端方向:軸不轉時朝左下,隨軸繞 x 轉
  const u = [-Math.cos(BEND), -Math.sin(BEND) * Math.cos(theta), -Math.sin(BEND) * Math.sin(theta)];
  const S = JOINT.map((c, i) => c + SOCKET_AT * u[i]);
  // 桿 B 與插座成直角,且所在直線穿過滑塊走的直線(y = SLIDE_Y, z = 0)
  const n = [0, -S[2], S[1] - SLIDE_Y];
  let d = norm(cross(u, n));
  if (d[1] > 0) d = d.map((c) => -c);
  const t = (SLIDE_Y - S[1]) / d[1];
  const C = [S[0] + t * d[0], SLIDE_Y, 0];
  return { u, S, d, C, t };
}

export default {
  figure: 417,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [4.8, BASE_TOP, 1.0], at: [-0.3, BASE_TOP / 2, 0] },
        // 滑塊的導軌
        { kind: "box", size: [3.0, 0.08, 0.12], at: [-1.3, BASE_TOP + 0.04, 0.32] },
        { kind: "box", size: [3.0, 0.08, 0.12], at: [-1.3, BASE_TOP + 0.04, -0.32] },
      ],
    },
    {
      id: "bearing",
      kind: "group",
      label: "D",
      labelOffset: [1.75, 1.0, 0.4],
      pieces: [
        { kind: "plate", shape: shape([[0.9, BASE_TOP], [1.9, BASE_TOP], [1.55, 1.4], [1.55, 1.9], [1.2, 1.9], [1.2, 1.4]]), thickness: 0.4 },
        { kind: "cylinder", radius: 0.3, length: 2.0, axis: X, at: [1.6, JOINT[1], 0] },
      ],
    },
    {
      id: "shaft",
      kind: "group",
      axis: X,
      center: JOINT,
      label: "A",
      labelOffset: [-0.25, 0.45, 0.2],
      spin: 0.35,
      pieces: [
        { kind: "cylinder", radius: 0.12, length: 3.2, at: [0, 0, 1.6] },
        // 彎端(局部 z 是世界 x)
        { kind: "cylinder", radius: 0.12, length: 1.5, axis: [0, -Math.sin(BEND), -Math.cos(BEND)], at: [0, -Math.sin(BEND) * 0.75, -Math.cos(BEND) * 0.75] },
        // 右端的手柄
        { kind: "box", size: [0.1, 0.75, 0.1], at: [0, 0.3, 3.15] },
        { kind: "cylinder", radius: 0.06, length: 0.35, at: [0, 0.62, 3.35], accent: true },
      ],
    },
    {
      id: "socket",
      kind: "lathe",
      profile: [[0, -0.55], [0.26, -0.55], [0.2, 0.55], [0, 0.55]],
      arrow: false,
      pieces: [{ kind: "box", size: [0.5, 0.18, 0.18], at: [0.25, 0, -0.1] }],
    },
    { id: "rodB", kind: "rod", radius: 0.07, label: "B", labelOffset: [0.25, 1.1, 0.3] }, // 路徑零件的標籤從原點量起
    { id: "slider", kind: "box", size: [0.7, 0.22, 0.52], label: "C", labelOffset: [-0.5, 0, 0.3] },
  ],
  driver: { part: "shaft", type: "rotation" },
  target: "slider",
  view: { direction: [0.25, 0.25, 1] },
  pose(theta) {
    const s = solve(theta);
    const y = cross(s.u, s.d);
    return {
      parts: {
        shaft: { angle: theta },
        socket: { position: s.S, rotation: quatFromBasis(s.d, y, s.u) },
        slider: { position: [s.C[0], BASE_TOP + 0.11, 0] },
      },
      paths: { rodB: { points: [s.S, s.C], closed: false } },
      readouts: [{ label: "滑塊 C 的位置", value: s.C[0].toFixed(2) }],
    };
  },
};

