// 第 191 種:用來得到逐漸加速運動的渦形齒輪(scroll-gears)。兩個一樣的渦形齒輪,節曲線是對數螺線:
// 半徑沿一圈由小漸大,在一處以一個台階接回原處。上輪(主動)從台階處、最小半徑開始帶動下輪的最大半徑處,
// 轉動中上輪的接觸半徑漸大、下輪的漸小,所以下輪越轉越快。兩輪只能轉近一圈(到台階為止)。主動件是上輪。
// 推斷:兩條對數螺線(兩輪中心距 = 兩接觸半徑之和,一直成立,純滾動);齒數;上輪順時針轉。
import { TAU } from "./kit.js";
import { circle } from "./shapes.js";

const R0 = 1.3;
const R1 = 1.8;
const K = Math.log(R1 / R0) / TAU;
const D = R0 + R1;
const EPS = 0.06; // 從台階之後一點點開始
const MAX = TAU - 2 * EPS;
const UPPER = [0, D / 2, 0];
const LOWER = [0, -D / 2, 0];
const radius = (a) => R0 * Math.exp(K * a);
const arcLen = (a) => ((R0 * Math.sqrt(1 + K * K)) / K) * (Math.exp(K * a) - 1);
const S = arcLen(TAU);
const TEETH = Math.round(S / 0.3);
const PITCH = S / TEETH;
const lowerAt = (r1) => Math.log((D - r1) / R0) / K; // 下輪接觸點的局部角

/** 上輪順時針轉 u(0 ≤ u ≤ MAX):兩輪的接觸半徑與下輪轉過的角度(逆時針) */
export function scroll(u) {
  const a1 = EPS + u;
  const r1 = radius(a1);
  const a2 = lowerAt(r1);
  return { r1, r2: D - r1, lower: lowerAt(radius(EPS)) - a2, ratio: r1 / (D - r1) };
}
export const geometry = { R0, R1, D, MAX };

/**
 * 渦形齒輪的輪廓:沿螺線排齒(齒中心在弧長 start + j·PITCH),台階處直接接回。
 * relief(j):第 j 齒的齒冠高(以 m 為 1)。上輪台階前的末齒修短:範圍起點時兩輪都在台階旁,
 * 上輪台階前的大半徑末齒正對著下輪台階後的小半徑首齒——齒距在兩側的半徑不同,
 * 齒的相位按弧長算雖然交錯,換成角度就對不上,末齒的齒頂會嵌進對方首齒的齒腹;修短到三成仍咬得到對方齒根。
 */
function outline(offset, start, relief = () => 1) {
  const n = 900;
  const m = PITCH / Math.PI;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU;
    const r = radius(a);
    const t = a + offset;
    const p = [r * Math.cos(t), r * Math.sin(t)];
    // 切線 = r'(cos, sin) + r(−sin, cos);外法線 = 切線轉 −90°
    const tan = [K * r * Math.cos(t) - r * Math.sin(t), K * r * Math.sin(t) + r * Math.cos(t)];
    const l = Math.hypot(...tan);
    const nrm = [tan[1] / l, -tan[0] / l];
    const u = (arcLen(a) - start) / PITCH;
    const c = Math.abs(u - Math.round(u));
    // 台階處放不下整個齒(含兩側齒腹)的那個齒不留,那一段走齒根:兩輪同時到台階時,一輪台階前的末齒
    // 齒頂正對另一輪台階後的這一段,這一段若停在節曲線上(沒有齒根深度),對方的齒頂會嵌進來
    const center = start + Math.round(u) * PITCH;
    const whole = center >= 0.27 * PITCH && center <= S - 0.27 * PITCH;
    const tip = relief(Math.round(u)) * m;
    const h = !whole ? -1.2 * m : c < 0.14 ? tip : c < 0.27 ? tip - ((tip + 1.2 * m) * (c - 0.14)) / 0.13 : -1.2 * m;
    pts.push([p[0] + nrm[0] * h, p[1] + nrm[1] * h]);
  }
  return pts;
}
const UPPER_OFFSET = -Math.PI / 2 - EPS;
const LOWER_OFFSET = Math.PI / 2 - lowerAt(radius(EPS));
const plate = (id, center, offset, start, relief, extra) => ({
  id,
  kind: "plate",
  center,
  shape: { outline: outline(offset, start, relief), holes: [circle(0.13).reverse()] },
  thickness: 0.22,
  hub: 0.3,
  circles: [0.48],
  engrave: [Array.from({ length: 120 }, (_, i) => {
    const a = (i / 119) * TAU;
    const r = radius(a) - 0.32;
    return [r * Math.cos(a + offset), r * Math.sin(a + offset)];
  })],
  mark: [0.8 * Math.cos(offset + Math.PI), 0.8 * Math.sin(offset + Math.PI)],
  markSize: 0.08,
  spin: R1 + 0.15,
  ...extra,
});

export default {
  figure: 191,
  parts: [plate("upper", UPPER, UPPER_OFFSET, PITCH / 2, (j) => (j === TEETH - 1 ? 0.3 : 1)), plate("lower", LOWER, LOWER_OFFSET, 0)],
  driver: { part: "upper", type: "rotation", range: [-MAX, 0] },
  target: "lower",
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const { lower, ratio } = scroll(-theta);
    return {
      parts: { upper: { angle: theta }, lower: { angle: lower } },
      readouts: [{ label: "下輪/上輪轉速", value: ratio.toFixed(2) }],
    };
  },
};
