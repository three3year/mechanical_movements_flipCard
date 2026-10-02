// 第 98 種:圓盤上固定一根曲柄銷,銷在振動臂上切出的一條環形(無端)溝槽內作動,
// 圓盤旋轉時使振動臂繞右側的樞軸做不規則的擺動。溝槽是長圓形(兩端半圓、中間直線),
// 銷走到直線段與半圓段時,臂的擺動快慢不同。主動件是圓盤。
// 臂的轉角由「銷在溝槽中心線上」這個條件以數值解出(推斷:原文只說溝槽是環形)。
import { deg, polar, rot2 } from "./kit.js";
import { shape, circle, arcPoints } from "./shapes.js";

const DISC = { center: [0, 0, 0], radius: 2.0, pin: 0.62 };
const PIVOT = [3.15, -0.45, 0];
// 溝槽中心線(臂的局部座標,原點在樞軸):長圓,中心在 (−2.85, −0.25),半長 1.25,半寬 0.62
const LOOP = { cx: -2.85, cy: -0.2, half: 1.15, r: 0.72 };
const START = deg(90);

// 臂局部座標中,點到溝槽中心線的帶符號距離(外正內負)
function loopDistance([x, y]) {
  const dx = Math.max(Math.abs(x - LOOP.cx) - LOOP.half, 0);
  return Math.hypot(dx, y - LOOP.cy) - LOOP.r;
}

/** 圓盤轉 theta:銷的位置與臂的轉角(使銷落在溝槽中心線上,取最接近上一個解的那一個) */
export function arm(theta) {
  const pin = polar(DISC.pin, theta + START);
  const residual = (psi) => {
    const local = rot2([pin[0] - PIVOT[0], pin[1] - PIVOT[1]], -psi);
    return loopDistance(local);
  };
  // 臂的轉角落在小範圍內:取殘差為零、離 0 最近的根
  let best = 0;
  let bestErr = Infinity;
  for (let i = -60; i <= 60; i++) {
    const psi = deg(i * 0.5);
    const err = Math.abs(residual(psi));
    if (err < bestErr) {
      bestErr = err;
      best = psi;
    }
  }
  let lo = best - deg(0.5);
  let hi = best + deg(0.5);
  for (let k = 0; k < 40; k++) {
    const m1 = lo + (hi - lo) / 3;
    const m2 = hi - (hi - lo) / 3;
    if (Math.abs(residual(m1)) < Math.abs(residual(m2))) hi = m2;
    else lo = m1;
  }
  return { pin, psi: (lo + hi) / 2, err: Math.abs(residual((lo + hi) / 2)) };
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
        { kind: "cylinder", radius: 0.2, length: 0.3, at: [0, 0, -0.1] },
      ],
    },
    {
      id: "arm",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(loopPath(LOOP.r + 0.42), [loopPath(LOOP.r + 0.13).reverse()]), thickness: 0.12, at: [0, 0, 0.12] },
        { kind: "plate", shape: shape(loopPath(LOOP.r - 0.13), []), thickness: 0.12, at: [0, 0, 0.12] },
        { kind: "plate", shape: shape([[-1.5, -0.15], [-0.25, -0.2], [0, -0.32], [0, 0.32], [-0.25, 0.2], [-1.5, 0.15]]), thickness: 0.12, at: [0, 0, 0.12] },
        { kind: "cylinder", radius: 0.38, inner: 0.24, length: 0.3 },
      ],
    },
  ],
  driver: { part: "disc", type: "rotation" },
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const { psi } = arm(theta);
    return { parts: { disc: { angle: theta }, arm: { angle: psi } }, readouts: [] };
  },
};

