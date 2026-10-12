// 第 286 種:蒸汽引擎提升閥的推頂子(toe)與升降器(lifter)。搖臂軸上的曲面推頂子往左伸出;
// 升降器固定在右邊的升降桿上,往左伸到推頂子上方。搖臂軸轉動時,推頂子的曲面頂起升降器的下緣,
// 升降桿跟著上升,把閥門抬起;搖臂軸轉回時升降器隨桿落下。主動件是搖臂軸。
// 接觸:升降桿的高度由推頂子的曲面與升降器下緣相碰算出(取曲面上頂得最高的一點);搖臂軸轉回時升降器靠自重跟著落下。
// 推斷:升降器靠桿與閥門的重量壓在推頂子上;推頂子曲面的形狀依原圖;搖臂軸的軸承、升降桿的導套與後面的牆板(原圖沒畫)。
// 前後順序照原圖:推頂子的轂是套在搖臂軸上的圓,右緣藏在升降桿後面(原圖那一段畫成虛線),所以升降桿在推頂子前面一層。
import { deg, clamp, rot2 } from "./kit.js";
import { shape, thickLine, circle } from "./shapes.js";

const SHAFT = [1.35, -0.55, 0]; // 搖臂軸
const ROD_X = 1.85; // 升降桿
const ROD_Z = 0.33; // 升降桿在推頂子(含轂與搖臂軸的前端,z 到 0.205)前面一層
export const RANGE = [deg(-14), 0];
// 推頂子的轂:套在搖臂軸上的圓,半徑照原圖(右緣伸到升降桿後面,原圖那一段畫成虛線)
const HUB_R = 0.42;
// 推頂子的上緣(局部座標,軸心為原點):從左端往右緩緩升高,在 x −0.9 之後以二次曲線接到轂頂,和轂的圓相切
const TOE_TOP = (() => {
  const arm = (x) => {
    const t = (x + 2.85) / 2.85;
    return 0.32 + 0.28 * t * t - 0.08 * Math.sin(Math.PI * t);
  };
  const pts = Array.from({ length: 15 }, (_, i) => -2.85 + (i * 1.95) / 14).map((x) => [x, arm(x)]);
  const p0 = pts[pts.length - 1];
  const c = [-0.7, HUB_R];
  for (let i = 1; i <= 6; i++) {
    const u = i / 6;
    const w = [(1 - u) ** 2, 2 * u * (1 - u), u * u];
    pts.push([w[0] * p0[0] + w[1] * c[0], w[0] * p0[1] + w[1] * c[1] + w[2] * HUB_R]);
  }
  return pts;
})();
// 升降器的下緣:往左下斜的直線(相對升降桿上的固定點,升降桿高度為 0 時)
const LIFTER = { x0: -1.6, y0: -0.2, slope: 0.1 }; // 下緣在 x 處的高度 = y0 + slope·(x − x0)

// 推頂子曲面頂得最高的一點高出升降器下緣多少(負值是還沒碰到);升降桿高度為 0、搖臂軸轉 psi 時
function reach(psi0) {
  const psi = clamp(psi0, ...RANGE);
  let best = -Infinity;
  for (const p of TOE_TOP) {
    const [x, y] = rot2(p, psi);
    const wx = SHAFT[0] + x;
    const wy = SHAFT[1] + y;
    if (wx < LIFTER.x0 - 1.4 || wx > ROD_X - 0.2) continue;
    best = Math.max(best, wy - (LIFTER.y0 + LIFTER.slope * (wx - LIFTER.x0)));
  }
  return best;
}
// 升降器靠重量壓在推頂子上:搖臂軸沒轉時下緣就貼著曲面(擺放時留 0.0005 的間隙),升降桿的高度 0 定在這個姿勢
const REST = reach(0);

/** 搖臂軸轉 psi(負值為順時針,推頂子左端往上)→ 升降桿從靜止處上升多少 */
export function lift(psi0) {
  return reach(psi0) - REST;
}

// 推頂子:上緣 → 轂的圓(從頂端順時針繞過右邊、下面到左側)→ 下緣回到尖端
const HUB_END = deg(-160); // 下緣接到轂的左下
const toe = (() => {
  const arc = Array.from({ length: 25 }, (_, i) => {
    const a = Math.PI / 2 + ((HUB_END - Math.PI / 2) * (i + 1)) / 25;
    return [HUB_R * Math.cos(a), HUB_R * Math.sin(a)];
  });
  const a0 = arc[arc.length - 1];
  const tip = [-2.62, 0.16]; // 尖端的下角
  const c = [-1.45, -0.12];
  const lower = Array.from({ length: 12 }, (_, i) => {
    const u = (i + 1) / 12;
    const w = [(1 - u) ** 2, 2 * u * (1 - u), u * u];
    return [w[0] * a0[0] + w[1] * c[0] + w[2] * tip[0], w[0] * a0[1] + w[1] * c[1] + w[2] * tip[1]];
  });
  return shape([...TOE_TOP, ...arc, ...lower], [circle(0.16).reverse()]);
})();

export default {
  figure: 286,
  parts: [
    {
      id: "toe",
      kind: "plate",
      center: SHAFT,
      shape: toe,
      thickness: 0.32,
      spin: 0.55,
      mark: [0.3, -0.2],
      markSize: 0.06,
      pieces: [
        { kind: "cylinder", radius: 0.3, length: 0.4 },
        { kind: "cylinder", radius: 0.12, length: 1.25, at: [0, 0, -0.42] }, // 搖臂軸,往後穿過牆板上的軸承
      ],
    },
    {
      id: "lifter",
      kind: "group",
      arrow: false,
      pieces: [
        // 直立桿照原圖的虛線在推頂子前面一層(轂的右緣藏在它後面),升降器的臂從桿上的座往後伸到推頂子那一層
        { kind: "cylinder", axis: [0, 1, 0], radius: 0.1, length: 4.4, at: [ROD_X, -0.4, ROD_Z] },
        { kind: "box", size: [0.42, 0.55, 0.6], at: [ROD_X - 0.05, 0.45, 0.15] },
        // 升降器:從桿上的座往左伸出的楔形臂,下緣是一條斜直線
        { kind: "plate", shape: shape([[LIFTER.x0 - 1.4, LIFTER.y0 - 0.14], [ROD_X - 0.2, LIFTER.y0 + LIFTER.slope * (ROD_X - 0.2 - LIFTER.x0)], [ROD_X - 0.2, 0.7], [LIFTER.x0 - 1.35, LIFTER.y0 + 0.05]]), thickness: 0.3 },
      ],
    },
    {
      id: "guide",
      kind: "group",
      pieces: [
        { kind: "box", size: [2.4, 4.4, 0.1], at: [1.4, -0.6, -1.1] }, // 牆板
        { kind: "cylinder", radius: 0.25, inner: 0.12, length: 0.2, at: [SHAFT[0], SHAFT[1], -0.95] }, // 搖臂軸的軸承
        // 升降桿的兩個導套,各由一根托架接到牆板
        // 上導套放在升降器的座頂起到最高時之上;托架從牆板往前伸到桿那一層
        ...[-1.6, 1.5].flatMap((y) => [
          { kind: "cylinder", axis: [0, 1, 0], radius: 0.18, inner: 0.1, length: 0.25, at: [ROD_X, y, ROD_Z] },
          { kind: "box", size: [0.12, 0.12, ROD_Z - 0.18 + 1.05], at: [ROD_X, y, (ROD_Z - 0.18 - 1.05) / 2] },
        ]),
      ],
    },
  ],
  // 動力重演:只轉搖臂軸;升降器(連桿)沿導套滑動,靠自重壓在推頂子上,被曲面頂起
  replay: {
    to: RANGE[0],
    free: { lifter: { slide: [0, 1, 0] } },
    ignore: [["lifter", "guide"]],
    expect: [{ part: "lifter", label: "推頂子轉上來,把升降器與升降桿頂起", quote: "搖臂軸上的曲面推頂子作用於連接在升降桿上的升降器，藉此抬起閥門" }],
  },
  driver: { part: "toe", type: "rotation", range: RANGE, initial: 0 },
  target: "lifter", // 被頂起的升降器
  view: { direction: [0.06, 0.06, 1] },
  pose(psi) {
    const h = lift(psi);
    return { parts: { toe: { angle: clamp(psi, ...RANGE) }, lifter: { position: [0, h + REST + 5e-4, 0] } }, readouts: [] };
  },
};
