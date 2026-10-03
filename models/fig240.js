// 第 240 種:棘輪擋止裝置的各種變形。原圖是同一個棘輪配三種擋止:左邊沿輪緣彎曲、末端成鉤的長爪,
// 右上的平桿爪,以及下方帶彈簧片的爪 C(握把在左,彈簧片把爪頂向輪)。
// 輪逆時針轉時三個爪都被齒背頂起、滑過去;要順時針倒轉時,齒的直面卡住爪尖,輪被擋住。
// 各爪靠自重或彈簧貼著輪,作用方式為推斷(原文只說是各種變形)。主動件是輪,往回只能轉到最近的擋止處。
// 爪 C 的爪尖短,越過齒尖後要落 30° 才進齒間:落下的過程演出來(jumps.falling,佔輪轉角 DROP_C);
// 長爪與平桿爪每齒只落幾度,照接觸算即可。
// 彈簧片(原圖):一片 U 形板彈簧,上片從爪 C 的下緣伸出、往右彎成 U、下片回到框架上的固定座;
// 畫成一條隨爪彎曲的線:上片一端固定在爪上、隨爪轉,U 形彎與下片固定不動,彎曲吸收在上片裡。
import { TAU, deg, rot2 } from "./kit.js";
import { ratchetShape, circle, arcPoints, shape } from "./shapes.js";
import { ratchetObstacles } from "./ratchets.js";
import { swingUntilContact, dropValue, lastStop } from "./contact.js";
import { falling } from "./jumps.js";

export const WHEEL = { teeth: 22, outer: 1.7, inner: 1.45, dir: 1 };
const PERIOD = TAU / WHEEL.teeth;
const Z = 0.2; // 各爪與輪的齒在同一平面,略往前

const rel = (pivot, pts) => pts.map(([x, y]) => [x - pivot[0], y - pivot[1]]);

// 右上:平桿爪,樞軸在右端
const BAR = {
  pivot: [3.35, 1.2],
  outline: [
    [0.2, 0.18],
    [-2.3, 0.3],
    [-2.56, 0.04],
    [-2.3, -0.12],
    [0.2, -0.18],
  ],
};
// 左:沿輪緣彎曲的長爪,末端的鉤伸進齒間
const HOOK_PIVOT = [-2.0, -0.1];
const HOOK = {
  pivot: HOOK_PIVOT,
  outline: rel(HOOK_PIVOT, [
    ...arcPoints(2.12, deg(184), deg(119)),
    [1.5 * Math.cos(deg(117)), 1.5 * Math.sin(deg(117))],
    ...arcPoints(1.88, deg(125), deg(184)),
  ]),
};
// 下:爪 C,樞軸在中間,左邊是握把,右上是爪尖
const C = {
  pivot: [0, -1.9],
  outline: [
    [-1.0, -0.3],
    [-0.9, -0.48],
    [-0.6, -0.3],
    [0.15, -0.15],
    [0.4, 0.12],
    [0.3, 0.37],
    [0.08, 0.18],
    [-0.4, 0.05],
    [-0.95, -0.1],
  ],
};

const STOPS = {
  bar: { ...BAR, from: deg(-12), into: 1 },
  hook: { ...HOOK, from: deg(8), into: -1 },
  pawlC: { ...C, from: deg(-14), into: 1 },
};

export const stopAngle = (id, wheel) => {
  const s = STOPS[id];
  return swingUntilContact({ pivot: s.pivot, outline: s.outline, from: s.from, into: s.into, sweep: deg(35), steps: 40 }, ratchetObstacles(WHEEL, wheel));
};

// 各爪落進齒間的位置 = 倒轉時被擋住的位置
export const DROPS = Object.fromEntries(Object.keys(STOPS).map((id) => [id, dropValue((w) => stopAngle(id, w), PERIOD, 240)]));
export const STOP_OUTLINES = STOPS;

// 爪 C 落進齒間的過程:爪尖被齒尖頂到最高(HELD_C)、齒尖滑過爪尖的尖端後,爪加速落到接觸算出的轉角。
// stopAngle 從 −14° 起往輪擺,齒尖還頂著爪尖的斜面時就可能先找到落下的解;真正的落下時刻改從更抬高的
// 起點 LIFT_FROM 往輪擺來找:第一次碰到的位置從「頂在齒尖上」跳到「齒間」的那一刻(TIP_C,二分法逼近)。
// 齒尖頂著爪尖斜面的接觸帶很窄(不到一度),擺動的步數要夠細才掃得到。
const DROP_C = 0.08; // 落下佔輪轉角多少(約 0.16 秒)
const LIFT_FROM = stopAngle("pawlC", DROPS.pawlC - PERIOD / 240) - deg(3);
const liftedAngle = (w) => swingUntilContact({ pivot: C.pivot, outline: C.outline, from: LIFT_FROM, into: 1, sweep: deg(35), steps: 400 }, ratchetObstacles(WHEEL, w));
const TIP_C = (() => {
  let lo = DROPS.pawlC - PERIOD / 240;
  let hi = DROPS.pawlC + PERIOD / 8;
  const mid0 = (liftedAngle(lo) + liftedAngle(hi)) / 2;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (liftedAngle(mid) > mid0) hi = mid;
    else lo = mid;
  }
  return hi;
})();
const HELD_C = liftedAngle(TIP_C - 1e-6);
export function pawlCAngle(wheel) {
  const rest = stopAngle("pawlC", wheel);
  const u = wheel - lastStop(wheel, TIP_C, PERIOD); // 離齒尖滑過爪尖多久
  // 齒尖快滑過時(週期末),stopAngle 可能已找到落下的解,照齒尖頂著的轉角走
  if (u > PERIOD - PERIOD / 8) return Math.min(rest, liftedAngle(wheel));
  if (u >= DROP_C) return rest;
  return HELD_C + (rest - HELD_C) * falling(u / DROP_C);
}

// 彈簧片:上片從爪 C 下緣的 SPRING.root(爪的局部座標)沿 SPRING.dir 伸出,彎到固定的 U 形彎頂端 SPRING.bend;
// U 形彎的半徑 SPRING.r;下片從彎底回到固定座 SPRING.anchor
const SPRING = { root: [0.05, -0.22], dir: deg(-6), bend: [1.6, -2.25], r: 0.15, anchor: [0.56, -2.9] };
export function springPoints(pawl) {
  const [rx, ry] = rot2(SPRING.root, pawl);
  const p0 = [C.pivot[0] + rx, C.pivot[1] + ry];
  const d = SPRING.dir + pawl;
  const p1 = [p0[0] + 0.7 * Math.cos(d), p0[1] + 0.7 * Math.sin(d)];
  const p3 = SPRING.bend;
  const p2 = [p3[0] - 0.6, p3[1]];
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const a = (1 - t) ** 3, b = 3 * (1 - t) ** 2 * t, c = 3 * (1 - t) * t * t, e = t ** 3;
    pts.push([a * p0[0] + b * p1[0] + c * p2[0] + e * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + e * p3[1]]);
  }
  const cy = p3[1] - SPRING.r;
  for (let i = 1; i <= 8; i++) {
    const a = Math.PI / 2 - (Math.PI * i) / 8;
    pts.push([p3[0] + SPRING.r * Math.cos(a), cy + SPRING.r * Math.sin(a)]);
  }
  pts.push(SPRING.anchor);
  return pts.map(([x, y]) => [x, y, Z]);
}

const plateOf = (id, s, extra) => ({
  id,
  kind: "plate",
  center: [...s.pivot, Z],
  shape: shape(s.outline, [circle(0.07).reverse()]),
  thickness: 0.12,
  ...extra,
});

export default {
  figure: 240,
  parts: [
    {
      id: "wheel",
      kind: "plate",
      shape: ratchetShape({ ...WHEEL, bore: 0.14 }),
      thickness: 0.16,
      hub: 0.38,
      circles: [0.38],
      mark: [1.0, 0],
      markSize: 0.1,
      spin: WHEEL.outer,
      center: [0, 0, Z],
    },
    plateOf("bar", BAR),
    plateOf("hook", HOOK),
    plateOf("pawlC", C, { label: "C", labelOffset: [-0.75, 0.2, 0] }),
    { id: "spring", kind: "rod", radius: 0.045 },
    { id: "springSeat", kind: "cylinder", center: [...SPRING.anchor, Z], radius: 0.09, length: 0.24, pieces: [{ kind: "box", size: [0.3, 0.14, 0.24], at: [0, -0.14, 0] }] },
  ],
  driver: {
    part: "wheel",
    type: "rotation",
    initial: DROPS.bar,
    speed: 0.5,
    backstop: (v) => Math.max(...Object.values(DROPS).map((d) => lastStop(v, d, PERIOD))),
  },
  targets: ["hook", "bar", "pawlC"], // 三種擋止爪都是這張圖的重點
  view: { direction: [0.08, 0.06, 1] },
  pose(wheel) {
    const pawlC = pawlCAngle(wheel);
    return {
      parts: {
        wheel: { angle: wheel },
        bar: { angle: stopAngle("bar", wheel) },
        hook: { angle: stopAngle("hook", wheel) },
        pawlC: { angle: pawlC },
      },
      paths: { spring: { points: springPoints(pawlC), closed: false } },
      readouts: [],
    };
  },
};
