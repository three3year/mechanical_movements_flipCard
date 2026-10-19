// 第 398 種:把連續的圓周運動變成間歇的圓周運動——凸輪 C 是主動件。
// 照 525 px 原圖與 507movements 的動畫重讀(2026-10-14 決定 (a)):凸輪 C 是一個圓盤,盤面上開了一道三瓣形的溝槽;
// 溝裡的銷裝在滑塊的桿端,滑塊夾在上下兩條導軌之間左右滑(兩端各一塊、中間是凹腰的軸身);滑塊右端的銷接一根長連桿,
// 連桿的另一端接在右邊大輪軸上的曲柄。凸輪等速轉,滑塊照溝槽往復,經連桿帶著曲柄與大輪轉——溝槽每一瓣讓滑塊往復一次、
// 大輪轉一圈;溝槽上有同心的一段時,滑塊停住,大輪也停住(間歇)。主動件是凸輪 C,目標件是大輪。
//
// 溝槽的形狀由「大輪要怎麼轉」反算:先給曲柄的轉角(轉、停、轉、停),由滑塊曲柄的幾何算出滑塊該在哪裡,
// 銷在凸輪上走過的曲線就是溝槽的中心線。所以銷的位置、連桿的長度、曲柄的轉角三者精確地一致。
// - 停在哪裡(推斷):每轉半圈停一次,停在剛過死點 DELTA 的地方。停在死點上的話,滑塊再動時曲柄往哪邊轉都可以
//   (停住的飛輪沒有慣性可以帶);停在死點之後,滑塊一動,曲柄只能順著原方向轉。經過死點時大輪還在轉,靠大輪
//   (飛輪)的慣性帶過去——死點的兩側溝槽都是平緩的(滑塊在行程端點附近幾乎不動)。
// - 大輪的轉向(推斷):溝槽只決定滑塊,不決定曲柄往哪邊轉;取順時針(和凸輪同向)。507movements 的動畫只有兩張
//   靜止的畫面,看不出方向。
// - 比例(偏離插圖):原圖的曲柄比溝槽的行程的一半長,照原圖的比例曲柄轉不了整圈(507 的動畫也是:曲柄半徑 1.55、
//   滑塊行程 1.91,大輪只能來回擺)。照原文「間歇性圓周運動」,曲柄半徑取行程的一半;溝槽的三瓣比原圖淺一些,
//   讓溝的轉彎處不比銷還尖(溝中心線的轉彎半徑至少 0.125,溝的半寬 0.07),壓力角(溝壁的法線和滑塊行進方向的夾角)
//   最大約 57°。凸輪盤、大輪的大小與兩者的距離照原圖。
// - 補上的機架(原圖沒畫,推斷):一塊底座、凸輪軸與大輪軸的軸承座、導架(兩條導軌固定在背板上,背板下面一根立柱)。
// - 動力重演:只推凸輪,滑塊是沿導軌的自由滑塊,只被溝的兩壁推(連桿與大輪照模型走)。
import { TAU, X } from "./kit.js";
import { shape, circle, offsetLoop, arcPoints, spanBox, zCylinder } from "./shapes.js";
import { pedestal } from "./supports.js";

const CAM = { center: [-2.6, 0, 0], radius: 1.42 };
const CRANK = 0.25; // 曲柄半徑 = 滑塊行程的一半
const ROD = 2.33; // 連桿長(滑塊的銷到曲柄銷)
const R_MIN = 0.8; // 溝槽中心線離凸輪軸心最近的距離(滑塊在最左)
const EYE = 2.0; // 滑塊上,溝裡的銷到右端的銷
const WHEEL = { center: [CAM.center[0] + R_MIN + EYE + CRANK + ROD, 0, 0], r: 1.54 };
const PIN = 0.06; // 溝裡的銷的半徑
const HALF = PIN + 0.01; // 溝的半寬

// 曲柄轉一圈(凸輪轉 1/3 圈)的時程:停 DWELL、轉半圈、停 DWELL、轉半圈;轉的那一段先加速 A1、末段減速 A2
const DWELL = 0.1;
const A1 = 0.3;
const A2 = 0.5;
const DELTA = 0.3; // 停在剛過死點多少(弧度,約 17°)
const START = Math.PI - DELTA; // 起始:曲柄在左上方、剛過左死點,停著(原圖的曲柄也在左上方)

// 轉的那一段:進度 f(0–1)→ 轉過的比例;速度是升餘弦的加速、等速、升餘弦的減速
const TOTAL = 1 - (A1 + A2) / 2;
function ease(f) {
  if (f <= A1) return (f / 2 - (A1 / (2 * Math.PI)) * Math.sin((Math.PI * f) / A1)) / TOTAL;
  if (f <= 1 - A2) return (A1 / 2 + f - A1) / TOTAL;
  const g = 1 - f;
  return 1 - (g / 2 - (A2 / (2 * Math.PI)) * Math.sin((Math.PI * g) / A2)) / TOTAL;
}

const LOBE = TAU / 3; // 溝槽的一瓣:凸輪轉 1/3 圈
/** 凸輪往順時針轉過 v → 曲柄(大輪)的轉角(順時針為負,一路累計) */
export function crankAngle(v) {
  const k = Math.floor(v / LOBE);
  const u = v / LOBE - k;
  const move = 0.5 - DWELL;
  let a;
  if (u < DWELL) a = 0;
  else if (u < 0.5) a = Math.PI * ease((u - DWELL) / move);
  else if (u < 0.5 + DWELL) a = Math.PI;
  else a = Math.PI + Math.PI * ease((u - 0.5 - DWELL) / move);
  return START - (k * TAU + a);
}

// 滑塊右端的銷離大輪軸心多遠(往左為負):滑塊曲柄的幾何
const eyeX = (psi) => CRANK * Math.cos(psi) - Math.sqrt(ROD * ROD - (CRANK * Math.sin(psi)) ** 2);
/** 凸輪往順時針轉過 v → 溝裡的銷離凸輪軸心的距離(溝槽中心線的極座標半徑) */
export const pitchRadius = (v) => R_MIN + eyeX(crankAngle(v)) - eyeX(Math.PI);
/** 凸輪轉 theta(主動件往負方向轉)→ 滑塊的位移(溝裡的銷的 x) */
export const sliderX = (theta) => CAM.center[0] + pitchRadius(-theta);

// 溝槽中心線(凸輪的局部座標,逆時針):凸輪轉 θ 時銷在世界角 0,也就是凸輪局部角 −θ
const N = 720;
const PITCH = Array.from({ length: N }, (_, i) => {
  const a = (i / N) * TAU;
  const r = pitchRadius(a);
  return [r * Math.cos(a), r * Math.sin(a)];
});

// 深度(z):凸輪盤底 −0.14..0,溝的那一層 0..0.12;滑塊的桿在凸輪前面,連桿再往前,曲柄臂在連桿後面
const Z = { slider: 0.24, block: [0.06, 0.42], arm: [0.34, 0.42], link: 0.5 };
const FLOOR = -1.9;
const GUIDE = { x0: -1.0, x1: 0.9, gap: 0.36, rail: 0.14, back: [-0.22, -0.1] }; // 導架:導軌的內側離中線 gap

// 滑塊的局部座標:原點在溝裡的銷的軸線上(z 是世界深度)
const BLOCK_W = 0.22;
const LEFT = 0.85; // 左端塊的左面
const RIGHT = 1.9; // 右端塊的右面
// 凹腰的軸身(繞 x 的旋轉體):兩端半徑 0.3,中間收到 0.16
const SPOOL_HALF = (RIGHT - LEFT) / 2 - BLOCK_W;
const spoolProfile = [[0, -SPOOL_HALF], ...Array.from({ length: 17 }, (_, i) => {
  const z = -SPOOL_HALF + (2 * SPOOL_HALF * i) / 16;
  return [0.16 + 0.14 * (z / SPOOL_HALF) ** 2, z];
}), [0, SPOOL_HALF]];

// 曲柄臂(大輪的局部座標):轂端圓、銷端圓,兩圓的外公切線圍成的外形
function crankArm(r0, r1, len) {
  const s = Math.asin((r0 - r1) / len);
  return [...arcPoints(r1, -Math.PI / 2 + s, Math.PI / 2 - s, len, 0), ...arcPoints(r0, Math.PI / 2 - s, (3 * Math.PI) / 2 + s)];
}

export default {
  figure: 398,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        spanBox(CAM.center[0] - 0.9, WHEEL.center[0] + 0.9, FLOOR - 0.18, FLOOR, -0.75, 0.25), // 底座
        ...pedestal({ at: [CAM.center[0], 0], z: -0.45, bore: 0.12, floor: FLOOR }),
        ...pedestal({ at: [WHEEL.center[0], 0], z: -0.45, bore: 0.1, floor: FLOOR }),
        // 導架:上下兩條導軌固定在背板前面,背板下面一根立柱站在底座上
        { ...spanBox(GUIDE.x0, GUIDE.x1, GUIDE.gap, GUIDE.gap + GUIDE.rail, GUIDE.back[1], Z.block[1]), role: "rail" },
        { ...spanBox(GUIDE.x0, GUIDE.x1, -GUIDE.gap - GUIDE.rail, -GUIDE.gap, GUIDE.back[1], Z.block[1]), role: "rail" },
        spanBox(GUIDE.x0, GUIDE.x1, -GUIDE.gap - GUIDE.rail, GUIDE.gap + GUIDE.rail, GUIDE.back[0], GUIDE.back[1]),
        spanBox((GUIDE.x0 + GUIDE.x1) / 2 - 0.15, (GUIDE.x0 + GUIDE.x1) / 2 + 0.15, FLOOR, -GUIDE.gap - GUIDE.rail, GUIDE.back[0], GUIDE.back[1]),
      ],
    },
    {
      id: "cam",
      kind: "group",
      center: CAM.center,
      spin: CAM.radius,
      label: "C",
      labelOffset: [-0.95, 0.35, 0.3],
      pieces: [
        { kind: "plate", shape: shape(circle(CAM.radius)), thickness: 0.14, at: [0, 0, -0.07] }, // 盤底(溝底)
        { kind: "plate", shape: shape(circle(CAM.radius), [offsetLoop(PITCH, HALF).reverse()]), thickness: 0.12, at: [0, 0, 0.06] }, // 溝的外圈
        { kind: "plate", shape: shape(offsetLoop(PITCH, -HALF)), thickness: 0.12, at: [0, 0, 0.06] }, // 溝的內島
        { kind: "cylinder", radius: 0.2, length: 0.04, at: [0, 0, 0.14] }, // 盤面中心的軸端(原圖的圓)
        { kind: "cylinder", radius: 0.12, length: 0.62, at: [0, 0, -0.31], role: "shaft" }, // 軸:往後伸進軸承座
      ],
    },
    {
      id: "slider",
      kind: "group",
      arrow: false,
      pieces: [
        { ...zCylinder(0.02, Z.slider + 0.05, PIN), role: "groovePin", accent: true }, // 伸進溝裡的銷
        zCylinder(Z.slider - 0.05, Z.slider + 0.05, 0.1), // 桿端
        spanBox(0, LEFT, -0.05, 0.05, Z.slider - 0.05, Z.slider + 0.05), // 桿
        { ...spanBox(LEFT, LEFT + BLOCK_W, -GUIDE.gap, GUIDE.gap, Z.block[0], Z.block[1]), role: "block" },
        { kind: "lathe", axis: X, profile: spoolProfile, at: [(LEFT + RIGHT) / 2, 0, Z.slider] }, // 凹腰的軸身
        { ...spanBox(RIGHT - BLOCK_W, RIGHT, -GUIDE.gap, GUIDE.gap, Z.block[0], Z.block[1]), role: "block" },
        zCylinder(Z.block[0], Z.block[1], 0.13, [EYE, 0]), // 右端的銷座
        { ...zCylinder(Z.block[1] - 0.12, Z.link + 0.08, 0.045, [EYE, 0]), role: "eyePin" }, // 往前穿過連桿
      ],
    },
    { id: "link", kind: "link", width: 0.12, thickness: 0.08, pins: false },
    {
      id: "wheel",
      kind: "group",
      center: WHEEL.center,
      spin: WHEEL.r,
      pieces: [
        { kind: "plate", shape: shape(circle(WHEEL.r)), thickness: 0.18 },
        zCylinder(0.09, 0.12, 0.09, [-0.76, 0]), // 原圖輪面上的一點(在曲柄的對面):看得出大輪轉、停
        { kind: "cylinder", radius: 0.1, length: 0.65, at: [0, 0, -0.325], role: "shaft" }, // 軸:往後伸進軸承座
        zCylinder(0.09, Z.arm[0], 0.16), // 轂
        { kind: "plate", shape: shape(crankArm(0.17, 0.09, CRANK)), thickness: Z.arm[1] - Z.arm[0], at: [0, 0, (Z.arm[0] + Z.arm[1]) / 2], accent: true }, // 曲柄臂
        { ...zCylinder(Z.arm[0], Z.link + 0.08, 0.045, [CRANK, 0]), role: "crankPin", accent: true }, // 曲柄銷:往前穿過連桿
      ],
    },
  ],
  // 動力重演:只推凸輪;滑塊沿導軌自由滑動,只被溝的兩壁推
  replay: {
    to: -LOBE,
    seconds: 16,
    free: { slider: { slide: [1, 0, 0], gravity: false } },
    ignore: [["slider", "link"], ["slider", "frame"]],
    expect: [
      { at: -LOBE * 0.08, part: "slider", label: "溝的同心段:滑塊停著", quote: "將連續圓周運動轉換為間歇性圓周運動" },
      { at: -LOBE * 0.3, part: "slider", label: "溝把銷往外推,滑塊往右(大輪轉過上方)" },
      { at: -LOBE * 0.55, part: "slider", label: "滑塊到右端附近停住" },
      { at: -LOBE * 0.8, part: "slider", label: "溝把銷往內拉,滑塊往左" },
      { part: "slider", label: "凸輪轉 1/3 圈,滑塊回到起點" },
    ],
  },
  driver: { part: "cam", type: "rotation", speed: -0.8 },
  target: "wheel",
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const psi = crankAngle(-theta);
    const x = sliderX(theta);
    const eye = [x + EYE, 0, Z.link];
    const crank = [WHEEL.center[0] + CRANK * Math.cos(psi), CRANK * Math.sin(psi), Z.link];
    return {
      parts: {
        cam: { angle: theta },
        slider: { position: [x, 0, 0] },
        link: { from: eye, to: crank },
        wheel: { angle: psi },
      },
      readouts: [],
    };
  },
};
