// 第 208 種:銷輪(pin-wheel)與開槽小齒輪,可得到三種速度。銷輪面上有三圈等距的銷(相鄰兩銷的距離都一樣,
// 所以外圈銷多、內圈銷少);開槽小齒輪裝在橫過輪面的軸上,可沿軸滑動,與任一圈銷咬合。輪連續旋轉,小齒輪得到
// 三種不同的速度(反之亦然)。主動件是銷輪;小齒輪在哪一圈是狀態。
// 推斷:三圈各 22、16、10 根銷,小齒輪 10 槽。
import { TAU, X, polar } from "./kit.js";
import { shape, circle } from "./shapes.js";
import { pedestal } from "./supports.js";

const PITCH = 0.55;
const RINGS = { outer: 22, middle: 16, inner: 10 };
const radiusOf = (n) => (n * PITCH) / TAU;
const SLOTS = 10;
const RP = (SLOTS * PITCH) / TAU;
const PIN = { radius: 0.08, length: 0.3 };
const Z = 0.1 + PIN.length * 0.6 + RP; // 小齒輪軸的高度(在輪面之上)
const FLOOR = -radiusOf(RINGS.outer) - 0.75;

/** 輪轉 theta、小齒輪在 ring:小齒輪的轉角(繞 +x)與轉速比 */
export function pinion(theta, ring) {
  const ratio = RINGS[ring] / SLOTS;
  return { angle: -theta * ratio, ratio };
}
export const rings = RINGS;

const pins = Object.values(RINGS).flatMap((n) =>
  Array.from({ length: n }, (_, i) => ({ kind: "cylinder", radius: PIN.radius, length: PIN.length, at: [...polar(radiusOf(n), (i * TAU) / n).slice(0, 2), 0.1 + PIN.length / 2] })),
);
// 開槽小齒輪:圓筒外圍一圈齒(方塊),齒間就是槽;小齒輪的局部 z 是軸向(世界 x)
const slotted = Array.from({ length: SLOTS }, (_, i) => {
  const a = (i * TAU) / SLOTS;
  return { kind: "box", size: [0.2, 0.16, 0.42], at: polar(RP - 0.04, a), angle: a };
});

export default {
  figure: 208,
  parts: [
    {
      id: "wheel",
      kind: "group",
      spin: radiusOf(RINGS.outer) + 0.35,
      pieces: [
        { kind: "plate", shape: shape(circle(radiusOf(RINGS.outer) + 0.3), [circle(0.12).reverse()]), thickness: 0.2 },
        { kind: "cylinder", radius: 0.35, inner: 0.12, length: 0.3, mark: true },
        ...pins,
      ],
    },
    {
      id: "pinion",
      kind: "group",
      axis: X,
      spin: RP,
      posed: true,
      pieces: [{ kind: "cylinder", radius: RP - 0.12, inner: 0.1, length: 0.42, mark: true }, ...slotted],
    },
    // 小齒輪的軸:小齒輪以滑鍵套在軸上(可沿軸移到三圈銷的任一圈),和軸一起轉;鍵條當記號
    {
      id: "shaft",
      kind: "group",
      center: [0, 0, Z],
      axis: X,
      spin: 0.12,
      arrow: false,
      pieces: [{ kind: "cylinder", radius: 0.1, length: 4.8 }, { kind: "box", size: [0.05, 0.05, 3.4], at: [0, 0.1, 0.4], mark: true }],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 推斷(原圖沒畫):輪的固定軸與軸承座、小齒輪軸兩端的軸承與立柱
        { kind: "cylinder", radius: 0.11, length: 0.65, at: [0, 0, -0.25] },
        ...pedestal({ at: [0, 0], z: -0.5, bore: 0.11, floor: FLOOR, depth: 0.2 }),
        ...[-2.3, 2.3].flatMap((x) => [
          { kind: "cylinder", axis: X, radius: 0.18, inner: 0.1, length: 0.16, at: [x, 0, Z] },
          { kind: "box", size: [0.16, -0.16 - FLOOR, 0.16], at: [x, (-0.16 + FLOOR) / 2, Z] },
        ]),
        { kind: "box", size: [5.2, 0.12, 1.4], at: [0, FLOOR - 0.06, 0] },
      ],
    },
  ],
  driver: { part: "wheel", type: "rotation" },
  target: "pinion",
  states: {
    options: [
      { id: "outer", label: "外圈(最快)" },
      { id: "middle", label: "中圈" },
      { id: "inner", label: "內圈(最慢)" },
    ],
    initial: "outer",
  },
  view: { direction: [0.06, 0.05, 1] },
  pose(theta, state = "outer") {
    const { angle, ratio } = pinion(theta, state);
    return {
      parts: { wheel: { angle: theta }, pinion: { position: [-radiusOf(RINGS[state]), 0, Z], angle: angle + Math.PI / SLOTS }, shaft: { angle } }, // 相位:輪上的銷落在小齒輪的槽裡(不是頂在齒條上)
      readouts: [{ label: "小齒輪/輪 轉速", value: ratio.toFixed(1) }],
    };
  },
};
