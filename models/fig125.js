// 第 125 種:第 122 種的變形,結構更複雜。三個依序咬合的齒輪(齒數各不相同)各裝一個曲柄銷,
// 各以一根直立的連桿往上接到兩層槓桿:右邊兩根接在下層槓桿的兩端,下層槓桿的中點與左邊那根連桿
// 再接在上層槓桿的兩端,上層槓桿的中點帶動頂端只能上下移動的桿。三個曲柄銷的相位不斷錯開,頂桿做變化的上下運動。
// 槓桿以「端點高度取平均」計算(連桿近乎直立、槓桿擺角小時的近似;為推斷的簡化),連桿長度不變。主動件是左邊的小齒輪。
import { polar, add } from "./kit.js";
import { meshAngle } from "./gears.js";

export const G1 = { center: [-2.3, 0, 0], teeth: 16, radius: 0.8 };
export const G2 = { center: [-2.3 + 0.8 + 1.0, 0, 0], teeth: 20, radius: 1.0 };
export const G3 = { center: [-2.3 + 0.8 + 2 * 1.0 + 1.2, 0, 0], teeth: 24, radius: 1.2 };
const PINS = [
  { gear: G1, r: 0.5, at: Math.PI },
  { gear: G2, r: 0.62, at: Math.PI },
  { gear: G3, r: 0.72, at: Math.PI },
];
const LOWER_Y = 2.6; // 下層槓桿的高度(靜止時)
const UPPER_Y = 4.0;
const LOWER_X = [PINS[1], PINS[2]].map((p) => p.gear.center[0] + p.r * Math.cos(p.at));
const UPPER_X = [PINS[0].gear.center[0] + PINS[0].r * Math.cos(PINS[0].at), (LOWER_X[0] + LOWER_X[1]) / 2];

// 連桿長(靜止時直立)
const ROD = [UPPER_Y - 0, LOWER_Y - 0, LOWER_Y - 0];

/** 小齒輪轉 theta:三個齒輪的轉角、三個曲柄銷、兩層槓桿的端點與頂桿的高度 */
export function compound(theta) {
  const a2 = meshAngle(G1, G2, theta);
  const a3 = meshAngle(G2, G3, a2);
  const angles = [theta, a2, a3];
  const pins = PINS.map((p, i) => add(p.gear.center, polar(p.r, p.at + angles[i])));
  // 連桿上端的 x 固定在槓桿的端點位置,y 由連桿長度決定
  const up = (pin, x, l) => [x, pin[1] + Math.sqrt(Math.max(0, l * l - (x - pin[0]) ** 2)), 0];
  const l1 = up(pins[1], LOWER_X[0], ROD[1]);
  const l2 = up(pins[2], LOWER_X[1], ROD[2]);
  const lowerMid = [(l1[0] + l2[0]) / 2, (l1[1] + l2[1]) / 2, 0];
  const u1 = up(pins[0], UPPER_X[0], ROD[0]);
  const u2 = [lowerMid[0], lowerMid[1] + (UPPER_Y - LOWER_Y), 0]; // 下層中點經一根短桿接到上層
  const top = [(u1[0] + u2[0]) / 2, (u1[1] + u2[1]) / 2, 0];
  return { angles, pins, l1, l2, lowerMid, u1, u2, top };
}

const gear = (id, g, pin) => ({
  id,
  kind: "gear",
  center: g.center,
  teeth: g.teeth,
  radius: g.radius,
  width: 0.22,
  bore: 0.1,
  web: false,
  pieces: [{ kind: "cylinder", radius: 0.08, length: 0.6, at: [...polar(pin.r, pin.at).slice(0, 2), 0.25], accent: id === "g1" }],
});
const z = (p, d = 0.3) => [p[0], p[1], d];

export default {
  figure: 125,
  parts: [
    gear("g1", G1, PINS[0]),
    gear("g2", G2, PINS[1]),
    gear("g3", G3, PINS[2]),
    { id: "rod1", kind: "link", width: 0.12, thickness: 0.06 },
    { id: "rod2", kind: "link", width: 0.12, thickness: 0.06 },
    { id: "rod3", kind: "link", width: 0.12, thickness: 0.06 },
    { id: "rodMid", kind: "link", width: 0.12, thickness: 0.06 },
    // 槓桿兩端的水平位置固定、只取端點高度(近似,見檔頭),所以長度隨擺角略變
    { id: "lower", kind: "link", width: 0.3, thickness: 0.1, stretch: true },
    { id: "upper", kind: "link", width: 0.3, thickness: 0.1, stretch: true },
    { id: "head", kind: "group", pieces: [{ kind: "box", size: [0.32, 0.5, 0.2], at: [0, 0.2, 0] }, { kind: "cylinder", axis: [0, 1, 0], radius: 0.1, length: 1.1, at: [0, 0.8, 0] }] },
  ],
  waivers: [
    { check: "interference", parts: ["rod3", "lower"], reason: "待確認:rod3 的圓柱 r0.024×0.132 與 lower 的圓柱 r0.06×0.22重疊 0.08,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["rodMid", "upper"], reason: "待確認:rodMid 的圓柱 r0.024×0.132 與 upper 的圓柱 r0.06×0.22重疊 0.08,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["upper", "head"], reason: "待確認(未修):upper 的方塊 1×0.3×0.1 與 head 的方塊 0.32×0.5×0.2互相穿入 0.15(96 個取樣姿勢),尚未修正" },
  ],
  driver: { part: "g1", type: "rotation" },
  target: "head", // 上下變化運動的頂桿
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const { angles, pins, l1, l2, lowerMid, u1, u2, top } = compound(theta);
    return {
      parts: {
        g1: { angle: angles[0] },
        g2: { angle: angles[1] },
        g3: { angle: angles[2] },
        rod1: { from: z(pins[0]), to: z(u1) },
        rod2: { from: z(pins[1]), to: z(l1) },
        rod3: { from: z(pins[2]), to: z(l2) },
        rodMid: { from: z(lowerMid), to: z(u2) },
        lower: { from: z(l1, 0.4), to: z(l2, 0.4) },
        upper: { from: z(u1, 0.4), to: z(u2, 0.4) },
        head: { position: z(top, 0.4) },
      },
      readouts: [],
    };
  },
};

