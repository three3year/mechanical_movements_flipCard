// 第 280 種:操作絞盤的一種方式。右邊的長手動槓桿繞上端的樞軸來回扳動,經連桿帶動短槓桿;短槓桿以銷裝在
// 一個鑄鐵塊上,鐵塊的兩個夾爪以凸緣扣住輪緣內側。短槓桿外端往上時,輪緣被夾在槓桿末端與鐵塊凸緣之間,
// 摩擦力帶著輪轉;短槓桿往下推時鬆開,鐵塊沿輪緣滑回去。輪的倒轉由一般的棘輪與棘爪擋住。
// 主動件是長手動槓桿(累計行程:往上那一程帶輪轉,往下那一程輪不動)。
// 推斷:各桿長與夾爪的位置(依原圖);短槓桿夾緊時多轉的小角度。
import { deg, swingPhase } from "./kit.js";
import { circleCircle, angleOf } from "./linkage.js";
import { pawlRest } from "./ratchets.js";
import { ratchetShape, shape, circle, thickLine } from "./shapes.js";

const C = [-1.15, -0.55, 0]; // 輪心
const RIM = 1.4;
const SHORT = 0.95; // 短槓桿從鐵塊上的銷到外端
const T = [1.55, 2.25, 0]; // 長槓桿的樞軸
const DL = 2.5; // 樞軸到連桿接點
const LONG = 4.1;
const FROM = deg(-28);
const TO = deg(4); // 鐵塊在輪緣上來回的角度範圍(從輪心量)
const GRIP = deg(4); // 夾緊時短槓桿多轉的角度
const RATCHET = { teeth: 18, outer: 0.62, inner: 0.48, dir: 1 };
const PAWL = { pivot: [C[0] - 1.05, C[1] + 0.75, 0.3], length: 0.62 };

const shortEnd = (phi, grip) => {
  const pin = [C[0] + RIM * Math.cos(phi), C[1] + RIM * Math.sin(phi), 0];
  const a = phi + grip;
  return { pin, end: [pin[0] + SHORT * Math.cos(a), pin[1] + SHORT * Math.sin(a), 0], angle: a };
};
const LINK = 1.6;

/** 主動量 v(鐵塊沿輪緣的累計行程)→ 鐵塊位置角、輪的轉角、短槓桿與長槓桿的姿勢 */
export function capstan(v) {
  const { at, cycle, forward } = swingPhase(v, FROM, TO);
  const span = TO - FROM;
  const wheel = cycle * span + (forward ? at - FROM : span);
  const grip = forward ? GRIP : 0;
  const s = shortEnd(at, grip);
  const joint = circleCircle(T, DL, s.end, LINK, 1).point;
  return { block: at, wheel, forward, short: s, joint, long: angleOf(T, joint) };
}
export const geometry = { FROM, TO };

const wheelPieces = [
  { kind: "cylinder", radius: RIM + 0.12, inner: RIM - 0.08, length: 0.42 },
  { kind: "plate", shape: shape(circle(RIM - 0.05), [circle(0.25).reverse()]), thickness: 0.12, at: [0, 0, -0.12] },
  { kind: "cylinder", radius: 0.3, length: 0.6 },
  { kind: "plate", shape: ratchetShape({ ...RATCHET, bore: 0.12 }), thickness: 0.14, at: [0, 0, 0.3] },
];

export default {
  figure: 280,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.42, 5.2, 0.4], at: [1.2, -0.2, -0.45] },
        { kind: "box", size: [0.42, 5.2, 0.4], at: [-0.35, -0.2, -0.75] },
        { kind: "plate", shape: shape(thickLine([[-0.35, 1.6], [1.2, 2.55]], 0.3)), thickness: 0.3, at: [0, 0, -0.6] },
        { kind: "cylinder", radius: 0.12, length: 0.9, at: [T[0], T[1], -0.24] },
        { kind: "cylinder", radius: 0.03, length: 0.22, at: [PAWL.pivot[0], PAWL.pivot[1], 0.34] }, // 止回爪的樞軸銷(在輪緣的前面)
      ],
    },
    { id: "wheel", kind: "group", center: C, spin: RIM + 0.12, pieces: [...wheelPieces, { kind: "box", size: [0.2, 0.2, 0.46], at: [RIM + 0.02, 0, 0], accent: true }] },
    { id: "pawl", kind: "plate", shape: shape(thickLine([[0, 0], [PAWL.length, 0]], 0.1), [circle(0.04).reverse()]), thickness: 0.1, arrow: false },
    {
      id: "block",
      kind: "group",
      arrow: false,
      pieces: [
        // 鑄鐵塊:跨在輪緣上,兩個夾爪的凸緣扣住輪緣內側(局部 +x 朝輪外)
        { kind: "box", size: [0.3, 0.42, 0.5], at: [0.28, 0, 0] }, // 鐵塊的本體在輪緣外側,兩片爪跨在輪緣兩面
        { kind: "box", size: [0.12, 0.42, 0.16], at: [-0.28, 0, 0.28] },
        { kind: "box", size: [0.12, 0.42, 0.16], at: [-0.28, 0, -0.28] },
      ],
    },
    { id: "short", kind: "link", width: 0.14, thickness: 0.08 },
    { id: "link", kind: "link", width: 0.1, thickness: 0.06 },
    {
      id: "long",
      kind: "group",
      center: T,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[0, 0], [LONG - 0.6, 0]], 0.16), [circle(0.06).reverse()]), thickness: 0.12, at: [0, 0, 0.28] },
        { kind: "lathe", axis: [1, 0, 0], profile: [[0.06, 0], [0.13, 0.15], [0.1, 0.6], [0, 0.65]], at: [LONG - 0.62, 0, 0.28] },
      ],
    },
  ],
  driver: { part: "long", type: "rotation", cycle: [FROM, TO] },
  target: "wheel", // 被夾著一步步轉的絞盤輪
  view: { direction: [0.04, 0.05, 1] },
  pose(v) {
    const c = capstan(v);
    const p = pawlRest({ pivot: PAWL.pivot, length: PAWL.length, from: deg(70), into: -1 }, { center: C, angle: c.wheel, ...RATCHET });
    return {
      parts: {
        wheel: { angle: c.wheel },
        block: { position: [c.short.pin[0], c.short.pin[1], 0.0], angle: c.block },
        short: { from: [...c.short.pin.slice(0, 2), 0.3], to: [...c.short.end.slice(0, 2), 0.3] },
        link: { from: [...c.short.end.slice(0, 2), 0.38], to: [c.joint[0], c.joint[1], 0.38] },
        long: { angle: c.long },
        pawl: { position: PAWL.pivot, angle: p.angle },
      },
      readouts: [],
    };
  },
};
