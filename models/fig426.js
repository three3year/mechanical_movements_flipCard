// 第 426 種:另一種旋轉式引擎。汽缸裡有兩個不動的擋板 D、D;兩個活塞 A、A 為了能通過擋板,做成可以在主軸 B 的輪轂 C 的
// 溝槽裡徑向滑動。蒸汽同時作用在兩個活塞上,使輪轂與軸旋轉。蒸汽依箭頭進出。
// 主動件是主軸 B(原圖箭頭:逆時針)。
// 推斷:汽缸內壁在兩個擋板處收到輪轂的半徑,兩旁以斜坡過渡,活塞外端始終貼著內壁;每個擋板的逆時針側進汽、
// 順時針側排汽,所以兩個活塞同時被推。
import { TAU, deg, clamp, smooth } from "./kit.js";
import { stream } from "./flow.js";
import { shape, circle, rect, thickLine } from "./shapes.js";

export const BORE = 1.7; // 汽缸內半徑(擋板以外)
export const HUB = 1.0; // 輪轂 C 的半徑(擋板處的內壁)
const FLAT = deg(9); // 擋板頂面的半寬
const RAMP = deg(42); // 斜坡到這裡回到 BORE
const PISTON = 0.75;
export const ABUTMENTS = [0, Math.PI];

/** 汽缸內壁的半徑(角度 phi) */
export function wall(phi) {
  let d = Infinity;
  for (const a of ABUTMENTS) d = Math.min(d, Math.abs(Math.atan2(Math.sin(phi - a), Math.cos(phi - a))));
  return HUB + (BORE - HUB) * smooth(clamp((d - FLAT) / (RAMP - FLAT), 0, 1));
}
const bore = Array.from({ length: 360 }, (_, i) => {
  const a = (TAU * i) / 360;
  return [wall(a) * Math.cos(a), wall(a) * Math.sin(a)];
});
const polar = (r, a, z = 0) => [r * Math.cos(a), r * Math.sin(a), z];

// 進汽道在擋板的逆時針側、排汽道在順時針側
const port = (abut, dir) => {
  const a = abut + dir * deg(16);
  const out = abut === 0 ? 1 : -1;
  return [polar(BORE + 0.9, abut + dir * deg(10), 0.2), polar(BORE + 0.1, a, 0.2), polar(wall(a) - 0.1, a, 0.2)].map((p, i) => (i === 0 ? [out * (BORE + 0.9), p[1], 0.2] : p));
};
const inlets = ABUTMENTS.map((a) => port(a, 1));
const exhausts = ABUTMENTS.map((a) => port(a, -1).reverse());

/** 在 a0 到 a1(逆時針)之間、輪轂與內壁之間的蒸汽 */
function steamBetween(a0, a1, travel) {
  const dots = [];
  const n = Math.max(1, Math.round((a1 - a0) / deg(7)));
  for (let i = 0; i < n; i++) {
    const a = a0 + ((a1 - a0) * (i + 0.5 + 0.3 * Math.sin(travel * 2 + i))) / n;
    const gap = wall(a) - HUB;
    if (gap < 0.12) continue;
    for (const f of gap > 0.5 ? [0.3, 0.7] : [0.5]) dots.push(polar(HUB + gap * f, a, 0.05));
  }
  return dots;
}

export default {
  figure: 426,
  parts: [
    {
      id: "cylinder",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(circle(BORE + 0.2), [bore.slice().reverse()]), thickness: 0.6 },
        { kind: "plate", shape: shape(circle(BORE + 0.2)), thickness: 0.04, at: [0, 0, -0.32] },
        { kind: "box", size: [2.6, 0.25, 0.9], at: [0, -BORE - 0.35, 0] },
        ...[...inlets, ...exhausts].map((p) => ({ kind: "plate", shape: shape(thickLine(p.map(([x, y]) => [x, y]), 0.1)), thickness: 0.3 })),
      ],
    },
    { id: "abutD1", kind: "group", label: "D", labelOffset: [HUB + 0.25, -0.05, 0.4], pieces: [] },
    { id: "abutD2", kind: "group", label: "D", labelOffset: [-HUB - 0.25, 0.05, 0.4], pieces: [] },
    {
      id: "hub",
      kind: "group",
      label: "C",
      labelOffset: [-0.55, 0.45, 0.4],
      spin: HUB + 0.1,
      pieces: [
        { kind: "plate", shape: shape(circle(HUB), [rect(2 * HUB + 0.1, 0.16).reverse()]), thickness: 0.56, mark: [0, HUB - 0.15], markSize: 0.08 },
        { kind: "cylinder", radius: 0.16, length: 1.0, at: [0, 0, -0.2] },
      ],
    },
    { id: "shaftB", kind: "group", label: "B", labelOffset: [0.25, -0.25, 0.4], pieces: [] },
    { id: "piston1", kind: "plate", shape: shape(rect(PISTON, 0.14, -PISTON / 2, 0)), thickness: 0.54, label: "A", labelOffset: [0, 0, 0.4], arrow: false },
    { id: "piston2", kind: "plate", shape: shape(rect(PISTON, 0.14, -PISTON / 2, 0)), thickness: 0.54, label: "A", labelOffset: [0, 0, 0.4], arrow: false },
  ],
  driver: { part: "hub", type: "rotation", speed: 0.6, initial: Math.PI / 2 },
  targets: ["piston1", "piston2"], // 軸 B 就是主動件(輪轂);標受蒸汽推、在輪轂裡滑進滑出的兩個活塞 A
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const angles = [theta, theta + Math.PI];
    const travel = theta;
    const dots = [];
    // 每個擋板的逆時針側到前面的活塞之間充滿蒸汽
    for (const a of ABUTMENTS) {
      const ahead = Math.min(...angles.map((p) => (((p - a) % TAU) + TAU) % TAU).filter((d) => d > FLAT));
      dots.push(...steamBetween(a + FLAT, a + ahead - deg(4), travel));
    }
    const flows = [
      { fluid: "steam", points: [...dots, ...inlets.flatMap((p) => stream(p, travel, { spacing: 0.18 }))] },
      { fluid: "steam", points: exhausts.flatMap((p) => stream(p, travel, { spacing: 0.18 })) },
    ];
    return {
      parts: {
        hub: { angle: theta },
        piston1: { position: polar(wall(angles[0]), angles[0], 0), angle: angles[0] },
        piston2: { position: polar(wall(angles[1]), angles[1], 0), angle: angles[1] },
      },
      flows,
      readouts: [{ label: "活塞伸出", value: `${(wall(angles[0]) - HUB).toFixed(2)} / ${(wall(angles[1]) - HUB).toFixed(2)}` }],
    };
  },
};
