// 第 122 種:兩個互相咬合的正齒輪各裝一個曲柄手腕,經兩根連桿接到一支立桿的上下兩端;
// 立桿中點樞接在一根水平桿上,水平桿在導軌中只能左右移動。兩輪轉速不同(齒數 26 : 22),
// 兩個手腕的相位不斷錯開,水平桿因此做變速的交替橫移。主動件是上輪。
// 立桿的位置由兩根連桿長度不變的條件以牛頓法解出(以立桿直立、水平桿在原位為起點)。
// 兩輪的軸裝在後面一塊立板的軸承上;水平桿穿在右邊一個固定的軸套裡(原文說「水平桿」,原圖只畫出桿頭;
// 立板與軸套是推斷)。
import { deg, polar, add } from "./kit.js";
import { meshAngle } from "./gears.js";
import { shape } from "./shapes.js";

export const TOP = { center: [0, 0.95, 0], teeth: 26, radius: 1.3 };
// 下輪在上輪的右下方、與它咬合(中心距 = 兩節圓半徑和)
export const BOTTOM = { center: add(TOP.center, polar(1.3 + 1.1, deg(-82.8))), teeth: 22, radius: 1.1 };
const WRIST = { top: { r: 0.88, at: deg(158) }, bottom: { r: 0.78, at: deg(165) } };
const LINK = { x: 2.75, y: -0.05, half: 1.0 };

const wrists = (top, bottom) => ({
  w1: add(TOP.center, polar(WRIST.top.r, WRIST.top.at + top)),
  w2: add(BOTTOM.center, polar(WRIST.bottom.r, WRIST.bottom.at + bottom)),
});
const ends = (x, phi) => ({
  a: [x + LINK.half * Math.cos(phi), LINK.y + LINK.half * Math.sin(phi), 0],
  b: [x - LINK.half * Math.cos(phi), LINK.y - LINK.half * Math.sin(phi), 0],
});
const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);

const REST = (() => {
  const { w1, w2 } = wrists(0, meshAngle(TOP, BOTTOM, 0));
  const { a, b } = ends(LINK.x, Math.PI / 2);
  return { l1: dist(a, w1), l2: dist(b, w2) };
})();

/** 上輪轉 theta:兩手腕、立桿兩端與中點(水平桿的位置) */
export function linkage(theta) {
  const bottom = meshAngle(TOP, BOTTOM, theta);
  const { w1, w2 } = wrists(theta, bottom);
  let x = LINK.x;
  let phi = Math.PI / 2;
  const f = (x0, p0) => {
    const { a, b } = ends(x0, p0);
    return [dist(a, w1) - REST.l1, dist(b, w2) - REST.l2];
  };
  for (let i = 0; i < 30; i++) {
    const [f1, f2] = f(x, phi);
    if (Math.abs(f1) + Math.abs(f2) < 1e-12) break;
    const h = 1e-6;
    const [ax, bx] = f(x + h, phi);
    const [ap, bp] = f(x, phi + h);
    const j11 = (ax - f1) / h;
    const j21 = (bx - f2) / h;
    const j12 = (ap - f1) / h;
    const j22 = (bp - f2) / h;
    const det = j11 * j22 - j12 * j21 || 1e-12;
    x -= (f1 * j22 - f2 * j12) / det;
    phi -= (j11 * f2 - j21 * f1) / det;
  }
  const { a, b } = ends(x, phi);
  return { bottom, w1, w2, a, b, x, phi, error: Math.abs(f(x, phi)[0]) + Math.abs(f(x, phi)[1]) };
}
export const rods = REST;

const gear = (id, g) => ({ id, kind: "gear", center: g.center, teeth: g.teeth, radius: g.radius, width: 0.24, bore: 0.18, web: false });
const axle = { kind: "cylinder", radius: 0.18, length: 0.7, at: [0, 0, -0.25] }; // 往後伸進立板的軸承
const FLOOR = -3.0;
const SLEEVE_X = 5.2; // 水平桿的軸套:桿在行程兩端都穿過它

export default {
  figure: 122,
  parts: [
    { ...gear("top", TOP), pieces: [{ kind: "cylinder", radius: 0.1, length: 0.6, at: [...polar(WRIST.top.r, WRIST.top.at).slice(0, 2), 0.2], accent: true }, axle] },
    { ...gear("bottom", BOTTOM), pieces: [{ kind: "cylinder", radius: 0.1, length: 0.6, at: [...polar(WRIST.bottom.r, WRIST.bottom.at).slice(0, 2), 0.2] }, axle] },
    { id: "rodTop", kind: "link", width: 0.2, thickness: 0.08 },
    { id: "rodBottom", kind: "link", width: 0.2, thickness: 0.08 },
    { id: "lever", kind: "link", width: 0.24, thickness: 0.1 },
    {
      id: "slide",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.5, 0.3, 0.2], at: [0.25, 0, 0.4] },
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.13, length: 2.8, at: [1.8, 0, 0.4] },
        { kind: "cylinder", radius: 0.2, inner: 0.1, length: 0.25, at: [0, 0, 0.4] },
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 兩輪後面的立板與軸承
        { kind: "plate", shape: shape([[-0.5, 1.5], [0.5, 1.5], [BOTTOM.center[0] + 0.5, FLOOR], [-0.5, FLOOR]]), thickness: 0.1, at: [0, 0, -0.6] },
        { kind: "cylinder", radius: 0.33, inner: 0.18, length: 0.2, at: [TOP.center[0], TOP.center[1], -0.45] },
        { kind: "cylinder", radius: 0.33, inner: 0.18, length: 0.2, at: [BOTTOM.center[0], BOTTOM.center[1], -0.45] },
        { kind: "box", size: [2.2, 0.18, 1.0], at: [0.2, FLOOR - 0.09, -0.4] },
        // 水平桿的軸套與立柱
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.22, inner: 0.13, length: 0.3, at: [SLEEVE_X, LINK.y, 0.4] },
        { kind: "box", size: [0.2, LINK.y - 0.22 - FLOOR, 0.2], at: [SLEEVE_X, (LINK.y - 0.22 + FLOOR) / 2, 0.4] },
        { kind: "box", size: [0.8, 0.18, 0.6], at: [SLEEVE_X, FLOOR - 0.09, 0.4] },
      ],
    },
  ],
  driver: { part: "top", type: "rotation" },
  target: "slide", // 變速交替橫移的水平桿
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const { bottom, w1, w2, a, b, x } = linkage(theta);
    const z = (p, dz) => [p[0], p[1], dz];
    return {
      parts: {
        top: { angle: theta },
        bottom: { angle: bottom },
        rodTop: { from: z(w1, 0.3), to: z(a, 0.3) },
        rodBottom: { from: z(w2, 0.3), to: z(b, 0.3) },
        lever: { from: z(a, 0.22), to: z(b, 0.22) },
        slide: { position: [x, LINK.y, 0] },
      },
      readouts: [],
    };
  },
};

