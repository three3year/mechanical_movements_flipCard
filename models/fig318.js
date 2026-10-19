// 第 318 種:錶的調節器。擺輪的游絲 S 內端固定在擺輪軸上、外端固定在固定的凸柱 R 上;游絲從槓桿上的兩根
// 制動插梢之間穿過,在 P 處形成一個中立點,游絲只在這個點與擺輪軸之間擺動(實際作用長度)。
// 槓桿繞一個與擺輪軸同心的固定環轉動:往右(FAST)推時,插梢沿游絲往內移,作用長度變短,擺輪擺得變快;
// 往左(SLOW)時相反。主動件是調節槓桿(指針在下方的刻度上)。
// 照 525 px 原圖:槓桿只有從固定環往下的一支臂,P 是這支臂根部、游絲外圈正下方的插梢(從 R 沿游絲約 90°)。
// 插梢一內一外夾著游絲,穿過槓桿、頂端露在槓桿正面(原圖臂上的黑點)。游絲最外一段(從 R 起 135°)做成和擺輪軸
// 同心的圓弧,槓桿走滿 ±22° 插梢都夾得住(真的錶也這樣做,否則推槓桿會把游絲擠歪);之後才是往內的螺線。
// 畫面上紅線標出作用的一段(內端到插梢),讀數是作用長度與擺動的快慢(與作用長度的平方根成反比)。
// 擺輪在模型裡不擺(被調節的只是快慢)。
// 推斷:游絲圈數與尺寸;擺輪軸上的套圈(接游絲內端);夾板(原圖沒畫):前夾板是從固定環伸到擺輪外面的柱的一支臂
// (固定環是臂底下的凸台,中間是擺輪軸前端的軸承;R 穿過臂上的方孔),背條在擺輪後面(擺輪軸後端的軸承,
// 往下接刻度、往上經柱接前夾板)。
import { TAU, deg, clamp, Y } from "./kit.js";
import { shape, circle, disc, rect, thickLine, arcPoints } from "./shapes.js";

export const RANGE = [deg(-22), deg(22)]; // 槓桿角(往右 FAST 為正)
const SPIRAL = { r0: 0.24, r1: 0.85, turns: 3.5, z: 0.12 }; // 游絲的內外半徑、總圈數、深度
const WIRE = 0.025; // 游絲的粗細(半徑)
const ARC = deg(135); // 外圈從 R 起和擺輪軸同心的一段
const STUD_ANGLE = deg(180); // 外端固定樁 R 的方位
const TAIL = 0.2; // 游絲外端從同心弧往上直直伸進 R 的長度
const STUD = { y: 0.15, w: 0.08, len: 0.14, z0: 0.07, z1: 0.34 }; // R:沿 y 開孔的小塊(中心高度、寬、沿孔長、底面與頂面的深度)
const POINTER = 2.4; // 槓桿指針長
const LEVER0 = deg(-90); // 槓桿在中間時指向正下方
const PIN_R = 0.035; // 制動插梢
const PINS = [SPIRAL.r1 - WIRE - PIN_R, SPIRAL.r1 + WIRE + PIN_R]; // 插梢離擺輪軸的距離(一內一外貼著游絲)
// 深度(z):擺輪 0、游絲 0.12、槓桿與固定環 0.19–0.25、前夾板 0.25–0.31;背條 −0.29–−0.23
const LEVER_Z = [0.19, 0.25];
const COCK_Z = [0.25, 0.31];
const BACK_Z = [-0.29, -0.23];
const STAFF = { r: 0.1, z0: BACK_Z[1], z1: LEVER_Z[1] }; // 擺輪軸:後端在背條的軸承裡、前端在固定環的孔裡
const RING = 0.15; // 固定環(槓桿的轂套在外面)
const FOOT = 2.2; // 前夾板的柱離擺輪軸的距離(擺輪外緣 1.85)
const COCK_DIR = Math.atan2(STUD.y, -SPIRAL.r1); // 前夾板的臂朝 R 伸出去
const toward = (r) => [r * Math.cos(COCK_DIR), r * Math.sin(COCK_DIR)]; // 臂的方向上離擺輪軸 r 的點
const slab = ([z0, z1]) => ({ thickness: z1 - z0, at: [0, 0, (z0 + z1) / 2] }); // 沿 z 的板佔 z0–z1

// 游絲:θ 從 R 沿游絲逆時針量起(外端 0、內端 Θ);0–ARC 是同心弧,之後半徑線性收到內端
const THETA = SPIRAL.turns * TAU;
const radiusAt = (th) => (th <= ARC ? SPIRAL.r1 : SPIRAL.r1 - ((SPIRAL.r1 - SPIRAL.r0) * (th - ARC)) / (THETA - ARC));
const at = (th) => {
  const a = STUD_ANGLE + th;
  const r = radiusAt(th);
  return [r * Math.cos(a), r * Math.sin(a), SPIRAL.z];
};
const ARC_THETAS = Array.from({ length: 136 }, (_, i) => (i / 135) * ARC); // 同心弧每度一點
const COIL_N = 520;
const COIL_THETAS = Array.from({ length: COIL_N }, (_, i) => ARC + ((i + 1) / COIL_N) * (THETA - ARC));
const COIL = COIL_THETAS.map(at);
const COIL_LEN = COIL.reduce((sum, p, i, all) => {
  const q = i ? all[i - 1] : at(ARC);
  return sum + Math.hypot(p[0] - q[0], p[1] - q[1]);
}, 0); // 螺線那一段的長(含從同心弧的末端接過來的一小段)
// 整條游絲:外端(R 裡)→ R 的方位 → 同心弧 → 螺線 → 內端(套圈)
const SPRING = [[-SPIRAL.r1, TAIL, SPIRAL.z], [-SPIRAL.r1, TAIL / 2, SPIRAL.z], ...ARC_THETAS.map(at), ...COIL];

/** 槓桿角 lever → 插梢所在的方位、從 R 沿游絲量到插梢的角 θ、作用長度(從內端量到插梢的弧長) */
export function regulator(lever0) {
  const lever = clamp(lever0, ...RANGE);
  const pinAngle = LEVER0 + lever; // 插梢裝在指針那一支臂上
  const theta = (((pinAngle - STUD_ANGLE) % TAU) + TAU) % TAU;
  const active = COIL_LEN + SPIRAL.r1 * (ARC - theta);
  return { pinAngle, theta, active };
}
const ACTIVE0 = regulator(0).active;
/** 擺動的快慢(相對槓桿在中間):游絲的剛性與作用長度成反比,擺動的頻率與剛性的平方根成正比 */
const rate = (active) => Math.sqrt(ACTIVE0 / active) - 1;

// 紅線:作用的一段,從內端沿游絲往外到插梢
function activeMark(theta) {
  const arc = ARC_THETAS.filter((th) => th > theta).reverse();
  return [...[...COIL].reverse(), ...arc.map(at), at(theta)];
}

const signed = (x, digits) => (Math.abs(x) < 0.5 * 10 ** -digits ? (0).toFixed(digits) : `${x > 0 ? "+" : "−"}${Math.abs(x).toFixed(digits)}`);

export default {
  figure: 318,
  parts: [
    {
      id: "balance",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(circle(1.85), [circle(1.65).reverse()]), thickness: 0.14 },
        ...[0, 1, 2].map((i) => ({ kind: "box", size: [1.6, 0.1, 0.08], at: [0.85 * Math.cos(deg(90) + (i * TAU) / 3), 0.85 * Math.sin(deg(90) + (i * TAU) / 3), 0], angle: deg(90) + (i * TAU) / 3 })),
        { kind: "cylinder", radius: SPIRAL.r0 - WIRE, length: 0.06, at: [0, 0, SPIRAL.z] }, // 套圈(推斷):游絲內端固定在它的外緣
        { kind: "cylinder", radius: STAFF.r, length: STAFF.z1 - STAFF.z0, at: [0, 0, (STAFF.z0 + STAFF.z1) / 2] },
      ],
    },
    // 固定件(推斷的夾板):刻度(SLOW 在左、FAST 在右)、背條與軸承、柱、前夾板與固定環
    {
      id: "plate",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape([...arcPoints(2.55, deg(-125), deg(-55)), ...arcPoints(2.25, deg(-55), deg(-125))]), thickness: 0.06, at: [0, 0, -0.2] },
        ...Array.from({ length: 9 }, (_, i) => {
          const a = deg(-125) + (i / 8) * deg(70);
          return { kind: "box", size: [0.3, 0.025, 0.04], at: [2.4 * Math.cos(a), 2.4 * Math.sin(a), -0.15], angle: a };
        }),
        // 背條:從刻度後面往上到擺輪軸(後軸承),再朝柱伸出去
        { kind: "plate", shape: shape(thickLine([[0, -2.45], [0, 0]], 0.3)), ...slab(BACK_Z) },
        { kind: "plate", shape: shape(thickLine([[0, 0], toward(FOOT + 0.1)], 0.16)), ...slab(BACK_Z) },
        { kind: "plate", shape: disc(0.2, STAFF.r), ...slab([BACK_Z[1], BACK_Z[1] + 0.08]) }, // 後軸承
        // 柱:擺輪外面,從背條立到前夾板
        { kind: "box", size: [0.2, 0.16, COCK_Z[0] - BACK_Z[1]], at: [...toward(FOOT), (COCK_Z[0] + BACK_Z[1]) / 2], angle: COCK_DIR },
        // 前夾板:從固定環伸到柱上的一支臂(擺輪軸的前端露在固定環中間),壓著槓桿的轂;R 穿過臂上的方孔、頂端露在正面
        { kind: "plate", shape: shape(thickLine([toward(0.12), toward(FOOT + 0.1)], 0.2), [rect(STUD.w, STUD.len, -SPIRAL.r1, STUD.y).reverse()]), ...slab(COCK_Z) },
        // 固定環:前夾板底下的凸台,中間是擺輪軸前端的軸承
        { kind: "plate", shape: disc(RING, STAFF.r), ...slab(LEVER_Z) },
      ],
    },
    // R:穿過前夾板的臂、固定在上面,游絲外端沿 y 穿進它的孔
    {
      id: "studR",
      kind: "group",
      center: [-SPIRAL.r1, STUD.y, SPIRAL.z],
      pieces: [{ kind: "plate", axis: Y, shape: shape(rect(STUD.w, STUD.z1 - STUD.z0, 0, SPIRAL.z - (STUD.z0 + STUD.z1) / 2), [circle(WIRE).reverse()]), thickness: STUD.len }],
      label: "R",
      labelOffset: [-0.3, 0, 0.2],
    },
    { id: "spring", kind: "rod", radius: WIRE, label: "S", center: [0, 0.5, SPIRAL.z], labelOffset: [0, 0.15, 0.2] },
    { id: "activeMark", kind: "trace", radius: WIRE + 0.012 }, // 游絲作用的一段(紅線,包住游絲)
    {
      id: "lever",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: disc(0.22, RING), ...slab(LEVER_Z) }, // 轂:套在固定環上
        { kind: "plate", shape: shape([[0.18, -0.1], [1.05, -0.09], [POINTER - 0.15, -0.05], [POINTER - 0.15, 0.05], [1.05, 0.09], [0.18, 0.1]]), ...slab(LEVER_Z) },
        { kind: "plate", shape: shape([[POINTER - 0.15, -0.08], [POINTER + 0.4, 0], [POINTER - 0.15, 0.08]]), ...slab(LEVER_Z) },
        // 兩根制動插梢(P):一內一外夾著游絲的同心弧,穿過槓桿、頂端露在正面
        ...PINS.map((r) => ({ kind: "cylinder", radius: PIN_R, length: LEVER_Z[1] + 0.02 - 0.09, at: [r, 0, (LEVER_Z[1] + 0.02 + 0.09) / 2] })),
      ],
    },
    { id: "labelP", kind: "group", center: [0, -SPIRAL.r1, LEVER_Z[1]], label: "P", labelOffset: [0.25, -0.05, 0.2] },
    { id: "labelSlow", kind: "group", center: [-2.1, -1.9, 0], label: "SLOW", labelOffset: [-0.3, 0, 0] },
    { id: "labelFast", kind: "group", center: [2.1, -1.9, 0], label: "FAST", labelOffset: [0.3, 0, 0] },
  ],
  driver: { part: "lever", type: "rotation", range: RANGE, initial: 0 },
  target: "balance", // 快慢被調節的擺輪(模型裡它不擺,只有游絲的作用長度隨槓桿改變)
  view: { direction: [0.03, 0.04, 1] },
  pose(lever0) {
    const lever = clamp(lever0, ...RANGE);
    const { pinAngle, theta, active } = regulator(lever);
    return {
      parts: {
        lever: { angle: LEVER0 + lever },
        labelP: { position: [SPIRAL.r1 * Math.cos(pinAngle), SPIRAL.r1 * Math.sin(pinAngle), LEVER_Z[1]] },
      },
      paths: { spring: { points: SPRING, closed: false }, activeMark: { points: activeMark(theta), closed: false } },
      readouts: [
        { label: "游絲作用長度(紅)", value: active.toFixed(2) },
        { label: "擺動快慢(相對中間)", value: `${signed(100 * rate(active), 1)}%` },
      ],
    };
  },
};
