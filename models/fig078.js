// 第 78 種:第 77 種的變形。A 字形支架頂上的槓桿以手柄 B 上下扳動,槓桿兩端各掛一根棘爪:
// B 往下時左端上升,左棘爪把棘輪 A 的左側往上拉;B 往上時右端上升,右棘爪把輪頂往右拉。
// 兩根棘爪交替作動,A 幾乎連續地順時針轉(原圖箭頭)。主動量是槓桿的累計擺動量。
import { deg, swing as swingAt } from "./kit.js";
import { circleCircle, bodyPoint } from "./linkage.js";
import { doubleAction } from "./ratchets.js";
import { ratchetShape, shape, stadium, circle } from "./shapes.js";

const WHEEL = { center: [0, 0, 0], teeth: 30, outer: 1.68, inner: 1.48, dir: -1 };
const PIVOT = [0, 2.2, 0.35];
const PINS = { left: [-0.78, 0], right: [0.78, 0] };
const PAWL = { left: 1.62, right: 1.38 };
const RIM = 1.6; // 爪尖落在齒的半徑
const SWING = deg(16);

// 左爪尖在輪的左側(取左方交點);右爪尖在輪頂偏左(取上方交點)
const tip = (which, psi) => {
  const pin = bodyPoint(PIVOT, psi, PINS[which]);
  return circleCircle(pin, PAWL[which], WHEEL.center, RIM, -1).point;
};
const tipAngle = (which) => (psi) => Math.atan2(tip(which, psi)[1], tip(which, psi)[0]);

/** 主動量 v:棘輪 A 的轉角(順時針為負)。ψ 增加(B 往上)時右爪拉、減少時左爪拉 */
export const wheelAngle = (v) => doubleAction(v, -SWING / 2, SWING / 2, tipAngle("right"), tipAngle("left"));
export const swing = SWING;

const frame = shape([
  [-1.95, -1.95],
  [-1.2, -1.95],
  [-0.3, 1.0],
  [-0.12, 1.0],
  [-0.45, 0.25],
  [0.45, 0.25],
  [0.12, 1.0],
  [0.3, 1.0],
  [1.2, -1.95],
  [1.95, -1.95],
  [0.25, 2.3],
  [-0.25, 2.3],
]);

export default {
  figure: 78,
  parts: [
    {
      id: "wheel",
      kind: "plate",
      shape: ratchetShape({ ...WHEEL, bore: 0.12 }),
      thickness: 0.16,
      hub: 0.25,
      circles: [1.3, 0.35],
      mark: [1.0, 0],
      markSize: 0.09,
      spin: WHEEL.outer,
      label: "A",
      labelOffset: [2.1, -0.2, 0.3],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: frame, thickness: 0.18, at: [0, 0, 0.18] },
        { kind: "box", size: [4.4, 0.06, 0.6], at: [0, -2.0, 0] },
      ],
    },
    {
      id: "lever",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(stadium(3.98, 0.3).outline.map(([x, y]) => [x - 0.98, y]), [circle(0.1).reverse()]), thickness: 0.1 },
        { kind: "cylinder", radius: 0.14, length: 0.2 },
        { kind: "cylinder", radius: 0.06, length: 0.3, at: [...PINS.left, 0] },
        { kind: "cylinder", radius: 0.06, length: 0.3, at: [...PINS.right, 0] },
      ],
      label: "B",
      labelOffset: [2.6, 0.32, 0],
    },
    { id: "pawlLeft", kind: "link", width: 0.13, thickness: 0.06 },
    { id: "pawlRight", kind: "link", width: 0.11, thickness: 0.06 },
  ],
  driver: { part: "lever", type: "rotation", cycle: [-SWING / 2, SWING / 2] },
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const psi = swingAt(v, -SWING / 2, SWING / 2);
    const z = PIVOT[2] + 0.12;
    const pin = (w) => [...bodyPoint(PIVOT, psi, PINS[w]).slice(0, 2), z];
    const tipAt = (w) => [...tip(w, psi).slice(0, 2), z];
    return {
      parts: {
        lever: { angle: psi },
        wheel: { angle: wheelAngle(v) },
        pawlLeft: { from: pin("left"), to: tipAt("left") },
        pawlRight: { from: pin("right"), to: tipAt("right") },
      },
      readouts: [],
    };
  },
};

