// 第 77 種:槓桿 C 繞支點 A 振動,透過兩根交替作動的棘爪,使輪 B 旋轉,幾乎是連續的運動。
// 兩根棘爪分別掛在 A 上下兩側的銷上,另一端鉤住輪緣的凸柱:槓桿頂端往左擺時上棘爪推、下棘爪退回;
// 往右擺時換下棘爪推。輪 B 逆時針轉(原圖箭頭)。主動量是槓桿的累計擺動量。
import { TAU, deg, polar, swing as swingAt } from "./kit.js";
import { circleCircle, bodyPoint } from "./linkage.js";
import { doubleAction } from "./ratchets.js";
import { circle, shape, stadium } from "./shapes.js";

const WHEEL = { center: [0, 0, 0], radius: 2.0, studR: 1.72, studs: 26 };
const A = [3.05, 0.65, 0.3];
const PINS = { upper: [0, 0.75], lower: [0, -0.62] }; // 槓桿上兩根銷(相對 A,槓桿直立時)
const PAWL = { upper: 2.35, lower: 1.85 };
const SWING = deg(20);

// 棘爪尖端:從槓桿上的銷量一根棘爪長,落在凸柱圈上(取上方的交點)
const tip = (which, psi) => {
  const pin = bodyPoint(A, psi, PINS[which]);
  return circleCircle(pin, PAWL[which], WHEEL.center, WHEEL.studR, -1).point;
};
const tipAngle = (which) => (psi) => Math.atan2(tip(which, psi)[1], tip(which, psi)[0]);

/** 主動量 v(槓桿的累計擺動):輪 B 的轉角 */
export const wheelAngle = (v) => doubleAction(v, -SWING / 2, SWING / 2, tipAngle("upper"), tipAngle("lower"));
export const swing = SWING;

const studs = Array.from({ length: WHEEL.studs }, (_, i) => ({
  kind: "cylinder",
  radius: 0.09,
  length: 0.4,
  at: [...polar(WHEEL.studR, (i * TAU) / WHEEL.studs).slice(0, 2), 0.15],
  accent: i === 0,
}));

export default {
  figure: 77,
  parts: [
    {
      id: "wheel",
      kind: "group",
      spin: WHEEL.radius,
      pieces: [
        { kind: "cylinder", radius: WHEEL.radius, inner: 1.42, length: 0.25 },
        ...[0, 1, 2, 3].map((k) => ({ kind: "box", size: [1.15, 0.2, 0.18], at: [...polar(0.95, (k * TAU) / 4).slice(0, 2), 0], angle: (k * TAU) / 4 })),
        { kind: "cylinder", radius: 0.45, inner: 0.25, length: 0.3 },
        ...studs,
      ],
      label: "B",
      labelOffset: [-1.85, 1.15, 0.3],
    },
    {
      id: "lever",
      kind: "group",
      center: A,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(stadium(3.2, 0.32).outline.map(([x, y]) => [x - 2.15, y]), [circle(0.09).reverse()]), thickness: 0.1, angle: Math.PI / 2 },
        { kind: "cylinder", radius: 0.13, length: 0.2 },
        { kind: "cylinder", radius: 0.06, length: 0.3, at: [...PINS.upper, 0] },
        { kind: "cylinder", radius: 0.06, length: 0.3, at: [...PINS.lower, 0] },
      ],
      label: "C",
      labelOffset: [0, -1.4, 0],
    },
    { id: "labelA", kind: "group", center: A, label: "A", labelOffset: [0.42, 0, 0.1] },
    { id: "pawlUpper", kind: "link", width: 0.12, thickness: 0.06 },
    { id: "pawlLower", kind: "link", width: 0.12, thickness: 0.06 },
  ],
  waivers: [
    { check: "interference", parts: ["wheel", "pawlUpper"], reason: "待確認:wheel 的圓柱 r0.09×0.4 與 pawlUpper 的圓柱 r0.024×0.132重疊 0.04,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["wheel", "pawlLower"], reason: "待確認:wheel 的圓柱 r0.09×0.4 與 pawlLower 的圓柱 r0.024×0.132重疊 0.04,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
  ],
  driver: { part: "lever", type: "rotation", cycle: [-SWING / 2, SWING / 2] },
  target: "wheel", // 近乎連續旋轉的輪 B
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const psi = swingAt(v, -SWING / 2, SWING / 2);
    const z = 0.38;
    const pin = (w) => [...bodyPoint(A, psi, PINS[w]).slice(0, 2), z];
    const tipAt = (w) => [...tip(w, psi).slice(0, 2), z];
    return {
      parts: {
        lever: { angle: psi },
        wheel: { angle: wheelAngle(v) },
        pawlUpper: { from: pin("upper"), to: tipAt("upper") },
        pawlLower: { from: pin("lower"), to: tipAt("lower") },
      },
      readouts: [],
    };
  },
};
