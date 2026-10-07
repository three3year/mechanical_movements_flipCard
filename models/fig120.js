// 第 120 種:兩支夾爪各連在一個扇形段上:一個扇形段的齒在外側,另一個(大圓框)的齒在內側,兩者都繞夾爪的鉸鏈轉。
// 下方的軸上有兩個小齒輪,小的咬外齒扇形段、大的咬內齒扇形段。轉動這根軸時,外咬合的扇形段與小齒輪反向轉、
// 內咬合的與小齒輪同向轉,兩支夾爪因此朝相反方向擺動,以極大的力道併攏。
// 兩對齒輪的齒數比相同(1 : 4),兩爪擺動的角度相等。主動件是小齒輪軸(在開合的範圍內)。
// 夾爪的樞軸銷與小齒輪軸都裝在後面一支固定的連接板上(推斷:原圖沒畫出撐著小齒輪軸的東西,
// 兩支夾爪都會擺動,軸必須掛在不動的零件上,才能讓兩爪相對它轉)。
import { deg } from "./kit.js";
import { meshAngle } from "./gears.js";
import { internalSectorShape, shape, circle, stadium } from "./shapes.js";

const PIVOT = [0, 1.6, 0];
const SHAFT = [0, -0.9, 0];
const D = PIVOT[1] - SHAFT[1];
export const P1 = { center: SHAFT, teeth: 10, radius: 0.5 };
export const S1 = { center: PIVOT, teeth: 40, radius: D - 0.5 };
export const P2 = { center: SHAFT, teeth: 12, radius: (D * 12) / 36 };
export const S2 = { center: PIVOT, teeth: 48, radius: (D * 48) / 36, internal: true };
const DOWN = deg(-90);

/** 軸轉 beta:兩個扇形段(與夾爪)的轉角 */
export function jaws(beta) {
  return { s1: meshAngle(P1, S1, beta), s2: meshAngle(P2, S2, beta) };
}

// 夾爪:從鉸鏈往上彎的月牙(沿中心線兩側取寬度,兩端收尖)
const crescent = (side) => {
  const n = 24;
  const center = (t) => [side * 1.15 * Math.sin(Math.PI * 0.82 * t), 2.55 * t];
  const width = (t) => 0.05 + 0.24 * Math.sin(Math.PI * t) ** 0.7;
  const left = [];
  const right = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const [x, y] = center(t);
    const [x2, y2] = center(Math.min(1, t + 0.01));
    const [x1, y1] = center(Math.max(0, t - 0.01));
    const l = Math.hypot(x2 - x1, y2 - y1) || 1;
    const nx = -(y2 - y1) / l;
    const ny = (x2 - x1) / l;
    left.push([x + nx * width(t), y + ny * width(t)]);
    right.push([x - nx * width(t), y - ny * width(t)]);
  }
  return shape([...left, ...right.reverse()]);
};

export default {
  figure: 120,
  parts: [
    {
      id: "pinions",
      kind: "group",
      center: SHAFT,
      spin: P2.radius,
      pieces: [
        { kind: "gear", teeth: P1.teeth, radius: P1.radius, width: 0.22, at: [0, 0, 0.18], web: false },
        { kind: "gear", teeth: P2.teeth, radius: P2.radius, width: 0.22, at: [0, 0, -0.18], web: false },
        { kind: "cylinder", radius: 0.12, length: 1.0, at: [0, 0, -0.1] }, // 往後伸進連接板
      ],
    },
    {
      id: "jawA",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "gear", teeth: S1.teeth, radius: S1.radius, span: [DOWN - deg(28), DOWN + deg(28)], width: 0.22, at: [0, 0, 0.18] },
        { kind: "plate", shape: crescent(1), thickness: 0.16, at: [0, 0, 0.18] },
      ],
    },
    {
      id: "jawB",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "plate", shape: internalSectorShape({ teeth: S2.teeth, radius: S2.radius, span: [DOWN - deg(26), DOWN + deg(26)], rim: S2.radius + 0.35 }), thickness: 0.22, at: [0, 0, -0.18] },
        { kind: "plate", shape: stadium(S2.radius + 0.2, 0.18), thickness: 0.16, at: [0, 0, -0.18], angle: DOWN + deg(28) },
        { kind: "plate", shape: stadium(S2.radius + 0.2, 0.18), thickness: 0.16, at: [0, 0, -0.18], angle: DOWN - deg(28) },
        { kind: "plate", shape: crescent(-1), thickness: 0.16, at: [0, 0, -0.18] },
      ],
    },
    {
      id: "hinge",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: 0.14, length: 1.0, at: [PIVOT[0], PIVOT[1], -0.1] }, // 兩支夾爪共用的樞軸銷
        // 連接板:從樞軸銷往下到小齒輪軸,在夾爪後面
        { kind: "box", size: [0.3, D, 0.1], at: [0, (PIVOT[1] + SHAFT[1]) / 2, -0.55] },
        { kind: "cylinder", radius: 0.26, length: 0.1, at: [PIVOT[0], PIVOT[1], -0.55] },
        { kind: "cylinder", radius: 0.26, inner: 0.12, length: 0.1, at: [SHAFT[0], SHAFT[1], -0.55] },
      ],
    },
  ],
  driver: { part: "pinions", type: "rotation", range: [-1.4, 0.4], initial: 0 },
  targets: ["jawA", "jawB"], // 反向擺動併攏的兩支夾爪
  view: { direction: [0.06, 0.05, 1] },
  pose(beta) {
    const { s1, s2 } = jaws(beta);
    return {
      parts: { pinions: { angle: beta }, jawA: { angle: s1 }, jawB: { angle: s2 } },
      readouts: [],
    };
  },
};

