// 第 305 種:單銷式擺式擒縱。擒縱輪是一個很小的圓盤,上面只有一根偏心的銷;擺(瓶形的板,下端兩個擺錘)
// 每擺一次,圓盤轉半圈,銷把衝量傳到叉瓦的垂直面上,叉瓦的水平面則是靜擊面(銷靠在上面時圓盤不動)。
// 主動件是擺(累計擺動);目標件是帶單銷的擒縱盤(擒縱讓它半圈半圈地放行)。
//
// 叉瓦照原圖是同一層的 Z 形一塊:瓶形板在圓盤前面,板上開一個 Z 形的窗——左上、右下各一個四分之一圓,
// 錯開相接(原圖圓盤的邊在窗裡是實線、窗外是虛線:圓盤在板的後面,從窗裡看得到)。銷從圓盤往前伸進窗裡,
// 窗緣就是叉瓦:盤心左下那塊實心的上緣(下靜擊面)與右緣(左垂直面),盤心右上那塊實心的下緣(上靜擊面)與左緣(右垂直面)。
//
// 由接觸算(models/escapement.js 的 escapeByContact):圓盤受重錘的固定力矩,照原圖箭頭順時針轉。
// 擺在右端時,銷在盤心右邊、壓在下靜擊面上(圓盤停住);擺往左擺,下靜擊面的角退到銷的左邊,銷往下轉,
// 推著左垂直面往左走——擺與銷同向走的這一段就是衝量,銷沿垂直面繞過下半圈;到了盤心左邊,往上頂在上靜擊面下(停住)。
// 擺往右擺時反過來:銷推著右垂直面繞過上半圈,落回下靜擊面上。每擺一次圓盤轉半圈。
// 兩道靜擊面做成以擺的樞軸為圓心的弧(近乎水平),鎖住時擺沿著它滑、圓盤不回退;垂直面是直的。
// 偏離插圖:原圖盤心畫在瓶軸左邊(約銷離盤心的距離那麼遠),是擺偏到一邊時的樣子;模型把盤心放在瓶軸上,兩邊的動作才對稱。
// 兩塊四分之一圓錯開相接的量(兩道垂直面的距離)要小於銷徑,銷推完一道垂直面時才會正好被另一道靜擊面擋住,
// 原圖錯開的量約等於銷徑,模型取銷徑的一半。
// 瓶形板照 525 px 原圖量的輪廓:細頸到樞軸下全高約四成才開始鼓起(原圖頸上畫了折斷記號,實物更長)。
// 推斷:擺幅、銷與窗的尺寸(照原圖的比例);機架是後面的一塊夾板條,擺的樞軸銷與圓盤軸都裝在上面(原圖沒畫)。
// 推斷的驅動(原文沒說圓盤為什麼往前轉;共用 weight-drive.js,和第 297–300 種一樣):圓盤軸上、圓盤後面有一個鼓,
// 繩從鼓往右上拉到夾板條右臂的滑輪,再垂下吊著重錘;重錘的重量就是讓圓盤順時針轉的固定力矩,圓盤停住時重錘也停。
// 圓盤轉兩圈(擺兩個來回)重錘捲回最高處一次(上鍊)。原文說這種擒縱也用在錶裡,錶用發條;重錘只是示意「受固定的力矩」。
import { TAU, deg, swing, Y, Z } from "./kit.js";
import { escapeByContact, placePoly } from "./escapement.js";
import { shape, circle } from "./shapes.js";
import { circlePolygon } from "./contact.js";
import { plateBar } from "./supports.js";
import { weightDrive, rewound } from "./weight-drive.js";

export const SWING = deg(6);
const PIVOT = [0, 2.4];
const DISC = [0, -0.25];
const L = PIVOT[1] - DISC[1]; // 樞軸到盤心
const PIN = { r: 0.16, size: 0.06 }; // 銷離盤心的距離、銷的半徑
const FACE = { a: 0.015, b: 0.064 }; // 垂直面離盤心(擺居中時)的橫向距離、靜擊面離盤心的高度(略大於銷的半徑)
const QUARTER = { width: 0.6, height: 0.37 }; // 窗的兩個四分之一圓(原圖比圓盤大一點)
const DISC_R = 0.27;

// ── Z 形的窗(相對樞軸;擺居中時)──
const lowerFace = (u) => -Math.sqrt((L + FACE.b) ** 2 - u * u); // 下靜擊面:以樞軸為圓心的弧
const upperFace = (u) => -Math.sqrt((L - FACE.b) ** 2 - u * u); // 上靜擊面
const N = 60;
const range = (n, f) => Array.from({ length: n + 1 }, (_, i) => f(i / n));
const leftEnd = FACE.a - QUARTER.width;
const rightEnd = -FACE.a + QUARTER.width;
const lower = range(N, (t) => { const u = leftEnd + (-FACE.a - leftEnd) * t; return [u, lowerFace(u)]; }); // 從左往右
const lrDepth = upperFace(rightEnd) - (upperFace(-FACE.a) - QUARTER.height);
const lrArc = range(24, (t) => { const s = -Math.PI / 2 + (Math.PI / 2) * t; return [-FACE.a + QUARTER.width * Math.cos(s), upperFace(rightEnd) + lrDepth * Math.sin(s)]; }); // 右下四分之一圓:從左垂直面下端到右端
const upper = range(N, (t) => { const u = rightEnd + (FACE.a - rightEnd) * t; return [u, upperFace(u)]; }); // 從右往左
const ulRise = lowerFace(FACE.a) + QUARTER.height - lowerFace(leftEnd);
const ulArc = range(24, (t) => { const s = Math.PI / 2 + (Math.PI / 2) * t; return [FACE.a + QUARTER.width * Math.cos(s), lowerFace(leftEnd) + ulRise * Math.sin(s)]; }); // 左上四分之一圓:從右垂直面上端到左端
const WINDOW = [...lower, ...lrArc.slice(0, -1), ...upper, ...ulArc.slice(0, -1)]; // 逆時針

// 擋銷的實心部分(檢查接觸用):窗外的一圈,在盤心的高度切成上、下兩塊
const crossing = (pts) => {
  for (let i = 0; i + 1 < pts.length; i++) {
    const [p, q] = [pts[i], pts[i + 1]];
    if ((p[1] + L) * (q[1] + L) <= 0) return { i, at: [p[0] + ((q[0] - p[0]) * (-L - p[1])) / (q[1] - p[1]), -L] };
  }
  throw new Error("窗的外弧沒有越過盤心的高度");
};
const BOX = 1.2;
const cr = crossing(lrArc);
const cl = crossing(ulArc);
const SOLIDS = [
  [cl.at, [-BOX, -L], [-BOX, -L + BOX], [BOX, -L + BOX], [BOX, -L], cr.at, ...lrArc.slice(cr.i + 1), ...upper, ...ulArc.slice(0, cl.i + 1)],
  [cr.at, [BOX, -L], [BOX, -L - BOX], [-BOX, -L - BOX], [-BOX, -L], cl.at, ...ulArc.slice(cl.i + 1), ...lower, ...lrArc.slice(0, cr.i + 1)],
];

/** 擺累計擺動 v → 擺角 */
export const pendulumAngle = (v) => swing(v, -SWING, SWING);
export const escapement = {
  ...escapeByContact({ center: DISC, teeth: [circlePolygon([PIN.r, 0], PIN.size, 24)], dir: -1, period: 4 * SWING, pitch: Math.PI, stops: (v) => SOLIDS.map((s) => placePoly(s, PIVOT, pendulumAngle(v))) }),
  period: 4 * SWING,
};

/** 擺累計擺動 v → 擺角、圓盤轉角(順時針為負;每擺一次半圈,由接觸算) */
export function singlePin(v) {
  return { pendulum: pendulumAngle(v), disc: escapement.angle(v) };
}

// ── 瓶形板(相對樞軸):照 525 px 原圖量的輪廓(樞軸到盤心 347 px)──
const K = L / 347;
const PROFILE = [[13, 13.5], [135, 13.5], [170, 19], [200, 26], [230, 37], [260, 52], [290, 72], [320, 89], [350, 97], [365, 98], [395, 92], [425, 77], [455, 63], [470, 60]]; // [樞軸下方的距離, 半寬](px)
function catmull(points, per) {
  const out = [];
  for (let i = 0; i + 1 < points.length; i++) {
    const [p0, p1, p2, p3] = [points[Math.max(0, i - 1)], points[i], points[i + 1], points[Math.min(points.length - 1, i + 2)]];
    for (let k = 0; k < per; k++) {
      const t = k / per;
      out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t * t + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t * t * t)));
    }
  }
  out.push(points[points.length - 1]);
  return out;
}
const side = catmull(PROFILE, 4).map(([d, w]) => [w * K, -d * K]); // 右側,從頸頂往下
const BOTTLE = [...side.map(([x, y]) => [-x, y]).reverse(), ...side]; // 逆時針:左側從下往上,右側從上往下

// ── 推斷的重錘驅動 ──
const ROPE_R = 0.025;
const DRUM_R = 0.065;
const BACK_Z = -0.8; // 夾板條
const DISC_Z = -0.11; // 圓盤(在瓶形板後面)
const DRUM_Z = -0.42; // 鼓、繩、滑輪所在的深度
const DRUM = { center: [...DISC, DRUM_Z], axis: Z, radius: DRUM_R + ROPE_R, sense: -1 }; // 圓盤往前(順時針)轉時繩從鼓上放出
const PULLEY_R = 0.1;
const PULLEY = { center: [1.25, 1.3, DRUM_Z], axis: Z, radius: PULLEY_R + ROPE_R, sense: 1 };
const REWIND = 2 * 4 * SWING; // 圓盤轉兩圈(擺兩個來回)上鍊一次
const WEIGHT = { radius: 0.13, height: 0.36 };
const hang = weightDrive({
  drum: DRUM,
  pulleys: [PULLEY],
  eye: [PULLEY.center[0] + PULLEY.radius, 1.0, DRUM_Z],
  reserve: DRUM.radius * 2 * TAU,
  spare: 0.8 * TAU * DRUM.radius,
  pitch: 2 * ROPE_R,
});
const weightAt = rewound(hang, (v) => -escapement.angle(v), REWIND); // 圓盤往前(順時針)轉的角度
/** 量測與檢查用 */
export const geometry = { PIVOT, DISC, PIN, FACE, DRUM, REWIND };

const PIN_FRONT = 0.07; // 銷的前端(瓶形板前面 0.05)
const local = (z) => z - DISC_Z; // 世界的深度 → 圓盤零件的局部深度

export default {
  figure: 305,
  parts: [
    {
      id: "pendulum",
      kind: "group",
      center: [...PIVOT, 0],
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(BOTTLE, [[...WINDOW].reverse()]), thickness: 0.1 }, // 瓶形板,開著 Z 形的窗(叉瓦)
        { kind: "cylinder", radius: 0.175, inner: 0.05, length: 0.1 }, // 頸頂的圓頭,套在樞軸銷上
        // 下端兩個擺錘
        { kind: "cylinder", radius: 0.13, length: 0.2, at: [-0.26, -440 * K, 0] },
        { kind: "cylinder", radius: 0.13, length: 0.2, at: [0.26, -440 * K, 0] },
      ],
    },
    {
      id: "disc",
      kind: "group",
      center: [...DISC, DISC_Z],
      spin: DISC_R,
      spinOffset: 0.2, // 轉向箭頭擺到瓶形板前面
      pieces: [
        { kind: "plate", shape: shape(circle(DISC_R)), thickness: 0.06 },
        { kind: "cylinder", radius: PIN.size, length: local(PIN_FRONT), at: [PIN.r, 0, local(PIN_FRONT) / 2], accent: true }, // 銷,往前伸進窗裡
        { kind: "cylinder", radius: 0.04, length: 0.15, at: [0, 0, 0.075] }, // 圓盤軸往前伸出的一小段(原圖盤心的小圓)
        { kind: "cylinder", radius: 0.04, length: -local(BACK_Z), at: [0, 0, local(BACK_Z) / 2] }, // 圓盤軸,往後伸進夾板條
        { kind: "cylinder", radius: DRUM_R, length: 0.25, at: [0, 0, local(DRUM_Z + 0.075)] }, // 繞繩的鼓(推斷)
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 夾板條(推斷):從圓盤軸往上到擺的樞軸,中間往右伸一支臂到滑輪的軸
        ...plateBar({ points: [DISC, PIVOT], z: BACK_Z }),
        ...plateBar({ points: [[PIVOT[0], PULLEY.center[1]], [PULLEY.center[0], PULLEY.center[1]]], z: BACK_Z }),
        { kind: "cylinder", radius: 0.05, length: 0.1 - BACK_Z, at: [...PIVOT, (0.1 + BACK_Z) / 2] }, // 擺的樞軸銷
        { kind: "cylinder", radius: 0.035, length: DRUM_Z + 0.05 - BACK_Z, at: [PULLEY.center[0], PULLEY.center[1], (DRUM_Z + 0.05 + BACK_Z) / 2] }, // 滑輪的軸
      ],
    },
    { id: "pulley", kind: "pulley", style: "disc", center: PULLEY.center, axis: Z, radius: PULLEY_R, width: 0.08, arrow: false },
    { id: "rope", kind: "rope", radius: ROPE_R },
    { id: "weight", kind: "weight", axis: Y, radius: WEIGHT.radius, height: WEIGHT.height },
  ],
  // 動力重演:只推擺;圓盤受重錘的固定力矩順時針轉(以彈簧代替;重錘、滑輪照模型的姿勢走),銷由窗緣的叉瓦擋住、放行
  // (從銷被擋住的時刻起算,比對的時刻也都取在銷被擋住的時候)
  replay: {
    to: 8 * SWING,
    free: { disc: { pivot: [...DISC, DISC_Z], spring: -1, gravity: false } },
    ignore: [["disc", "frame"]], // 圓盤軸插在夾板條的孔裡(孔沒畫出來)
    expect: [
      { at: 2 * SWING, part: "disc", label: "擺擺過一次,圓盤轉半圈", quote: "擺每擺動一次,擒縱輪便旋轉半圈" },
      { at: 4 * SWING, part: "disc", label: "擺一個來回,圓盤轉一圈" },
      { part: "disc", label: "擺兩個來回,圓盤轉兩圈" },
    ],
  },
  driver: { part: "pendulum", type: "rotation", cycle: [-SWING, SWING] },
  target: "disc", // 帶單銷的擒縱盤:擒縱讓它半圈半圈地放行
  view: { direction: [0.03, 0.04, 1] },
  pose(v) {
    const w = weightAt(v);
    const eye = w.eye;
    return {
      parts: {
        pendulum: { angle: pendulumAngle(v) },
        disc: { angle: escapement.angle(v) },
        pulley: { angle: w.pulleys[0] },
        weight: { position: [eye[0], eye[1] - WEIGHT.height / 2 - WEIGHT.radius * 0.38, eye[2]] },
      },
      paths: { rope: { points: w.rope, closed: false, phase: 0 } },
      readouts: [],
    };
  },
};
