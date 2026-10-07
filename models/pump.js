// 活塞泵(第 448–452 種)共用:手柄槓桿與連桿、瓣閥、汽缸(泵筒)的剖面、隨活塞升降的水。
// 閥門開合由活塞的走向決定,水流以流體示意的點表示(ADR-0002)。
import { Y, swingPhase } from "./kit.js";
import { backHalf } from "./section.js";
import { shape, rect, circle, thickLine } from "./shapes.js";

/**
 * 手柄槓桿:繞 pivot 轉 theta(0 是水平;正為逆時針),短臂端 E 在支點左邊 short,經長 link 的連桿接到
 * 泵筒軸線 x 上的活塞桿頂。手柄往下壓(theta 變小)時短臂往上,把活塞提起。
 */
export function lever({ pivot, short, link, x }) {
  return (theta) => {
    const E = [pivot[0] - short * Math.cos(theta), pivot[1] - short * Math.sin(theta), 0];
    const dy = Math.sqrt(link * link - (E[0] - x) ** 2);
    return { E, top: [x, E[1] - dy, 0] };
  };
}

/** 手柄槓桿的零件(局部:支點在原點,短臂往左,把手往右下彎) */
export const leverPart = (id, { short, long }) => ({
  id,
  kind: "plate",
  shape: shape(thickLine([[-short, 0], [0, 0], [long * 0.45, -0.3], [long, -1.0]], 0.1), [circle(0.04).reverse(), circle(0.04, -short, 0).reverse()]),
  thickness: 0.08,
  arrow: false,
  pieces: [{ kind: "sphere", radius: 0.11, at: [long, -1.0, 0] }],
});

/** 往復的主動量 v → 擺動位置、是否往 to 那一端走、這一程走了多少(f:0–1)、第幾程(n,從 0 起) */
export const stroke = (v, from, to) => {
  const { at, forward, f } = swingPhase(v, from, to);
  return { at, forward, f, n: Math.floor(v / (Math.abs(to - from) || 1)) };
};

const VALVE_RISE = 0.2; // 一程的前 20%:閥瓣被水頂到開足
const VALVE_FALL = 0.2; // 回程的前 20%:閥瓣落回閥座

/**
 * 瓣閥開的程度(0 關、1 開足)。open:這一程水把它推開;phase:stroke() 的結果。
 * 被推開的閥由快到慢頂到開足;上一程開著、這一程要關的閥靠自重與倒流加速落回閥座、撞停(不瞬間闔上)。
 * 第一程之前沒有上一程,要關的閥一開始就關著。
 */
export function valveOpening(open, { f, n }) {
  if (open) {
    const t = Math.min(1, f / VALVE_RISE);
    return 1 - (1 - t) ** 2;
  }
  if (n === 0) return 0;
  const t = Math.min(1, f / VALVE_FALL);
  return 1 - t * t;
}

/** 瓣閥:鉸在局部原點,沿 +x 伸出 length;姿勢以 angle 開合 */
export const flap = (id, length, extra = {}) => ({ id, kind: "plate", shape: shape(rect(length, 0.05, length / 2, 0)), thickness: 0.3, arrow: false, ...extra });

/** 泵筒(繞 y 的管,剖開前半):內半徑 r,從 y0 到 y1,壁厚 wall */
export const barrel = (id, { x = 0, r, y0, y1, wall = 0.07, extra = {} }) => ({
  id,
  kind: "lathe",
  axis: Y,
  center: [x, y0, 0],
  profile: [[r, 0], [r + wall, 0], [r + wall, y1 - y0], [r, y1 - y0]],
  ...backHalf(Y),
  ...extra,
});

/** 一段管的剖面(兩道壁):沿折線 pts,內寬 w;轉角處斜接 */
export const pipeWalls = (pts, w, t = 0.06, depth = 0.4) => {
  const normal = (a, b) => {
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [-(b[1] - a[1]) / l, (b[0] - a[0]) / l];
  };
  const off = (s) =>
    pts.map(([x, y], i) => {
      const n0 = i > 0 ? normal(pts[i - 1], pts[i]) : normal(pts[i], pts[i + 1]);
      const n1 = i < pts.length - 1 ? normal(pts[i], pts[i + 1]) : n0;
      const n = [n0[0] + n1[0], n0[1] + n1[1]];
      const l = Math.hypot(...n) || 1;
      const k = (s * w) / 2 / ((n[0] / l) * n0[0] + (n[1] / l) * n0[1]);
      return [x + (n[0] / l) * k, y + (n[1] / l) * k];
    });
  return [1, -1].map((s) => ({ kind: "plate", shape: shape(thickLine(off(s), t)), thickness: depth }));
};

/** 從 bottom 開始往上長到 top 的水(fill 零件的姿勢);maxH 是零件定義的高度 */
export const water = (x, bottom, top, maxH, z = 0) => ({ position: [x, bottom + maxH / 2, z], level: Math.max(0, top - bottom) / maxH });
