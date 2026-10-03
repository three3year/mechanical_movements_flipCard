// 第 28 種:刷輪。上方的小輪立在下方大圓盤的上表面,靠摩擦(或附著力)被圓盤帶動。
// 改變小輪離圓盤中心的距離,就改變兩者的相對轉速:小輪轉角 = 圓盤轉角 × 距離 ÷ 小輪半徑。
import { X, Y } from "./kit.js";

const DISC = { radius: 1.72, thickness: 0.3 };
const SMALL = { radius: 0.55, width: 0.28 };
const AT = { near: 0.55, middle: 1.1, far: 1.5 };

export const distance = (state) => AT[state];
export const smallRadius = SMALL.radius;

const smallCenter = (state) => [AT[state], DISC.thickness / 2 + SMALL.radius, 0];

export default {
  figure: 28,
  parts: [
    {
      id: "disc",
      kind: "cylinder",
      axis: Y,
      radius: DISC.radius,
      length: DISC.thickness,
      mark: true,
      spin: DISC.radius,
      pieces: [
        { kind: "lathe", profile: [[0, -0.9], [0.24, -0.9], [0.3, -0.7], [0.42, -0.45], [0.75, -0.2], [0.9, -0.15], [0, -0.15]] },
        { kind: "cylinder", radius: 0.22, length: 2.6, at: [0, 0, -2.1] },
      ],
    },
    {
      id: "small",
      kind: "pulley",
      style: "disc",
      axis: X,
      center: smallCenter("middle"),
      radius: SMALL.radius,
      width: SMALL.width,
      pieces: [{ kind: "cylinder", radius: 0.08, length: 1.55, at: [0, 0, 0.2] }],
    },
  ],
  driver: { part: "disc", type: "rotation" },
  target: "small", // 靠摩擦被帶動的小輪
  states: {
    options: [
      { id: "near", label: "小輪靠近中心" },
      { id: "middle", label: "中間" },
      { id: "far", label: "小輪靠近外緣" },
    ],
    initial: "middle",
  },
  view: { direction: [0.05, 0.3, 1] },
  pose(angle, state = "middle") {
    return {
      parts: {
        disc: { angle },
        // 接觸點上兩者的線速度相等:圓盤繞 +y、小輪繞 +x 的轉角同號
        small: { position: smallCenter(state), angle: (angle * AT[state]) / SMALL.radius },
      },
      readouts: [],
    };
  },
};
