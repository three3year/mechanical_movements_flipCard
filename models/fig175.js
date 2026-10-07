// 第 175 種:讓引擎的曲柄在活塞每一次行程中恰好轉一整圈的方法。曲柄銷(左上)上的連桿穿過機架窗口中
// 一個可擺動的銷座(連桿可在其中滑動),下端的銷在機架右側的直立長槽裡上下滑動。
// 曲柄轉一圈,長槽中的銷(活塞)往返一次。原文是活塞帶動曲柄:主動件是長槽中的銷(活塞),目標件是曲柄。
// 主動量取曲柄的相位(driver.cycle 的一程是半圈),播放時曲柄等速轉、活塞跟著上下,經過死點時不會跳。
// 銷座與長槽的幾何依原圖推斷;曲柄軸、銷座的樞軸與窗口中托著它的橫檔也是推斷(原圖只畫出圓)。
import { deg, polar, add, sub, scale, norm } from "./kit.js";
import { angleOf } from "./linkage.js";
import { shape, circle, stadium } from "./shapes.js";

const CRANK = { center: [-1.0, 0.85, 0], radius: 0.95 };
const SWIVEL = [0.3, -0.45, 0]; // 窗口中的銷座(連桿從中穿過)
const SLOT_X = 1.25;
const START = deg(140);

/** 曲柄轉 theta:曲柄銷、連桿方向與長槽中銷的高度 */
export function stroke(theta) {
  const pin = add(CRANK.center, polar(CRANK.radius, START + theta));
  const d = norm(sub(SWIVEL, pin));
  // 連桿沿 pin → 銷座的方向延伸,直到 x = SLOT_X
  const t = (SLOT_X - pin[0]) / d[0];
  const end = add(pin, scale(d, t));
  return { pin, end, angle: angleOf(pin, SWIVEL), y: end[1] };
}

const frame = shape(
  [
    [-1.9, -4.85],
    [2.0, -4.85],
    [1.8, -4.65],
    [1.65, 0.6],
    [1.25, 1.05],
    [0.85, 0.6],
    [0.6, 0.95],
    [-0.4, 0.95],
    [-0.4, 1.55],
    [-1.1, 1.75],
    [-1.6, 1.4],
    [-1.6, -4.65],
  ],
  [
    stadium(4.8, 0.3).outline.map(([x, y]) => [SLOT_X + y, x - 4.6]).reverse(),
    [[-0.1, -3.9], [0.7, -3.9], [0.7, 0.2], [-0.1, 0.2]].reverse(),
    circle(0.18, CRANK.center[0], CRANK.center[1]).reverse(),
  ],
);
// 窗口中托著銷座樞軸的橫檔(與機架同一層)
const bar = shape([[-0.15, SWIVEL[1] - 0.12], [0.75, SWIVEL[1] - 0.12], [0.75, SWIVEL[1] + 0.12], [-0.15, SWIVEL[1] + 0.12]]);

export default {
  figure: 175,
  parts: [
    {
      id: "frame",
      kind: "group",
      center: [0, 0, -0.3],
      pieces: [
        { kind: "plate", shape: frame, thickness: 0.3 },
        { kind: "plate", shape: bar, thickness: 0.3 },
        { kind: "cylinder", radius: 0.075, length: 0.45, at: [SWIVEL[0], SWIVEL[1], 0.2] }, // 銷座的樞軸
      ],
    },
    {
      id: "crank",
      kind: "group",
      center: CRANK.center,
      spin: CRANK.radius + 0.2,
      pieces: [
        { kind: "plate", shape: stadium(CRANK.radius, 0.45), thickness: 0.12, angle: START },
        { kind: "cylinder", radius: 0.25, inner: 0.1, length: 0.25 },
        { kind: "cylinder", radius: 0.17, length: 0.6, at: [0, 0, -0.2] }, // 曲柄軸:往後穿過機架的軸承孔
      ],
    },
    { id: "rod", kind: "link", width: 0.16, thickness: 0.08, stretch: true },
    { id: "swivel", kind: "plate", center: SWIVEL, shape: shape(circle(0.18), [circle(0.08).reverse()]), thickness: 0.25, posed: true, arrow: false },
    {
      id: "slider",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: 0.12, length: 0.36 }, // 銷:頂面貼著連桿的背面
        { kind: "box", size: [0.26, 0.55, 0.28], at: [0, 0, -0.18] }, // 活塞桿端的滑塊,在機架的長槽裡上下滑
      ],
    },
  ],
  driver: { part: "slider", type: "translation", direction: [0, 1, 0], cycle: [0, Math.PI] },
  target: "crank",
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const { pin, end, angle } = stroke(theta);
    return {
      parts: {
        crank: { angle: theta },
        rod: { from: [pin[0], pin[1], 0.17], to: [end[0], end[1], 0.17] }, // 連桿貼著曲柄、銷座與滑銷的前面
        swivel: { angle },
        slider: { position: [end[0], end[1], -0.06] },
      },
      readouts: [],
    };
  },
};
