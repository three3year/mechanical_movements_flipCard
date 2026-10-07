// 第 163 種:另一種水車調速器。調速器經曲柄槓桿撥動一條皮帶:心軸下端有三個皮帶輪,中間的鬆套在心軸上,
// 上下兩個固定在心軸上。速度正常時皮帶在鬆動輪上(原圖),不傳動;速度增加時套筒升高,曲柄槓桿把皮帶撥到下輪,
// 經齒輪把閘門抬起、減少水量;速度降低時把皮帶撥到上輪,產生相反的作用。
//
// 主動件是虛擬的「進程」(心軸已轉了幾圈)。原文的效果是自動調節,所以播放時速度自己起伏(水量變化):
// 正常 → 過快(皮帶被撥到下輪)→ 正常 → 過慢(撥到上輪)→ 正常,一輪 12 圈。
// 傳動:套筒下方的環經一根短連桿拉曲柄槓桿的左臂;右臂的銷在撥叉桿頂端的橫槽裡,撥叉桿在兩個導套裡上下,
// 叉口夾著皮帶,皮帶的高度就是叉口的高度。皮帶只在整個落在固定輪上時才被帶動。
// 推斷(原圖只畫到撥叉,皮帶往右接到畫面外):遠端也有三個輪——上輪在軸 A 上、下輪在套管 B 上、中間的鬆套;
// 軸 A 頂端的齒輪直接咬閘門軸的齒輪,套管 B 底端的齒輪經一個惰輪再咬閘門軸的齒輪,
// 所以皮帶在上輪或下輪時,閘門軸朝相反的方向轉。
import { Y, TAU, deg, routeBelt, polar, add } from "./kit.js";
import { flyBall } from "./governor.js";
import { circleCircle, angleOf } from "./linkage.js";
import { meshAngle } from "./gears.js";
import { shape, rect } from "./shapes.js";

const GOV = flyBall({ top: 3.0, arm: 1.95, at: 1.0, link: 1.2, ball: 0.42, range: [deg(16), deg(46)] });
const PERIOD = 12; // 速度起伏一輪,心軸轉的圈數
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

/** 進程 p:球的張角(水量起伏造成的速度變化;在最快、最慢處停一段) */
export function alphaAt(p) {
  const f = Math.max(-1, Math.min(1, 1.6 * Math.sin((TAU * p) / PERIOD)));
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
    const d = (TAU * PERIOD * R) / SAMPLES; // 這一步心軸上的輪轉過的弧長
    if (on === "upper") [gate, travel] = [gate - d / FAR.r, travel + d];
    if (on === "lower") [gate, travel] = [gate + d / FAR.r, travel + d];
  }
  return rows;
}
const ROWS = simulate();
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

/** 進程 p:心軸轉角、皮帶高度與所在的輪、閘門軸與遠端各輪的轉角、皮帶行進量 */
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
  return { spindle: TAU * p, ...beltAt(p), gate, a, idler, b, travel };
}
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

export default {
  figure: 163,
  parts: [
    {
      id: "spindle",
      kind: "group",
      axis: Y,
      spin: 0.25,
      spinOffset: 1.0,
      pieces: [{ kind: "cylinder", radius: 0.07, length: 6.0, at: [0, 0, 0.2] }, { kind: "sphere", radius: 0.12, at: [0, 0, 3.3] }],
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
      id: "gateShaft",
      kind: "group",
      axis: Y,
      center: [GATE_X, 0, 0],
      spin: 0.12,
      pieces: [{ kind: "cylinder", radius: 0.06, length: TOP_Y - BOTTOM_Y + 0.6, at: [0, 0, (TOP_Y + BOTTOM_Y) / 2] }, gearPiece(G.gateTop, TOP_Y), gearPiece(G.gateBottom, BOTTOM_Y)],
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
      ],
    },
    { id: "belt", kind: "belt" },
  ],
  powered: ["lowerPulley"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, PERIOD], unit: "圈", speed: 1.5 },
  target: "gateShaft", // 這組調速器要控制的是閘門:閘門軸
  view: { direction: [0.2, 0.2, 1], fit: ["spindle", "frame", "crank", "middlePulley", "ballL", "ballR", "gateShaft"] },
  pose(p) {
    const r = regulator(p);
    const alpha = alphaAt(p);
    const { lug, end, psi, right } = crankAt(alpha);
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
      },
      paths: { belt: { points: beltPath(r.y).points, closed: true, phase: r.travel } },
      readouts: [{ label: "速度", value: r.on === "lower" ? "過快:皮帶在下輪,抬起閘門" : r.on === "upper" ? "過慢:皮帶在上輪,放下閘門" : r.on === "middle" ? "正常:皮帶在鬆動輪" : "撥動皮帶中" }],
    };
  },
};
