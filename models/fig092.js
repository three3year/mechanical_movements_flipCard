// 第 92 種:普通的曲柄運動。飛輪上的曲柄銷經連桿帶動導軌中的滑塊往復;
// 曲柄轉一圈,滑塊往返一次,行程等於曲柄半徑的兩倍。
import { Z, deg, partPoint } from "./kit.js";
import { sliderOnLine } from "./linkage.js";

const WHEEL = { center: [0, 0, 0], radius: 1.55 };
const CRANK = 0.92; // 曲柄銷離軸心的距離
const PIN0 = deg(-57); // 原圖中曲柄銷在輪心右下方
const ROD = 3.1;
const FRONT = 0.2; // 連桿與滑塊在飛輪前方
const BLOCK = { size: [0.85, 0.8, 0.3] }; // 行程最左端不碰導軌的端板
const GUIDE = { left: 1.75, right: 7.3, inner: 0.42, rail: 0.14 };

const rail = (y) => ({ kind: "box", size: [GUIDE.right - GUIDE.left, GUIDE.rail, 0.3], at: [(GUIDE.left + GUIDE.right) / 2, y, FRONT] });

export function crankSlider(angle) {
  const pin = partPoint(WHEEL.center, Z, angle, [CRANK * Math.cos(PIN0), CRANK * Math.sin(PIN0), FRONT]);
  const slider = sliderOnLine(pin, ROD, [0, 0, FRONT], [1, 0, 0], 1);
  return { pin, slider: slider.point, x: slider.s };
}

export default {
  figure: 92,
  parts: [
    {
      id: "wheel",
      kind: "pulley",
      style: "spoked",
      spokes: 6,
      center: WHEEL.center,
      radius: WHEEL.radius,
      width: 0.3,
      pieces: [{ kind: "cylinder", radius: 0.09, length: 0.5, at: [CRANK * Math.cos(PIN0), CRANK * Math.sin(PIN0), 0.15] }],
    },
    {
      id: "guide",
      kind: "group",
      pieces: [
        rail(GUIDE.inner + GUIDE.rail / 2),
        rail(-GUIDE.inner - GUIDE.rail / 2),
        { kind: "box", size: [GUIDE.rail, 2 * (GUIDE.inner + GUIDE.rail), 0.3], at: [GUIDE.left - GUIDE.rail / 2, 0, FRONT] },
      ],
    },
    { id: "slider", kind: "box", size: BLOCK.size, center: [0, 0, FRONT] },
    { id: "rod", kind: "link", width: 0.24, thickness: 0.1 },
  ],
  driver: { part: "wheel", type: "rotation" },
  target: "slider", // 往復的滑塊
  view: { direction: [0.08, 0.06, 1] },
  pose(angle) {
    const { pin, slider } = crankSlider(angle);
    const front = [slider[0], slider[1], FRONT + 0.2];
    return {
      parts: {
        wheel: { angle },
        slider: { position: slider },
        rod: { from: [pin[0], pin[1], FRONT + 0.2], to: front },
      },
      readouts: [],
    };
  },
};
