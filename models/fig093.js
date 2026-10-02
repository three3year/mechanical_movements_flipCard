// 第 93 種:曲柄手腕在開槽軛的長槽內作動,軛與它下方的桿上下直線往復,省去擺動的連桿(抽送桿)。
// 曲柄(盤)轉一圈,軛往返一次,行程是曲柄半徑的兩倍,位移是正弦的。主動件是曲柄。
import { polar } from "./kit.js";
import { shape, circle, stadium } from "./shapes.js";

const R = 1.15; // 曲柄半徑
const START = 0.15; // 原圖:曲柄銷在右側、略高
const SLOT = { length: 3.3, width: 0.62 };

/** 曲柄轉 theta:曲柄銷位置、軛的高度 */
export function yoke(theta) {
  const pin = polar(R, theta + START);
  return { pin, y: pin[1] };
}
export const crankRadius = R;

export default {
  figure: 93,
  parts: [
    {
      id: "crank",
      kind: "group",
      center: [0, 0, -0.2],
      spin: R + 0.3,
      pieces: [
        { kind: "plate", shape: shape(circle(R + 0.35), [circle(0.15).reverse()]), thickness: 0.1, circles: [0.32] },
        { kind: "cylinder", radius: 0.2, length: 0.75, at: [R * Math.cos(START), R * Math.sin(START), 0.35], accent: true },
        { kind: "cylinder", radius: 0.15, length: 0.6, at: [0, 0, -0.3] },
      ],
    },
    {
      id: "yoke",
      kind: "group",
      center: [0, 0, 0.25],
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(stadium(SLOT.length + 0.5, SLOT.width + 0.38).outline.map(([x, y]) => [x - (SLOT.length + 0.5) / 2, y]), [stadium(SLOT.length, SLOT.width).outline.map(([x, y]) => [x - SLOT.length / 2, y]).reverse()]), thickness: 0.2 },
        { kind: "cylinder", radius: 0.16, length: 2.5, axis: [0, 1, 0], at: [0, -1.7, -0.08] },
        { kind: "cylinder", radius: 0.16, length: 0.9, axis: [0, 1, 0], at: [0, 0.9, -0.08] },
      ],
    },
  ],
  driver: { part: "crank", type: "rotation" },
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const { y } = yoke(theta);
    return { parts: { crank: { angle: theta }, yoke: { position: [0, y, 0.25] } }, readouts: [] };
  },
};
