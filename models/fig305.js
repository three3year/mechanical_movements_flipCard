// 第 305 種:單銷式擺鐘擒縱。擒縱輪是一個很小的圓盤,上面只有一根偏心的銷;擺(瓶形框架,下端兩個擺錘)
// 每擺一次,圓盤轉半圈,銷把衝量傳到叉瓦的垂直面上,叉瓦的水平面則是靜擊面(銷靠在上面時圓盤不動)。
// 主動件是擺(累計擺動);目標件是帶單銷的擒縱盤(擒縱讓它半圈半圈地放行)。
//
// 由接觸算(models/escapement.js 的 escapeByContact):圓盤受發條的固定力矩逆時針轉。框架上裝兩片薄的叉瓦板:
// 上板在盤心右上方,銷轉到右邊時往上頂在上板的下面(水平的靜擊面)就停;擺往左擺、上板退到銷的左邊時,
// 銷沿上板右端的垂直面往上推(衝量),越過上板後轉到左邊,往下落在下板的上面(下板與上板對稱);擺往右擺時反過來。
// 叉瓦板的形狀與位置是依原文推斷的(原圖只看得到框架裡一個帶缺口的方塊);叉瓦板裝在框架後面一層的橫條上,
// 銷只伸到叉瓦板那一層,轉過去時不碰橫條。圓盤的軸往前伸到前面的軸承架上(原圖沒畫);擺的樞軸在後面的支架上。
// 推斷:擺幅、叉瓦板的尺寸;擺沿圓弧擺動,叉瓦板跟著微微傾斜,所以鎖住時圓盤會被推回一點(約 2°)。
import { deg, swing } from "./kit.js";
import { escapeByContact, placePoly } from "./escapement.js";
import { shape, circle, rect, thickLine } from "./shapes.js";
import { circlePolygon } from "./contact.js";
import { plateBar } from "./supports.js";

export const SWING = deg(5);
const PIVOT = [0, 2.4];
const DISC = [0, -0.25];
const PIN = { r: 0.25, size: 0.07 }; // 銷離盤心的距離、銷的半徑
const PLATE = { gap: 0.04, thick: 0.08, right: 0.06, left: 0.16 }; // 叉瓦板:離盤心水平線的距離、厚、往右/往左伸出的長度
const YC = DISC[1] - PIVOT[1]; // 盤心相對樞軸的高度
// 叉瓦板(相對樞軸):上板的右端與下板的左端是衝擊面
const UPPER = rect(PIN.r + PLATE.right + PLATE.left, PLATE.thick, (PIN.r + PLATE.right - PLATE.left) / 2, YC + PLATE.gap + PLATE.thick / 2);
const LOWER = rect(PIN.r + PLATE.right + PLATE.left, PLATE.thick, -(PIN.r + PLATE.right - PLATE.left) / 2, YC - PLATE.gap - PLATE.thick / 2);

/** 擺累計擺動 v → 擺角 */
export const pendulumAngle = (v) => swing(v, -SWING, SWING);
export const escapement = {
  ...escapeByContact({ center: DISC, teeth: [circlePolygon([PIN.r, 0], PIN.size, 16)], dir: 1, period: 4 * SWING, pitch: Math.PI, drop: 0.35, stops: (v) => [UPPER, LOWER].map((p) => placePoly(p, PIVOT, pendulumAngle(v))) }),
  period: 4 * SWING,
};

/** 擺累計擺動 v → 擺角、圓盤轉角(每擺一次半圈,由接觸算) */
export function singlePin(v) {
  return { pendulum: pendulumAngle(v), disc: escapement.angle(v) };
}

// 瓶形框架(相對樞軸):細頸往下、肚子圍著圓盤
const body = Array.from({ length: 25 }, (_, i) => {
  const t = i / 24;
  const y = -0.6 - t * 3.2;
  const w = 0.2 + 1.1 * Math.sin(Math.min(1, t * 1.25) * (Math.PI / 2)) ** 1.5;
  return [w, y];
});
const frameLoop = [...body, ...body.map(([x, y]) => [-x, y]).reverse()];
const halfWidth = (y) => body.reduce((best, [w, by]) => (Math.abs(by - y) < Math.abs(best[1] - y) ? [w, by] : best))[0];
// 叉瓦板背後的橫條:上板的橫條往左接到框架、下板的往右接到框架(在叉瓦板後面一層)
const UPPER_Y = YC + PLATE.gap + PLATE.thick / 2;
const LOWER_Y = YC - PLATE.gap - PLATE.thick / 2;
const upperBar = rect(halfWidth(UPPER_Y) - 0.05 - (PLATE.left - 0.06), PLATE.thick, -(halfWidth(UPPER_Y) - 0.05 + PLATE.left - 0.06) / 2, UPPER_Y);
const lowerBar = rect(halfWidth(LOWER_Y) - 0.05 - (PLATE.left - 0.06), PLATE.thick, (halfWidth(LOWER_Y) - 0.05 + PLATE.left - 0.06) / 2, LOWER_Y);

export default {
  figure: 305,
  parts: [
    {
      id: "pendulum",
      kind: "group",
      center: [...PIVOT, 0],
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([...frameLoop, frameLoop[0]], 0.1)), thickness: 0.1 },
        { kind: "plate", shape: shape(rect(0.16, 0.7, 0, -0.3)), thickness: 0.12 },
        { kind: "sphere", radius: 0.22 },
        // 叉瓦板(下面、上面是水平的靜擊面,上板右端、下板左端是垂直的衝擊面)與後面一層接到框架的橫條
        { kind: "plate", shape: shape(UPPER), thickness: 0.14, at: [0, 0, 0.05] },
        { kind: "plate", shape: shape(LOWER), thickness: 0.14, at: [0, 0, 0.05] },
        { kind: "plate", shape: shape(upperBar), thickness: 0.1, at: [0, 0, -0.07] },
        { kind: "plate", shape: shape(lowerBar), thickness: 0.1, at: [0, 0, -0.07] },
        { kind: "cylinder", radius: 0.06, length: 0.6, at: [0, 0, -0.25] }, // 擺的樞軸,往後伸進支架
        // 下端兩個擺錘
        { kind: "sphere", radius: 0.32, at: [-0.6, -3.55, 0] },
        { kind: "sphere", radius: 0.32, at: [0.6, -3.55, 0] },
      ],
    },
    {
      id: "disc",
      kind: "group",
      center: [...DISC, 0.2],
      spin: 0.36,
      pieces: [
        { kind: "plate", shape: shape(circle(0.36)), thickness: 0.08 },
        { kind: "cylinder", radius: PIN.size, length: 0.2, at: [PIN.r, 0, -0.1], accent: true }, // 銷,伸到叉瓦板那一層
        { kind: "cylinder", radius: 0.05, length: 0.5, at: [0, 0, 0.25] }, // 圓盤的軸,往前伸進軸承架
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 圓盤軸的前軸承架(在擺的前面)、擺的樞軸支架(在擺的後面);原圖都沒畫
        { kind: "cylinder", radius: 0.1, inner: 0.05, length: 0.1, at: [DISC[0], DISC[1], 0.55] },
        { kind: "box", size: [2.2, 0.12, 0.1], at: [DISC[0] + 1.1, DISC[1], 0.55] },
        { kind: "box", size: [0.12, 4.2, 0.1], at: [DISC[0] + 2.2, DISC[1] - 1.0, 0.55] },
        ...plateBar({ points: [PIVOT, [PIVOT[0] + 2.2, PIVOT[1]]], z: -0.6 }),
        { kind: "box", size: [0.12, 5.6, 0.12], at: [PIVOT[0] + 2.2, PIVOT[1] - 2.8, -0.6] },
      ],
    },
  ],
  // 動力重演:只推擺;圓盤受固定的力矩(發條)逆時針轉,銷由兩片叉瓦板輪流擋住、放行
  // (從銷被擋住的時刻起算,比對的時刻也都取在銷被擋住的時候)
  replay: {
    from: 0.75 * SWING,
    to: 8.75 * SWING,
    free: { disc: { pivot: [...DISC, 0.2], spring: 1, gravity: false } },
    ignore: [["disc", "frame"]], // 圓盤的軸插在軸承架的孔裡(孔沒畫出來)
    expect: [
      { at: 2.75 * SWING, part: "disc", label: "擺擺過一次,圓盤轉半圈", quote: "擺鐘每擺動一次,擒縱輪便旋轉半圈" },
      { at: 4.75 * SWING, part: "disc", label: "擺一個來回,圓盤轉一圈" },
      { part: "disc", label: "擺兩個來回,圓盤轉兩圈" },
    ],
  },
  driver: { part: "pendulum", type: "rotation", cycle: [-SWING, SWING] },
  target: "disc", // 帶單銷的擒縱盤:擒縱讓它半圈半圈地放行
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const s = singlePin(v);
    return { parts: { pendulum: { angle: s.pendulum }, disc: { angle: s.disc } }, readouts: [] };
  },
};
