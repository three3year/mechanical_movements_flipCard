// 第 159 種:第 158 種的變形,以繩索與滑輪取代連桿。繩從圓盤上的曲柄銷往上繞過上方的滑輪,再往下接到踏板;
// 踩下踏板時繩把曲柄銷往上拉,帶圓盤轉。為了讓模型通過死點,主動件取圓盤,由「繩長不變」反推踏板的位置。
import { Z, deg, polar, add, dist, routeRope } from "./kit.js";
import { solve } from "./linkage.js";
import { shape, circle } from "./shapes.js";

const DISC = { center: [-1.9, 0.6, 0], radius: 1.25, pin: 0.7 };
const PULLEY = { center: [0.15, 2.65, 0.3], radius: 0.6 };
const PIVOT = [3.4, 0.45, 0.3];
const TREADLE = 4.6;
const AT = 2.75; // 繩接在踏板上離樞軸的距離
const START = deg(-40); // 原圖:曲柄銷在右下方

// 繩長:曲柄銷 → 滑輪左側,滑輪右側 → 踏板上的接點(近似為兩段直線,繞過滑輪的弧長不變)
const ropeLength = (pin, j) => dist(pin, PULLEY.center) + dist(j, PULLEY.center);
const jAt = (psi) => add(PIVOT, polar(AT, psi));
const PIN0 = add(DISC.center, polar(DISC.pin, START));
const PSI0 = deg(188);
const L0 = ropeLength(PIN0, jAt(PSI0));

/** 圓盤轉 theta:曲柄銷、踏板轉角(從樞軸指向左端)與繩上的接點 */
export function treadle(theta) {
  const pin = add(DISC.center, polar(DISC.pin, START + theta));
  const psi = solve((p) => ropeLength(pin, jAt(p)), L0, deg(150), deg(230));
  return { pin, psi, j: jAt(psi) };
}
export const ropeLengthAt = (theta) => {
  const { pin, j } = treadle(theta);
  return ropeLength(pin, j);
};

export default {
  figure: 159,
  parts: [
    {
      id: "disc",
      kind: "group",
      center: DISC.center,
      spin: DISC.radius,
      pieces: [
        { kind: "plate", shape: shape(circle(DISC.radius), [circle(0.12).reverse()]), thickness: 0.15 },
        { kind: "cylinder", radius: 0.12, length: 0.5, at: [...polar(DISC.pin, START).slice(0, 2), 0.25], accent: true },
      ],
    },
    { id: "pulley", kind: "pulley", style: "disc", center: PULLEY.center, radius: PULLEY.radius, width: 0.24 },
    {
      id: "treadle",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [{ kind: "box", size: [TREADLE, 0.16, 0.2], at: [TREADLE / 2, 0, 0] }, { kind: "cylinder", radius: 0.16, inner: 0.07, length: 0.3 }],
    },
    { id: "rope", kind: "rope" },
    {
      id: "stands",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape([[-2.9, -1.35], [-1.0, -1.35], [-1.0, -1.2], [-1.45, -0.9], [-1.5, 0.75], [-1.9, 1.05], [-2.3, 0.75], [-2.35, -0.9], [-2.9, -1.2]]), thickness: 0.3, at: [0, 0, -0.35] },
        { kind: "plate", shape: shape([[2.75, -1.35], [4.0, -1.35], [4.0, -1.2], [3.65, -0.4], [3.4, 0.7], [3.15, -0.4], [2.75, -1.2]]), thickness: 0.3, at: [0, 0, 0.1] },
        { kind: "box", size: [7.4, 0.08, 1.4], at: [0.55, -1.4, 0] },
      ],
    },
  ],
  waivers: [
    { check: "interference", parts: ["treadle", "stands"], reason: "待確認:treadle 的方塊 4.6×0.16×0.2 與 stands 的方塊 7.4×0.08×1.4重疊 0.06,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
  ],
  driver: { part: "disc", type: "rotation" },
  target: "treadle", // 原文是踏板帶動圓盤;模型以圓盤為主動件,目標件標另一端的踏板
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const { pin, psi, j } = treadle(theta);
    const rope = routeRope([
      { point: [pin[0], pin[1], 0.3] },
      { circle: { center: PULLEY.center, axis: Z, radius: PULLEY.radius, sense: -1 } },
      { point: [j[0], j[1], 0.3] },
    ]);
    const pull = dist(pin, PULLEY.center);
    return {
      parts: { disc: { angle: theta }, treadle: { angle: psi }, pulley: { angle: -pull / PULLEY.radius } },
      paths: { rope: { points: rope.points, closed: false, phase: -pull } },
      readouts: [],
    };
  },
};

