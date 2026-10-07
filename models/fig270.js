// 第 270 種:皮帶輪用的抗摩擦軸承。左圖是皮帶輪的外觀(輪轂上的螺栓與轉向箭頭),
// 右圖是拿掉蓋板的同一個輪:固定的軸與輪的內孔之間夾著一圈六個滾子,輪轉動時滾子在兩者之間滾動,
// 一邊自轉、一邊繞軸公轉(像行星齒輪,軸就是不動的太陽輪)。皮帶從輪頂繞過、兩股往下。
// 兩張圖並排,主動件是皮帶輪,拖任一個都一起轉。
// 推斷:滾子無滑動地滾動(原文只有名稱);兩根軸後面的支座。
import { Z, TAU, routeRope, beltTravel } from "./kit.js";
import { shape, circle } from "./shapes.js";
import { pedestal } from "./supports.js";

const R = 1.4; // 輪外徑
const BORE = 0.86; // 輪的內孔
const SHAFT = 0.3;
const ROLLER = (BORE - SHAFT) / 2;
const ROLLERS = 6;
const AT = { left: [-1.8, 0, 0], right: [1.8, 0, 0] };

/** 輪轉 angle:滾子保持架(滾子中心)的公轉角與滾子的自轉角(軸不動) */
export function rollers(angle) {
  const carrier = (angle * BORE) / (BORE + SHAFT);
  const spin = (carrier * (SHAFT + ROLLER)) / ROLLER;
  return { carrier, spin };
}
export const geometry = { BORE, SHAFT, ROLLER };

const belt = (c) => routeRope([{ point: [c[0] - R - 0.05, -2.3, 0] }, { circle: { center: c, axis: Z, radius: R + 0.05, sense: -1 } }, { point: [c[0] + R + 0.05, -2.3, 0] }]);
const belts = { left: belt(AT.left), right: belt(AT.right) };
const travel = (angle) => beltTravel(angle, R + 0.05, -1);

export default {
  figure: 270,
  parts: [
    {
      id: "pulleyL",
      kind: "plate",
      center: AT.left,
      shape: shape(circle(R), [circle(0.2).reverse()]),
      thickness: 0.4,
      circles: [R - 0.2, 0.62],
      spin: R,
      mark: [R - 0.1, 0],
      markSize: 0.08,
      pieces: Array.from({ length: 6 }, (_, i) => ({ kind: "cylinder", radius: 0.06, length: 0.5, at: [0.45 * Math.cos((i * TAU) / 6), 0.45 * Math.sin((i * TAU) / 6), 0] })),
    },
    {
      id: "pulleyR",
      kind: "plate",
      center: AT.right,
      shape: shape(circle(R), [circle(BORE).reverse()]),
      thickness: 0.4,
      circles: [R - 0.2],
      spin: R,
      mark: [R - 0.1, 0],
      markSize: 0.08,
    },
    { id: "shaft", kind: "cylinder", center: AT.right, radius: SHAFT, length: 0.7, pieces: [{ kind: "cylinder", radius: 0.2, length: 0.6, at: [0, 0, -0.5] }] }, // 不動的軸,後端固定在支座上
    {
      id: "stands",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: 0.2, length: 0.9, at: [AT.left[0], AT.left[1], -0.15] }, // 左圖皮帶輪的軸
        ...pedestal({ at: AT.left, z: -0.75, bore: 0.2, floor: -2.6 }),
        ...pedestal({ at: AT.right, z: -0.75, bore: 0.2, floor: -2.6 }),
      ],
    },
    ...Array.from({ length: ROLLERS }, (_, i) => ({ id: `roller${i}`, kind: "plate", shape: shape(circle(ROLLER - 0.01), [circle(0.06).reverse()]), thickness: 0.36, mark: [ROLLER * 0.55, 0], markSize: 0.05, arrow: false })),
    { id: "beltL", kind: "rope", radius: 0.05 },
    { id: "beltR", kind: "rope", radius: 0.05 },
  ],
  driver: { part: "pulleyL", grips: ["pulleyR"], type: "rotation" },
  target: "roller0", // 抗摩擦軸承的滾子(六個相同,標一個代表:看得出它一邊自轉一邊繞軸公轉)
  view: { direction: [0.04, 0.05, 1] },
  pose(angle) {
    const { carrier, spin } = rollers(angle);
    const parts = { pulleyL: { angle }, pulleyR: { angle } };
    for (let i = 0; i < ROLLERS; i++) {
      const a = carrier + (i * TAU) / ROLLERS;
      const d = SHAFT + ROLLER;
      parts[`roller${i}`] = { position: [AT.right[0] + d * Math.cos(a), d * Math.sin(a), 0], angle: spin };
    }
    const phase = travel(angle);
    return {
      parts,
      paths: { beltL: { points: belts.left.points, closed: false, phase }, beltR: { points: belts.right.points, closed: false, phase } },
      readouts: [],
    };
  },
};
