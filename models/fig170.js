// 第 170 種:另一種蒸汽引擎調速器。兩臂不接在心軸的滑塊上,而是彼此交叉,往上延伸過心軸頂部,
// 再以兩根短連桿接到閥桿。球飛開時,交叉的臂上端往外張開並下降,經短連桿把閥桿往下拉。
// 主動件是虛擬的「進程」(持續運轉,做法同第 162、163、287 種):引擎經左下方的水平軸與一對傘齒輪帶著心軸轉
// (原圖畫在底部),轉速隨負載起伏(推斷):一輪 12 圈之內轉速由最慢升到最快再降回,轉速的平方隨進程直線升降。
// 心軸與水平軸照轉速的積分轉;臂、球、短連桿與閥桿照當下的轉速算。
// 張角對轉速與 governor.js 相同:以 (s / MAX)² 在 RANGE 之間變化,滑桿整段都有反應。
// 臂、球、短連桿、閥桿、頂頭與弓架畫在同一個平面上,不跟著心軸繞(同第 162、287 種的飛球);它們實際上都隨心軸轉,
// 所以心軸的圓軸只轉到頂頭下面,上面扁的頂頭(兩支臂共用的樞軸銷穿過它)與套在心軸上的弓架座畫成不轉的。
// 原圖球的上方有一道弧形的弓架,中央以方座固定在心軸上(推斷:固定在心軸上的導弓,臂從它前面掃過);畫在臂後面一層。
// 推斷(原圖只畫調速器本身):心軸下端的止推軸承、傘齒輪上方的軸承架、水平軸的軸承座與底座;
// 閥桿上段的環槽、叉形槓桿、閥桿與蒸汽管上的節流閥(throttle.js,做法照第 161、274、287 種),閥桿頂端穿過
// 從槓桿立柱伸出的導套。這張圖的閥桿是轉得越快越往下(臂上端張開下降),所以節流閥以閥桿在最高處(最慢)為全開,
// 閥桿下降時閥板往順時針轉、橫擋住蒸汽管;開度由閥板轉過的角度算(throttle.js 的 opening 只算套筒上升關閥的方向)。
import { X, Y, TAU, deg, clamp } from "./kit.js";
import { shape, arcPoints } from "./shapes.js";
import { bevelGear, pitchCones, bevelContact, meshAngle } from "./gears.js";
import { pedestalX } from "./supports.js";
import { throttle } from "./throttle.js";

const PIVOT = [0, 1.35, 0]; // 兩支臂交叉處的樞軸
const ARM = 2.0; // 樞軸到球心
const UP = 0.75; // 樞軸往上延伸的長度
const LINK = 0.62;
export const MAX = 10; // 轉速上限
const RANGE = [deg(24), deg(50)];
const BOW = { r: 1.5, half: deg(58), z: -0.32 }; // 弓架:以樞軸為圓心的弧,在臂後面
export const PERIOD = 12; // 轉速起伏一輪,心軸平均轉的圈數
const SLOWEST = 3; // 一輪之內最慢的轉速(最快是上限)
const FLOOR = -2.9;
const SHAFT_TOP = PIVOT[1] - 0.35; // 心軸的圓軸到這裡;上面是扁的頂頭
const SHAFT_R = 0.07;
const BRACKET_Y = -1.15; // 傘齒輪上方的軸承架
const ROD = { r: 0.06, top: 1.45 }; // 閥桿:從接短連桿的轂往上
const GROOVE = { top: 0.35, height: 0.1, neck: 0.075, outer: 0.15 }; // 閥桿上段的環槽(槽頂離轂)
const COLLAR = 0.2; // 環槽上面那段(環槽的上壁)

// 傘齒輪:心軸上的在上(錐頂朝下),水平軸上的在左(錐頂朝右),兩者錐頂在心軸上
const [CONE_A, CONE_B] = pitchCones(20, 20);
const APEX = [0, -2.0, 0];
const SPINDLE_GEAR = bevelGear({ apex: APEX, axis: [0, -1, 0], teeth: 20, radius: 0.55, cone: CONE_A, width: 0.18 });
const DRIVE_GEAR = bevelGear({ apex: APEX, axis: X, teeth: 20, radius: 0.55, cone: CONE_B, width: 0.18 });
const CONTACT = bevelContact(SPINDLE_GEAR, DRIVE_GEAR);
const DRIVE_END = -2.1; // 水平軸的左端(往引擎)
export const gears = { spindle: SPINDLE_GEAR, drive: DRIVE_GEAR, contact: CONTACT };

/** 轉速 s:張角(臂與垂直線的夾角)與閥桿的高度 */
export function governor(s) {
  const alpha = RANGE[0] + (RANGE[1] - RANGE[0]) * clamp(s / MAX, 0, 1) ** 2;
  // 左球的臂往右上延伸(交叉);上端在 x = UP·sinα、y = UP·cosα
  const tx = UP * Math.sin(alpha);
  const ty = PIVOT[1] + UP * Math.cos(alpha);
  const rod = ty + Math.sqrt(LINK * LINK - tx * tx);
  return { alpha, tip: [tx, ty, 0], rod };
}

// 轉速的平方在一輪之內直線升降(三角波):進程 0 最慢、半輪最快(做法同第 287 種)
const A = SLOWEST ** 2;
const B = MAX ** 2 - A;
const tri = (p) => {
  const u = (((p / PERIOD) % 1) + 1) % 1;
  return u < 0.5 ? 2 * u : 2 - 2 * u;
};
/** 進程 p:當下的轉速 */
export const speedAt = (p) => Math.sqrt(A + B * tri(p));
// 轉速對進程的積分(解析解):前半輪 ∫ √(A + 2Bq/P) dq,後半輪和前半輪對稱
const rise = (x) => (PERIOD / (3 * B)) * ((A + (2 * B * x) / PERIOD) ** 1.5 - A ** 1.5);
const HALF = rise(PERIOD / 2);
const NORMAL = (2 * HALF) / PERIOD; // 平均轉速:進程 1 是平均轉速下心軸轉一圈
/** 進程 p:心軸的轉角(繞 +Y) */
export function spindleAngle(p) {
  const k = Math.floor(p / PERIOD);
  const x = p - k * PERIOD;
  const within = x <= PERIOD / 2 ? rise(x) : 2 * HALF - rise(PERIOD - x);
  return (TAU * (k * 2 * HALF + within)) / NORMAL;
}
/** 進程 p:水平軸的轉角(繞 +X)。心軸齒輪的軸朝下,心軸轉 θ 是它繞自己的軸轉 −θ */
export const driveAngle = (p) => meshAngle(SPINDLE_GEAR, DRIVE_GEAR, -spindleAngle(p), CONTACT);

// 節流閥(推斷):樞軸在左邊的立柱上,叉臂跨在閥桿上段的環槽兩側。range[0] 是最慢時(閥桿最高、全開)
const WORKING = [governor(SLOWEST).rod, governor(MAX).rod];
const GROOVE_MID = (WORKING[0] + WORKING[1]) / 2 + GROOVE.top - GROOVE.height / 2;
const VALVE = throttle({ pivot: [-2.3, GROOVE_MID], rodAt: 1.2, groove: GROOVE, range: WORKING, floor: FLOOR, pipeZ: -0.75 });
const [PX, PY] = VALVE.geometry.pivot;
/** 閥桿高度:節流閥的開度(1 全開、0 全關);閥板從全開往哪一邊轉都是關小 */
const openingAt = (rod) => 1 - Math.sin(clamp(Math.abs(VALVE.solve(rod).disc), 0, Math.PI / 2));
/** 進程 p:節流閥的開度 */
export const opening = (p) => openingAt(governor(speedAt(p)).rod);
// 閥桿頂端的導套:在環槽上壁的最高處之上,由槓桿立柱往上伸出的橫臂托著(推斷)
const GUIDE_Y = WORKING[0] + GROOVE.top + COLLAR + 0.15;
export const geometry = { PIVOT, UP, LINK, GUIDE_Y, ROD, WORKING };

const z = (p, d) => [p[0], p[1], d];

export default {
  figure: 170,
  parts: [
    {
      // 心軸:圓軸與下段的傘齒輪,一起轉
      id: "spindle",
      kind: "group",
      axis: Y,
      spin: 0.2,
      spinOffset: -0.75,
      pieces: [
        { kind: "cylinder", radius: SHAFT_R, length: SHAFT_TOP - FLOOR - 0.02, at: [0, 0, (SHAFT_TOP + FLOOR + 0.02) / 2] },
        { kind: "gear", teeth: 20, radius: SPINDLE_GEAR.radius, cone: SPINDLE_GEAR.cone, width: SPINDLE_GEAR.width, axis: [0, 0, -1], at: [0, 0, SPINDLE_GEAR.center[1]] },
      ],
    },
    // 心軸頂端扁的頂頭:兩支臂一前一後夾著它,共用的樞軸銷橫穿過去(畫在臂的平面上,不轉)
    {
      id: "head",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.16, PIVOT[1] + 0.12 - SHAFT_TOP - 0.005, 0.1], at: [0, (PIVOT[1] + 0.12 + SHAFT_TOP + 0.005) / 2, 0] },
        { kind: "cylinder", radius: 0.05, length: 0.4, at: PIVOT },
      ],
    },
    // 弓架:弧在臂後面,中央的方座固定在套住心軸的環上(畫在臂的平面上,不轉)
    {
      id: "bow",
      kind: "group",
      pieces: [
        { kind: "cylinder", axis: Y, radius: 0.15, inner: SHAFT_R + 0.005, length: 0.22, at: [0, PIVOT[1] - BOW.r, 0] },
        { kind: "box", size: [0.3, 0.22, 0.26], at: [0, PIVOT[1] - BOW.r, -0.25] },
        { kind: "plate", shape: shape([...arcPoints(BOW.r + 0.05, -Math.PI / 2 - BOW.half, -Math.PI / 2 + BOW.half), ...arcPoints(BOW.r - 0.05, -Math.PI / 2 + BOW.half, -Math.PI / 2 - BOW.half)]), thickness: 0.1, at: [0, PIVOT[1], BOW.z] },
      ],
    },
    // 引擎經這根水平軸與傘齒輪帶動心軸(零件的局部 +Z 是世界的 +X;錐頂朝右)
    {
      id: "driveShaft",
      kind: "group",
      axis: X,
      center: DRIVE_GEAR.center,
      spin: 0.2,
      spinOffset: -0.95,
      pieces: [
        { kind: "gear", teeth: 20, radius: DRIVE_GEAR.radius, cone: DRIVE_GEAR.cone, width: DRIVE_GEAR.width, axis: [0, 0, 1] },
        { kind: "cylinder", radius: SHAFT_R, length: DRIVE_GEAR.center[0] - DRIVE_END, at: [0, 0, (DRIVE_END - DRIVE_GEAR.center[0]) / 2] },
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 心軸下端的止推軸承、傘齒輪上方的軸承架、底座(推斷)
        { kind: "cylinder", axis: Y, radius: 0.16, inner: SHAFT_R, length: 0.3, at: [0, FLOOR + 0.15, 0] },
        { kind: "box", size: [5.8, 0.15, 2.0], at: [-0.35, FLOOR - 0.075, -0.4] },
        { kind: "cylinder", axis: Y, radius: 0.16, inner: SHAFT_R, length: 0.16, at: [0, BRACKET_Y, 0] },
        { kind: "box", size: [2.1, 0.12, 0.16], at: [1.17, BRACKET_Y, 0] },
        { kind: "box", size: [0.16, BRACKET_Y + 0.06 - FLOOR, 0.16], at: [2.2, (BRACKET_Y + 0.06 + FLOOR) / 2, 0] },
        // 水平軸的軸承座(推斷)
        ...pedestalX({ x: -1.75, y: APEX[1], z: 0, bore: SHAFT_R, floor: FLOOR }),
        ...VALVE.framePieces,
        // 槓桿立柱往上伸,橫臂托著閥桿頂端的導套(推斷)
        { kind: "box", size: [0.16, GUIDE_Y + 0.06 - (PY + 0.1), 0.1], at: [PX, (GUIDE_Y + 0.06 + PY + 0.1) / 2, -0.13] },
        { kind: "box", size: [-PX + 0.04, 0.12, 0.1], at: [PX / 2 - 0.02, GUIDE_Y, -0.13] },
        { kind: "cylinder", axis: Y, radius: 0.13, inner: ROD.r + 0.005, length: 0.2, at: [0, GUIDE_Y, 0] },
      ],
    },
    { id: "armL", kind: "link", width: 0.1, thickness: 0.06 },
    { id: "armR", kind: "link", width: 0.1, thickness: 0.06 },
    { id: "ballL", kind: "sphere", radius: 0.42 },
    { id: "ballR", kind: "sphere", radius: 0.42 },
    { id: "linkL", kind: "link", width: 0.08, thickness: 0.05 },
    { id: "linkR", kind: "link", width: 0.08, thickness: 0.05 },
    {
      // 閥桿:下端的轂接兩根短連桿,上段車出環槽(叉形槓桿的銷伸在裡面),頂端穿過導套
      id: "rod",
      kind: "group",
      pieces: [
        { kind: "cylinder", axis: Y, radius: ROD.r, length: ROD.top + 0.05, at: [0, (ROD.top - 0.05) / 2, 0] },
        { kind: "cylinder", radius: 0.12, inner: 0.05, length: 0.24 },
        { kind: "cylinder", axis: Y, radius: GROOVE.outer, length: COLLAR, at: [0, GROOVE.top + COLLAR / 2, 0] }, // 環槽的上壁
        ...VALVE.sleevePieces(),
      ],
    },
    ...VALVE.parts,
  ],
  powered: ["driveShaft", "ballL", "ballR"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, PERIOD], unit: "圈", speed: 1.5 },
  target: "valve", // 被調節的節流閥
  view: { direction: [0.15, 0.1, 1] },
  pose(p) {
    const s = speedAt(p);
    const { alpha, tip, rod } = governor(s);
    // 左球:從樞軸往左下;它的臂延伸到樞軸右上方的 tip(交叉)
    const ballL = [PIVOT[0] - ARM * Math.sin(alpha), PIVOT[1] - ARM * Math.cos(alpha), 0];
    const ballR = [PIVOT[0] + ARM * Math.sin(alpha), PIVOT[1] - ARM * Math.cos(alpha), 0];
    const tipL = [PIVOT[0] + tip[0], tip[1], 0];
    const tipR = [PIVOT[0] - tip[0], tip[1], 0];
    return {
      parts: {
        spindle: { angle: spindleAngle(p) },
        driveShaft: { angle: driveAngle(p) },
        armL: { from: z(ballL, 0.08), to: z(tipL, 0.08) },
        armR: { from: z(ballR, -0.08), to: z(tipR, -0.08) },
        ballL: { position: ballL },
        ballR: { position: ballR },
        linkL: { from: z(tipL, 0.15), to: [0, rod, 0.15] },
        linkR: { from: z(tipR, -0.15), to: [0, rod, -0.15] },
        rod: { position: [0, rod, 0] },
        ...VALVE.pose(rod),
      },
      readouts: [
        { label: "轉速", value: `${s.toFixed(1)}(${s > speedAt(p - 0.01) ? "漸快" : "漸慢"})` },
        { label: "節流閥開度", value: `${Math.round(openingAt(rod) * 100)}%` },
      ],
    };
  },
};
