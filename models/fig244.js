// 第 244 種:測功計(普朗尼制動器)。平滑的皮帶輪 A 裝在動力源的軸上;上方一塊木塊、下方一串條板繫在鏈上,
// 由槓桿 D 頂部的螺絲與螺帽夾緊在輪上。槓桿 D 的末端掛秤盤 B,放入砝碼;兩個擋止 C、C' 把槓桿限制在水平附近。
// 主動件是軸(輪 A 照箭頭方向轉,木塊與條板在輪面上滑)。輪對木塊與條板的摩擦把整組制動器連同槓桿往輪轉的方向帶
// (槓桿的末端往上),秤盤裡的砝碼把它往下拉;槓桿的轉角由這兩個力矩與擋止算出(轉動慣量固定,碰到擋止就停住)。
// 軸運轉時,操作的人照原文「鎖緊螺絲並在 B 加砝碼,直到槓桿呈現圖中位置」反覆調螺帽(推斷:一輪操作的順序):
//   鬆開 → 摩擦小於砝碼,槓桿被拉下靠在 C;鎖緊 → 摩擦大於砝碼,槓桿被帶上去頂住 C';
//   往回鬆一點、看著槓桿微調 → 摩擦等於砝碼,槓桿浮在 C 與 C' 之間的水平位置(原圖,主動量 0 時的姿勢);再鬆開,槓桿落回 C。
// 螺帽轉幾圈,螺栓就往上拉幾個螺距,鏈與條板跟著收緊貼到輪上;貼上之後再鎖,夾緊力(摩擦)隨圈數變大。
// 原文只描述軸照圖示方向運轉時的調整;反轉時槓桿會被帶往另一邊,這裡不演出,讀數寫明「軸照箭頭方向轉」。
// 下方照 507movements 的 525 px 原圖:一條用銷鉸接的鏈,內側繫著一段段木條(條板),從輪的左側包到右側;
// 兩根螺栓從槓桿頂上的螺帽往下,在上方木塊的左右兩側(輪外)穿過槓桿的孔與鏈兩端的耳,下面用螺帽鎖住。
// 推斷:操作的順序與摩擦、轉動慣量的數值;軸後面的軸承座、托著兩個擋止的立柱、把兩者連在一起的底板;
// 鏈的節數與耳、螺帽的尺寸;掛秤盤的吊環螺栓(原圖槓桿右端頂上的螺帽)。
import { deg, rot2, clamp, quatAxisAngle, quatMul, quatFromZ, Y, Z } from "./kit.js";
import { shape, arcPoints, polygon, circle, rect } from "./shapes.js";
import { pedestal } from "./supports.js";
import { swingUntilContact } from "./contact.js";

const DRUM = 0.75;
const PIVOT = [-2.1, -0.15, 0]; // 輪 A 的軸心(槓桿繞它擺)
const ARM = 4.4; // 槓桿從軸心到掛秤盤處的長度
const FLOOR = PIVOT[1] - 3.8; // 軸承座與擋止立柱的腳的底面
const LEVER_DEPTH = 0.3; // 槓桿的厚度(z)

// ── 夾在輪上的制動器(槓桿的局部座標,原點是輪 A 的軸心;整組跟著槓桿擺) ──
const SHOE_GAP = 0.01; // 木塊、條板與輪面之間(貼著輪面)
const LEVER_Y = [0.83, 1.07]; // 槓桿 D 的下緣、上緣
const CHAIN_R = DRUM + 0.22; // 鏈的節線(銷的中心)半徑
const LINKS = 7; // 鏈包住輪的下半圈:七節、八根銷
const LUG_Y = 0.36; // 鏈兩端的耳的高度(在輪軸心之上、上方木塊之下)
const BOLT = { x: CHAIN_R + 0.17, r: 0.05 };
const HOLE = BOLT.r + 0.012; // 槓桿上給螺栓穿過的孔(半寬)
const LEVER_X = [-(BOLT.x + 0.3), ARM + 0.25]; // 槓桿往左伸過左邊的螺栓
const NUT = 0.1; // 螺帽的高度
const PITCH = 0.07; // 螺栓的螺距:螺帽轉一圈,螺栓連同鏈往上拉這麼多
const SLACK = 0.14; // 螺帽全鬆時鏈往下垂的量(條板離開輪面)
const SNUG = SLACK / PITCH; // 螺帽從全鬆轉幾圈,條板貼上輪面
const pins = Array.from({ length: LINKS + 1 }, (_, i) => rot2([CHAIN_R, 0], Math.PI + (i * Math.PI) / LINKS));
// 上方木塊:橫跨在兩根螺栓之間,底面挖成貼著輪頂的凹弧,頂面貼著槓桿的下緣
const blockHalf = BOLT.x - BOLT.r - 0.2;
const blockFoot = Math.asin(LUG_Y / (DRUM + SHOE_GAP));
const block = [
  [-blockHalf, LEVER_Y[0]], [-blockHalf, LUG_Y],
  ...arcPoints(DRUM + SHOE_GAP, Math.PI - blockFoot, blockFoot),
  [blockHalf, LUG_Y], [blockHalf, LEVER_Y[0]],
];
// 條板:每一節鏈的內側一根,鏈收緊時貼著輪的下半圈
const strapGap = deg(1.5);
const straps = pins.slice(1).map((_, i) => {
  const a0 = Math.PI + (i * Math.PI) / LINKS + strapGap;
  const a1 = Math.PI + ((i + 1) * Math.PI) / LINKS - strapGap;
  return [...arcPoints(DRUM + SHOE_GAP, a0, a1), ...arcPoints(CHAIN_R - 0.05, a1, a0)];
});
const lugs = [-1, 1].map((s) => {
  const [x0, x1] = [s * (CHAIN_R - 0.05), s * (BOLT.x + 0.17)].sort((a, b) => a - b);
  return { x0, x1, y0: LUG_Y - 0.05, y1: LUG_Y + 0.05 };
});
// 螺栓(鏈收緊時的位置):下端的螺帽頂著耳,上端穿過槓桿的孔與頂上的螺帽;鏈下垂 SLACK 時上端仍露出螺帽
const bolts = [-1, 1].map((s) => ({
  x: s * BOLT.x,
  r: BOLT.r,
  y0: LUG_Y - 0.05 - NUT - 0.04,
  y1: LEVER_Y[1] + NUT + SLACK + 0.06,
  nutBelow: [LUG_Y - 0.05 - NUT, LUG_Y - 0.05],
  nutAbove: [LEVER_Y[1], LEVER_Y[1] + NUT],
}));

// ── 槓桿 D:一根方木,螺栓穿過的地方開方孔(孔沿螺栓,也就是沿 y 貫穿) ──
const leverBoxes = (() => {
  const [y0, y1] = LEVER_Y;
  const h = LEVER_DEPTH / 2;
  const box = (x0, x1, z0, z1) => ({ kind: "box", size: [x1 - x0, y1 - y0, z1 - z0], at: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2] });
  const cuts = [-BOLT.x, BOLT.x];
  return [
    box(LEVER_X[0], cuts[0] - HOLE, -h, h),
    box(cuts[0] + HOLE, cuts[1] - HOLE, -h, h),
    box(cuts[1] + HOLE, LEVER_X[1], -h, h),
    ...cuts.flatMap((x) => [box(x - HOLE, x + HOLE, HOLE, h), box(x - HOLE, x + HOLE, -h, -HOLE)]),
  ];
})();
const leverOutline = rect(LEVER_X[1] - LEVER_X[0], LEVER_Y[1] - LEVER_Y[0], (LEVER_X[0] + LEVER_X[1]) / 2, (LEVER_Y[0] + LEVER_Y[1]) / 2);

// ── 擋止 C、C':在槓桿上下,槓桿擺到碰到它們為止(由接觸算出兩個極限角) ──
const STOP_X = ARM - 1.05;
const STOP = [0.42, 0.26]; // 寬、高
const STOP_Y = { low: 0.42, high: 1.485 }; // 中心高度(相對於軸心)
const stopOutline = (y) => rect(STOP[0], STOP[1], STOP_X, y);
const pivot0 = [0, 0];
export const DOWN = swingUntilContact({ pivot: pivot0, outline: leverOutline, from: 0, into: -1, sweep: 0.3, steps: 60 }, [stopOutline(STOP_Y.low)]);
export const UP = swingUntilContact({ pivot: pivot0, outline: leverOutline, from: 0, into: 1, sweep: 0.3, steps: 60 }, [stopOutline(STOP_Y.high)]);
const POST_TOP = STOP_Y.high + 0.1; // 立柱頂:上面那個擋止的托臂上緣(相對於軸心)

// ── 秤盤的吊點:吊環的下緣(槓桿的局部座標) ──
const HOOK_Y = 0.75; // 吊環中心
const TIE_Y = HOOK_Y - 0.115; // 吊繩繫在環的下緣
const HANG = 2.1 - 0.115; // 繫繩處到秤盤面

// ── 力矩與操作(推斷的數值;力矩以「砝碼 × 掛點到軸心的水平距離(槓桿水平時)」為 1) ──
const SPEED = Math.PI; // 自動播放時軸每秒轉半圈
const PERIOD = 12; // 一輪操作的秒數(軸轉 6 圈)
const START = 8.5; // 主動量 0 時是一輪操作的第幾秒:鎖到剛好、槓桿水平(原圖)
const T_BLOCK = 0.3; // 螺帽全鬆時,只有木塊與槓桿壓在輪上的摩擦力矩
const GRIP = 0.7; // 條板貼上輪面後,螺帽每多鎖一圈增加的摩擦力矩
const N_RIGHT = SNUG + (1 - T_BLOCK) / GRIP; // 摩擦力矩等於砝碼力矩的圈數
const N_TIGHT = N_RIGHT + 0.8;
const INERTIA = 0.45; // 槓桿、制動器、秤盤與砝碼繞軸心的轉動慣量
const TRIM = { kp: 9, kd: 6 }; // 操作的人看著槓桿微調螺帽:偏上就鬆、偏下就緊,往哪邊擺得快就先收一點

/** 摩擦力矩(螺帽從全鬆轉了 n 圈) */
export const friction = (n) => T_BLOCK + GRIP * Math.max(0, n - SNUG);
/** 砝碼的力矩:秤盤掛在吊點上,力臂是吊點到軸心的水平距離 */
export const weightTorque = (a) => (ARM * Math.cos(a) - TIE_Y * Math.sin(a)) / ARM;

// 一輪操作:螺帽往目標圈數轉(每秒最多 rate 圈);trim 是看著槓桿微調
const PLAN = [
  { until: 0.8, target: 0, rate: 3, text: ["鬆開中", "全鬆"] },
  { until: 4.5, target: N_TIGHT, rate: 1.5, text: ["鎖緊中", "鎖得太緊"] },
  { until: 9.5, trim: true, rate: 2, text: ["往回鬆一點,看著槓桿微調", "鎖到剛好"] },
  { until: PERIOD, target: 0, rate: 3, text: ["鬆開中", "全鬆"] },
];
const RATE = 120; // 每秒的取樣數
const run = (() => {
  const DT = 1 / 1200;
  const steps = PERIOD / DT;
  const out = { angle: [], omega: [], turns: [], step: [] };
  let [a, w, n] = [DOWN, 0, 0];
  for (let i = 0; i <= steps; i++) {
    const u = i * DT;
    const plan = PLAN.find((p) => u < p.until) ?? PLAN[PLAN.length - 1];
    if (i % (1200 / RATE) === 0) {
      out.angle.push(a);
      out.omega.push(w);
      out.turns.push(n);
      out.step.push(PLAN.indexOf(plan));
    }
    const want = plan.trim
      ? SNUG + (weightTorque(a) + INERTIA * (-TRIM.kp * a - TRIM.kd * w) - T_BLOCK) / GRIP
      : plan.target;
    n = Math.max(0, n + clamp(want - n, -plan.rate * DT, plan.rate * DT));
    w += ((friction(n) - weightTorque(a)) / INERTIA) * DT;
    a += w * DT;
    // 碰到擋止就停住(不反彈)
    if (a <= DOWN) [a, w] = [DOWN, Math.max(0, w)];
    if (a >= UP) [a, w] = [UP, Math.min(0, w)];
  }
  return out;
})();

/** 主動量(軸的轉角)時的操作狀態:槓桿轉角、角速度、螺帽圈數、鏈下垂量、操作的哪一步 */
export function operation(value) {
  const u = ((((value / SPEED + START) % PERIOD) + PERIOD) % PERIOD) * RATE;
  const i = Math.min(Math.floor(u), run.angle.length - 2);
  const f = u - i;
  const at = (k) => run[k][i] + (run[k][i + 1] - run[k][i]) * f;
  const turns = at("turns");
  return { angle: at("angle"), omega: at("omega"), turns, slack: Math.max(0, SLACK - PITCH * turns), step: run.step[i], time: u / RATE };
}

/** 制動器的外形(測試用):上方木塊、條板、鏈的銷、耳、螺栓與螺帽、槓桿的範圍(鏈收緊時) */
export const brake = {
  drum: DRUM, block, straps, pins, lugs, bolts, hole: HOLE, slack: SLACK, pitch: PITCH,
  lever: { x0: LEVER_X[0], x1: LEVER_X[1], y0: LEVER_Y[0], y1: LEVER_Y[1], outline: leverOutline },
  stops: { low: stopOutline(STOP_Y.low), high: stopOutline(STOP_Y.high) },
};

// 鏈、條板、耳、螺栓與下面的螺帽:一整串,螺帽鎖緊時被螺栓往上拉(局部座標同槓桿)
const chainPieces = [
  ...straps.map((outline) => ({ kind: "plate", shape: shape(outline), thickness: 0.46 })),
  // 鏈:每一節是一片鏈板,兩端套在銷上
  ...pins.slice(1).map((b, i) => {
    const a = pins[i];
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    return { kind: "box", size: [Math.hypot(b[0] - a[0], b[1] - a[1]), 0.1, 0.3], at: [mid[0], mid[1], 0], angle: Math.atan2(b[1] - a[1], b[0] - a[0]) };
  }),
  ...pins.map(([x, y]) => ({ kind: "cylinder", radius: 0.045, length: 0.4, at: [x, y, 0] })),
  // 鏈的兩端各往上一節,接到耳
  ...[-1, 1].map((s) => ({ kind: "box", size: [0.1, LUG_Y + 0.05, 0.3], at: [s * CHAIN_R, (LUG_Y + 0.05) / 2, 0] })),
  ...lugs.map((l) => ({ kind: "box", size: [l.x1 - l.x0, l.y1 - l.y0, 0.3], at: [(l.x0 + l.x1) / 2, (l.y0 + l.y1) / 2, 0] })),
  // 螺栓穿過耳(下面用螺帽鎖住),往上穿過槓桿的孔
  ...bolts.flatMap((b) => [
    { kind: "cylinder", axis: [0, 1, 0], radius: b.r, length: b.y1 - b.y0, at: [b.x, (b.y0 + b.y1) / 2, 0] },
    { kind: "box", size: [0.18, NUT, 0.18], at: [b.x, (b.nutBelow[0] + b.nutBelow[1]) / 2, 0] },
  ]),
];
// 槓桿頂上的螺帽(六角,局部 z 沿螺栓往上;記號標出轉了多少)
const nutPieces = [{ kind: "plate", shape: shape(polygon(6, 0.13, Math.PI / 6), [circle(BOLT.r + 0.005).reverse()]), thickness: NUT, at: [0, 0, NUT / 2], mark: [0.085, 0], markSize: 0.025 }];
const UPRIGHT = quatFromZ(Y);
const local = (p, a) => {
  const [x, y] = rot2(p, a);
  return [PIVOT[0] + x, PIVOT[1] + y, 0];
};

const level = (a, w) => Math.abs(a) < deg(0.05) && Math.abs(w) < 0.003; // 看起來已經停在水平
const LEVER_TEXT = (a, w) => {
  if (a <= DOWN + 1e-6) return "被砝碼拉下,靠在 C";
  if (a >= UP - 1e-6) return "被輪帶上去,頂住 C'";
  if (level(a, w)) return "水平,浮在 C 與 C' 之間(原圖的位置)";
  return w > 0 ? "往上擺" : "往下擺";
};
const compare = (r) => (r > 1.005 ? "大於 1:輪把槓桿帶上去" : r < 0.995 ? "小於 1:砝碼把槓桿拉下" : "等於 1:平衡");

export default {
  figure: 244,
  parts: [
    {
      id: "drumA",
      kind: "pulley",
      style: "disc",
      center: PIVOT,
      radius: DRUM,
      width: 0.5,
      label: "A",
      labelOffset: [-0.15, -0.05, 0.6],
      spinOffset: 0.42, // 轉向箭頭放在制動器前面(輪頂被上方木塊與槓桿圍住);讀數的「軸照箭頭方向轉」指它
      pieces: [{ kind: "cylinder", radius: 0.14, length: 2.2, at: [0, 0, -0.4] }],
    },
    {
      id: "leverD",
      kind: "group",
      center: PIVOT,
      arrow: false,
      label: "D",
      labelOffset: [2.0, 1.25, 0.3],
      pieces: [
        ...leverBoxes,
        // 上方木塊:頂面貼著槓桿的下緣
        { kind: "plate", shape: shape(block), thickness: 0.56 },
        // 掛秤盤的吊環螺栓:穿過槓桿右端,頂上一顆螺帽,下面是吊環
        { kind: "cylinder", axis: [0, 1, 0], radius: 0.035, length: LEVER_Y[1] + NUT - (HOOK_Y + 0.08), at: [ARM, (LEVER_Y[1] + NUT + HOOK_Y + 0.08) / 2, 0] },
        { kind: "box", size: [0.18, NUT, 0.18], at: [ARM, LEVER_Y[1] + NUT / 2, 0] },
        { kind: "cylinder", radius: 0.1, inner: 0.05, length: 0.1, axis: [1, 0, 0], at: [ARM, HOOK_Y, 0] },
      ],
    },
    { id: "chain", kind: "group", center: PIVOT, arrow: false, pieces: chainPieces },
    ...[-1, 1].map((s) => ({ id: s < 0 ? "nutL" : "nutR", kind: "group", center: local([s * BOLT.x, LEVER_Y[1]], 0), axis: [0, 1, 0], spin: 0.1, pieces: nutPieces })),
    {
      id: "stops",
      kind: "group",
      pieces: [
        { kind: "box", size: [STOP[0], STOP[1], 0.3], at: [PIVOT[0] + STOP_X, PIVOT[1] + STOP_Y.high, 0] },
        { kind: "box", size: [STOP[0], STOP[1], 0.3], at: [PIVOT[0] + STOP_X, PIVOT[1] + STOP_Y.low, 0] },
        // 托著兩個擋止的立柱(在槓桿後面):從腳一直立到上面那個擋止的托臂;托臂往前伸進擋止
        { kind: "box", size: [0.2, PIVOT[1] + POST_TOP - FLOOR, 0.2], at: [PIVOT[0] + STOP_X, (PIVOT[1] + POST_TOP + FLOOR) / 2, -0.4] },
        { kind: "box", size: [0.2, 0.2, 0.55], at: [PIVOT[0] + STOP_X, PIVOT[1] + STOP_Y.high, -0.22] },
        { kind: "box", size: [0.2, 0.2, 0.55], at: [PIVOT[0] + STOP_X, PIVOT[1] + STOP_Y.low, -0.22] },
        { kind: "box", size: [1.0, 0.18, 0.8], at: [PIVOT[0] + STOP_X, FLOOR - 0.09, -0.4] },
        // 皮帶輪 A 的軸往後伸進軸承座
        ...pedestal({ at: [PIVOT[0], PIVOT[1]], z: -0.9, bore: 0.14, floor: FLOOR }),
        // 底板:軸承座與擋止立柱的腳都立在上面
        { kind: "box", size: [STOP_X + 1.3, 0.15, 1.4], at: [PIVOT[0] + (STOP_X - 0.1) / 2, FLOOR - 0.18 - 0.075, -0.6] },
      ],
    },
    { id: "labelC1", kind: "group", center: [PIVOT[0] + STOP_X, PIVOT[1] + STOP_Y.high - 0.1, 0], label: "C'", labelOffset: [0.5, 0.05, 0.2] },
    { id: "labelC", kind: "group", center: [PIVOT[0] + STOP_X, PIVOT[1] + STOP_Y.low + 0.1, 0], label: "C", labelOffset: [0.5, -0.05, 0.2] },
    { id: "pan", kind: "group", label: "B", labelOffset: [0, 0.55, 0.6], pieces: [
      { kind: "box", size: [1.6, 0.08, 1.0], at: [0, 0, 0] },
      { kind: "cylinder", axis: [0, 1, 0], radius: 0.18, length: 0.3, at: [-0.15, 0.19, 0] },
      { kind: "box", size: [0.3, 0.22, 0.3], at: [0.35, 0.15, 0] },
    ] },
    ...[0, 1, 2, 3].map((i) => ({ id: `string${i}`, kind: "rod", radius: 0.012 })),
  ],
  driver: { part: "drumA", type: "rotation", speed: SPEED },
  target: "leverD",
  view: { direction: [0.05, 0.12, 1] },
  pose(value) {
    const op = operation(value);
    const a = op.angle;
    const tie = local([ARM, TIE_Y], a);
    const pan = [tie[0], tie[1] - HANG, 0];
    const corners = [[-0.75, -0.45], [0.75, -0.45], [0.75, 0.45], [-0.75, 0.45]];
    const paths = {};
    corners.forEach(([x, z], i) => (paths[`string${i}`] = { points: [tie, [pan[0] + x, pan[1] + 0.04, z]], closed: false }));
    // 螺帽:鎖緊是從上往下看順時針(右旋螺紋)
    const spin = -2 * Math.PI * op.turns;
    const nut = (s) => ({ position: local([s * BOLT.x, LEVER_Y[1]], a), rotation: quatMul(quatAxisAngle(Z, a), quatMul(UPRIGHT, quatAxisAngle(Z, spin))), angle: spin });
    const plan = PLAN[op.step];
    const settled = plan.trim ? level(op.angle, op.omega) : Math.abs(op.turns - plan.target) < 1e-3;
    const ratio = friction(op.turns) / weightTorque(a);
    return {
      parts: {
        drumA: { angle: value },
        leverD: { angle: a },
        chain: { position: local([0, -op.slack], a), angle: a },
        nutL: nut(-1),
        nutR: nut(1),
        pan: { position: pan },
      },
      paths,
      readouts: [
        { label: "螺帽", value: `${plan.text[settled ? 1 : 0]}(從全鬆轉了 ${op.turns.toFixed(1)} 圈${op.slack > 1e-3 ? ",條板還沒貼上輪" : ""})` },
        { label: "摩擦力矩 ÷ 砝碼力矩", value: `${ratio.toFixed(2)},${compare(ratio)}` },
        { label: "槓桿 D(軸照箭頭方向轉)", value: LEVER_TEXT(a, op.omega) },
        { label: "有用功", value: "槓桿水平時 = 砝碼 × 掛點若隨軸轉的速度" },
      ],
    };
  },
};
