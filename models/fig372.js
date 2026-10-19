// 第 372 種:懷特氏測功計。環形框架是一個環面垂直於水平軸的寬環,輪轂套在軸的中點、可以繞軸自由轉;環裡上下各裝一個
// 水平的傘齒輪(行星齒輪),由框架從輪轂沿半徑伸到環的兩根軸撐著。軸上兩個垂直的傘齒輪與它們咬合,一個固定在軸上(左)、
// 一個在軸上鬆轉(右)。若把框架保持靜止,傳給一個垂直傘齒輪的運動會經水平齒輪傳給另一個(反向轉);若讓框架自由,
// 另一個垂直齒輪受到負載而不動時,框架就跟著轉——讓框架保持靜止所需的力對應傳過去的動力,
// 繫在環周圍的皮帶上吊的重錘的重量就指示這個動力。主動件是左邊固定在軸上的傘齒輪(軸)。
// 原圖從正面看:中間直立的寬帶是側看的環,上下都伸出齒輪方框外;四個傘齒輪在環裡圍成方框。
// 量測(原文,原圖沒畫,推斷):皮帶的上端釘在環頂的外緣,往後沿環的外緣繞下四分之一圈,從環的後面垂直吊著重錘。
// 軸照主動件的方向轉時,框架被帶著往同一個方向轉,重錘吊在環的後面,它的力矩正好和這個方向相反,把框架擋住。
// 右傘齒輪的套筒(套在軸上)往右穿過右立柱的軸承,立柱外側的皮帶輪以皮帶往下伸出圖外接被量測的機器(推斷)。
// 狀態按鈕:掛上重錘(框架保持靜止,右齒輪帶著機器反向轉)/ 拿掉重錘(框架放開,右齒輪被機器的負載擋住不轉,
// 框架以軸的一半轉速跟著轉)。
// 推斷:兩種狀態的設定;齒數;皮帶、重錘、皮帶輪;立柱的高度(照原圖)。
// 偏離插圖:齒輪照原圖的大小(方框佔立柱間距約八成),但環比原圖大:原圖的環只比齒輪方框大一點,可是上下兩個行星齒輪
// 是水平的,大端節圓的前後兩點離軸 √2 倍的節圓半徑,環的內徑要大過齒頂的這個距離(環的外徑約佔立柱間距的六成,原圖約五成)。
// 環的下緣因此比原圖低,兩立柱之間的橫桿放在環下面一點(原圖也在環的正下方)。
import { X, Z, deg, quatMul, quatAxisAngle, quatFromZ, rotateAbout } from "./kit.js";
import { bevelGear } from "./gears.js";
import { gearSize } from "./shapes.js";

export const R = 1.45; // 傘齒輪大端的節圓半徑
const N = 24;
export const M = gearSize(R, N).addendum; // 齒頂高
const cone = deg(45);
const WIDTH = 0.45;
const S1 = bevelGear({ apex: [0, 0, 0], axis: [1, 0, 0], teeth: N, radius: R, cone, width: WIDTH });
const S2 = bevelGear({ apex: [0, 0, 0], axis: [-1, 0, 0], teeth: N, radius: R, cone, width: WIDTH });
const P0 = bevelGear({ apex: [0, 0, 0], axis: [0, -1, 0], teeth: N, radius: R, cone, width: WIDTH });
const PLANET_PHASE = Math.PI / N; // 行星齒輪錯開半個齒距,齒插進垂直齒輪的齒間

const HOOP = { inner: 2.32, outer: 2.5, width: 0.8 }; // 環:環面垂直於軸(繞 x 的寬環);內徑大過行星齒輪齒頂離軸的 √2 ×(R + M)
const HUB = 0.2; // 輪轂半徑
const PILLAR_X = 2.0;
const FLOOR = -3.6;
const BAR_Y = -2.75; // 兩立柱之間的橫桿(在環下面)
const BAND = 0.015; // 皮帶的半厚
const BAND_R = HOOP.outer + BAND; // 皮帶中心線離軸
export const LOAD_PULLEY = 0.45; // 右齒輪套筒上的皮帶輪半徑
const PULLEY_X = 2.375; // 右立柱外側
const WEIGHT = { radius: 0.3, height: 0.5, top: -2.05 }; // 重錘:吊環的頂在 top

/** 軸(左齒輪)轉 a、狀態 → 框架轉角與右齒輪的轉角(都以繞 +x 計) */
export function dynamometer(a, state = "held") {
  if (state === "held") return { carrier: 0, sun2: -a };
  return { carrier: a / 2, sun2: 0 };
}

const gear = (g) => ({ kind: "gear", teeth: N, radius: R, cone, width: g.width });

// 皮帶:從環頂沿外緣往後繞到環的正後方(切點),再垂直往下接到重錘的吊環
const bandPoints = (() => {
  const arc = Array.from({ length: 13 }, (_, i) => {
    const t = (i / 12) * (Math.PI / 2); // 從環頂(+y)往後(−z)
    return [0, BAND_R * Math.cos(t), -BAND_R * Math.sin(t)];
  });
  return [...arc, [0, WEIGHT.top, -BAND_R]];
})();
const WEIGHT_AT = [0, WEIGHT.top - WEIGHT.radius * 0.25 - WEIGHT.height / 2, -BAND_R];
// 右齒輪皮帶輪上的皮帶:從圖外上來,繞過皮帶輪頂,往下回到圖外
const loadBelt = (() => {
  const r = LOAD_PULLEY + 0.015;
  const arc = Array.from({ length: 13 }, (_, i) => {
    const t = (i / 12) * Math.PI;
    return [PULLEY_X, r * Math.sin(t), r * Math.cos(t)];
  });
  return [[PULLEY_X, FLOOR, r], ...arc, [PULLEY_X, FLOOR, -r]];
})();

export default {
  figure: 372,
  parts: [
    {
      id: "stand",
      kind: "group",
      pieces: [
        { kind: "box", role: "pillar", size: [0.25, 0.55 - FLOOR, 0.4], at: [-PILLAR_X, (0.55 + FLOOR) / 2, 0] },
        { kind: "box", role: "pillar", size: [0.25, 0.55 - FLOOR, 0.4], at: [PILLAR_X, (0.55 + FLOOR) / 2, 0] },
        { kind: "lathe", axis: X, profile: [[0, -1.9], [0.08, -1.9], [0.06, -0.5], [0.14, -0.15], [0.14, 0.15], [0.06, 0.5], [0.08, 1.9], [0, 1.9]], at: [0, BAR_Y, 0] },
      ],
    },
    {
      id: "shaft",
      kind: "group",
      center: S1.center,
      axis: X,
      spin: R + 0.1,
      pieces: [
        gear(S1),
        { kind: "cylinder", radius: 0.08, length: 5.5, at: [0, 0, -S1.center[0]] }, // 軸:穿過兩根立柱,兩端伸出
        { kind: "cylinder", radius: 0.18, length: 0.2, at: [0, 0, -PILLAR_X + 0.225 - S1.center[0]] }, // 左立柱內側的軸環
      ],
    },
    {
      id: "sun2",
      kind: "group",
      center: S2.center,
      axis: [-1, 0, 0],
      spin: R + 0.1,
      pieces: [
        gear(S2),
        // 套筒(套在軸上)往右穿過右立柱的軸承,立柱外側裝著接被量測機器的皮帶輪(推斷)
        { kind: "cylinder", radius: 0.16, inner: 0.08, length: PULLEY_X + 0.15 - R, at: [0, 0, -((PULLEY_X + 0.15 + R) / 2 - S2.center[0])] },
        { kind: "cylinder", radius: LOAD_PULLEY, length: 0.24, at: [0, 0, -(PULLEY_X - S2.center[0])] },
        ...[-1, 1].map((s) => ({ kind: "cylinder", radius: LOAD_PULLEY + 0.06, length: 0.03, at: [0, 0, -(PULLEY_X + s * 0.135 - S2.center[0])] })),
      ],
    },
    {
      id: "frame",
      kind: "group",
      arrow: false,
      pieces: [
        // 環形框架:環面垂直於軸的寬環,輪轂套在軸的中點,兩根徑向軸從輪轂穿過行星齒輪伸進環
        { kind: "lathe", role: "hoop", axis: X, profile: [[HOOP.inner, -HOOP.width / 2], [HOOP.outer, -HOOP.width / 2], [HOOP.outer, HOOP.width / 2], [HOOP.inner, HOOP.width / 2], [HOOP.inner, -HOOP.width / 2]], at: [0, 0, 0] },
        { kind: "cylinder", role: "hub", axis: X, radius: HUB, inner: 0.08, length: 0.4, at: [0, 0, 0] }, // 套在軸上(孔等於軸徑)
        ...[1, -1].map((s) => ({ kind: "cylinder", role: "planetAxle", axis: [0, 1, 0], radius: 0.07, length: HOOP.inner + 0.07 - 0.15, at: [0, (s * (HOOP.inner + 0.07 + 0.15)) / 2, 0] })),
      ],
    },
    { id: "planetTop", kind: "group", arrow: false, pieces: [gear(P0)] },
    { id: "planetBottom", kind: "group", arrow: false, pieces: [gear(P0)] },
    { id: "band", kind: "belt", width: 0.4, thickness: 2 * BAND }, // 繫在環周圍的皮帶(推斷)
    { id: "weight", kind: "weight", axis: [0, 1, 0], radius: WEIGHT.radius, height: WEIGHT.height },
    { id: "loadBelt", kind: "belt", width: 0.2, thickness: 0.03 }, // 往下接被量測的機器(推斷)
  ],
  driver: { part: "shaft", type: "rotation" },
  target: "sun2", // 動力傳過去的那一個傘齒輪
  states: {
    initial: "held",
    options: [
      { id: "held", label: "掛上重錘:框架保持靜止" },
      { id: "free", label: "拿掉重錘:框架放開" },
    ],
  },
  view: { direction: [0.35, 0.25, 1] },
  pose(a, state = "held") {
    const d = dynamometer(a, state);
    const spin = a - d.carrier;
    const planet = (extra) => {
      const center = rotateAbout(P0.center, X, d.carrier + extra);
      return { position: center, rotation: quatMul(quatAxisAngle(X, d.carrier + extra), quatMul(quatFromZ([0, -1, 0]), quatAxisAngle(Z, spin + PLANET_PHASE))) };
    };
    const held = state === "held";
    return {
      parts: {
        shaft: { angle: a },
        sun2: { angle: -d.sun2 },
        frame: { rotation: quatAxisAngle(X, d.carrier) },
        planetTop: planet(0),
        planetBottom: planet(Math.PI),
        weight: { position: WEIGHT_AT, visible: held },
      },
      paths: {
        band: { points: bandPoints, closed: false, visible: held },
        loadBelt: { points: loadBelt, closed: false, phase: LOAD_PULLEY * -d.sun2 },
      },
      readouts: [],
    };
  },
  waivers: ["shaft", "sun2"].flatMap((sun) =>
    ["planetTop", "planetBottom"].map((planet) => ({
      check: "interference",
      parts: [sun, planet],
      reason: "簡化齒形:傘齒輪的齒是正齒輪的齒形沿軸往錐頂等比收窄(不是球面齒形),咬合處的齒側互相擦到最深 0.15(齒頂高 0.12 的齒);每個狀態 96 個取樣裡約三分之二(66 個)擦到,其餘姿勢齒剛好錯開,和行星齒輪的起始相位無關",
    })),
  ),
};
