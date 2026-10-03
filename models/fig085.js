// 第 85 種:軸上有兩個凸輪(推板),連續旋轉時頂起桿 A 上的凸塊 B,把桿抬起;推板滑脫後桿憑自重落下。
// 用於礦石搗碎機與錘子。軸每轉一圈,桿被抬起兩次。主動件是凸輪軸(順時針)。
// 落下的過程演出來:推板滑脫後桿從靜止起步、越來越快地落下、到底停住(jumps.falling),佔半圈的 14%
// (約 0.44 弧度;推斷:原文只說「憑其自身重量下落」,落下期間下一片推板尚未碰到凸塊)。
import { TAU, deg, polar } from "./kit.js";
import { shape, circle, arcPoints } from "./shapes.js";
import { liftAndDrop, cycleOf, falling } from "./jumps.js";

const CAM = { center: [0.42, 0.55, 0], hub: 0.28, tip: 0.82 };
const ROD = { x: -0.45, bottom: -2.6, top: 1.9, radius: 0.12 };
const RISE = 0.5;
const PHASE = { liftFrom: 0.05, liftTo: 0.7, dropTo: 0.84, fall: falling };

/** 凸輪軸順時針轉 c:桿 A 抬起的高度 */
export function rodLift(c) {
  const { u } = cycleOf(c, TAU / 2);
  return RISE * liftAndDrop(u, PHASE).height;
}

const blade = (a) =>
  shape([...arcPoints(CAM.hub, a - deg(40), a + deg(20)), polar(CAM.tip, a - deg(5)).slice(0, 2), polar(CAM.tip - 0.12, a - deg(30)).slice(0, 2)]);

export default {
  figure: 85,
  parts: [
    {
      id: "cam",
      kind: "group",
      center: CAM.center,
      spin: 0.8,
      pieces: [
        { kind: "plate", shape: shape(circle(CAM.hub), [circle(0.1).reverse()]), thickness: 0.3, circles: [0.18] },
        { kind: "plate", shape: blade(Math.PI), thickness: 0.3, mark: polar(0.45, Math.PI - 0.3).slice(0, 2), markSize: 0.06 },
        { kind: "plate", shape: blade(0), thickness: 0.3 },
      ],
    },
    {
      id: "rod",
      kind: "group",
      center: [ROD.x, 0, 0],
      pieces: [
        { kind: "cylinder", axis: [0, 1, 0], radius: ROD.radius, length: ROD.top - ROD.bottom, at: [0, (ROD.top + ROD.bottom) / 2, 0] },
        { kind: "box", size: [0.3, 0.2, 0.3], at: [0.12, 1.15, 0], accent: false },
        { kind: "lathe", axis: [0, 1, 0], at: [0, ROD.bottom - 0.05, 0], profile: [[0, -0.55], [0.52, -0.55], [0.42, 0], [0.18, 0.05], [0, 0.05]] },
      ],
      label: "A",
      labelOffset: [-0.45, 0.2, 0.2],
    },
    { id: "labelB", kind: "group", center: [ROD.x - 0.3, 1.15, 0.2], label: "B" },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape([[0.95, -3.5], [3.3, -3.5], [3.3, -3.3], [2.5, -3.2], [2.0, -2.0], [1.9, 1.6], [1.6, 2.3], [-0.65, 2.3], [-0.65, 2.0], [0.95, 2.0]]), thickness: 0.45, at: [0, 0, -0.35] },
        { kind: "box", size: [1.5, 0.22, 0.45], at: [0.2, -1.0, 0] },
        { kind: "box", size: [1.5, 0.22, 0.45], at: [0.2, 2.0, 0] },
        { kind: "box", size: [5.0, 0.08, 1.2], at: [0.5, -3.55, 0] },
      ],
    },
  ],
  driver: { part: "cam", type: "rotation", speed: -1.0 },

  target: "rod",
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const h = rodLift(-v);
    return {
      parts: { cam: { angle: v }, rod: { position: [ROD.x, h, 0] }, labelB: { position: [ROD.x - 0.3, 1.15 + h, 0.2] } },
      readouts: [],
    };
  },
};
