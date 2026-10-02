// 第 133 種:簡單的壓印運動。轉動小齒輪軸上的手搖曲柄,小齒輪帶動齒扇形段繞下方的樞軸轉,
// 扇形段上靠近樞軸的銷經一根連桿把壓板往上推(壓板在兩根立柱間上下移動)。主動件是手搖曲柄。
import { deg, polar, add } from "./kit.js";
import { meshAngle } from "./gears.js";
import { shape, circle } from "./shapes.js";

const PIVOT = [-0.55, -2.35, 0];
const SECTOR = { center: PIVOT, teeth: 40, radius: 2.0 };
const PINION = { center: add(PIVOT, polar(2.0 + 0.5, deg(52))), teeth: 10, radius: 0.5 };
const PIN = { r: 0.55, at: deg(-5) }; // 扇形段上連桿銷的位置(樞軸右邊)
const PLATEN_X = -0.95;
const ROD = 2.75;
const RANGE = [deg(-80), deg(160)];

/** 曲柄轉 c:扇形段轉角、連桿銷與壓板的高度 */
export function press(c) {
  const sector = meshAngle(PINION, SECTOR, c);
  const pin = add(PIVOT, polar(PIN.r, PIN.at + sector));
  const dx = PLATEN_X - pin[0];
  return { sector, pin, y: pin[1] + Math.sqrt(ROD * ROD - dx * dx) };
}

export default {
  figure: 133,
  parts: [
    {
      id: "crank",
      kind: "gear",
      center: PINION.center,
      teeth: PINION.teeth,
      radius: PINION.radius,
      width: 0.24,
      web: false,
      pieces: [
        { kind: "box", size: [1.4, 0.12, 0.1], at: [0.7, 0, 0.25] },
        { kind: "cylinder", radius: 0.1, length: 0.5, at: [1.4, 0, 0.45] },
      ],
    },
    {
      id: "sector",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "gear", teeth: SECTOR.teeth, radius: SECTOR.radius, span: [deg(10), deg(88)], width: 0.2 },
        { kind: "plate", shape: shape(circle(0.42), [circle(0.2).reverse()]), thickness: 0.3 },
        { kind: "cylinder", radius: 0.12, length: 0.45, at: [...polar(PIN.r, PIN.at).slice(0, 2), 0.15] },
      ],
    },
    { id: "rod", kind: "link", width: 0.14, thickness: 0.08 },
    {
      id: "platen",
      kind: "group",
      pieces: [{ kind: "box", size: [2.3, 0.28, 0.6], at: [0.15, 0.15, 0] }, { kind: "plate", shape: shape([[-0.18, 0], [0.18, 0], [0.12, -0.35], [-0.12, -0.35]]), thickness: 0.2 }],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.3, 5.0, 0.4], at: [-1.95, -0.3, -0.5] },
        { kind: "box", size: [0.3, 5.0, 0.4], at: [0.85, -0.3, -0.5] },
        { kind: "box", size: [3.6, 0.35, 0.6], at: [-0.55, 2.35, -0.5] },
        { kind: "box", size: [4.6, 0.1, 0.8], at: [0, -2.85, 0] },
      ],
    },
  ],
  driver: { part: "crank", type: "rotation", range: RANGE },
  view: { direction: [0.06, 0.05, 1] },
  pose(c) {
    const { sector, pin, y } = press(c);
    return {
      parts: {
        crank: { angle: c },
        sector: { angle: sector },
        rod: { from: [pin[0], pin[1], 0.3], to: [PLATEN_X, y, 0.3] },
        platen: { position: [PLATEN_X, y, 0] },
      },
      readouts: [],
    };
  },
};
