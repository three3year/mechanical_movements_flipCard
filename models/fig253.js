// 第 253 種:離心式制動鉤。框架 A 固定在礦井井壁上,附有固定的凸柱 D;捲繩鼓輪的凸緣 B 上以樞軸裝著三支制動鉤。
// 鼓輪正常轉動時,鉤子收在凸緣旁、從凸柱內側經過;若鼓輪轉得危險地快,鉤子因離心力往外甩出,
// 其中一支鉤住凸柱 D,制止鼓輪,掛在繩上的東西也就停止下降。
// 主動件是虛擬的「進程」:機械故障後鼓輪越轉越快 → 鉤子甩出 → 鉤住凸柱、鼓輪停住。
// 原圖三支鉤尖都往逆時針那一側彎;鉤尖要朝前才鉤得住凸柱,所以鼓輪逆時針轉,收著的鉤臂往後(順時針那一側)斜躺。
// 推斷:鼓輪加速的過程與鉤子甩出的轉速;鉤子收著的角度。原文另說鼓輪應加裝彈簧緩衝,原圖沒有畫,模型也不畫。
// 偏離插圖:原圖的鉤子長到框架 A 的邊緣、凸柱的內緣在 A 的 0.75 倍處,那樣長的鉤收著時鉤尖碰得到凸柱;
// 模型的鉤臂略短、凸柱略往內移,收著時整支鉤(含鉤尖與粗細)離凸柱內緣留出 0.14。
// 鉤住的時刻由接觸算:鉤子的外形(板的輪廓)第一次碰到凸柱(contact.js 的 polygonsOverlap)就停住,不穿入。
// 甩出的時機:轉速過了危險值(進程 0.4)之後,取第一個讓凸柱落進鉤的彎裡(碰到的是鉤臂前緣、鉤尖在凸柱外側)的時刻
// (推斷:實物上若鉤尖先撞到凸柱的頂端會被彈開、下一圈再甩出,模型不演這段)。
// 動力重演做不出來(宣告了,寫成豁免):鉤子是被離心力甩出的,鼓輪(照進程轉)被鉤住後停下也是照進程演的。
// 進程走滿一輪(p = 1)就從頭再演一次:鼓輪與鉤子瞬間回到起始位置,那是劇情重演,不是零件瞬移
// (鉤尖勾在凸柱後面,倒轉或收回鉤子都會撞進凸柱,做不出連續的「解開」過程)。
import { Z, TAU, deg, smooth, routeRope, rot2 } from "./kit.js";
import { shape, circle, thickLine } from "./shapes.js";
import { placeOutline, polygonsOverlap, circlePolygon } from "./contact.js";

const FRAME = 2.25;
const HUB = 0.45; // 捲繩的鼓輪
const FLANGE = 1.05; // 凸緣 B:原圖約為框架 A 的 0.47 倍,三支鉤的樞軸都在它裡面
const PIVOT = 0.78;
const ARM = 1.38; // 鉤臂長(樞軸到鉤尖轉角)
const BARB = 0.45; // 鉤尖長(原圖約 0.5)
const BARB_ANGLE = deg(100); // 鉤尖和鉤臂的夾角:往前彎、略往樞軸那邊回勾
const WIDTH = 0.09; // 鉤子的粗細
const STUD = { r: 1.85, size: 0.17 };
const HOOKS = [deg(90), deg(210), deg(330)];
const STUDS = [deg(120), deg(240), deg(0)];
const FOLDED = deg(115); // 鉤臂往後斜躺、和徑向的夾角:收著時
const OUT = deg(5); // 甩出時
const TURNS = 3.2; // 進程一輪內(未被擋住時)鼓輪轉的圈數
const DANGER = 0.4; // 轉速過了危險值的進程
const FLING = 0.08; // 甩出所花的進程

// 鉤子:沿局部 +X(鉤臂方向)長 ARM,末端往逆時針側(局部 +Y)彎成鉤尖
const HOOK = thickLine([[0, 0], [ARM, 0], [ARM + BARB * Math.cos(BARB_ANGLE), BARB * Math.sin(BARB_ANGLE)]], WIDTH);
const studCenter = (a) => [STUD.r * Math.cos(a), STUD.r * Math.sin(a)];
const STUD_POLYS = STUDS.map((a) => circlePolygon(studCenter(a), STUD.size, 48));

/** 鼓輪(逆時針)在進程 p 時的轉角:越轉越快 */
const freeAngle = (p) => TAU * TURNS * (0.25 * p + 0.75 * p * p * p);

/** 鼓輪轉角 drum、鉤臂往後斜躺的角度 beta → 三支鉤子的位置與轉角 */
export function hookPoses(drum, beta) {
  return HOOKS.map((h) => ({ position: rot2([PIVOT, 0], drum + h), angle: drum + h - beta }));
}
const hits = (drum, beta) => hookPoses(drum, beta).some(({ position, angle }) => STUD_POLYS.some((s) => polygonsOverlap(placeOutline(HOOK, position, angle), s)));

/** 從進程 from 起往前找第一次碰到凸柱的進程(逐步往前找,再以二分法逼近);沒碰到回傳 1 */
function firstContact(angleAt, from, steps = 2000) {
  let prev = from;
  for (let i = 1; i <= steps; i++) {
    const p = from + ((1 - from) * i) / steps;
    if (hits(...angleAt(p))) {
      let [lo, hi] = [prev, p];
      for (let k = 0; k < 40; k++) {
        const mid = (lo + hi) / 2;
        if (hits(...angleAt(mid))) hi = mid;
        else lo = mid;
      }
      return lo;
    }
    prev = p;
  }
  return 1;
}

// 凸柱是不是落在鉤的彎裡:圓心在鉤臂前方那一側、比鉤尖轉角靠內,且貼著鉤臂前緣
function caught(drum, beta) {
  return hookPoses(drum, beta).some(({ position, angle }) =>
    STUDS.some((a) => {
      const c = studCenter(a);
      const [x, y] = rot2([c[0] - position[0], c[1] - position[1]], -angle);
      return x < ARM - STUD.size && Math.abs(y - (STUD.size + WIDTH / 2)) < 0.01;
    }),
  );
}

// 甩出的時機與鉤住的進程
const { F0, P_STOP } = (() => {
  for (let f0 = DANGER; f0 < 0.6; f0 += 0.0025) {
    const angleAt = (p) => [freeAngle(p), FOLDED + (OUT - FOLDED) * smooth((p - f0) / FLING)];
    const stop = firstContact(angleAt, 0);
    if (stop < 1 && caught(...angleAt(stop))) return { F0: f0, P_STOP: stop };
  }
  throw new Error("第 253 種:找不到鉤得住凸柱的甩出時機");
})();
const flung = (p) => smooth((p - F0) / FLING);
const STOP = freeAngle(P_STOP);

/** 進程 p → 鼓輪轉角、鉤臂往後斜躺的角度、是否已被擋住 */
export function check(p) {
  const t = ((p % 1) + 1) % 1;
  const stopped = t >= P_STOP;
  const drum = stopped ? STOP : freeAngle(t);
  const beta = FOLDED + (OUT - FOLDED) * flung(Math.min(t, P_STOP)); // 鉤住之後鉤子也停在那裡
  return { drum, beta, stopped, tipRadius: Math.hypot(...rot2([ARM, 0], -beta).map((v, i) => v + (i ? 0 : PIVOT))) };
}
export const geometry = { STUD, P_STOP, FOLDED, ARM, hookPoses };

const rope = routeRope([{ point: [-HUB - 0.04, -2.7, 0.35] }, { circle: { center: [0, 0, 0.35], axis: Z, radius: HUB + 0.04, sense: -1 } }, { point: [HUB + 0.04, -2.7, 0.35] }]);

const hookShape = shape(HOOK, [circle(0.04).reverse()]);
// 三根凸柱同一個深度範圍(世界 z −0.19–0.31):後端貼著框架 A 的正面,前端越過鉤子那一層
const STUD_Z = 0.06;
const stud = (a, base) => ({ kind: "cylinder", radius: STUD.size, length: 0.5, at: [...studCenter(a), STUD_Z - base] });

export default {
  figure: 253,
  parts: [
    {
      id: "frameA",
      kind: "plate",
      center: [0, 0, -0.25],
      shape: shape(circle(FRAME), [circle(0.2).reverse()]),
      thickness: 0.12,
      label: "A",
      labelOffset: [1.3, 1.3, 0.3],
      pieces: [stud(STUDS[2], -0.25)],
    },
    { id: "studD1", kind: "group", center: [0, 0, 0], pieces: [stud(STUDS[0], 0)], label: "D", labelOffset: [STUD.r * Math.cos(STUDS[0]) - 0.35, STUD.r * Math.sin(STUDS[0]) - 0.3, 0.4] },
    { id: "studD2", kind: "group", center: [0, 0, 0], pieces: [stud(STUDS[1], 0)], label: "D", labelOffset: [STUD.r * Math.cos(STUDS[1]) + 0.1, STUD.r * Math.sin(STUDS[1]) + 0.4, 0.4] },
    {
      id: "flangeB",
      kind: "plate",
      shape: shape(circle(FLANGE), [circle(0.12).reverse()]),
      thickness: 0.12,
      mark: [FLANGE - 0.12, 0],
      markSize: 0.07,
      spin: FLANGE,
      label: "B",
      labelOffset: [0.3, 0.62, 0.4],
      pieces: [{ kind: "cylinder", radius: HUB, length: 0.6, at: [0, 0, 0.3] }, { kind: "cylinder", radius: 0.12, length: 1.0, at: [0, 0, 0.1] }], // 鼓輪與軸(軸往後穿過框架 A 的孔)
    },
    ...HOOKS.map((_, i) => ({ id: `hook${i}`, kind: "plate", shape: hookShape, thickness: 0.08, arrow: false, pieces: [{ kind: "cylinder", radius: 0.07, length: 0.22 }] })),
    { id: "rope", kind: "rope" },
  ],
  // 動力重演:鉤子鉸在凸緣上的樞軸,鼓輪照進程越轉越快,鉤子要被甩出、鉤住凸柱
  replay: {
    to: P_STOP + 0.05,
    seconds: 12,
    free: Object.fromEntries(HOOKS.map((_, i) => [`hook${i}`, { on: "flangeB", gravity: false }])),
    expect: [{ at: P_STOP + 0.05, part: "hook0", label: "轉得危險地快時鉤子甩出、鉤住凸柱", quote: "鉤子便會因離心力而向外甩出" }],
  },
  waivers: [
    {
      check: "replay",
      parts: ["hook0"],
      reason:
        "重演做不出來:鉤子是被離心力甩出的,重演引擎的自由零件只受重力、彈簧與碰撞,裝在轉動零件上的鉸接零件沒有離心力,鉤子一直收著;而且鼓輪是照進程轉的主動件,被鉤住後停下也是照進程演的,重演擋不住它。鉤住的時刻由鉤子的外形第一次碰到凸柱算出(contact.js),測試量鉤子的外形:收著時離凸柱 0.05 以上、全程不穿入、停住時貼著凸柱",
    },
  ],
  powered: ["rope"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], speed: 0.1 },

  targets: ["hook0", "hook1", "hook2"], // 重點是甩出去鉤住凸柱的制動鉤
  view: { direction: [0.04, 0.04, 1] },
  pose(p) {
    const { drum, beta } = check(p);
    const parts = { flangeB: { angle: drum } };
    hookPoses(drum, beta).forEach(({ position, angle }, i) => {
      parts[`hook${i}`] = { position: [...position, 0.12], angle };
    });
    return { parts, paths: { rope: { points: rope.points, closed: false, phase: drum * (HUB + 0.04) * -1 } }, readouts: [] };
  },
};
