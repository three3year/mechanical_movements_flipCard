// 第 253 種:離心式制動鉤。框架 A 固定在礦井井壁上,附有固定的凸柱 D;捲繩鼓輪的凸緣 B 上以樞軸裝著三支制動鉤。
// 鼓輪正常轉動時,鉤子收在凸緣旁、從凸柱內側經過;若鼓輪轉得危險地快,鉤子因離心力往外甩出,
// 其中一支鉤住凸柱 D,制止鼓輪,掛在繩上的東西也就停止下降。
// 主動件是虛擬的「進程」:機械故障後鼓輪越轉越快 → 鉤子甩出 → 鉤住凸柱、鼓輪停住。
// 推斷:鼓輪加速的過程與鉤子甩出的轉速;鉤子的形狀(依原圖)。原文另說鼓輪應加裝彈簧緩衝,原圖沒有畫,模型也不畫。
// 動力重演不適用:鉤子是被離心力甩出的,鼓輪(照進程轉)被鉤住後停下也是照進程演的——重演只能推主動件,
// 擋不住它;鉤尖碰到凸柱的時刻以幾何(鉤尖離凸柱的距離)算出。
// 進程走滿一輪(p = 1)就從頭再演一次:鼓輪與鉤子瞬間回到起始位置,那是劇情重演,不是零件瞬移
// (鉤尖勾在凸柱後面,倒轉或收回鉤子都會撞進凸柱,做不出連續的「解開」過程)。
import { Z, TAU, deg, smooth, routeRope, rot2 } from "./kit.js";
import { shape, circle, thickLine } from "./shapes.js";

const HUB = 0.45; // 捲繩的鼓輪
const FLANGE = 0.8;
const PIVOT = 0.62;
const ARM = 1.0;
const STUD = { r: 1.74, size: 0.17 };
const HOOKS = [deg(90), deg(210), deg(330)];
const STUDS = [deg(128), deg(248), deg(8)];
const FOLDED = deg(60); // 鉤臂與徑向的夾角:收著時斜向後方,鉤尖在凸柱內側
const OUT = deg(16); // 甩出時
const TURNS = 3.2; // 進程一輪內(未被擋住時)鼓輪轉的圈數

/** 鼓輪(順時針)在進程 p 時的轉角:越轉越快 */
const freeAngle = (p) => -TAU * TURNS * (0.25 * p + 0.75 * p * p * p);
/** 鉤子甩出的程度(0 收著、1 甩出):轉速過了危險值才甩出 */
const flung = (p) => smooth((p - 0.4) / 0.14);

// 鉤尖相對鉤子樞軸的位置(樞軸在徑向 PIVOT 處,beta 是鉤臂與徑向的夾角)
const tipAngle = (beta) => Math.atan2(ARM * Math.sin(beta), PIVOT + ARM * Math.cos(beta));
const tipRadius = (beta) => Math.hypot(PIVOT + ARM * Math.cos(beta), ARM * Math.sin(beta));
const REACH = STUD.size + 0.06; // 鉤尖(含鉤的粗細)碰到凸柱時,鉤尖離凸柱中心的距離

// 鉤尖離最近凸柱中心的距離(鼓輪轉角 drum、鉤臂夾角 beta)
function clearance(drum, beta) {
  let best = Infinity;
  const r = tipRadius(beta);
  for (const h of HOOKS) {
    const a = drum + h + tipAngle(beta);
    for (const s of STUDS) best = Math.min(best, Math.hypot(r * Math.cos(a) - STUD.r * Math.cos(s), r * Math.sin(a) - STUD.r * Math.sin(s)));
  }
  return best;
}
const hit = (p) => clearance(freeAngle(p), FOLDED + (OUT - FOLDED) * flung(p)) <= REACH;

// 第一次碰到凸柱的進程:逐步往前找,再以二分法逼近
const P_STOP = (() => {
  const steps = 4000;
  for (let i = 1; i <= steps; i++) {
    if (!hit(i / steps)) continue;
    let lo = (i - 1) / steps;
    let hi = i / steps;
    for (let k = 0; k < 40; k++) {
      const mid = (lo + hi) / 2;
      if (hit(mid)) hi = mid;
      else lo = mid;
    }
    return lo;
  }
  return 1;
})();
const STOP = freeAngle(P_STOP);

/** 進程 p → 鼓輪轉角、鉤臂與徑向的夾角、是否已被擋住 */
export function check(p) {
  const t = ((p % 1) + 1) % 1;
  const stopped = t >= P_STOP;
  const drum = stopped ? STOP : freeAngle(t);
  const beta = FOLDED + (OUT - FOLDED) * flung(Math.min(t, P_STOP)); // 鉤住之後鉤子也停在那裡
  return { drum, beta, stopped, tipRadius: tipRadius(beta) };
}
export const geometry = { STUD, P_STOP, REACH, clearance };

const rope = routeRope([{ point: [-HUB - 0.04, -2.7, 0.35] }, { circle: { center: [0, 0, 0.35], axis: Z, radius: HUB + 0.04, sense: -1 } }, { point: [HUB + 0.04, -2.7, 0.35] }]);

// 鉤子:沿局部 +X(鉤臂方向)長 ARM,末端往順時針側(局部 −Y)彎成鉤
const hookShape = shape(thickLine([[0, 0], [ARM, 0], [ARM + 0.08, -0.22]], 0.09), [circle(0.04).reverse()]);
const stud = (a) => ({ kind: "cylinder", radius: STUD.size, length: 0.5, at: [STUD.r * Math.cos(a), STUD.r * Math.sin(a), 0.1] });

export default {
  figure: 253,
  parts: [
    {
      id: "frameA",
      kind: "plate",
      center: [0, 0, -0.25],
      shape: shape(circle(2.25), [circle(0.2).reverse()]),
      thickness: 0.12,
      circles: [1.05],
      label: "A",
      labelOffset: [1.3, 1.3, 0.3],
      pieces: [stud(STUDS[2])],
    },
    { id: "studD1", kind: "group", center: [0, 0, -0.04], pieces: [stud(STUDS[0])], label: "D", labelOffset: [STUD.r * Math.cos(STUDS[0]) - 0.35, STUD.r * Math.sin(STUDS[0]) - 0.25, 0.4] },
    { id: "studD2", kind: "group", center: [0, 0, -0.04], pieces: [stud(STUDS[1])], label: "D", labelOffset: [STUD.r * Math.cos(STUDS[1]) + 0.1, STUD.r * Math.sin(STUDS[1]) + 0.35, 0.4] },
    {
      id: "flangeB",
      kind: "plate",
      shape: shape(circle(FLANGE), [circle(0.12).reverse()]),
      thickness: 0.12,
      mark: [FLANGE - 0.12, 0],
      markSize: 0.07,
      spin: FLANGE,
      label: "B",
      labelOffset: [0.28, 0.5, 0.4],
      pieces: [{ kind: "cylinder", radius: HUB, length: 0.6, at: [0, 0, 0.3] }, { kind: "cylinder", radius: 0.12, length: 1.0, at: [0, 0, 0.1] }], // 鼓輪與軸(軸往後穿過框架 A 的孔)
    },
    ...HOOKS.map((_, i) => ({ id: `hook${i}`, kind: "plate", shape: hookShape, thickness: 0.08, arrow: false, pieces: [{ kind: "cylinder", radius: 0.07, length: 0.22 }] })),
    { id: "rope", kind: "rope" },
  ],
  powered: ["rope"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], speed: 0.1 },

  targets: ["hook0", "hook1", "hook2"], // 重點是甩出去鉤住凸柱的制動鉤
  view: { direction: [0.04, 0.04, 1] },
  pose(p) {
    const { drum, beta } = check(p);
    const parts = { flangeB: { angle: drum } };
    HOOKS.forEach((h, i) => {
      const [x, y] = rot2([PIVOT, 0], drum + h);
      parts[`hook${i}`] = { position: [x, y, 0.12], angle: drum + h + beta };
    });
    return { parts, paths: { rope: { points: rope.points, closed: false, phase: drum * (HUB + 0.04) * -1 } }, readouts: [] };
  },
};
