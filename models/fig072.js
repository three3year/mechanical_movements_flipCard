// 第 72 種:傾動式錘子(tilt-hammer)。凸輪(推板輪)B 有四片推板,每轉一圈把錘子 A 抬起四次:
// 推板頂起錘柄下方的凸塊,錘子繞右端的支座擺起,推板一滑過凸塊,錘子便落回砧上。
// 主動件是 B(順時針,原圖箭頭)。每片推板經過時錘柄被頂起、滑脫後瞬間落下(時序為簡化的示意)。
import { TAU, deg, polar } from "./kit.js";
import { shape, circle, arcPoints } from "./shapes.js";
import { liftAndDrop, cycleOf } from "./jumps.js";

const B = { center: [0, 0, 0], hub: 0.42, tip: 0.88 };
const PIVOT = [3.2, 0.42, 0]; // 錘柄的支點(右端)
const TAPPET = [0.12, 0.55]; // 錘子落在砧上時,凸塊底端的位置

const LIFT = deg(7);
// 每片推板經過一次:錘柄從砧上被慢慢頂起,推板一滑脫就瞬間落下
const PHASE = { liftFrom: 0.15, liftTo: 0.7, dropTo: 0.74 };

/** B 順時針轉 b:錘柄繞支點抬起的角度(0 為落在砧上) */
export function hammerLift(b) {
  const { u } = cycleOf(b, TAU / 4);
  return LIFT * liftAndDrop(u, PHASE).height;
}

// 推板:從輪轂伸出的彎刃,尖端在局部角 i·90°
const wiper = (i) => {
  const a = (i * TAU) / 4;
  return shape([...arcPoints(B.hub, a - deg(32), a + deg(14)), polar(B.tip, a).slice(0, 2), polar(B.tip - 0.25, a - deg(26)).slice(0, 2)]);
};

export default {
  figure: 72,
  parts: [
    {
      id: "wiper",
      kind: "group",
      center: B.center,
      spin: 1.0,
      pieces: [
        { kind: "plate", shape: shape(circle(B.hub + 0.05), [circle(0.15).reverse()]), thickness: 0.3, circles: [0.22] },
        ...[0, 1, 2, 3].map((i) => ({ kind: "plate", shape: wiper(i), thickness: 0.3, ...(i === 0 ? { mark: polar(0.62, -0.25).slice(0, 2), markSize: 0.07 } : {}) })),
      ],
      label: "B",
      labelOffset: [-0.3, 0.05, 0.3],
    },
    {
      id: "hammer",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        // 錘柄:從支點往左延伸,越過推板輪,錘頭落在左邊的砧上
        { kind: "plate", shape: shape([[0.15, -0.2], [0.18, 0.28], [-2.0, 0.55], [-4.6, 0.95], [-6.3, 1.15], [-6.35, 0.72], [-4.6, 0.55], [-3.0, 0.12], [-0.25, -0.2]]), thickness: 0.32 },
        { kind: "box", size: [0.35, 0.55, 0.36], at: [0, -0.1, 0] },
        { kind: "sphere", radius: 0.2, at: [0, -0.32, 0] },
        { kind: "box", size: [1.0, 0.32, 0.4], at: [-5.75, 0.55, 0] },
        { kind: "box", size: [0.14, 0.3, 0.2], at: [TAPPET[0] - PIVOT[0], TAPPET[1] - PIVOT[1] + 0.12, 0] },
      ],
      label: "A",
      labelOffset: [-3.6, 1.15, 0.3],
    },
    {
      id: "base",
      kind: "group",
      pieces: [
        { kind: "box", size: [1.6, 1.7, 0.8], at: [-2.65, -0.05, 0] },
        { kind: "box", size: [2.1, 0.95, 0.8], at: [2.75, -0.45, 0] },
        { kind: "box", size: [0.9, 0.25, 0.8], at: [3.2, 0.1, 0] },
        { kind: "box", size: [8.2, 0.12, 1.2], at: [0, -0.95, 0] },
        { kind: "plate", shape: shape([[-3.6, 0.82], [-1.95, 0.82], [-2.0, 0.92], [-3.6, 0.95]]), thickness: 0.4 },
      ],
    },
  ],
  driver: { part: "wiper", type: "rotation", speed: -1.0 },
  target: "hammer", // 被抬起又落下的錘子 A
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    return { parts: { wiper: { angle: v }, hammer: { angle: -hammerLift(-v) } }, readouts: [] };
  },
};

