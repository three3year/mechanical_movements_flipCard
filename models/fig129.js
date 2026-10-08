// 第 129 種:中式絞盤,與千分螺桿(第 111 種)同一個原理。絞盤鼓輪分大小兩段,繩在兩段上的纏繞方向相反,
// 中間垂下的繩圈掛著一個滑輪(下接吊鉤)。轉一圈時,大段捲進一個大圓周、小段放出一個小圓周,
// 滑輪上升兩者圓周差的一半。主動件是絞盤(在可捲的圈數內往返)。
// 繩的兩端各捲在鼓輪的一段上(原圖兩段都繞著好幾圈):大段那頭從繩垂下的地方往左一圈圈捲到繩頭,
// 小段那頭往右;鼓輪轉動時捲在鼓上的繩跟著鼓轉,大段多捲一圈、小段放出一圈,繩頭跟著鼓的轉角走。
// 繩在大段上繞過鼓的後方、在小段上繞過前方,鼓同一個轉向才會一邊捲進、一邊放出(見 pose 的說明)。
import { X, TAU, routeRope, Z } from "./kit.js";

const R1 = 0.62; // 大段半徑
const R2 = 0.42; // 小段半徑
const DRUM_Y = 2.2;
const X1 = -0.9; // 繩從大段垂下的位置
const X2 = 0.75; // 繩從小段垂下的位置
const PULLEY = { radius: (X2 - X1) / 2, x: (X1 + X2) / 2 };
const Y0 = -0.6; // 滑輪起始高度
const TURNS = 1.6; // 滑輪升到快碰到絞盤的凸緣為止
const COIL = { pitch: 0.1, lift: 0.03, big: 6, small: 4 }; // 相鄰兩圈的間距、繩心離鼓面的高度、起始時兩段各捲幾圈

/** 絞盤轉 theta(大段捲進為正):滑輪的高度 */
export const pulleyY = (theta) => Y0 + ((R1 - R2) * theta) / 2;
export const radii = [R1, R2];

// 捲在鼓上的繩:繩從鼓底(角 0,繩垂下的切點)繞到角 a 的一點;side = −1 繞過後方、+1 繞過前方,
// 每繞一圈沿軸挪一個間距(dir 決定往左或往右)
const coilPoint = (x0, r, side, dir, a) => [x0 + (dir * COIL.pitch * a) / TAU, DRUM_Y - r * Math.cos(a), side * r * Math.sin(a)];
function coil(x0, r, side, dir, turnsAngle) {
  const n = Math.max(2, Math.ceil((turnsAngle / TAU) * 16));
  return Array.from({ length: n + 1 }, (_, i) => coilPoint(x0, r + COIL.lift, side, dir, (turnsAngle * i) / n));
}
/** 絞盤轉 theta:大段、小段上各捲著幾圈 */
export const coilTurns = (theta) => ({ big: COIL.big + theta / TAU, small: COIL.small - theta / TAU });

export default {
  figure: 129,
  parts: [
    {
      id: "drum",
      kind: "group",
      center: [0, DRUM_Y, 0],
      axis: X,
      spin: R1,
      spinOffset: -2.0,
      pieces: [
        { kind: "cylinder", radius: R1, length: 1.4, at: [0, 0, -1.4], mark: true },
        { kind: "cylinder", radius: R2, length: 1.2, at: [0, 0, 1.2], mark: true },
        { kind: "cylinder", radius: R1 + 0.3, length: 0.12, at: [0, 0, -2.15] },
        { kind: "cylinder", radius: R1 + 0.3, length: 0.12, at: [0, 0, -0.65] },
        { kind: "cylinder", radius: R2 + 0.25, length: 0.12, at: [0, 0, 1.85] },
        { kind: "cylinder", radius: 0.12, length: 4.8, at: [0, 0, 0] },
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.22, DRUM_Y + 2.2, 0.4], at: [-2.45, DRUM_Y / 2 - 0.85, 0] },
        { kind: "box", size: [0.22, DRUM_Y + 2.2, 0.4], at: [2.25, DRUM_Y / 2 - 0.85, 0] },
        { kind: "box", size: [5.6, 0.12, 0.8], at: [-0.1, -2.0, 0] }, // 底樑在吊鉤最低處的下方
      ],
    },
    {
      id: "pulley",
      kind: "pulley",
      style: "disc",
      center: [PULLEY.x, Y0, 0],
      radius: PULLEY.radius,
      width: 0.24,
      pieces: [
        { kind: "box", size: [0.3, 0.75, 0.3], at: [0, -0.3, 0.2] },
        { kind: "tube", points: [[0, -0.7, 0.2], [0.02, -1.0, 0.2], [0.2, -1.2, 0.2], [0.3, -1.0, 0.2], [0.25, -0.85, 0.2]], radius: 0.05 },
      ],
    },
    { id: "rope", kind: "rope" },
  ],
  driver: { part: "drum", type: "rotation", range: [0, TURNS * TAU] },
  target: "pulley", // 被吊起的滑輪(下接吊鉤)
  view: { direction: [0.06, 0.08, 1] },
  pose(theta) {
    const y = pulleyY(theta);
    const turns = coilTurns(theta);
    // 鼓繞 x 軸轉 theta 時鼓底往後(−z)走:大段的繩繞過後方,鼓底把垂下的繩往上帶(捲進);
    // 小段的繩繞過前方,前方的繩轉到鼓底後放下去(放出)。捲著的部分跟著鼓轉:繩頭的角 = 圈數 × 一圈
    const big = coil(X1, R1, -1, -1, turns.big * TAU).reverse(); // 從繩頭(捲在最裡面)繞到鼓底的切點
    const small = coil(X2, R2, 1, 1, turns.small * TAU); // 從鼓底的切點繞到繩頭
    const middle = routeRope([
      { point: [X1, DRUM_Y - R1 - COIL.lift, 0] },
      { circle: { center: [PULLEY.x, y, 0], axis: Z, radius: PULLEY.radius, sense: 1 } },
      { point: [X2, DRUM_Y - R2 - COIL.lift, 0] },
    ]);
    // 繩的起點是大段上的繩頭,固定在鼓上跟著轉,所以記號不另外移相:繩心離繩頭的弧長就是材料座標
    const points = [...big, ...middle.points.slice(1, -1), ...small];
    return {
      parts: { drum: { angle: theta }, pulley: { position: [PULLEY.x, y, 0], angle: -(((R1 + R2) / 2) * theta) / PULLEY.radius } },
      paths: { rope: { points, closed: false, phase: 0 } },
      readouts: [],
    };
  },
};
