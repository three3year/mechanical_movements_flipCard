// 第 374 種:以一條無端皮帶把踏板的動作變成軸的旋轉。皮帶從踏板中段的滾子繞到上方軸上的偏心輪;
// 踩下踏板時皮帶拉著偏心輪往下,軸轉半圈;偏心輪轉過底部後再把踏板拉起。原圖右上的虛線圓是偏心輪轉了半圈後的位置
// (預覽運動線,不畫成零件),不是偏心輪中心走的軌跡。
// 主動件是踏板(原文:運動從踏板傳給軸),往復踩動;踏板每走一程(上死點到下死點)軸轉半圈,軸的轉角由皮帶的幾何反推。
// 目標件是軸。偏心距是偏心輪半徑的一半(507movements 的動畫:2.5 / 5;原圖畫得比較大)。
// 推斷:皮帶長度不變,所以滾子中心與偏心輪中心的距離固定;皮帶在偏心輪與滾子上都不打滑,滾子照皮帶走的長度轉;
// 滾子套在踏板上的一根銷上;踏板的支點在右端;軸的軸承座與踏板支點的支座。
import { Z, TAU, routeBelt, swingPhase, signedAngle } from "./kit.js";
import { pedestal } from "./supports.js";
import { circleCircle, angleOf } from "./linkage.js";
import { shape, circle, hubArms } from "./shapes.js";

const SHAFT = [0.55, 1.6, 0];
const DISK = 0.75; // 偏心輪半徑
const ECC = DISK / 2; // 偏心距
const AXLE = 0.12; // 軸半徑(偏心輪的孔一樣大)
const ROLLER = 0.18;
const PIN = 0.06; // 滾子的銷
const PIVOT_PIN = 0.1; // 踏板支點的銷
const PIVOT = [2.0, -1.95, 0]; // 踏板支點
const ARM = 1.75; // 支點到滾子
export const SPAN = 3.15; // 滾子中心到偏心輪中心(皮帶長度不變)

/** 軸轉 theta → 偏心輪中心、滾子中心、踏板角 */
export function treadle(theta) {
  const e = [SHAFT[0] + ECC * Math.cos(theta), SHAFT[1] + ECC * Math.sin(theta), 0];
  const roller = circleCircle(PIVOT, ARM, e, SPAN, 1).point;
  return { e, roller, angle: angleOf(PIVOT, roller) };
}

// 踏板角(以支點為原點,與模型的姿勢同一個量):在上、下死點之間單調,所以一程對應軸的半圈
const pedal = (theta) => signedAngle(treadle(theta).angle + Math.PI);
const [TOP, BOTTOM] = (() => {
  let hi = { a: -Infinity }, lo = { a: Infinity };
  for (let i = 0; i < 7200; i++) {
    const t = (i / 7200) * TAU;
    const a = pedal(t);
    if (a > hi.a) hi = { a, t };
    if (a < lo.a) lo = { a, t };
  }
  return [hi, lo];
})();
const DOWN = ((BOTTOM.t - TOP.t) % TAU + TAU) % TAU; // 往下踩那一程軸轉過的角度
export const PEDAL = [TOP.a, BOTTOM.a];

/** 踏板的累計行程 v → 軸的轉角(往下踩時軸從上死點轉到下死點,放開時偏心輪把踏板拉起、軸轉完另一段) */
export function shaftAngle(v) {
  const { at, cycle, forward } = swingPhase(v, TOP.a, BOTTOM.a);
  const [from, span] = forward ? [TOP.t, DOWN] : [TOP.t + DOWN, TAU - DOWN];
  let lo = 0;
  let hi = 1;
  const sign = forward ? -1 : 1; // 往下踩那一程踏板角變小
  for (let k = 0; k < 50; k++) {
    const mid = (lo + hi) / 2;
    if (sign * (pedal(from + span * mid) - at) < 0) lo = mid;
    else hi = mid;
  }
  return cycle * TAU + from + span * ((lo + hi) / 2);
}

// 兩輪連心線的方向(由偏心輪中心指向滾子)。兩輪大小與距離不變,皮帶離開、繞上兩輪的切點跟著連心線轉
const lineOfCenters = (theta) => {
  const t = treadle(theta);
  return Math.atan2(t.roller[1] - t.e[1], t.roller[0] - t.e[0]);
};
const LINE0 = lineOfCenters(0);

/**
 * 軸轉 theta(累計)→ 皮帶走的長度、滾子的轉角。皮帶不打滑:輪面相對切點(跟著連心線轉)的轉角乘半徑 = 皮帶走的長度,
 * 所以偏心輪轉 dθ、連心線轉 dα 時皮帶走 DISK·(dθ − dα),滾子轉 皮帶長 / ROLLER + dα
 */
export function belt(theta) {
  const turn = signedAngle(lineOfCenters(theta) - LINE0); // 連心線只在小範圍內來回擺
  const travel = DISK * (theta - turn);
  return { travel, roller: travel / ROLLER + turn };
}

export default {
  figure: 374,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 軸的軸承座在偏心輪後面;踏板支點的銷立在地上的支座上
        ...pedestal({ at: [SHAFT[0], SHAFT[1]], z: -0.45, bore: 0.13, floor: -2.45 }),
        { kind: "cylinder", radius: PIVOT_PIN, length: 0.6, at: [PIVOT[0], PIVOT[1], -0.05] },
        { kind: "box", size: [0.3, 0.45, 0.3], at: [PIVOT[0], PIVOT[1] - 0.3, -0.4] },
        { kind: "box", size: [4.6, 0.15, 0.8], at: [0.2, -2.52, -0.3] },
      ],
    },
    {
      id: "shaft",
      kind: "group",
      center: SHAFT,
      spin: ECC + DISK,
      pieces: [
        { kind: "plate", shape: shape(circle(DISK), [circle(AXLE, -ECC, 0).reverse()]), thickness: 0.2, at: [ECC, 0, 0] },
        { kind: "cylinder", radius: AXLE, length: 0.75, at: [0, 0, -0.2] }, // 軸,往後伸進軸承座
        { kind: "box", size: [0.15, 0.15, 0.22], at: [ECC + DISK - 0.15, 0, 0], accent: true },
      ],
    },
    {
      id: "treadle",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        // 踏板在滾子後面一層(z −0.22..−0.1),滾子的銷從踏板背面穿過滾子,前端一個銷頭擋住。
        // 支點的銷孔比踏板寬,支點端畫成圓轂(半徑 0.17,孔外留一圈和踏板半寬一樣的肉)
        { kind: "plate", shape: shape(hubArms(PIVOT_PIN + 0.07, 0.14, [{ angle: Math.PI, length: ARM + 1.8 }]), [circle(PIVOT_PIN).reverse()]), thickness: 0.12, at: [0, 0, -0.16] },
        { kind: "cylinder", radius: PIN, length: 0.36, at: [-ARM, 0, -0.04], role: "rollerPin" },
        { kind: "cylinder", radius: 0.1, length: 0.04, at: [-ARM, 0, 0.12] },
      ],
    },
    {
      id: "roller",
      kind: "group",
      arrow: false,
      pieces: [{ kind: "plate", shape: shape(circle(ROLLER), [circle(PIN).reverse()]), thickness: 0.2, mark: [ROLLER * 0.62, 0], markSize: 0.04 }],
    },
    { id: "belt", kind: "belt" },
  ],
  driver: { part: "treadle", type: "rotation", cycle: PEDAL },
  target: "shaft", // 被踏板經皮帶帶著轉的軸
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const theta = shaftAngle(v);
    const t = treadle(theta);
    const b = belt(theta);
    const route = routeBelt([
      { center: [t.e[0], t.e[1], 0], axis: Z, radius: DISK, sense: 1 },
      { center: [t.roller[0], t.roller[1], 0], axis: Z, radius: ROLLER, sense: 1 },
    ]);
    return {
      parts: { shaft: { angle: theta }, treadle: { angle: pedal(theta) }, roller: { position: t.roller, angle: b.roller } },
      paths: { belt: { points: route.points, closed: true, phase: b.travel } },
      readouts: [],
    };
  },
};
