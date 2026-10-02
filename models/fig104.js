// 第 104 種:螺紋切削與滑動車床上的螺桿與輪。螺桿轉動時把旋轉傳給輪(像蝸桿帶蝸輪);
// 或者螺桿固定不轉、轉動輪時,輪的齒沿著螺紋滾動,像小齒輪在齒條上,把直線運動傳給承載輪軸的滑塊。
// 主動量是輪的轉角(拖螺桿也行);狀態切換兩種用法。輪的齒始終落在螺紋之間(同第 31 種的算法)。
import { TAU, X } from "./kit.js";
import { shape } from "./shapes.js";

const WHEEL = { teeth: 18, radius: 1.0 };
const PITCH = (TAU * WHEEL.radius) / WHEEL.teeth;
const WORM = { radius: 0.36, length: 4.6, y: 1.0 + 0.36 - 0.03 };
const RANGE = 1.3; // 輪轉角的範圍(滑塊因此移動 ±R·1.3)

// 螺紋在螺桿底部(朝輪)的軸向位置(見第 31 種)
const crestX = (theta) => -WORM.length / 2 + ((-Math.PI / 2 - theta) / TAU) * PITCH;
// 輪中心在 x、螺桿轉角 theta 時,讓頂端的齒落在兩道螺紋之間的輪轉角
const meshWheel = (theta, x) => Math.PI / 2 - (crestX(theta) - x + PITCH / 2) / WHEEL.radius;
// 反過來:輪中心在 0、輪轉角 alpha 時的螺桿轉角
const meshScrew = (alpha) => -Math.PI / 2 - (TAU * ((Math.PI / 2 - alpha) * WHEEL.radius - PITCH / 2 + WORM.length / 2)) / PITCH;

// 輪轉角為 v 時輪中心的位置(輪沿固定的螺紋滾動);加上整數個螺距,讓 v = 0 時輪在螺桿中段
const X0 = crestX(0) + PITCH / 2 - (WHEEL.radius * Math.PI) / 2;
const SHIFT = Math.round(-X0 / PITCH) * PITCH;

/** 主動量 v(輪的轉角)與狀態:螺桿轉角、輪轉角、滑塊位置 */
export function lathe(v, state) {
  if (state === "screw") return { screw: meshScrew(v), wheel: v, x: 0 };
  const x = WHEEL.radius * v + X0 + SHIFT;
  return { screw: 0, wheel: meshWheel(0, x), x };
}
export const teeth = WHEEL.teeth;
export const radius = WHEEL.radius;

export default {
  figure: 104,
  parts: [
    {
      id: "screw",
      kind: "worm",
      axis: X,
      center: [0, WORM.y, 0],
      radius: WORM.radius,
      length: WORM.length,
      pitch: PITCH,
      thread: 0.13,
    },
    { id: "wheel", kind: "gear", teeth: WHEEL.teeth, radius: WHEEL.radius, width: 0.3, bore: 0.1, web: false },
    {
      id: "slider",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape([[-0.75, -1.55], [0.75, -1.55], [0.75, -1.25], [0.3, -1.25], [0.2, 0.0], [0.0, 0.25], [-0.2, 0.0], [-0.3, -1.25], [-0.75, -1.25]]), thickness: 0.2, at: [0, 0, 0.3] },
        { kind: "cylinder", radius: 0.18, length: 0.5, at: [0, 0, 0.2] },
      ],
    },
    { id: "bed", kind: "box", center: [0, -1.75, 0.1], size: [5.0, 0.35, 0.6] },
  ],
  driver: { part: "wheel", type: "rotation", grips: ["screw"], range: [-RANGE, RANGE] },
  states: {
    options: [
      { id: "screw", label: "螺桿轉 → 輪轉" },
      { id: "wheel", label: "輪轉 → 滑塊移動" },
    ],
    initial: "screw",
  },
  view: { direction: [0.06, 0.08, 1] },
  pose(v, state = "screw") {
    const { screw, wheel, x } = lathe(v, state);
    return {
      parts: { screw: { angle: screw }, wheel: { position: [x, 0, 0], angle: wheel }, slider: { position: [x, 0, 0] } },
      readouts: [],
    };
  },
};
