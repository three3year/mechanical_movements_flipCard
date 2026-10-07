// 第 315 種:錐形擺。擺由一段細圓線從上方吊著,下端連著一個擺錘;下方直立旋轉的心軸頂上有一支搖臂,
// 推著擺錘作圓周運動,擺線在旋轉時描出一個圓錐面。主動件是虛擬的「進程」:心軸已轉了幾圈。
// 擺錘順著擺線斜掛,底下伸出一根尖銷(照原圖);搖臂從後面貼著尖銷推它走(心軸逆時針轉,俯視)。
// 推斷:擺的錐角;心軸由下方的齒輪帶動(原圖只畫出齒輪,所以心軸當作直接受力的零件)。
import { Y, TAU, deg, quatFromZ } from "./kit.js";

const TOP = [0, 3.0, 0];
const L = 4.4; // 懸點到擺錘中心
export const CONE = deg(17); // 擺線與鉛直線的夾角
const BOB = { r: 0.3, half: 0.375 }; // 擺錘(順著擺線的圓柱)
const PIN = { r: 0.03, length: 0.5 }; // 擺錘底下的尖銷
const ARM = { z: 0.2, half: 0.03 }; // 搖臂離心軸中心的高度、半厚
const SPINDLE = [0, -1.95, 0];
// 搖臂那一高度上,尖銷中心離心軸的距離;搖臂落後尖銷一個小角度,側面剛好貼著銷
const ARM_Y = SPINDLE[1] + ARM.z;
const PIN_R = (TOP[1] - ARM_Y) * Math.tan(CONE);
const LAG = Math.asin((PIN.r + ARM.half) / PIN_R); // 尖銷斜在徑向的鉛直面上,橫向的寬度仍是它的半徑
const ARM_LEN = PIN_R + 0.12;

const unit = (a) => [Math.sin(CONE) * Math.cos(a), -Math.cos(CONE), -Math.sin(CONE) * Math.sin(a)]; // 懸點往擺錘的方向

/** 進程 p(心軸轉的圈數)→ 心軸角、擺錘中心、擺線方向 */
export function conical(p) {
  const a = TAU * p;
  const u = unit(a);
  return { spindle: a, bob: TOP.map((c, i) => c + L * u[i]), dir: u };
}
export const geometry = { TOP, L, PIN_R, LAG, ARM_Y };

export default {
  figure: 315,
  parts: [
    { id: "support", kind: "group", center: TOP, pieces: [{ kind: "box", size: [1.0, 0.18, 0.4], at: [0, 0.2, 0] }, { kind: "box", size: [0.2, 0.25, 0.2], at: [0, 0, 0] }] },
    { id: "thread", kind: "rod", radius: 0.02 },
    {
      id: "bob",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: BOB.r, length: 2 * BOB.half, accent: true },
        { kind: "cylinder", radius: PIN.r, length: PIN.length, at: [0, 0, BOB.half + PIN.length / 2] }, // 尖銷,搖臂推它
      ],
    },
    {
      id: "spindle",
      kind: "group",
      axis: Y,
      center: SPINDLE,
      spin: 0.7,
      spinOffset: -0.3,
      pieces: [
        { kind: "cylinder", radius: 0.07, length: 1.0, at: [0, 0, -0.25] },
        { kind: "box", size: [0.22, 0.22, 0.22], at: [0, 0, ARM.z] },
        // 推尖銷的搖臂:落後尖銷 LAG,側面貼著銷
        { kind: "box", size: [ARM_LEN, 2 * ARM.half, 0.06], axis: [0, 0, 1], angle: -LAG, at: [(ARM_LEN / 2) * Math.cos(LAG), -(ARM_LEN / 2) * Math.sin(LAG), ARM.z] },
        { kind: "cylinder", radius: 0.7, length: 0.12, at: [0, 0, -0.3] },
        { kind: "gear", teeth: 14, radius: 0.32, width: 0.3, at: [0, 0, -0.62] },
        { kind: "box", size: [0.35, 0.3, 0.35], at: [0, 0, -1.0] },
      ],
    },
  ],
  // 動力重演:擺錘(連擺線)當成繞懸點的鉛直軸自由轉的零件(引擎沒有球形鉸,錐角由模型給定),只被搖臂推著走
  replay: {
    to: 1,
    free: { bob: { pivot: TOP, axis: [0, 1, 0], gravity: false, hold: true } }, // hold:空氣阻力,沒被推就慢下來
    expect: [
      { at: 0.25, part: "bob", label: "搖臂推著尖銷,擺錘走了四分之一圈" },
      { part: "bob", label: "心軸轉一圈,擺錘繞一圈", quote: "由連接於垂直旋轉心軸的搖臂帶動以圓周方式運動" },
    ],
  },
  powered: ["spindle"], // 外力來源:心軸由下方的齒輪(鐘的輪系)帶動
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.25 },
  target: "bob", // 被搖臂推著走圓的擺錘
  view: { direction: [0.05, 0.15, 1] },
  pose(p) {
    const { spindle, bob, dir } = conical(p);
    const top = bob.map((c, i) => c - BOB.half * dir[i]); // 擺線繫在擺錘頂面
    return {
      parts: { spindle: { angle: spindle }, bob: { position: bob, rotation: quatFromZ(dir), angle: spindle } }, // angle:繞鉛直軸轉過的角度(給動力重演比對)
      paths: { thread: { points: [TOP, top], closed: false } },
      readouts: [],
    };
  },
};
