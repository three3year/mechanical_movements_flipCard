// 第 297 種:搭配燈籠輪的擒縱。輪的盤面上一圈立著銷(燈籠輪);搖臂 A 在上方以樞軸吊著,臂上裝兩個擒縱叉瓦 B、C,
// 搖臂來回擺時,B、C 輪流擋住、放開銷,輪依原圖箭頭逆時針一格一格地轉(每擺一次半個銷距)。
// 主動件是搖臂 A;目標件是燈籠輪(擒縱讓它一格一格地放行)。
//
// 由接觸算(models/escapement.js 的 escapeByContact):輪受重錘的固定力矩往逆時針轉,往上走的銷被叉瓦擋住就停;
// 下面的叉瓦 C 從銷圈裡面往外伸、上面的叉瓦 B 從銷圈外面往裡伸,搖臂往左擺時 C 退出、B 伸進來,
// 銷從 C 的末端滑脫,加速走半個銷距碰上 B;往右擺時反過來。
// 推斷:擺幅與銷的數目(依原圖八根)、叉瓦的位置與形狀(兩叉瓦在銷圈上相隔半個銷距;原圖的叉瓦是斜放的直條,
// 模型做成以樞軸為圓心的弧形塊,鎖住時輪才不會被推回);
// 輪軸與搖臂的樞軸裝在後面的夾板條上(原圖沒畫)。
import { TAU, deg, swing } from "./kit.js";
import { escapeByContact, placePoly } from "./escapement.js";
import { shape, circle, thickLine } from "./shapes.js";
import { circlePolygon } from "./contact.js";
import { plateBar } from "./supports.js";

export const PINS = 8;
export const PITCH = TAU / PINS;
export const SWING = deg(8);
const P = [1.15, 2.6]; // 搖臂樞軸
const R = 1.85; // 輪盤
const RP = 1.5; // 銷圈
const PIN = 0.16;
const AT_C = deg(15); // 叉瓦 C 在銷圈上的方位
const AT_B = AT_C + PITCH / 2; // 叉瓦 B:往前半個銷距

const local = (pts) => pts.map(([x, y]) => [x - P[0], y - P[1]]);
// 叉瓦(相對樞軸,搖臂居中時):以樞軸為圓心的弧形塊(擋住銷的面與樞軸同心,鎖住時輪不回退),
// 尖端正好在銷圈中線上;C 從銷圈裡面伸出來,B 從銷圈外面伸進來
function arcPallet(at, length, inward) {
  const p = [RP * Math.cos(at), RP * Math.sin(at)];
  const rho = Math.hypot(p[0] - P[0], p[1] - P[1]);
  const psi = Math.atan2(p[1] - P[1], p[0] - P[0]);
  const dir = inward ? -1 : 1; // 弧往哪邊延伸(繞樞軸):C 往輪心那一側、B 往輪外
  const n = 10;
  const arc = (r) => Array.from({ length: n + 1 }, (_, i) => {
    const a = psi + (dir * length * i) / (n * rho);
    return [r * Math.cos(a), r * Math.sin(a)];
  });
  const outer = arc(rho + 0.06);
  const inner = arc(rho - 0.06).reverse();
  return { poly: [...outer, ...inner], end: [(rho) * Math.cos(psi + (dir * length) / rho), rho * Math.sin(psi + (dir * length) / rho)] };
}
const C_ARC = arcPallet(AT_C, 0.55, true);
const B_ARC = arcPallet(AT_B, 0.6, false);
const PALLET_C = C_ARC.poly;
const PALLET_B = B_ARC.poly;
const pins = Array.from({ length: PINS }, (_, i) => circlePolygon([RP * Math.cos(i * PITCH), RP * Math.sin(i * PITCH)], PIN, 16));

/** 搖臂累計擺動 v → 擺角 */
export const armAngle = (v) => swing(v, -SWING, SWING);
export const escapement = {
  ...escapeByContact({ center: [0, 0], teeth: pins, dir: 1, period: 4 * SWING, stops: (v) => [PALLET_C, PALLET_B].map((p) => placePoly(p, P, armAngle(v))) }),
  period: 4 * SWING,
};
/** 搖臂累計擺動 v → 輪的轉角(逆時針為正,由接觸算) */
export const wheelAngle = escapement.angle;

// 搖臂(相對樞軸):從樞軸往下到 C 的內端;B 用一段支臂接在搖臂上
const C_IN = C_ARC.end;
const B_OUT = B_ARC.end;
const ARM = thickLine([[0, 0], [B_OUT[0] - 0.25, B_OUT[1] + 0.15], [C_IN[0] + 0.05, C_IN[1] + 0.05]], 0.24);

export default {
  figure: 297,
  parts: [
    {
      id: "wheel",
      kind: "group",
      spin: R,
      pieces: [
        { kind: "plate", shape: shape(circle(R), [circle(0.12).reverse()]), thickness: 0.14, circles: [R - 0.12] },
        { kind: "cylinder", radius: 0.3, length: 0.3 },
        { kind: "cylinder", radius: 0.1, length: 0.6, at: [0, 0, -0.35] }, // 輪軸,往後伸進夾板條
        ...Array.from({ length: PINS }, (_, i) => ({ kind: "cylinder", radius: PIN, length: 0.45, at: [RP * Math.cos(i * PITCH), RP * Math.sin(i * PITCH), 0.25], accent: i === 0 })),
      ],
    },
    {
      id: "armA",
      kind: "group",
      center: [...P, 0],
      arrow: false,
      label: "A",
      labelOffset: [0.05, -0.5, 0.4],
      pieces: [
        { kind: "plate", shape: shape(ARM, [circle(0.08).reverse()]), thickness: 0.1, at: [0, 0, 0.55] },
        { kind: "plate", shape: shape(thickLine([[B_OUT[0] - 0.25, B_OUT[1] + 0.15], B_OUT], 0.14)), thickness: 0.1, at: [0, 0, 0.55] },
        { kind: "plate", shape: shape(PALLET_B), thickness: 0.3, at: [0, 0, 0.35] }, // 叉瓦 B
        { kind: "plate", shape: shape(PALLET_C), thickness: 0.3, at: [0, 0, 0.35] }, // 叉瓦 C
        { kind: "cylinder", radius: 0.08, length: 1.1, at: [0, 0, 0.0] }, // 搖臂的樞軸,往後伸進夾板條
      ],
    },
    { id: "frame", kind: "group", pieces: plateBar({ points: [[0, 0], P], z: -0.6 }) },
    { id: "labelB", kind: "group", center: [...P, 0], label: "B", labelOffset: [B_OUT[0] + 0.25, B_OUT[1], 0.6] },
    { id: "labelC", kind: "group", center: [...P, 0], label: "C", labelOffset: [C_IN[0] - 0.2, C_IN[1] - 0.25, 0.6] },
  ],
  // 動力重演:只推搖臂;燈籠輪受固定的力矩(重錘)往逆時針轉,銷由兩個叉瓦輪流擋住、放行
  replay: {
    to: 8 * SWING,
    free: { wheel: { pivot: [0, 0, 0], spring: 1, gravity: false } },
    ignore: [["wheel", "frame"]], // 輪軸插在夾板條的孔裡(孔沒畫出來)
    expect: [
      { at: 2 * SWING, part: "wheel", label: "搖臂擺過一次,輪轉過半個銷距" },
      { at: 4 * SWING, part: "wheel", label: "搖臂一個來回,輪轉過一個銷距" },
      { part: "wheel", label: "搖臂兩個來回,輪轉過兩個銷距", quote: "一根搖臂 A 承載著兩個擒縱叉瓦 B 和 C" },
    ],
  },
  driver: { part: "armA", type: "rotation", cycle: [-SWING, SWING] },
  target: "wheel", // 燈籠輪:擒縱讓它一格一格地放行
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    return { parts: { armA: { angle: armAngle(v) }, wheel: { angle: wheelAngle(v) } }, readouts: [] };
  },
};
