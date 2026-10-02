// 第 118 種:使活塞桿的行程(或曲柄的擺動)加倍。小齒輪裝在連桿(抽送桿)端的心軸上,
// 下側咬一根固定的齒條,上側咬一根由導桿承載、可以來回移動的齒條。連桿把整個行程傳給小齒輪;
// 下齒條固定,小齒輪因此一邊前進一邊滾動,上齒條移動的距離是小齒輪的兩倍。主動件是連桿(小齒輪的心軸)。
import { rackOffset, pinionAngle, circularPitch } from "./gears.js";

export const PINION = { center: [0, 0, 0], teeth: 12, radius: 0.55 };
const PITCH = circularPitch(PINION);
const LOWER = { origin: [0, -PINION.radius, 0], dir: [1, 0, 0], pitch: PITCH };
const UPPER = { origin: [0, PINION.radius, 0], dir: [1, 0, 0], pitch: PITCH };
const RANGE = [-1.1, 1.1];
const ROD = 3.0;

/** 小齒輪心軸移到 x:小齒輪轉角與上齒條的位置 */
export function doubler(x) {
  // 在小齒輪的參考系裡,固定的下齒條相對往 −x 移;由此得小齒輪的轉角
  const angle = pinionAngle(PINION, LOWER, -x);
  return { angle, upper: x + rackOffset(PINION, UPPER, angle) };
}

export default {
  figure: 118,
  parts: [
    { id: "pinion", kind: "gear", teeth: PINION.teeth, radius: PINION.radius, width: 0.3, bore: 0.08, web: false },
    {
      id: "rod",
      kind: "group",
      pieces: [
        { kind: "box", size: [ROD, 0.14, 0.12], at: [-ROD / 2, 0.08, 0.25], angle: -0.06 },
        { kind: "cylinder", radius: 0.16, length: 0.25, at: [0, 0, 0.25] },
      ],
    },
    {
      id: "upper",
      kind: "group",
      pieces: [
        { kind: "rack", teeth: 19, pitch: PITCH, depth: 0.22, width: 0.3, at: [0, PINION.radius, 0], angle: Math.PI },
        { kind: "box", size: [19 * PITCH + 0.3, 0.12, 0.3], at: [0.1, PINION.radius + 0.42, 0] },
      ],
    },
    {
      id: "lower",
      kind: "group",
      pieces: [
        { kind: "rack", teeth: 21, pitch: PITCH, depth: 0.22, width: 0.3 },
        { kind: "box", size: [21 * PITCH + 0.3, 0.12, 0.4], at: [0, -0.42, 0] },
        { kind: "box", size: [21 * PITCH + 1.0, 0.1, 0.6], at: [0, -0.95, 0] },
        ...[-1.8, 0, 1.8].map((x) => ({ kind: "box", size: [1.2, 0.36, 0.3], at: [x, -0.68, 0] })),
      ],
    },
  ],
  driver: { part: "rod", type: "translation", direction: [1, 0, 0], range: RANGE },
  view: { direction: [0.06, 0.05, 1] },
  pose(x) {
    const { angle, upper } = doubler(x);
    return {
      parts: {
        pinion: { position: [x, 0, 0], angle },
        rod: { position: [x, 0, 0] },
        upper: { position: [upper, 0, 0] },
        lower: { position: [rackOffset(PINION, LOWER, pinionAngle(PINION, LOWER, 0)), -PINION.radius, 0] },
      },
      readouts: [],
    };
  },
};
