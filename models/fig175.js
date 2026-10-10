// 第 175 種:讓引擎的曲柄在活塞每一次行程中轉一整圈的方法。曲柄軸在機架左上的軸座裡,連桿(剛性、長度固定)
// 一端接曲柄銷,另一端接活塞桿端的銷,銷在機架右側的直立長槽裡上下滑。
// 關鍵在比例:連桿長 = 曲柄半徑 + 長槽到曲柄軸的距離。活塞走到行程中點(與曲柄軸同高)時,曲柄銷正好轉到離長槽
// 最遠的一點,連桿水平、從曲柄軸前面橫過;活塞靠慣性繼續往同一方向走,曲柄跟著越過這一點,再轉大半圈才到行程的
// 另一端。所以活塞上升一程曲柄轉一圈多一點、下降一程少一點,往返一次正好兩圈——平均每一程一圈。
// 行程兩端是一般的死點(曲柄指向活塞銷,與連桿成一直線),長槽兩端與曲柄軸等距、上下對稱。
// 原文是活塞帶動曲柄:主動件是長槽中的銷(活塞),目標件是曲柄。主動量取曲柄的轉角(driver.cycle 的一程是一圈),
// 播放時曲柄等速轉、活塞跟著上下,經過死點時不會跳。
// 長槽的位置與長度照原圖;原圖的曲柄畫得比較長、連桿比較短(照畫的比例曲柄轉不過離長槽最遠的那一側),
// 這裡曲柄縮短、連桿加長到上面的比例(推斷)。機架的窗口照原圖保留(減輕重量的開孔)。
import { deg, polar, add } from "./kit.js";
import { angleOf } from "./linkage.js";
import { shape, circle, stadium, arcPoints } from "./shapes.js";

export const CRANK = { center: [0, 0, 0], radius: 0.55 };
export const SLOT_X = 2.0; // 長槽到曲柄軸的距離
export const ROD = SLOT_X + CRANK.radius; // 連桿長:剛好搆到曲柄離長槽最遠的一點
export const HALF_STROKE = Math.sqrt((ROD + CRANK.radius) ** 2 - SLOT_X ** 2); // 死點:曲柄與連桿成一直線
const START = Math.atan2(-HALF_STROKE, SLOT_X); // 主動量 0:活塞在最低處(原圖的位置),曲柄指向活塞銷
const MOD = (a, m) => ((a % m) + m) % m;

/**
 * 曲柄轉 theta(逆時針):曲柄銷、活塞銷與連桿的方向。曲柄銷離長槽最遠時(曲柄角 π)連桿水平,活塞銷在這裡換邊:
 * 曲柄角在 (−π, π) 時活塞銷低於曲柄銷、在 (π, 3π) 時高於曲柄銷——這樣活塞的速度連續(靠慣性越過),往返一次曲柄轉兩圈。
 */
export function stroke(theta) {
  const phi = START + theta;
  const pin = add(CRANK.center, polar(CRANK.radius, phi));
  const dx = SLOT_X - (pin[0] - CRANK.center[0]);
  const side = MOD(phi + Math.PI, 4 * Math.PI) < 2 * Math.PI ? -1 : 1;
  const y = pin[1] + side * Math.sqrt(Math.max(0, ROD * ROD - dx * dx));
  const end = [CRANK.center[0] + SLOT_X, y, 0];
  return { pin, end, angle: angleOf(pin, end), y };
}

// 機架:左邊是托著曲柄軸的軸座,右邊是開著長槽的高塔,下面是底座;中間開一個窗口(照原圖)
const TOP = HALF_STROKE + 0.65;
const FLOOR = -HALF_STROKE - 0.95;
const frame = shape(
  [
    [-0.95, FLOOR],
    [3.25, FLOOR],
    [3.25, FLOOR + 0.25],
    [2.95, FLOOR + 0.3],
    [2.7, FLOOR + 1.0],
    [2.42, TOP - 0.4],
    ...arcPoints(0.42, deg(-5), deg(185), SLOT_X, TOP - 0.42),
    [1.55, TOP - 0.45],
    [1.05, -0.05],
    [0.75, 0.15],
    ...arcPoints(0.5, deg(40), deg(180), 0, 0),
    [-0.5, FLOOR + 0.6],
    [-0.75, FLOOR + 0.25],
    [-0.95, FLOOR + 0.25],
  ],
  [
    stadium(2 * HALF_STROKE + 0.6, 0.36).outline.map(([x, y]) => [SLOT_X + y, x - HALF_STROKE - 0.3]).reverse(),
    [[0.25, -2.6], [1.2, -2.6], [1.2, -0.7], [0.25, -0.7]].reverse(),
    circle(0.18).reverse(),
  ],
);

export default {
  figure: 175,
  parts: [
    {
      id: "frame",
      kind: "group",
      center: [0, 0, -0.3],
      pieces: [{ kind: "plate", shape: frame, thickness: 0.3 }],
    },
    {
      id: "crank",
      kind: "group",
      center: CRANK.center,
      spin: CRANK.radius + 0.25,
      pieces: [
        { kind: "plate", shape: stadium(CRANK.radius, 0.36), thickness: 0.12, angle: START },
        { kind: "cylinder", radius: 0.22, inner: 0.1, length: 0.2 },
        { kind: "cylinder", radius: 0.17, length: 0.6, at: [0, 0, -0.25] }, // 曲柄軸:只往後穿過機架的軸座(連桿會從軸的前面橫過)
        { kind: "cylinder", radius: 0.07, length: 0.18, at: [...polar(CRANK.radius, START).slice(0, 2), 0.1] }, // 曲柄銷:往前伸到連桿那一層
      ],
    },
    { id: "rod", kind: "link", width: 0.16, thickness: 0.08 },
    {
      id: "slider",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: 0.12, length: 0.425, at: [0, 0, 0.0325] }, // 銷:頂面貼著連桿的背面
        { kind: "box", size: [0.3, 0.55, 0.28], at: [0, 0, -0.18] }, // 活塞桿端的滑塊,在機架的長槽裡上下滑
      ],
    },
  ],
  driver: { part: "slider", type: "translation", direction: [0, 1, 0], cycle: [0, 2 * Math.PI], speed: Math.PI / 1.5 },
  target: "crank",
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const { pin, end } = stroke(theta);
    return {
      parts: {
        crank: { angle: theta },
        rod: { from: [pin[0], pin[1], 0.23], to: [end[0], end[1], 0.23] }, // 連桿在曲柄、軸頭與滑銷的前面
        slider: { position: [end[0], end[1], -0.06] },
      },
      readouts: [],
    };
  },
};
