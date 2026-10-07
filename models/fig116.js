// 第 116 種:曲柄的替代裝置。雙齒條框架往復直線運動,使小齒輪軸均勻地(單向)旋轉。
// 兩個齒條各配一個小齒輪,位於不同的平面上(前、後),都鬆套在軸上;每個小齒輪外側的軸上固定一個棘輪,
// 小齒輪上的棘爪與它嚙合。框架往右時上齒條使前小齒輪順時針轉,經棘爪帶軸;往左時換後小齒輪順時針轉、帶軸。
// 總有一個小齒輪在軸上空轉。原文說兩棘輪的齒方向相反——相對於它們各自的小齒輪(兩小齒輪在同一程中反向轉),
// 這裡兩個棘輪都讓軸朝順時針方向轉。主動量是框架的累計行程。
//
// 接觸:棘爪鉸在小齒輪上,被彈簧壓向棘輪。小齒輪順時針轉時,爪尖頂住棘輪的直面,小齒輪與軸鎖在一起轉;
// 逆時針空轉時,爪尖沿齒背滑上去、過了齒尖再被彈簧加速壓回下一格(爪的轉角逐步由接觸算)。
// 行程取「小齒輪每程轉半圈」(棘輪 10 齒的整數倍):空轉的那一程,小齒輪相對軸正好退回一整圈,
// 下一程一開始爪尖就落在直面腳下,沒有空行程——軸因此不停頓地均勻旋轉(原文:「使小齒輪軸產生均勻的旋轉運動」)。
// 兩個棘輪的齒各轉一個相位,讓爪尖在換程時正好落在直面腳下。
// 框架兩端的桿穿在固定的導套裡,軸的兩端架在軸承座上(導套、軸承座是推斷)。
import { deg, swingPhase, polar, TAU } from "./kit.js";
import { pinionAngle, circularPitch } from "./gears.js";
import { ratchetRadius, pawlRest } from "./ratchets.js";
import { ratchetShape, arcPoints, shape, stadium } from "./shapes.js";
import { pedestal, squareGuide } from "./supports.js";

const R = 0.8;
export const FRONT = { center: [0, 0, 0.22], teeth: 12, radius: R };
export const BACK = { center: [0, 0, -0.22], teeth: 12, radius: R };
const PITCH = circularPitch(FRONT);
const TOP = { origin: [0, R, 0], dir: [1, 0, 0], pitch: PITCH };
const BOTTOM = { origin: [0, -R, 0], dir: [1, 0, 0], pitch: PITCH };
const STROKE = Math.PI * R; // 每程小齒輪轉半圈
const RATCHET = { teeth: 10, outer: 0.42, inner: 0.32, dir: -1 };
const TOOTH = TAU / RATCHET.teeth;
const PAWL = { at: 0.52, length: 0.28 };
const DRIVE = -1; // 小齒輪順時針轉的那一程,棘爪推動軸

/** 主動量 v(累計行程):框架位置、前後小齒輪轉角 */
function racks(v) {
  const { at } = swingPhase(v, -STROKE / 2, STROKE / 2);
  return { x: at, front: pinionAngle(FRONT, TOP, at), back: pinionAngle(BACK, BOTTOM, at) };
}

const pivotOf = (pinion) => polar(PAWL.at, pinion + deg(90));
const tipGap = (pinion, psi, wheelAngle) => {
  const pivot = pivotOf(pinion);
  const [x, y] = [pivot[0] + PAWL.length * Math.cos(psi), pivot[1] + PAWL.length * Math.sin(psi)];
  return Math.hypot(x, y) - ratchetRadius(RATCHET, Math.atan2(y, x) - wheelAngle);
};
// 棘爪被彈簧往棘輪壓(順時針),停在爪尖碰到輪面的轉角
const rest = (pinion, from, wheelAngle) =>
  pawlRest({ pivot: pivotOf(pinion), length: PAWL.length, from, into: -1, sweep: 1.6 }, { center: [0, 0], angle: wheelAngle, ...RATCHET }).angle;

// 棘輪的相位:推程開始時,爪尖靠在齒根、正好貼著直面的腳(局部 0.982 個齒距;0.98 是直面的腳)。
// 之後整個推程爪尖都頂著直面,小齒輪與軸鎖在一起轉;空轉的那一程小齒輪相對軸退回一整圈(10 齒),
// 下一程開始時爪尖又正好落在直面腳下。
const shaftAt = (v) => -v / R; // 每一程帶動的小齒輪轉半圈,軸跟著轉半圈
function phaseFor(pinion, shaft) {
  // 爪尖落到齒根(半徑 inner)時的位置
  const pivot = pivotOf(pinion);
  let [lo, hi] = [pinion - 1.6, pinion]; // 爪從切線方向往內擺
  const tipR = (psi) => Math.hypot(pivot[0] + PAWL.length * Math.cos(psi), pivot[1] + PAWL.length * Math.sin(psi));
  for (let k = 0; k < 50; k++) {
    const mid = (lo + hi) / 2;
    if (tipR(mid) > RATCHET.inner) hi = mid;
    else lo = mid;
  }
  const psi = (lo + hi) / 2;
  const tip = Math.atan2(pivot[1] + PAWL.length * Math.sin(psi), pivot[0] + PAWL.length * Math.cos(psi));
  return tip - 0.982 * TOOTH - shaft;
}
const PHASE = {
  front: phaseFor(racks(0).front, shaftAt(0)), // 第一程(框架往右)前小齒輪帶動
  back: phaseFor(racks(STROKE).back, shaftAt(STROKE)), // 第二程(框架往左)後小齒輪帶動
};

// 兩支棘爪逐步模擬:每一步先把爪抬一點再讓彈簧壓回,停在爪尖碰到輪面的地方;離開齒尖後是加速壓回
const SAMPLES = 800; // 一個來回(主動量 2·STROKE)的取樣數
const FALL = 0.002; // 爪懸空時每一步增加的角速度
const RAISE = deg(4); // 抬太多會讓爪尖越過直面
const TABLE = (() => {
  const rel = { front: deg(20), back: deg(20) }; // 爪相對小齒輪的轉角(以「爪沿切線」為 0);從抬起的位置開始
  const speed = { front: 0, back: 0 };
  const run = [];
  for (let i = 0; i <= 3 * SAMPLES; i++) {
    const v = (2 * STROKE * i) / SAMPLES;
    const now = racks(v);
    for (const p of ["front", "back"]) {
      const target = rest(now[p], now[p] + rel[p] + RAISE, shaftAt(v) + PHASE[p]) - now[p];
      if (rel[p] - target > 1e-6) {
        speed[p] += FALL;
        rel[p] = Math.max(target, rel[p] - speed[p]);
        if (rel[p] === target) speed[p] = 0;
      } else {
        rel[p] = target; // 被齒背頂起(由接觸推動)
        speed[p] = 0;
      }
    }
    run.push({ front: rel.front, back: rel.back });
  }
  return run.slice(2 * SAMPLES);
})();

function lookup(v) {
  const period = 2 * STROKE;
  const x = ((((v % period) + period) % period) / period) * SAMPLES;
  const i = Math.min(SAMPLES - 1, Math.floor(x));
  const t = x - i;
  const [a, b] = [TABLE[i], TABLE[i + 1]];
  return { shaft: shaftAt(v), front: a.front + (b.front - a.front) * t, back: a.back + (b.back - a.back) * t };
}

/** 主動量 v(累計行程):框架位置、前後小齒輪轉角、軸(與棘輪)的轉角、兩棘爪相對小齒輪的轉角 */
export function motion(v) {
  const { x, front, back } = racks(v);
  const { shaft, front: pf, back: pb } = lookup(v);
  return { x, front, back, shaft, pawls: { front: pf, back: pb } };
}
export const stroke = STROKE;
/** 爪尖到棘輪面的距離(負的就是穿進去),測試檢查接觸用 */
export function pawlGap(v, which) {
  const m = motion(v);
  return tipGap(m[which], m[which] + m.pawls[which], m.shaft + PHASE[which]);
}

const W = 2.1;
const ROD = { length: 3.4, inner: W + R + 0.42 }; // 兩端的桿,內端伸進框架 0.2
const GUIDE_X = 5.05; // 導套:框架外緣走到端點也碰不到它,桿在行程兩端都還穿著它
const FLOOR = -1.9;
const loop = (h) => [...arcPoints(h, -Math.PI / 2, Math.PI / 2, W, 0), ...arcPoints(h, Math.PI / 2, (3 * Math.PI) / 2, -W, 0)];
const pawlPart = (id) => ({
  id,
  kind: "plate",
  shape: shape([[-0.04, 0.04], [PAWL.length, 0.0], [-0.04, -0.04]]),
  thickness: 0.06,
  arrow: false,
});

export default {
  figure: 116,
  parts: [
    // 小齒輪做成環形(中間挖空),看得到裡面固定在軸上的棘輪與棘爪
    { id: "front", kind: "gear", center: FRONT.center, teeth: 12, radius: R, width: 0.16, bore: 0.55, hub: false },
    { id: "back", kind: "gear", center: BACK.center, teeth: 12, radius: R, width: 0.16, bore: 0.55, hub: false },
    {
      id: "shaft",
      kind: "group",
      spin: 0.36,
      spinOffset: 0.6,
      pieces: [
        { kind: "plate", shape: ratchetShape({ ...RATCHET, bore: 0.08 }), thickness: 0.1, at: [0, 0, 0.36], angle: PHASE.front },
        { kind: "plate", shape: ratchetShape({ ...RATCHET, bore: 0.08 }), thickness: 0.1, at: [0, 0, -0.36], angle: PHASE.back },
        { kind: "cylinder", radius: 0.1, length: 2.0, mark: true },
      ],
    },
    { ...pawlPart("pawlFront") },
    { ...pawlPart("pawlBack") },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(loop(R + 0.62), [loop(R + 0.42).reverse()]), thickness: 0.6 },
        { kind: "rack", teeth: 13, pitch: PITCH, depth: 0.22, width: 0.16, at: [0, R, 0.22], angle: Math.PI },
        { kind: "rack", teeth: 13, pitch: PITCH, depth: 0.22, width: 0.16, at: [0, -R, -0.22] },
        { kind: "plate", shape: stadium(ROD.length, 0.3), thickness: 0.3, at: [-ROD.inner - ROD.length, 0, 0] },
        { kind: "plate", shape: stadium(ROD.length, 0.3), thickness: 0.3, at: [ROD.inner, 0, 0] },
      ],
    },
    {
      id: "support",
      kind: "group",
      pieces: [
        ...pedestal({ at: [0, 0], z: 0.7, bore: 0.1, floor: FLOOR }),
        ...pedestal({ at: [0, 0], z: -0.7, bore: 0.1, floor: FLOOR }),
        ...[-1, 1].flatMap((side) => [
          ...squareGuide({ at: [side * GUIDE_X, 0, 0], width: 0.34, thickness: 0.34 }),
          { kind: "box", size: [0.2, -0.23 - FLOOR, 0.2], at: [side * GUIDE_X, (-0.23 + FLOOR) / 2, 0] },
          { kind: "box", size: [0.8, 0.18, 0.6], at: [side * GUIDE_X, FLOOR - 0.09, 0] },
        ]),
      ],
    },
  ],
  driver: { part: "frame", type: "translation", direction: [1, 0, 0], cycle: [-STROKE / 2, STROKE / 2] },
  target: "shaft", // 單向均勻旋轉的小齒輪軸
  // 動力重演:只推框架;軸靠摩擦定位,兩支棘爪鉸在各自的小齒輪上、被彈簧壓向棘輪
  replay: {
    free: {
      shaft: { hold: true },
      pawlFront: { pivot: [...pivotOf(racks(0).front), 0.34], on: "front", spring: -1, gravity: false },
      pawlBack: { pivot: [...pivotOf(racks(0).back), -0.34], on: "back", spring: -1, gravity: false },
    },
    to: 4 * STROKE,
    seconds: 20,
    expect: [
      { at: STROKE, part: "shaft", label: "框架往右,前小齒輪經棘爪帶軸轉半圈", quote: "當齒條朝某一方向運動時,其中一個小齒輪透過其棘爪與棘輪帶動軸轉動" },
      { at: 2 * STROKE, part: "shaft", label: "框架往左,換後小齒輪帶軸再轉半圈(前小齒輪空轉)", quote: "當齒條朝相反方向運動時,另一個小齒輪則以同樣方式作動" },
      { part: "shaft", label: "第二個來回,軸照樣單向轉" },
    ],
  },
  view: { direction: [0.06, 0.05, 1], fit: ["frame"] },
  waivers: [
    {
      check: "replay",
      parts: ["shaft"],
      reason:
        "棘爪很小(長 0.28、塞在小齒輪的環裡),重演的彈簧力是全書一致的預設值(零件重量的 3 倍、力臂 1 單位),對這麼小的零件等於極大的角加速度," +
        "棘爪在齒間亂轉(轉了好幾圈),軸推不動;改用重力也不行(棘爪跟著小齒輪轉一圈,重力的方向一直變)。原書沒有彈簧力的資料。" +
        "接觸由測試檢查:帶動的那支爪整程貼著直面、兩支爪都不穿進棘輪",
    },
  ],
  pose(v) {
    const { x, front, back, shaft, pawls } = motion(v);
    const pf = { pivot: pivotOf(front), angle: front + pawls.front };
    const pb = { pivot: pivotOf(back), angle: back + pawls.back };
    return {
      parts: {
        frame: { position: [x, 0, 0] },
        front: { angle: front },
        back: { angle: back },
        shaft: { angle: shaft },
        pawlFront: { position: [pf.pivot[0], pf.pivot[1], 0.34], angle: pf.angle }, // 貼著小齒輪的外側面
        pawlBack: { position: [pb.pivot[0], pb.pivot[1], -0.34], angle: pb.angle },
      },
      readouts: [],
    };
  },
};
