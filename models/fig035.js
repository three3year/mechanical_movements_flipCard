// 第 35 種:由均勻的旋轉運動產生變速旋轉運動。小齒輪等速轉動,與橢圓齒輪咬合;小齒輪的軸承在桿上的
// 溝槽裡滑動(彈簧使它保持嚙合),桿則鬆套在橢圓齒輪的軸上——溝槽容納了橢圓半徑的變化。
// 小齒輪沿橢圓的節曲線純滾動:兩者滾過的弧長相等。橢圓的齒是沿弧長均分的,所以小齒輪的轉角要用
// 橢圓節曲線的弧長(ds = √(r² + r'²)·dφ)來算,齒才會一直對得上(用 r·dφ 積分的話,一圈下來
// 小齒輪少轉了 (弧長 − ∫r dφ)/RP,齒的相位越走越偏、齒頂撞進對方的齒)。
// 小齒輪的節圓要與橢圓節曲線相切:軸心在接觸點的法線上、離接觸點 RP(不是在半徑方向上離橢圓心 r + RP——
// 橢圓的法線不過圓心,那樣擺小齒輪會斜著咬進橢圓)。桿的方向保持不動(推斷:原文只說桿鬆套在軸上,
// 桿的擺動很小,略去),軸心沿桿滑動:每個輪的轉角找出法線通過桿的那個接觸點。
// 橢圓齒輪的轉速 ≈ RP ÷ (ds/dφ):長軸端(ds/dφ = A)最慢、短軸端(= B)最快,所以轉速隨接觸處的半徑而變。
import { TAU, deg } from "./kit.js";
import { cumulative, periodic, inverseOf, interpolate, samplePitch, noncircularOutline, arcAt } from "./noncircular.js";
import { gearShape, circle, stadium, shape } from "./shapes.js";

const A = 2.0;
const B = 1.2;
const TEETH = 36;
const PINION_TEETH = 10;
const ARM = deg(135); // 桿的方向:小齒輪在橢圓的左上方
const ellipse = (a) => (A * B) / Math.sqrt((B * Math.cos(a)) ** 2 + (A * Math.sin(a)) ** 2);
const { length } = samplePitch(ellipse);
const PITCH = length / TEETH;
const RP = (PINION_TEETH * PITCH) / TAU; // 小齒輪節圓半徑:齒距與橢圓齒輪相同
const M = PITCH / Math.PI;
const arcTable = cumulative((a) => rolling(a), TAU, 1024);
const arcOf = periodic(arcTable, TAU); // 節曲線上局部角 → 弧長

/** 橢圓節曲線在局部角 a 處的弧長變化率 ds/dφ(滾動半徑) */
function rolling(a) {
  const d = (ellipse(a + 1e-4) - ellipse(a - 1e-4)) / 2e-4;
  return Math.hypot(ellipse(a), d);
}
/** 節曲線上局部角 a 處的點與外法線(局部座標) */
function pointNormal(a) {
  const r = ellipse(a);
  const d = (ellipse(a + 1e-4) - ellipse(a - 1e-4)) / 2e-4;
  const p = [r * Math.cos(a), r * Math.sin(a)];
  const t = [d * Math.cos(a) - r * Math.sin(a), d * Math.sin(a) + r * Math.cos(a)]; // 切線(a 增加的方向)
  const l = Math.hypot(t[0], t[1]);
  return { p, n: [t[1] / l, -t[0] / l] };
}
/**
 * 橢圓齒輪順時針轉了 w 時(桿在橢圓局部角 ARM + w 的方向上)的接觸:
 * 找出法線通過桿的那個節曲線點(局部角 psi),小齒輪軸心在桿上離橢圓心 d,
 * 接觸方向(從小齒輪軸心看向接觸點)的世界角 theta。
 */
function contactAt(w) {
  const bar = ARM + w; // 桿在橢圓局部座標的方向
  const u = [Math.cos(bar), Math.sin(bar)];
  const off = (psi) => {
    const { p, n } = pointNormal(psi);
    const c = [p[0] + RP * n[0], p[1] + RP * n[1]];
    return u[0] * c[1] - u[1] * c[0]; // 軸心離桿的橫向距離(正為桿的左側)
  };
  let lo = bar - 0.5;
  let hi = bar + 0.5;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (off(lo) * off(mid) <= 0) hi = mid;
    else lo = mid;
  }
  const psi = (lo + hi) / 2;
  const { p, n } = pointNormal(psi);
  const d = u[0] * (p[0] + RP * n[0]) + u[1] * (p[1] + RP * n[1]);
  return { psi, d, theta: Math.atan2(-n[1], -n[0]) - w };
}

// 以輪的轉角 w 為參數取一圈的表:小齒輪的轉角(純滾動:軸心看接觸點的方向 + 滾過的弧長 ÷ RP)與軸心位置
const N = 1440;
const W = [];
const ALPHA = [];
const DIST = [];
const start = contactAt(0);
const S0 = arcOf(start.psi); // 齒 0 的中心放在初始接觸點
let theta = start.theta;
for (let i = 0; i <= N; i++) {
  const w = (TAU * i) / N;
  const c = contactAt(w);
  theta += Math.atan2(Math.sin(c.theta - theta), Math.cos(c.theta - theta)); // 連續展開
  W.push(w);
  ALPHA.push(theta - start.theta + (arcOf(c.psi) - S0) / RP);
  DIST.push(c.d);
}
const TURN = ALPHA[N]; // 輪轉一圈小齒輪轉的角度 = 36 齒 ÷ 10 齒 圈
const wheelOf = periodic(inverseOf({ xs: W, ys: ALPHA }), TURN);
const distOf = (w) => interpolate(W, DIST, ((w % TAU) + TAU) % TAU);

/** 小齒輪逆時針轉 alpha 時橢圓齒輪的轉角(外咬合,反向) */
export const wheelAngle = (alpha) => -wheelOf(alpha);
/** 接觸處橢圓的半徑 */
export const contactRadius = (alpha) => ellipse(contactAt(wheelOf(alpha)).psi);
/** 接觸處橢圓節曲線的滾動半徑 ds/dφ(長軸端 = A、短軸端 = B) */
export const rollingRadius = (alpha) => rolling(contactAt(wheelOf(alpha)).psi);
export const pinionRadius = RP;
export const axes = [A, B];

const outline = noncircularOutline(ellipse, { teeth: TEETH, addendum: M, dedendum: 1.2 * M, start: S0 });
const inner = Array.from({ length: 120 }, (_, i) => {
  const a = (i / 120) * TAU;
  const r = ellipse(a) - 0.35;
  return [r * Math.cos(a), r * Math.sin(a)];
});

export default {
  figure: 35,
  parts: [
    {
      id: "pinion",
      kind: "gear",
      teeth: PINION_TEETH,
      radius: RP,
      width: 0.24,
      center: [0, 0, 0],
      web: false,
    },
    {
      id: "wheel",
      kind: "plate",
      shape: { outline, holes: [circle(0.12).reverse()] },
      thickness: 0.22,
      engrave: [inner],
      hub: 0.22,
      mark: [1.4, 0],
      markSize: 0.09,
      spin: 2.2,
    },
    {
      id: "bar",
      kind: "plate",
      center: [0, 0, 0.25],
      shape: shape(stadium(3.05, 0.42).outline, [circle(0.12).reverse(), [
        ...[[1.6, -0.08], [2.95, -0.08], [2.95, 0.08], [1.6, 0.08]],
      ].reverse()]),
      thickness: 0.08,
    },
  ],
  driver: { part: "pinion", type: "rotation" },
  target: "wheel",
  view: { direction: [0.08, 0.06, 1] },
  pose(alpha) {
    const w = wheelOf(alpha);
    const d = distOf(w);
    const center = [d * Math.cos(ARM), d * Math.sin(ARM), 0];
    // 小齒輪的齒對準橢圓齒輪:初始時接觸方向上是齒槽(齒 0 在局部 +X,齒槽中心在 ±π/10),之後純滾動
    const pinion = start.theta + Math.PI / PINION_TEETH + alpha;
    return { parts: { pinion: { position: center, angle: pinion }, wheel: { angle: -w } }, readouts: [] };
  },
};
