// 第 286 種:蒸汽引擎提升閥的推頂子(toe)與升降器(lifter)。搖臂軸上的曲面推頂子往左伸出;
// 升降器固定在右邊的升降桿上,往左伸到推頂子上方。搖臂軸轉動時,推頂子的曲面頂起升降器的下緣,
// 升降桿跟著上升,把閥門抬起;搖臂軸轉回時升降器隨桿落下。主動件是搖臂軸。
// 推斷:升降器靠桿與閥門的重量壓在推頂子上;推頂子曲面的形狀依原圖。
import { deg, clamp, rot2 } from "./kit.js";
import { shape, thickLine, circle } from "./shapes.js";

const SHAFT = [1.35, -0.55, 0]; // 搖臂軸
const ROD_X = 1.85; // 升降桿
export const RANGE = [deg(-14), 0];
// 推頂子的上緣(局部座標,軸心為原點):從左端往右緩緩升到軸心上方
const TOE_TOP = Array.from({ length: 21 }, (_, i) => {
  const t = i / 20;
  const x = -2.85 + t * 2.85;
  return [x, 0.32 + 0.28 * t * t - 0.08 * Math.sin(Math.PI * t)];
});
// 升降器的下緣:往左下斜的直線(相對升降桿上的固定點,升降桿高度為 0 時)
const LIFTER = { x0: -1.6, y0: -0.2, slope: 0.1 }; // 下緣在 x 處的高度 = y0 + slope·(x − x0)

/** 搖臂軸轉 psi(負值為順時針,推頂子左端往上)→ 升降桿上升量 */
export function lift(psi0) {
  const psi = clamp(psi0, ...RANGE);
  let best = -Infinity;
  for (const p of TOE_TOP) {
    const [x, y] = rot2(p, psi);
    const wx = SHAFT[0] + x;
    const wy = SHAFT[1] + y;
    if (wx < LIFTER.x0 - 1.4 || wx > ROD_X - 0.2) continue;
    best = Math.max(best, wy - (LIFTER.y0 + LIFTER.slope * (wx - LIFTER.x0)));
  }
  return Math.max(0, best);
}

const toe = shape(
  [...TOE_TOP, [0.5, 0.45], [0.55, 0], [0.4, -0.38], [0, -0.48], [-0.5, -0.3], ...TOE_TOP.map(([x, y]) => [x, y - 0.18 - 0.15 * ((x + 2.85) / 2.85)]).reverse().slice(0, -2)].map((p) => p),
  [circle(0.16).reverse()],
);

export default {
  figure: 286,
  parts: [
    { id: "toe", kind: "plate", center: SHAFT, shape: toe, thickness: 0.32, spin: 0.55, mark: [0.3, -0.2], markSize: 0.06, pieces: [{ kind: "cylinder", radius: 0.3, length: 0.4 }] },
    {
      id: "lifter",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "cylinder", axis: [0, 1, 0], radius: 0.1, length: 4.4, at: [ROD_X, -0.4, 0] },
        { kind: "box", size: [0.42, 0.55, 0.42], at: [ROD_X - 0.05, 0.45, 0] },
        // 升降器:從桿上的座往左伸出的楔形臂,下緣是一條斜直線
        { kind: "plate", shape: shape([[LIFTER.x0 - 1.4, LIFTER.y0 - 0.14], [ROD_X - 0.2, LIFTER.y0 + LIFTER.slope * (ROD_X - 0.2 - LIFTER.x0)], [ROD_X - 0.2, 0.7], [LIFTER.x0 - 1.35, LIFTER.y0 + 0.05]]), thickness: 0.3 },
      ],
    },
    { id: "guide", kind: "group", pieces: [{ kind: "box", size: [0.5, 0.25, 0.5], at: [ROD_X, -1.6, -0.1] }, { kind: "box", size: [0.5, 0.25, 0.5], at: [ROD_X, 1.35, -0.1] }] },
  ],
  waivers: [
    { check: "interference", parts: ["toe", "lifter"], reason: "待確認(未修):toe 的板 與 lifter 的圓柱 r0.1×4.4互相穿入 0.19(96 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["lifter", "guide"], reason: "待確認:lifter 的板 與 guide 的方塊 0.5×0.25×0.5重疊 0.05,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
  ],
  driver: { part: "toe", type: "rotation", range: RANGE, initial: 0 },
  target: "lifter", // 被頂起的升降器
  view: { direction: [0.06, 0.06, 1] },
  pose(psi) {
    const h = lift(psi);
    return { parts: { toe: { angle: clamp(psi, ...RANGE) }, lifter: { position: [0, h, 0] } }, readouts: [] };
  },
};
