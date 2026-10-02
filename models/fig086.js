// 第 86 種:以旋轉運動驅動往復式泵。承載泵桿的繩索繫在輪 A 上,輪 A 鬆套在軸上;軸帶動凸輪 C 連續旋轉。
// 凸輪每轉一圈,就抓住裝在輪上的鉤形制動裝置 B,把它連同輪一起帶著轉、把繩索抬起;
// 直到制動裝置的末端撞上上方的靜止擋止,制動裝置被釋放,輪便被泵桶的重量拉回原位。主動件是軸(凸輪 C,逆時針)。
import { TAU, deg, polar, smooth } from "./kit.js";
import { shape, circle, arcPoints, stadium } from "./shapes.js";

const R = 1.55; // 輪 A
const LIFT = deg(115); // 帶著輪轉的角度(到撞上擋止為止)
const FALL = deg(40); // 輪被拉回所需的軸轉角
const CATCH = { at: deg(150), r: 0.92, length: 1.15 }; // 制動裝置的樞軸(在輪上)與長度
const ROPE_Y = R + 0.04;

/** 軸轉 c(逆時針):輪 A 的轉角與制動裝置是否鉤住 */
export function pump(c) {
  const k = Math.floor(c / TAU);
  const u = c - k * TAU;
  if (u < LIFT) return { wheel: u, hooked: true };
  if (u < LIFT + FALL) return { wheel: LIFT * (1 - smooth((u - LIFT) / FALL)), hooked: false };
  return { wheel: 0, hooked: false };
}
export const lift = LIFT;

// 凸輪 C:蝸牛形,一處台階抓住制動裝置的鉤
const cam = [...arcPoints(0.38, deg(10), deg(350)).map(([x, y], i, a) => {
  const t = i / (a.length - 1);
  const r = 0.38 + 0.32 * t;
  const ang = Math.atan2(y, x);
  return [r * Math.cos(ang), r * Math.sin(ang)];
}), [0.38 * Math.cos(deg(10)), 0.38 * Math.sin(deg(10))]];

export default {
  figure: 86,
  parts: [
    {
      id: "shaft",
      kind: "group",
      center: [0, 0, 0.35],
      spin: 0.75,
      pieces: [
        { kind: "plate", shape: shape(cam, [circle(0.15).reverse()]), thickness: 0.16, mark: [-0.4, 0.1], markSize: 0.05 },
        { kind: "cylinder", radius: 0.15, length: 1.6, at: [0, 0, -0.5] },
      ],
      label: "C",
      labelOffset: [-0.55, 0.3, 0.2],
    },
    {
      id: "wheel",
      kind: "group",
      spin: R,
      pieces: [
        { kind: "cylinder", radius: R, inner: R - 0.14, length: 0.42 },
        ...[0, 1, 2, 3].map((k) => ({ kind: "box", size: [R - 0.3, 0.14, 0.12], at: [...polar((R - 0.3) / 2 + 0.2, (k * TAU) / 4 + deg(5)).slice(0, 2), 0], angle: (k * TAU) / 4 + deg(5) })),
        { kind: "cylinder", radius: 0.28, inner: 0.17, length: 0.3 },
      ],
      label: "A",
      labelOffset: [1.25, 0.65, 0.3],
    },
    {
      id: "catch",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(stadium(CATCH.length, 0.2).outline, [circle(0.06).reverse()]), thickness: 0.08 },
        { kind: "plate", shape: shape([[CATCH.length - 0.1, 0.1], [CATCH.length + 0.12, 0.25], [CATCH.length + 0.05, 0.02]]), thickness: 0.08 },
        { kind: "cylinder", radius: 0.1, length: 0.2 },
      ],
      label: "B",
      labelOffset: [-0.25, -0.35, 0.2],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape([[-1.4, -2.3], [1.4, -2.3], [0.42, 0.25], [0.38, 0.5], [-0.38, 0.5], [-0.42, 0.25]], [[[-0.85, -2.0], [0.85, -2.0], [0.12, -0.35], [-0.12, -0.35]].reverse(), circle(0.2).reverse()]), thickness: 0.2, at: [0, 0, 0.55] },
        { kind: "box", size: [3.6, 0.15, 0.8], at: [0, -2.4, 0] },
        { kind: "box", size: [0.2, 4.3, 0.4], at: [-2.25, -0.25, 0] },
        { kind: "box", size: [3.7, 0.15, 0.4], at: [-0.5, 1.95, 0] },
        { kind: "box", size: [0.4, 0.25, 0.4], at: [-0.2, 1.75, 0.2] },
      ],
    },
    { id: "rope", kind: "rope" },
  ],
  driver: { part: "shaft", type: "rotation", speed: 0.8 },
  view: { direction: [0.06, 0.05, 1] },
  pose(c) {
    const { wheel, hooked } = pump(c);
    const pivot = polar(CATCH.r, CATCH.at + wheel);
    // 鉤住時制動裝置指向凸輪的台階;釋放後垂落一點
    const tilt = hooked ? deg(-38) : deg(-62);
    return {
      parts: {
        shaft: { angle: c },
        wheel: { angle: wheel },
        catch: { position: [pivot[0], pivot[1], 0.8], angle: CATCH.at + wheel + Math.PI + tilt },
      },
      // 繩索從輪頂往右;輪逆時針轉時繩被捲起(往左走)
      paths: { rope: { points: [[0, ROPE_Y, 0], [3.0, ROPE_Y, 0]], closed: false, phase: wheel * R } },
      readouts: [],
    };
  },
};
