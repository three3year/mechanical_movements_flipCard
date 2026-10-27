// 第 9、10 種共用:兩個方向相反的錐形皮帶輪,撥叉把皮帶沿錐面慢慢推過去再推回來,從動輪的轉速逐漸加快或減慢。
// 上下兩輪在同一位置的半徑和固定,開口皮帶的長度近似不變(全程差 0.6–0.7%,實物皮帶的彈性吃得下)。
// 推斷(插圖只畫兩個錐輪與皮帶):撥叉——兩根叉齒夾著皮帶的前段,滑套套在兩輪前方的導桿上;
// 兩端的機架——托著兩根軸的軸承與導桿。撥叉照主動量走:主動輪轉 TRAVERSE 圈,皮帶從錐面一端走到另一端,
// 再走回來(原文說用於棉紡機械:粗紗機的成形機構每捲完一層就把皮帶推過去一點;推撥叉的機構沒有畫出來)。
// 從動輪的轉角 = 皮帶處半徑比對主動量的積分(皮帶不打滑),所以轉速比隨皮帶位置連續變化,讀數「轉速比」標出漸快或漸慢。
import { X, TAU, routeBelt } from "./kit.js";

const LENGTH = 2.2;
const TOP_Y = 1.6;
const BOTTOM_Y = -1.6;
const SAMPLES = 20;
const BELT_R = 0.05; // 皮帶粗細(圓帶的半徑)
const EDGE = 0.02; // 皮帶走到最遠時,皮帶的邊離錐面端面
const REACH = LENGTH / 2 - BELT_R - EDGE; // 皮帶中心離錐輪中央最遠多少
const F = [0.5 - REACH / LENGTH, 0.5 + REACH / LENGTH]; // 皮帶位置 f 的範圍(0 = 左端、1 = 右端)
const TRAVERSE = 3; // 主動輪轉幾圈,皮帶走完一趟
const STROKE = TRAVERSE * TAU;
const TABLE = 4000; // 積分表的格數(一趟)

// 撥叉與導桿(推斷):導桿在兩輪中間的高度(y = 0)、皮帶前段的前方
const ROD = { z: 1.15, r: 0.05 };
const PRONG = { t: 0.04, h: 0.22, z0: 0.44, z1: 0.88 }; // 叉齒:沿軸厚 t、高 h,深度 z0–z1 跨過皮帶前段(z ≈ 0.6)
const STEM = [PRONG.z1 - 0.03, ROD.z - 0.09]; // 叉柄:從叉齒頂上的橫板接到滑套
const CLEAR = 0.005; // 叉齒內面與皮帶的間隙
const STAND_X = 1.45; // 兩端機架的位置(軸伸到 ±1.55)
const SHAFT_R = 0.08;

/** 輪廓 [[f, r], …] 在 f 處的半徑(線性內插;皮帶落在畫出來的錐面上) */
function radiusOn(profile, f) {
  const i = Math.min(profile.length - 1, Math.max(1, profile.findIndex(([g]) => g >= f)));
  const [f0, r0] = profile[i - 1];
  const [f1, r1] = profile[i];
  return r0 + ((r1 - r0) * (f - f0)) / (f1 - f0);
}

/** 主動量 → 撥叉在一趟裡走到的比例 s(0 = 左端、1 = 右端;主動量 0 在中央、往右走) */
function legOf(angle) {
  const w = angle / STROKE + 0.5;
  const k = Math.floor(w);
  const u = w - k;
  return { w, s: k % 2 === 0 ? u : 1 - u };
}

/**
 * fn(s) 沿撥叉行程的累積積分:回傳 Φ(w) = ∫₀^w fn(s(ω)) dω(ω 以「趟」為單位,s 是三角波)。
 * 先算好一趟的積分表,任意大的主動量只查表。
 */
function legIntegral(fn) {
  const table = [0];
  for (let i = 1; i <= TABLE; i++) table.push(table[i - 1] + (fn((i - 1) / TABLE) + fn(i / TABLE)) / (2 * TABLE));
  const at = (s) => {
    const x = s * TABLE;
    const i = Math.min(TABLE - 1, Math.floor(x));
    return table[i] + (table[i + 1] - table[i]) * (x - i);
  };
  const whole = table[TABLE];
  return (w) => {
    const k = Math.floor(w);
    const u = w - k;
    return k * whole + (k % 2 === 0 ? at(u) : whole - at(1 - u));
  };
}

/** driverRadius(f):f 由 0(左端)到 1(右端);sum:上下兩輪半徑和 */
export function conePair({ figure, driverRadius, sum }) {
  const drivenRadius = (f) => sum - driverRadius(f);
  const profile = (radius) => Array.from({ length: SAMPLES + 1 }, (_, i) => [i / SAMPLES, radius(i / SAMPLES)]);
  const driverProfile = profile(driverRadius);
  const drivenProfile = profile(drivenRadius);
  const fAt = (s) => F[0] + (F[1] - F[0]) * s;
  const rTop = (s) => radiusOn(driverProfile, fAt(s));
  const rBottom = (s) => radiusOn(drivenProfile, fAt(s));
  const ratio = (s) => rTop(s) / rBottom(s);
  const turned = legIntegral(ratio); // 從動輪轉角(每趟主動量 STROKE)
  const belted = legIntegral(rTop); // 皮帶行進量
  const since = (phi, w) => STROKE * (phi(w) - phi(0.5));
  const along = (s) => (fAt(s) - 0.5) * LENGTH;

  const path = (s) => {
    const x = along(s);
    return routeBelt([
      { center: [x, TOP_Y, 0], axis: X, radius: rTop(s), sense: 1 },
      { center: [x, BOTTOM_Y, 0], axis: X, radius: rBottom(s), sense: 1 },
    ]).points;
  };

  const forkWidth = 2 * (BELT_R + CLEAR + PRONG.t);
  const prongX = BELT_R + CLEAR + PRONG.t / 2;

  return {
    figure,
    parts: [
      { id: "driver", kind: "cone", center: [0, TOP_Y, 0], axis: X, length: LENGTH, profile: driverProfile },
      { id: "driven", kind: "cone", center: [0, BOTTOM_Y, 0], axis: X, length: LENGTH, profile: drivenProfile },
      { id: "topShaft", kind: "shaft", center: [0, TOP_Y, 0], axis: X, radius: SHAFT_R, length: LENGTH + 0.9 },
      { id: "bottomShaft", kind: "shaft", center: [0, BOTTOM_Y, 0], axis: X, radius: SHAFT_R, length: LENGTH + 0.9 },
      { id: "belt", kind: "belt", radius: BELT_R },
      // 撥叉(推斷):滑套套在導桿上,往後伸出兩根叉齒夾著皮帶的前段
      {
        id: "fork",
        kind: "group",
        center: [0, 0, 0],
        pieces: [
          { kind: "cylinder", axis: X, radius: 0.1, inner: ROD.r + 0.005, length: 0.2, at: [0, 0, ROD.z] },
          { kind: "box", size: [0.08, 0.1, STEM[1] - STEM[0]], at: [0, 0, (STEM[0] + STEM[1]) / 2] },
          { kind: "box", size: [forkWidth, 0.1, 0.05], at: [0, 0, PRONG.z1 - 0.025] },
          ...[-1, 1].map((side) => ({ kind: "box", role: "prong", size: [PRONG.t, PRONG.h, PRONG.z1 - PRONG.z0], at: [side * prongX, 0, (PRONG.z0 + PRONG.z1) / 2] })),
        ],
      },
      // 兩端的機架(推斷):上下兩根軸的軸承、中間的立柱,往前伸出的臂托著撥叉的導桿
      {
        id: "frame",
        kind: "group",
        pieces: [
          ...[-1, 1].flatMap((side) => [
            ...[TOP_Y, BOTTOM_Y].map((y) => ({ kind: "cylinder", axis: X, radius: 0.17, inner: SHAFT_R, length: 0.12, at: [side * STAND_X, y, 0] })),
            { kind: "box", size: [0.1, TOP_Y - BOTTOM_Y - 0.32, 0.16], at: [side * STAND_X, 0, 0] },
            { kind: "box", size: [0.1, 0.16, ROD.z], at: [side * STAND_X, 0, ROD.z / 2] },
            { kind: "cylinder", axis: X, radius: 0.09, length: 0.1, at: [side * STAND_X, 0, ROD.z] },
          ]),
          { kind: "cylinder", axis: X, radius: ROD.r, length: 2 * STAND_X, at: [0, 0, ROD.z] }, // 導桿
        ],
      },
    ],
    driver: { part: "driver", type: "rotation", speed: 1.6, period: 2 * STROKE }, // 取景涵蓋皮帶走一個來回
    target: "driven", // 變速的從動錐形輪
    powered: ["fork"], // 撥叉照主動量走,推它的機構沒有畫出來(推斷)
    view: { direction: [0.35, 0.25, 1] },
    pose(angle) {
      const { w, s } = legOf(angle);
      const driven = since(turned, w);
      const rate = ratio(s);
      const trend = ratio(legOf(angle + 0.05).s) > rate ? "漸快" : "漸慢";
      return {
        parts: {
          driver: { angle },
          topShaft: { angle },
          driven: { angle: driven },
          bottomShaft: { angle: driven },
          fork: { position: [along(s), 0, 0] },
        },
        paths: { belt: { points: path(s), closed: true, phase: since(belted, w) } },
        readouts: [{ label: "轉速比(下輪 / 上輪)", value: `${rate.toFixed(2)}(${trend})` }],
      };
    },
  };
}
