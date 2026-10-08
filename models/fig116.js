// 第 116 種:曲柄的替代裝置。雙齒條框架往復直線運動,使小齒輪軸均勻地(單向)旋轉。
// 兩個齒條各配一個小齒輪,位於不同的平面上(前、後),都鬆套在軸上;每個小齒輪外側的軸上固定一個棘輪,
// 小齒輪上的棘爪與它嚙合。框架往右時上齒條使前小齒輪順時針轉,經棘爪帶軸;往左時換後小齒輪順時針轉、帶軸。
// 總有一個小齒輪在軸上空轉。原文說兩棘輪的齒方向相反——相對於它們各自的小齒輪(兩小齒輪在同一程中反向轉),
// 這裡兩個棘輪都讓軸朝順時針方向轉。主動量是框架的累計行程。
//
// 接觸:棘爪鉸在小齒輪上,被彈簧壓向棘輪。小齒輪順時針轉時,爪尖頂住棘輪的直面,小齒輪與軸鎖在一起轉;
// 逆時針空轉時,爪尖沿齒背滑上去、過了齒尖再被彈簧加速壓回下一格(爪的轉角逐步由接觸算)。
// 棘爪的樣子(2026-10-08 複查:原本的爪又短又貼著齒尖,爪尖只進齒 0.05,看不出哪一支鎖住、哪一支在滑):
// 爪鉸在小齒輪環面上(樞軸在半徑 0.60,爪身是繞著棘輪的一段弧、留在齒尖外面),前端一個鼻子伸進齒間直到齒根;
// 樞軸放在鼻子逆時針側約 85°,爪抬起時鼻尖往逆時針方向退、離開直面,落下時正好落到齒根(不會卡在齒尖上)。
// 空轉時鼻尖從齒根爬到齒尖再落回,爪擺約 12°,鎖住時爪跟著棘輪一起轉——兩支爪每一程輪流,一眼看得出。
// 行程取「小齒輪每程轉半圈」(棘輪 10 齒的整數倍):空轉的那一程,小齒輪相對軸正好退回一整圈,
// 下一程一開始爪尖就落在直面腳下,沒有空行程——軸因此不停頓地均勻旋轉(原文:「使小齒輪軸產生均勻的旋轉運動」)。
// 兩個棘輪的齒各轉一個相位,讓爪尖在換程時正好落在直面腳下。
// 框架兩端的桿穿在固定的導套裡,軸的兩端架在軸承座上(導套、軸承座是推斷)。
import { deg, swingPhase, polar, rot2, TAU } from "./kit.js";
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
// 棘爪:樞軸在小齒輪轉角 0 時的位置 polar(at, pivotAngle);鎖住時鼻尖落在齒根、棘輪局部角 tipAngle 處
const PAWL = { at: 0.6, pivotAngle: deg(125), tipAngle: deg(40) };
const TIP0 = polar(RATCHET.inner, PAWL.tipAngle);
const PIVOT0 = polar(PAWL.at, PAWL.pivotAngle);
PAWL.length = Math.hypot(TIP0[0] - PIVOT0[0], TIP0[1] - PIVOT0[1]);
const AXIS = Math.atan2(TIP0[1] - PIVOT0[1], TIP0[0] - PIVOT0[0]); // 鎖住時爪(樞軸→鼻尖)的方向,相對於小齒輪
const DRIVE = -1; // 小齒輪順時針轉的那一程,棘爪推動軸

/** 主動量 v(累計行程):框架位置、前後小齒輪轉角 */
function racks(v) {
  const { at } = swingPhase(v, -STROKE / 2, STROKE / 2);
  return { x: at, front: pinionAngle(FRONT, TOP, at), back: pinionAngle(BACK, BOTTOM, at) };
}

const pivotOf = (pinion) => polar(PAWL.at, pinion + PAWL.pivotAngle);
const tipGap = (pinion, psi, wheelAngle) => {
  const pivot = pivotOf(pinion);
  const [x, y] = [pivot[0] + PAWL.length * Math.cos(psi), pivot[1] + PAWL.length * Math.sin(psi)];
  return Math.hypot(x, y) - ratchetRadius(RATCHET, Math.atan2(y, x) - wheelAngle);
};
// 棘爪被彈簧往棘輪壓(順時針):從抬到輪外的位置往內擺,停在鼻尖碰到輪面的轉角(相對於小齒輪)
const RAISED = AXIS + deg(45); // 抬到這裡鼻尖在輪外
const rest = (pinion, wheelAngle) =>
  pawlRest({ pivot: pivotOf(pinion), length: PAWL.length, from: pinion + RAISED, into: -1, sweep: 1.6 }, { center: [0, 0], angle: wheelAngle, ...RATCHET }).angle - pinion;

// 棘輪的相位:推程開始時,爪尖靠在齒根、正好貼著直面的腳(局部 0.982 個齒距;0.98 是直面的腳)。
// 之後整個推程爪尖都頂著直面,小齒輪與軸鎖在一起轉;空轉的那一程小齒輪相對軸退回一整圈(10 齒),
// 下一程開始時爪尖又正好落在直面腳下。
const shaftAt = (v) => -v / R; // 每一程帶動的小齒輪轉半圈,軸跟著轉半圈
function phaseFor(pinion, shaft) {
  // 爪尖落到齒根(半徑 inner)時的位置
  const pivot = pivotOf(pinion);
  let [lo, hi] = [pinion + AXIS - 0.8, pinion + AXIS + 0.8]; // 鼻尖的半徑隨爪的轉角單調增加
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

// 兩支棘爪逐步模擬:每一步算出彈簧能把爪壓到的位置(從輪外往內擺到碰上輪面),被齒背頂起時跟著;
// 離開齒尖後是加速壓回
const SAMPLES = 800; // 一個來回(主動量 2·STROKE)的取樣數
const FALL = 0.002; // 爪懸空時每一步增加的角速度
const TABLE = (() => {
  const rel = { front: RAISED, back: RAISED }; // 爪相對小齒輪的轉角(樞軸→鼻尖的方向);從抬起的位置開始
  const speed = { front: 0, back: 0 };
  const run = [];
  for (let i = 0; i <= 3 * SAMPLES; i++) {
    const v = (2 * STROKE * i) / SAMPLES;
    const now = racks(v);
    for (const p of ["front", "back"]) {
      const target = rest(now[p], shaftAt(v) + PHASE[p]);
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
// 棘爪的外形(爪的局部座標:原點在樞軸,x 軸指向鎖住時的鼻尖):爪身是繞棘輪中心、留在齒尖外的一段弧,
// 前端的鼻子伸進齒間到鼻尖;樞軸處一個圓凸台(貼著小齒輪的環面)
const PAWL_SHAPE = (() => {
  const O = rot2([-PIVOT0[0], -PIVOT0[1]], -AXIS); // 棘輪中心
  const ang = ([x, y]) => Math.atan2(y - O[1], x - O[0]);
  const tip = ang([PAWL.length, 0]);
  const piv = ang([0, 0]);
  return shape([
    [PAWL.length, 0], // 鼻尖(齒根)
    ...arcPoints(0.46, tip - deg(3), tip - deg(3), O[0], O[1]), // 鼻子的直面側,斜度與齒的直面相近
    ...arcPoints(0.64, tip - deg(3), piv + deg(9), O[0], O[1]), // 爪身外緣
    ...arcPoints(0.45, piv + deg(9), tip + deg(7), O[0], O[1]), // 爪身內緣(在齒尖 0.42 外)
  ]);
})();
const pawlPart = (id) => ({
  id,
  kind: "plate",
  shape: PAWL_SHAPE,
  thickness: 0.06,
  arrow: false,
  pieces: [{ kind: "cylinder", radius: 0.09, length: 0.08 }], // 樞軸凸台
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
  view: { direction: [0.35, 0.25, 1], fit: ["frame"] }, // 稍微斜看:前後兩組棘輪與棘爪錯開,看得出每一程換哪一支爪在推
  waivers: [
    {
      check: "replay",
      parts: ["shaft"],
      reason:
        "棘爪很小(長 0.6、塞在小齒輪的環裡),重演的彈簧力是全書一致的預設值(零件重量的 3 倍、力臂 1 單位),對這麼小的零件等於極大的角加速度," +
        "棘爪在齒間亂轉,軸推不動;改用重力也不行(棘爪跟著小齒輪轉一圈,重力的方向一直變)。原書沒有彈簧力的資料。" +
        "接觸由測試檢查:帶動的那支爪整程頂在齒根、兩支爪都不穿進棘輪",
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
