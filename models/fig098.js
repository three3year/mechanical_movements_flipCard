// 第 98 種:圓盤上固定一根曲柄銷,銷在振動臂上切出的一條環形(無端)溝槽內作動,
// 圓盤旋轉時使振動臂繞右側的樞軸做不規則的擺動。溝槽是長圓形(兩端半圓、中間直線),
// 銷走到直線段與半圓段時,臂的擺動快慢不同。主動件是圓盤。
// 臂的轉角由「銷在溝槽中心線上」這個條件以數值解出(推斷:原文只說溝槽是環形)。
// 這個條件在每個圓盤轉角都有兩個解——銷貼在溝槽的上側或下側,各自都是連續的一圈;原圖的銷在上側,
// 所以沿著「圓盤轉角 0 時最接近 0° 的那個解」連續追蹤一整圈(預先算好查表,再在表值附近精算),
// 不能每次都取離 0° 最近的解——兩個解在圓盤轉半圈附近交會,那樣臂會在兩側之間跳 30°。
import { TAU, deg, polar, rot2, wrap } from "./kit.js";
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

const pinAt = (theta) => polar(DISC.pin, theta + START);
// 銷到溝槽中心線的帶符號距離,臂轉角 psi 時
const residualAt = (pin, psi) => loopDistance(rot2([pin[0] - PIVOT[0], pin[1] - PIVOT[1]], -psi));

/** 在 seed ± span 內找殘差變號、離 seed 最近的根(二分法精算) */
function rootNear(pin, seed, span) {
  const step = deg(0.25);
  let best = null;
  let prev = residualAt(pin, seed - span);
  for (let psi = seed - span + step; psi <= seed + span + 1e-12; psi += step) {
    const cur = residualAt(pin, psi);
    if (prev * cur <= 0 && (best === null || Math.abs(psi - seed) < Math.abs(best[1] - seed))) best = [psi - step, psi];
    prev = cur;
  }
  if (!best) return seed;
  let [lo, hi] = best;
  let flo = residualAt(pin, lo);
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    const fm = residualAt(pin, mid);
    if (flo * fm <= 0) hi = mid;
    else [lo, flo] = [mid, fm];
  }
  return (lo + hi) / 2;
}

// 沿圓盤轉一圈連續追蹤的解(查表);起點取 theta = 0 時離 0° 最近的根(銷在溝槽上側)
const STEPS = 720;
const BRANCH = (() => {
  const table = [rootNear(pinAt(0), 0, deg(30))];
  for (let i = 1; i <= STEPS; i++) table.push(rootNear(pinAt((i * TAU) / STEPS), table[i - 1], deg(4)));
  return table;
})();

/** 圓盤轉 theta:銷的位置與臂的轉角(使銷落在溝槽中心線上,沿同一側連續) */
export function arm(theta) {
  const pin = pinAt(theta);
  const seed = BRANCH[Math.round((wrap(theta) / TAU) * STEPS)];
  const psi = rootNear(pin, seed, deg(3));
  return { pin, psi, err: Math.abs(residualAt(pin, psi)) };
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
  target: "arm",
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const { psi } = arm(theta);
    return { parts: { disc: { angle: theta }, arm: { angle: psi } }, readouts: [] };
  },
};

