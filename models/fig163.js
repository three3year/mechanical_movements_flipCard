// 第 163 種:另一種水車調速器。調速器經曲柄槓桿撥動一條皮帶:心軸下端有三個皮帶輪,中間的鬆套在心軸上,
// 上下兩個固定在心軸上。速度正常時皮帶在鬆動輪上(原圖),不傳動;速度增加時套筒升高,曲柄槓桿把皮帶撥到下輪,
// 經齒輪把閘門抬起、減少水量;速度降低時把皮帶撥到上輪,產生相反的作用。
//
// 主動件是虛擬的「進程」。原文的效果是自動調節,所以播放時速度自己起伏(上游的水量變化):
// 正常 → 過快(皮帶被撥到下輪)→ 正常 → 過慢(撥到上輪)→ 正常,一輪 12 圈。心軸的轉速跟著起伏(最快 1.25 倍、
// 最慢 0.75 倍;進程 1 是正常速度下心軸轉一圈,一輪之內心軸恰好轉 12 圈)。
// 傳動:套筒下方的環經一根短連桿拉曲柄槓桿的左臂;右臂的銷在撥叉桿頂端的橫槽裡,撥叉桿在兩個導套裡上下,
// 叉口夾著皮帶,皮帶的高度就是叉口的高度。皮帶只在整個落在固定輪上時才被帶動。
// 推斷(原圖只畫到撥叉,皮帶往右接到畫面外):遠端也有三個輪——上輪在軸 A 上、下輪在套管 B 上、中間的鬆套;
// 軸 A 頂端的齒輪直接咬閘門軸的齒輪,套管 B 底端的齒輪經一個惰輪再咬閘門軸的齒輪,
// 所以皮帶在上輪或下輪時,閘門軸朝相反的方向轉。
// 原圖沒畫調速器由什麼帶動,也沒畫閘門。水車與閘門是推斷,補上是為了看得出這組調速器在調什麼:心軸下端經一對斜齒輪
// 接到往右的水平軸,軸的右端再經一對斜齒輪接到水車的軸(水車立在前面一層,下方是水道);閘門軸的中段是螺桿,
// 螺帽帶著吊桿吊著水道上游的閘門——閘門軸往抬起閘門的方向轉時螺帽上升、閘門升高,水流變少;反向則閘門放下。
// 上游的水位代表水量的起伏:水位高、水衝得快,調速器過快就把閘門抬起減少進水;水位低則相反。
// 過慢那一段的長度(皮帶在上輪的時間)取得讓一輪之內閘門軸正轉與反轉的量相等——心軸過快時轉得快,同樣長的時間
// 會多轉幾圈——閘門才不會一輪一輪往上爬。
import { Y, Z, TAU, deg, routeBelt, polar, add } from "./kit.js";
import { flyBall } from "./governor.js";
import { circleCircle, angleOf } from "./linkage.js";
import { meshAngle, bevelGear, pitchCones, bevelContact } from "./gears.js";
import { shape, rect } from "./shapes.js";
import { stream } from "./flow.js";
import { pedestal } from "./supports.js";

const GOV = flyBall({ top: 3.0, arm: 1.95, at: 1.0, link: 1.2, ball: 0.42, range: [deg(16), deg(46)] });
const PERIOD = 12; // 速度起伏一輪,心軸轉的圈數
const SPEED_SWING = 0.25; // 心軸轉速的起伏:正常 1,最快 1.25,最慢 0.75
const NORMAL = deg(31);
const PULLEYS = { upper: -1.65, middle: -2.0, lower: -2.35 };
const R = 0.7;
const FAR = { x: 3.6, r: 0.4 };
const GATE_X = FAR.x + 0.6;
const PLANE = 0.45; // 曲柄槓桿、短連桿所在的那一層
const COLLAR = { x: 0.38, drop: 0.2 }; // 套筒下方的環上接短連桿的耳(在套筒下 0.2)
const CRANK = { pivot: [1.13, -0.45, PLANE], left: 0.75, right: 1.5 };
const SHIFTER = { x: CRANK.pivot[0] + CRANK.right, z: 0.8, guides: [-0.95, -1.35] };
const FORK_Z = 0.48; // 皮帶前段在撥叉處的深度
const ON = 0.04; // 皮帶中心離輪中心這麼近才算整個在輪上
const SAMPLES = 2400;

// 套筒到曲柄槓桿:正常速度時左臂水平
const lugAt = (alpha) => [COLLAR.x, GOV.geometry(alpha).sleeve - COLLAR.drop, PLANE];
const LINK = lugAt(NORMAL)[1] - CRANK.pivot[1];
/** 張角 alpha:曲柄槓桿的轉角(0 = 左臂水平)、左右臂端與撥叉(皮帶)的高度(未加偏移) */
function crankAt(alpha) {
  const lug = lugAt(alpha);
  const end = circleCircle(CRANK.pivot, CRANK.left, lug, LINK, 1).point;
  const psi = angleOf(CRANK.pivot, end) - Math.PI;
  const right = add(CRANK.pivot, polar(CRANK.right, psi));
  return { lug, end, psi, right };
}
const FORK_OFFSET = PULLEYS.middle - crankAt(NORMAL).right[1]; // 撥叉在右臂端下方的距離:正常速度時皮帶在中間的鬆動輪
const forkAt = (alpha) => crankAt(alpha).right[1] + FORK_OFFSET;

// 皮帶剛好撥到上輪、下輪時的張角
function solveAlpha(y, lo, hi) {
  for (let k = 0; k < 60; k++) {
    const mid = (lo + hi) / 2;
    if ((forkAt(mid) - y) * (forkAt(lo) - y) > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
const FAST = solveAlpha(PULLEYS.lower, NORMAL, deg(46));
const SLOW = solveAlpha(PULLEYS.upper, deg(16), NORMAL);

/** 進程 p:水量的起伏(−1 最少、+1 最多) */
export const surge = (p) => Math.sin((TAU * p) / PERIOD);
/** 進程 p:心軸的轉角(轉速 1 + SPEED_SWING·surge 的積分;一輪之內恰好轉 PERIOD 圈) */
export const spindleAngle = (p) => TAU * (p - SPEED_SWING * (PERIOD / TAU) * (Math.cos((TAU * p) / PERIOD) - 1));
const FAST_HOLD = 1.6; // 水量多到 1/1.6 以上時皮帶就在下輪(在最快處停一段);過慢那一側的係數由下面的平衡算出
let slowHold = FAST_HOLD;
/** 進程 p:球的張角(水量起伏造成的速度變化;在最快、最慢處停一段) */
export function alphaAt(p) {
  const s = surge(p);
  const f = s >= 0 ? Math.min(1, FAST_HOLD * s) : Math.max(-1, slowHold * s);
  return f >= 0 ? NORMAL + f * (FAST - NORMAL) : NORMAL + f * (NORMAL - SLOW);
}
/** 進程 p:皮帶的高度與它在哪個輪上 */
export function beltAt(p) {
  const y = forkAt(alphaAt(p));
  const on = Math.abs(y - PULLEYS.lower) < ON ? "lower" : Math.abs(y - PULLEYS.upper) < ON ? "upper" : Math.abs(y - PULLEYS.middle) < ON ? "middle" : null;
  return { y, on };
}

// 皮帶在上輪時軸 A 被帶動、閘門軸 G 反向;在下輪時套管 B 被帶動、閘門軸同向(經惰輪)。逐步累計 G 與皮帶行進量
function simulate() {
  let gate = 0;
  let travel = 0;
  const rows = [];
  for (let i = 0; i <= SAMPLES; i++) {
    rows.push({ gate, travel });
    const p = ((i + 0.5) / SAMPLES) * PERIOD;
    const { on } = beltAt(p);
    const d = R * (spindleAngle(((i + 1) / SAMPLES) * PERIOD) - spindleAngle((i / SAMPLES) * PERIOD)); // 這一步心軸上的輪轉過的弧長
    if (on === "upper") [gate, travel] = [gate - d / FAR.r, travel + d];
    if (on === "lower") [gate, travel] = [gate + d / FAR.r, travel + d];
  }
  return rows;
}
// 過慢那一段的長度:二分,讓一輪的淨轉角為 0
const ROWS = (() => {
  let [lo, hi] = [FAST_HOLD, 6];
  let rows;
  for (let k = 0; k < 40; k++) {
    slowHold = (lo + hi) / 2;
    rows = simulate();
    if (rows[SAMPLES].gate > 0) lo = slowHold;
    else hi = slowHold;
  }
  return rows;
})();
const GAIN = ROWS[SAMPLES].gate;
const RUN = ROWS[SAMPLES].travel;

// 齒輪:軸 A 頂端與閘門軸上方一對(12 齒),套管 B 底端、惰輪與閘門軸下方(8 齒)
const TOP_Y = -1.15;
const BOTTOM_Y = -2.85;
const IDLER_Z = Math.sqrt(0.4 * 0.4 - 0.3 * 0.3);
const G = {
  gateTop: { center: [GATE_X, TOP_Y, 0], axis: Y, teeth: 12, radius: 0.3 },
  a: { center: [FAR.x, TOP_Y, 0], axis: Y, teeth: 12, radius: 0.3 },
  gateBottom: { center: [GATE_X, BOTTOM_Y, 0], axis: Y, teeth: 8, radius: 0.2 },
  idler: { center: [(FAR.x + GATE_X) / 2, BOTTOM_Y, IDLER_Z], axis: Y, teeth: 8, radius: 0.2 },
  b: { center: [FAR.x, BOTTOM_Y, 0], axis: Y, teeth: 8, radius: 0.2 },
};

// 閘門軸中段的螺桿與螺帽:閘門軸轉 1 圈螺帽升 SCREW.pitch
const SCREW = { y: (TOP_Y + BOTTOM_Y) / 2, length: 1.3, radius: 0.1, pitch: 0.06, thread: 0.022 }; // 細牙:閘門軸一輪正轉約 8 圈,閘門升 0.47
const NUT_Y = SCREW.y - 0.2; // 一輪起點(剛過慢完)螺帽的高度

// 傳動:心軸下端的斜齒輪與往右的水平軸;水平軸右端再經一對斜齒輪接到水車的軸(朝前)
const M = 0.055;
const [CONE_A, CONE_B] = pitchCones(20, 20);
const DRIVE_APEX = [0, -3.6, 0];
const SPINDLE_GEAR = bevelGear({ apex: DRIVE_APEX, axis: [0, -1, 0], teeth: 20, radius: 10 * M, cone: CONE_A, width: 0.18 });
const INPUT_GEAR = bevelGear({ apex: DRIVE_APEX, axis: [-1, 0, 0], teeth: 20, radius: 10 * M, cone: CONE_B, width: 0.18 });
const INPUT_CONTACT = bevelContact(SPINDLE_GEAR, INPUT_GEAR);
const WHEEL_X = 6.1;
const WHEEL_APEX = [WHEEL_X, DRIVE_APEX[1], 0];
const INPUT_END_GEAR = bevelGear({ apex: WHEEL_APEX, axis: [1, 0, 0], teeth: 20, radius: 10 * M, cone: CONE_A, width: 0.18 });
const WHEEL_GEAR = bevelGear({ apex: WHEEL_APEX, axis: Z, teeth: 20, radius: 10 * M, cone: CONE_B, width: 0.18 });
const WHEEL_CONTACT = bevelContact(INPUT_END_GEAR, WHEEL_GEAR);

// 水車(下射式)、水道與閘門
const WHEEL = { z: 1.15, rim: 1.05, float: 1.3, floats: 12, width: 0.6 };
const BED = WHEEL_APEX[1] - WHEEL.float - 0.15; // 水道底:浮板浸在水裡
const FLUME = { from: 3.0, to: 7.7, z: WHEEL.z, width: 1.1 };
const SLUICE_X = GATE_X + 0.3; // 閘門在水車的上游(左邊)
const GATE = { height: 1.2, open: 0.3 }; // 閘門板高;一輪的起點閘門開著 0.3,過快時抬起、過慢時放回
const HEAD = { x: (FLUME.from + SLUICE_X) / 2, width: SLUICE_X - FLUME.from, depth: 0.75, swing: 0.3 }; // 上游的水:水位起伏
const FLOOR = BED - 0.3;
const FLOW = [[FLUME.from + 0.2, BED + 0.8, WHEEL.z], [SLUICE_X - 0.15, BED + 0.2, WHEEL.z], [SLUICE_X + 0.15, BED + 0.12, WHEEL.z], [WHEEL_X, BED + 0.1, WHEEL.z], [FLUME.to - 0.2, BED + 0.12, WHEEL.z], [FLUME.to + 0.1, BED - 0.05, WHEEL.z], [FLUME.to + 0.25, BED - 0.6, WHEEL.z]];

/** 進程 p:心軸轉角、皮帶高度與所在的輪、閘門軸與遠端各輪的轉角、皮帶行進量、閘門升起的量 */
export function regulator(p) {
  const k = Math.floor(p / PERIOD);
  const x = ((p - k * PERIOD) / PERIOD) * SAMPLES;
  const i = Math.min(SAMPLES - 1, Math.floor(x));
  const t = x - i;
  const row = (key) => ROWS[i][key] + (ROWS[i + 1][key] - ROWS[i][key]) * t;
  const gate = k * GAIN + row("gate");
  const travel = k * RUN + row("travel");
  const a = meshAngle(G.gateTop, G.a, gate);
  const idler = meshAngle(G.gateBottom, G.idler, gate);
  const b = meshAngle(G.idler, G.b, idler);
  return { spindle: spindleAngle(p), ...beltAt(p), gate, a, idler, b, travel, lift: (SCREW.pitch * gate) / TAU };
}
/** 進程 p:閘門底邊離水道底的高度(開口) */
export const gateOpening = (p) => GATE.open + regulator(p).lift;
export const pulleys = PULLEYS;
export const gears = G;

// 皮帶:從心軸上的輪繞到右邊遠端的輪(在水平面內,軸都直立)
const beltPath = (y) =>
  routeBelt([
    { center: [0, y, 0], axis: Y, radius: R, sense: 1 },
    { center: [FAR.x, y, 0], axis: Y, radius: FAR.r, sense: 1 },
  ]);

const pulley = (id, y, extra = {}) => ({ id, kind: "cylinder", axis: Y, center: [0, y, 0], radius: R, length: 0.3, mark: true, spin: R, ...extra });
const gearPiece = (g, y, width = 0.12) => ({ kind: "gear", teeth: g.teeth, radius: g.radius, width, axis: [0, 0, 1], at: [0, 0, y] });
const bevelPiece = (g, facing, at) => ({ kind: "gear", teeth: g.teeth, radius: g.radius, cone: g.cone, width: g.width, axis: [0, 0, facing], at });

export default {
  figure: 163,
  parts: [
    {
      id: "spindle",
      kind: "group",
      axis: Y,
      spin: 0.25,
      spinOffset: 1.0,
      pieces: [
        { kind: "cylinder", radius: 0.07, length: 6.9, at: [0, 0, -0.25] },
        { kind: "sphere", radius: 0.12, at: [0, 0, 3.3] },
        bevelPiece(SPINDLE_GEAR, -1, [0, 0, SPINDLE_GEAR.center[1]]), // 下端的斜齒輪(由水車經水平軸帶動)
      ],
    },
    ...GOV.parts(),
    // 套筒下方不轉的環,側面的耳接短連桿
    { id: "collar", kind: "group", pieces: [{ kind: "cylinder", axis: Y, radius: 0.3, inner: 0.1, length: 0.1 }, { kind: "box", size: [0.2, 0.1, 0.12], at: [0.38, 0, 0] }, { kind: "box", size: [0.1, 0.1, PLANE], at: [COLLAR.x, 0, PLANE / 2] }] },
    { id: "link", kind: "link", width: 0.08, thickness: 0.06 },
    pulley("upperPulley", PULLEYS.upper),
    pulley("middlePulley", PULLEYS.middle),
    pulley("lowerPulley", PULLEYS.lower),
    {
      id: "crank",
      kind: "group",
      center: CRANK.pivot,
      arrow: false,
      pieces: [
        { kind: "box", size: [CRANK.left, 0.14, 0.1], at: [-CRANK.left / 2, 0, 0] },
        { kind: "box", size: [CRANK.right, 0.14, 0.1], at: [CRANK.right / 2, 0, 0] },
        { kind: "cylinder", radius: 0.18, inner: 0.08, length: 0.2 },
        { kind: "cylinder", radius: 0.06, length: SHIFTER.z - PLANE + 0.1, at: [CRANK.right, 0, (SHIFTER.z - PLANE) / 2] }, // 右臂端的銷:往前伸進撥叉桿的橫槽
      ],
    },
    {
      id: "shifter",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(rect(0.9, 0.3), [rect(0.75, 0.13).reverse()]), thickness: 0.1 }, // 頂端的橫槽
        { kind: "box", size: [0.1, -FORK_OFFSET - 0.15, 0.1], at: [0, (FORK_OFFSET - 0.15) / 2, 0] },
        // 叉口:上下兩片夾著皮帶的前段
        { kind: "box", size: [0.12, 0.05, SHIFTER.z - FORK_Z + 0.25], at: [0, FORK_OFFSET + 0.13, (FORK_Z - 0.25 - SHIFTER.z) / 2] },
        { kind: "box", size: [0.12, 0.05, SHIFTER.z - FORK_Z + 0.25], at: [0, FORK_OFFSET - 0.13, (FORK_Z - 0.25 - SHIFTER.z) / 2] },
      ],
    },
    { id: "farUpper", kind: "group", axis: Y, center: [FAR.x, 0, 0], spin: FAR.r, pieces: [{ kind: "cylinder", radius: FAR.r, length: 0.3, at: [0, 0, PULLEYS.upper], mark: true }, { kind: "cylinder", radius: 0.06, length: TOP_Y - PULLEYS.lower + 0.2, at: [0, 0, (TOP_Y + PULLEYS.lower) / 2 + 0.1] }, gearPiece(G.a, TOP_Y)] },
    { id: "farMiddle", kind: "cylinder", axis: Y, center: [FAR.x, PULLEYS.middle, 0], radius: FAR.r, length: 0.3, mark: true, arrow: false },
    { id: "farLower", kind: "group", axis: Y, center: [FAR.x, 0, 0], spin: FAR.r, arrow: false, pieces: [{ kind: "cylinder", radius: FAR.r, length: 0.3, at: [0, 0, PULLEYS.lower], mark: true }, { kind: "cylinder", radius: 0.1, inner: 0.06, length: PULLEYS.lower - BOTTOM_Y, at: [0, 0, (PULLEYS.lower + BOTTOM_Y) / 2] }, gearPiece(G.b, BOTTOM_Y)] },
    { id: "idler", kind: "gear", center: G.idler.center, axis: Y, teeth: 8, radius: 0.2, width: 0.12 },
    {
      // 閘門軸:上下兩個齒輪之間是螺桿,螺帽帶著閘門的吊桿
      id: "gateShaft",
      kind: "group",
      axis: Y,
      center: [GATE_X, 0, 0],
      spin: 0.12,
      pieces: [
        { kind: "cylinder", radius: 0.06, length: TOP_Y - BOTTOM_Y + 0.6, at: [0, 0, (TOP_Y + BOTTOM_Y) / 2] },
        gearPiece(G.gateTop, TOP_Y),
        gearPiece(G.gateBottom, BOTTOM_Y),
        { kind: "worm", radius: SCREW.radius, length: SCREW.length, pitch: SCREW.pitch, thread: SCREW.thread, at: [0, 0, SCREW.y] },
      ],
    },
    {
      // 螺帽、往前伸到水道的臂、吊桿與閘門板(閘門在水車的上游,板立在水道裡)
      id: "gate",
      kind: "group",
      center: [GATE_X, NUT_Y, 0],
      pieces: [
        { kind: "box", size: [0.3, 0.3, 0.3] },
        { kind: "box", size: [SLUICE_X - GATE_X + 0.1, 0.1, 0.1], at: [(SLUICE_X - GATE_X) / 2, 0, 0] },
        { kind: "box", size: [0.1, 0.1, WHEEL.z + 0.05], at: [SLUICE_X - GATE_X, 0, (WHEEL.z - 0.05) / 2] },
        { kind: "box", size: [0.1, NUT_Y - (BED + GATE.open + GATE.height) + 0.1, 0.1], at: [SLUICE_X - GATE_X, (BED + GATE.open + GATE.height - NUT_Y) / 2, WHEEL.z] },
        { kind: "box", size: [0.1, GATE.height, FLUME.width - 0.24], at: [SLUICE_X - GATE_X, BED + GATE.open + GATE.height / 2 - NUT_Y, WHEEL.z] },
      ],
    },
    {
      // 水平軸:心軸下端的斜齒輪到水車軸的斜齒輪
      id: "inputShaft",
      kind: "group",
      axis: [1, 0, 0],
      center: INPUT_GEAR.center,
      spin: 0.3,
      spinOffset: 2.0,
      pieces: [
        bevelPiece(INPUT_GEAR, -1, [0, 0, 0]),
        { kind: "cylinder", radius: 0.07, length: INPUT_END_GEAR.center[0] - INPUT_GEAR.center[0], at: [0, 0, (INPUT_END_GEAR.center[0] - INPUT_GEAR.center[0]) / 2] },
        bevelPiece(INPUT_END_GEAR, 1, [0, 0, INPUT_END_GEAR.center[0] - INPUT_GEAR.center[0]]),
      ],
    },
    {
      // 水車的軸(朝前)與水車:下方的浮板浸在水道裡,水由左往右衝
      id: "wheelShaft",
      kind: "group",
      axis: Z,
      center: [WHEEL_X, WHEEL_APEX[1], 0],
      spin: WHEEL.float + 0.1,
      spinOffset: WHEEL.z,
      pieces: [
        bevelPiece(WHEEL_GEAR, 1, [0, 0, WHEEL_GEAR.center[2]]),
        { kind: "cylinder", radius: 0.08, length: 2.6, at: [0, 0, 0.3] },
        { kind: "pulley", style: "spoked", spokes: 8, radius: WHEEL.rim, width: WHEEL.width, at: [0, 0, WHEEL.z] },
        ...Array.from({ length: WHEEL.floats }, (_, i) => {
          const a = (i * TAU) / WHEEL.floats;
          return { kind: "box", size: [WHEEL.float - WHEEL.rim + 0.1, 0.07, WHEEL.width * 0.9], at: polar((WHEEL.rim + WHEEL.float) / 2 - 0.05, a, WHEEL.z), angle: a };
        }),
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape([[-1.6, -0.55], [1.6, -0.55], [1.6, -3.1], [1.4, -3.1], [1.4, -0.75], [-1.4, -0.75], [-1.4, -3.1], [-1.6, -3.1]]), thickness: 0.2, at: [0, 0, -0.95] }, // 機架在皮帶後段的後面
        // 曲柄槓桿的樞軸:從後面的支架伸出
        { kind: "cylinder", radius: 0.08, length: 1.5, at: [CRANK.pivot[0], CRANK.pivot[1], -0.25] },
        { kind: "box", size: [0.3, 0.4, 0.2], at: [CRANK.pivot[0], -0.55, -0.95] },
        // 撥叉桿的兩個導套,由右邊的立柱伸臂托著
        ...SHIFTER.guides.flatMap((y) => [
          { kind: "cylinder", axis: Y, radius: 0.12, inner: 0.07, length: 0.1, at: [SHIFTER.x, y, SHIFTER.z] },
          { kind: "box", size: [0.12, 0.08, 1.7], at: [SHIFTER.x, y, SHIFTER.z - 0.9] },
        ]),
        { kind: "box", size: [0.2, 3.0, 0.2], at: [SHIFTER.x, -2.35, -0.95] },
        // 遠端:輪軸上下的軸承、閘門軸上下的軸承、惰輪的短軸,都架在後面的立柱上
        ...[[FAR.x, TOP_Y + 0.3], [FAR.x, BOTTOM_Y - 0.3], [GATE_X, TOP_Y + 0.4], [GATE_X, BOTTOM_Y - 0.4]].flatMap(([x, y]) => [
          { kind: "cylinder", axis: Y, radius: 0.14, inner: 0.06, length: 0.1, at: [x, y, 0] },
          { kind: "box", size: [0.1, 0.08, 1.0], at: [x, y, -0.55] },
        ]),
        { kind: "cylinder", axis: Y, radius: 0.05, length: 0.4, at: [G.idler.center[0], BOTTOM_Y - 0.12, IDLER_Z] },
        { kind: "box", size: [0.1, 0.08, IDLER_Z + 1.0], at: [G.idler.center[0], BOTTOM_Y - 0.3, (IDLER_Z - 1.0) / 2] },
        { kind: "box", size: [GATE_X - FAR.x + 0.5, 0.15, 0.15], at: [(FAR.x + GATE_X) / 2, TOP_Y + 0.4, -1.05] },
        { kind: "box", size: [0.15, TOP_Y - BOTTOM_Y + 0.95, 0.15], at: [(FAR.x + GATE_X) / 2, (TOP_Y + BOTTOM_Y) / 2, -1.05] },
        // 水平軸與水車軸的軸承座(推斷),立在地板上
        ...pedestal({ at: [1.6, DRIVE_APEX[1]], z: -0.5, bore: 0.07, floor: FLOOR }),
        ...pedestal({ at: [WHEEL_X - 1.2, DRIVE_APEX[1]], z: -0.5, bore: 0.07, floor: FLOOR }),
        ...pedestal({ at: [WHEEL_X, WHEEL_APEX[1]], z: -0.95, bore: 0.08, floor: FLOOR }),
        // 水道:底、後牆(高)、前牆(低,看得到水)
        { kind: "box", size: [FLUME.to - FLUME.from, 0.2, FLUME.width], at: [(FLUME.from + FLUME.to) / 2, BED - 0.1, FLUME.z] },
        { kind: "box", size: [FLUME.to - FLUME.from, 1.4, 0.1], at: [(FLUME.from + FLUME.to) / 2, BED + 0.7, FLUME.z - FLUME.width / 2 + 0.05] },
        { kind: "box", size: [FLUME.to - FLUME.from, 0.5, 0.1], at: [(FLUME.from + FLUME.to) / 2, BED + 0.25, FLUME.z + FLUME.width / 2 - 0.05] },
      ],
    },
    { id: "headWater", kind: "fill", fluid: "water", center: [HEAD.x, BED + 0.65, FLUME.z], size: [HEAD.width, 1.3, FLUME.width - 0.2], level: HEAD.depth / 1.3 },
    { id: "tailWater", kind: "fill", fluid: "water", center: [(SLUICE_X + FLUME.to) / 2, BED + 0.15, FLUME.z], size: [FLUME.to - SLUICE_X, 0.3, FLUME.width - 0.2], level: 1 },
    { id: "belt", kind: "belt" },
  ],
  powered: ["wheelShaft"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, PERIOD], unit: "圈", speed: 1.5 },
  target: "gate", // 這組調速器要控制的是閘門
  view: { direction: [0.2, 0.15, 1] },
  pose(p) {
    const r = regulator(p);
    const alpha = alphaAt(p);
    const { lug, end, psi, right } = crankAt(alpha);
    // 心軸齒輪的軸朝下,心軸轉 spindle 是它繞自己的軸轉 −spindle;水平軸左端的齒輪軸朝左、群組的軸朝右,同理取負
    const input = -meshAngle(SPINDLE_GEAR, INPUT_GEAR, -r.spindle, INPUT_CONTACT);
    const wheel = meshAngle(INPUT_END_GEAR, WHEEL_GEAR, input, WHEEL_CONTACT);
    return {
      parts: {
        spindle: { angle: r.spindle },
        ...GOV.pose(alpha),
        collar: { position: [0, lug[1], 0] },
        link: { from: lug, to: [end[0], end[1], PLANE] },
        upperPulley: { angle: r.spindle },
        lowerPulley: { angle: r.spindle },
        middlePulley: { angle: 0 },
        crank: { angle: psi },
        shifter: { position: [SHIFTER.x, right[1], SHIFTER.z] },
        farUpper: { angle: r.a },
        farLower: { angle: r.b },
        idler: { angle: r.idler },
        gateShaft: { angle: r.gate },
        gate: { position: [GATE_X, NUT_Y + r.lift, 0] },
        inputShaft: { angle: input },
        wheelShaft: { angle: wheel },
        headWater: { level: (HEAD.depth + HEAD.swing * surge(p)) / 1.3 },
      },
      paths: { belt: { points: beltPath(r.y).points, closed: true, phase: r.travel } },
      flows: [{ fluid: "water", points: stream(FLOW, WHEEL.float * r.spindle, { spacing: 0.22 }) }],
      readouts: [{ label: "速度", value: r.on === "lower" ? "過快:皮帶在下輪,抬起閘門" : r.on === "upper" ? "過慢:皮帶在上輪,放下閘門" : r.on === "middle" ? "正常:皮帶在鬆動輪" : "撥動皮帶中" }],
    };
  },
};
