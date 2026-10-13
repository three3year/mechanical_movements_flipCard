// 第 147 種:蒸汽引擎的調速器。中心軸上牢固地固定著兩個圓形斜面(碗形座邊緣上的螺旋斜面);十字頭鬆套在軸上,
// 兩端裝著扇葉,底下兩個摩擦滾子靠在斜面上,頂上加了一個重球。心軸轉動時由斜面推著滾子帶十字頭一起轉;
// 軸轉得越快,扇葉受的空氣阻力越大,十字頭便落後於軸,滾子沿斜面往上滾,把十字頭抬高;
// 十字頭頂部接著作用於調節閥的槓桿。
// 主動件是虛擬的「進程」(持續運轉,做法同第 287 種):引擎經底部的傘齒輪帶著心軸轉,轉速隨負載起伏(推斷):
// 一輪 12 圈之內轉速由最慢升到最快再降回,轉速的平方隨進程直線升降。心軸、斜面與傘齒輪照轉速的積分轉;
// 十字頭(連扇葉、重球)跟著心軸轉,但轉角落後一個隨轉速增加的量——落後量就是滾子在斜面上的位置。
// 空氣阻力與轉速的平方成正比,十字頭落後的角度也取 (轉速 / 上限)² 的比例(推斷)。
// 抬升高度由接觸算(contact.js):把斜面沿圓周展開成直線,滾子往上推到剛好貼著斜面;滾子照走過的斜面長度滾動。
// 推斷(原圖只畫到底部的軸承托架,補上是為了看得出動力從哪裡來,比照第 161、170 種):心軸下端的一對傘齒輪、
// 往右的水平驅動軸與軸承座。
// 推斷(原圖只畫槓桿,補上是為了看得出它在調什麼,做法照第 161、287 種的節流閥):槓桿的樞軸裝在右邊的立柱上
// (立柱在扇葉掃過的範圍外),樞軸右邊伸出一小段,末端接一根閥桿往下推蒸汽管上節流閥(蝶形閥)閥軸上的曲柄:
// 十字頭升高(轉得太快)→ 槓桿左端被頂起、右端往下 → 閥桿把曲柄往下推 → 閥板轉向橫擋住蒸汽管 → 開度變小。
// throttle.js 是叉形槓桿套在套筒環槽上的做法,接不上這裡壓在圓頭上的槓桿,所以閥桿、曲柄與閥照它的做法在這裡畫。
import { X, Y, TAU, deg, clamp, quatAxisAngle, quatFromZ, quatMul } from "./kit.js";
import { circlePolygon, edgeDistance, placeOutline, pushUntilClear, swingUntilContact } from "./contact.js";
import { shape, rect } from "./shapes.js";
import { pedestalX } from "./supports.js";

const MAX = 10; // 轉速的上限(示意單位)
export const PERIOD = 12; // 轉速起伏一輪,心軸平均轉的圈數
const SLOWEST = 3; // 一輪之內最慢的轉速(最快是上限)
const LAG = deg(55); // 最高轉速時十字頭落後的角度
const RISE = 0.55; // 斜面:每落後 LAG,斜面升高 RISE
const ARM = 1.35; // 十字頭臂長(滾子離軸)
const RIM_Y = -0.35; // 碗形座邊緣的頂面
const RAMP_R = 0.1; // 斜面(圓管)的半徑
export const ROLLER = 0.13;
const RAMP_Y0 = RIM_Y + 0.02; // 斜面起點的中心:半陷在邊緣裡
const SLOPE = RISE / (LAG * ARM); // 斜面沿圓周展開後的坡度
// 十字頭在最低處時滾子中心的高度(斜面中心線往上一個「斜面半徑 + 滾子半徑」的垂直距離);十字頭的局部座標以它為準
const BASE_Y = RAMP_Y0 + (RAMP_R + ROLLER) * Math.hypot(1, SLOPE);
// 槓桿:左臂(length)的末端壓在十字頭頂端的圓頭上,樞軸右邊的短臂(tail)接閥桿;樞軸在扇葉掃過的半徑之外
const LEVER = { pivot: [3.1, 3.47, 0], length: 3.2, tail: 1.2, width: 0.2 };
const KNOB = { y: 3.25, r: 0.12 }; // 十字頭頂端的圓頭(十字頭在最低處時)
const APEX = [0, -2.0, 0]; // 底部傘齒輪對的錐頂
const FLOOR = -3.3;
const SPAN = LAG * 1.15; // 斜面的長度(角度):比最大落後角再長一點

// 轉速的平方在一輪之內直線升降(三角波):進程 0 最慢、半輪最快
const A = SLOWEST ** 2;
const B = MAX ** 2 - A;
const tri = (p) => {
  const u = (((p / PERIOD) % 1) + 1) % 1;
  return u < 0.5 ? 2 * u : 2 - 2 * u;
};
/** 進程 p:當下的轉速 */
export const speedAt = (p) => Math.sqrt(A + B * tri(p));
// 轉速對進程的積分(解析解):前半輪 ∫ √(A + 2Bq/P) dq,後半輪和前半輪對稱
const climb = (x) => (PERIOD / (3 * B)) * ((A + (2 * B * x) / PERIOD) ** 1.5 - A ** 1.5);
const HALF = climb(PERIOD / 2);
const NORMAL = (2 * HALF) / PERIOD; // 平均轉速:進程 1 是平均轉速下心軸轉一圈
/** 進程 p:心軸(與斜面、傘齒輪)的轉角,繞 +Y(由上往下看逆時針) */
export function spindleAngle(p) {
  const k = Math.floor(p / PERIOD);
  const x = p - k * PERIOD;
  const within = x <= PERIOD / 2 ? climb(x) : 2 * HALF - climb(PERIOD - x);
  return (TAU * (k * 2 * HALF + within)) / NORMAL;
}

// 斜面沿圓周展開:橫軸是離斜面起點的弧長,縱軸是高度;中心線是一條直線段
const RAMP_LINE = [
  [0, RAMP_Y0],
  [ARM * SPAN, RAMP_Y0 + SLOPE * ARM * SPAN],
];
/** 滾子停在斜面上弧長 u 處時的中心高度:由接觸算——從斜面中心線往上推,推到滾子剛好不壓進斜面 */
export const rollerHeight = (u) =>
  pushUntilClear(RAMP_Y0 + SLOPE * u, 1, 1, (y) => edgeDistance([u, y], RAMP_LINE) < RAMP_R + ROLLER, 40);
/** 滾子中心到斜面中心線的距離(展開後;貼著斜面時等於斜面半徑 + 滾子半徑) */
export const rollerGap = (u, y) => edgeDistance([u, y], RAMP_LINE) - (RAMP_R + ROLLER);

/** 轉速 s:十字頭落後的角度與抬升的高度 */
export function governor(s) {
  const lag = LAG * (clamp(s, 0, MAX) / MAX) ** 2;
  return { lag, rise: rollerHeight(ARM * lag) - BASE_Y };
}

// 槓桿靠自重壓在圓頭上:由接觸算(ADR-0001)——從抬起的位置往下擺(逆時針),停在碰到圓頭的轉角
const LEVER_OUTLINE = [[-LEVER.length, -LEVER.width / 2], [LEVER.tail, -LEVER.width / 2], [LEVER.tail, LEVER.width / 2], [-LEVER.length, LEVER.width / 2]];
/** 十字頭抬高 rise 時槓桿的轉角 */
export const leverAngle = (rise) =>
  swingUntilContact({ pivot: LEVER.pivot, outline: LEVER_OUTLINE, from: -0.5, into: 1, sweep: 0.7 }, [circlePolygon([0, KNOB.y + rise], KNOB.r, 48)]);
/** 槓桿下緣到圓頭表面的距離(貼著時是 0) */
export const leverGap = (rise, angle) => edgeDistance([0, KNOB.y + rise], placeOutline(LEVER_OUTLINE, LEVER.pivot, angle)) - KNOB.r;

// 節流閥(推斷,做法照 throttle.js):閥桿上端的銷在槓桿短臂上,下端的銷在閥軸的曲柄上;閥桿長度不變
const ROD = { at: LEVER.tail - 0.1, drop: 1.0, z: 0.2 }; // 閥桿上端離樞軸多遠、閥桿長、閥桿那一層
const CRANK = { r: 0.14, z: 0.14 }; // 曲柄半徑、曲柄臂那一層
const PIPE = { r: 0.15, bore: 0.11, chest: 0.21, z: -0.5 }; // 蒸汽管(在後面一層)
const POST_Z = -0.22; // 槓桿樞軸立柱那一層(在槓桿後面)
const rodTop = (a) => [LEVER.pivot[0] + ROD.at * Math.cos(a), LEVER.pivot[1] + ROD.at * Math.sin(a)];
const WORKING = [leverAngle(governor(SLOWEST).rise), leverAngle(governor(MAX).rise)]; // 一輪之內槓桿的轉角範圍
// 閥軸:槓桿在範圍中點時,曲柄水平朝右、閥桿直立
const ROD_MID = rodTop((WORKING[0] + WORKING[1]) / 2);
const VALVE_O = [ROD_MID[0] - CRANK.r, ROD_MID[1] - ROD.drop];
/** 槓桿轉角 a 時曲柄的轉角:以閥軸為圓心、半徑 CRANK.r 的圓和以閥桿上端為圓心、半徑閥桿長的圓的交點(曲柄朝右的那一個) */
function crankAngle(a) {
  const A = rodTop(a);
  const d = Math.hypot(A[0] - VALVE_O[0], A[1] - VALVE_O[1]);
  const u = [(A[0] - VALVE_O[0]) / d, (A[1] - VALVE_O[1]) / d];
  const along = (d * d + CRANK.r ** 2 - ROD.drop ** 2) / (2 * d);
  const h = Math.sqrt(Math.max(0, CRANK.r ** 2 - along ** 2));
  return Math.atan2(along * u[1] - h * u[0], along * u[0] + h * u[1]);
}
const OPEN = crankAngle(WORKING[0]); // 最慢時閥板順著管子(全開)
/** 槓桿轉角 → 曲柄轉角、閥板轉過的角度(0 全開、π/2 全關)與開度;槓桿右端往下時曲柄順時針轉 */
export function valveAt(a) {
  const crank = crankAngle(a);
  const disc = OPEN - crank;
  return { crank, disc, opening: 1 - Math.sin(clamp(disc, 0, Math.PI / 2)) };
}
/** 進程 p:節流閥的開度(1 全開、0 全關) */
export const opening = (p) => valveAt(leverAngle(governor(speedAt(p)).rise)).opening;
/** 槓桿轉角 a 時閥桿兩端的銷(世界座標,在閥桿那一層) */
export function valveRodEnds(a) {
  const { crank } = valveAt(a);
  const A = rodTop(a);
  return [
    [A[0], A[1], ROD.z],
    [VALVE_O[0] + CRANK.r * Math.cos(crank), VALVE_O[1] + CRANK.r * Math.sin(crank), ROD.z],
  ];
}
export const ROD_LENGTH = ROD.drop;
const PIPE_X = [VALVE_O[0] - 0.6, VALVE_O[0] + 0.6]; // 蒸汽管兩端往下轉進地面的地方

// 斜面:碗形座邊緣上兩段螺旋斜面(高度隨角度線性增加),下面用一排階狀的塊填到邊緣,看得出是實心的楔。
// 斜面往 +φ(由上往下看順時針,和心軸轉向相反)升高:心軸往前轉時斜面的下坡面推著滾子走,滾子落後就往上爬
const rampAt = (start, a) => [ARM * Math.cos(start + a), RAMP_Y0 + SLOPE * ARM * a, ARM * Math.sin(start + a)];
const ramp = (start) => [
  { kind: "tube", points: Array.from({ length: 31 }, (_, i) => rampAt(start, (SPAN * i) / 30)), radius: RAMP_R },
  ...Array.from({ length: 10 }, (_, i) => {
    const a = (SPAN * (i + 0.5)) / 10;
    const [x, y, z] = rampAt(start, a);
    const h = y - RIM_Y;
    return { kind: "box", size: [0.3, (ARM * SPAN) / 10 + 0.02, h], at: [x, RIM_Y + h / 2, z], axis: Y, angle: -(start + a) };
  }),
];

// 繞直立軸轉的零件(axis: Y)的局部 z 是世界的 +Y;把以世界座標畫的附件包一層轉回來
const upright = (pieces) => [{ kind: "group", rotation: [Math.SQRT1_2, 0, 0, Math.SQRT1_2], pieces }];
const turnY = (a) => quatAxisAngle(Y, a);
const rotY = ([x, y, z], a) => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];

export default {
  figure: 147,
  parts: [
    {
      id: "shaft",
      kind: "group",
      axis: Y,
      spin: 0.16,
      spinOffset: -1.1, // 轉向箭頭在碗形座下方的軸段上
      pieces: upright([
        { kind: "cylinder", axis: Y, radius: 0.16, length: 3.6, at: [0, 0.3, 0] },
        // 碗形座:邊緣是一圈平頂的厚環,斜面立在上面;中央的轂套緊在軸上
        { kind: "lathe", axis: Y, at: [0, -0.55, 0], profile: [[0.16, -0.3], [1.6, -0.3], [1.6, 0.2], [1.1, 0.2], [1.1, 0.05], [0.4, 0.0], [0.16, 0.05]] },
        ...ramp(0),
        ...ramp(Math.PI),
        { kind: "cylinder", axis: Y, radius: 0.16, length: 2.3, at: [0, -2.1, 0] }, // 軸的下段:穿過傘齒輪,底端在腳座裡
        { kind: "gear", teeth: 20, radius: 0.55, cone: deg(45), width: 0.18, axis: [0, -1, 0], at: [0, APEX[1] + 0.5, 0] },
      ]),
    },
    {
      // 十字頭:鬆套在軸上(套筒的孔和軸一樣粗),兩臂伸進扇葉,臂下掛著滾子的軸,頂上是重球與壓槓桿的圓頭
      id: "crosshead",
      kind: "group",
      axis: Y,
      arrow: false, // 和心軸同軸同向,箭頭只標在心軸上
      pieces: upright([
        ...[1, -1].flatMap((s) => [
          { kind: "cylinder", axis: X, radius: 0.14, length: ARM + 0.75, at: [s * (0.3 + (ARM + 0.75) / 2), 0.95, 0] }, // 橫臂從套筒兩側伸出(不穿過軸),末端伸進扇葉
          { kind: "cylinder", axis: X, radius: 0.24, length: 0.18, at: [s * (ARM - 0.25), 0.95, 0] },
          { kind: "plate", shape: shape(rect(0.9, 1.6)), thickness: 0.06, at: [s * (ARM + 1.05), 0.95, 0], ...(s === 1 ? { mark: [0.2, 0.55] } : {}) },
          // 吊架從臂端垂下,滾子的軸(沿徑向)裝在吊架下端
          { kind: "box", size: [0.08, 0.95 - BASE_Y, 0.12], at: [s * (ARM + 0.11), (0.95 + BASE_Y) / 2, 0] },
          { kind: "cylinder", axis: X, radius: 0.05, length: 0.3, at: [s * ARM, BASE_Y, 0] },
        ]),
        { kind: "sphere", radius: 0.82, at: [0, 2.0, 0] },
        { kind: "cylinder", axis: Y, radius: 0.3, inner: 0.16, length: 0.55, at: [0, 1.0, 0] },
        { kind: "cylinder", axis: Y, radius: 0.2, length: 0.4, at: [0, 2.95, 0] },
        { kind: "sphere", radius: KNOB.r, at: [0, KNOB.y, 0] },
      ]),
    },
    // 兩個摩擦滾子:套在吊架下端的軸上,沿斜面滾(局部 z 是由軸往外的徑向)
    { id: "rollerR", kind: "cylinder", radius: ROLLER, inner: 0.05, length: 0.14, axis: X, mark: true, arrow: false },
    { id: "rollerL", kind: "cylinder", radius: ROLLER, inner: 0.05, length: 0.14, axis: [-1, 0, 0], mark: true, arrow: false },
    {
      id: "lever",
      kind: "group",
      center: LEVER.pivot,
      arrow: false,
      pieces: [
        { kind: "box", size: [LEVER.length + LEVER.tail, LEVER.width, 0.12], at: [(LEVER.tail - LEVER.length) / 2, 0, 0.1] },
        { kind: "cylinder", radius: 0.14, inner: 0.045, length: 0.3 }, // 樞軸處的轂,套在立柱伸出的樞軸銷上
        { kind: "cylinder", radius: 0.035, length: ROD.z + 0.04 - 0.1, at: [ROD.at, 0, (ROD.z + 0.04 + 0.1) / 2] }, // 閥桿的銷
      ],
    },
    { id: "valveRod", kind: "link", width: 0.06, thickness: 0.05 },
    {
      // 節流閥:閥軸從閥室後壁穿到前面,前端是曲柄;閥板在閥室裡
      id: "valve",
      kind: "group",
      center: [VALVE_O[0], VALVE_O[1], PIPE.z],
      spin: CRANK.r,
      arrow: false,
      pieces: [
        { kind: "cylinder", radius: 0.03, length: CRANK.z - PIPE.z + PIPE.chest + 0.02, at: [0, 0, (CRANK.z - PIPE.z - PIPE.chest - 0.02) / 2] },
        { kind: "box", size: [CRANK.r + 0.08, 0.07, 0.05], at: [CRANK.r / 2, 0, CRANK.z - PIPE.z], accent: true }, // 曲柄臂
        { kind: "cylinder", radius: 0.035, length: ROD.z - CRANK.z + 0.06, at: [CRANK.r, 0, (ROD.z + CRANK.z) / 2 - PIPE.z + 0.005] }, // 曲柄銷
        // 閥板:最慢時順著管子(板面朝上,全開)
        { kind: "cylinder", radius: PIPE.bore - 0.006, length: 0.015, axis: [Math.sin(OPEN), Math.cos(OPEN), 0] },
      ],
    },
    // 引擎經這根水平軸與傘齒輪帶動心軸(零件的局部 +Z 是世界的 +X;錐頂朝 −X)
    {
      id: "driveShaft",
      kind: "group",
      axis: X,
      center: [0.5, APEX[1], 0],
      spin: 0.1,
      spinOffset: 0.95,
      pieces: [
        { kind: "gear", teeth: 20, radius: 0.55, cone: deg(45), width: 0.18, axis: [0, 0, -1] },
        { kind: "cylinder", radius: 0.1, length: 1.6, at: [0, 0, 0.8] },
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "cylinder", axis: Y, radius: 0.4, inner: 0.18, length: 0.6, at: [0, FLOOR + 0.3, 0] }, // 心軸的腳座
        { kind: "box", size: [1.2, 0.18, 1.0], at: [0, FLOOR - 0.09, 0] },
        ...pedestalX({ x: 1.75, y: APEX[1], z: 0, bore: 0.1, floor: FLOOR }),
        // 槓桿樞軸的立柱(在槓桿後面)、腳座與樞軸銷
        { kind: "box", size: [0.16, LEVER.pivot[1] + 0.1 - FLOOR, 0.1], at: [LEVER.pivot[0], (LEVER.pivot[1] + 0.1 + FLOOR) / 2, POST_Z] },
        { kind: "box", size: [0.6, 0.18, 0.6], at: [LEVER.pivot[0], FLOOR - 0.09, POST_Z] },
        { kind: "cylinder", radius: 0.045, length: 0.17 - POST_Z, at: [LEVER.pivot[0], LEVER.pivot[1], (0.17 + POST_Z) / 2] },
        // 蒸汽管:從地面下(鍋爐)上來,經節流閥,再回到地面下(往汽缸);閥室比管子粗
        { kind: "cylinder", axis: X, radius: PIPE.r, inner: PIPE.bore, length: PIPE_X[1] - PIPE_X[0], at: [VALVE_O[0], VALVE_O[1], PIPE.z] },
        ...PIPE_X.map((x) => ({ kind: "cylinder", axis: Y, radius: PIPE.r, inner: PIPE.bore, length: VALVE_O[1] + PIPE.r - FLOOR, at: [x, (VALVE_O[1] + PIPE.r + FLOOR) / 2, PIPE.z] })),
        { kind: "cylinder", axis: X, radius: PIPE.chest, inner: PIPE.bore, length: 0.36, at: [VALVE_O[0], VALVE_O[1], PIPE.z] },
        { kind: "cylinder", radius: 0.07, inner: 0.03, length: 0.12, at: [VALVE_O[0], VALVE_O[1], PIPE.z + PIPE.chest + 0.05] }, // 閥軸穿出閥室的軸承
      ],
    },
  ],
  // 外力來源:引擎帶的驅動軸;扇葉受空氣阻力(流體)拖住十字頭
  powered: ["driveShaft", "crosshead"],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, PERIOD], unit: "圈", speed: 1.5 },
  target: "valve", // 被調節的節流閥
  view: { direction: [0.02, 0.12, 1] },
  pose(p) {
    const s = speedAt(p);
    const { lag, rise } = governor(s);
    const shaft = spindleAngle(p);
    const head = shaft - lag; // 十字頭落後於心軸
    const lever = leverAngle(rise);
    const valve = valveAt(lever);
    const rodEnds = valveRodEnds(lever);
    // 滾子沿斜面走過的長度(展開後中心走的路)÷ 半徑 = 滾過的角度;落後增加時往上滾,繞由軸往外的徑向正轉
    const spin = (ARM * lag * Math.hypot(1, SLOPE)) / ROLLER;
    const roller = (side) => ({
      position: rotY([side * ARM, BASE_Y + rise, 0], head),
      rotation: quatMul(turnY(head), quatMul(quatFromZ([side, 0, 0]), quatAxisAngle([0, 0, 1], spin))),
      angle: spin,
    });
    return {
      parts: {
        shaft: { angle: shaft },
        crosshead: { position: [0, rise, 0], angle: head },
        rollerR: roller(1),
        rollerL: roller(-1),
        lever: { angle: lever },
        valve: { angle: valve.crank },
        valveRod: { from: rodEnds[0], to: rodEnds[1] },
        driveShaft: { angle: -shaft }, // 兩個傘齒輪一樣大,轉向相反
      },
      readouts: [
        { label: "轉速", value: `${s.toFixed(1)}(${s > speedAt(p - 0.01) ? "漸快" : "漸慢"})` },
        { label: "十字頭落後", value: `${Math.round((lag * 180) / Math.PI)}°` },
        { label: "節流閥開度", value: `${Math.round(valve.opening * 100)}%` },
      ],
    };
  },
};
