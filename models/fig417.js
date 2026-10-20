// 第 417 種:連續圓周運動轉換為直線往復運動。軸 A 在固定軸承 D 裡轉,一端彎曲,嵌在桿 B 上端的插座裡可以轉動;
// 桿 B 的下端嵌在滑塊 C 的插座裡。原圖虛線是軸從實線位置轉半圈後,桿 B 與滑塊的位置。
// 主動件是軸 A(右端的手柄)。
// 推斷:彎端掃出一個圓錐,插座跟著擺;桿 B 固定在插座上、與插座成直角,長度不變;
// 桿 B 的方向與下端到滑塊的距離都會變(軸轉一圈,插座中心到滑塊的距離在 1.52–2.41 之間),
// 所以滑塊 C 的插座做成一根深套筒:下端是球頭、坐在滑塊的球座裡,能朝任何方向擺;桿 B 在筒裡進出。
// 原圖的插座畫得很淺;照實物可行改成深套筒(原文 > 實物可行 > 插圖外形)。
import { X, cross, norm, quatFromBasis } from "./kit.js";
import { shape } from "./shapes.js";

export const BEND = (25 * Math.PI) / 180; // 彎端與軸線的夾角
export const JOINT = [0.5, 2.2, 0]; // 軸彎曲處
const SOCKET_AT = 0.95; // 插座中心離彎曲處
export const SLIDE_Y = 0.42; // 滑塊上套筒球心的高度
const BASE_TOP = 0.2;
export const ROD_B = 1.38; // 桿 B 從插座中心到下端
export const SLEEVE = 1.12; // 套筒從球心往上的長度
const BALL = 0.12; // 套筒下端的球頭

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
      // 桿 B 上端的插座(套在彎端上)與固定在它上面的桿 B(局部 +x)
      id: "socket",
      kind: "lathe",
      profile: [[0, -0.55], [0.26, -0.55], [0.2, 0.55], [0, 0.55]],
      label: "B",
      labelOffset: [0.45, -0.55, 0.3],
      arrow: false,
      pieces: [{ kind: "cylinder", radius: 0.07, length: ROD_B - 0.15, axis: X, at: [(ROD_B + 0.15) / 2, 0, 0] }],
    },
    {
      // 滑塊 C 上的套筒(推斷):球頭坐在滑塊的球座裡,筒沿桿 B 的方向(局部 +z 朝下)
      id: "sleeve",
      kind: "lathe",
      profile: [[0.075, -SLEEVE], [0.11, -SLEEVE], [0.11, -BALL + 0.03], [0.075, -BALL + 0.03]],
      arrow: false,
      pieces: [{ kind: "sphere", radius: BALL }],
    },
    { id: "slider", kind: "box", size: [0.7, 0.24, 0.52], label: "C", labelOffset: [-0.5, 0, 0.3] }, // 頂面在球心上方 0.02:球座
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
        sleeve: { position: s.C, rotation: quatFromBasis(s.u, cross(s.d, s.u), s.d) },
        slider: { position: [s.C[0], BASE_TOP + 0.12, 0] },
      },
      readouts: [{ label: "滑塊 C 的位置", value: s.C[0].toFixed(2) }],
    };
  },
};
