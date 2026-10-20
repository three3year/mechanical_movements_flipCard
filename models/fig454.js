// 第 454 種:隔膜式壓力泵。以撓性隔膜代替風箱,閥門的配置與前一種相同。
// 主動件是手柄(在左上,往上抬把隔膜拉起)。
// 推斷(照原圖 2026-10-20 重排):隔膜的邊緣夾在水室頂上的凸緣與夾環之間(夾環以螺栓鎖住),中央往下垂成碗形,
// 中心接著活塞桿下端的壓板;隔膜拉起時底部的吸水閥打開,壓下時水經右邊的出水管、圓頂閥室裡的出水閥往上送。
// 隔膜的長度固定:壓板拉高時多出的材料在兩側捲成圈(像滾動隔膜),所以中心一直在夾環下面。
// 剖面圖:水室的底在吸水管處、右壁在出水管處都真的開口。
import { deg } from "./kit.js";
import { stream } from "./flow.js";
import { stroke, valveOpening, flap, pipeWalls, valveDome, water } from "./pump.js";
import { shape, thickLine, circle, spanBox } from "./shapes.js";

const PIVOT = [-0.75, 1.55, 0];
const SHORT = 0.75; // 支點到桿頂(往右)
const LINK = 0.3;
export const ROD = 1.25;
const RIM = 0.25; // 水室壁的頂(凸緣)
const HALF = 0.85; // 水室半寬(壁的中心線)
export const SWING = [deg(18), deg(-18)]; // 手柄端(左)往上 → 往下
const OPEN = deg(50);
export const CLAMP_Y = RIM + 0.095; // 隔膜夾著的平面(凸緣頂 RIM+0.05 與夾環底之間)
const FLOOR = [-0.64, -0.56]; // 水室的底
const WALL_T = 0.08;
const FLANGE = [HALF - 0.12, HALF + 0.12]; // 凸緣、夾環的 x 範圍(半邊)
const PLATE_HALF = 0.15; // 壓板的半寬
const BOWL_X0 = HALF - 0.18; // 隔膜從這裡開始往下垂(夾環內緣再往內一點,壓到底的彎折處才不碰凸緣的角)
const SIDE_LEN = 0.82; // 隔膜兩側(從夾環到壓板邊)的材料長度,比拉到最低時的弦長(0.80)長一點
const SIDE_N = 10; // 每一側折成幾段
const DEPTH = 0.8;
const OUT_Y = -0.15; // 出水管從右壁接出的高度
const OUT_W = 0.28; // 出水管:通道 0.22、壁在 ±(0.11..0.17)
const OUT_X = 1.55; // 出水管往上那一段與閥室的軸線
const SEAT_Y = 0.45; // 出水閥的閥座(圓頂閥室的底)
const INLET_W = 0.3; // 吸水管:通道 0.24
const INLET_IN = INLET_W / 2 - 0.03;

/** 手柄轉 theta → 桿頂、壓板下的隔膜中心線高度(相對夾著的平面,負的往下垂;壓板底在中心線上 0.03) */
export function diaphragm(theta) {
  const E = [PIVOT[0] + SHORT * Math.cos(theta), PIVOT[1] + SHORT * Math.sin(theta)];
  const top = E[1] - Math.sqrt(LINK * LINK - E[0] * E[0]);
  return { E, top, center: top - ROD - 0.03 - CLAMP_Y }; // 壓板的底(桿的下端)壓進隔膜 0.01(貼合)
}

// 兩點之間長 SIDE_LEN(折線總長)的圓弧,往 bulge 那一側鼓:二分弧的圓心角,讓 SIDE_N 段折線的總長正好是 SIDE_LEN
function sideArc(A, B, bulge) {
  const c = Math.hypot(B[0] - A[0], B[1] - A[1]);
  const polyLength = (alpha) => (alpha < 1e-9 ? c : ((2 * SIDE_N * Math.sin(alpha / (2 * SIDE_N))) / (2 * Math.sin(alpha / 2))) * c);
  let lo = 0;
  let hi = 1.95 * Math.PI;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (polyLength(mid) < SIDE_LEN) lo = mid;
    else hi = mid;
  }
  const alpha = (lo + hi) / 2;
  if (alpha < 1e-6) return Array.from({ length: SIDE_N + 1 }, (_, i) => [A[0] + ((B[0] - A[0]) * i) / SIDE_N, A[1] + ((B[1] - A[1]) * i) / SIDE_N]);
  const R = c / (2 * Math.sin(alpha / 2));
  const mid = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
  let n = [-(B[1] - A[1]) / c, (B[0] - A[0]) / c]; // 弦的法線
  if (n[0] * bulge[0] + n[1] * bulge[1] > 0) n = [-n[0], -n[1]]; // 讓 n 指向圓心那一側(鼓的反方向)
  const centre = [mid[0] + n[0] * R * Math.cos(alpha / 2), mid[1] + n[1] * R * Math.cos(alpha / 2)];
  const a0 = Math.atan2(A[1] - centre[1], A[0] - centre[0]);
  const a1 = Math.atan2(B[1] - centre[1], B[0] - centre[0]);
  // 從 A 轉到 B,走過 alpha(方向看 B 在 A 的哪一邊)
  let d = a1 - a0;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  const sign = Math.abs(Math.abs(d) - alpha) < Math.abs(Math.abs(d) - (2 * Math.PI - alpha)) ? Math.sign(d) : -Math.sign(d);
  return Array.from({ length: SIDE_N + 1 }, (_, i) => {
    const a = a0 + (sign * alpha * i) / SIDE_N;
    return [centre[0] + R * Math.cos(a), centre[1] + R * Math.sin(a)];
  });
}

// 隔膜:右夾環裡的平段 → 右側的弧 → 壓板下的平段 → 左側的弧 → 左夾環裡的平段(d 是中心線相對夾著的平面的高度)
const membrane = (d) => {
  const y = CLAMP_Y + d;
  const right = sideArc([BOWL_X0, CLAMP_Y], [PLATE_HALF, y], [0, -1]);
  const left = sideArc([-PLATE_HALF, y], [-BOWL_X0, CLAMP_Y], [0, -1]);
  return [[HALF + 0.03, CLAMP_Y], ...right, ...left, [-HALF - 0.03, CLAMP_Y]].map(([x, yy]) => [x, yy, 0.1]);
};

const OUT = [[HALF - WALL_T / 2, OUT_Y], [OUT_X, OUT_Y], [OUT_X, SEAT_Y]];
const DELIVERY = [[OUT_X, SEAT_Y + 0.55], [OUT_X, 1.9]];
const INLET = [[0, -1.5], [0, FLOOR[0]]];

export default {
  figure: 454,
  parts: [
    {
      id: "works",
      kind: "group",
      pieces: [
        // 水室:底(中央開吸水管的口;口是圓的,剖面後面的底留著,畫成後面的一條)、左壁、右壁(出水管處斷開)、頂上的凸緣
        spanBox(-HALF - WALL_T / 2, -INLET_IN, ...FLOOR, -DEPTH / 2, DEPTH / 2),
        spanBox(-HALF - WALL_T / 2, HALF + WALL_T / 2, ...FLOOR, -DEPTH / 2, -DEPTH / 2 + 0.1),
        spanBox(INLET_IN, HALF + WALL_T / 2, ...FLOOR, -DEPTH / 2, DEPTH / 2),
        spanBox(-HALF - WALL_T / 2, -HALF + WALL_T / 2, FLOOR[0], RIM + 0.05, -DEPTH / 2, DEPTH / 2),
        spanBox(HALF - WALL_T / 2, HALF + WALL_T / 2, FLOOR[0], OUT_Y - OUT_W / 2 - 0.03, -DEPTH / 2, DEPTH / 2),
        spanBox(HALF - WALL_T / 2, HALF + WALL_T / 2, OUT_Y + OUT_W / 2 + 0.03, RIM + 0.05, -DEPTH / 2, DEPTH / 2),
        ...[-1, 1].flatMap((s) => [
          spanBox(s * FLANGE[0], s * FLANGE[1], RIM - 0.03, RIM + 0.05, -DEPTH / 2, DEPTH / 2), // 凸緣
          spanBox(s * FLANGE[0], s * FLANGE[1], CLAMP_Y + 0.045, CLAMP_Y + 0.125, -DEPTH / 2, DEPTH / 2), // 夾環(推斷)
          spanBox(s * (HALF + 0.06), s * (HALF + 0.1), RIM - 0.03, CLAMP_Y + 0.125, -0.06, 0.06), // 鎖夾環的螺栓(推斷)
        ]),
        // 吸水管、出水管、出水閥的圓頂閥室(原圖出水管頂上的圓頂)與往上的出水管、手柄支柱
        ...pipeWalls(INLET, INLET_W),
        ...pipeWalls(OUT, OUT_W),
        ...valveDome(OUT_X, SEAT_Y, { seat: OUT_W / 2 - 0.03 }),
        ...pipeWalls(DELIVERY, 0.2),
        { kind: "plate", shape: shape(thickLine([[-0.7, CLAMP_Y + 0.12], [-0.75, PIVOT[1]], [-0.76, PIVOT[1] + 0.1]], 0.12)), thickness: 0.15, at: [0, 0, -0.2] },
        { kind: "cylinder", radius: 0.035, length: 0.35, at: [PIVOT[0], PIVOT[1], -0.12] }, // 手柄的樞軸銷:從支柱穿過手柄
      ],
    },
    { id: "membrane", kind: "rod", radius: 0.04 },
    { id: "rod", kind: "cylinder", axis: [0, 1, 0], radius: 0.04, length: ROD, arrow: false, pieces: [{ kind: "box", size: [2 * PLATE_HALF, 0.4, 0.06], at: [0, 0, -ROD / 2 + 0.03] }] }, // 壓板:桿的局部 y 是世界的 z、局部 z 是世界的 y
    // 手柄:支點在原點,短臂往右接桿,把手往左下彎(右端比銷孔多留 0.1,孔才整個在外形裡)
    { id: "handle", kind: "plate", shape: shape(thickLine([[SHORT + 0.1, 0], [SHORT, 0], [0, 0], [-0.7, -0.25], [-1.5, -0.85]], 0.1), [circle(0.04).reverse(), circle(0.04, SHORT, 0).reverse()]), thickness: 0.08, arrow: false, pieces: [{ kind: "sphere", radius: 0.11, at: [-1.5, -0.85, 0] }] },
    { id: "link", kind: "link", width: 0.08, thickness: 0.05 },
    { id: "chamberWater", kind: "fill", fluid: "water", size: [2 * HALF - 0.1, 0.9, 0.7], level: 1 },
    flap("suctionValve", 0.26),
    flap("deliveryValve", 0.36),
  ],
  powered: ["suctionValve", "deliveryValve"], // 外力來源:閥瓣是被水頂開的(流體傳動,沒有實體相連)
  driver: { part: "handle", type: "rotation", cycle: SWING },
  target: "rod", // 隔膜是路徑零件(不上目標色),標接在隔膜中心、帶著它起落的桿
  view: { direction: [0.08, 0.08, 1] },
  pose(v) {
    const phase = stroke(v, ...SWING);
    const { at, forward } = phase;
    // 手柄的把手在左;往下壓(逆時針轉)→ 桿頂往上 → 隔膜被拉起
    const theta = -at;
    const d = diaphragm(theta);
    const rising = forward;
    const travel = v * 5;
    const flows = rising
      ? [{ fluid: "water", points: stream([[0, -1.45, 0.2], [0, -0.3, 0.2]], travel, { spacing: 0.16 }) }]
      : [{ fluid: "water", points: stream([[0.3, OUT_Y, 0.2], ...OUT.slice(1).map(([x, y]) => [x, y, 0.2]), ...DELIVERY.map(([x, y]) => [x, y, 0.2]), [1.8, 2.1, 0.2], [2.0, 1.5, 0.2]], travel, { spacing: 0.16 }) }];
    return {
      parts: {
        handle: { position: PIVOT, angle: theta },
        link: { from: [d.E[0], d.E[1], 0.1], to: [0, d.top, 0.1] },
        rod: { position: [0, d.top - ROD / 2, 0] },
        // 閥瓣被水頂開、回程加速落回閥座(pump.js 的 valveOpening):吸水閥躺在底的開口上,出水閥鉸在閥室的閥座上
        suctionValve: { position: [-INLET_IN - 0.01, FLOOR[1] + 0.03, 0.1], angle: OPEN * valveOpening(rising, phase) },
        deliveryValve: { position: [OUT_X - 0.2, SEAT_Y + 0.09, 0], angle: OPEN * valveOpening(!rising, phase) },
        chamberWater: water(0, FLOOR[1], CLAMP_Y + d.center - 0.04, 0.9),
      },
      paths: { membrane: { points: membrane(d.center), closed: false } },
      flows,
      readouts: [{ label: "隔膜", value: rising ? "拉起:吸水閥開、出水閥關" : "壓下:吸水閥關、水經出水閥送出" }],
    };
  },
};
