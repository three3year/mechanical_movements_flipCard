// 第 98 種:圓盤上固定一根曲柄銷,銷在振動臂上切出的一條環形(無端)溝槽內作動,
// 圓盤旋轉時使振動臂繞右側的樞軸做不規則的擺動。溝槽是長圓形(兩端半圓、中間直線),
// 銷走到直線段與半圓段時,臂的擺動快慢不同。主動件是圓盤。
//
// 銷要走完整條溝(2026-10-08 複查:原本銷的半徑只有溝長的三分之一,銷一直在溝的上側來回,溝的兩端與下側都沒用到):
// 銷離圓盤中心的距離正好等於溝中心線的半長(臂水平時溝的中心與圓盤中心重合、樞軸與圓盤中心同高),
// 圓盤轉到 0° / 180° 時銷剛好在溝的右端 / 左端,之後繞過半圓換到另一側——銷在臂上繞溝一圈,圓盤一圈。
// 臂的轉角這樣算:臂繞樞軸轉時,溝上每一點到樞軸的距離不變,所以「銷落在溝中心線的哪一點」由
// 「溝上到樞軸的距離等於銷到樞軸的距離的那一點」決定(沿溝的上半從右端到左端這個距離單調遞增,
// 銷在圓盤上半圈時取上半、下半圈時取下半,解唯一);再把那一點轉到銷的位置就是臂的轉角。
import { TAU, deg, polar, wrap } from "./kit.js";
import { shape, circle, arcPoints } from "./shapes.js";
import { pedestal } from "./supports.js";

const DISC = { center: [0, 0, 0], radius: 2.0 };
const PIVOT = [3.15, 0, 0];
// 溝槽中心線(臂的局部座標,原點在樞軸):長圓,臂水平時中心在圓盤中心,半長 half、兩端半圓半徑 r
const LOOP = { cx: -PIVOT[0], cy: 0, half: 0.78, r: 0.72 };
DISC.pin = LOOP.half + LOOP.r; // 銷的半徑 = 溝中心線的半長:銷剛好走到溝的兩端
const START = deg(-90); // 原圖:銷在圓盤正下方,臂壓到最低

// 溝中心線上的點,參數 u ∈ [0, 1) 從右端起順時針(經上側到左端是 0–0.5)
const STRAIGHT = 2 * LOOP.half;
const ARC = Math.PI * LOOP.r;
const PERIMETER = 2 * STRAIGHT + 2 * ARC;
function loopPoint(u) {
  let s = ((u % 1) + 1) % 1 * PERIMETER;
  const { cx, cy, half, r } = LOOP;
  if (s < ARC / 2) return [cx + half + r * Math.cos(s / r), cy + r * Math.sin(s / r)]; // 右端:0 → 90°
  s -= ARC / 2;
  if (s < STRAIGHT) return [cx + half - s, cy + r]; // 上側直線,往左
  s -= STRAIGHT;
  if (s < ARC) return [cx - half + r * Math.cos(Math.PI / 2 + s / r), cy + r * Math.sin(Math.PI / 2 + s / r)]; // 左端:90° → 270°
  s -= ARC;
  if (s < STRAIGHT) return [cx - half + s, cy - r]; // 下側直線,往右
  s -= STRAIGHT;
  return [cx + half + r * Math.cos(-Math.PI / 2 + s / r), cy + r * Math.sin(-Math.PI / 2 + s / r)]; // 右端:−90° → 0
}

// 臂局部座標中,點到溝槽中心線的帶符號距離(外正內負);測試檢查銷在溝裡用
function loopDistance([x, y]) {
  const dx = Math.max(Math.abs(x - LOOP.cx) - LOOP.half, 0);
  return Math.hypot(dx, y - LOOP.cy) - LOOP.r;
}

const pinAt = (theta) => polar(DISC.pin, theta + START);
const distToPivot = ([x, y]) => Math.hypot(x, y); // 臂局部座標(原點在樞軸)

/** 圓盤轉 theta:銷的位置、臂的轉角 psi、銷在溝上的參數 u(0 右端、0.5 左端)與誤差 */
export function arm(theta) {
  const pin = pinAt(theta);
  const rel = [pin[0] - PIVOT[0], pin[1] - PIVOT[1]];
  const d = distToPivot(rel);
  // 銷在圓盤的上半圈(從正右逆時針到正左)走溝的上半 u ∈ [0, 0.5],下半圈走下半 u ∈ [0.5, 1];
  // 兩段上溝點到樞軸的距離都單調,二分法找距離相等的那一點
  const upper = wrap(theta + START) <= Math.PI;
  let [lo, hi] = upper ? [0, 0.5] : [1, 0.5]; // 下半:從右端(u=1)往回到左端,距離同樣遞增
  for (let k = 0; k < 50; k++) {
    const mid = (lo + hi) / 2;
    if (distToPivot(loopPoint(mid)) < d) lo = mid;
    else hi = mid;
  }
  const u = (lo + hi) / 2;
  const at = loopPoint(u);
  // 把溝上這一點繞樞軸轉到銷的位置
  const psi = Math.atan2(rel[1], rel[0]) - Math.atan2(at[1], at[0]);
  const back = [rel[0] * Math.cos(-psi) - rel[1] * Math.sin(-psi), rel[0] * Math.sin(-psi) + rel[1] * Math.cos(-psi)];
  return { pin, psi: Math.atan2(Math.sin(psi), Math.cos(psi)), u: ((u % 1) + 1) % 1, err: Math.abs(loopDistance(back)) };
}

const loopPath = (r) => [
  ...arcPoints(r, -Math.PI / 2, Math.PI / 2, LOOP.cx + LOOP.half, LOOP.cy),
  ...arcPoints(r, Math.PI / 2, (3 * Math.PI) / 2, LOOP.cx - LOOP.half, LOOP.cy),
];

export default {
  figure: 98,
  parts: [
    {
      id: "disc",
      kind: "group",
      spin: DISC.radius,
      pieces: [
        { kind: "plate", shape: shape(circle(DISC.radius), [circle(0.12).reverse()]), thickness: 0.1, at: [0, 0, -0.25] },
        { kind: "cylinder", radius: 0.12, length: 0.55, at: [...polar(DISC.pin, START).slice(0, 2), 0], accent: true },
        { kind: "cylinder", radius: 0.2, length: 0.3, at: [0, 0, -0.16] }, // 輪轂,在臂的後面
        { kind: "cylinder", radius: 0.12, length: 0.8, at: [0, 0, -0.6] }, // 圓盤的軸,往後伸進軸承座
      ],
    },
    {
      id: "arm",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(loopPath(LOOP.r + 0.3), [loopPath(LOOP.r + 0.13).reverse()]), thickness: 0.12, at: [0, 0, 0.12] },
        { kind: "plate", shape: shape(loopPath(LOOP.r - 0.13), []), thickness: 0.12, at: [0, 0, 0.12] },
        { kind: "plate", shape: shape([[-1.5, -0.15], [-0.25, -0.2], [0, -0.32], [0, 0.32], [-0.25, 0.2], [-1.5, 0.15]]), thickness: 0.12, at: [0, 0, 0.12] },
        { kind: "cylinder", radius: 0.38, inner: 0.24, length: 0.3 },
      ],
    },
    {
      // 振動臂的樞軸銷與托著它的支座(推斷,原圖只畫出樞軸的圓);支座在臂的後面
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: 0.23, length: 0.75, at: [PIVOT[0], PIVOT[1], -0.15] },
        { kind: "box", size: [0.7, 2.6, 0.2], at: [PIVOT[0], PIVOT[1] - 1.2, -0.42] },
        { kind: "box", size: [1.4, 0.2, 0.6], at: [PIVOT[0], PIVOT[1] - 2.5, -0.42] },
        ...pedestal({ at: [0, 0], z: -0.8, bore: 0.13, floor: PIVOT[1] - 2.6 }), // 圓盤軸的軸承座,在圓盤後面
      ],
    },
  ],
  // 動力重演:只推圓盤;振動臂鉸在樞軸銷上,由溝槽兩側被曲柄銷推著擺(不靠重力)
  replay: {
    free: { arm: { gravity: false } },
    expect: [
      { at: Math.PI / 2, part: "arm", label: "圓盤轉四分之一圈,銷到了溝的右端", quote: "曲柄銷在振動臂上所切出的一條無端(環形)溝槽內作動" },
      { at: Math.PI, part: "arm", label: "圓盤轉半圈,銷走過溝的上側、臂抬到最高" },
      { at: (3 * Math.PI) / 2, part: "arm", label: "圓盤轉四分之三圈,銷到了溝的左端" },
      { at: 2 * Math.PI, part: "arm", label: "圓盤轉一圈,銷繞完整條溝、臂回到原處" },
    ],
  },
  driver: { part: "disc", type: "rotation" },

  target: "arm",
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const { psi } = arm(theta);
    return { parts: { disc: { angle: theta }, arm: { angle: psi } }, readouts: [] };
  },
};
