// 第 315 種:錐形擺。擺由一段細圓線從上方吊著,下端連著一個擺錘;下方直立旋轉的心軸頂上有一支臂,
// 推著擺錘作圓周運動,擺桿在旋轉時描出一個圓錐面。主動件是虛擬的「進程」:心軸已轉了幾圈。
// 照 525 px 原圖:懸掛座底下是一小段細線(當成萬向的懸掛),接一個套環,之後是一根剛性的擺桿穿過擺錘,
// 下端伸出擺錘底下成尖銷;臂從後面貼著尖銷推它走(心軸逆時針轉,俯視)。心軸中段穿過一片水平的固定板
// (軸承),底下是傘齒輪(上寬下窄),下端削尖、立在固定的軸尖座上。
// 推斷:擺的錐角。
// 推斷的驅動(原圖只畫出心軸上的傘齒輪,沒畫和它咬合的齒輪;錐形擺是鐘的調速器,輪系經傘齒輪帶動心軸;
// 共用 weight-drive.js):左邊一根水平軸,軸端一樣大的傘齒輪和心軸的咬合,軸上的鼓繞著繩、吊著重錘。
// 重錘的重量經水平軸與傘齒輪讓心軸轉;心軸轉多少,鼓就放出多少繩。重錘降到底(心軸轉兩圈)捲回最高處(上鍊)。
// 推斷:水平軸、它的傘齒輪、鼓、繩與重錘,以及背板與從背板伸出的托架(固定板、軸尖座、水平軸的兩個軸承)。
import { X, Y, TAU, deg, quatFromZ } from "./kit.js";
import { weightDrive, rewound } from "./weight-drive.js";

const TOP = [0, 3.0, 0];
const L = 4.4; // 懸點到擺錘中心
export const CONE = deg(17); // 擺桿與鉛直線的夾角
const WIRE = 0.4; // 懸掛的細線長
const BOB = { r: 0.3, half: 0.375 }; // 擺錘(擺桿穿過它的中心)
const ROD = { r: 0.04 }; // 擺桿
const PIN = { r: ROD.r, length: 0.5, tip: 0.08 }; // 擺桿伸出擺錘底下的一段(尖銷),末端削尖
const ARM = { z: 0.2, half: 0.03 }; // 臂離心軸中心的高度、半厚
const SPINDLE = [0, -1.95, 0];
// 臂那一高度上,尖銷中心離心軸的距離;臂落後尖銷一個小角度,側面剛好貼著銷
const ARM_Y = SPINDLE[1] + ARM.z;
const PIN_R = (TOP[1] - ARM_Y) * Math.tan(CONE);
const LAG = Math.asin((PIN.r + ARM.half) / PIN_R); // 尖銷斜在徑向的鉛直面上,橫向的寬度仍是它的半徑
const ARM_LEN = PIN_R + 0.12;

// 心軸(局部 z = 世界 y,原點在 SPINDLE):頂上的轂與臂、穿過固定板的一段、傘齒輪、削尖的下端
const SHAFT = { r: 0.07, top: 0.25, bottom: -1.32 };
const TIP = 0.08; // 錐尖長
const PLATE_Y = -2.25; // 固定板(軸承)的高度
const BEVEL = { r: 0.36, h: 0.144, z: -0.65 }; // 兩個一樣大的傘齒輪
const APEX = 0.9 * BEVEL.r; // 傘齒輪中心到兩軸線交點的距離(錐頂相同)
const Q = [0, SPINDLE[1] + BEVEL.z - APEX, 0]; // 心軸與水平軸的交點
const FOOT_TOP = SPINDLE[1] + SHAFT.bottom - TIP; // 軸尖座的頂面 = 錐尖
const BACK = { z: -0.6, t: 0.1, top: PLATE_Y + 0.06, bottom: FOOT_TOP - 0.55 }; // 背板:頂邊和固定板的頂面齊平(擺的尖銷從上面掃過)

// 推斷的重錘驅動:水平軸(局部 z = 世界 x)上的鼓,繩從鼓的前面(+z)垂下
const ROPE_R = 0.03;
const DRUM_R = 0.09;
const DRUM_X = -1.6; // 鼓的中心
// 水平軸往前轉(繞 +x)時繩從鼓上放出;繩在鼓的左端附近搭上鼓、往右繞(center 取繩搭上的那一圈)
const DRUM = { center: [DRUM_X - 0.18, Q[1], 0], axis: X, radius: DRUM_R + ROPE_R, sense: 1 };
const REWIND = 2; // 心軸轉兩圈上鍊一次
const WEIGHT = { radius: 0.16, height: 0.42 };
const hang = weightDrive({
  drum: DRUM,
  eye: [DRUM.center[0], Q[1] - 0.5, DRUM.radius],
  reserve: DRUM.radius * TAU * REWIND,
  spare: TAU * DRUM.radius,
  pitch: 2.1 * ROPE_R,
});

const unit = (a) => [Math.sin(CONE) * Math.cos(a), -Math.cos(CONE), -Math.sin(CONE) * Math.sin(a)]; // 懸點往擺錘的方向

/** 進程 p(心軸轉的圈數)→ 心軸角、擺錘中心、擺桿方向 */
export function conical(p) {
  const a = TAU * p;
  const u = unit(a);
  return { spindle: a, bob: TOP.map((c, i) => c + L * u[i]), dir: u };
}
/** 進程 p → 水平軸的轉角(繞 +x):兩個一樣大的傘齒輪,心軸轉一圈它也轉一圈 */
export const arborAngle = (p) => TAU * p;
const weightAt = rewound(hang, arborAngle, REWIND);
export const geometry = { TOP, L, BOB, PIN_R, LAG, ARM_Y, DRUM, REWIND };

// 擺錘的局部 z 沿擺桿(朝下),原點在擺錘中心;懸點在 z = −L
const ROD_TOP = -L + WIRE;
const ROD_END = BOB.half + PIN.length - PIN.tip;

export default {
  figure: 315,
  parts: [
    { id: "support", kind: "group", center: TOP, pieces: [{ kind: "box", size: [1.0, 0.18, 0.4], at: [0, 0.2, 0] }, { kind: "box", size: [0.2, 0.25, 0.2], at: [0, 0, 0] }] },
    { id: "wire", kind: "rod", radius: 0.015 }, // 懸掛的一小段細圓線
    {
      id: "bob",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: BOB.r, length: 2 * BOB.half, accent: true },
        { kind: "cylinder", radius: ROD.r, length: ROD_END - ROD_TOP, at: [0, 0, (ROD_TOP + ROD_END) / 2] }, // 擺桿,穿過擺錘
        { kind: "cylinder", radius: 0.07, length: 0.1, at: [0, 0, ROD_TOP + 0.05] }, // 擺桿頂上的套環(細線繫在這裡)
        { kind: "cylinder", radius: PIN.r, radiusEnd: 0.008, length: PIN.tip, at: [0, 0, ROD_END + PIN.tip / 2] }, // 尖銷的尖端
      ],
    },
    {
      id: "spindle",
      kind: "group",
      axis: Y,
      center: SPINDLE,
      spin: 0.3,
      spinOffset: PLATE_Y - 0.17 - SPINDLE[1], // 轉向箭頭在固定板與傘齒輪之間
      pieces: [
        { kind: "cylinder", radius: SHAFT.r, length: SHAFT.top - SHAFT.bottom, at: [0, 0, (SHAFT.top + SHAFT.bottom) / 2] },
        { kind: "box", size: [0.22, 0.22, 0.22], at: [0, 0, ARM.z] },
        // 推尖銷的臂:落後尖銷 LAG,側面貼著銷
        { kind: "box", size: [ARM_LEN, 2 * ARM.half, 0.06], axis: [0, 0, 1], angle: -LAG, at: [(ARM_LEN / 2) * Math.cos(LAG), -(ARM_LEN / 2) * Math.sin(LAG), ARM.z] },
        { kind: "bevel", radius: BEVEL.r, height: BEVEL.h, axis: [0, 0, -1], at: [0, 0, BEVEL.z] }, // 傘齒輪,錐頂朝下(上寬下窄,照原圖)
        { kind: "cylinder", radius: SHAFT.r, radiusEnd: 0.01, length: TIP, axis: [0, 0, -1], at: [0, 0, SHAFT.bottom - TIP / 2] }, // 削尖的下端
      ],
    },
    // 推斷:左邊的水平軸,軸端的傘齒輪和心軸的咬合(錐頂朝心軸),中段是繞繩的鼓
    {
      id: "arbor",
      kind: "group",
      axis: X,
      center: Q,
      spin: 0.3,
      spinOffset: -2.2,
      pieces: [
        { kind: "bevel", radius: BEVEL.r, height: BEVEL.h, axis: [0, 0, 1], at: [0, 0, -APEX] },
        { kind: "cylinder", radius: 0.05, length: 2.3, at: [0, 0, -APEX - 1.15] },
        { kind: "cylinder", radius: DRUM_R, length: 0.42, at: [0, 0, DRUM_X], mark: true }, // 繞繩的鼓
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 背板,與從它伸出的托架(推斷:原圖只畫固定板與軸尖座)
        { kind: "box", size: [3.7, BACK.top - BACK.bottom, BACK.t], at: [-0.85, (BACK.top + BACK.bottom) / 2, BACK.z] },
        // 心軸穿過的固定板(原圖那片水平的長條)與板上的軸承
        { kind: "box", size: [1.6, 0.12, 0.8], at: [0, PLATE_Y, -0.2] },
        { kind: "cylinder", axis: Y, radius: 0.15, inner: SHAFT.r, length: 0.24, at: [0, PLATE_Y, 0] },
        // 軸尖座與托著它的托架
        { kind: "box", size: [0.35, 0.3, 0.35], at: [0, FOOT_TOP - 0.15, 0] },
        { kind: "box", size: [0.6, 0.12, 0.8], at: [0, FOOT_TOP - 0.36, -0.2] },
        // 水平軸的兩個軸承與伸出的托臂
        ...[-0.95, -2.3].flatMap((x) => [
          { kind: "cylinder", axis: X, radius: 0.12, inner: 0.05, length: 0.12, at: [x, Q[1], 0] },
          { kind: "box", size: [0.08, 0.1, 0.5], at: [x, Q[1], -0.35] },
        ]),
      ],
    },
    { id: "rope", kind: "rope", radius: ROPE_R },
    { id: "weight", kind: "weight", axis: Y, radius: WEIGHT.radius, height: WEIGHT.height },
  ],
  // 動力重演:擺錘(連擺桿)當成繞懸點的鉛直軸自由轉的零件(引擎沒有球形鉸,錐角由模型給定),只被臂推著走
  replay: {
    to: 1,
    free: { bob: { pivot: TOP, axis: [0, 1, 0], gravity: false, hold: true } }, // hold:空氣阻力,沒被推就慢下來
    expect: [
      { at: 0.25, part: "bob", label: "臂推著尖銷,擺錘走了四分之一圈" },
      { part: "bob", label: "心軸轉一圈,擺錘繞一圈", quote: "下端與裝在垂直旋轉心軸上的一支臂相連,並由它帶動以圓周方式運動" },
    ],
  },
  powered: ["weight"], // 外力來源:重錘的重量(經繩、鼓、水平軸與傘齒輪帶動心軸)
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, REWIND], unit: "圈", speed: 0.25 },
  target: "bob", // 被臂推著走圓的擺錘
  view: { direction: [0.05, 0.15, 1] },
  pose(p) {
    const { spindle, bob, dir } = conical(p);
    const w = weightAt(p);
    const top = bob.map((c, i) => c + ROD_TOP * dir[i]); // 細線繫在擺桿頂上的套環
    return {
      parts: {
        spindle: { angle: spindle },
        bob: { position: bob, rotation: quatFromZ(dir), angle: spindle }, // angle:繞鉛直軸轉過的角度(給動力重演比對)
        arbor: { angle: arborAngle(p) },
        weight: { position: [w.eye[0], w.eye[1] - WEIGHT.height / 2 - WEIGHT.radius * 0.38, w.eye[2]] },
      },
      paths: { wire: { points: [TOP, top], closed: false }, rope: { points: w.rope, closed: false, phase: 0 } },
      readouts: [],
    };
  },
};
