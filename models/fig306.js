// 第 306 種:三腳式擺式擒縱。擒縱叉瓦是裝在擺上的一塊板的開口邊緣;擺帶著板左右移動(原圖箭頭),
// 擒縱輪的三個腳交替地作用在開口上方與下方的叉瓦上。圖中是一個腳正作用於上方叉瓦的狀態。
// 擺每擺一次,三腳輪轉過六分之一圈(上、下叉瓦各放走半個腳距)。
// 主動件是板(擺);目標件是三腳輪(擒縱讓它一格一格地放行)。
//
// 由接觸算(models/escapement.js 的 escapeByContact):三腳輪受重錘的固定力矩順時針轉(照 525 px 原圖:腳尖的鉤朝順時針,
// 上方的腳尖從左邊頂著上方台階朝左的面),腳尖碰上開口的台階就停。
// 開口照原圖左上、右下鼓出(S 形):上緣左半高、右半低,台階(上方叉瓦)擋住在上面往右走的腳;
// 下緣左半高、右半低,台階(下方叉瓦)擋住在下面往左走的腳。板往右移時上方叉瓦的台階退到腳尖圓外面,腳滑過去,
// 輪轉六分之一圈碰上下方叉瓦;往左移時反過來。台階的面是直的,板移過來時會把腳推回一點(回退)。
// 推斷:板的行程;開口的尺寸照三腳輪的大小推算(原圖的開口形狀相同、比例不同:原圖台階較淺、行程較大);
// 開口左上、右下鼓出的外緣做成四分之一橢圓(照原圖的圓弧),離腳尖圓留著空隙;板裝在擺上的兩根直條(原圖兩端撕斷)。
// 推斷的機架(原圖沒畫):三腳輪的軸往後伸進軸承,軸承裝在立柱頂上,立柱站在底座上。
// 推斷的驅動(原文沒說輪為什麼往前轉;共用 weight-drive.js,和第 304 種一樣):輪軸上、板與軸承之間有一個鼓,
// 繩從鼓的右側垂下吊著重錘;重錘的重量就是讓三腳輪順時針轉的固定力矩,輪被台階擋住時重錘也停。
// 擺兩個來回(輪轉三分之二圈)重錘捲回最高處一次(上鍊)。實物也可能用發條;重錘只是示意。
import { TAU, swing, Y, Z } from "./kit.js";
import { escapeByContact } from "./escapement.js";
import { shape, rect, circle } from "./shapes.js";
import { weightDrive, rewound } from "./weight-drive.js";

export const STEP = TAU / 6;
export const TRAVEL = 0.32; // 板的單邊行程
const LEG = 0.72;
// 開口的尺寸(由腳的長度 L 與行程推算):台階高 yu,台階面在腳尖圓與這一高度交點外側一點
const L = LEG + 0.06;
const YU = 0.6 * L;
const C = Math.sqrt(L * L - YU * YU);
const XS = C - TRAVEL + 0.06; // 上方叉瓦的台階面在輪心右邊 XS、下方叉瓦在左邊 XS(板居中時)
const X = C + TRAVEL + 0.35;
const YT = L + 0.15; // 開口最高處(左上鼓出的頂)
const PX = 2.2;
const PY = 1.15;
// 四分之一橢圓:從 from 起、以 center 為圓心,n 段
const quarter = (center, [rx, ry], [a0, a1], n = 16) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [center[0] + rx * Math.cos(a), center[1] + ry * Math.sin(a)];
  });
const DOME = [X + XS, YT - YU];
const upperDome = quarter([XS, YU], DOME, [Math.PI / 2, Math.PI]); // 左上鼓出:從上方台階頂往左下到開口左端
const lowerDome = quarter([-XS, -YU], DOME, [-Math.PI / 2, 0]); // 右下鼓出:從下方台階底往右上到開口右端
// 開口(逆時針):右下鼓出 → 右端 → 上緣右半(低)→ 上方台階 → 左上鼓出 → 左端 → 下緣左半(高)→ 下方台階
const OPENING = [...lowerDome, [X, YU], [XS, YU], ...upperDome, [-X, -YU], [-XS, -YU]];
// 板的實體(檢查接觸用):以輪心的高度切成上、下兩塊(點對稱)
const UPPER = [[X, 0], [PX, 0], [PX, PY], [-PX, PY], [-PX, 0], [-X, 0], ...upperDome.slice().reverse(), [XS, YU], [X, YU]];
const LOWER = UPPER.map(([x, y]) => [-x, -y]);

// 三腳輪:三根腳,末端微彎成鉤(鉤朝順時針)
const legs = [0, 1, 2].map((i) => {
  const a = (i * TAU) / 3;
  const pts = [[0.06, -0.07], [LEG - 0.08, -0.06], [LEG + 0.05, -0.12], [LEG, 0.05], [0.06, 0.07]];
  return pts.map(([x, y]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]);
});

/** 板的累計行程 v → 板的位移(v = 0 在左端,先往右:原圖箭頭) */
export const plateShift = (v) => swing(v, -TRAVEL, TRAVEL);
export const escapement = {
  ...escapeByContact({ center: [0, 0], teeth: legs, dir: -1, period: 4 * TRAVEL, pitch: TAU / 3, stops: (v) => [UPPER, LOWER].map((p) => p.map(([x, y]) => [x + plateShift(v), y])) }),
  period: 4 * TRAVEL,
};

/** 板的累計行程 v → 板的位移、三腳輪轉角(順時針為負,由接觸算) */
export function threeLeg(v) {
  return { plate: plateShift(v), wheel: escapement.angle(v) };
}

// ── 推斷的機架與重錘驅動 ──
const BEARING_Z = -0.62;
const FLOOR = -2.5; // 底座頂面
const ROPE_R = 0.03;
const DRUM_R = 0.12;
const DRUM = { center: [0, 0, -0.36], axis: Z, radius: DRUM_R + ROPE_R, sense: -1 }; // 輪往前(順時針,繞 −z)轉時繩從鼓上放出
const REWIND = 2 * 4 * TRAVEL; // 擺兩個來回(輪轉三分之二圈)上鍊一次
const WEIGHT = { radius: 0.13, height: 0.36 };
const hang = weightDrive({
  drum: DRUM,
  eye: [DRUM.radius, -PY - 0.1, DRUM.center[2]],
  reserve: DRUM.radius * 2 * STEP * 2,
  spare: TAU * DRUM.radius,
  pitch: 2.1 * ROPE_R,
});
const weightAt = rewound(hang, (v) => -escapement.angle(v), REWIND); // 輪往前(順時針)轉的角度
/** 量測與檢查用 */
export const geometry = { DRUM, REWIND, FLOOR };

export default {
  figure: 306,
  parts: [
    {
      id: "plate",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(rect(2 * PX, 2 * PY), [OPENING.slice().reverse()]), thickness: 0.12 },
        // 四顆螺絲把板固定在擺的兩根直條上
        ...[[-1.95, 0.8], [1.95, 0.8], [-1.95, -0.8], [1.95, -0.8]].map(([x, y]) => ({ kind: "cylinder", radius: 0.08, length: 0.2, at: [x, y, 0] })),
        // 板兩端接到擺上的直條(在板的後面,原圖以虛線畫出、上下兩端撕斷)
        { kind: "box", size: [0.4, 3.6, 0.1], at: [-1.95, 0, -0.1] },
        { kind: "box", size: [0.4, 3.6, 0.1], at: [1.95, 0, -0.1] },
      ],
    },
    {
      id: "wheel",
      kind: "group",
      spin: LEG,
      pieces: [
        ...legs.map((l, i) => ({ kind: "plate", shape: shape(l), thickness: 0.14, accent: i === 0 })),
        { kind: "plate", shape: shape(circle(0.16), [circle(0.06).reverse()]), thickness: 0.18 },
        { kind: "cylinder", radius: 0.06, length: 0.7, at: [0, 0, -0.38] }, // 輪軸,往後伸進軸承
        { kind: "cylinder", radius: DRUM_R, length: 0.2, at: [0, 0, DRUM.center[2]] }, // 繞繩的鼓(推斷)
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 三腳輪的軸承,裝在立柱頂上;立柱站在底座上(推斷,原圖沒畫)
        { kind: "cylinder", radius: 0.13, inner: 0.06, length: 0.12, at: [0, 0, BEARING_Z] },
        { kind: "box", size: [0.22, -FLOOR, 0.1], at: [0, FLOOR / 2, BEARING_Z] },
        { kind: "box", size: [2.6, 0.16, 0.9], at: [0, FLOOR - 0.08, BEARING_Z + 0.2] },
      ],
    },
    { id: "rope", kind: "rope", radius: ROPE_R },
    { id: "weight", kind: "weight", axis: Y, radius: WEIGHT.radius, height: WEIGHT.height },
  ],
  // 動力重演:只推板;三腳輪受固定的力矩(重錘)順時針轉(以彈簧代替;重錘照模型的姿勢走),由開口的上、下台階輪流擋住、放行
  replay: {
    to: 8 * TRAVEL,
    free: { wheel: { pivot: [0, 0, 0], spring: -1, gravity: false } },
    ignore: [["wheel", "frame"]], // 輪軸插在軸承裡(孔沒畫出來)
    expect: [
      { at: 2 * TRAVEL, part: "wheel", label: "板移過一次,三腳輪轉六分之一圈", quote: "擒縱輪的三個齒交替地作用於上方與下方的擒縱叉瓦上" },
      { at: 4 * TRAVEL, part: "wheel", label: "板一個來回,三腳輪轉三分之一圈" },
      { part: "wheel", label: "板兩個來回,三腳輪轉三分之二圈" },
    ],
  },
  driver: { part: "plate", type: "translation", direction: [1, 0, 0], cycle: [-TRAVEL, TRAVEL] },
  target: "wheel", // 三腳輪:擒縱讓它一格一格地放行
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const t = threeLeg(v);
    const w = weightAt(v);
    return {
      parts: {
        plate: { position: [t.plate, 0, 0] },
        wheel: { angle: t.wheel },
        weight: { position: [w.eye[0], w.eye[1] - WEIGHT.height / 2 - WEIGHT.radius * 0.38, w.eye[2]] },
      },
      paths: { rope: { points: w.rope, closed: false, phase: 0 } },
      readouts: [],
    };
  },
};
