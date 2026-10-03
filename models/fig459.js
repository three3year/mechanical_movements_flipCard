// 第 459 種:水井用的往復式升降機。上面是裝在軸上的水平風車輪,軸上有螺紋(蝸桿)。軸的接頭容許些微擺動,
// 讓蝸桿一次只咬一個蝸輪。蝸輪後面有滑輪,繩子繞過滑輪,兩端各掛一個水桶。中間是一個撥爪,水桶上升時撞到它,
// 經一根搖臂(蝸桿與軸的軸承就裝在搖臂上)把蝸桿從一個輪移到另一個輪,於是倒完水的水桶被放下,另一個被抬起。
// 主動件是風車輪(一直朝同一方向轉)。
// 推斷:兩個蝸輪在蝸桿左右,被咬住的那個帶著滑輪轉;水桶到頂時撞撥爪、蝸桿換邊,水桶的走向反過來;
// 上升的水桶是滿的,到頂把水倒進水槽。
import { TAU, deg, quatFromZ, quatMul, quatAxisAngle, Y } from "./kit.js";
import { shape, rect } from "./shapes.js";

const SHAFT_X = 0;
export const WHEELS = [[-0.55, 0.9, 0], [0.55, 0.9, 0]]; // 兩個蝸輪(軸沿 z)
const WHEEL_R = 0.42;
const DRUM_R = 0.3; // 蝸輪後面的滑輪
export const TOP = 0.0; // 水桶在上面(撞撥爪)
export const BOTTOM = -2.4; // 水桶在井裡
const RATIO = 1 / 24; // 風車轉一圈,蝸輪轉 1/24 圈
const TRAVEL = TOP - BOTTOM;

/** 風車轉角 w → 水桶的位置(左桶高度)、被咬住的蝸輪、走向 */
export function lift(w) {
  const s = w * RATIO * DRUM_R; // 繩子累計走過的長度(倒轉時為負,水桶跟著倒走)
  const n = Math.floor(s / TRAVEL);
  const f = s / TRAVEL - n;
  const leftUp = ((n % 2) + 2) % 2 === 0; // 偶數段:左桶往上
  const left = leftUp ? BOTTOM + f * TRAVEL : TOP - f * TRAVEL;
  return { left, right: TOP + BOTTOM - left, leftUp, engaged: leftUp ? 0 : 1, drum: (left - BOTTOM) / DRUM_R };
}

const wormWheel = (id, at) => ({
  id,
  kind: "group",
  center: at,
  arrow: false,
  pieces: [
    { kind: "gear", teeth: 12, radius: WHEEL_R, width: 0.12 },
    { kind: "cylinder", radius: DRUM_R, length: 0.25, at: [0, 0, -0.25] },
    { kind: "cylinder", radius: 0.05, length: 0.8, at: [0, 0, -0.2] },
  ],
});
const bucketPart = (id) => ({ id, kind: "lathe", axis: Y, profile: [[0.18, -0.22], [0.23, 0.22], [0.2, 0.22], [0.15, -0.18], [0, -0.18], [0, -0.22]], arrow: false, pieces: [{ kind: "box", size: [0.48, 0.03, 0.03], at: [0, 0.28, 0] }] });

export default {
  figure: 459,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [3.4, 0.12, 0.6], at: [0, 2.6, -0.4] },
        { kind: "box", size: [0.12, 4.6, 0.12], at: [-1.6, 0.4, -0.4] },
        { kind: "box", size: [0.12, 4.6, 0.12], at: [1.6, 0.4, -0.4] },
        // 井口的水槽(左)與井壁
        { kind: "plate", shape: shape(rect(0.9, 0.5, -1.5, -0.15), [rect(0.8, 0.45, -1.5, -0.12).reverse()]), thickness: 0.6 },
        { kind: "box", size: [0.15, 1.2, 1.0], at: [-0.25, -0.75, 0] },
        { kind: "box", size: [0.15, 1.2, 1.0], at: [1.2, -0.75, 0] },
      ],
    },
    {
      id: "windmill",
      kind: "group",
      axis: Y,
      center: [SHAFT_X, 2.95, 0],
      spin: 1.4,
      pieces: [
        { kind: "cylinder", radius: 1.25, length: 0.18 },
        ...Array.from({ length: 16 }, (_, i) => ({ kind: "box", size: [0.08, 0.3, 0.25], at: [1.25 * Math.cos((i * TAU) / 16), 1.25 * Math.sin((i * TAU) / 16), 0], angle: (i * TAU) / 16 })),
      ],
    },
    // 軸與蝸桿(裝在搖臂上,可以左右偏一點)
    { id: "worm", kind: "group", axis: Y, arrow: false, pieces: [{ kind: "cylinder", radius: 0.06, length: 2.0, at: [0, 0, 0.6] }, { kind: "worm", radius: 0.14, length: 0.7, pitch: 0.12, thread: 0.05 }] },
    wormWheel("wheelL", WHEELS[0]),
    wormWheel("wheelR", WHEELS[1]),
    { id: "tappet", kind: "plate", shape: shape([[-0.95, 0.12], [0, 0], [0.95, 0.12], [0.9, 0.18], [0, 0.06], [-0.9, 0.18]]), thickness: 0.12, arrow: false, pieces: [{ kind: "box", size: [0.05, 0.45, 0.05], at: [0, 0.22, 0] }] },
    { id: "ropeL", kind: "rope", radius: 0.015 },
    { id: "ropeR", kind: "rope", radius: 0.015 },
    bucketPart("bucketL"),
    bucketPart("bucketR"),
    { id: "waterL", kind: "fill", fluid: "water", shape: "cylinder", size: [0.34, 0.36, 0], level: 0 },
    { id: "waterR", kind: "fill", fluid: "water", shape: "cylinder", size: [0.34, 0.36, 0], level: 0 },
    { id: "well", kind: "fill", fluid: "water", center: [0.47, -2.5, 0], size: [1.3, 0.5, 0.9], level: 1 },
  ],
  driver: { part: "windmill", type: "rotation", speed: 1.2 },
  targets: ["bucketL", "bucketR"],
  view: { direction: [0.12, 0.15, 1] },
  pose(w) {
    const l = lift(w);
    const shift = l.engaged === 0 ? -0.06 : 0.06; // 蝸桿偏向被咬住的那個輪
    const wormAt = [SHAFT_X + shift, 0.9, 0];
    // 兩個滑輪被繩子連著一起轉;水桶各掛在外側
    const xL = WHEELS[0][0] - DRUM_R;
    const xR = WHEELS[1][0] + DRUM_R;
    const hang = (x, y) => [[x, WHEELS[0][1], -0.25], [x, y + 0.28, -0.25]];
    const parts = {
      windmill: { angle: w },
      worm: { position: wormAt, rotation: quatMul(quatFromZ(Y), quatAxisAngle([0, 0, 1], w)) },
      wheelL: { angle: l.drum },
      wheelR: { angle: -l.drum },
      // 撥爪:上升的水桶把它那一邊頂高
      tappet: { position: [0, TOP + 0.5, -0.25], angle: l.leftUp ? deg(-6) : deg(6) },
      bucketL: { position: [xL, l.left, -0.25] },
      bucketR: { position: [xR, l.right, -0.25] },
      waterL: { position: [xL, l.left, -0.25], level: l.leftUp ? 0.85 : 0 },
      waterR: { position: [xR, l.right, -0.25], level: l.leftUp ? 0 : 0.85 },
    };
    return {
      parts,
      // 繩從滑輪上放下來:繩端在水桶,路徑起點(滑輪)處的繩隨長度進出
      paths: { ropeL: { points: hang(xL, l.left), closed: false, phase: -(WHEELS[0][1] - l.left) }, ropeR: { points: hang(xR, l.right), closed: false, phase: -(WHEELS[0][1] - l.right) } },
      readouts: [{ label: "蝸桿咬著", value: l.engaged === 0 ? "左輪:左桶上升(滿)、右桶下降" : "右輪:右桶上升(滿)、左桶下降" }],
    };
  },
};
