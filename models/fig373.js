// 第 373 種:羅伯特氏的裝置,證明車輛的摩擦不隨速度增加,只隨載重增加。載貨的小車停在大輪的輪面上,小車連著右邊
// 由螺旋彈簧做成的指示器;大輪轉動時,指示器顯示讓小車保持不動所需的力。實驗發現速度不同時指示器不變,
// 載重不同時立刻改變。狀態按鈕切換載重輕 / 重。
//
// 照原圖(525 px 放大):小車底盤在車輪軸的高度伸出一根直桿,接到刻度盤左側;刻度盤右側一根螺桿穿過右立柱,
// 以軸環與螺帽夾住立柱(盤的位置固定);盤底下是從立柱伸出的架子。原文的「螺旋彈簧」(spiral spring)讀成盤裡的
// 渦卷彈簧:指針、捲筒與彈簧內端同一根軸。推斷:直桿的右端穿過盤框左側的缺口,接一條繞在捲筒上的繩;大輪的輪面
// 往左拖小車(摩擦),小車拉直桿、直桿拉繩、繩轉捲筒,渦卷彈簧被扭到它的力和摩擦力平衡為止。摩擦力只看載重,
// 所以指針的角度(推斷:與載重成正比)只隨狀態變,不隨大輪轉速變;小車移的距離由繩長不變算(繩放出多少,
// 捲筒就轉多少)。小車壓在大輪的輪面上,移動時沿輪面繞大輪的軸心轉一點(兩個輪都貼著輪面),直桿兩端以銷接,
// 和繩成一直線。盤框的後面是開的(只有一根橫樑撐著軸),從斜後方看得到捲筒、繩與彈簧。
//
// 皮帶:原圖從大輪軸上四根彎輪輻的小輪往左上伸出圖外。推斷:另一端是工場天軸上的主動皮帶輪(天軸由圖外的動力
// 帶動,吊架掛在天花板的樑上),是這個模型的主動件;開口皮帶,大輪和它同向(逆時針)轉,輪頂往左、把小車往
// 指示器的反方向拖。大輪的軸架在 A 形架的頂上。
import { deg, Z, TAU, routeBelt, rot2, signedAngle, around } from "./kit.js";
import { shape, circle, rect, thickLine, arcPoints, spanBox } from "./shapes.js";

export const WHEEL = { center: [-0.9, -1.0, 0], r: 1.65 };
export const HUB = 0.7; // 大輪軸上皮帶繞的小輪半徑
const CART_W = 0.22; // 小車輪半徑
const AXLE_DX = 0.5; // 小車輪離小車中線
const AXLE_Y = WHEEL.center[1] + Math.sqrt((WHEEL.r + CART_W) ** 2 - AXLE_DX ** 2); // 小車輪軸的高度(小車在正中時)
const BOARD = { y: -0.1, h: 0.08, len: 1.84 }; // 車斗底板(小車座標)
const CART = [WHEEL.center[0], AXLE_Y + CART_W + 0.05 + BOARD.h / 2 - BOARD.y, 0]; // 輪頂和底板留 0.05
const AXLE_LOCAL = AXLE_Y - CART[1]; // 輪軸在小車座標裡的高度
const LUG = [0.9, AXLE_LOCAL, -0.12]; // 直桿接在小車右端的耳上(輪軸的高度,原圖)
const BELT_Z = 0.3; // 皮帶的深度

// 指示器:捲筒半徑 DRUM、繩半徑 CORD;直桿在小車正中時水平、從捲筒正下方沿切線接繩
const DRUM = 0.12;
const CORD = 0.012;
const RHO = DRUM + CORD; // 繩中心線繞在捲筒上的半徑
export const DIAL = [1.5, AXLE_Y + RHO, 0];
const RIM = { outer: 0.75, inner: 0.62 };
const ROD_Z = -0.12; // 直桿、繩與捲筒的深度(盤面後面)
const ROD_LEN = DIAL[0] - 0.28 - (CART[0] + LUG[0]); // 直桿右端在捲筒左邊 0.28(載重 0 時)
const SPRING = { r0: 0.07, r1: 0.45, turns: 3, wire: 0.012, z: -0.025 };
const WRAP0 = 1.5 * Math.PI; // 載重 0 時繩在捲筒上繞的角度
const SCREW_Z = -0.1;

// 天軸上的主動皮帶輪(推斷):在大輪左上方,皮帶往左上約 35°(原圖)
export const DRIVE = { center: [-3.85, 1.06, BELT_Z], r: 0.5 };
const CEILING = 2.35; // 天花板的樑底

export const LOADS = { light: 1, heavy: 2.4 };
const ZERO = deg(-15); // 載重 0 時指針的位置

/** 狀態 → 指示器指針的角度(只看載重,不看大輪的轉速) */
export const indicator = (state) => ZERO - deg(32) * LOADS[state];

const SPRING_INNER = Math.PI / 2 - ZERO; // 彈簧內端相對指針的角度:載重 0 時外端在正上方
const ANCHOR = WRAP0 - Math.PI / 2 - ZERO; // 繩的固定端在捲筒上相對指針的角度

const turn = (p, b) => {
  // 繞大輪的軸心轉 b
  const [x, y] = rot2([p[0] - WHEEL.center[0], p[1] - WHEEL.center[1]], b);
  return [WHEEL.center[0] + x, WHEEL.center[1] + y, p[2]];
};

// 小車繞大輪軸心轉 b 時,直桿左端的銷、從那裡到捲筒的切點與繩長
function cordAt(b, needle) {
  const P = turn([CART[0] + LUG[0], CART[1] + LUG[1], 0], b);
  const dx = P[0] - DIAL[0];
  const dy = P[1] - DIAL[1];
  const d = Math.hypot(dx, dy);
  const t = -Math.PI / 2 + signedAngle(Math.atan2(dy, dx) + Math.acos(RHO / d) + Math.PI / 2); // 下方的切點(繩從捲筒底下往左離開)
  const straight = Math.sqrt(d * d - RHO * RHO);
  const wrap = ANCHOR + needle - t;
  return { P, t, straight, wrap, length: straight - ROD_LEN + RHO * wrap };
}

const CORD_LENGTH = cordAt(0, ZERO).length;

/** 狀態 → 小車繞大輪軸心轉的角度:繩長不變(繩放出多少,捲筒就轉多少) */
export function cartTurn(state) {
  const needle = indicator(state);
  let [lo, hi] = [0, 0.3];
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (cordAt(mid, needle).length < CORD_LENGTH) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

// 盤框後半圈在左側開缺口讓直桿穿進來(推斷,原圖從正面看不到)
function notchedRing(R, r, yLo, yHi) {
  const a = (rad, y) => Math.atan2(y, -Math.sqrt(rad * rad - y * y)) - (y >= 0 ? TAU : 0); // 左側的角度,取在 (−3π/2, −π/2]
  const outer = arcPoints(R, a(R, yLo), a(R, yHi) + TAU);
  const inner = arcPoints(r, a(r, yHi) + TAU, a(r, yLo));
  return [...outer, ...inner];
}

// 彎輪輻:從輪轂沿弧彎到輪環
function bentSpoke(i) {
  const base = (i * Math.PI) / 2;
  const line = Array.from({ length: 9 }, (_, k) => {
    const s = k / 8;
    const r = 0.1 + (HUB - 0.08 - 0.1) * s;
    return [r * Math.cos(base + 0.7 * s * s), r * Math.sin(base + 0.7 * s * s)];
  });
  return { kind: "plate", role: "spoke", shape: shape(thickLine(line, 0.07)), thickness: 0.1, at: [0, 0, BELT_Z], line: [line[0], line[4], line[8]] };
}


// 右立柱:螺桿穿過的地方開方孔(孔邊離螺桿 0.01)
const POST = { x0: 2.6, x1: 2.8, z0: -0.55, z1: 0.05, bottom: -2.6, top: 1.9 };
const HOLE = 0.07;
const SHELF_TOP = DIAL[1] - RIM.outer;

// 小車下的軸架:每個輪兩片,夾在輪的兩側(在大輪輪緣的前後),孔套著輪軸
const hanger = (id, x, z) => ({
  kind: "plate",
  role: "hanger",
  wheel: id,
  hole: [x, AXLE_LOCAL],
  holeRadius: 0.045,
  shape: shape(rect(0.16, BOARD.y - BOARD.h / 2 - (AXLE_LOCAL - 0.08), x, (BOARD.y - BOARD.h / 2 + AXLE_LOCAL - 0.08) / 2), [circle(0.045, x, AXLE_LOCAL).reverse()]),
  thickness: 0.06,
  at: [0, 0, z],
});

export default {
  figure: 373,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(thickLine([[-3.0, -2.7], [-0.9, -1.0], [1.2, -2.7]], 0.2)), thickness: 0.25, at: [0, 0, -0.5] },
        { kind: "plate", shape: shape(thickLine([[-3.2, -1.65], [POST.x0 + 0.1, -1.65 + (POST.x0 + 0.1 + 3.2) * 0.25]], 0.22)), thickness: 0.3, at: [0, 0, -0.4] },
        spanBox(POST.x0, POST.x1, POST.bottom, DIAL[1] - HOLE, POST.z0, POST.z1, { role: "post" }),
        spanBox(POST.x0, POST.x1, DIAL[1] + HOLE, POST.top, POST.z0, POST.z1, { role: "post" }),
        spanBox(POST.x0, POST.x1, DIAL[1] - HOLE, DIAL[1] + HOLE, POST.z0, SCREW_Z - HOLE, { role: "post" }),
        spanBox(POST.x0, POST.x1, DIAL[1] - HOLE, DIAL[1] + HOLE, SCREW_Z + HOLE, POST.z1, { role: "post" }),
        // 刻度盤底下的架子與撐架(原圖)
        spanBox(0.85, POST.x0, SHELF_TOP - 0.124, SHELF_TOP, -0.3, 0.05, { role: "shelf" }),
        spanBox(1.15, 1.3, -0.5, SHELF_TOP - 0.124, -0.38, -0.22),
      ],
    },
    {
      id: "wheel",
      kind: "group",
      center: WHEEL.center,
      spin: WHEEL.r,
      pieces: [
        { kind: "plate", shape: shape(circle(WHEEL.r), [circle(WHEEL.r - 0.15).reverse()]), thickness: 0.3 },
        ...Array.from({ length: 8 }, (_, i) => ({ kind: "box", size: [2 * WHEEL.r - 0.3, 0.07, 0.1], angle: (i * Math.PI) / 8 })),
        { kind: "cylinder", role: "hub", radius: 0.35, length: 0.4 },
        // 皮帶繞的小輪:輪環、四根彎輪輻與接在大輪輪轂前面的輪轂(原圖)
        { kind: "plate", role: "beltRing", shape: shape(circle(HUB), [circle(HUB - 0.12).reverse()]), thickness: 0.2, at: [0, 0, BELT_Z] },
        { kind: "cylinder", role: "beltHub", radius: 0.14, length: 0.2, at: [0, 0, BELT_Z] },
        ...Array.from({ length: 4 }, (_, i) => bentSpoke(i)),
        { kind: "cylinder", radius: 0.12, length: 0.6, at: [0, 0, -0.35] }, // 大輪的軸,往後伸進 A 形架頂上
        { kind: "box", size: [0.2, 0.2, 0.32], at: [WHEEL.r - 0.08, 0, 0], accent: true }, // 輪緣上的記號
      ],
    },
    {
      id: "drivePulley",
      kind: "pulley",
      center: DRIVE.center,
      radius: DRIVE.r,
      width: 0.18,
      pieces: [{ kind: "cylinder", role: "shaft", radius: 0.07, length: 0.6, at: [0, 0, -0.3] }], // 天軸,往後伸進吊架的軸承
    },
    {
      // 天軸的吊架(推斷):從天花板的樑垂下,下端的軸承環套著天軸
      id: "hanger",
      kind: "group",
      center: [DRIVE.center[0], DRIVE.center[1], 0],
      arrow: false,
      pieces: [
        { kind: "cylinder", role: "bearing", radius: 0.17, inner: 0.08, length: 0.15, at: [0, 0, -0.15] },
        spanBox(-0.07, 0.07, 0.12, CEILING - DRIVE.center[1], -0.21, -0.09),
        spanBox(-0.75, 0.75, CEILING - DRIVE.center[1], CEILING - DRIVE.center[1] + 0.15, -0.35, 0.05),
      ],
    },
    {
      id: "cart",
      kind: "group",
      center: CART,
      arrow: false,
      posed: true,
      pieces: [
        { kind: "box", size: [1.4, 0.45, 0.6], at: [0, 0.15, 0] },
        { kind: "box", role: "board", size: [BOARD.len, BOARD.h, 0.7], at: [0, BOARD.y, 0] },
        ...["cartWheelL", "cartWheelR"].flatMap((id, i) => [-1, 1].map((side) => hanger(id, (2 * i - 1) * AXLE_DX, side * 0.3))),
        // 直桿的耳:從底板右端垂到輪軸的高度,銷孔接直桿(直桿在耳的後面)
        {
          kind: "plate",
          role: "lug",
          pin: LUG,
          shape: shape(rect(0.08, BOARD.y - BOARD.h / 2 - (LUG[1] - 0.06), LUG[0], (BOARD.y - BOARD.h / 2 + LUG[1] - 0.06) / 2), [circle(0.03, LUG[0], LUG[1]).reverse()]),
          thickness: 0.075,
          at: [0, 0, -0.0375],
        },
      ],
    },
    { id: "load", kind: "group", center: [CART[0], CART[1] + 0.45, 0], arrow: false, posed: true, pieces: Array.from({ length: 5 }, (_, i) => ({ kind: "box", size: [0.25, 0.22, 0.4], at: [-0.5 + i * 0.25, 0.05, 0], angle: deg(-20 + i * 10) })) },
    // 小車輪壓在大輪的輪面上;輪軸跟著輪轉,兩端套在軸架的孔裡
    ...[-1, 1].map((s) => ({
      id: s < 0 ? "cartWheelL" : "cartWheelR",
      kind: "pulley",
      style: "spoked",
      spokes: 4,
      radius: CART_W,
      width: 0.1,
      center: [CART[0] + s * AXLE_DX, AXLE_Y, 0],
      pieces: [{ kind: "cylinder", role: "axle", radius: 0.04, length: 0.7 }],
    })),
    { id: "rod", kind: "link", width: 0.12, thickness: 0.08 },
    { id: "cord", kind: "rope", radius: CORD },
    {
      // 刻度盤(固定):前後兩層盤框(後層左側開缺口讓直桿進來)、盤面、背後撐軸的橫樑、彈簧外端的柱;
      // 右側的螺桿穿過立柱,軸環與螺帽夾住立柱(原圖)
      id: "dial",
      kind: "group",
      center: DIAL,
      arrow: false,
      pieces: [
        { kind: "plate", role: "rim", shape: shape(circle(RIM.outer), [circle(RIM.inner).reverse()]), thickness: 0.15, at: [0, 0, 0.025] },
        { kind: "plate", shape: shape(notchedRing(RIM.outer, RIM.inner, -0.3, 0)), thickness: 0.17, at: [0, 0, -0.135] },
        { kind: "plate", shape: shape(circle(RIM.inner), [circle(0.045).reverse()]), thickness: 0.05, at: [0, 0, 0.025] },
        { kind: "plate", shape: shape(rect(1.42, 0.12), [circle(0.045).reverse()]), thickness: 0.05, at: [0, 0, -0.245] },
        { kind: "cylinder", role: "stud", radius: 0.025, length: 0.05, at: [0, SPRING.r1 + SPRING.wire + 0.025, -0.025] },
        { kind: "cylinder", role: "screw", axis: [1, 0, 0], radius: 0.06, length: 0.85, at: [0.7 + 0.425, 0, SCREW_Z] },
        { kind: "cylinder", role: "collar", axis: [1, 0, 0], radius: 0.12, length: 0.15, at: [POST.x0 - DIAL[0] - 0.075, 0, SCREW_Z] },
        { kind: "box", role: "nut", size: [0.12, 0.22, 0.22], at: [POST.x1 - DIAL[0] + 0.06, 0, SCREW_Z] },
      ],
    },
    {
      // 指針與它的軸:軸穿過盤面與背後橫樑的孔,軸上有捲筒(繩繞在上面)與彈簧內端的軸環
      id: "needle",
      kind: "group",
      posed: true,
      center: DIAL,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape([[0, -0.05], [0.55, 0], [0, 0.05]]), thickness: 0.03, at: [0, 0, 0.09] },
        { kind: "cylinder", radius: 0.06, length: 0.03, at: [0, 0, 0.09] },
        { kind: "cylinder", radius: 0.04, length: 0.42, at: [0, 0, -0.09] },
        { kind: "cylinder", role: "drum", radius: DRUM, length: 0.1, at: [0, 0, ROD_Z] },
        { kind: "cylinder", radius: SPRING.r0 - SPRING.wire, length: 0.04, at: [0, 0, SPRING.z] },
      ],
    },
    { id: "spring", kind: "rod", radius: SPRING.wire },
    { id: "belt", kind: "belt" },
  ],
  driver: { part: "drivePulley", type: "rotation" },
  target: "needle", // 顯示摩擦力的指針
  states: {
    initial: "light",
    options: [
      { id: "light", label: "載重輕" },
      { id: "heavy", label: "載重重" },
    ],
  },
  view: { direction: [0.06, 0.08, 1] },
  pose(a, state = "light") {
    const wheel = (a * DRIVE.r) / HUB; // 皮帶不打滑
    const needle = indicator(state);
    const b = cartTurn(state);
    const c = cordAt(b, needle);
    // 小車輪沿輪面滾:相對小車的轉角 × 小車輪半徑 = −(大輪相對小車的轉角)× 大輪半徑
    const spin = b - ((wheel - b) * WHEEL.r) / CART_W;
    const T = around(DIAL, RHO, c.t, ROD_Z);
    const P = [c.P[0], c.P[1], ROD_Z];
    const u = [(T[0] - P[0]) / c.straight, (T[1] - P[1]) / c.straight];
    const E = [P[0] + u[0] * ROD_LEN, P[1] + u[1] * ROD_LEN, ROD_Z];
    const wound = Array.from({ length: 49 }, (_, i) => around(DIAL, RHO, c.t + (c.wrap * i) / 48, ROD_Z));
    // 渦卷彈簧:內端跟著指針的軸轉,外端靠在盤上的柱;指針順時針轉多少,彈簧就少繞多少
    const sweep = SPRING.turns * TAU + (needle - ZERO);
    const coil = Array.from({ length: 121 }, (_, i) => {
      const s = i / 120;
      return around(DIAL, SPRING.r0 + (SPRING.r1 - SPRING.r0) * s, SPRING_INNER + needle - sweep * s, SPRING.z);
    });
    return {
      parts: {
        drivePulley: { angle: a },
        wheel: { angle: wheel },
        cart: { position: turn(CART, b), angle: b },
        load: { position: turn([CART[0], CART[1] + 0.45, 0], b), angle: b, scale: [1, LOADS[state] / 1.7 + 0.4, 1] },
        cartWheelL: { position: turn([CART[0] - AXLE_DX, AXLE_Y, 0], b), angle: spin },
        cartWheelR: { position: turn([CART[0] + AXLE_DX, AXLE_Y, 0], b), angle: spin },
        rod: { from: P, to: E },
        needle: { angle: needle },
      },
      paths: {
        belt: {
          points: routeBelt([
            { center: [WHEEL.center[0], WHEEL.center[1], BELT_Z], axis: Z, radius: HUB, sense: 1 },
            { center: DRIVE.center, axis: Z, radius: DRIVE.r, sense: 1 },
          ]).points,
          closed: true,
          phase: a * DRIVE.r,
        },
        cord: { points: [E, ...wound], closed: false, phase: 0 },
        spring: { points: coil, closed: false },
      },
      readouts: [],
    };
  },
  waivers: [{ check: "interference", parts: ["cart", "load"], reason: "簡化畫法:載重放在車斗裡,重物的底面陷進車斗 0.06" }],
};
